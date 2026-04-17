import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "grant_project_manager";

let clientPromise: Promise<MongoClient> | undefined;

export function hasMongoConfig() {
  return Boolean(uri);
}

export function getMongoConfigSummary() {
  return {
    configured: Boolean(uri),
    database: dbName,
    host: getMongoHost(uri),
  };
}

export async function getMongoDb(): Promise<Db> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  return client.db(dbName);
}

export async function getMongoStatus() {
  const summary = getMongoConfigSummary();

  if (!uri) {
    return {
      ...summary,
      connected: false,
      error: "MONGODB_URI is not configured",
    };
  }

  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });

    return {
      ...summary,
      connected: true,
      error: null,
    };
  } catch (error) {
    return {
      ...summary,
      connected: false,
      error: error instanceof Error ? sanitizeMongoError(error.message) : "Unknown MongoDB error",
    };
  }
}

function getMongoHost(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return "INVALID_URI";
  }
}

function sanitizeMongoError(message: string) {
  return message.replace(/mongodb\+srv:\/\/[^@]+@/g, "mongodb+srv://***@");
}
