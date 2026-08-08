import OpenAI from "openai";
import {
  DATABASE_READ_SYSTEM_PROMPT,
  DATABASE_UPDATE_SYSTEM_PROMPT,
  DATABASE_UPDATE_SYSTEM_PROMPT_RECURSIVE,
  SUMMARIZE_CHAT_SYSTEM_PROMPT,
  UI_GENERATION_SYSTEM_PROMPT,
} from "../lib/constants.js";
import {
  DataForPrompt,
  Message,
  QueryForPrompt,
  QueryForPromptWithMissingInfo,
  Widget,
} from "../lib/types.js";
import {
  validateGeneratedSQLQueryForReadOperations,
  validateGeneratedSQLQueryForUpdateOperations,
} from "../middleware/aiValidator.js";
import { query } from "../config/db.js";
import logger from "../config/logger.js";
import * as widgetService from "./widgetService.js";
import { DatabaseError } from "pg";
import { multipleQueryHandler, removeJsonCodeBlock, formatQueryResultsForChat, isChitchatPrompt, resolveChartDisplay } from "../lib/utils.js";

import {
  OPENROUTER_MODEL,
  OPENROUTER_MODEL_ADVANCED,
  OPENROUTER_MODEL_UI,
  openRouterClient,
} from "../config/openRouter.js";
export async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  return await openRouterClient.chat.completions.create({
    model: OPENROUTER_MODEL,
    stream: false,
    messages,
  });
}
export async function createChatCompletionAdvanced(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
) {
  return await openRouterClient.chat.completions.create({
    model: OPENROUTER_MODEL_ADVANCED,
    stream: false,
    messages,
  });
}

export async function createStreamingChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
) {
  return await openRouterClient.chat.completions.create({
    model: OPENROUTER_MODEL_UI,
    stream: true,
    temperature: 0.2,
    messages,
  });
}

export function getOpenRouterClient(): OpenAI {
  return openRouterClient;
}

export function buildWidgetUIPrompt(
  prompt: string,
  rows: Record<string, unknown>[]
): string {
  return `User question: ${prompt}

Query results (${rows.length} rows):
${JSON.stringify(rows, null, 2)}`;
}

export async function streamWidgetUIFromRows(
  prompt: string,
  rows: Record<string, unknown>[]
) {
  const messages: Message[] = [
    UI_GENERATION_SYSTEM_PROMPT,
    {
      role: "user",
      content: buildWidgetUIPrompt(prompt, rows),
    },
  ];
  return await createStreamingChatCompletion(messages);
}

// Helper function to get SQL query for the prompt
export const getSQLQueryForPrompt = async (
  prompt: string,
  lastInteraction: {
    error: string | null;
    response: string | null;
  }
): Promise<QueryForPrompt> => {
  const messages: Message[] = [DATABASE_READ_SYSTEM_PROMPT];
  messages.push({
    role: "user",
    content: prompt,
  });

  // If there was a previous error or response, include it in the messages
  if (lastInteraction.response) {
    messages.push({
      role: "assistant",
      content: `Previous response: ${lastInteraction.response}`,
    });
  }
  if (lastInteraction.error) {
    messages.push({
      role: "user",
      content: `The previous response was incorrect. Here is the reason: ${lastInteraction.error}. Please try again with the same prompt.`,
    });
  }
  logger.info(`Messages for LLM: ${messages.length}`);

  // const fakeResponseToSaveTokens = await new Promise((resolve) => {
  //   // fake promise to simulate async behavior
  //   setTimeout(() => {
  //     resolve({
  //       success: true,
  //       data: "SELECT * FROM Students WHERE gpa > 3.0;", // Simulated SQL query
  //     });
  //   }, 1000);
  // });
  // return fakeResponseToSaveTokens as QueryForPrompt;

  // create a chat completion via OpenRouter
  const llm = await createChatCompletion(messages);

  // If the response contains choices, extract the content
  if (llm.choices && llm.choices.length > 0) {
    const content = llm.choices[0].message?.content;
    if (content) {
      // data: content.split("\n").map((line) => line.trim()).filter(Boolean),
      return {
        success: true,
        data: content,
      };
    }
  }

  // If no content is returned, return an error
  return {
    success: false,
    error: "Failed to generate query from prompt",
  };
};
export const getSQLQueryForPromptWithoutRetry = async (
  prompt: string
): Promise<QueryForPrompt> => {
  const messages: Message[] = [DATABASE_UPDATE_SYSTEM_PROMPT];
  messages.push({
    role: "user",
    content: prompt,
  });

  // const fakeResponseToSaveTokens = await new Promise((resolve) => {
  //   // fake promise to simulate async behavior
  //   setTimeout(() => {
  //     resolve({
  //       success: true,
  //       data: "SELECT * FROM Students WHERE gpa > 3.0;", // Simulated SQL query
  //     });
  //   }, 1000);
  // });
  // return fakeResponseToSaveTokens as QueryForPrompt;

  // create a chat completion via OpenRouter
  const llm = await createChatCompletion(messages);

  // If the response contains choices, extract the content
  if (llm.choices && llm.choices.length > 0) {
    const content = llm.choices[0].message?.content;
    if (content) {
      // data: content.split("\n").map((line) => line.trim()).filter(Boolean),
      return {
        success: true,
        data: content,
      };
    }
  }

  // If no content is returned, return an error
  return {
    success: false,
    error: "Failed to generate query from prompt",
  };
};
export const getSQLQueryForPromptRecursively = async (
  prompt: string,
  history: Message[]
): Promise<QueryForPromptWithMissingInfo> => {
  const messages: Message[] = [DATABASE_UPDATE_SYSTEM_PROMPT_RECURSIVE];
  messages.push(...history);
  messages.push({
    role: "user",
    content: prompt,
  });
  logger.info(`Messages for LLM: ${messages.length}`);

  // create a chat completion via OpenRouter
  const llm = await createChatCompletionAdvanced(messages);

  // If the response contains choices, extract the content
  if (llm.choices && llm.choices.length > 0) {
    const content = llm.choices[0].message?.content;
    if (content) {
      try {
        const parsedContent: QueryForPromptWithMissingInfo["data"] =
          JSON.parse(removeJsonCodeBlock(content));
        if (
          parsedContent &&
          (parsedContent.write_query ||
            parsedContent.read_query ||
            parsedContent.query ||
            parsedContent.missing_info_message ||
            parsedContent.refusal_message)
        ) {
          return {
            success: true,
            data: parsedContent,
          };
        }
      } catch (error) {
        logger.error(`Error parsing LLM response: ${content}`, { error });
      }
    }
  }

  // If no content is returned, return an error
  return {
    success: false,
    error: "Failed to generate result from prompt",
  };
};
// Helper function to run query on pg database
export const executePromptQuery = async (
  sqlQueryForPrompt: string
): Promise<DataForPrompt> => {
  try {
    const result = await query(sqlQueryForPrompt);
    return { success: true, data: multipleQueryHandler(result).rows };
  } catch (error: unknown) {
    if (error instanceof DatabaseError) {
      logger.error(`Error executing prompt-generated query: ${error.message}`);
      return { success: false, error: error.message };
    } else if (error instanceof Error) {
      logger.error("Error executing prompt-generated query:", { error });
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Failed to execute prompt-generated query",
    };
  }
};
// Helper functions to hydrate the prompt with data
export const hydratePromptWithGenerativeQueryData = async (
  prompt: string,
  widgetId: Widget["id"],
  userId: string
) => {
  const MAX_RETRIES = 3;
  let retryCount = MAX_RETRIES;
  let sqlQueryForPrompt: QueryForPrompt = {
    success: false,
  };
  let dataForPrompt: DataForPrompt = {
    success: false,
  };
  // Variable to store the last error message
  let lastError: string | null = null;

  logger.info(
    `Received prompt ${prompt} for widget ${widgetId} by user ${userId}`
  );
  // Retry loop for the entire process
  while (retryCount > 0) {
    try {
      // Simulate a retry mechanism ---- (1/2)
      // if (retryCount == 3) {
      //   throw new Error("Simulated error for retry logic"); // Simulate an error for retry logic
      // }
      logger.info(`Attempt No. ${MAX_RETRIES - retryCount + 1}`, {
        prompt,
        error: lastError,
        response: sqlQueryForPrompt?.data || null,
      });

      // Step 1: Generate SQL query
      sqlQueryForPrompt = await getSQLQueryForPrompt(prompt, {
        error: lastError,
        response: sqlQueryForPrompt?.data || null,
      });
      if (!sqlQueryForPrompt.success) {
        throw new Error(sqlQueryForPrompt.error);
      }
      logger.info(
        `Attempt No. ${MAX_RETRIES - retryCount + 1}: Generated SQL query: ${
          sqlQueryForPrompt.data
        }`
      );

      // Step 2: Validate SQL query & update widget
      const validationResult = validateGeneratedSQLQueryForReadOperations(
        sqlQueryForPrompt.data || ""
      );
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }
      const updatedWidget = await widgetService.updateWidget(
        widgetId,
        sqlQueryForPrompt.data || null,
        null,
        userId
      );

      // Step 3: Fetch data from the database
      dataForPrompt = await executePromptQuery(sqlQueryForPrompt.data || "");
      if (!dataForPrompt.success) {
        throw new Error(dataForPrompt.error);
      }

      logger.info(`Fetched ${dataForPrompt.data?.length || 0} rows of data`);
      return { success: true, data: dataForPrompt.data, updatedWidget };
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Attempt failed:", { message: error.message });
        // Simulate a retry mechanism ---- (2/2)
        // if (retryCount == 3) {
        //   sqlQueryForPrompt = {
        //     success: true,
        //     data: "SELECT * FROM Estudents WHERE gpa > 3.0;", // Fallback query
        //   };
        // }
        retryCount--;
        lastError = error.message;
        if (retryCount <= 0) {
          logger.error(`Exceeded max retries for prompt: ${prompt}`, {
            error: error.message,
          });
          return {
            success: false,
            error: "Exceeded max retries: " + error.message,
          };
        }
        logger.info(`Retrying... ${retryCount} attempts left.`);
      } else {
        logger.error("An unknown error occurred.", { error });
        return { success: false, error: "An unknown error occurred." };
      }
    }
  }

  return { success: false, error: "An unexpected error occurred." };
};
export const hydratePromptWithLastQueryData = async (
  lastQuery: string | null
): Promise<DataForPrompt> => {
  if (!lastQuery) {
    return { success: false, error: "No previous query to hydrate with." };
  }
  try {
    logger.info(`Using last query to fetch data: ${lastQuery}`);
    const result = await query(lastQuery);
    return { success: true, data: multipleQueryHandler(result).rows };
  } catch (error) {
    logger.error("Error fetching data for prompt:", { error });
    return { success: false, error: "Failed to fetch data for prompt" };
  }
};
// Helper function to converse with the user and execute the prompt
export const summarizeChatTillNow = async (history: Message[]) => {
  const messages: Message[] = [SUMMARIZE_CHAT_SYSTEM_PROMPT];
  messages.push(...history);
  logger.info(`Messages for LLM: ${messages.length}`);

  // create a chat completion via OpenRouter
  const llm = await createChatCompletion(messages);

  // If the response contains choices, extract the content
  if (llm.choices && llm.choices.length > 0) {
    const content = llm.choices[0].message?.content;
    if (content) {
      return {
        success: true,
        data: content,
      };
    }
  }

  // If no content is returned, return an error
  return {
    success: false,
    error: "Failed to generate summary from chat history",
  };
}
export const handlePromptQueryRecursively = async (
  prompt: string,
  history: Message[] = []
) => {
  let newHistory = [...history];
  logger.info(
    `Received prompt ${prompt} for detailed execution with history: ${JSON.stringify(
      newHistory
    )}`
  );

  if (isChitchatPrompt(prompt)) {
    return {
      success: true,
      data: {
        type: "refusal",
        message:
          "I can help you query data or add/update records. For example: \"How many customers do we have?\" or \"Add a new double room.\"",
      },
      error: null,
    };
  }

  if (newHistory.length > 5) {
    logger.warn("History length exceeded 5 messages, trimming older messages.");
    const historySummary = await summarizeChatTillNow(newHistory);
    if (historySummary.success) {
      newHistory = [
        {
          role: "system",
          content: `Summary of previous conversation: ${historySummary.data}`,
        },
      ];
      logger.info(`Chat history summarized to maintain context: ${historySummary.data}`);
    } else {
      logger.error("Failed to summarize chat history, proceeding without summary.");
      newHistory = newHistory.slice(-2); // Just trim to last 4 if summarization fails
    }
  }

  const resultForPrompt = await getSQLQueryForPromptRecursively(
    prompt,
    newHistory
  );
  if (!resultForPrompt.success) {
    logger.error(
      `Failed to generate result from prompt: ${resultForPrompt.error}`
    );
    return {
      success: false,
      error: resultForPrompt.error || "Failed to generate result from prompt",
    };
  }

  const parsed = resultForPrompt.data;

  if (parsed?.refusal_message) {
    return {
      success: true,
      data: { type: "refusal", message: parsed.refusal_message },
      error: null,
    };
  }

  const readQuery = parsed?.read_query?.trim() || null;
  const writeQuery =
    (parsed?.write_query || parsed?.query)?.trim() || null;

  if (readQuery && writeQuery) {
    return {
      success: false,
      error: "Ambiguous request: both read and write queries were generated.",
    };
  }

  if (readQuery) {
    const validationResult =
      validateGeneratedSQLQueryForReadOperations(readQuery);
    if (!validationResult.isValid) {
      logger.error(`Invalid read SQL query: ${validationResult.error}`);
      return {
        success: false,
        error: validationResult.error || "Invalid SQL query",
      };
    }

    const dataForPrompt = await executePromptQuery(readQuery);
    if (!dataForPrompt.success) {
      logger.error(`Failed to execute read SQL query: ${dataForPrompt.error}`);
      return {
        success: false,
        error: dataForPrompt.error || "Failed to execute SQL query",
      };
    }

    const rows = (dataForPrompt.data || []) as Record<string, unknown>[];
    logger.info(
      `Read query executed successfully, fetched ${rows.length} row(s)`
    );

    const chartDecision = resolveChartDisplay(
      prompt,
      parsed?.chart_display,
      parsed?.chart_suggestion_message,
      rows
    );

    const readData: {
      type: "read";
      message: string;
      widget?: {
        prompt: string;
        sqlQuery: string;
        display: "suggest" | "show";
        suggestionMessage?: string;
      };
    } = {
      type: "read",
      message: formatQueryResultsForChat(rows),
    };

    if (chartDecision.display === "suggest" || chartDecision.display === "show") {
      readData.widget = {
        prompt,
        sqlQuery: readQuery,
        display: chartDecision.display,
        suggestionMessage: chartDecision.suggestionMessage,
      };
    }

    return {
      success: true,
      data: readData,
      error: null,
    };
  }

  if (writeQuery) {
    const validationResult =
      validateGeneratedSQLQueryForUpdateOperations(writeQuery);
    if (!validationResult.isValid) {
      logger.error(`Invalid write SQL query: ${validationResult.error}`);
      return {
        success: false,
        error: validationResult.error || "Invalid SQL query",
      };
    }

    const dataForPrompt = await executePromptQuery(writeQuery);
    if (!dataForPrompt.success) {
      logger.error(`Failed to execute write SQL query: ${dataForPrompt.error}`);
      return {
        success: false,
        error: dataForPrompt.error || "Failed to execute SQL query",
      };
    }

    logger.info(
      `Write query executed successfully, affected ${
        dataForPrompt.data?.length || 0
      } row(s)`
    );

    return {
      success: true,
      data: {
        type: "write",
        message:
          parsed?.query_success_message || "Changes were applied successfully.",
      },
      error: null,
    };
  }

  if (parsed?.missing_info_message) {
    logger.info(
      `Missing information: ${parsed.missing_info_message}`
    );
    return {
      success: true,
      data: {
        type: "missing_info",
        message: parsed.missing_info_message,
      },
      error: null,
    };
  }

  return {
    success: false,
    error: "No actionable response from the model.",
  };
};
