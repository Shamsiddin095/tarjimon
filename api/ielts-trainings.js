const connectDB = require('./db');
const { IELTSTraining, AudioTrack } = require('./ielts-db');

module.exports = async (req, res) => {
    await connectDB();
    
    const { method } = req;
    const { stage } = req.query;
    
    try {
        if (method === 'GET') {
            // Get all trainings for a stage
            const query = stage ? { stage } : {};
            const trainings = await IELTSTraining.find(query)
                .populate('audioTrack')
                .sort({ createdAt: -1 });
            
            return res.status(200).json(trainings);
        }
        
        if (method === 'POST') {
            // Create new training
            const {
                stage,
                title,
                description,
                audioTrackId,
                section,
                content,
                questions,
                timeLimit,
                difficulty
            } = req.body;
            
            if (!stage || !title || !timeLimit) {
                return res.status(400).json({ 
                    error: 'stage, title, timeLimit majburiy' 
                });
            }
            
            // Audio path
            let audioPath = null;
            if (audioTrackId) {
                const track = await AudioTrack.findById(audioTrackId);
                if (track) {
                    audioPath = `/tracks/${track.stage}/${track.fileName}`;
                }
            } else {
                // Default audio
                audioPath = `/tracks/${stage}/default.mp3`;
            }
            
            const training = new IELTSTraining({
                stage,
                title,
                description,
                audioTrack: audioTrackId || null,
                audioPath,
                section,
                content,
                questions: questions || [],
                timeLimit,
                difficulty: difficulty || 'medium'
            });
            
            await training.save();
            
            return res.status(201).json({
                message: 'Training muvaffaqiyatli yaratildi',
                training
            });
        }
        
        if (method === 'PUT') {
            // Update training
            const { id } = req.query;
            const updateData = req.body;
            
            const training = await IELTSTraining.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );
            
            if (!training) {
                return res.status(404).json({ error: 'Training topilmadi' });
            }
            
            return res.status(200).json({
                message: 'Training yangilandi',
                training
            });
        }
        
        if (method === 'DELETE') {
            // Delete training
            const { id } = req.query;
            
            const training = await IELTSTraining.findByIdAndDelete(id);
            
            if (!training) {
                return res.status(404).json({ error: 'Training topilmadi' });
            }
            
            return res.status(200).json({
                message: 'Training o\'chirildi'
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('IELTS trainings API error:', error);
        return res.status(500).json({ 
            error: 'Server xatosi',
            details: error.message 
        });
    }
};
