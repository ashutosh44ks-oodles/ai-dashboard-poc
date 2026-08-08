import dotenv from "dotenv";

dotenv.config();

// ponytail: dev-only escape hatch for corporate proxies; use NODE_EXTRA_CA_CERTS in prod
if (process.env.OPENROUTER_TLS_INSECURE === "true") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn(
    "[warn] OPENROUTER_TLS_INSECURE=true: TLS certificate verification disabled for this Node process."
  );
}