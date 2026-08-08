import "./config/tls.js";
import express, { Application, Request, Response } from "express";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { PORT, API_PREFIX } from "./lib/constants.js";
import { morganStream } from "./middleware/morganStream.js";

// Load environment variables
dotenv.config();

// Create the logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('short', { stream: morganStream }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: "AI Dashboard API Server",
    version: "1.0.0"
  });
});

// API routes
app.use(API_PREFIX, routes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
