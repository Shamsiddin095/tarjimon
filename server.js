import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => console.error('❌ MongoDB xatosi:', err.message));

// Word Schema
// Word subdocument schema (unit ichida)
const wordSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  english: { type: String, required: true },
  uzbek: { type: String, required: true },
  status: { type: Boolean, default: false },
  gameMode1: { type: Number, default: 0 },
  gameMode2: { type: Number, default: 0 },
  gameMode3: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { _id: true });

// Unit Schema - har bir unit uchun bitta document, ichida words array
const unitSchema = new mongoose.Schema({
  unit: { type: Number, required: true, unique: true },
  words: [wordSubSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Unit = mongoose.model('Unit', unitSchema);

// UnitStats Schema - Unit bo'yicha statistika
const unitStatsSchema = new mongoose.Schema({
  unit: { type: Number, required: true, unique: true },
  totalWords: { type: Number, default: 0 },
  gameMode1Avg: { type: Number, default: 0 },
  gameMode2Avg: { type: Number, default: 0 },
  gameMode3Avg: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const UnitStats = mongoose.model('UnitStats', unitStatsSchema);

// API Routes (STATIC dan OLDIN!)
// Yangi so'z qo'shish (unit ichiga)
app.post('/api/words', async (req, res) => {
  try {
    const { english, uzbek, unit } = req.body;
    
    // Unit document'ni topish yoki yaratish
    let unitDoc = await Unit.findOne({ unit });
    
    if (!unitDoc) {
      // Yangi unit document yaratish
      unitDoc = new Unit({ unit, words: [] });
    }
    
    // Yangi so'zni words array'ga qo'shish
    const newWord = {
      english,
      uzbek,
      status: false,
      gameMode1: 0,
      gameMode2: 0,
      gameMode3: 0
    };
    
    unitDoc.words.push(newWord);
    unitDoc.updatedAt = new Date();
    const saved = await unitDoc.save();
    
    // Stats'ni o'chirib tashlash (yangi so'z qo'shilganda stats 0 bo'lishi kerak)
    await UnitStats.deleteOne({ unit });
    
    console.log(`✅ So'z qo'shildi: Unit ${unit} - ${english}`);
    res.json(saved);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Unit bo'yicha so'zlarni olish
app.get('/api/words/:unit', async (req, res) => {
  try {
    const unitDoc = await Unit.findOne({ unit: req.params.unit });
    
    if (!unitDoc) {
      return res.json([]);
    }
    
    // Frontend uchun words array'ni flat format'da qaytarish
    const wordsWithUnit = unitDoc.words.map(word => ({
      ...word.toObject(),
      unit: unitDoc.unit
    }));
    
    res.json(wordsWithUnit);
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
    
    // Barcha unitlarni topib kerakli so'zni topish va update qilish
    let updated = null;
    const units = await Unit.find();
    
    for (const unitDoc of units) {
      const wordIndex = unitDoc.words.findIndex(w => w._id.toString() === req.params.id);
      if (wordIndex !== -1) {
        Object.assign(unitDoc.words[wordIndex], updateData);
        unitDoc.updatedAt = new Date();
        await unitDoc.save();
        updated = unitDoc.words[wordIndex];
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

// Batch update - unit ichidagi so'zlarni update qilish
app.post('/api/batch-update', async (req, res) => {
  try {
    const { updates, unit } = req.body; // [{ id, gameMode1/2/3 }, ...], unit number
    
    if (!Array.isArray(updates)) {
      return res.status(400).json('Updates array bo\'lishi kerak');
    }

    console.log(`📦 Batch update boshlandi: Unit ${unit}, ${updates.length} ta so'z`);

    // Unit document'ni topish
    const unitDoc = await Unit.findOne({ unit });
    if (!unitDoc) {
      return res.status(404).json('Unit topilmadi');
    }

    // Har bir update uchun so'zni topib o'zgartirivish
    let updatedCount = 0;
    updates.forEach(update => {
      const { id, ...updateData } = update;
      
      const wordIndex = unitDoc.words.findIndex(w => w._id.toString() === id);
      if (wordIndex !== -1) {
        // So'zni update qilish
        Object.assign(unitDoc.words[wordIndex], updateData);
        updatedCount++;
      }
    });

    unitDoc.updatedAt = new Date();
    const savedDoc = await unitDoc.save();

    // Unit stats'ni calculate qilish (faqat 0'dan katta bo'lganlari uchun)
    const gameMode1Avg = unitDoc.words.length > 0 
      ? Math.round(unitDoc.words.reduce((sum, w) => sum + (w.gameMode1 || 0), 0) / unitDoc.words.length) 
      : 0;
    const gameMode2Avg = unitDoc.words.length > 0 
      ? Math.round(unitDoc.words.reduce((sum, w) => sum + (w.gameMode2 || 0), 0) / unitDoc.words.length) 
      : 0;
    const gameMode3Avg = unitDoc.words.length > 0 
      ? Math.round(unitDoc.words.reduce((sum, w) => sum + (w.gameMode3 || 0), 0) / unitDoc.words.length) 
      : 0;

    // Unit stats document'ni update qilish
    await UnitStats.findOneAndUpdate(
      { unit },
      {
        unit,
        totalWords: unitDoc.words.length,
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
    const units = await Unit.find();
    
    // Barcha so'zlarni bitta array'da birlashtirib qaytarish
    const allWords = [];
    units.forEach(unitDoc => {
      unitDoc.words.forEach(word => {
        allWords.push({
          ...word.toObject(),
          unit: unitDoc.unit
        });
      });
    });
    
    res.json(allWords);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Unit stats olish
app.get('/api/unit-stats', async (req, res) => {
  try {
    const stats = await UnitStats.find().sort({ unit: 1 });
    res.json(stats);
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Bitta unit stats olish
app.get('/api/unit-stats/:unit', async (req, res) => {
  try {
    const stats = await UnitStats.findOne({ unit: parseInt(req.params.unit) });
    res.json(stats || { unit: req.params.unit, gameMode1Avg: 0, gameMode2Avg: 0, gameMode3Avg: 0 });
  } catch (err) {
    res.status(400).json('Xato: ' + err.message);
  }
});

// Static fayllar
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishlayapti`);
});
