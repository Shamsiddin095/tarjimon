const connectDB = require('./db');
const { AudioTrack } = require('./ielts-db');

module.exports = async (req, res) => {
    await connectDB();
    
    const { method } = req;
    const { stage } = req.query;
    
    try {
        if (method === 'GET') {
            // Get all audio tracks for a stage
            const query = stage ? { stage } : {};
            const tracks = await AudioTrack.find(query).sort({ uploadedAt: -1 });
            
            return res.status(200).json(tracks);
        }
        
        if (method === 'POST') {
            // Register new audio track
            const { stage, fileName, displayName, duration, isDefault } = req.body;
            
            if (!stage || !fileName || !displayName) {
                return res.status(400).json({ 
                    error: 'stage, fileName, displayName majburiy' 
                });
            }
            
            // Check if already exists
            const existing = await AudioTrack.findOne({ stage, fileName });
            if (existing) {
                return res.status(400).json({ 
                    error: 'Bu audio allaqachon mavjud' 
                });
            }
            
            const track = new AudioTrack({
                stage,
                fileName,
                displayName,
                duration: duration || 0,
                isDefault: isDefault || false
            });
            
            await track.save();
            
            return res.status(201).json({
                message: 'Audio track ro\'yxatga olindi',
                track
            });
        }
        
        if (method === 'DELETE') {
            // Delete audio track
            const { id } = req.query;
            
            const track = await AudioTrack.findByIdAndDelete(id);
            
            if (!track) {
                return res.status(404).json({ error: 'Track topilmadi' });
            }
            
            return res.status(200).json({
                message: 'Track o\'chirildi'
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Audio tracks API error:', error);
        return res.status(500).json({ 
            error: 'Server xatosi',
            details: error.message 
        });
    }
};
