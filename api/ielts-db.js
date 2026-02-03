const mongoose = require('mongoose');

// ==========================================
// IELTS AUDIO TRACK SCHEMA
// ==========================================
const AudioTrackSchema = new mongoose.Schema({
    stage: {
        type: String,
        enum: ['listening', 'reading', 'writing', 'speaking'],
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    duration: Number, // seconds
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

// ==========================================
// IELTS TRAINING (TASK) SCHEMA
// ==========================================
const IELTSTrainingSchema = new mongoose.Schema({
    stage: {
        type: String,
        enum: ['listening', 'reading', 'writing', 'speaking'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    
    // Audio reference
    audioTrack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AudioTrack'
    },
    audioPath: String, // /tracks/{stage}/{fileName}.mp3
    
    // Listening specific
    section: {
        type: Number,
        min: 1,
        max: 4
    },
    
    // Task content
    content: {
        type: String // Matn (Reading), instructions (Writing/Speaking)
    },
    
    // Questions
    questions: [{
        type: {
            type: String,
            enum: ['fill-blank', 'form-completion', 'true-false-notgiven', 'heading-match', 'essay', 'speaking-prompt'],
            required: true
        },
        questionText: String,
        options: [String], // For multiple choice
        correctAnswer: String, // For objective questions
        orderNumber: Number
    }],
    
    // Timing
    timeLimit: {
        type: Number, // minutes
        required: true
    },
    
    // Difficulty
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ==========================================
// USER IELTS PROGRESS SCHEMA
// ==========================================
const IELTSProgressSchema = new mongoose.Schema({
    userId: String, // For future user system
    training: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IELTSTraining',
        required: true
    },
    
    gameMode: {
        type: String,
        enum: ['practice', 'exam', 'challenge'],
        required: true
    },
    
    // Results
    answers: [{
        questionIndex: Number,
        userAnswer: String,
        isCorrect: Boolean,
        timeTaken: Number // seconds
    }],
    
    rawScore: Number,
    bandScore: Number, // 0-9
    
    // AI Feedback (Writing/Speaking)
    aiFeedback: {
        taskAchievement: Number,
        vocabulary: Number,
        grammar: Number,
        coherence: Number,
        fluency: Number,
        pronunciation: Number,
        feedback: String
    },
    
    timeSpent: Number, // seconds
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// ==========================================
// EXPORT MODELS
// ==========================================
const AudioTrack = mongoose.models.AudioTrack || mongoose.model('AudioTrack', AudioTrackSchema);
const IELTSTraining = mongoose.models.IELTSTraining || mongoose.model('IELTSTraining', IELTSTrainingSchema);
const IELTSProgress = mongoose.models.IELTSProgress || mongoose.model('IELTSProgress', IELTSProgressSchema);

module.exports = {
    AudioTrack,
    IELTSTraining,
    IELTSProgress
};
