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

    const types = await Type.find().select('type displayName words');
    
    const typesData = types.map(t => ({
      type: t.type,
      displayName: t.displayName || '',
      wordCount: t.words.length
    }));
    
    res.status(200).json(typesData);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
