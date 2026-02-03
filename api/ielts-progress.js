const connectDB = require('./db');
const { IELTSProgress } = require('./ielts-db');

module.exports = async (req, res) => {
    await connectDB();
    
    const { method } = req;
    
    try {
        if (method === 'GET') {
            // Get user progress
            const { trainingId, userId } = req.query;
            
            const query = {};
            if (trainingId) query.training = trainingId;
            if (userId) query.userId = userId;
            
            const progress = await IELTSProgress.find(query)
                .populate('training')
                .sort({ completedAt: -1 });
            
            return res.status(200).json(progress);
        }
        
        if (method === 'POST') {
            // Submit training results
            const {
                userId,
                trainingId,
                gameMode,
                answers,
                rawScore,
                bandScore,
                aiFeedback,
                timeSpent
            } = req.body;
            
            if (!trainingId || !gameMode) {
                return res.status(400).json({ 
                    error: 'trainingId va gameMode majburiy' 
                });
            }
            
            const progress = new IELTSProgress({
                userId: userId || 'guest',
                training: trainingId,
                gameMode,
                answers: answers || [],
                rawScore: rawScore || 0,
                bandScore: bandScore || 0,
                aiFeedback: aiFeedback || {},
                timeSpent: timeSpent || 0
            });
            
            await progress.save();
            
            return res.status(201).json({
                message: 'Natija saqlandi',
                progress
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('IELTS progress API error:', error);
        return res.status(500).json({ 
            error: 'Server xatosi',
            details: error.message 
        });
    }
};
