# AI Dashboard

A full-stack AI-powered dashboard for managing widgets, data models, and user authentication. This project is split into a `client` (React + Vite + TypeScript) and a `server` (Node.js + Express + TypeScript).

## Features
- User authentication and authorization
- Widget creation, update, and deletion
- AI-powered prompt-to-SQL and data-to-UI generation
- Server-Sent Events (SSE) for streaming AI responses
- Logging with Winston
- Modular, scalable codebase

## Project Structure
```
root/
├── client/      # Frontend (React, Vite, TypeScript)
├── server/      # Backend (Node.js, Express, TypeScript)
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Setup
1. Clone the repository:
  ```bash
  git clone https://github.com/ashutosh44ks/AI-powered-ERP-solution
  cd ai-dashboard
  ```
2. Install dependencies for both client and server:
  ```bash
  cd client && npm install
  cd ../server && npm install
  ```
3. Set up environment variable files:
  - **Server:**
    - Use the data in `env.d.ts` to create a `.env` file in the `server/` directory.
    - Connect your DB and update `DB_SCHEMA` in `./server/src/lib/constants.ts` with your actual database schema info (for now, we are using the sample database).
    - OpenRouter: set `OPENROUTER_API_KEY`. In production also set `PUBLIC_URL` to your deployed app origin (e.g. `https://app.example.com`).
    - Optional: set `SETTINGS_ENCRYPTION_KEY` (32-byte hex) to encrypt per-user OpenRouter keys at rest in production.
  - **Sample database:**
    - Follow [server/SAMPLE-DB-SETUP.md](./server/SAMPLE-DB-SETUP.md) to load the hotel booking schema and seed data into PostgreSQL.
  - **Client:**
    - Use the data in `vite-env.d.ts` to create a `.env` file in the `client/` directory.

  > **Note:** The server will not run correctly without the necessary environment variables set. The sample database is recommended for first run.

### Running the App
- **Start both with a single command (from root):**
  ```bash
  npm run dev
  ```
- **Start the server:**
  ```bash
  cd server
  npm run dev
  ```
- **Start the client:**
  ```bash
  cd client
  npm run dev
  ```

The client will be available at `http://localhost:5173` (default Vite port), and the server at `http://localhost:3001` (default Express port).

## Logging
- All server logs are written to `server/logs/combined.log` and the console using Winston.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
