/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import fs from "fs";
import {
    publicationsTable,
    authorPublicationsTable,
    researgencePublications,
} from "@/config/db/schema/publications.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import db from "@/config/db/index.ts";
import { and, eq, sql } from "drizzle-orm";
import { createNotifications } from "@/lib/todos/index.ts";
import environment from "@/config/environment.ts";

const API_KEY = environment.SERP_API_KEY;
const logs: {
    publication: typeof publicationsTable.$inferInsert;
    authorPublications: (typeof authorPublicationsTable.$inferInsert)[];
}[] = [];

const ENABLE_LOG_FILES = false;
const ENABLE_LOG_CONSOLE = true;

const parsePublicationDetails = (publicationText: string | null) => {
    if (!publicationText)
        return {
            type: "Unknown",
            journal: null,
            volume: null,
            issue: null,
            year: null,
        };

    const pubRegex = /^(.+) (\d+)\s*\((\d+)\),\s*(?:([\d\-]+),\s*)?(\d{4})$/;
    const pubMatch = pubRegex.exec(publicationText);

    if (pubMatch) {
        return {
            type: "Publication",
            journal: pubMatch[1],
            volume: pubMatch[2],
            issue: pubMatch[3],
            year: pubMatch[5],
        };
    } else {
        return {
            type: "Publication",
            journal: publicationText,
            volume: null,
            issue: null,
            year: null,
        };
    }
};

const getPublicationsFromAuthor = async (
    author_id: string,
    author_name: string
) => {
    console.log(
        `\n--- Fetching publications for author: ${author_name} (${author_id}) ---`
    );

    const url = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${author_id}&num=${100}&api_key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const json: any = await response.json();

        if (json.error) {
            console.error("Error:", json.error);
            return;
        }

        const publications = json.articles;
        if (!publications || publications.length === 0) {
            console.log("No more publications found.");
            return;
        }

        let count = 1;
        let newPublications = 0;
        const total = publications.length;
        for (const pub of publications) {
            if (ENABLE_LOG_CONSOLE)
                console.log(`Processing publication: ${pub.title}`);
            const pubDetails = parsePublicationDetails(pub.publication ?? "");

            const publication = {
                title: pub.title ?? null,
                type: pubDetails.type || null,
                journal: pubDetails.journal ?? null,
                volume: pubDetails.volume ?? null,
                issue: pubDetails.issue ?? null,
                month: pub.month,
                year: pub.year ?? null,
                link: pub.link,
                citations: pub.cited_by?.value
                    ? pub.cited_by?.value.toString()
                    : "0",
                citationId: pub.cited_by?.cites_id,
                authorNames: pub.authors ?? null, // Store as text, not array
            };

            const authorPublication = {
                authorId: author_id,
                citationId: pub.cited_by?.cites_id,
                authorName: author_name,
            };

            logs.push({
                publication,
                authorPublications: [authorPublication],
            });

            try {
                // Check if publication already exists
                const [existingPub] = await db
                    .select()
                    .from(publicationsTable)
                    .where(
                        eq(publicationsTable.citationId, publication.citationId)
                    );

                if (!existingPub) {
                    // Publication doesn't exist, insert it and update with researgence data

                    const [inReseargence] = await db
                    .select()
                    .from(researgencePublications)
                    .where(
                        eq( sql`lower(${publication.title})`, sql`lower(${researgencePublications.publicationTitle})`)
                    );

                    if(inReseargence) {
                        Object.assign(publication, {
                            type: inReseargence.type,
                            journal: inReseargence.sourcePublication,
                            volume: inReseargence.volNo,
                            issue: inReseargence.issNo,
                            month: inReseargence.month,
                            year: inReseargence.year.toString(),
                            link: inReseargence.link,
                            authorNames: inReseargence.authors,
                        })
                    }
                    await db.insert(publicationsTable).values(publication);
                    newPublications++;
                    if (ENABLE_LOG_CONSOLE)
                        console.log(
                            `[${count} of ${total}] Inserted publication: ${publication.title}`
                        );
                } else {
                    // Publication exists, only update if citation count changed
                    const currentCitations = existingPub.citations;
                    if (currentCitations !== publication.citations) {
                        await db
                            .update(publicationsTable)
                            .set({
                                citations: publication.citations,
                            })
                            .where(
                                eq(
                                    publicationsTable.citationId,
                                    publication.citationId
                                )
                            );
                        if (ENABLE_LOG_CONSOLE)
                            console.log(
                                `[${count} of ${total}] Updated citation count for: ${publication.title} (${currentCitations} → ${publication.citations})`
                            );
                    } else {
                        if (ENABLE_LOG_CONSOLE)
                            console.log(
                                `[${count} of ${total}] Publication exists (no updates needed): ${publication.title}`
                            );
                    }
                }

                // Handle the cross-reference table entry
                const existingLink = await db
                    .select()
                    .from(authorPublicationsTable)
                    .where(
                        and(
                            eq(authorPublicationsTable.authorId, author_id),
                            eq(
                                authorPublicationsTable.citationId,
                                publication.citationId
                            )
                        )
                    );

                if (existingLink.length === 0) {
                    // Cross-reference doesn't exist, insert it
                    await db
                        .insert(authorPublicationsTable)
                        .values(authorPublication);
                    if (ENABLE_LOG_CONSOLE)
                        console.log(
                            `Linked author ${author_name} to publication ${publication.title}`
                        );
                } else {
                    if (ENABLE_LOG_CONSOLE)
                        console.log(
                            `Author ${author_name} already linked to publication ${publication.title}`
                        );
                }
            } catch (err: any) {
                if (ENABLE_LOG_CONSOLE)
                    console.error(
                        `[${count} of ${total}] Error processing publication ${publication.title}: ${err}`
                    );
            }
            count++;
        }
        if (newPublications > 0) {
            const emailId = await db
                .select({
                    email: faculty.email,
                })
                .from(faculty)
                .where(eq(faculty.authorId, author_id));

            if (emailId[0]?.email) {
                await createNotifications([
                    {
                        module: "Publications",
                        title: `New publications added`,
                        content: `${newPublications} new publications have been added to your profile.`,
                        userEmail: emailId[0]?.email,
                    },
                ]);
            }
        }
    } catch (error: any) {
        console.error("Error fetching data:", error.message);
        return;
    }
};

export async function runPublicationSync() {
    const users = await db.select().from(faculty);
    let count = 1;
    const total = users.length;
    for (const user of users) {
        if (!user.authorId) continue;
        await getPublicationsFromAuthor(user.authorId, user.name!);
        console.log(
            `\nProcessed ${count} of ${total} authors: ${user.name} (${user.authorId})`
        );
        count++;
    }

    if (!fs.existsSync("logs")) {
        fs.mkdirSync("logs", { recursive: true });
    }

    if (ENABLE_LOG_FILES) {
        fs.writeFileSync(
            "logs/db_insert_publications.json",
            JSON.stringify(logs, null, 2)
        );
    }

    console.log("\n✅ All publications processed and logged.");
}
