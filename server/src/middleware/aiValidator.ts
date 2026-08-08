import logger from "../config/logger.js";
import {
  forbiddenSQLQueryKeywordForReadOperations,
  forbiddenSQLQueryKeywordForUpdateOperations,
  forbiddenWordsForReadOperations,
  forbiddenWordsForUpdateOperations,
} from "../lib/constants.js";
import { ForbiddenWordsDictionary } from "../lib/types.js";
import { containsWholeWord } from "../lib/utils.js";

// Prompt Validations
const validatePromptAgainstDictionary = (
  prompt: string | undefined,
  dictionary: ForbiddenWordsDictionary,
  minLength = 10
) => {
  const result = {
    isValid: true,
    error: "",
  };

  // Check if prompt is empty
  if (!prompt || prompt.trim() === "") {
    result.isValid = false;
    result.error = "Prompt cannot be empty.";
    return result;
  }
  if (minLength > 0 && prompt.trim().length < minLength) {
    result.isValid = false;
    result.error = "Prompt is too short.";
    return result;
  }
  // Check for forbidden words
  // Prevent SQL injection that could be used to manipulate the database
  let maliciousScore = 0,
    maxScorePossible = 0;
  dictionary.forEach(({ word, weight }) => {
    if (containsWholeWord(prompt, word)) {
      result.isValid = false;
      logger.error(
        `Prompt contains forbidden word: ${word} (weight: ${weight})`
      );
      maliciousScore += weight;
    }
    maxScorePossible += weight;
  });

  if (maliciousScore > 0) {
    result.isValid = false;
    result.error = `Your prompt seems to contain potentially harmful content. Please rephrase it. Malicious score: ${maliciousScore}/${maxScorePossible}`;
  }
  return result;
};
export const validatePromptForReadOperations = (prompt: string | undefined) => {
  return validatePromptAgainstDictionary(prompt, forbiddenWordsForReadOperations);
};
export const validatePromptForUpdateOperations = (prompt: string | undefined) => {
  return validatePromptAgainstDictionary(
    prompt,
    forbiddenWordsForUpdateOperations,
    0
  );
};

// SQL Query Validations
const validateGeneratedSQLQuery = (query: string, dictionary: string[]) => {
  const result = {
    isValid: true,
    error: "",
  };

  // Check if query is empty
  if (!query || query.trim() === "") {
    result.isValid = false;
    result.error = "SQL query cannot be empty.";
    return result;
  }

  dictionary.forEach((keyword) => {
    if (containsWholeWord(query, keyword)) {
      result.isValid = false;
      console.error(`SQL query contains forbidden keyword: ${keyword}`);
    }
  });
  if (!result.isValid) {
    result.error = "The SQL query contains forbidden keywords or operations.";
  }
  return result;
};
export const validateGeneratedSQLQueryForReadOperations = (query: string) => {
  return validateGeneratedSQLQuery(query, forbiddenSQLQueryKeywordForReadOperations);
};
export const validateGeneratedSQLQueryForUpdateOperations = (query: string) => {
  return validateGeneratedSQLQuery(query, forbiddenSQLQueryKeywordForUpdateOperations);
};
