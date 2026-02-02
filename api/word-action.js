import { connectToDatabase, getModels } from './db.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();
    const { Unit, UnitStats } = getModels();

    const { unit, wordId, oldUnit } = req.query;
    
    if ((!unit && !oldUnit) || !wordId) {
      return res.status(400).json({ error: 'Unit va wordId kerak' });
    }

    const unitNumber = parseFloat(oldUnit || unit);
    const unitDoc = await Unit.findOne({ unit: unitNumber });
    
    if (!unitDoc) {
      return res.status(404).json({ error: 'Unit topilmadi' });
    }

    if (req.method === 'DELETE') {
      // So'zni o'chirish
      unitDoc.words = unitDoc.words.filter(word => word._id.toString() !== wordId);
      unitDoc.updatedAt = new Date();
      await unitDoc.save();
      
      return res.json({ success: true, message: 'So\'z o\'chirildi' });
    } 
    else if (req.method === 'PUT' || req.method === 'PATCH') {
      // So'zni tahrirlash (unit o'zgartirish ham mumkin)
      const { english, uzbek, description, newUnit, unitName } = req.body;
      
      const word = unitDoc.words.find(w => w._id.toString() === wordId);
      
      if (!word) {
        return res.status(404).json({ error: 'So\'z topilmadi' });
      }
      
      // Agar unit o'zgargan bo'lsa, so'zni yangi unit'ga ko'chirish
      if (newUnit && newUnit !== unitNumber) {
        // Eski unit'dan o'chirish
        unitDoc.words = unitDoc.words.filter(w => w._id.toString() !== wordId);
        unitDoc.updatedAt = new Date();
        await unitDoc.save();

        // Yangi unit'ga qo'shish
        let newUnitDoc = await Unit.findOne({ unit: newUnit });
        if (!newUnitDoc) {
          newUnitDoc = new Unit({ unit: newUnit, unitName: unitName || '', words: [] });
        } else if (unitName) {
          newUnitDoc.unitName = unitName;
        }

        newUnitDoc.words.push({
          english,
          uzbek,
          description,
          status: word.status,
          gameMode1: word.gameMode1,
          gameMode2: word.gameMode2,
          gameMode3: word.gameMode3
        });
        newUnitDoc.updatedAt = new Date();
        await newUnitDoc.save();

        // Stats'larni o'chirish
        await UnitStats.deleteOne({ unit: unitNumber });
        await UnitStats.deleteOne({ unit: newUnit });
      } else {
        // Faqat so'zni yangilash
        word.english = english;
        word.uzbek = uzbek;
        word.description = description;
        if (unitName !== undefined) {
          unitDoc.unitName = unitName;
        }
        unitDoc.updatedAt = new Date();
        await unitDoc.save();
      }
      
      return res.json({ success: true, message: 'So\'z yangilandi' });
    }
    
  } catch (error) {
    console.error('Word operation error:', error);
    res.status(500).json({ error: error.message });
  }
}
