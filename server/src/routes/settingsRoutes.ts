import { Router } from "express";
import {
  getAISettings,
  updateAISettings,
  getAvailableModels,
} from "../controllers/settingsController.js";

const router = Router();

router.get("/ai", getAISettings);
router.put("/ai", updateAISettings);
router.get("/ai/models", getAvailableModels);

export default router;
