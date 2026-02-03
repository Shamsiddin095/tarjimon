# 🎯 IELTS TRAINING SYSTEM - Quick Start Guide

## 📋 TIZIM HAQIDA

IELTS Training - to'liq funktsional IELTS tayyorlov tizimi:

### ✨ Asosiy Imkoniyatlar

- 🎧 **Listening** - Audio trainings with fill-blank, form completion
- 📖 **Reading** - Text-based trainings with True/False/Not Given
- ✍️ **Writing** - Essay tasks with AI evaluation (planned)
- 🗣️ **Speaking** - Audio recording with AI feedback (planned)

### 🎮 3 Game Modes

1. **Practice** 🎮 - Unlimited attempts, immediate feedback
2. **Exam** 📝 - Real IELTS conditions, strict timer
3. **Challenge** ⚡ - Reduced time, bonus points, leaderboard

---

## 🚀 QUICK START

### 1. Installation

```bash
cd d:/projects/vocab-app
npm install
```

### 2. Environment Setup

Create `.env` file:
```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

### 3. Run Server

```bash
node server.js
```

### 4. Open Browser

```
http://localhost:3000
```

---

## 📂 PROJECT STRUCTURE

```
vocab-app/
├── api/
│   ├── ielts-db.js           # IELTS MongoDB schemas
│   ├── ielts-trainings.js    # Trainings API (Vercel)
│   ├── ielts-audio.js        # Audio tracks API (Vercel)
│   └── ielts-progress.js     # Progress API (Vercel)
├── public/
│   ├── tracks/               # Audio storage
│   │   ├── listening/
│   │   ├── reading/
│   │   ├── writing/
│   │   └── speaking/
│   ├── index.html            # Main page
│   ├── script.js             # Vocabulary app logic
│   ├── ielts.js              # IELTS system logic
│   └── styles.css
├── server.js                 # Express server with IELTS routes
├── IELTS_SYSTEM_DOCS.md      # Complete documentation
└── README.md                 # This file
```

---

## 🎯 USAGE FLOW

### Admin Flow

1. **Click "🎯 IELTS Training"** button
2. **Click "⚙️ Admin Panel"**
3. **Upload Audio:**
   - Audio Manager → Select stage → Upload MP3
4. **Create Training:**
   - Training Manager → Select stage → Fill form
   - Choose audio track (or use default)
   - Add questions
   - Save

### User Flow

1. **Select Stage** (Listening/Reading/Writing/Speaking)
2. **Choose Training** from list
3. **Select Game Mode** (Practice/Exam/Challenge)
4. **Complete Training**
5. **View Results** with band score

---

## 📊 API ENDPOINTS

### Audio Tracks

- `GET /api/ielts-audio?stage=listening` - Get audio tracks
- `POST /api/ielts-audio` - Upload audio metadata
- `DELETE /api/ielts-audio?id={id}` - Delete audio

### Trainings

- `GET /api/ielts-trainings?stage=listening` - Get trainings
- `POST /api/ielts-trainings` - Create training
- `DELETE /api/ielts-trainings?id={id}` - Delete training

### Progress

- `GET /api/ielts-progress?trainingId={id}` - Get progress
- `POST /api/ielts-progress` - Save results

---

## 🔧 CONFIGURATION

### Audio Requirements

- Format: MP3
- Max size: 50MB
- Sample rate: 44.1kHz or 48kHz
- Bitrate: 128-320kbps

### Training Limits

- Listening: 5-10 minutes, Section 1-4
- Reading: 15-20 minutes
- Writing: 60 minutes (Task 1: 20min, Task 2: 40min)
- Speaking: 11-14 minutes (Part 1: 4-5min, Part 2: 3-4min, Part 3: 4-5min)

---

## 📈 BAND SCORE CALCULATION

### Listening & Reading

- Raw score → Band score mapping
- 39-40 correct = 9.0
- 37-38 correct = 8.5
- 35-36 correct = 8.0
- etc.

### Writing & Speaking (AI-based)

- Task Achievement / Fluency
- Coherence / Pronunciation
- Vocabulary
- Grammar
- **Overall = Average of 4 criteria**

---

## 🎨 UI FEATURES

- ✅ Responsive design
- ✅ Progress indicators
- ✅ Timer display
- ✅ Audio player controls
- ✅ Question navigation
- ✅ Immediate feedback (Practice mode)
- ✅ Band score display

---

## 🚧 FUTURE ENHANCEMENTS

- [ ] Real file upload with storage
- [ ] Complete game logic for all stages
- [ ] AI integration (OpenAI) for Writing/Speaking
- [ ] Audio recording for Speaking
- [ ] Progress charts and analytics
- [ ] Leaderboard system
- [ ] User authentication
- [ ] Mobile app (PWA ready)

---

## 📚 DOCUMENTATION

For complete system documentation, see:
- **[IELTS_SYSTEM_DOCS.md](IELTS_SYSTEM_DOCS.md)** - Full technical documentation

---

## 🤝 CONTRIBUTING

This is a custom IELTS training system. For questions or contributions:
1. Review IELTS_SYSTEM_DOCS.md
2. Test admin panel and training flow
3. Check API endpoints with Postman
4. Submit issues or suggestions

---

## 📝 LICENSE

Private project for IELTS training purposes.

---

## 🎯 CREDITS

Developed as a comprehensive IELTS training platform with:
- MongoDB + Mongoose for data
- Express.js for API
- Vanilla JavaScript for UI
- Real IELTS band score calculations

**Last Updated:** February 3, 2026
