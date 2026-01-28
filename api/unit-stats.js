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
    const { UnitStats, Unit } = getModels();

    // Barcha stats'ni olish
    const stats = await UnitStats.find().sort({ unit: 1 });
    
    // Barcha unit'larni olish
    const units = await Unit.find().sort({ unit: 1 });
    
    // Stats bo'lmagan unitlar uchun default stats qo'shish
    const unitNumbers = units.map(u => u.unit);
    const statsByUnit = {};
    
    // Mavjud stats'ni map'ga qo'shish
    stats.forEach(stat => {
      statsByUnit[stat.unit] = stat;
    });
    
    // Barcha unitlar uchun stats qaytarish (default 0 bilan yangi unitlar)
    const allStats = unitNumbers.map(unitNum => {
      return statsByUnit[unitNum] || {
        unit: unitNum,
        totalWords: 0,
        gameMode1Avg: 0,
        gameMode2Avg: 0,
        gameMode3Avg: 0,
        lastUpdated: new Date()
      };
    });
    
    res.status(200).json(allStats);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
