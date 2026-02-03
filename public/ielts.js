// ==========================================
// IELTS TRAINING SYSTEM
// ==========================================

// Global state
const IELTS_STATE = {
    stages: ['listening', 'reading', 'writing', 'speaking'],
    stageIcons: {
        listening: '🎧',
        reading: '📖',
        writing: '✍️',
        speaking: '🗣️'
    },
    stageNames: {
        listening: 'Listening',
        reading: 'Reading',
        writing: 'Writing',
        speaking: 'Speaking'
    },
    currentTraining: null,
    currentGameMode: 'practice',
    audioTracks: {},
    trainings: {}
};

// ==========================================
// INITIALIZE IELTS SECTION
// ==========================================
async function initIELTS() {
    console.log('🎯 IELTS Training initialized');
    
    // Event listeners
    document.getElementById('ielts-training-btn').addEventListener('click', showIELTSSection);
    document.getElementById('ielts-admin-btn').addEventListener('click', showAdminPanel);
    document.getElementById('close-admin-btn').addEventListener('click', closeAdminPanel);
    
    // Load data
    await loadAllIELTSData();
}

// ==========================================
// SHOW IELTS SECTION
// ==========================================
function showIELTSSection() {
    // Hide other sections
    document.getElementById('units-section').style.display = 'none';
    document.getElementById('verification-section').style.display = 'none';
    document.getElementById('practice-section').style.display = 'none';
    
    // Show IELTS section
    document.getElementById('ielts-section').style.display = 'block';
    
    // Render stages
    renderIELTSStages();
}

// ==========================================
// LOAD ALL IELTS DATA
// ==========================================
async function loadAllIELTSData() {
    try {
        for (const stage of IELTS_STATE.stages) {
            // Load trainings
            const trainingsResponse = await fetch(`${window.API_BASE_URL}/ielts-trainings?stage=${stage}`);
            const trainings = await trainingsResponse.json();
            IELTS_STATE.trainings[stage] = trainings || [];
            
            // Load audio tracks
            const tracksResponse = await fetch(`${window.API_BASE_URL}/ielts-audio?stage=${stage}`);
            const tracks = await tracksResponse.json();
            IELTS_STATE.audioTracks[stage] = tracks || [];
        }
    } catch (error) {
        console.error('Error loading IELTS data:', error);
    }
}

// Get user's score for a specific training from localStorage
function getUserScore(trainingId) {
    const scores = JSON.parse(localStorage.getItem('ielts_scores') || '{}');
    return scores[trainingId] !== undefined ? scores[trainingId] : null;
}

// Save user's score for a training to localStorage
function saveUserScore(trainingId, score) {
    const scores = JSON.parse(localStorage.getItem('ielts_scores') || '{}');
    scores[trainingId] = score;
    localStorage.setItem('ielts_scores', JSON.stringify(scores));
}

// ==========================================
// RENDER IELTS STAGES
// ==========================================
function renderIELTSStages() {
    const container = document.getElementById('ielts-stages-container');
    container.innerHTML = '';
    
    IELTS_STATE.stages.forEach(stage => {
        const trainings = IELTS_STATE.trainings[stage] || [];
        const icon = IELTS_STATE.stageIcons[stage];
        const name = IELTS_STATE.stageNames[stage];
        
        const stageCard = document.createElement('div');
        stageCard.style.cssText = `
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
        `;
        
        stageCard.innerHTML = `
            <h2 style="font-size: 48px; margin: 0; text-align: center;">${icon}</h2>
            <h3 style="margin: 10px 0; color: #333; text-align: center;">${name}</h3>
            <p style="color: #666; margin: 5px 0; text-align: center;">${trainings.length} ta training</p>
            <button style="margin-top: 10px; width: 100%; padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
                ▶️ Boshlash
            </button>
        `;
        
        // Click bo'lganda training'larni ko'rsatish
        stageCard.addEventListener('click', () => showTrainingList(stage));
        
        stageCard.addEventListener('mouseenter', () => {
            stageCard.style.transform = 'translateY(-5px)';
            stageCard.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
        });
        
        stageCard.addEventListener('mouseleave', () => {
            stageCard.style.transform = 'translateY(0)';
            stageCard.style.boxShadow = 'none';
        });
        
        container.appendChild(stageCard);
    });
}

// ==========================================
// SHOW TRAINING LIST
// ==========================================
function showTrainingList(stage) {
    const trainings = IELTS_STATE.trainings[stage] || [];
    const icon = IELTS_STATE.stageIcons[stage];
    const name = IELTS_STATE.stageNames[stage];
    
    const container = document.getElementById('ielts-stages-container');
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button onclick="renderIELTSStages()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                ← Orqaga
            </button>
        </div>
        <h2 style="margin: 20px 0; color: #333;">${icon} ${name} - Training'lar</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            ${trainings.length === 0 ? '<p style="color: #999;">Hali training yo\'q. Admin panel orqali qo\'shing.</p>' : ''}
            ${trainings.map(training => {
                const userScore = getUserScore(training._id);
                const maxScore = training.questions?.length || 0;
                return `
                <div style="background: white; border: 2px solid #e0e0e0; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s;" 
                     onclick="startGame('${training._id}', '${stage}')"
                     onmouseenter="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.15)';" 
                     onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <h3 style="margin: 0 0 10px 0; color: #333;">${training.title}</h3>
                    <p style="color: #666; font-size: 14px; margin: 5px 0;">${training.description || 'Tavsif yo\'q'}</p>
                    <p style="color: #999; font-size: 12px; margin: 5px 0;">⏱️ ${training.timeLimit} daqiqa</p>
                    <p style="color: #999; font-size: 12px; margin: 5px 0;">❓ ${maxScore} ta savol</p>
                    ${userScore !== null ? `
                        <div style="margin-top: 10px; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
                            <p style="color: white; font-size: 20px; font-weight: bold; margin: 0;">🏆 ${userScore} / ${maxScore}</p>
                            <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 5px 0 0 0;">Sizning balingiz</p>
                        </div>
                    ` : ''}
                    <button style="width: 100%; margin-top: 15px; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
                        ▶️ Boshlash
                    </button>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==========================================
// START GAME (ROUTER)
// ==========================================
function startGame(trainingId, stage) {
    const training = IELTS_STATE.trainings[stage]?.find(t => t._id === trainingId);
    
    if (!training) {
        showNotification('Training topilmadi!', 'error');
        return;
    }
    
    // Stage'ga qarab tegishli game'ni ishga tushirish
    if (stage === 'listening') {
        startListeningGame(training);
    } else if (stage === 'reading') {
        startReadingGame(training);
    } else if (stage === 'writing') {
        startWritingGame(training);
    } else if (stage === 'speaking') {
        startSpeakingGame(training);
    }
}

// ==========================================
// ADMIN PANEL
// ==========================================
function showAdminPanel() {
    document.getElementById('ielts-admin-panel').style.display = 'block';
    renderAdminContent();
}

function closeAdminPanel() {
    document.getElementById('ielts-admin-panel').style.display = 'none';
}

function renderAdminContent() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3>📝 Training Yaratish va Boshqarish</h3>
            <p style="color: #666; margin-bottom: 15px;">Training yaratishda zarur bo'lsa audio qo'shish imkoni bor.</p>
        </div>
        <div id="admin-workspace"></div>
    `;
    showTrainingManager();
}

// ==========================================
// AUDIO UPLOAD HELPERS (Training Manager'da)
// ==========================================
function toggleAudioUploadForm(stage) {
    const uploadForm = document.getElementById(`audio-upload-form-${stage}`);
    if (uploadForm) {
        uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
    }
}

async function uploadAudioForTraining(stage) {
    const fileInput = document.getElementById(`audio-file-input-${stage}`);
    const displayNameInput = document.getElementById(`audio-display-name-${stage}`);
    
    if (!fileInput.files[0]) {
        showNotification('Iltimos audio file tanlang!', 'error');
        return;
    }
    
    if (!displayNameInput.value.trim()) {
        showNotification('Iltimos display name kiriting!', 'error');
        return;
    }
    
    const audioFile = fileInput.files[0];
    const displayName = displayNameInput.value.trim();
    
    // FormData bilan file yuklash
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    formData.append('stage', stage);
    formData.append('displayName', displayName);
    formData.append('duration', 0);
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/ielts-audio`, {
            method: 'POST',
            body: formData
            // Content-Type header qo'ymamiz - browser avtomatik qo'shadi
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Audio muvaffaqiyatli yuklandi!', 'success');
            
            // Reload data
            await loadAllIELTSData();
            
            // Yangilangan audio bilan qayta form ochish
            openAddTraining(stage);
        } else {
            const error = await response.json();
            showNotification(`❌ ${error.error || 'Xatolik yuz berdi!'}`, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('❌ Upload xatosi!', 'error');
    }
}

// ==========================================
// TRAINING MANAGER
// ==========================================
function showTrainingManager() {
    const workspace = document.getElementById('admin-workspace');
    workspace.innerHTML = `
        <h3>📝 Training Manager</h3>
        <p style="color: #666;">Training yaratish uchun stage tanlang:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${IELTS_STATE.stages.map(stage => `
                <button onclick="openAddTraining('${stage}')" style="padding: 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
                    ${IELTS_STATE.stageIcons[stage]} ${IELTS_STATE.stageNames[stage]}
                </button>
            `).join('')}
        </div>
    `;
}

// ==========================================
// ADD TRAINING FORM
// ==========================================
function openAddTraining(stage) {
    // Avval admin panelni ochish
    showAdminPanel();
    
    // Biraz kutib workspace'ni to'ldirish (DOM ready bo'lishi uchun)
    setTimeout(() => {
        const workspace = document.getElementById('admin-workspace');
        if (!workspace) {
            console.error('Admin workspace topilmadi!');
            return;
        }
        
        const tracks = IELTS_STATE.audioTracks[stage] || [];
        
        workspace.innerHTML = `
            <h3>➕ ${IELTS_STATE.stageNames[stage]} Training Qo'shish</h3>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label>
                <input type="text" id="training-title" placeholder="Masalan: Section 1 - Easy" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
            <textarea id="training-description" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Audio Track:</label>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <select id="training-audio" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    <option value="">Default audio</option>
                    ${tracks.map(track => `
                        <option value="${track._id}">${track.displayName}</option>
                    `).join('')}
                </select>
                <button onclick="toggleAudioUploadForm('${stage}')" style="padding: 10px 15px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    ➕ Yuklash
                </button>
            </div>
            
            <!-- Audio Upload Form (Hidden by default) -->
            <div id="audio-upload-form-${stage}" style="background: #f9f9f9; border: 2px solid #4caf50; border-radius: 6px; padding: 15px; display: none; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0;">🎵 Audio Fayl Yuklash</h4>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Audio File (MP3):</label>
                    <input type="file" id="audio-file-input-${stage}" accept="audio/mp3,audio/mpeg" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Display Name:</label>
                    <input type="text" id="audio-display-name-${stage}" placeholder="Masalan: Section 1 - Easy" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="uploadAudioForTraining('${stage}')" style="flex: 1; padding: 8px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        ✅ Saqlash
                    </button>
                    <button onclick="toggleAudioUploadForm('${stage}')" style="flex: 1; padding: 8px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        ❌ Bekor
                    </button>
                </div>
            </div>
        </div>
        
        ${stage === 'listening' ? `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Section (1-4):</label>
                <input type="number" id="training-section" min="1" max="4" value="1" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
        ` : ''}
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Time Limit (minutes):</label>
            <input type="number" id="training-time" min="1" max="180" value="10" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Difficulty:</label>
            <select id="training-difficulty" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="easy">🟢 Easy</option>
                <option value="medium" selected>🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Content:</label>
            <textarea id="training-content" rows="5" placeholder="Matn, instructions, yoki prompt" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4>Savollar:</h4>
            <div id="questions-container"></div>
            <button onclick="addQuestion('${stage}')" style="padding: 8px 15px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                ➕ Savol Qo'shish
            </button>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="saveTraining('${stage}')" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                💾 Saqlash
            </button>
            <button onclick="showTrainingManager()" style="padding: 12px 20px; background: #999; color: white; border: none; border-radius: 8px; cursor: pointer;">
                Bekor
            </button>
        </div>
    `;
    }, 100);  // setTimeout closing
}

// Global questions array
let currentQuestions = [];

function addQuestion(stage) {
    const questionIndex = currentQuestions.length;
    currentQuestions.push({
        type: 'fill-blank',
        questionText: '',
        correctAnswer: '',
        orderNumber: questionIndex + 1
    });
    
    renderQuestions(stage);
}

function renderQuestions(stage) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    currentQuestions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.style.cssText = `
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
        `;
        questionDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Savol ${index + 1}</strong>
                <button onclick="removeQuestion(${index}, '${stage}')" style="padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">Question Type:</label>
                <select onchange="updateQuestionType(${index}, this.value, '${stage}')" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="fill-blank" ${q.type === 'fill-blank' ? 'selected' : ''}>Fill in the Blank</option>
                    <option value="form-completion" ${q.type === 'form-completion' ? 'selected' : ''}>Form Completion</option>
                    <option value="true-false-notgiven" ${q.type === 'true-false-notgiven' ? 'selected' : ''}>True/False/Not Given</option>
                    <option value="essay" ${q.type === 'essay' ? 'selected' : ''}>Essay</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">Question Text:</label>
                <input type="text" value="${q.questionText}" onchange="updateQuestionText(${index}, this.value)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            ${q.type !== 'essay' ? `
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Correct Answer:</label>
                    <input type="text" value="${q.correctAnswer}" onchange="updateCorrectAnswer(${index}, this.value)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            ` : ''}
        `;
        container.appendChild(questionDiv);
    });
}

function removeQuestion(index, stage) {
    currentQuestions.splice(index, 1);
    renderQuestions(stage);
}

function updateQuestionType(index, type, stage) {
    currentQuestions[index].type = type;
    renderQuestions(stage);
}

function updateQuestionText(index, text) {
    currentQuestions[index].questionText = text;
}

function updateCorrectAnswer(index, answer) {
    currentQuestions[index].correctAnswer = answer;
}

async function saveTraining(stage) {
    const title = document.getElementById('training-title').value.trim();
    const description = document.getElementById('training-description').value.trim();
    const audioTrackId = document.getElementById('training-audio').value;
    const timeLimit = parseInt(document.getElementById('training-time').value);
    const difficulty = document.getElementById('training-difficulty').value;
    const content = document.getElementById('training-content').value.trim();
    const section = stage === 'listening' ? parseInt(document.getElementById('training-section').value) : null;
    
    if (!title || !timeLimit) {
        alert('Title va Time Limit majburiy!');
        return;
    }
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/ielts-trainings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stage,
                title,
                description,
                audioTrackId: audioTrackId || null,
                section,
                content,
                questions: currentQuestions,
                timeLimit,
                difficulty
            })
        });
        
        if (response.ok) {
            alert('Training muvaffaqiyatli yaratildi!');
            currentQuestions = [];
            await loadAllIELTSData();
            renderIELTSStages();
            closeAdminPanel();
        } else {
            alert('Xatolik yuz berdi!');
        }
    } catch (error) {
        console.error('Save training error:', error);
        alert('Xatolik yuz berdi!');
    }
}

// ==========================================
// TRAINING PLAYER (TODO)
// ==========================================
function openTrainingPlayer(training) {
    IELTS_STATE.currentTraining = training;
    
    const playerDiv = document.getElementById('ielts-player');
    const contentDiv = document.getElementById('ielts-player-content');
    
    playerDiv.style.display = 'block';
    
    contentDiv.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>${training.title}</h2>
                <button onclick="closeTrainingPlayer()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ✕ Close
                </button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p style="color: #666;">${training.description || ''}</p>
                <div style="display: flex; gap: 20px; font-size: 14px; color: #666;">
                    <span>⏱️ ${training.timeLimit} minutes</span>
                    <span>${training.difficulty === 'easy' ? '🟢' : training.difficulty === 'medium' ? '🟡' : '🔴'} ${training.difficulty}</span>
                    <span>❓ ${training.questions.length} questions</span>
                </div>
            </div>
            
            <div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3>Game Mode Tanlang:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <button onclick="startIELTSGame('practice')" style="padding: 15px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        🎮 Practice<br><span style="font-size: 12px; font-weight: normal;">Cheksiz urinish</span>
                    </button>
                    <button onclick="startIELTSGame('exam')" style="padding: 15px; background: #ff9800; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        📝 Exam<br><span style="font-size: 12px; font-weight: normal;">Real IELTS</span>
                    </button>
                    <button onclick="startIELTSGame('challenge')" style="padding: 15px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        ⚡ Challenge<br><span style="font-size: 12px; font-weight: normal;">Qiyin, tez</span>
                    </button>
                </div>
            </div>
            
            <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 15px;">
                <strong>📋 Instructions:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Audio faqat 1 marta ijro etiladi (Exam va Challenge)</li>
                    <li>Timer boshlangandan keyin to'xtatib bo'lmaydi</li>
                    <li>Barcha savollarni javoblang</li>
                </ul>
            </div>
        </div>
    `;
}

function closeTrainingPlayer() {
    document.getElementById('ielts-player').style.display = 'none';
    IELTS_STATE.currentTraining = null;
}

function startIELTSGame(gameMode) {
    IELTS_STATE.currentGameMode = gameMode;
    const training = IELTS_STATE.currentTraining;
    
    // Stage'ga qarab tegishli o'yinni boshlash
    if (training.stage === 'listening') {
        startListeningGame(training, gameMode);
    } else if (training.stage === 'reading') {
        startReadingGame(training, gameMode);
    } else if (training.stage === 'writing') {
        startWritingGame(training, gameMode);
    } else if (training.stage === 'speaking') {
        startSpeakingGame(training, gameMode);
    }
}

// ==========================================
// LISTENING GAME IMPLEMENTATION
// ==========================================
let currentListeningGame = null;

function startListeningGame(training) {
    currentListeningGame = {
        training,
        startTime: Date.now(),
        answers: [],
        timerInterval: null,
        audioEnded: false
    };
    
    const player = document.getElementById('ielts-player');
    player.style.display = 'flex';
    
    const audioPath = training.audioPath || `/tracks/listening/default.mp3`;
    
    player.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="closeIELTSPlayer()" style="position: absolute; top: 15px; right: 15px; background: #f44336; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                ✕
            </button>
            
            <h2 style="margin: 0 0 20px 0; color: #333;">${training.title}</h2>
            <p style="color: #666; margin-bottom: 20px;">${training.description || ''}</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">🎧 Audio ijro etilmoqda...</p>
                <audio id="listening-audio" style="width: 100%; margin-bottom: 10px;">
                    <source src="${audioPath}" type="audio/mpeg">
                </audio>
                <div id="audio-progress" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                    <div id="audio-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); transition: width 0.3s;"></div>
                </div>
            </div>
            
            <div id="timer-section" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: none;">
                <p style="margin: 0; color: #856404; font-weight: bold; text-align: center;">
                    ⏱️ Qolgan vaqt: <span id="timer-display" style="font-size: 24px; color: #d32f2f;">${training.timeLimit}:00</span>
                </p>
            </div>
            
            <div id="questions-container"></div>
            
            <button id="submit-btn" onclick="submitListeningAnswers()" style="width: 100%; padding: 15px; background: #9e9e9e; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: not-allowed; margin-top: 20px;" disabled>
                🎧 Avval audio'ni eshiting...
            </button>
        </div>
    `;
    
    renderListeningQuestions(training.questions);
    
    // Audio'ni avtomatik ijro etish va progress tracking
    const audio = document.getElementById('listening-audio');
    const progressBar = document.getElementById('audio-progress-bar');
    const submitBtn = document.getElementById('submit-btn');
    
    // Audio progress update
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = progress + '%';
    });
    
    // Audio tugaganda timer ishga tushirish
    audio.addEventListener('ended', () => {
        currentListeningGame.audioEnded = true;
        document.getElementById('timer-section').style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.style.background = '#4caf50';
        submitBtn.style.cursor = 'pointer';
        submitBtn.innerHTML = '✅ Javoblarni Yuborish';
        
        showNotification('⏱️ Audio tugadi! Timer boshlandi', 'success');
        startTimer(training.timeLimit * 60);
    });
    
    // Auto-play audio
    setTimeout(() => {
        audio.play().catch(err => {
            showNotification('Audio ijro etishda xatolik. Play tugmasini bosing.', 'error');
            audio.controls = true;
        });
    }, 500);
}

function renderListeningQuestions(questions) {
    const container = document.getElementById('questions-container');
    
    container.innerHTML = `
        <h3 style="margin: 20px 0 15px 0; color: #333;">📝 Savollar</h3>
        ${questions.map((q, index) => `
            <div style="background: #fafafa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">
                    ${index + 1}. ${q.questionText}
                </p>
                <input 
                    type="text" 
                    id="answer-${index}" 
                    placeholder="Javobingizni kiriting" 
                    style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;"
                />
            </div>
        `).join('')}
    `;
}

function startTimer(seconds) {
    const timerDisplay = document.getElementById('timer-display');
    const timerSection = document.getElementById('timer-section');
    
    let remainingSeconds = seconds;
    
    currentListeningGame.timerInterval = setInterval(() => {
        remainingSeconds--;
        
        const minutes = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        timerDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        
        // Timer qizil rangga o'tishi
        if (remainingSeconds < 60) {
            timerSection.style.background = '#ffe0e0';
            timerDisplay.style.color = '#f44336';
        }
        
        // Timer tugaganda avtomatik submit
        if (remainingSeconds <= 0) {
            clearInterval(currentListeningGame.timerInterval);
            showNotification('⏰ Vaqt tugadi!', 'error');
            submitListeningAnswers();
        }
    }, 1000);
}

function submitListeningAnswers() {
    if (!currentListeningGame) return;
    
    const { training, startTime, timerInterval, audioEnded } = currentListeningGame;
    
    // Audio eshitilmaganligini tekshirish
    if (!audioEnded) {
        showNotification('Avval audio\'ni eshiting!', 'error');
        return;
    }
    
    // Timer'ni to'xtatish
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Javoblarni to'plash
    const answers = training.questions.map((q, index) => {
        const input = document.getElementById(`answer-${index}`);
        const userAnswer = input ? input.value.trim().toLowerCase() : '';
        const correctAnswer = q.correctAnswer.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;
        
        return {
            questionIndex: index,
            userAnswer: input ? input.value.trim() : '',
            correctAnswer: q.correctAnswer,
            isCorrect
        };
    });
    
    const score = answers.filter(a => a.isCorrect).length;
    const totalQuestions = training.questions.length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    // Ballni saqlash
    saveUserScore(training._id, score);
    
    // Natijani ko'rsatish
    showListeningResults({
        training,
        answers,
        score,
        totalQuestions,
        timeSpent
    });
}

function showListeningResults(data) {
    const { training, answers, score, totalQuestions, timeSpent } = data;
    
    const player = document.getElementById('ielts-player');
    
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const percentage = ((score / totalQuestions) * 100).toFixed(1);
    
    player.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="closeIELTSPlayer(); renderIELTSStages();" style="position: absolute; top: 15px; right: 15px; background: #f44336; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; font-size: 20px; cursor: pointer;">
                ✕
            </button>
            
            <h2 style="margin: 0 0 20px 0; color: #333; text-align: center;">🎉 Test Tugadi!</h2>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; text-align: center; color: white; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 64px; font-weight: bold;">${score}</h1>
                <p style="margin: 10px 0 0 0; font-size: 24px; opacity: 0.9;">/ ${totalQuestions}</p>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.8;">Sizning balingiz</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #2e7d32; font-size: 32px; font-weight: bold;">${percentage}%</p>
                    <p style="margin: 5px 0 0 0; color: #2e7d32;">Aniqlik</p>
                </div>
                <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #e65100; font-size: 32px; font-weight: bold;">${minutes}:${seconds.toString().padStart(2, '0')}</p>
                    <p style="margin: 5px 0 0 0; color: #e65100;">Sarflangan vaqt</p>
                </div>
            </div>
            
            <h3 style="margin: 20px 0 15px 0; color: #333;">📋 Javoblar Tahlili</h3>
            <div style="max-height: 300px; overflow-y: auto;">
                ${answers.map((answer, index) => `
                    <div style="background: ${answer.isCorrect ? '#e8f5e9' : '#ffebee'}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${answer.isCorrect ? '#4caf50' : '#f44336'};">
                        <p style="margin: 0; font-weight: bold; color: #333;">
                            ${answer.isCorrect ? '✅' : '❌'} Savol ${index + 1}: ${training.questions[index].questionText}
                        </p>
                        <p style="margin: 5px 0; color: #666;">
                            Sizning javobingiz: <strong>${answer.userAnswer || '(Bo\'sh)'}</strong>
                        </p>
                        ${!answer.isCorrect ? `<p style="margin: 5px 0 0 0; color: #2e7d32;">To'g'ri javob: <strong>${answer.correctAnswer}</strong></p>` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="closeIELTSPlayer(); renderIELTSStages();" style="flex: 1; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    🏠 Bosh sahifa
                </button>
                <button onclick="closeIELTSPlayer(); startGame('${training._id}', 'listening');" style="flex: 1; padding: 15px; background: #4caf50; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    🔄 Qayta urinish
                </button>
            </div>
        </div>
    `;
}

function closeIELTSPlayer() {
    const player = document.getElementById('ielts-player');
    player.style.display = 'none';
    player.innerHTML = '';
    
    // Clear any running timer
    if (currentListeningGame && currentListeningGame.timerInterval) {
        clearInterval(currentListeningGame.timerInterval);
    }
    currentListeningGame = null;
}

// ==========================================
// OTHER STAGES (Placeholder for now)
// ==========================================
function startReadingGame(training) {
    showNotification('🚧 Reading training tez orada!', 'info');
}

function startWritingGame(training) {
    showNotification('🚧 Writing training tez orada!', 'info');
}

function startSpeakingGame(training) {
    showNotification('🚧 Speaking training tez orada!', 'info');
}

// ==========================================
// INITIALIZE ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initIELTS();
});
