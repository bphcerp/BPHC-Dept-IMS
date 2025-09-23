import db from "@/config/db/index.ts";
import {
    authorPublicationsTable,
    publicationsTable,
    researgencePublications,
} from "@/config/db/schema/publications.ts";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { type analyticsSchemas, publicationsSchemas } from "lib";
import { faculty } from "@/config/db/schema/admin.ts";
type ReseargencePublication = typeof researgencePublications.$inferSelect;
type Publication = typeof publicationsTable.$inferSelect;

function monthNameToIndexSafe(
    monthName: string | null | undefined
): number | null {
    if (!monthName) return null;
    const idx = publicationsSchemas.months.indexOf(
        monthName as (typeof publicationsSchemas.months)[number]
    );
    return idx === -1 ? null : idx + 1; // 1..12 or null
}

/**
 * Returns true if (year, month) falls within inclusive start..end range.
 * month: 1..12 or null. If month is null, function treats it as:
 *  - for monthly checks: NOT WITHIN range (we skip null months for monthly grouping)
 *  - for yearly checks: uses only year comparison.
 */
function isWithinRangeInclusive(
    pubYear: number,
    pubMonth: number | null,
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
) {
    // If publication year out of bounds -> false quickly
    if (pubYear < startYear || pubYear > endYear) return false;

    // If startYear == endYear, require month between startMonth..endMonth (pubMonth must be non-null)
    if (startYear === endYear) {
        if (pubMonth === null) return false;
        return pubMonth >= startMonth && pubMonth <= endMonth;
    }

    // If pubYear == startYear -> pubMonth >= startMonth
    if (pubYear === startYear) {
        if (pubMonth === null) return false;
        return pubMonth >= startMonth;
    }

    // If pubYear == endYear -> pubMonth <= endMonth
    if (pubYear === endYear) {
        if (pubMonth === null) return false;
        return pubMonth <= endMonth;
    }

    // Intermediate year -> accept any month (month may be null OR non-null).
    return true;
}

/**
 * Generate periods inclusive of start..end.
 * monthly: returns YYYY-MM (month padded), yearly: YYYY
 */
export function generateTimePeriods(
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    grouping: analyticsSchemas.TimeGrouping
): Array<{ period: string; year: number; month: number | null }> {
    const periods: Array<{
        period: string;
        year: number;
        month: number | null;
    }> = [];

    if (grouping === "yearly") {
        for (let year = startYear; year <= endYear; year++) {
            periods.push({ period: `${year}`, year, month: null });
        }
        return periods;
    }

    // monthly
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
        periods.push({
            period: `${y}-${String(m).padStart(2, "0")}`,
            year: y,
            month: m,
        });
        m++;
        if (m > 12) {
            m = 1;
            y++;
        }
    }
    return periods;
}

/**
 * Query validated (researgence) publications joined with publications table and author_publications.
 * Filters by authorIds and researgence.year between startYear and endYear.
 *
 * NOTE: We intentionally do month-range filtering in JS (post-query) to avoid fragile SQL conversions
 * from string months to numbers and to correctly handle month-null cases.
 */
export async function getValidatedPublications(
    authorIds: string[],
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number
) {
    // Query researgence rows joining publications and author_publications; filter by year range and authorIds.
    // We avoid month SQL filtering here; we'll filter months in JS using a robust helper above.
    const rows = await db
        .select({
            researgence: researgencePublications,
            publication: publicationsTable,
            authorId: authorPublicationsTable.authorId,
        })
        .from(researgencePublications)
        .innerJoin(
            publicationsTable,
            eq(
                researgencePublications.publicationTitle,
                publicationsTable.title
            )
        )
        .innerJoin(
            authorPublicationsTable,
            eq(authorPublicationsTable.citationId, publicationsTable.citationId)
        )
        .where(
            and(
                inArray(authorPublicationsTable.authorId, authorIds),
                gte(researgencePublications.year, startYear),
                lte(researgencePublications.year, endYear)
            )
        );

    // Deduplicate by citationId to ensure each publication counted once.
    const dedup = new Map<
        string,
        { researgence: ReseargencePublication; publication: Publication }
    >();
    for (const r of rows) {
        const citationId = r.publication?.citationId;
        if (!citationId) continue;
        if (!dedup.has(citationId)) {
            dedup.set(citationId, {
                researgence: r.researgence,
                publication: r.publication,
            });
        }
        // else: already present -> skip duplicates produced by multiple author rows
    }

    // Convert map to array and filter by exact months range in JS.
    const publications = Array.from(dedup.values()).filter(
        ({ researgence }) => {
            const pubYear = researgence.year;
            const pubMonth = monthNameToIndexSafe(researgence.month ?? null); // number | null
            // keep only rows where (year,month) satisfies inclusive start..end
            return isWithinRangeInclusive(
                pubYear,
                pubMonth,
                startYear,
                startMonth,
                endYear,
                endMonth
            );
        }
    );

    return publications;
}

/**
 * Calculate aggregated time-series for provided publications.
 * valueExtractor returns number to be aggregated (e.g., 1 for counts, citations value for citations).
 *
 * For monthly grouping: publications with null month are SKIPPED (they cannot be placed into a month bucket).
 * For yearly grouping: month is ignored and publication is aggregated by year.
 */
export function calculateTimeSeries(
    publications: Array<{
        researgence: ReseargencePublication;
        publication: Publication;
    }>,
    periods: Array<{ period: string; year: number; month: number | null }>,
    grouping: analyticsSchemas.TimeGrouping,
    valueExtractor: (pub: {
        researgence: ReseargencePublication;
        publication: Publication;
    }) => number
): analyticsSchemas.TimeSeriesData[] {
    const dataMap = new Map<string, number>();

    // Initialize all periods to 0
    for (const p of periods) dataMap.set(p.period, 0);

    for (const { researgence, publication } of publications) {
        const pubYear = researgence.year;
        const pubMonth = monthNameToIndexSafe(researgence.month ?? null); // 1..12 or null

        // For monthly grouping, skip publications with unknown month
        if (grouping === "monthly" && pubMonth === null) continue;

        const periodKey =
            grouping === "yearly"
                ? `${pubYear}`
                : `${pubYear}-${String(pubMonth).padStart(2, "0")}`;

        if (!dataMap.has(periodKey)) {
            // Publication falls outside the requested period set (e.g., month missing or not in the requested range)
            continue;
        }

        const current = dataMap.get(periodKey) ?? 0;
        dataMap.set(
            periodKey,
            current + valueExtractor({ researgence, publication })
        );
    }

    // Build ordered time series with cumulative sums
    const series: analyticsSchemas.TimeSeriesData[] = [];
    let cumulative = 0;
    for (const p of periods) {
        const total = dataMap.get(p.period) ?? 0;
        cumulative += total;
        series.push({
            period: p.period,
            year: p.year,
            month: p.month,
            total,
            cumulative,
        });
    }

    return series;
}

/**
 * Count publications by researgence.type (fallback "Unknown")
 */
export function calculatePublicationTypeBreakdown(
    publications: Array<{
        researgence: ReseargencePublication;
        publication: Publication;
    }>
): analyticsSchemas.PublicationTypeCount[] {
    const typeCount = new Map<string, number>();
    for (const { researgence } of publications) {
        const t = researgence.type ?? "Unknown";
        typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
    }
    return Array.from(typeCount.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Calculate single-number metrics.
 *
 * Implementation notes:
 * - For performance on large datasets: this currently queries the DB for the *authorIds* and year-range agnostic (all-time) rows
 *   but only selects the fields we need (year, month, scs, wos). If dataset is huge, convert to SQL COUNT / AVG queries.
 *
 * - Definitions:
 *    totalPublicationsAllTime: count of deduped validated publications for given authorIds.
 *    totalPublicationsLastYear: count of those with researgence.year === currentYear - 1.
 *    totalPublicationsLastMonth: count for (currentYear, currentMonth-1) with month present.
 *    averageCitationsPerPaper: average of max(scs, wos) over deduped publications (0 if none).
 */
export async function calculateSingleMetrics(
    authorIds: string[]
): Promise<analyticsSchemas.SingleMetrics> {
    // Fetch validated rows joined with publications and author_publications for these authors (all years).
    const rows = await db
        .select({
            researgence: researgencePublications,
            publication: publicationsTable,
            authorId: authorPublicationsTable.authorId,
        })
        .from(researgencePublications)
        .innerJoin(
            publicationsTable,
            eq(
                researgencePublications.publicationTitle,
                publicationsTable.title
            )
        )
        .innerJoin(
            authorPublicationsTable,
            eq(authorPublicationsTable.citationId, publicationsTable.citationId)
        )
        .where(inArray(authorPublicationsTable.authorId, authorIds));

    // Deduplicate by citationId
    const dedup = new Map<
        string,
        { researgence: ReseargencePublication; publication: Publication }
    >();
    for (const r of rows) {
        const cid = r.publication?.citationId;
        if (!cid) continue;
        if (!dedup.has(cid)) {
            dedup.set(cid, {
                researgence: r.researgence,
                publication: r.publication,
            });
        }
    }
    const publications = Array.from(dedup.values());

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1..12

    const totalPublicationsAllTime = publications.length;

    // last year (calendar year = previous year)
    const totalPublicationsLastYear = publications.filter(
        (p) => p.researgence.year === currentYear - 1
    ).length;

    // last month: previous calendar month
    let targetYear = currentYear;
    let targetMonth = currentMonth - 1;
    if (targetMonth < 1) {
        targetMonth = 12;
        targetYear = currentYear - 1;
    }
    const totalPublicationsLastMonth = publications.filter((p) => {
        const pm = monthNameToIndexSafe(p.researgence.month ?? null);
        if (pm === null) return false; // skip unknown months for last-month stat
        return p.researgence.year === targetYear && pm === targetMonth;
    }).length;

    // average citations per paper: use max(scs,wos) as your rule
    const totalCitations = publications.reduce((acc, { researgence }) => {
        const scs = researgence.scs ?? 0;
        const wos = researgence.wos ?? 0;
        return acc + Math.max(scs, wos);
    }, 0);

    const averageCitationsPerPaper =
        totalPublicationsAllTime > 0
            ? Math.round((totalCitations / totalPublicationsAllTime) * 100) /
              100
            : 0;

    return {
        totalPublicationsAllTime,
        totalPublicationsLastYear,
        totalPublicationsLastMonth,
        averageCitationsPerPaper,
    };
}

/**
 * Calculate contributions (number of unique publications) per author,
 * respecting year and month range.
 */
export async function calculateAuthorContributions(
    authorIds: string[],
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number
): Promise<Array<{ authorId: string; name: string; count: number }>> {
    const rows = await db
        .select({
            researgence: researgencePublications,
            publication: publicationsTable,
            authorId: authorPublicationsTable.authorId,
            authorName: faculty.name,
        })
        .from(researgencePublications)
        .innerJoin(
            publicationsTable,
            eq(
                researgencePublications.publicationTitle,
                publicationsTable.title
            )
        )
        .innerJoin(
            authorPublicationsTable,
            eq(authorPublicationsTable.citationId, publicationsTable.citationId)
        )
        .innerJoin(
            faculty,
            eq(authorPublicationsTable.authorId, faculty.authorId)
        )
        .where(
            and(
                inArray(authorPublicationsTable.authorId, authorIds),
                gte(researgencePublications.year, startYear),
                lte(researgencePublications.year, endYear)
            )
        );

    // Deduplicate by publication + authorId, and filter by month range
    const seen = new Set<string>();
    const authorCounts = new Map<
        string,
        { authorId: string; name: string; count: number }
    >();

    for (const row of rows) {
        const citationId = row.publication?.citationId;
        if (!citationId) continue;

        // Determine month number
        const pubMonth = monthNameToIndexSafe(row.researgence.month ?? null);

        // Skip if outside requested start..end month/year range
        if (
            !isWithinRangeInclusive(
                row.researgence.year,
                pubMonth,
                startYear,
                startMonth,
                endYear,
                endMonth
            )
        ) {
            continue;
        }

        const key = `${citationId}-${row.authorId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const current = authorCounts.get(row.authorId) ?? {
            authorId: row.authorId,
            name: row.authorName ?? "",
            count: 0,
        };
        current.count += 1;
        authorCounts.set(row.authorId, current);
    }

    return Array.from(authorCounts.values()).sort((a, b) => b.count - a.count);
}
