import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

// Simple connection without complex caching
async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MongoDB connection skipped - running in test mode')
    return null
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
    console.log('MongoDB connected successfully')
    return mongoose
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export default connectDB