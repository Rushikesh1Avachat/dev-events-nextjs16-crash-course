import { NextResponse } from "next/server";
import mongoose, { Model, Schema, Document } from "mongoose";

// Ensure this route runs on the Node.js runtime (MongoDB is not supported on the Edge runtime)
export const runtime = "nodejs";

// Basic shape of the public event data we return
export interface EventPublic {
  image: string;
  title: string;
  slug: string;
  location: string;
  date: string; // ISO date string (e.g., "2025-11-07")
  time: string; // Human-readable time (e.g., "09:00 AM")
}

// Mongoose document type for the Event collection
interface EventDoc extends Document, EventPublic {}

// Define a minimal schema (will be reused if a model is already compiled)
const EventSchema = new Schema<EventDoc>(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true }
);

// Use existing model if already registered to avoid OverwriteModelError during HMR
const Event: Model<EventDoc> =
  (mongoose.models.Event as Model<EventDoc> | undefined) ??
  mongoose.model<EventDoc>("Event", EventSchema);

// Cached connection pattern for Next.js hot-reload/dev
const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = global as unknown as { mongoose?: MongooseCache };
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured in environment variables");
  }
  const cache = globalWithMongoose.mongoose!;
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

// Small helper to validate slug format (lowercase letters, numbers, dashes)
function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{1,100}$/.test(value);
}

// GET /api/events/[slug]
export async function GET(_req: Request, context: { params: { slug?: string } }) {
  try {
    const slug = context?.params?.slug;

    // Validate presence and format of slug
    if (!slug) {
      return NextResponse.json(
        { success: false as const, error: { code: "MISSING_SLUG", message: "Parameter 'slug' is required." } },
        { status: 400 }
      );
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { success: false as const, error: { code: "INVALID_SLUG", message: "Parameter 'slug' must be a lowercase slug (a-z, 0-9, -)." } },
        { status: 400 }
      );
    }

    // Connect to the database and query by slug
    await dbConnect();
    const doc = await Event.findOne({ slug }).lean().exec();

    if (!doc) {
      return NextResponse.json(
        { success: false as const, error: { code: "NOT_FOUND", message: "Event not found." } },
        { status: 404 }
      );
    }

    // Map the document to the public shape to ensure a stable API
    const event: EventPublic = {
      image: String((doc as unknown as EventPublic).image),
      title: String((doc as unknown as EventPublic).title),
      slug: String((doc as unknown as EventPublic).slug),
      location: String((doc as unknown as EventPublic).location),
      date: String((doc as unknown as EventPublic).date),
      time: String((doc as unknown as EventPublic).time),
    };

    return NextResponse.json(
      { success: true as const, data: event },
      {
        status: 200,
        headers: {
          // Allow intermediate caches on the server (e.g., Vercel) to cache briefly
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[GET] /api/events/[slug] error", err);
    return NextResponse.json(
      { success: false as const, error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
