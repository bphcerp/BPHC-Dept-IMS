import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import * as PptxGenJSImport from "pptxgenjs";
const PptxGenJS = (PptxGenJSImport as any).default || PptxGenJSImport;
import { imageUpload } from "@/config/multer.ts";
import path from 'path';
import { STATIC_DIR,  } from "@/config/environment.ts";
const router = express.Router();

router.post(
    "/",
    checkAccess(),
    imageUpload.fields([{ name: "image" }]),
    asyncHandler(async (req, res) => {
        try {
            const files = req.files as {
                [fieldname: string]: Express.Multer.File[];
            };
            const { title } = req.query;

            if (!files || !files.image || files.image.length === 0) {
                res.status(400).json({ message: "No 'image' files provided" });
                return;
            }

            const pptx = new PptxGenJS();

            const titleSlide = pptx.addSlide()
            titleSlide.addImage({
                path: path.join(STATIC_DIR, "analytics", "TitleBG.jpg"),
                x: 0,
                y: 0,
                w: "100%",
                h: "100%"
            })
            titleSlide.addImage({
                path: path.join(STATIC_DIR, "analytics", "Logo.png"),
                x: 0,
                y: 3.492,
                w: 7.822,
                h: 1.72
            })
            titleSlide.addText(title, {
                x: 1.5,
                y: 3.492,
                w: 6.322,
                h: 1.72,
                align: "center",
                color: "FFFFFF",
                fontSize: 48,
            });

            for (const file of files.image) {
                const slide = pptx.addSlide();
                const imageBase64 = file.buffer.toString("base64");
                slide.addImage({
                path: path.join(STATIC_DIR, "analytics", "SlideBG.png"),
                x: 0,
                y: 0,
                w: "100%",
                h: "100%"
            })
                slide.addImage({
                    data: `data:${file.mimetype};base64,${imageBase64}`,
                    x: 1,
                    y: 1.2,
                    w: 8,
                    h: 4,
                });
            }

            const buffer = await pptx.write({ outputType: "nodebuffer" });

            res.setHeader(
                "Content-Disposition",
                'attachment; filename="presentation.pptx"'
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            );

            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).send("Failed to create presentation");
        }
    })
);

export default router;
