export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'ok',
    message: 'API test endpoint is working',
    hostname: process.env.VERCEL_URL || 'localhost',
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
