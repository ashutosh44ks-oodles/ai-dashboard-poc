import { QueryResult, QueryResultRow } from "pg";
import { query } from "../config/db.js";
import xlsx from "xlsx";

const createUsersTableIfNotExists = async (): Promise<void> => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (error) {
    throw new Error(
      `Failed to create users table: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const createWidgetsTableIfNotExists = async (): Promise<void> => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS widgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        sql_query TEXT,
        content TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT fk_user
            FOREIGN KEY(user_id)
                REFERENCES users(user_id)
                ON DELETE CASCADE
        );
    `);
  } catch (error) {
    throw new Error(
      `Failed to create widgets table: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    await createUsersTableIfNotExists();
    await createWidgetsTableIfNotExists();
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error; // Re-throw to handle it in the calling context
  }
};

export const extractDataFromFile = (
  file: Buffer,
  mimetype: string | undefined
) => {
  const result: {
    data: any;
    isSuccess: boolean;
    error: string;
  } = {
    data: null,
    isSuccess: false,
    error: "",
  };
  try {
    if (!mimetype) {
      throw new Error("MIME type is required");
    }
    switch (mimetype) {
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        const workbook = xlsx.read(file, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        result.data = jsonData;
        result.isSuccess = true;
        break;
      case "text/csv":
        // const csvData = file.toString("utf-8");
        // result.data = csvData.split("\n").map((row) => row.split(","));
        const workbook2 = xlsx.read(file, { type: "buffer" });
        const sheetName2 = workbook2.SheetNames[0];
        const sheet2 = workbook2.Sheets[sheetName2];
        const jsonData2 = xlsx.utils.sheet_to_json(sheet2);
        result.data = jsonData2;
        result.isSuccess = true;
        break;
      case "application/json":
        result.data = JSON.parse(file.toString("utf-8"));
        result.isSuccess = true;
        break;
      default:
        result.error = "Unsupported file type.";
    }
  } catch (error) {
    console.error("Error extracting data:", error);
    result.error = error instanceof Error ? error.message : "Unknown error";
  }
  return result;
};
export const multipleQueryHandler = <T extends QueryResultRow>(
  result: QueryResult<T> | QueryResult<T>[]
): QueryResult<T> => {
  if (Array.isArray(result)) {
    return {
      command: "MULTIPLE",
      rowCount: result.reduce((acc, res) => acc + (res.rowCount || 0), 0),
      rows: result.flatMap((res) => res.rows),
      fields: result.flatMap((res) => res.fields),
      oid: result[result.length - 1]?.oid || 0,
    };
  } else {
    return result;
  }
};

export const keyToLabel = (key: string) => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export function containsWholeWord(text: string, word: string): boolean {
  // Escape special regex characters in the 'word' to prevent syntax errors
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Create the regex with word boundaries using the RegExp constructor
  const regex = new RegExp(`\\b${escapedWord}\\b`, "i");
  return regex.test(text);
}
/**
 * Removes '```json' and '```' from a string, and trims any leading/trailing whitespace.
 *
 * @param {string} input The string to clean.
 * @returns {string} The cleaned string, or the original string if the markers aren't found.
 */
export function removeJsonCodeBlock(input: string): string {
  // Check if the string starts with '```json' and ends with '```'
  if (input.startsWith("```json") && input.endsWith("```")) {
    // Remove the '```json' prefix (7 characters) and the '```' suffix (3 characters)
    // Then trim any remaining whitespace, including newlines
    return input.slice(7, -3).trim();
  }
  // If the markers are not present, return the original string
  return input;
}
