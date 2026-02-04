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
    gameMode3: { type: Number, default: 0 },
    tenses: [{
      name: String,
      form: String,
      uzbek: String,
      example: String,
      exampleUzbek: String
    }]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Type = mongoose.model('Type', typeSchema);

async function loadTypes() {
  try {
    // MongoDB'ga ulanish
    console.log('MongoDB ga ulanilmoqda...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('MongoDB ga ulandi!');

    // types.json faylini o'qish
    const typesPath = path.join(__dirname, 'types.json');
    const typesData = JSON.parse(fs.readFileSync(typesPath, 'utf-8'));
    console.log(`${typesData.length} ta type topildi`);

    // Barcha eski typelarni o'chirish
    console.log('\nBarcha eski typelarni o\'chirish...');
    const deleteResult = await Type.deleteMany({});
    console.log(`${deleteResult.deletedCount} ta type o'chirildi`);

    // Har bir type'ni yuklash
    console.log('\nTypelarni yuklash...');
    let created = 0;

    for (const typeData of typesData) {
      // Yangi type yaratish
      await Type.create(typeData);
      console.log(`Yaratildi: ${typeData.displayName}`);
      created++;
    }

    console.log('\nNatija:');
    console.log(`  Yaratildi: ${created}`);
    console.log(`  Jami: ${typesData.length}`);

    // Barcha typelarni ko'rsatish
    console.log('\nMongoDB dagi barcha typelar:');
    const allTypes = await Type.find().select('type displayName words');
    allTypes.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.displayName} (${t.type}) - ${t.words.length} so'z`);
    });

    await mongoose.disconnect();
    console.log('\nTayyor! MongoDB uzilib qoldi.');
  } catch (error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

loadTypes();
