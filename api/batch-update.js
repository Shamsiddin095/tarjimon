import { connectToDatabase, getModels } from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const { Type, TypeStats } = getModels();

    const { updates, type } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates array bo\'lishi kerak' });
    }

    console.log(`📦 Batch update boshlandi: Type ${type}, ${updates.length} ta so'z`);

    // Type document'ni topish
    const typeDoc = await Type.findOne({ type });
    if (!typeDoc) {
      return res.status(404).json({ error: 'Type topilmadi' });
    }

    // Har bir update uchun so'zni topib o'zgartirivish
    let updatedCount = 0;
    updates.forEach(update => {
      const { id, ...updateData } = update;
      
      const wordIndex = typeDoc.words.findIndex(w => w._id.toString() === id);
      if (wordIndex !== -1) {
        Object.assign(typeDoc.words[wordIndex], updateData);
        updatedCount++;
      }
    });

    typeDoc.updatedAt = new Date();
    const savedDoc = await typeDoc.save();

    // Type stats'ni calculate qilish (0'dan katta bo'lganlari uchun)
    const gameMode1Avg = typeDoc.words.length > 0 
      ? Math.round(typeDoc.words.reduce((sum, w) => sum + (w.gameMode1 || 0), 0) / typeDoc.words.length) 
      : 0;
    const gameMode2Avg = typeDoc.words.length > 0 
      ? Math.round(typeDoc.words.reduce((sum, w) => sum + (w.gameMode2 || 0), 0) / typeDoc.words.length) 
      : 0;
    const gameMode3Avg = typeDoc.words.length > 0 
      ? Math.round(typeDoc.words.reduce((sum, w) => sum + (w.gameMode3 || 0), 0) / typeDoc.words.length) 
      : 0;

    // Type stats document'ni update qilish
    await TypeStats.findOneAndUpdate(
      { type },
      {
        type,
        totalWords: typeDoc.words.length,
        gameMode1Avg,
        gameMode2Avg,
        gameMode3Avg,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Batch update tugallandi:`, {
      updated: updatedCount,
      total: updates.length,
      stats: { gameMode1Avg, gameMode2Avg, gameMode3Avg }
    });

    res.status(200).json({
      success: true,
      updated: updatedCount,
      total: updates.length,
      stats: { gameMode1Avg, gameMode2Avg, gameMode3Avg }
    });
  } catch (error) {
    console.error('❌ Batch update xatosi:', error);
    res.status(500).json({ error: error.message });
  }
}
