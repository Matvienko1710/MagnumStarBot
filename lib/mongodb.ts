import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

// Extend the global object to include mongoose
declare global {
  var mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  } | undefined
}

if (!MONGODB_URI) {
  console.warn('MONGODB_URI not found - running in test mode without database')
} else {
  console.log('MongoDB URI found - connecting to database')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MongoDB connection skipped - running in test mode')
    return null
  }

  if (cached?.conn) {
    return cached.conn
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts) as Promise<typeof mongoose>
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB