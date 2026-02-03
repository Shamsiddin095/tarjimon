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
    const { Type, TypeStats } = getModels();

    if (req.method === 'POST') {
      // Yangi so'z qo'shish
      const { english, uzbek, type, description } = req.body;
      
      if (!english || !uzbek || !type) {
        return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi kerak' });
      }

      let typeDoc = await Type.findOne({ type });
      
      if (!typeDoc) {
        typeDoc = new Type({ type, words: [] });
      }
      
      const newWord = {
        english,
        uzbek,
        description: description || null, // Tavsif bo'lsa qo'shish
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
      
      res.status(201).json(saved);
    } 
    else if (req.method === 'GET') {
      // Type bo'yicha so'zlarni olish
      // URL dan: /api/words/mevalar yoki query dan: /api/words?type=mevalar
      let type = req.query.type;
      
      // Agar URL path'dan kelsa
      if (!type && req.url.includes('/api/words/')) {
        const match = req.url.match(/\/api\/words\/([a-zA-Z0-9_-]+)/);
        if (match) {
          type = match[1];
        }
      }
      
      if (type) {
        const typeDoc = await Type.findOne({ type });
        if (!typeDoc) {
          return res.json([]);
        }
        
        const wordsWithType = typeDoc.words.map(word => ({
          ...word.toObject(),
          type: typeDoc.type,
          displayName: typeDoc.displayName
        }));
        res.json(wordsWithType);
      } else {
        res.status(400).json({ error: 'type parameter kerak' });
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
