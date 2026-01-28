import { connectToDatabase, getModels } from '../db.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();
    const { Unit, UnitStats } = getModels();
    const { id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID noto\'g\'ri' });
    }

    if (req.method === 'PUT') {
      // So'zning statusini yangilash
      const { unit, ...updateData } = req.body;
      
      // Unit document'ni topish
      const unitDoc = await Unit.findOne({ unit: parseInt(unit) });
      if (!unitDoc) {
        return res.status(404).json({ error: 'Unit topilmadi' });
      }

      // So'zni topib o'zgartirivish
      const wordIndex = unitDoc.words.findIndex(w => w._id.toString() === id);
      if (wordIndex === -1) {
        return res.status(404).json({ error: 'So\'z topilmadi' });
      }

      // Update data
      Object.assign(unitDoc.words[wordIndex], updateData);
      unitDoc.updatedAt = new Date();
      await unitDoc.save();

      res.status(200).json(unitDoc.words[wordIndex]);
    } 
    else if (req.method === 'GET') {
      // Unit document'ni topish va so'zni qaytarish
      const { unit } = req.query;
      
      if (!unit) {
        return res.status(400).json({ error: 'unit parameter kerak' });
      }

      const unitDoc = await Unit.findOne({ unit: parseInt(unit) });
      if (!unitDoc) {
        return res.status(404).json({ error: 'Unit topilmadi' });
      }

      const word = unitDoc.words.find(w => w._id.toString() === id);
      if (!word) {
        return res.status(404).json({ error: 'So\'z topilmadi' });
      }

      res.status(200).json(word);
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('API Xatosi:', err);
    res.status(500).json({ error: 'Xato: ' + err.message });
  }
}
