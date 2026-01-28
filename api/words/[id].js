import { connectToDatabase, getModels } from '../db.js';

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
    const { id } = req.query;

    if (req.method === 'GET') {
      // So'z ID'si bo'yicha olish
      const units = await Unit.find();
      
      for (const unitDoc of units) {
        const word = unitDoc.words.find(w => w._id.toString() === id);
        if (word) {
          return res.json({
            ...word.toObject(),
            unit: unitDoc.unit
          });
        }
      }
      
      return res.status(404).json({ error: 'So\'z topilmadi' });
    } 
    else if (req.method === 'PUT') {
      // So'zni yangilash
      const { gameMode1, gameMode2, gameMode3, status } = req.body;
      const updateData = {};

      if (gameMode1 !== undefined) updateData.gameMode1 = gameMode1;
      if (gameMode2 !== undefined) updateData.gameMode2 = gameMode2;
      if (gameMode3 !== undefined) updateData.gameMode3 = gameMode3;
      if (status !== undefined) updateData.status = status;

      // Barcha unitlarni topib kerakli so'zni topish va update qilish
      let updated = null;
      const units = await Unit.find();
      
      for (const unitDoc of units) {
        const wordIndex = unitDoc.words.findIndex(w => w._id.toString() === id);
        if (wordIndex !== -1) {
          Object.assign(unitDoc.words[wordIndex], updateData);
          unitDoc.updatedAt = new Date();
          await unitDoc.save();
          updated = {
            ...unitDoc.words[wordIndex].toObject(),
            unit: unitDoc.unit
          };
          break;
        }
      }
      
      if (!updated) {
        return res.status(404).json({ error: 'So\'z topilmadi' });
      }
      
      res.json(updated);
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
