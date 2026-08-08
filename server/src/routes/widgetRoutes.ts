import { Router } from "express";
import {
  createWidget,
  getAllWidgets,
  updateWidget,
  deleteWidget,
} from "../controllers/widgetController.js";

const router = Router();

// GET /api/widgets
router.get("/", getAllWidgets);

// POST /api/widgets
router.post("/", createWidget);

// PUT /api/widgets/:id
router.put("/:id", updateWidget);

// DELETE /api/widgets/:id
router.delete("/:id", deleteWidget);

export default router;
