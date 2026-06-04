import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

let connected = false;

export async function connectMongo() {
  if (connected) return;
  try {
    await mongoose.connect(MONGO_URI);
    connected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
}

export function isMongoConnected() {
  return connected && mongoose.connection.readyState === 1;
}
