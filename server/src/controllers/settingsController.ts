import { Request, Response } from "express";
import * as userSettingsService from "../services/userSettingsService.js";
import { invalidateUserAIConfigCache } from "../config/openRouter.js";
import { ApiResponse, UserAISettings, OpenRouterModelOption } from "../lib/types.js";
import logger from "../config/logger.js";

const parseUserId = (userId: string | undefined): number | null => {
  if (!userId) return null;
  const parsed = parseInt(userId, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const handleError = (res: Response, error: unknown, message: string) => {
  logger.error(message, { error });
  const response: ApiResponse = {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
  res.status(500).json(response);
};

export const getAISettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseUserId(req.USER_ID);
    if (userId === null) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const settings = await userSettingsService.getAISettings(userId);
    const response: ApiResponse<UserAISettings> = {
      success: true,
      data: settings,
    };
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error, "Error fetching AI settings:");
  }
};

export const updateAISettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseUserId(req.USER_ID);
    if (userId === null) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const settings = await userSettingsService.updateAISettings(userId, req.body);
    invalidateUserAIConfigCache(String(userId));

    const response: ApiResponse<UserAISettings> = {
      success: true,
      data: settings,
      message: "Settings updated",
    };
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error, "Error updating AI settings:");
  }
};

export const getAvailableModels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseUserId(req.USER_ID);
    if (userId === null) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const models = await userSettingsService.getAvailableModels(userId);
    const response: ApiResponse<OpenRouterModelOption[]> = {
      success: true,
      data: models,
    };
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error, "Error fetching available models:");
  }
};
