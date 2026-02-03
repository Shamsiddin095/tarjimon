import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Multer configuration - audio upload uchun
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const stage = req.query.stage || 'listening';
    const uploadDir = path.join(__dirname, 'public', 'tracks', stage);
    
    // Papka mavjud bo'lsa xo'zlash
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files allowed'));
    }
  }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => console.error('❌ MongoDB xatosi:', err.message));

// Word Schema
// Word subdocument schema (type ichida)
const wordSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  english: { type: String, required: true },
  uzbek: { type: String, required: true },
  description: { type: String },
  status: { type: Boolean, default: false },
  gameMode1: { type: Number, default: 0 },
  gameMode2: { type: Number, default: 0 },
  gameMode3: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { _id: true });

// Type Schema - har bir type uchun bitta document, ichida words array
const typeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // 'mevalar', 'jihozlar', etc
  displayName: { type: String, default: '' }, // Ko'rsatish uchun nom
  words: [wordSubSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Type = mongoose.model('Type', typeSchema);

// TypeStats Schema - Type bo'yicha statistika
const typeStatsSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  totalWords: { type: Number, default: 0 },
  gameMode1Avg: { type: Number, default: 0 },
  gameMode2Avg: { type: Number, default: 0 },
  gameMode3Avg: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const TypeStats = mongoose.model('TypeStats', typeStatsSchema);

// Predefined vocabulary types
const VOCABULARY_TYPES = [
  { type: 'mevalar', displayName: '🍎 Mevalar' },
  { type: 'jihozlar', displayName: '🔧 Jihozlar' },
  { type: 'kasblar', displayName: '👨‍💼 Kasblar' },
  { type: 'hayvonlar', displayName: '🐾 Hayvonlar' },
  { type: 'raqamlar', displayName: '🔢 Raqamlar' },
  { type: 'rangli', displayName: '🌈 Ranglar' },
  { type: 'oilam', displayName: '👨‍👩‍👧‍👦 O\'ila Azo\'lari' },
  { type: 'jismiy', displayName: '🏃 Jismiy Mashqlar' },
  { type: 'taom', displayName: '🍽️ Taomlar' },
  { type: 'uy', displayName: '🏠 Uy Narsalari' }
];

// API Routes (STATIC dan OLDIN!)
// Types listini olish
app.get('/api/vocabulary-types', async (req, res) => {
  try {
    res.json(VOCABULARY_TYPES);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Yangi so'z qo'shish (type ichiga)
app.post('/api/words', async (req, res) => {
  try {
    const { english, uzbek, description, type, displayName } = req.body;
    
    if (!english || !uzbek || !type) {
      return res.status(400).json('Xato: english, uzbek, type kerak');
    }
    
    // Type document'ni topish yoki yaratish
    let typeDoc = await Type.findOne({ type });
    
    if (!typeDoc) {
      // Yangi type document yaratish
      typeDoc = new Type({ type, displayName: displayName || '', words: [] });
    } else if (displayName) {
      // Type nomi yangilandi bo'lsa
      typeDoc.displayName = displayName;
    }
    
    // Yangi so'zni words array'ga qo'shish
    const newWord = {
      english,
      uzbek,
      description: description || '',
      status: false,
      gameMode1: 0,
      gameMode2: 0,
      gameMode3: 0
    };
    
    typeDoc.words.push(newWord);
    typeDoc.updatedAt = new Date();
    const saved = await typeDoc.save();
    
    // Stats'ni o'chirib tashlash (yangi so'z qo'shilganda stats 0 bo'lishi kerak)
    await TypeStats.deleteOne({ type });
    
    console.log(`✅ So'z qo'shildi: Type ${type} - ${english}`);
    res.json(saved);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Type bo'yicha so'zlarni olish
app.get('/api/words/:type', async (req, res) => {
  try {
    const typeDoc = await Type.findOne({ type: req.params.type });
    
    if (!typeDoc) {
      return res.json([]);
    }
    
    // Frontend uchun words array'ni flat format'da qaytarish
    const wordsWithType = typeDoc.words.map(word => ({
      ...word.toObject(),
      type: typeDoc.type,
      displayName: typeDoc.displayName
    }));
    
    res.json(wordsWithType);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// So'zning statusini yangilash (har bir game mode uchun alohida foyiz)
app.put('/api/words/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/words/${req.params.id}`, req.body); // Debug
    
    const { status, gameMode, percentage } = req.body;
    const updateData = {};
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    // Game mode uchun foyiz yangilash
    if (gameMode && percentage !== undefined) {
      if (gameMode === 1) {
        updateData.gameMode1 = percentage;
      } else if (gameMode === 2) {
        updateData.gameMode2 = percentage;
      } else if (gameMode === 3) {
        updateData.gameMode3 = percentage;
      }
    }
    
    // Direct foyiz update (game mode field bersagina)
    if (req.body.gameMode1 !== undefined) {
      updateData.gameMode1 = req.body.gameMode1;
      console.log(`✏️ Setting gameMode1 = ${req.body.gameMode1}`);
    }
    if (req.body.gameMode2 !== undefined) {
      updateData.gameMode2 = req.body.gameMode2;
      console.log(`✏️ Setting gameMode2 = ${req.body.gameMode2}`);
    }
    if (req.body.gameMode3 !== undefined) {
      updateData.gameMode3 = req.body.gameMode3;
      console.log(`✏️ Setting gameMode3 = ${req.body.gameMode3}`);
    }
    
    console.log(`🔄 Update Data:`, updateData); // Debug
    
    // Barcha type'larni topib kerakli so'zni topish va update qilish
    let updated = null;
    const types = await Type.find();
    
    for (const typeDoc of types) {
      const wordIndex = typeDoc.words.findIndex(w => w._id.toString() === req.params.id);
      if (wordIndex !== -1) {
        Object.assign(typeDoc.words[wordIndex], updateData);
        typeDoc.updatedAt = new Date();
        await typeDoc.save();
        updated = typeDoc.words[wordIndex];
        break;
      }
    }
    
    console.log(`✅ Word updated:`, updated); // Debug
    res.json(updated || { error: 'So\'z topilmadi' });
  } catch (err) {
    console.error(`❌ Error in PUT:`, err);
    res.status(400).json('Xato: ' + err.message);
  }
});

// Batch update - type ichidagi so'zlarni update qilish
app.post('/api/batch-update', async (req, res) => {
  try {
    const { updates, type } = req.body; // [{ id, gameMode1/2/3 }, ...], type name
    
    if (!Array.isArray(updates)) {
      return res.status(400).json('Updates array bo\'lishi kerak');
    }

    console.log(`📦 Batch update boshlandi: Type ${type}, ${updates.length} ta so'z`);

    // Type document'ni topish
    const typeDoc = await Type.findOne({ type });
    if (!typeDoc) {
      return res.status(404).json('Type topilmadi');
    }

    // Har bir update uchun so'zni topib o'zgartirivish
    let updatedCount = 0;
    updates.forEach(update => {
      const { id, ...updateData } = update;
      
      const wordIndex = typeDoc.words.findIndex(w => w._id.toString() === id);
      if (wordIndex !== -1) {
        // So'zni update qilish
        Object.assign(typeDoc.words[wordIndex], updateData);
        updatedCount++;
      }
    });

    typeDoc.updatedAt = new Date();
    const savedDoc = await typeDoc.save();

    // Type stats'ni calculate qilish (faqat 0'dan katta bo'lganlari uchun)
    const gameMode1Avg = typeDoc.words.length > 0 
      ? Math.round(typeDoc.words.reduce((sum, w) => sum + (w.gameMode1 || 0), 0) / typeDoc.words.length) 
      : 0;
    const gameMode2Avg = typeDoc.words.length > 0 
      ? Math.round(typeDoc.words.reduce((sum, w) => sum + (w.gameMode2 || 0), 0) / typeDoc.words.length) 
      : 0;
    const gameMode3Avg = typeDoc.words.length > 0 
      ? Math.round(typeDoc.words.reduce((sum, w) => sum + (w.gameMode3 || 0), 0) / typeDoc.words.length) 
      : 0;

    // Type stats document'ni update qilish
    await TypeStats.findOneAndUpdate(
      { type },
      {
        type,
        totalWords: typeDoc.words.length,
        gameMode1Avg,
        gameMode2Avg,
        gameMode3Avg,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Batch update tugallandi:`, {
      updated: updatedCount,
      total: updates.length,
      stats: { gameMode1Avg, gameMode2Avg, gameMode3Avg }
    });

    res.json({
      success: true,
      updated: updatedCount,
      total: updates.length,
      stats: { gameMode1Avg, gameMode2Avg, gameMode3Avg }
    });
  } catch (err) {
    console.error(`❌ Batch update xatosi:`, err);
    res.status(400).json('Xato: ' + err.message);
  }
});

// Barcha so'zlarni olish (flat format'da)
app.get('/api/all-words', async (req, res) => {
  try {
    const types = await Type.find();
    
    // Barcha so'zlarni bitta array'da birlashtirib qaytarish
    const allWords = [];
    types.forEach(typeDoc => {
      typeDoc.words.forEach(word => {
        allWords.push({
          ...word.toObject(),
          type: typeDoc.type,
          displayName: typeDoc.displayName || ''
        });
      });
    });
    
    res.json(allWords);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Barcha type'larni olish (type va displayName bilan)
app.get('/api/types', async (req, res) => {
  try {
    const types = await Type.find().select('type displayName words');
    
    const typesData = types.map(t => ({
      type: t.type,
      displayName: t.displayName || '',
      wordCount: t.words.length
    }));
    
    res.json(typesData);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Type stats olish
app.get('/api/type-stats', async (req, res) => {
  try {
    const stats = await TypeStats.find().sort({ type: 1 });
    res.json(stats);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Bitta type stats olish
app.get('/api/type-stats/:type', async (req, res) => {
  try {
    const stats = await TypeStats.findOne({ type: req.params.type });
    res.json(stats || { type: req.params.type, gameMode1Avg: 0, gameMode2Avg: 0, gameMode3Avg: 0 });
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// So'z o'chirish
app.delete('/api/word-action', async (req, res) => {
  try {
    const type = req.query.type;
    const wordId = req.query.wordId;

    if (!type || !wordId) {
      return res.status(400).json({ error: 'Type va wordId kerak' });
    }

    const typeDoc = await Type.findOne({ type });
    if (!typeDoc) {
      return res.status(404).json({ error: 'Type topilmadi' });
    }

    // So'zni o'chirish
    typeDoc.words = typeDoc.words.filter(w => w._id.toString() !== wordId);
    typeDoc.updatedAt = new Date();
    await typeDoc.save();

    res.json({ success: true, message: "So'z o'chirildi" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// So'zni tahrirlash (type o'zgartirish ham mumkin)
app.put('/api/word-action', async (req, res) => {
  try {
    const oldType = req.query.oldType;
    const wordId = req.query.wordId;
    const { english, uzbek, description, newType, displayName } = req.body;

    console.log('📝 PUT /api/word-action received:', {
      oldType,
      wordId,
      body: { english, uzbek, description, newType, displayName }
    });

    if (!oldType || !wordId) {
      return res.status(400).json({ error: 'Type va wordId kerak' });
    }

    const oldTypeDoc = await Type.findOne({ type: oldType });
    if (!oldTypeDoc) {
      return res.status(404).json({ error: 'Type topilmadi' });
    }

    console.log('📚 Old type found:', { type: oldTypeDoc.type, displayName: oldTypeDoc.displayName, wordCount: oldTypeDoc.words.length });

    // So'zni topish
    const word = oldTypeDoc.words.find(w => w._id.toString() === wordId);
    if (!word) {
      return res.status(404).json({ error: "So'z topilmadi" });
    }

    // Agar type o'zgargan bo'lsa, so'zni yangi type'ga ko'chirish
    if (newType && newType !== oldType) {
      console.log('🔄 Type o\'zgartirilmoqda:', oldType, '→', newType);
      // Eski type'dan o'chirish
      oldTypeDoc.words = oldTypeDoc.words.filter(w => w._id.toString() !== wordId);
      oldTypeDoc.updatedAt = new Date();
      await oldTypeDoc.save();

      // Yangi type'ga qo'shish
      let newTypeDoc = await Type.findOne({ type: newType });
      if (!newTypeDoc) {
        newTypeDoc = new Type({ type: newType, displayName: displayName || '', words: [] });
      } else if (displayName) {
        newTypeDoc.displayName = displayName;
      }

      newTypeDoc.words.push({
        english,
        uzbek,
        description,
        status: word.status,
        gameMode1: word.gameMode1,
        gameMode2: word.gameMode2,
        gameMode3: word.gameMode3
      });
      newTypeDoc.updatedAt = new Date();
      await newTypeDoc.save();

      // Stats'larni o'chirish
      await TypeStats.deleteOne({ type: oldType });
      await TypeStats.deleteOne({ type: newType });
      
      console.log('✅ Type ko\'chirildi va displayName yangilandi:', newTypeDoc.displayName);
    } else {
      // Faqat so'zni yangilash
      console.log('✏️ Faqat so\'z yangilanmoqda. DisplayName:', displayName);
      word.english = english;
      word.uzbek = uzbek;
      word.description = description;
      if (displayName !== undefined) {
        console.log('🔄 DisplayName yangilanmoqda:', oldTypeDoc.displayName, '→', displayName);
        oldTypeDoc.displayName = displayName;
      }
      oldTypeDoc.updatedAt = new Date();
      await oldTypeDoc.save();
      console.log('✅ So\'z va type saqlandi. Yangi displayName:', oldTypeDoc.displayName);
    }

    res.json({ success: true, message: "So'z yangilandi" });
  } catch (err) {
    console.error('❌ Word action error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// STATIC FILES
// ==========================================

// Static fayllar
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishlayapti`);
});
