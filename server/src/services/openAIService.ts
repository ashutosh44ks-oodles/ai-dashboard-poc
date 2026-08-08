import OpenAI from "openai";
import dotenv from "dotenv";
import {
  DATABASE_READ_SYSTEM_PROMPT,
  DATABASE_UPDATE_SYSTEM_PROMPT,
  DATABASE_UPDATE_SYSTEM_PROMPT_RECURSIVE,
  SUMMARIZE_CHAT_SYSTEM_PROMPT,
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
import { multipleQueryHandler, removeJsonCodeBlock } from "../lib/utils.js";

dotenv.config();

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
// ponytail: openrouter/free rotates free models; override via env for a fixed model
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "openrouter/free";
const OPENROUTER_MODEL_ADVANCED =
  process.env.OPENROUTER_MODEL_ADVANCED ?? "cohere/north-mini-code:free";

const openRouterClient = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI ERP Dashboard",
  },
});

// Core methods
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
export function getOpenRouterClient(): OpenAI {
  return openRouterClient;
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
        console.log("Parsed Content:", parsedContent);
        if (parsedContent && (parsedContent.query || parsedContent.missing_info_message)) {
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

  if (resultForPrompt.data?.missing_info_message) {
    logger.info(
      `Missing information: ${resultForPrompt.data.missing_info_message}`
    );
    return {
      success: true,
      data: {
        type: "missing_info",
        message: resultForPrompt.data.missing_info_message,
      },
      error: null,
    };
  }
  // Validate the generated SQL query
  const validationResult = validateGeneratedSQLQueryForUpdateOperations(
    resultForPrompt.data?.query || ""
  );
  if (!validationResult.isValid) {
    logger.error(`Invalid SQL query: ${validationResult.error}`);
    return {
      success: false,
      error: validationResult.error || "Invalid SQL query",
    };
  }

  // Execute the SQL query
  const dataForPrompt = await executePromptQuery(
    resultForPrompt.data?.query || ""
  );
  if (!dataForPrompt.success) {
    logger.error(`Failed to execute SQL query: ${dataForPrompt.error}`);
    return {
      success: false,
      error: dataForPrompt.error || "Failed to execute SQL query",
    };
  }
  logger.info(
    `Executed SQL query successfully, fetched ${
      dataForPrompt.data?.length || 0
    } rows of data`
  );

  return {
    success: true,
    data: {
      type: "data",
      message: resultForPrompt.data?.query_success_message || "Query executed successfully.",
    },
    error: null,
  };
};
