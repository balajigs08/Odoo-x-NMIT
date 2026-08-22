import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in the environment");
  }

  mongoose.set("strictQuery", true);

  const connectWithRetry = async (attempt = 1): Promise<void> => {
    try {
      await mongoose.connect(uri);
      console.log("[db] Connected to MongoDB Atlas");
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt} failed:`, (err as Error).message);
      if (attempt >= 5) {
        console.error("[db] Giving up after 5 attempts. Check MONGODB_URI and Atlas IP allowlist.");
        process.exit(1);
      }
      const delay = attempt * 2000;
      console.log(`[db] Retrying in ${delay / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    }
  };

  await connectWithRetry();

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected. Mongoose will attempt to reconnect automatically.");
  });
}
