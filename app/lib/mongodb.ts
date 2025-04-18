import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null
  };
}

async function connectDB() {
  try {
    console.log('Starting MongoDB connection...');
    console.log('MONGODB_URI:', MONGODB_URI?.substring(0, 20) + '...');

    if (cached.conn) {
      console.log('Using cached connection');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      };

      console.log('Creating new connection...');
      cached.promise = mongoose.connect(MONGODB_URI!, opts)
        .then(() => {
          console.log('MongoDB connected successfully');
          mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', {
              message: err.message,
              code: err.code,
              stack: err.stack
            });
          });
          mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            cached.conn = null;
            cached.promise = null;
          });
          return mongoose;
        })
        .catch((err) => {
          console.error('MongoDB connection failed:', {
            message: err.message,
            code: err.code,
            stack: err.stack
          });
          throw err;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: any) {
    console.error('MongoDB connection error:', {
      message: e.message,
      code: e.code,
      stack: e.stack
    });
    cached.promise = null;
    throw e;
  }
}

export default connectDB;
