import { ForbiddenWordsDictionary, Message } from "./types.js";

// Constants
export const PORT = 3001;
export const API_PREFIX = "/api";

// System Prompts
export const UI_GENERATION_SYSTEM_PROMPT: Message = {
  role: "system",
  content: `You convert database query results into a dashboard widget. Always respond with a single JSON object and nothing else.

Required shape:
{
  "summary": ["insight 1", "insight 2"],
  "chart": {
    "type": "bar",
    "title": "Chart title",
    "data": [{ "label": "Category", "value": 42 }]
  },
  "recommendations": ["action 1", "action 2"]
}

Rules:
- ALWAYS build summary, chart, and recommendations from the provided rows — even for a single row or simple counts.
- Pick chart.type from: bar, pie, line, area, radar, radial.
- Map numeric columns to chart values; use string/date columns as labels.
- Return {"error": "<your explanation>"} ONLY when the data array is completely empty.
- No markdown, no code fences, no commentary outside the JSON.`,
};
const DB_SCHEMA = `- rooms: Contains information about hotel rooms.
  - room_id: Integer, primary key
  - room_number: String, unique room identifier
  - room_type: String, e.g., 'Single', 'Double', 'Suite'
  - price_per_night: Numeric, cost of the room per night
  - max_occupancy: Integer, maximum number of guests allowed
  - is_available: Boolean, indicates if the room can be booked
- customers: Contains information about hotel customers.
  - customer_id: Integer, primary key
  - name: String, full name of the customer
  - email: String, unique email address of the customer
  - created_at: TIMESTAMPTZ, timestamp of when the customer was created
  - updated_at: TIMESTAMPTZ, timestamp of when the customer was last updated
- bookings: Stores reservation details for rooms.
  - booking_id: Integer, primary key
  - customer_id: Integer, foreign key referencing customers
  - room_id: Integer, foreign key referencing rooms
  - check_in_date: TIMESTAMPTZ, start date of the booking
  - check_out_date: TIMESTAMPTZ, end date of the booking
  - total_price: Numeric, calculated cost of the entire booking
  - status: String, e.g., 'Pending', 'Confirmed', 'Cancelled'
- payments: Records payment transactions for bookings.
  - payment_id: Integer, primary key
  - booking_id: Integer, foreign key referencing bookings
  - amount: Numeric, the amount paid
  - payment_method: String, method used for payment
  - transaction_id: String, unique transaction identifier
- guests: Contains information about guests associated with a booking.
  - guest_id: Integer, primary key
  - booking_id: Integer, foreign key referencing bookings
  - first_name: String
  - last_name: String
- amenities: Stores a list of hotel amenities.
  - amenity_id: Integer, primary key
  - name: String, unique name of the amenity
  - description: Text
- room_amenities: Links rooms to their available amenities.
  - room_id: Integer, foreign key referencing rooms
  - amenity_id: Integer, foreign key referencing amenities`;

export const DATABASE_READ_SYSTEM_PROMPT: Message = {
  role: "system",
  content: `
    You are an assistant that helps users interact with a database. Your tasks is to assist with writing SQL queries to get the data necessary for the user prompt.

    Guidelines:
    - You must only return valid SQL queries.
    - You must provide a single SQL query for the user's request.
    - You must not return any other text or explanations.
    - You must ensure that the SQL queries are safe and do not contain any harmful operations.

    Database Schema:
    ${DB_SCHEMA}
  `,
};
// Add below in case auto-incremental ids are not there
// For insertion, you must write a subquery to generate the new id and if it is a batch insertion then generate subsequent ids.
export const DATABASE_UPDATE_SYSTEM_PROMPT: Message = {
  role: "system",
  content: `
    You are an assistant that helps users add and modify records within a database. Your tasks is to assist with writing SQL queries to fulfill user prompt requests.

    Guidelines:
    - You must only return valid SQL queries.
    - You must provide a single SQL query for the user's request.
    - You must not return any other text or explanations.
    - You must ensure that the SQL queries NEVER deletes/truncate any data or modifies the database schema.

    Database Schema:
    ${DB_SCHEMA}
  `,
};
export const DATABASE_UPDATE_SYSTEM_PROMPT_RECURSIVE: Message = {
  role: "system",
  content: `
    You are an assistant that helps users write INSERT and UPDATE SQL queries to interact with a database.

    ## Output Format
    - You must return a JSON object with three keys: "query", "missing_info_message", and "query_success_message" in the specified JSON format: { "query": string | null, "missing_info_message": string | null, "query_success_message": string | null }.
    - Example 1 (Success): { "query": "UPDATE Rooms SET is_available = false WHERE room_number = '101';", "missing_info_message": null, "query_success_message": "The availability of room 101 has been successfully updated to false." }
    - Example 2 (Needs more info): { "query": null, "missing_info_message": "Please provide the room type you are interested in.", "query_success_message": null }
    - You must always prioritize returning a SQL query as in Example 1. You must leverage message history or create subqueries if required, to fill in missing information. You must wrap the SQL query in a transaction if it modifies multiple tables.
    - "query" should contain the SQL query if you have enough information to generate it or information can be fetched using subqueries, otherwise it should be null.
    - "missing_info_message" should contain a message requesting more information from the user if needed, otherwise it should be null.
    - You must not return any other text or explanations outside the JSON object.

    ## Database Schema:
    ${DB_SCHEMA}
  `,
};

export const SUMMARIZE_CHAT_SYSTEM_PROMPT: Message = {
  role: "system",
  content: `
    You are an assistant that summarizes chat conversations between a user and an AI assistant. Your task is to provide a concise summary of the conversation.

    Guidelines:
    - You must return a summary as plain string that captures the main points and context of the conversation.
    - You must keep the summary brief, ideally within 70 words.
  `,
};

// Dictionaries for aiValidator.js
// Define forbidden words without weights
export const forbiddenSQLQueryKeywordForReadOperations = [
  "DROP",
  "DELETE",
  "TRUNCATE",
  "ALTER",
  "CREATE",
  "INSERT INTO",
  "UPDATE",
  "EXECUTE",
  "--",
  // ";",
  "1=1",
  "0=0",
];
export const forbiddenSQLQueryKeywordForUpdateOperations = [
  "DROP",
  "DELETE",
  "TRUNCATE",
  "ALTER",
  "CREATE",
  // "INSERT INTO",
  // "UPDATE",
  "EXECUTE",
  "--",
  // ";",
  "1=1",
  "0=0",
];
// Define forbidden words with weights (higher = more malicious)
export const forbiddenWordsForReadOperations: ForbiddenWordsDictionary = [
  { word: "SELECT", weight: 5 },
  { word: "INSERT", weight: 5 },
  { word: "UPDATE", weight: 5 },
  { word: "DELETE", weight: 5 },
  { word: "DROP", weight: 10 },
  { word: "ALTER", weight: 8 },
  { word: "CREATE", weight: 7 },
  { word: "EXECUTE", weight: 8 },
  { word: ";", weight: 4 },
  { word: "--", weight: 6 },
  { word: "/*", weight: 6 },
  { word: "*/", weight: 6 },
  // { word: "'", weight: 3 },
  // { word: '"', weight: 3 },
  { word: "`", weight: 3 },
  { word: "OR", weight: 4 },
  { word: "AND", weight: 4 },
  { word: "NOT", weight: 3 },
  { word: "LIKE", weight: 3 },
  { word: "WHERE", weight: 4 },
  { word: "1=1", weight: 7 },
  { word: "0=0", weight: 7 },
  { word: "NULL", weight: 3 },
  { word: "TRUE", weight: 3 },
  { word: "FALSE", weight: 3 },
  { word: "script", weight: 8 },
  { word: "alert", weight: 7 },
  { word: "onerror", weight: 7 },
  { word: "onload", weight: 7 },
  { word: "<script>", weight: 10 },
  { word: "</script>", weight: 10 },
  { word: "<img", weight: 8 },
  { word: "javascript:", weight: 10 },
  { word: "eval", weight: 8 },
  { word: "function", weight: 5 },
  { word: "console", weight: 4 },
  { word: "document", weight: 4 },
];
export const forbiddenWordsForUpdateOperations: ForbiddenWordsDictionary = [
  // { word: "SELECT", weight: 5 },
  // { word: "INSERT", weight: 5 },
  // { word: "UPDATE", weight: 5 },
  { word: "DELETE", weight: 5 },
  { word: "DROP", weight: 10 },
  // { word: "ALTER", weight: 8 },
  // { word: "CREATE", weight: 7 },
  // { word: "EXECUTE", weight: 8 },
  { word: ";", weight: 4 },
  { word: "--", weight: 6 },
  { word: "/*", weight: 6 },
  { word: "*/", weight: 6 },
  // { word: "'", weight: 3 },
  // { word: '"', weight: 3 },
  { word: "`", weight: 3 },
  // { word: "OR", weight: 4 },
  // { word: "AND", weight: 4 },
  // { word: "NOT", weight: 3 },
  // { word: "LIKE", weight: 3 },
  // { word: "WHERE", weight: 4 },
  { word: "1=1", weight: 7 },
  { word: "0=0", weight: 7 },
  // { word: "NULL", weight: 3 },
  // { word: "TRUE", weight: 3 },
  // { word: "FALSE", weight: 3 },
  { word: "script", weight: 8 },
  { word: "alert", weight: 7 },
  { word: "onerror", weight: 7 },
  { word: "onload", weight: 7 },
  { word: "<script>", weight: 10 },
  { word: "</script>", weight: 10 },
  { word: "<img", weight: 8 },
  { word: "javascript:", weight: 10 },
  { word: "eval", weight: 8 },
  { word: "function", weight: 5 },
  { word: "console", weight: 4 },
  { word: "document", weight: 4 },
];

// TABLE RELATED
export const protectedDataModels = ["users", "widgets"];
