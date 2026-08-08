import { Request, Response } from "express";
import { UI_GENERATION_SYSTEM_PROMPT } from "../lib/constants.js";
import * as openaiService from "../services/openAIService.js";
import * as widgetService from "../services/widgetService.js";
import { ApiResponse, DataForPrompt, Message } from "../lib/types.js";
import {
  validateGeneratedSQLQueryForUpdateOperations,
  validatePromptForReadOperations,
  validatePromptForUpdateOperations,
} from "../middleware/aiValidator.js";
import logger from "../config/logger.js";
import { extractDataFromFile } from "../lib/utils.js";

export const generateUI = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { prompt, widgetId } = req.body;
    const USER_ID = req.USER_ID;

    if (!USER_ID) {
      res.status(400).json({
        success: false,
        error: "User ID is required",
      });
      return;
    }

    const myWidget = await widgetService.getWidgetById(widgetId, USER_ID);
    if (!myWidget) {
      res.status(404).json({
        success: false,
        error: "Widget not found",
      });
      return;
    }

    let hydratedPromptResponse: DataForPrompt = {
      success: false,
    };
    if (myWidget.sql_query) {
      // sql -> data -> ui
      hydratedPromptResponse =
        await openaiService.hydratePromptWithLastQueryData(myWidget.sql_query);
    } else {
      // prompt -> sql -> data -> ui
      const validationResult = validatePromptForReadOperations(prompt);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: validationResult.error || "Invalid prompt",
        });
        return;
      }
      hydratedPromptResponse =
        await openaiService.hydratePromptWithGenerativeQueryData(
          prompt,
          myWidget.id,
          USER_ID
        );
    }
    if (!hydratedPromptResponse.success) {
      await widgetService.deleteWidget(myWidget.id, USER_ID);
      res.status(400).json({
        success: false,
        error: hydratedPromptResponse.error || "Failed to hydrate prompt",
      });
      return;
    }

    const rows = hydratedPromptResponse.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      await widgetService.deleteWidget(myWidget.id, USER_ID);
      res.status(400).json({
        success: false,
        error: "Query returned no data to visualize",
      });
      return;
    }

    const newPrompt = `User question: ${prompt}

Query results (${rows.length} rows):
${JSON.stringify(rows, null, 2)}`;

    logger.info(`Generating UI for widget ${widgetId} with ${rows.length} rows`);

    const messages: Message[] = [UI_GENERATION_SYSTEM_PROMPT];
    messages.push({
      role: "user",
      content: newPrompt,
    });

    const llmStream = await openaiService.createStreamingChatCompletion(messages);

    // Serve the response as a Server-Sent Event (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Convert the stream to a string
    const encoder = new TextEncoder();
    let fullContent = "";

    for await (const chunk of llmStream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (!text) continue;
      fullContent += text;
      res.write(encoder.encode(text));
    }

    if (hydratedPromptResponse.updatedWidget) {
      widgetService.updateWidget(
        hydratedPromptResponse.updatedWidget.id,
        hydratedPromptResponse.updatedWidget.sql_query,
        fullContent,
        USER_ID
      );
    } else if (!myWidget.sql_query) {
      logger.warn(
        "No updated widget found to save the content. This might be an issue."
      );
    }

    res.end();
  } catch (error) {
    logger.error(`Error in AI generation: ${error}`);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    return;
  }
};

export const saveRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { prompt, tableName } = req.body;
    const USER_ID = req.USER_ID;

    if (!USER_ID) {
      res.status(400).json({
        success: false,
        error: "User ID is required",
      });
      return;
    }

    let fileData = null;
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const result = extractDataFromFile(fileBuffer, req.file?.mimetype);
      if (!result.isSuccess) {
        logger.error(`Failed to extract data from file: ${result.error}`);
        res.status(400).json({
          success: false,
          error: result.error || "Failed to extract data from file",
        });
        return;
      }
      fileData = result.data;
    }

    const validationResult = validatePromptForUpdateOperations(prompt);
    if (!validationResult.isValid) {
      logger.error(`Invalid prompt: ${validationResult.error}`);
      res.status(400).json({
        success: false,
        error: validationResult.error || "Invalid prompt",
      });
      return;
    }

    const promptWithFileData = fileData
      ? `${prompt}\n\nFile Data:\n${JSON.stringify(fileData, null, 2)}`
      : prompt;
    const promptWithTableName = tableName
      ? `${promptWithFileData}\n\nUse Table Name: ${tableName}`
      : promptWithFileData;
    const sqlQueryForPrompt =
      await openaiService.getSQLQueryForPromptWithoutRetry(promptWithTableName);
    if (!sqlQueryForPrompt.success) {
      logger.error(`Failed to generate SQL query: ${sqlQueryForPrompt.error}`);
      res.status(400).json({
        success: false,
        error: sqlQueryForPrompt.error || "Failed to generate SQL query",
      });
      return;
    }
    logger.info(`Generated SQL query: ${sqlQueryForPrompt.data}`);
    const validationSQLQuery = validateGeneratedSQLQueryForUpdateOperations(
      sqlQueryForPrompt.data || ""
    );
    if (!validationSQLQuery.isValid) {
      res.status(400).json({
        success: false,
        error: validationSQLQuery.error || "Failed to validate SQL query",
      });
      return;
    }

    //     const sqlQueryForPrompt = {
    //       success: true,
    //       //   data: "INSERT INTO Students (first_name, last_name, email, date_of_birth, enrollment_date, gpa) VALUES ('Ashutosh', 'Singh', 'ashutosh.singh@oodles.io', '2000-04-04', CURRENT_DATE, 3.0);",
    //       data: `INSERT INTO Courses (course_id, course_name, course_description, credits)
    // SELECT
    //   MAX(course_id) + 1, 'Maths', 'University Mathematics provides basic tools for daily work', 2
    // FROM Courses;
    // INSERT INTO Courses (course_id, course_name, course_description, credits)
    // SELECT
    //   MAX(course_id) + 1, 'Science', 'Science helps to understand day to day life', 3
    // FROM Courses;
    // INSERT INTO Courses (course_id, course_name, course_description, credits)
    // SELECT
    //   MAX(course_id) + 1, 'History', 'To do well today we have to know what happened yesterday', 2.5
    // FROM Courses;`,
    //     };
    const dataForPrompt = await openaiService.executePromptQuery(
      sqlQueryForPrompt.data || ""
    );
    if (!dataForPrompt.success) {
      logger.error(`Failed to fulfill prompt: ${dataForPrompt.error}`);
      res.status(400).json({
        success: false,
        error: dataForPrompt.error || "Failed to fulfill prompt",
      });
      return;
    }
    logger.info(`Successfully fulfilled prompt: ${prompt}`, {
      dataCount: dataForPrompt.data.length,
      usedPrompt: promptWithTableName,
    });
    const response: ApiResponse<unknown> = {
      success: true,
      data: dataForPrompt.data,
    };
    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error in saveRecords controller: ${error}`);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    return;
  }
};

interface BulkSaveRecordsRequestBody {
  prompt: string;
  history?: Message[];
}
export const bulkSaveRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { prompt, history }: BulkSaveRecordsRequestBody = req.body;
    const USER_ID = req.USER_ID;

    if (!USER_ID) {
      res.status(400).json({
        success: false,
        error: "User ID is required",
      });
      return;
    }

    const validationResult = validatePromptForUpdateOperations(prompt);
    if (!validationResult.isValid) {
      logger.error(`Invalid prompt: ${validationResult.error}`);
      res.status(400).json({
        success: false,
        error: validationResult.error || "Invalid prompt",
      });
      return;
    }

    const result = await openaiService.handlePromptQueryRecursively(
      prompt,
      history
    );
    if (!result.success) {
      throw new Error(result.error || "Failed to process prompt");
    }
    let newHistory: Message[] = history || [];
    newHistory.push({ role: "user", content: prompt });
    newHistory.push({
      role: "assistant",
      content: result.data?.message || "Operation completed successfully",
    });
    const response: ApiResponse<unknown> = {
      success: true,
      data: newHistory,
    };
    res.status(200).json(response);
    return;
  } catch (error) {
    logger.error(`Error in bulkSaveRecords controller: ${error}`);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    return;
  }
};
