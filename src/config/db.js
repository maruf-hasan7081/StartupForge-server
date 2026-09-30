import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let db;

export async function connectDb() {
  if (db) return db;
  client = new MongoClient(env.mongoUri);
  try {
    await client.connect();
  } catch (error) {
    console.error(
      "\nCould not connect to MongoDB.\n" +
        "- Verify MONGODB_URI (Render Environment or server/.env locally)\n" +
        "- Atlas: Network Access → allow 0.0.0.0/0 for cloud hosts like Render\n",
    );
    throw error;
  }
  db = client.db();
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected");
  return db;
}
