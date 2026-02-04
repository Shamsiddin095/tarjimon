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

    // Get all vocabulary types (type names and display names) - bo'sh types'ni o'tkazib yuborish
    const types = await Type.find().select('type displayName words');
    
    const vocabularyTypes = types
      .filter(t => t.words && t.words.length > 0) // Faqat so'zlari bor types
      .map(t => ({
        type: t.type,
        displayName: t.displayName || t.type
      }));
    
    res.status(200).json(vocabularyTypes);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
