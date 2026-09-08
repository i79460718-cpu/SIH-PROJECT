import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "warn",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});
