import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { analyticsSchemas } from "lib";
import db from "@/config/db/index.ts";
import {
    presentationTemplates,
    presentationSlides,
    graphs,
    textBoxes,
} from "@/config/db/schema/analytics.ts";
import { and, eq } from "drizzle-orm";
const router = express.Router();

router.patch(
    "/update/:id",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;
        const { id } = req.params;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        const template = analyticsSchemas.presentationTemplateSchema.parse(
            req.body
        );

        await db
            .update(presentationTemplates)
            .set({
                title: template.title,
            })
            .where(
                and(
                    eq(presentationTemplates.id, id),
                    eq(presentationTemplates.facultyEmail, email)
                )
            );

        await db
            .delete(presentationSlides)
            .where(eq(presentationSlides.templateId, id));

        for (const slide of template.slides) {
            const { id: sid } = (
                await db
                    .insert(presentationSlides)
                    .values({
                        title: slide.title,
                        templateId: id,
                    })
                    .returning()
            )[0];

            for (const section of slide.sections) {
                if (section.type == "graph") {
                    await db.insert(graphs).values({
                        slideId: sid,
                        title: section.title,
                        ...section.graph,
                    });
                } else {
                    await db.insert(textBoxes).values({
                        slideId: sid,
                        title: section.title,
                        ...section.text,
                    });
                }
            }
        }
        res.status(200).json({ message: "Successfully updated template." });
    })
);

router.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;
        const { id } = req.params;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        // Use findFirst to get a single object
        const template = await db.query.presentationTemplates.findFirst({
            with: {
                slides: {
                    with: {
                        graphs: true,
                        textBoxes: true,
                    },
                },
            },
            where: (presentationTemplates, { eq }) =>
                and(
                    eq(presentationTemplates.id, id),
                    eq(presentationTemplates.facultyEmail, email)
                ),
        });

        // Check for the object directly
        if (!template)
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No template found with that id"
            );

        // Destructure the parts from the single 'template' object
        const { slides, id: templateId, facultyEmail, ...rest } = template;

        // No more .map() or [0] needed
        const formattedTemplate: analyticsSchemas.Template = {
            ...rest,
            slides: [
                ...slides.map((slide) => {
                    return {
                        title: slide.title,
                        sections: [
                            ...slide.graphs.map((graph) => {
                                const {
                                    id,
                                    slideId,
                                    title,
                                    ...remaining
                                } = graph;
                                return {
                                    type: "graph" as const,
                                    title: title,
                                    graph: remaining,
                                    text: { body: "" },
                                };
                            }),
                            ...slide.textBoxes.map((textBox) => {
                                const {
                                    id,
                                    slideId,
                                    title,
                                    ...remaining
                                } = textBox;
                                return {
                                    type: "text" as const,
                                    title: title,
                                    text: remaining,
                                    graph: {
                                        yAxis: null,
                                        graphType: null,
                                        dataType: "total" as const,
                                        metricType: "both" as const,
                                    },
                                };
                            }),
                        ],
                    };
                }),
            ],
        };

        res.status(200).json(formattedTemplate);
    })
);

router.delete(
    "/delete/:id",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;
        const { id } = req.params;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        await db
            .delete(presentationTemplates)
            .where(
                and(
                    eq(presentationTemplates.id, id),
                    eq(presentationTemplates.facultyEmail, email)
                )
            );

        res.status(200).json({ message: "Successfully Deleted Template" });
    })
);

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const email = req.user?.email;

        if (!email)
            throw new HttpError(HttpCode.BAD_REQUEST, "No email provided");

        const templates = await db
            .select({
                id: presentationTemplates.id,
                title: presentationTemplates.title
            })
            .from(presentationTemplates)
            .where(eq(presentationTemplates.facultyEmail, email));

        res.status(200).json(templates);
    })
);

router.post(
    "/create",
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
                    facultyEmail: email,
                })
                .returning()
        )[0];

        for (const slide of template.slides) {
            const { id: sid } = (
                await db
                    .insert(presentationSlides)
                    .values({
                        title: slide.title,
                        templateId: insertedId,
                    })
                    .returning()
            )[0];

            for (const section of slide.sections) {
                if (section.type == "graph") {
                    await db.insert(graphs).values({
                        slideId: sid,
                        title: section.title,
                        ...section.graph,
                    });
                } else {
                    await db.insert(textBoxes).values({
                        slideId: sid,
                        title: section.title,
                        ...section.text,
                    });
                }
            }
        }
        res.status(200).json({
            message: "Successfully created template.",
            id: insertedId,
        });
    })
);

export default router;
