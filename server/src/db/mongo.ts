import { Db, MongoClient } from "mongodb";
import { env } from "../config/env";

let client: MongoClient | null = null;
let db: Db | null = null;

export function isMongoConfigured() {
  return Boolean(env.mongodbUri);
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  if (db) {
    return db;
  }

  try {
    if (!client) {
      client = new MongoClient(env.mongodbUri as string);
    }

    await client.connect();
    db = client.db(env.mongodbDbName);

    return db;
  } catch (error) {
    console.error(
      "MongoDB connection skipped after failure:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
