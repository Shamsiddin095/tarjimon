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
    const { Type } = getModels();
    const { id } = req.query;

    if (req.method === 'GET') {
      // So'z ID'si bo'yicha olish
      const types = await Type.find();
      
      for (const typeDoc of types) {
        const word = typeDoc.words.find(w => w._id.toString() === id);
        if (word) {
          return res.json({
            ...word.toObject(),
            type: typeDoc.type
          });
        }
      }
      
      return res.status(404).json({ error: 'So\'z topilmadi' });
    } 
    else if (req.method === 'PUT') {
      // So'zni yangilash
      const { gameMode1, gameMode2, gameMode3, status, known, mastered } = req.body;
      const updateData = {};

      if (gameMode1 !== undefined) updateData.gameMode1 = gameMode1;
      if (gameMode2 !== undefined) updateData.gameMode2 = gameMode2;
      if (gameMode3 !== undefined) updateData.gameMode3 = gameMode3;
      if (status !== undefined) updateData.status = status;
      if (known !== undefined) updateData.known = known;
      if (mastered !== undefined) updateData.mastered = mastered;

      // Barcha type'larni topib kerakli so'zni topish va update qilish
      let updated = null;
      const types = await Type.find();
      
      for (const typeDoc of types) {
        const wordIndex = typeDoc.words.findIndex(w => w._id.toString() === id);
        if (wordIndex !== -1) {
          Object.assign(typeDoc.words[wordIndex], updateData);
          typeDoc.updatedAt = new Date();
          await typeDoc.save();
          updated = {
            ...typeDoc.words[wordIndex].toObject(),
            type: typeDoc.type
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
