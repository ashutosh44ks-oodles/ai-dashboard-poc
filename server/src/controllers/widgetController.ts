import { Request, Response } from "express";
import * as widgetService from "../services/widgetService.js";
import { ApiResponse, Widget } from "../lib/types.js";
import logger from "../config/logger.js";

// Helper function to handle errors consistently
const handleError = (res: Response, error: unknown, message: string) => {
  logger.error(message, { error });
  const response: ApiResponse = {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
  res.status(500).json(response);
};

export const getAllWidgets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const USER_ID = req.USER_ID;
    if (!USER_ID) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      res.status(400).json(response);
      return;
    }
    const widgets = await widgetService.getAllWidgets(USER_ID);
    const response: ApiResponse<Widget[]> = {
      success: true,
      data: widgets,
    };
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error, "Error fetching widgets:");
  }
};

export const createWidget = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { prompt } = req.body;
    const USER_ID = req.USER_ID;

    if (!prompt) {
      const response: ApiResponse = {
        success: false,
        error: "Prompt is required",
      };
      res.status(400).json(response);
      return;
    }

    if (!USER_ID) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      res.status(400).json(response);
      return;
    }

    const widget = await widgetService.createWidget(prompt, USER_ID);
    const response: ApiResponse<Widget> = {
      success: true,
      data: widget,
      message: "Widget created successfully",
    };
    res.status(201).json(response);
  } catch (error) {
    handleError(res, error, "Error creating widget:");
  }
};

export const updateWidget = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const widgetId = req.params.id;
    const { sql_query, content }: {
      sql_query?: Widget["sql_query"];
      content?: Widget["content"];
    } = req.body;
    const USER_ID = req.USER_ID;

    if (!USER_ID) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      res.status(400).json(response);
      return;
    }

    if (!widgetId) {
      const response: ApiResponse = {
        success: false,
        error: "Widget ID is required",
      };
      res.status(400).json(response);
      return;
    }

    if (!sql_query && !content) {
      const response: ApiResponse = {
        success: false,
        error: "At least one of sql_query or content is required",
      };
      res.status(400).json(response);
      return;
    }

    const updatedWidget = await widgetService.updateWidget(
      widgetId,
      sql_query ?? null,
      content ?? null,
      USER_ID
    );
    const response: ApiResponse<Widget> = {
      success: true,
      data: updatedWidget,
      message: "Widget updated successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error, "Error updating widget:");
  }
};

export const deleteWidget = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const widgetId = req.params.id;
    const USER_ID = req.USER_ID;

    if (!USER_ID) {
      const response: ApiResponse = {
        success: false,
        error: "User ID is required",
      };
      res.status(400).json(response);
      return;
    }

    if (!widgetId) {
      const response: ApiResponse = {
        success: false,
        error: "Widget ID is required",
      };
      res.status(400).json(response);
      return;
    }

    await widgetService.deleteWidget(widgetId, USER_ID);
    
    const response: ApiResponse = {
      success: true,
      message: "Widget deleted successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error, "Error deleting widget:");
  }
};