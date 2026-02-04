import { connectToDatabase, getModels } from './db.js';

// Predefined vocabulary types - hardcoded list
const VOCABULARY_TYPES = [
  { type: 'mevalar', displayName: '🍎 Mevalar' },
  { type: 'jihozlar', displayName: '🔧 Jihozlar' },
  { type: 'kasblar', displayName: '👨‍💼 Kasblar' },
  { type: 'hayvonlar', displayName: '🐾 Hayvonlar' },
  { type: 'raqamlar', displayName: '🔢 Raqamlar' },
  { type: 'rangli', displayName: '🌈 Ranglar' },
  { type: 'oilam', displayName: '👨‍👩‍👧‍👦 O\'ila Azo\'lari' },
  { type: 'jismiy', displayName: '🏃 Jismiy Mashqlar' },
  { type: 'taom', displayName: '🍽️ Taomlar' },
  { type: 'uy', displayName: '🏠 Uy Narsalari' }
];

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
    // Return hardcoded vocabulary types instead of querying database
    res.status(200).json(VOCABULARY_TYPES);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
