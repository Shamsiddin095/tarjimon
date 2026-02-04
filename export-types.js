import 'dotenv/config.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MongoDB schema
const typeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  displayName: { type: String, default: '' },
  words: [{
    english: String,
    uzbek: String,
    description: String,
    status: { type: Boolean, default: false },
    gameMode1: { type: Number, default: 0 },
    gameMode2: { type: Number, default: 0 },
    gameMode3: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Type = mongoose.model('Type', typeSchema);

async function exportTypes() {
  try {
    // MongoDB'ga ulanish
    console.log('MongoDB ga ulanilmoqda...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('MongoDB ga ulandi!');

    // Barcha typelarni bazadan o'qish
    console.log('\nBarcha typelarni bazadan o\'qish...');
    const allTypes = await Type.find().sort({ type: 1 });
    console.log(`${allTypes.length} ta type topildi`);

    // JSON strukturasiga tayyorlash
    const exportData = allTypes.map(typeDoc => ({
      type: typeDoc.type,
      displayName: typeDoc.displayName || '',
      words: typeDoc.words || [],
      createdAt: typeDoc.createdAt,
      updatedAt: typeDoc.updatedAt
    }));

    // Vaqt bilan fayl nomi yaratish
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `backup-types-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);

    // Faylga yozish
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`\nFayl saqlandi: ${filename}`);

    // Statistika
    console.log('\nStatistika:');
    console.log(`  Jami type: ${exportData.length}`);
    let totalWords = 0;
    exportData.forEach(t => {
      totalWords += t.words.length;
    });
    console.log(`  Jami so'z: ${totalWords}`);
    console.log(`  O'rtacha so'z: ${Math.round(totalWords / exportData.length)}`);

    // Har bir type'dagi so'z soni
    console.log('\nTyepa ko\'ra so\'z soni:');
    exportData.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.displayName} (${t.type}) - ${t.words.length} so'z`);
    });

    await mongoose.disconnect();
    console.log(`\nTayyor! Backup fayli: ${filename}`);
  } catch (error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

exportTypes();
