import express from "express";
import addSignFields from "./addSignFields.ts";
import getDocumentsToBeSigned from "./getDocumentsToBeSigned.ts";
import uploadSignature from "./uploadSignature.ts";
import getFullPreview from "./getFullPreview.ts";
import getMyDocuments from "./getMyDocuments.ts";
import previewFields from "./previewFields.ts";
import signField from "./signField.ts";
import uploadDocuments from "./uploadDocuments.ts";

const router = express.Router();

router.use("/addSignFields", addSignFields);
router.use("/getDocumentsToBeSigned", getDocumentsToBeSigned);
router.use("/uploadSignature", uploadSignature);    
router.use("/getFullPreview", getFullPreview);
router.use("/getMyDocuments", getMyDocuments);
router.use("/previewFields", previewFields);
router.use("/signField", signField);
router.use("/uploadDocuments", uploadDocuments);

export default router;
