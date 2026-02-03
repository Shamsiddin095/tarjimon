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

const typeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // 'mevalar', 'jihozlar', 'kasblar'
  displayName: { type: String, default: '' }, // Ko'rsatish uchun nom
  words: [wordSubSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const typeStatsSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  totalWords: { type: Number, default: 0 },
  gameMode1Avg: { type: Number, default: 0 },
  gameMode2Avg: { type: Number, default: 0 },
  gameMode3Avg: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Predefined types
const VOCABULARY_TYPES = [
  { type: 'mevalar', displayName: '🍎 Mevalar' },
  { type: 'jihozlar', displayName: '🔧 Jihozlar' },
  { type: 'kasblar', displayName: '👨‍💼 Kasblar' },
  { type: 'hayvonlar', displayName: '🐾 Hayvonlar' },
  { type: 'raqamlar', displayName: '🔢 Raqamlar' },
  { type: 'rangli', displayName: '🌈 Ranglar' },
  { type: 'oilam', displayName: '👨‍👩‍👧‍👦 Oila' },
  { type: 'jismiy', displayName: '🏃 Jismiy Mashqlar' },
  { type: 'taom', displayName: '🍽️ Taomlar' },
  { type: 'uy', displayName: '🏠 Uy Narsalari' }
];

// Get or create models
export function getModels() {
  const Type = mongoose.models.Type || mongoose.model('Type', typeSchema);
  const TypeStats = mongoose.models.TypeStats || mongoose.model('TypeStats', typeStatsSchema);
  
  return { Type, TypeStats };
}

// Get predefined vocabulary types
export function getVocabularyTypes() {
  return VOCABULARY_TYPES;
}
