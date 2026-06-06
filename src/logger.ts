import path from "path";
// Import the utility function
import { getLogDirectory } from "./utils/getLogDirectory";
import { createLogger, format, transports } from "winston";

// Generate the log directory based on the current date
const logDir = getLogDirectory();

// Create a logger instance
const logger = createLogger({
  level: "info", // Set the logging level
  format: format.combine(
    format.colorize(), // Apply colors to the log levels
    format.timestamp(), // Add timestamp to logs
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: path.join(logDir, "app.log") }), // Log to date-wise directory
  ],
});

export default logger;
