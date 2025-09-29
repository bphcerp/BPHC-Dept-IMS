import { pgTable, primaryKey, text, boolean, pgEnum, integer, numeric, index } from "drizzle-orm/pg-core";
import { publicationsSchemas } from "lib"

export const monthEnum = pgEnum("monthEnum", publicationsSchemas.months); 

export const publicationsTable = pgTable("publications", {
    title: text("title").notNull(),
    type: text("type"),
    journal: text("journal"),
    volume: text("volume"),
    issue: text("issue"),
    month: monthEnum("month"),
    year: text("year").notNull(),
    link: text("link"),
    citations: text("citations"),
    citationId: text("citation_id").primaryKey(),
    authorNames: text("author_names").notNull(),
});

export const researgencePublications = pgTable("researgence", {
  pubId: integer("pub_id").primaryKey(),
  authors: text("authors").notNull(),
  homeAuthors: text("home_authors"),
  homeAuthorDepartment: text("home_author_department"),
  homeAuthorInstitute: text("home_author_institute"),
  publicationTitle: text("publication_title").notNull(),
  scs: integer("scs"),
  wos: integer("wos"),
  sci: text("sci"),
  sourcePublication: text("source_publication"),
  level: text("level"),
  type: text("article_type"),
  year: integer("year").notNull(),
  month: monthEnum("month"),
  homeAuthorLocation: text("home_author_location"),
  volNo: text("vol_no"),
  issNo: text("iss_no"),
  bPage: text("b_page"),
  ePage: text("e_page"),
  snip: numeric("snip"),
  sjr: numeric("sjr"),
  impactFactor: numeric("if"),
  citeScore: numeric("cite_score"),
  qRankScs: text("q_rank_scs"),
  qRankWos: text("q_rank_wos"),
  pIssn: text("p_issn"),
  eIssn: text("e_issn"),
  pIsbn: text("p_isbn"),
  eIsbn: text("e_isbn"),
  link: text("link"),
}, (table) => [index("title_idx").on(table.publicationTitle)]);

export const authorPublicationsTable = pgTable(
    "author_publications",
    {
        authorId: text("author_id").notNull(),
        citationId: text("citation_id").notNull(),
        authorName: text("author_name"),
        status: boolean("status"),
        comments: text("comments")
    },
    (table) => [primaryKey({ columns: [table.authorId, table.citationId] })]
);
