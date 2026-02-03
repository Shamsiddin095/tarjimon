# 🎯 IELTS TRAINING SYSTEM - Complete Documentation

## 📋 TIZIM UMUMIY TAVSIFI

IELTS Training - to'liq IELTS imtihon tayyorlov tizimi bo'lib, 4 ta asosiy bosqichni (Listening, Reading, Writing, Speaking) qamrab oladi. Har bir bosqich uchun:
- Audio track management
- Training (task) yaratish va boshqarish
- 3 xil game mode (Practice, Exam, Challenge)
- Progress tracking va band score hisoblash
- AI feedback (Writing/Speaking uchun)

### Asosiy Komponentlar

1. **Database Layer** (MongoDB + Mongoose)
   - AudioTrack - audio fayllar ro'yxati
   - IELTSTraining - training (task) ma'lumotlari
   - IELTSProgress - foydalanuvchi natijalari

2. **Backend API** (Express.js)
   - `/api/ielts-audio` - audio management
   - `/api/ielts-trainings` - training CRUD
   - `/api/ielts-progress` - natijalar saqlash

3. **Frontend** (Vanilla JS)
   - IELTS section - 4 bosqich ko'rinishi
   - Admin panel - audio va training yaratish
   - Training player - o'yinlar

4. **Audio Storage**
   - `/public/tracks/listening/`
   - `/public/tracks/reading/`
   - `/public/tracks/writing/`
   - `/public/tracks/speaking/`

---

## 🎵 ADMIN AUDIO FLOW

### 1. Audio Papkalar Avtomatik Yaratiladi

Server ishga tushganda avtomatik:
```
/public/tracks/
 ├── listening/
 ├── reading/
 ├── writing/
 └── speaking/
```

### 2. Admin Audio Yuklash

**Flow:**
```
1. Admin Panel → Audio Manager
2. Stage tanlash (Listening/Reading/Writing/Speaking)
3. Audio file tanlash (MP3, max 50MB)
4. Display name kiriting
5. Upload → Database ga register + file storage
```

**API Request:**
```javascript
POST /api/ielts-audio
{
  "stage": "listening",
  "fileName": "1706950800_section1_easy.mp3",
  "displayName": "Section 1 - Easy Level",
  "duration": 120
}
```

**Response:**
```javascript
{
  "message": "Audio ro'yxatga olindi",
  "track": {
    "_id": "65f8a1b2c3d4e5f6g7h8i9j0",
    "stage": "listening",
    "fileName": "1706950800_section1_easy.mp3",
    "displayName": "Section 1 - Easy Level",
    "duration": 120,
    "uploadedAt": "2026-02-03T10:30:00.000Z",
    "isDefault": false
  }
}
```

### 3. Audio Ro'yxati Ko'rish

**API:**
```javascript
GET /api/ielts-audio?stage=listening

// Response
[
  {
    "_id": "...",
    "stage": "listening",
    "fileName": "default.mp3",
    "displayName": "Default Audio",
    "isDefault": true
  },
  {
    "_id": "...",
    "stage": "listening",
    "fileName": "1706950800_section1_easy.mp3",
    "displayName": "Section 1 - Easy Level",
    "isDefault": false
  }
]
```

### 4. Audio O'chirish

```javascript
DELETE /api/ielts-audio?id={audioId}
```

---

## 📝 TRAINING YARATISH JARAYONI

### 1. Training Form Ochish

```
Admin Panel → Training Manager → Stage tanlash
```

### 2. Training Ma'lumotlari To'ldirish

**Form Fields:**
- **Title** (majburiy): "Section 1 - Family Life"
- **Description** (ixtiyoriy): "Easy level listening about family"
- **Audio Track** (dropdown): Oldindan yuklangan tracklar ro'yxati
  - Agar tanlanmasa → default.mp3 avtomatik
- **Section** (faqat Listening uchun): 1-4
- **Time Limit** (majburiy): 10 daqiqa
- **Difficulty**: Easy / Medium / Hard
- **Content**: Matn, instructions, yoki prompt

### 3. Savollar Qo'shish

**Savol Turlari:**

**Listening:**
- `fill-blank` - Fill in the blanks
- `form-completion` - Form completion

**Reading:**
- `true-false-notgiven` - True / False / Not Given
- `heading-match` - Heading matching

**Writing:**
- `essay` - Essay writing

**Speaking:**
- `speaking-prompt` - Speaking prompt

**Har bir savol:**
```javascript
{
  "type": "fill-blank",
  "questionText": "The family has ___ children.",
  "correctAnswer": "two",
  "orderNumber": 1
}
```

### 4. Training Saqlash

**API Request:**
```javascript
POST /api/ielts-trainings
{
  "stage": "listening",
  "title": "Section 1 - Family Life",
  "description": "Easy level listening about family",
  "audioTrackId": "65f8a1b2c3d4e5f6g7h8i9j0",
  "section": 1,
  "content": "Listen to the conversation about a family.",
  "questions": [
    {
      "type": "fill-blank",
      "questionText": "The family has ___ children.",
      "correctAnswer": "two",
      "orderNumber": 1
    },
    {
      "type": "form-completion",
      "questionText": "Father's name: ___",
      "correctAnswer": "John",
      "orderNumber": 2
    }
  ],
  "timeLimit": 10,
  "difficulty": "easy"
}
```

**Response:**
```javascript
{
  "message": "Training yaratildi",
  "training": {
    "_id": "65f8b2c3d4e5f6g7h8i9j0k1",
    "stage": "listening",
    "title": "Section 1 - Family Life",
    "audioPath": "/tracks/listening/1706950800_section1_easy.mp3",
    "section": 1,
    "timeLimit": 10,
    "difficulty": "easy",
    "questions": [...]
  }
}
```

---

## 🎧 LISTENING TRAINING LOGIKA

### Training Strukturasi
```javascript
{
  "stage": "listening",
  "section": 1,  // 1-4
  "audioPath": "/tracks/listening/section1.mp3",
  "questions": [
    {
      "type": "fill-blank",
      "questionText": "The meeting starts at ___.",
      "correctAnswer": "9:30"
    }
  ],
  "timeLimit": 10  // minutes
}
```

### Game Flow

**Practice Mode:**
1. Audio ijro etiladi (loop mumkin)
2. Foydalanuvchi savollarni javoblaydi
3. Har bir javobga darhol feedback
4. Cheksiz urinish

**Exam Mode:**
1. Audio faqat 1 marta
2. Timer majburiy
3. Feedback yo'q
4. Tugagandan keyin ball

**Challenge Mode:**
1. Audio faqat 1 marta
2. Qisqartirilgan vaqt (50% timer)
3. Qiyin savollar
4. Bonus ball

### Baholash

```javascript
// Listening band score calculation
function calculateListeningBandScore(correctAnswers, totalQuestions) {
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  if (percentage >= 90) return 9.0;
  if (percentage >= 85) return 8.5;
  if (percentage >= 80) return 8.0;
  if (percentage >= 75) return 7.5;
  if (percentage >= 70) return 7.0;
  if (percentage >= 65) return 6.5;
  if (percentage >= 60) return 6.0;
  if (percentage >= 55) return 5.5;
  if (percentage >= 50) return 5.0;
  if (percentage >= 45) return 4.5;
  if (percentage >= 40) return 4.0;
  return 3.5;
}
```

---

## 📖 READING TRAINING LOGIKA

### Training Strukturasi
```javascript
{
  "stage": "reading",
  "content": "Long passage text here...",
  "questions": [
    {
      "type": "true-false-notgiven",
      "questionText": "The author believes technology is harmful.",
      "correctAnswer": "FALSE"
    },
    {
      "type": "heading-match",
      "questionText": "Paragraph A",
      "options": ["Technology benefits", "History of tech", "Future trends"],
      "correctAnswer": "Technology benefits"
    }
  ],
  "timeLimit": 20
}
```

### Features
- Matnni highlight qilish mumkin
- Timer ko'rinadi
- Savollar matn yonida
- True/False/Not Given logic

---

## ✍️ WRITING TRAINING LOGIKA

### Training Strukturasi
```javascript
{
  "stage": "writing",
  "content": "Task 1: The chart shows...\nTask 2: Discuss both views...",
  "questions": [
    {
      "type": "essay",
      "questionText": "Write at least 150 words for Task 1",
      "orderNumber": 1
    }
  ],
  "timeLimit": 60  // Task 1: 20 min, Task 2: 40 min
}
```

### AI Baholash (Future)

```javascript
// Conceptual - AI integration kerak
async function evaluateWriting(essayText, task) {
  const aiResponse = await callAI({
    essay: essayText,
    task: task,
    criteria: ['task_achievement', 'coherence', 'vocabulary', 'grammar']
  });
  
  return {
    taskAchievement: 7.0,
    coherence: 6.5,
    vocabulary: 7.5,
    grammar: 7.0,
    overallBand: 7.0,
    feedback: "Good essay structure. Improve linking words..."
  };
}
```

### So'zlar Soni Hisoblash
```javascript
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

// Minimum requirements
// Task 1: 150 words
// Task 2: 250 words
```

---

## 🗣️ SPEAKING TRAINING LOGIKA

### Training Strukturasi
```javascript
{
  "stage": "speaking",
  "questions": [
    {
      "type": "speaking-prompt",
      "questionText": "Part 1: Tell me about your family.",
      "orderNumber": 1
    },
    {
      "type": "speaking-prompt",
      "questionText": "Part 2: Describe a memorable trip. (2 minutes)",
      "orderNumber": 2
    }
  ],
  "timeLimit": 15  // Part 1: 4-5 min, Part 2: 3-4 min, Part 3: 4-5 min
}
```

### Audio Recording

```javascript
// Browser MediaRecorder API
let mediaRecorder;
let audioChunks = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    await uploadAudioForAnalysis(audioBlob);
  };
  
  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}
```

### AI Baholash (Future)

```javascript
// Conceptual - Speech-to-Text + AI analysis
async function evaluateSpeaking(audioBlob) {
  // 1. Transcribe audio
  const transcript = await speechToText(audioBlob);
  
  // 2. Analyze
  const analysis = await analyzeTranscript(transcript);
  
  return {
    fluency: 7.0,
    pronunciation: 6.5,
    vocabulary: 7.5,
    grammar: 7.0,
    overallBand: 7.0,
    feedback: "Good fluency. Work on 'th' sounds..."
  };
}
```

---

## 🎮 GAME MODE VA SCORE

### 3 TA GAME MODE

#### 1. PRACTICE MODE
```javascript
{
  "name": "Practice",
  "icon": "🎮",
  "features": {
    "unlimitedAttempts": true,
    "immediateFeedback": true,
    "audioLoop": true,
    "noPenalty": true,
    "saveProgress": false
  }
}
```

#### 2. EXAM MODE
```javascript
{
  "name": "Exam",
  "icon": "📝",
  "features": {
    "attempts": 1,
    "strictTimer": true,
    "audioOnce": true,
    "noFeedback": true,
    "realIELTS": true,
    "saveBandScore": true
  }
}
```

#### 3. CHALLENGE MODE
```javascript
{
  "name": "Challenge",
  "icon": "⚡",
  "features": {
    "reducedTime": 0.5,  // 50% time
    "hardQuestions": true,
    "bonusPoints": true,
    "leaderboard": true,
    "saveBandScore": true
  }
}
```

### Progress Saqlash

```javascript
POST /api/ielts-progress
{
  "userId": "guest",  // yoki user ID
  "trainingId": "65f8b2c3d4e5f6g7h8i9j0k1",
  "gameMode": "exam",
  "answers": [
    {
      "questionIndex": 0,
      "userAnswer": "two",
      "isCorrect": true,
      "timeTaken": 15  // seconds
    },
    {
      "questionIndex": 1,
      "userAnswer": "John",
      "isCorrect": true,
      "timeTaken": 8
    }
  ],
  "rawScore": 2,
  "bandScore": 7.5,
  "timeSpent": 300  // total seconds
}
```

---

## 📊 BAND SCORE CALCULATION

### Listening & Reading

```javascript
const bandScoreTable = {
  listening: {
    39-40: 9.0,
    37-38: 8.5,
    35-36: 8.0,
    32-34: 7.5,
    30-31: 7.0,
    26-29: 6.5,
    23-25: 6.0,
    18-22: 5.5,
    16-17: 5.0,
    13-15: 4.5,
    10-12: 4.0
  },
  reading: {
    39-40: 9.0,
    37-38: 8.5,
    35-36: 8.0,
    33-34: 7.5,
    30-32: 7.0,
    27-29: 6.5,
    23-26: 6.0,
    19-22: 5.5,
    15-18: 5.0,
    13-14: 4.5,
    10-12: 4.0
  }
};

function getBandScore(stage, correctAnswers) {
  const table = bandScoreTable[stage];
  // Find matching range
  for (const [range, score] of Object.entries(table)) {
    const [min, max] = range.split('-').map(Number);
    if (correctAnswers >= min && correctAnswers <= max) {
      return score;
    }
  }
  return 3.5;
}
```

### Writing & Speaking (AI-based)

```javascript
function calculateOverallBand(criteria) {
  // Average of all criteria
  const scores = Object.values(criteria);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Round to nearest 0.5
  return Math.round(average * 2) / 2;
}

// Example
const writingScores = {
  taskAchievement: 7.0,
  coherence: 6.5,
  vocabulary: 7.5,
  grammar: 7.0
};

const overallBand = calculateOverallBand(writingScores);  // 7.0
```

### Overall IELTS Band

```javascript
function calculateOverallIELTS(listening, reading, writing, speaking) {
  const average = (listening + reading + writing + speaking) / 4;
  return Math.round(average * 2) / 2;
}

// Example
const scores = {
  listening: 7.5,
  reading: 8.0,
  writing: 7.0,
  speaking: 7.5
};

const overall = calculateOverallIELTS(...Object.values(scores));  // 7.5
```

---

## 🎯 JSON MISOLLAR

### Complete Listening Training JSON

```json
{
  "_id": "65f8b2c3d4e5f6g7h8i9j0k1",
  "stage": "listening",
  "title": "Section 1 - Booking a Hotel Room",
  "description": "Easy level conversation about hotel reservation",
  "audioTrack": {
    "_id": "65f8a1b2c3d4e5f6g7h8i9j0",
    "stage": "listening",
    "fileName": "1706950800_section1_hotel.mp3",
    "displayName": "Hotel Booking - Easy",
    "duration": 180
  },
  "audioPath": "/tracks/listening/1706950800_section1_hotel.mp3",
  "section": 1,
  "content": "You will hear a conversation between a customer and a hotel receptionist.",
  "questions": [
    {
      "type": "fill-blank",
      "questionText": "Customer name: ___ Smith",
      "correctAnswer": "Sarah",
      "orderNumber": 1
    },
    {
      "type": "fill-blank",
      "questionText": "Number of nights: ___",
      "correctAnswer": "3",
      "orderNumber": 2
    },
    {
      "type": "form-completion",
      "questionText": "Room type: ___",
      "correctAnswer": "Double",
      "orderNumber": 3
    },
    {
      "type": "form-completion",
      "questionText": "Price per night: £___",
      "correctAnswer": "89",
      "orderNumber": 4
    },
    {
      "type": "fill-blank",
      "questionText": "Check-in date: ___ April",
      "correctAnswer": "15th",
      "orderNumber": 5
    }
  ],
  "timeLimit": 10,
  "difficulty": "easy",
  "createdAt": "2026-02-03T10:30:00.000Z"
}
```

### Complete Progress JSON

```json
{
  "_id": "65f8c3d4e5f6g7h8i9j0k1l2",
  "userId": "guest",
  "training": "65f8b2c3d4e5f6g7h8i9j0k1",
  "gameMode": "exam",
  "answers": [
    {
      "questionIndex": 0,
      "userAnswer": "Sarah",
      "isCorrect": true,
      "timeTaken": 12
    },
    {
      "questionIndex": 1,
      "userAnswer": "3",
      "isCorrect": true,
      "timeTaken": 8
    },
    {
      "questionIndex": 2,
      "userAnswer": "Double",
      "isCorrect": true,
      "timeTaken": 10
    },
    {
      "questionIndex": 3,
      "userAnswer": "89",
      "isCorrect": true,
      "timeTaken": 15
    },
    {
      "questionIndex": 4,
      "userAnswer": "15",
      "isCorrect": false,
      "timeTaken": 20
    }
  ],
  "rawScore": 4,
  "bandScore": 7.0,
  "timeSpent": 480,
  "completedAt": "2026-02-03T11:00:00.000Z"
}
```

---

## 🚀 ISHGA TUSHIRISH

### 1. Dependencies Install

```bash
cd d:/projects/vocab-app
npm install
```

### 2. Environment Variables

`.env` fayl:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

### 3. Server Run

```bash
node server.js
```

### 4. Open Browser

```
http://localhost:3000
```

### 5. Test Flow

1. Click "🎯 IELTS Training" button
2. Click "⚙️ Admin Panel"
3. Upload audio (Audio Manager)
4. Create training (Training Manager)
5. Go back and click training card
6. Select game mode
7. Complete training
8. See results

---

## 📝 NOTES

### Current Implementation Status

✅ **Complete:**
- Database schemas
- API endpoints
- UI structure
- Admin panel
- Audio management
- Training management

🚧 **TODO (Future Enhancements):**
- Real file upload (currently simulated)
- Actual game logic implementation for each stage
- AI integration for Writing/Speaking evaluation
- Audio recording for Speaking
- Real-time timer
- Progress charts and statistics
- Leaderboard
- User authentication

### Technical Stack

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Audio:** HTML5 Audio API
- **Recording:** MediaRecorder API (future)
- **AI:** OpenAI API / Custom ML (future)

---

Bu dokumentatsiya IELTS Training tizimining to'liq ishlash mexanizmini tushuntiradi. Hozirda asosiy struktura va admin panel tayyor. Keyingi bosqich - har bir stage uchun actual game logic implementation! 🎯
