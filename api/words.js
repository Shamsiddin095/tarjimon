import { connectToDatabase, getModels } from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();
    const { Unit } = getModels();

    if (req.method === 'POST') {
      // Yangi so'z qo'shish
      const { english, uzbek, unit } = req.body;
      
      if (!english || !uzbek || !unit) {
        return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi kerak' });
      }

      let unitDoc = await Unit.findOne({ unit });
      
      if (!unitDoc) {
        unitDoc = new Unit({ unit, words: [] });
      }
      
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
      res.status(201).json(saved);
    } 
    else if (req.method === 'GET') {
      // Unit bo'yicha so'zlarni olish
      const { unit } = req.query;
      
      if (unit) {
        const unitDoc = await Unit.findOne({ unit: parseInt(unit) });
        if (!unitDoc) {
          return res.json([]);
        }
        
        const wordsWithUnit = unitDoc.words.map(word => ({
          ...word.toObject(),
          unit: unitDoc.unit
        }));
        res.json(wordsWithUnit);
      } else {
        res.status(400).json({ error: 'unit parameter kerak' });
      }
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
