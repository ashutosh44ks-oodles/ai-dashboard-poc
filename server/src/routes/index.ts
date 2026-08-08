import { Router } from "express";
import aiRoutes from "./aiRoutes.js";
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import widgetRoutes from "./widgetRoutes.js"; 
import dataModelRoutes from "./dataModelRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import { authMiddleWare } from "../middleware/auth.js";

const router = Router();

// Health check route
router.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use("/auth", authRoutes);
// Authentication middleware
router.use(authMiddleWare);
router.use("/ai", aiRoutes);
router.use("/users", userRoutes);
router.use("/widgets", widgetRoutes);
router.use("/data-models", dataModelRoutes);
router.use("/settings", settingsRoutes);

export default router;
