import { connectToDatabase, getModels } from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { Unit } = getModels();

    const units = await Unit.find().select('unit unitName words');
    
    const unitsData = units.map(u => ({
      unit: u.unit,
      unitName: u.unitName || '',
      wordCount: u.words.length
    }));
    
    res.json(unitsData);
  } catch (error) {
    console.error('Units fetch error:', error);
    res.status(500).json({ error: error.message });
  }
}
