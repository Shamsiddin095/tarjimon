// MongoDB connection pool management
import mongoose from 'mongoose';

let cachedConnection = null;
let cachedDb = null;
let connectionPromise = null;

export async function connectToDatabase() {
  // Agar connection tayyor bo'lsa, uni qaytarish
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('🔄 Using cached MongoDB connection');
    return { conn: cachedConnection, db: cachedDb };
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable not set');
  }

  // Agar connection jarayoni davom etsa, uni kuting
  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection...');
    return connectionPromise;
  }

  // Yangi connection yaratish
  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  }).then(conn => {
    cachedConnection = conn;
    cachedDb = conn.connection.db;
    console.log('✅ New MongoDB connection established');
    return { conn, db: cachedDb };
  }).catch(err => {
    // Connection xatosi bo'lsa, cache'ni reset qilish
    connectionPromise = null;
    cachedConnection = null;
    cachedDb = null;
    throw err;
  });

  return connectionPromise;
}

// Schemas
const wordSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  english: { type: String, required: true },
  uzbek: { type: String, required: true },
  description: { type: String, default: null }, // So'z tavsifi
  status: { type: Boolean, default: false },
  gameMode1: { type: Number, default: 0 },
  gameMode2: { type: Number, default: 0 },
  gameMode3: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { _id: true });

const unitSchema = new mongoose.Schema({
  unit: { type: Number, required: true, unique: true },
  unitName: { type: String, default: '' },
  words: [wordSubSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const unitStatsSchema = new mongoose.Schema({
  unit: { type: Number, required: true, unique: true },
  totalWords: { type: Number, default: 0 },
  gameMode1Avg: { type: Number, default: 0 },
  gameMode2Avg: { type: Number, default: 0 },
  gameMode3Avg: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Get or create models
export function getModels() {
  const Unit = mongoose.models.Unit || mongoose.model('Unit', unitSchema);
  const UnitStats = mongoose.models.UnitStats || mongoose.model('UnitStats', unitStatsSchema);
  
  return { Unit, UnitStats };
}
