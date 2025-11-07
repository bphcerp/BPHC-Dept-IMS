import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import * as PptxGenJSImport from "pptxgenjs";
const PptxGenJS = (PptxGenJSImport as any).default || PptxGenJSImport;
import { imageUpload } from "@/config/multer.ts";
import path from "path";
import { STATIC_DIR } from "@/config/environment.ts";
import logger from "@/config/logger.ts";
import { marked, type Token } from 'marked';

type PptxTextOptions = {
    bold?: boolean;
    italic?: boolean;
    strike?: boolean;
    fontFace?: string;
    fontSize?: number;
    color?: string;
    underline?: boolean;
    hyperlink?: { url: string; tooltip?: string };
};

type PptxTextObject = {
    text: string;
    options: PptxTextOptions;
};

function parseInlineTokens(
    tokens: Token[],
    currentOptions: PptxTextOptions = {}
): PptxTextObject[] {
    const pptxArray: PptxTextObject[] = [];

    function walk(tokens: Token[], options: PptxTextOptions) {
        for (const token of tokens) {
            switch (token.type) {
                // STYLES
                case 'strong':
                    token.tokens && walk(token.tokens, { ...options, bold: true });
                    break;
                case 'em':
                    token.tokens && walk(token.tokens, { ...options, italic: true });
                    break;
                case 'del':
                    token.tokens && walk(token.tokens, { ...options, strike: true });
                    break;

                case 'link':
                    token.tokens && walk(token.tokens, {
                        ...options,
                        color: '0000FF',
                        underline: true,
                        hyperlink: { url: token.href, tooltip: token.title || token.href }
                    });
                    break;

                case 'codespan':
                    pptxArray.push({
                        text: token.text,
                        options: {
                            ...options,
                            fontFace: 'Courier New',
                            color: 'C0504D'
                        }
                    });
                    break;

                case 'text':
                    pptxArray.push({ text: token.text, options });
                    break;

                case 'br':
                    pptxArray.push({ text: '\n', options: {} });
                    break;

                default:
                    if ('tokens' in token && token.tokens) {
                        walk(token.tokens, options);
                    } else if ('text' in token) {
                        pptxArray.push({ text: token.text, options });
                    }
            }
        }
    }

    // Start the walk
    walk(tokens, currentOptions);
    return pptxArray;
}


export function markdownToPptx(markdown: string): PptxTextObject[] {
    const tokens = marked.lexer(markdown);
    const pptxOutput: PptxTextObject[] = [];

    for (const token of tokens) {
        switch (token.type) {
            case 'heading':
                token.tokens && pptxOutput.push(...parseInlineTokens(token.tokens, {
                    bold: true,
                    fontSize: 32 - (token.depth * 2),
                }));
                pptxOutput.push({ text: '\n', options: { fontSize: 12 } });
                break;

            case 'paragraph':
                token.tokens && pptxOutput.push(...parseInlineTokens(token.tokens, {}));
                pptxOutput.push({ text: '\n', options: {} });
                break;

            // BLOCKQUOTE
            case 'blockquote':
                token.tokens && pptxOutput.push(...parseInlineTokens(token.tokens, {
                    italic: true,
                    color: '595959'
                }));
                pptxOutput.push({ text: '\n', options: {} });
                break;

            case 'code':
                pptxOutput.push({
                    text: token.text,
                    options: {
                        fontFace: 'Courier New',
                        fontSize: 10,
                        color: '333333',
                    }
                });
                pptxOutput.push({ text: '\n', options: {} });
                break;

            case 'list':
                for (const item of token.items) {
                    const prefix = token.ordered ? `${item.task ? '[ ]' : ''}1. ` : '• ';
                    pptxOutput.push({ text: prefix, options: { bold: true } });

                    pptxOutput.push(...parseInlineTokens(item.tokens, {}));
                    pptxOutput.push({ text: '\n', options: {} });
                }
                break;

            case 'hr':
                pptxOutput.push({
                    text: '______________________________\n',
                    options: { color: 'C0C0C0', bold: true }
                });
                break;

            case 'space':
                pptxOutput.push({ text: '\n', options: {} });
                break;
        }
    }

    return pptxOutput;
}
const router = express.Router();

router.post(
    "/",
    checkAccess(),
    imageUpload.fields([{ name: "images" }]),
    asyncHandler(async (req, res) => {
        try {
            const files = req.files as {
                [fieldname: string]: Express.Multer.File[];
            };
            const metadata = JSON.parse(req.body.metadata || "[]");
            const {
                totalSlides,
                slideData,
            }: {
                totalSlides: number;
                slideData: {
                    title: string;
                    sections: { title: string; text?: string }[];
                }[];
            } = JSON.parse(req.body.slides || []);
            const slides: any[] = [];
            const { title } = req.query;
            logger.info("parsed title");

            if (!files || !files.images || files.images.length === 0) {
                res.status(400).json({ message: "No 'image' files provided" });
                return;
            }

            const pptx = new PptxGenJS();

            const titleSlide = pptx.addSlide();
            titleSlide.addImage({
                path: path.join(STATIC_DIR, "analytics", "TitleBG.jpg"),
                x: 0,
                y: 0,
                w: "100%",
                h: "100%",
            });
            titleSlide.addImage({
                path: path.join(STATIC_DIR, "analytics", "Logo.png"),
                x: 0,
                y: 3.492,
                w: 7.822,
                h: 1.72,
            });
            titleSlide.addText(title, {
                x: 1.5,
                y: 3.492,
                w: 6.322,
                h: 1.72,
                align: "center",
                color: "FFFFFF",
                fontSize: 48,
            });

            files.images.forEach((file, i) => {
                const meta = metadata[i];
                while (meta.slideIndex >= slides.length) {
                    slides.push(pptx.addSlide());
                    slides[slides.length - 1].addImage({
                        path: path.join(STATIC_DIR, "analytics", "SlideBG.png"),
                        x: 0,
                        y: 0,
                        w: "100%",
                        h: "100%",
                    });
                }
                const imageBase64 = file.buffer.toString("base64");
                const totalSections = meta.totalSections;
                slides[meta.slideIndex].addImage({
                    data: `data:${file.mimetype};base64,${imageBase64}`,
                    x: !(totalSections % 2)
                        ? meta.graphIndex % 2
                            ? 5
                            : 1
                        : totalSections == 1
                          ? 1
                          : 1 + (8 / 3) * meta.graphIndex,
                    y: !(totalSections % 2)
                        ? meta.graphIndex > 1
                            ? 3.2
                            : totalSections == 2
                              ? 2.2
                              : 1.2
                        : totalSections == 1
                          ? 1.2
                          : 2.533,
                    w: !(totalSections % 2)
                        ? 4
                        : totalSections == 1
                          ? 8
                          : 8 / 3,
                    h: !(totalSections % 2)
                        ? 2
                        : totalSections == 1
                          ? 4
                          : 4 / 3,
                });
            });

            slideData.forEach((slide, si) => {
                slides[si].addText(slide.title, {
                    x: 0.1,
                    y: 0.1,
                    w: "100%",
                    h: 1,
                    fontSize: 42,
                });
                slide.sections.forEach((section, seci) => {
                    const totalSections = slide.sections.length;
                    if (section.text) {
                        slides[si].addText( markdownToPptx(section.text), {
                            x: !(totalSections % 2)
                                ? seci % 2
                                    ? 5
                                    : 1
                                : totalSections == 1
                                  ? 1
                                  : 1 + (8 / 3) * seci,
                            y: !(totalSections % 2)
                                ? seci > 1
                                    ? 3.2
                                    : totalSections == 2
                                      ? 2.2
                                      : 1.2
                                : totalSections == 1
                                  ? 1.2
                                  : 2.533,
                            w: !(totalSections % 2)
                                ? 4
                                : totalSections == 1
                                  ? 8
                                  : 8 / 3,
                            h: !(totalSections % 2)
                                ? 2
                                : totalSections == 1
                                  ? 4
                                  : 4 / 3,
                            fontSize: 8,
                            align: 'left',
                            valign: 'top'
                        });
                    }
                    slides[si].addText(section.title, {
                        x: !(totalSections % 2)
                            ? seci % 2
                                ? 5
                                : 1
                            : totalSections == 1
                              ? 1
                              : 1 + (8 / 3) * seci,
                        y: !(totalSections % 2)
                            ? seci > 1
                                ? 5.1
                                : totalSections == 2
                                  ? 2
                                  : 1.2
                            : totalSections == 1
                              ? 1.0
                              : 2.333,
                        w: !(totalSections % 2)
                            ? 4
                            : totalSections == 1
                              ? 8
                              : 8 / 3,
                        h: 0.2,
                        fontSize: 12,
                        bold: true
                    });
                });
            });

            const buffer = await pptx.write({ outputType: "nodebuffer" });

            res.setHeader(
                "Content-Disposition",
                'attachment; filename="presentation.pptx"'
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            );
            logger.info("sent buffer of size", buffer.length);
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).send("Failed to create presentation");
        }
    })
);

// router.patch(
//     "/templates/update/:id",
//     asyncHandler(async (req, res) => {
//         const email = req.user?.email;
//         const { id } = req.params;

//         if (!email)
//             throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

//         const template = analyticsSchemas.presentationTemplateSchema.parse(
//             req.body
//         );

//         await db
//             .update(presentationTemplates)
//             .set({
//                 title: template.title,
//                 slides: template.slides,
//                 facultyEmail: email,
//             })
//             .where(
//                 and(
//                     eq(presentationTemplates.id, id),
//                     eq(presentationTemplates.facultyEmail, email)
//                 )
//             )
//             .returning();

//         await db.delete(graphs).where(eq(graphs.templateId, id));
//         for (const graph of template.graphs) {
//             await db.insert(graphs).values({
//                 templateId: id,
//                 ...graph,
//             });
//         }
//         res.status(200).json({ message: "Successfully updated template." });
//     })
// );

// router.get(
//     "/templates/:id",
//     asyncHandler(async (req, res) => {
//         const email = req.user?.email;
//         const { id } = req.params;

//         if (!email)
//             throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

//         const templates = await db.query.presentationTemplates.findMany({
//             with: {
//                 graphs: true,
//             },
//             where: (presentationTemplates, { eq }) =>
//                 and(
//                     eq(presentationTemplates.id, id),
//                     eq(presentationTemplates.facultyEmail, email)
//                 ),
//         });

//         if (!templates.length)
//             throw new HttpError(
//                 HttpCode.NOT_FOUND,
//                 "No template found with that id"
//             );

//         const formattedTemplate: analyticsSchemas.Template = templates.map(
//             ({ graphs, id, facultyEmail, ...rest }) => {
//                 return {
//                     ...rest,
//                     graphs: graphs.map((graph) => {
//                         const { id: gid, templateId, ...remaining } = graph;
//                         return remaining;
//                     }),
//                 };
//             }
//         )[0];

//         res.status(200).json(formattedTemplate);
//     })
// );

// router.delete(
//     "/templates/delete/:id",
//     asyncHandler(async (req, res) => {
//         const email = req.user?.email;
//         const { id } = req.params;

//         if (!email)
//             throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

//         await db
//             .delete(presentationTemplates)
//             .where(
//                 and(
//                     eq(presentationTemplates.id, id),
//                     eq(presentationTemplates.facultyEmail, email)
//                 )
//             );

//         res.status(200).json({ message: "Successfully Deleted Template" });
//     })
// );

// router.get(
//     "/templates",
//     asyncHandler(async (req, res) => {
//         const email = req.user?.email;

//         if (!email)
//             throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

//         const templates = await db
//             .select({
//                 id: presentationTemplates.id,
//                 title: presentationTemplates.title,
//                 slides: presentationTemplates.slides,
//             })
//             .from(presentationTemplates)
//             .where(eq(presentationTemplates.facultyEmail, email));

//         res.status(200).json(templates);
//     })
// );

// router.post(
//     "/templates/create",
//     asyncHandler(async (req, res) => {
//         const email = req.user?.email;

//         if (!email)
//             throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

//         const template = analyticsSchemas.presentationTemplateSchema.parse(
//             req.body
//         );

//         const { id: insertedId } = (
//             await db
//                 .insert(presentationTemplates)
//                 .values({
//                     title: template.title,
//                     slides: template.slides,
//                     facultyEmail: email,
//                 })
//                 .returning()
//         )[0];

//         for (const graph of template.graphs) {
//             await db.insert(graphs).values({
//                 templateId: insertedId,
//                 ...graph,
//             });
//         }
//         res.status(200).json({
//             message: "Successfully created template.",
//             id: insertedId,
//         });
//     })
// );

export default router;
