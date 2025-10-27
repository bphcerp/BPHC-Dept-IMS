import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import * as PptxGenJSImport from "pptxgenjs";
const PptxGenJS = (PptxGenJSImport as any).default || PptxGenJSImport;
import { imageUpload } from "@/config/multer.ts";

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

            pptx.addSlide().addText(title, {
                x: 0,
                y: 1,
                w: "100%",
                h: 2,
                align: "center",
                color: "0088CC",
                fontSize: 48,
            });

            for (const file of files.image) {
                const slide = pptx.addSlide();
                const imageBase64 = file.buffer.toString("base64");

                slide.addImage({
                    data: `data:${file.mimetype};base64,${imageBase64}`,
                    x: 1,
                    y: 1.625,
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
