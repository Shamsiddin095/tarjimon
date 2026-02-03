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

    const types = await Type.find();
    
    const stats = types.map(typeDoc => {
      const totalWords = typeDoc.words.length;
      const masteredWords = typeDoc.words.filter(w => w.mastered === true).length;
      const knownWords = typeDoc.words.filter(w => w.known === true || w.mastered === true).length;
      const learningWords = typeDoc.words.filter(w => w.known === false && w.mastered === false).length;
      
      return {
        type: typeDoc.type,
        displayName: typeDoc.displayName || typeDoc.type,
        total: totalWords,
        mastered: masteredWords,
        known: knownWords,
        learning: learningWords,
        masteredPercentage: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
        knownPercentage: totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0
      };
    });
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
