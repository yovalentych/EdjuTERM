import "server-only";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const localUri = process.env.LOCAL_MONGODB_URI ?? "mongodb://localhost:27017";
const fallbackEnabled = process.env.MONGO_FALLBACK_TO_LOCAL === "true";
const dbName = process.env.MONGODB_DB ?? "grant_project_manager";

let clientPromise: Promise<MongoClient> | undefined;
let isUsingFallback = false;

export function hasMongoConfig() {
  return Boolean(uri) || fallbackEnabled;
}

export function getMongoConfigSummary() {
  return {
    configured: Boolean(uri),
    database: dbName,
    host: getMongoHost(isUsingFallback ? localUri : uri),
    isFallback: isUsingFallback,
  };
}

export async function getMongoDb(): Promise<Db> {
  if (!uri && !fallbackEnabled) {
    throw new Error("MONGODB_URI is not configured and local fallback is disabled");
  }

  if (clientPromise) {
    try {
      const client = await clientPromise;
      return client.db(dbName);
    } catch (error) {
      // If the cached promise failed, reset and try again (possibly with fallback)
      clientPromise = undefined;
    }
  }

  const connect = (connectionUri: string) => {
    const client = new MongoClient(connectionUri, {
      serverSelectionTimeoutMS: 5000,
    });
    return client.connect();
  };

  try {
    if (uri) {
      clientPromise = connect(uri);
      const client = await clientPromise;
      isUsingFallback = false;
      return client.db(dbName);
    } else {
      throw new Error("Primary URI not provided");
    }
  } catch (error) {
    if (fallbackEnabled) {
      console.warn("Primary MongoDB connection failed, falling back to local...");
      try {
        clientPromise = connect(localUri);
        const client = await clientPromise;
        isUsingFallback = true;
        return client.db(dbName);
      } catch (fallbackError) {
        clientPromise = undefined;
        throw new Error(`Both primary and local MongoDB connections failed. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      }
    }
    clientPromise = undefined;
    throw error;
  }
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
