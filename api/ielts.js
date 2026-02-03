// Consolidated IELTS API Routes
// Birlashtirilgan IELTS API
const mongoose = require('mongoose');
const connectDB = require('./db');

// ==========================================
// IELTS SCHEMAS
// ==========================================
const audioTrackSchema = new mongoose.Schema({
  stage: { type: String, enum: ['listening', 'reading', 'writing', 'speaking'], required: true },
  fileName: { type: String, required: true },
  displayName: { type: String, required: true },
  duration: Number,
  uploadedAt: { type: Date, default: Date.now },
  isDefault: { type: Boolean, default: false }
});

const ieltsTrainingSchema = new mongoose.Schema({
  stage: { type: String, enum: ['listening', 'reading', 'writing', 'speaking'], required: true },
  title: { type: String, required: true },
  description: String,
  audioTrack: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioTrack' },
  audioPath: String,
  section: Number,
  content: String,
  questions: [{
    type: { type: String, required: true },
    questionText: String,
    options: [String],
    correctAnswer: String,
    orderNumber: Number
  }],
  timeLimit: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now }
});

const ieltsProgressSchema = new mongoose.Schema({
  userId: String,
  training: { type: mongoose.Schema.Types.ObjectId, ref: 'IELTSTraining', required: true },
  gameMode: { type: String, enum: ['practice', 'exam', 'challenge'], required: true },
  answers: [{
    questionIndex: Number,
    userAnswer: String,
    isCorrect: Boolean,
    timeTaken: Number
  }],
  rawScore: Number,
  bandScore: Number,
  aiFeedback: {
    taskAchievement: Number,
    vocabulary: Number,
    grammar: Number,
    coherence: Number,
    fluency: Number,
    pronunciation: Number,
    feedback: String
  },
  timeSpent: Number,
  completedAt: { type: Date, default: Date.now }
});

// Models
const AudioTrack = mongoose.model('AudioTrack', audioTrackSchema);
const IELTSTraining = mongoose.model('IELTSTraining', ieltsTrainingSchema);
const IELTSProgress = mongoose.model('IELTSProgress', ieltsProgressSchema);

module.exports = async (req, res) => {
    await connectDB();
    
    const { method } = req;
    const { type } = req.query;
    
    try {
        // ==========================================
        // AUDIO ROUTES
        // ==========================================
        if (type === 'audio') {
            if (method === 'GET') {
                // Get all audio tracks for a stage
                const { stage } = req.query;
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
                
                if (!id) {
                    return res.status(400).json({ error: 'id majburiy' });
                }
                
                const track = await AudioTrack.findByIdAndDelete(id);
                
                if (!track) {
                    return res.status(404).json({ error: 'Audio topilmadi' });
                }
                
                return res.status(200).json({
                    message: 'Audio o\'chirildi',
                    track
                });
            }
            
            return res.status(405).json({ error: 'Method not allowed' });
        }
        
        // ==========================================
        // TRAINING ROUTES
        // ==========================================
        if (type === 'training') {
            if (method === 'GET') {
                // Get all trainings for a stage
                const { stage } = req.query;
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
                    section: section || 1,
                    content,
                    questions: questions || [],
                    timeLimit,
                    difficulty: difficulty || 'medium'
                });
                
                await training.save();
                
                return res.status(201).json({
                    message: 'Training yaratildi',
                    training
                });
            }
            
            if (method === 'PUT') {
                // Update training
                const { id } = req.query;
                const updates = req.body;
                
                if (!id) {
                    return res.status(400).json({ error: 'id majburiy' });
                }
                
                const training = await IELTSTraining.findByIdAndUpdate(
                    id,
                    updates,
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
                
                if (!id) {
                    return res.status(400).json({ error: 'id majburiy' });
                }
                
                const training = await IELTSTraining.findByIdAndDelete(id);
                
                if (!training) {
                    return res.status(404).json({ error: 'Training topilmadi' });
                }
                
                return res.status(200).json({
                    message: 'Training o\'chirildi',
                    training
                });
            }
            
            return res.status(405).json({ error: 'Method not allowed' });
        }
        
        // ==========================================
        // PROGRESS ROUTES
        // ==========================================
        if (type === 'progress') {
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
            
            if (method === 'DELETE') {
                // Delete progress record
                const { id } = req.query;
                
                if (!id) {
                    return res.status(400).json({ error: 'id majburiy' });
                }
                
                const progress = await IELTSProgress.findByIdAndDelete(id);
                
                if (!progress) {
                    return res.status(404).json({ error: 'Progress topilmadi' });
                }
                
                return res.status(200).json({
                    message: 'Progress o\'chirildi',
                    progress
                });
            }
            
            return res.status(405).json({ error: 'Method not allowed' });
        }
        
        // Default response
        return res.status(400).json({ 
            error: 'type parametri majburiy (audio, training, progress)' 
        });
        
    } catch (error) {
        console.error('IELTS API error:', error);
        return res.status(500).json({ 
            error: error.message || 'Server xatosi' 
        });
    }
};
