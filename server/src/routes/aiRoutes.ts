import { Router } from "express";
import {
  generateUI,
  previewWidget,
  saveRecords,
  bulkSaveRecords,
} from "../controllers/aiController.js";
import multer from "multer";

const router = Router();
// temporary store files in RAM
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/ai/generate-ui
router.post("/generate-ui", generateUI);

// POST /api/ai/preview-widget
router.post("/preview-widget", previewWidget);

// POST /api/ai/save-record
router.post("/save-record", upload.single("file"), saveRecords);

// POST /api/ai/bulk-save-record
router.post("/bulk-save-record", bulkSaveRecords);

export default router;
