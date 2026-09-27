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
        "- Check MONGODB_URI in server/.env (Atlas IP allowlist: 0.0.0.0/0 for dev)\n" +
        "- Or install/start local MongoDB on port 27017\n",
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
