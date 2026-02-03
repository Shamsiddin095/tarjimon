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
    const { Type, TypeStats } = getModels();

    const { type, wordId, oldType } = req.query;
    
    if ((!type && !oldType) || !wordId) {
      return res.status(400).json({ error: 'Type va wordId kerak' });
    }

    const typeStr = oldType || type;
    const typeDoc = await Type.findOne({ type: typeStr });
    
    if (!typeDoc) {
      return res.status(404).json({ error: 'Type topilmadi' });
    }

    if (req.method === 'DELETE') {
      // So'zni o'chirish
      typeDoc.words = typeDoc.words.filter(word => word._id.toString() !== wordId);
      typeDoc.updatedAt = new Date();
      await typeDoc.save();
      
      return res.json({ success: true, message: 'So\'z o\'chirildi' });
    } 
    else if (req.method === 'PUT' || req.method === 'PATCH') {
      // So'zni tahrirlash (type o'zgartirish ham mumkin)
      const { english, uzbek, description, newType, displayName } = req.body;
      
      const word = typeDoc.words.find(w => w._id.toString() === wordId);
      
      if (!word) {
        return res.status(404).json({ error: 'So\'z topilmadi' });
      }
      
      // Agar type o'zgargan bo'lsa, so'zni yangi type'ga ko'chirish
      if (newType && newType !== typeStr) {
        // Eski type'dan o'chirish
        typeDoc.words = typeDoc.words.filter(w => w._id.toString() !== wordId);
        typeDoc.updatedAt = new Date();
        await typeDoc.save();

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
        await TypeStats.deleteOne({ type: typeStr });
        await TypeStats.deleteOne({ type: newType });
      } else {
        // Faqat so'zni yangilash
        word.english = english;
        word.uzbek = uzbek;
        word.description = description;
        if (displayName !== undefined) {
          typeDoc.displayName = displayName;
        }
        typeDoc.updatedAt = new Date();
        await typeDoc.save();
      }
      
      return res.json({ success: true, message: 'So\'z yangilandi' });
    }
    
  } catch (error) {
    console.error('Word operation error:', error);
    res.status(500).json({ error: error.message });
  }
}
