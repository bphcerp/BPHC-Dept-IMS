import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import * as PptxGenJSImport from "pptxgenjs";
const PptxGenJS = (PptxGenJSImport as any).default || PptxGenJSImport;
import { imageUpload } from "@/config/multer.ts";
import path from "path";
import { STATIC_DIR } from "@/config/environment.ts";
import logger from "@/config/logger.ts";
import { analyticsSchemas } from "lib";
import db from "@/config/db/index.ts";
import { graphs, presentationTemplates } from "@/config/db/schema/analytics.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { and, eq } from "drizzle-orm";

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
                const totalSlides = meta.totalSlides;
                slides[meta.slideIndex].addImage({
                    data: `data:${file.mimetype};base64,${imageBase64}`,
                    x: !(totalSlides % 2)
                        ? meta.graphIndex % 2
                            ? 5
                            : 1
                        : totalSlides == 1
                          ? 1
                          : 1 + (8 / 3) * meta.graphIndex,
                    y: !(totalSlides % 2)
                        ? meta.graphIndex > 1
                            ? 3.2
                            : totalSlides == 2
                              ? 2.2
                              : 1.2
                        : totalSlides == 1
                          ? 1.2
                          : 2.533,
                    w: !(totalSlides % 2) ? 4 : totalSlides == 1 ? 8 : 8 / 3,
                    h: !(totalSlides % 2) ? 2 : totalSlides == 1 ? 4 : 4 / 3,
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

router.patch(
    "/templates/update/:id",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;
        const {id} = req.params;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        const template = analyticsSchemas.presentationTemplateSchema.parse(
            req.body
        );

        await db
            .update(presentationTemplates)
            .set({
                title: template.title,
                slides: template.slides,
                facultyEmail: email,
            }).where(eq(presentationTemplates.id, id))
            .returning()

        await db.delete(graphs).where(eq(graphs.templateId, id));
        for (const graph of template.graphs) {
            await db.insert(graphs).values({
                templateId: id,
                ...graph,
            });
        }
        res.status(200).json({ message: "Successfully updated template." });
    })
);

router.get(
    "/templates/:id",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;
        const { id } = req.params;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        const templates = await db.query.presentationTemplates.findMany({
            with: {
                graphs: true,
            },
            where: (presentationTemplates, { eq }) =>
                and(eq(presentationTemplates.id, id),eq(presentationTemplates.facultyEmail, email)),
        });

        if (!templates.length)
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No template found with that id"
            );

        const formattedTemplate : analyticsSchemas.Template = templates.map(({ graphs, id, facultyEmail, ...rest }) => {
            return {
                ...rest,
                graphs: graphs.map((graph) => {
                    const { id: gid, templateId, ...remaining } = graph;
                    return remaining;
                }),
            };
        })[0];

        res.status(200).json(formattedTemplate);
    })
);

router.delete(
    "/templates/delete/:id",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;
        const { id } = req.params;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        await db.delete(presentationTemplates).where(and(eq(presentationTemplates.id, id),eq(presentationTemplates.facultyEmail, email)) )

        res.status(200).json({message: "Successfully Deleted Template"});
    })
);

router.get(
    "/templates",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        const templates = await db
            .select({
                id: presentationTemplates.id,
                title: presentationTemplates.title,
                slides: presentationTemplates.slides
            })
            .from(presentationTemplates)
            .where(eq(presentationTemplates.facultyEmail, email));

        res.status(200).json(templates);
    })
);

router.post(
    "/templates/create",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        const template = analyticsSchemas.presentationTemplateSchema.parse(
            req.body
        );

        const { id: insertedId } = (
            await db
                .insert(presentationTemplates)
                .values({
                    title: template.title,
                    slides: template.slides,
                    facultyEmail: email,
                })
                .returning()
        )[0];

        for (const graph of template.graphs) {
            await db.insert(graphs).values({
                templateId: insertedId,
                ...graph,
            });
        }
        res.status(200).json({ message: "Successfully created template.", id: insertedId });
    })
);


export default router;