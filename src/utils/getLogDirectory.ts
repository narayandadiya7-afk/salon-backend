import * as fs from "fs";
import * as path from "path";
import cron from "node-cron";
/**
 * Ensures that a directory exists for the current date.
 * If it doesn't exist, it creates the directory.
 */
export function getLogDirectory(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const logDir = path.join(
    __dirname,
    "..",
    "..",
    "logs",
    day + "-" + month + "-" + year.toString()
  );

  // Create the directory structure if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return logDir;
}
//delete function
function deleteOldLogs(logDir: string, days: number): void {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - days);

  fs.readdir(logDir, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(logDir, file);

      if (fs.statSync(filePath).isDirectory()) {
        const [day, month, year] = file.split("-").map(Number);
        const logDate = new Date(year, month - 1, day);

        if (logDate < cutoffDate) {
          fs.rm(filePath, { recursive: true }, (err) => {
            if (err) {
              console.error(`Error deleting directory ${filePath}:`, err);
            } else {
              console.log(`Deleted old log directory: ${filePath}`);
            }
          });
        }
      }
    });
  });
}
// Call deleteOldLogs to clean up old log directories
const life = Number(process.env.LOGS_LIFETIME);
deleteOldLogs(path.join(__dirname, "..", "..", "logs"), life);

//cron method

const logLifetime = Number(process.env.LOGS_LIFETIME);
const logDirPath = path.join(__dirname, "..", "..", "logs");
console.log(logDirPath, "Pathname");

cron.schedule('0 0 * * *', () => {
  console.log("Running scheduled task: Deleting old logs...");
  deleteOldLogs(logDirPath, logLifetime);
});