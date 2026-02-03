import { connectToDatabase, getModels } from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { Type } = getModels();

    // Barcha so'zlarni olish
    const types = await Type.find();
    
    const allWords = [];
    types.forEach(typeDoc => {
      typeDoc.words.forEach(word => {
        allWords.push({
          ...word.toObject(),
          type: typeDoc.type,
          displayName: typeDoc.displayName
        });
      });
    });
    
    res.status(200).json(allWords);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
