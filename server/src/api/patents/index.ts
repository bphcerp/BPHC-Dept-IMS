import express from "express";
import cors from "cors";
import multer from "multer";
import addNewPatent from "./addNewPatent";
import addNewPatentManually from "./addNewPatentManually";
import getAllPatents from "./getAllPatents";
import getPatentsByInventorName from "./getPatentsByInventorName";
import insertPatents from "./insertPatents";
import saveInventorEmail from "./saveInventorEmail";
import updateInventorEmail from "./updateInventorEmail";

const app = express();
const upload = multer(); // Multer instance for file handling

app.use(express.json());
app.use(cors());
const router = express.Router();


router.use("/addNewPatent", addNewPatent);
router.use("/addNewPatentManually", addNewPatentManually);
router.use("/getAllPatents", getAllPatents);
router.use("/getPatentsByInventorName", getPatentsByInventorName);
router.use("/insertPatents", insertPatents);
router.use("/saveInventorEmail", saveInventorEmail);
router.use("/updateInventorEmail", updateInventorEmail);

export default router;
