import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

// Global variable to track connection status
let isConnected = false

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MongoDB connection skipped - running in test mode')
    return null
  }

  if (isConnected) {
    console.log('MongoDB already connected')
    return mongoose
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    console.log('MongoDB connected successfully')
    return mongoose
  } catch (error) {
    console.error('MongoDB connection error:', error)
    isConnected = false
    throw error
  }
}

export default connectDB