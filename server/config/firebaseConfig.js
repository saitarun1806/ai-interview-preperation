import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

const envConfig = process.env.FIREBASE_SERVICE_ACCOUNT;

const fallbackConfig = fs.existsSync(serviceAccountPath)
  ? JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
  : null;

const serviceAccount = envConfig ? JSON.parse(envConfig) : fallbackConfig;

if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
  throw new Error("Firebase service account is missing. Set FIREBASE_SERVICE_ACCOUNT in .env or keep a valid serviceAccountKey.json config.");
}

export default serviceAccount;
