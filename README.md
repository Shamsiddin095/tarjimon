# 📚 Vocabulary App - O'zbekcha-Inglizcha Tarjima Modeli

> **🎯 Loyihaning asosiy xususiyati:** To'liq o'zbekcha-inglizcha tarjima modeli — faqat bitta so'z emas, butun gaplarni grammatik jihatdan to'g'ri tarjima qiladi!

---

## 🇺🇿➡️🇬🇧 TARJIMA MODELI

### **Qo'shimcha Fayllar:**
- [TRANSLATION_MODEL_DOCUMENTATION.md](./TRANSLATION_MODEL_DOCUMENTATION.md) — To'liq dokumentatsiya
- `api/types-extended.json` — Kengaytirilgan so'z lug'ati
- `api/irregular-verbs.json` — Noto'g'ri fe'llar jadvali
- `api/uzbek-morphology.js` — Morfoloji analiz
- `api/translation-rules.js` — Tarjima qoidalari
- `api/sentence-translator.js` — Asosiy tarjima modeli
- `api/post-processor.js` — Post-processing
- `api/translate.js` — REST API

### **REST API Endpoint'lari:**

```bash
# Bir gapni tarjima qilish
POST /api/translate-v2/translate
{
  "text": "Men Toshkentga bordim",
  "include_analysis": true
}

# Bir nechta gaplarni tarjima qilish
POST /api/translate-v2/translate-batch
{
  "sentences": ["Men Toshkentga bordim", "U kitob o'qiyapti"]
}

# Morfoloji analiz
POST /api/translate-v2/analyze
{
  "text": "Men Toshkentga bordim"
}

# Fe'l formlarini ko'rsatish
POST /api/translate-v2/verb-forms
{
  "infinitive": "go",
  "uzb_stem": "bor"
}
```

### **Tarjima Misoli:**
```
O'zbekcha: "Men Toshkentga bordim"
↓
Inglizcha: "I went to Tashkent."
```

---

# 📚 Vocabulary App - Vercel Deployment Guide

## 🚀 Vercel'ga deployment qilish

### 1️⃣ Vercel'ni install qilish
```bash
npm install -g vercel
```

### 2️⃣ Vercel'ga login qilish
```bash
vercel login
```

### 3️⃣ Loyni Vercel'ga connect qilish
```bash
vercel link
```

### 4️⃣ Environment Variables'ni qo'shish

Vercel Dashboard'da:
1. Loyni tanlang
2. Settings → Environment Variables
3. Quyidagi variablelarni qo'shing:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vocab-app
NODE_ENV=production
```

### 5️⃣ Deploy qilish
```bash
npm run vercel-deploy
```

Yoki Vercel CLI:
```bash
vercel deploy --prod
```

### 6️⃣ Lokalliy test qilish (Vercel Dev Mode)
```bash
npm run vercel-dev
```

## 📱 PWA Features

App quyidagi feature'larni o'z ichiga oladi:

✅ **Offline Support** - Service Worker orqali
✅ **Installable** - Desktop va Mobile'da
✅ **Fast Loading** - Pre-caching strategy
✅ **Responsive** - Mobile, Tablet, Desktop
✅ **Background Sync** - Tayyorlangan

## 🏗️ Project Structure

```
vocab-app/
├── api/
│   ├── db.js              # MongoDB connection pool
│   ├── words.js           # Words CRUD endpoints
│   ├── all-words.js       # Get all words
│   ├── batch-update.js    # Batch update endpoint
│   ├── unit-stats.js      # Unit statistics
│   └── words/
│       └── [id].js        # Individual word endpoint
├── public/
│   ├── index.html         # PWA app shell
│   ├── script.js          # Main app logic
│   ├── styles.css         # Responsive styles
│   ├── sw.js              # Service Worker
│   ├── manifest.json      # PWA manifest
│   └── favicon.svg        # App icon
├── server.js              # Development server (localhost)
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── .env                   # Environment variables
```

## 🎮 Game Modes

### Game Mode 1: Jadval (Drag-Drop)
So'zlarni match qiling oynada.

### Game Mode 2: O'zbekcha Yozish (Text Input)
Ingliz tilidan O'zbekchaga tarjima qiling.

### Game Mode 3: Tezkor Tanlov (Multiple Choice)
5 soniyada to'g'ri javobni tanlang.

## 📊 Database Schema

```javascript
Unit Document:
{
  unit: 1,
  words: [
    {
      _id: ObjectId,
      english: "hello",
      uzbek: "salom",
      gameMode1: 85,
      gameMode2: 90,
      gameMode3: 80,
      status: true
    }
  ]
}

UnitStats Document:
{
  unit: 1,
  totalWords: 20,
  gameMode1Avg: 85,
  gameMode2Avg: 90,
  gameMode3Avg: 80,
  lastUpdated: Date
}
```

## 🔐 Security

- CORS enabled
- HTTPS automatic (Vercel)
- Environment variables protected
- MongoDB connection pooling
- Input validation

## 🎨 Offline Experience

Service Worker quyidagi resurslari cache'laydi:
- ✅ HTML, CSS, JS fayllar
- ✅ API responses (network-first)
- ✅ App manifest va icons

## 📈 Performance Tips

1. **Production Build**: `npm run vercel-deploy`
2. **API Caching**: Network-first strategy API uchun
3. **Asset Caching**: Cache-first strategy static assets uchun
4. **Database**: Connection pooling enabled

## ⚙️ Troubleshooting

### MongoDB connection error
```bash
# MONGO_URI correct ekanligini tekshiring
# mongodb+srv://username:password@cluster.mongodb.net/vocab-app
```

### Service Worker not loading
```bash
# Browser console'da check qiling
# Agar error bo'lsa, hard refresh qiling (Ctrl+Shift+R)
```

### API requests fail
```bash
# Vercel dashboard logs'ini check qiling
# vercel logs <project-name>
```

## 📞 Support

Agar biror muammo bo'lsa:
1. Vercel Dashboard logs'ni check qiling
2. Browser DevTools → Application → Service Workers
3. Network tab'da API requests'ni monitor qiling

---

**Happy Learning! 🎓**
