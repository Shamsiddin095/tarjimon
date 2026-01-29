// Global search functionality
let allWordsForSearch = [];

// ============== ADD WORDS TOGGLE ==============
document.getElementById('toggle-add-words-btn').addEventListener('click', () => {
    const section = document.getElementById('add-words-section');
    const btn = document.getElementById('toggle-add-words-btn');
    section.style.display = 'block';
    btn.style.display = 'none';
});

document.getElementById('close-add-words-btn').addEventListener('click', () => {
    const section = document.getElementById('add-words-section');
    const btn = document.getElementById('toggle-add-words-btn');
    section.style.display = 'none';
    btn.style.display = 'block';
});

// ============== SEARCH FUNCTIONALITY ==============

// Search input listener
document.getElementById('global-search-input').addEventListener('input', debounceSearch);

function debounceSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        document.getElementById('search-results-overlay').style.display = 'none';
        document.getElementById('search-results-modal').style.display = 'none';
        return;
    }
    
    if (query.length < 2) {
        return;
    }
    
    performSearch(query);
}

function performSearch(query) {
    const results = [];
    
    // Barcha so'zlardan qidirish
    allWordsForSearch.forEach(word => {
        let relevance = 0;
        let matchedText = '';
        let translation = '';
        
        // English bo'yicha qidirish
        if (word.english.toLowerCase().includes(query)) {
            relevance = word.english.toLowerCase().startsWith(query) ? 100 : 50;
            matchedText = word.english;
            translation = word.uzbek;
        }
        // Uzbek bo'yicha qidirish
        else if (word.uzbek.toLowerCase().includes(query)) {
            relevance = word.uzbek.toLowerCase().startsWith(query) ? 100 : 50;
            matchedText = word.uzbek;
            translation = word.english;
        }
        
        if (relevance > 0) {
            results.push({
                ...word,
                relevance,
                matchedText,
                translation
            });
        }
    });
    
    // Relevance bo'yicha sort qilish
    results.sort((a, b) => b.relevance - a.relevance);
    
    // Max 10 ta natija ko'rsatish
    const topResults = results.slice(0, 10);
    
    displaySearchResults(topResults, query);
}

function displaySearchResults(results, query) {
    const overlay = document.getElementById('search-results-overlay');
    const modal = document.getElementById('search-results-modal');
    const container = document.getElementById('search-results-container');
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    if (results.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Topilmadi</p>';
        return;
    }
    
    container.innerHTML = results.map(word => `
        <div style="
            padding: 15px;
            margin-bottom: 10px;
            background: #f5f5f5;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            cursor: pointer;
            transition: all 0.3s;
        " onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='#f5f5f5'">
            <div style="font-weight: bold; color: #667eea; margin-bottom: 5px; font-size: 16px;">
                ${word.english}
            </div>
            <div style="color: #666; font-size: 14px;">
                🇺🇿 ${word.uzbek}
            </div>
            <div style="color: #999; font-size: 12px; margin-top: 5px;">
                📚 Unit ${word.unit}
            </div>
        </div>
    `).join('');
}

// Close search modal
document.getElementById('search-results-overlay').addEventListener('click', () => {
    document.getElementById('search-results-overlay').style.display = 'none';
    document.getElementById('search-results-modal').style.display = 'none';
    document.getElementById('global-search-input').value = '';
});

document.getElementById('close-search-results').addEventListener('click', () => {
    document.getElementById('search-results-overlay').style.display = 'none';
    document.getElementById('search-results-modal').style.display = 'none';
    document.getElementById('global-search-input').value = '';
});

// Yangi so'z qo'shish uchun input qo'shish
document.getElementById('add-more-words').addEventListener('click', function() {
    const container = document.getElementById('word-inputs-container');
    const newRow = document.createElement('div');
    newRow.className = 'word-input-row';
    newRow.innerHTML = `
        <input type="text" class="english-input" placeholder="Inglizcha">
        <input type="text" class="uzbek-input" placeholder="O'zbekcha">
    `;
    container.appendChild(newRow);
});

// Saqlash tugmasi
document.getElementById('save-words').addEventListener('click', async function() {
    const unitNumber = document.getElementById('unit-number').value;
    const inputs = document.querySelectorAll('.word-input-row');
    const message = document.getElementById('save-message');

    console.log('💾 Saqlash boshlandi - Unit:', unitNumber, 'Inputlar:', inputs.length);

    if (!unitNumber) {
        message.textContent = '❌ Unit raqamini kiriting!';
        message.style.color = 'red';
        return;
    }

    let savedCount = 0;
    let errorCount = 0;

    for (let row of inputs) {
        const english = row.querySelector('.english-input').value.trim();
        const uzbek = row.querySelector('.uzbek-input').value.trim();

        if (english && uzbek) {
            try {
                console.log('📤 So\'z yuborilmoqda:', { english, uzbek, unit: unitNumber });
                const response = await fetch(`${window.API_BASE_URL}/words`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ english, uzbek, unit: parseInt(unitNumber) })
                });

                console.log('Response status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ So\'z saqlandi:', result);
                    savedCount++;
                    row.querySelector('.english-input').value = '';
                    row.querySelector('.uzbek-input').value = '';
                } else {
                    const error = await response.text();
                    console.error('❌ Server xatosi:', error);
                    errorCount++;
                }
            } catch (err) {
                console.error('❌ Xato:', err);
                errorCount++;
            }
        }
    }

    if (savedCount > 0) {
        showNotification(`${savedCount} ta so'z saqlandi!`, 'success');
        
        // Barcha inputlarni tozalash
        const allInputs = document.querySelectorAll('.english-input, .uzbek-input');
        allInputs.forEach(input => input.value = '');
        
        // Unit raqamini tozalash
        document.getElementById('unit-number').value = '';
        
        // Qo'shimcha qatorlarni olib tashlash (faqat birinchi qatorni qoldirish)
        const wordInputRows = document.querySelectorAll('.word-input-row');
        for (let i = 1; i < wordInputRows.length; i++) {
            wordInputRows[i].remove();
        }
        
        // Container yopish va tugmani ko'rsatish
        document.getElementById('add-words-section').style.display = 'none';
        document.getElementById('toggle-add-words-btn').style.display = 'block';
        
        setTimeout(() => loadUnits(), 1000);
    } else if (errorCount > 0) {
        showNotification(`${errorCount} ta so'z saqlanmadi`, 'error');
    } else {
        showNotification('Hech qanday so\'z kiritilmadi!', 'info');
    }
});

// Unitlarni yuklash va ko'rsatish
async function loadUnits() {
    try {
        console.log('📍 loadUnits ishga tushdi - API ga request yuborilmoqda...');
        const [wordsRes, statsRes] = await Promise.all([
            fetch(`${window.API_BASE_URL}/all-words`),
            fetch(`${window.API_BASE_URL}/unit-stats`)
        ]);
        
        if (!wordsRes.ok || !statsRes.ok) {
            throw new Error(`API Error`);
        }
        
        const allWords = await wordsRes.json();
        const allStats = await statsRes.json();
        
        // Search uchun barcha so'zlarni saqlab qo'yish
        allWordsForSearch = allWords;
        
        console.log('✅ So\'zlar yuklandi:', allWords);
        console.log('📊 Unit stats yuklandi:', allStats);

        const unitSet = new Set(allWords.map(w => w.unit));
        const unitsList = document.getElementById('units-list');
        unitsList.innerHTML = '';
        
        // Flex layout qo'shish
        unitsList.style.display = 'flex';
        unitsList.style.flexWrap = 'wrap';
        unitsList.style.gap = '10px';
        unitsList.style.justifyContent = 'flex-start';
        unitsList.style.alignItems = 'flex-start';

        if (unitSet.size === 0) {
            unitsList.innerHTML = '<p>Hali hech qanday unit yo\'q</p>';
            return;
        }

        // Unitlarni sort qilish
        const sortedUnits = Array.from(unitSet).sort((a, b) => a - b);

        sortedUnits.forEach(unit => {
            // Unit stats'dan foydalanish (yangi unit uchun default 0)
            const unitStat = allStats.find(s => s.unit === unit);
            const mode1Percentage = unitStat?.gameMode1Avg || 0;
            const mode2Percentage = unitStat?.gameMode2Avg || 0;
            const mode3Percentage = unitStat?.gameMode3Avg || 0;
            
            // XATOLIK TI: Agarda stats hali yaratilmagan bo'lsa (yangi unit), hamma 0 bo'lishi kerak
            // Mode larning barchasini tekshirish - agar 0 bo'lsa, stats yo'q deb bilaman
            const hasStats = unitStat && (mode1Percentage > 0 || mode2Percentage > 0 || mode3Percentage > 0);
            
            console.log(`📊 Unit ${unit}: Mode1=${mode1Percentage}% Mode2=${mode2Percentage}% Mode3=${mode3Percentage}% hasStats=${hasStats}`); // Debug
            
            // Umumiy foyiz - eng yuqori average (agar stats yo'q bo'lsa, 0)
            const overallPercentage = hasStats ? Math.max(mode1Percentage, mode2Percentage, mode3Percentage) : 0;
            
            const button = document.createElement('button');
            button.style.padding = '10px 15px';
            button.style.margin = '0';
            button.style.cursor = 'pointer';
            button.style.fontSize = '13px';
            button.style.fontWeight = 'bold';
            button.style.borderRadius = '8px';
            button.style.border = 'none';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            button.style.color = 'white';
            button.style.transition = 'all 0.3s';
            button.style.minWidth = '120px';
            button.style.textAlign = 'center';
            
            // 3 ta game mode foyizi ko'rsatish
            let modeInfo = `<span style="font-size: 9px; display: block; margin-top: 3px;">`;
            modeInfo += `📋 ${mode1Percentage}% | `;
            modeInfo += `✏️ ${mode2Percentage}% | `;
            modeInfo += `⚡ ${mode3Percentage}%`;
            modeInfo += `</span>`;
            
            // Umumiy completion foyizi ko'rsatish
            if (overallPercentage === 100) {
                button.innerHTML = `Unit ${unit}<br><span style="font-size: 10px;">✅ 100%!</span>${modeInfo}`;
                button.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            } else if (overallPercentage > 0) {
                button.innerHTML = `Unit ${unit}<br><span style="font-size: 10px;">⏳ ${overallPercentage}%</span>${modeInfo}`;
                button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            } else {
                button.innerHTML = `Unit ${unit}<br><span style="font-size: 10px;">📚 Boshlash</span>${modeInfo}`;
            }
            
            button.onmouseover = () => {
                button.style.transform = 'scale(1.05)';
                button.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
            };
            button.onmouseout = () => {
                button.style.transform = 'scale(1)';
                button.style.boxShadow = 'none';
            };
            
            button.onclick = () => showVerification(unit);
            unitsList.appendChild(button);
        });
    } catch (err) {
        console.error('❌ Unitlarni yuklashda xato:', err);
        document.getElementById('units-list').innerHTML = `<p style="color:red;">Xato: ${err.message}</p>`;
    }
}

// Success notification ko'rsatish
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        font-size: 16px;
        z-index: 9999;
        animation: slideIn 0.5s ease-in-out;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        notification.innerHTML = `✅ ${message}`;
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)';
        notification.innerHTML = `❌ ${message}`;
    } else if (type === 'info') {
        notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        notification.innerHTML = `ℹ️ ${message}`;
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in-out';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Animation CSS qo'shish
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Global game mode o'zgaruvchisi
let selectedGameMode = 1; // Default: Jadval drag-drop

// Game mode buttonlarini setup qilish
function setupGameModeButtons() {
    const mode1Btn = document.getElementById('game-mode-1');
    const mode2Btn = document.getElementById('game-mode-2');
    const mode3Btn = document.getElementById('game-mode-3');

    const updateButtonStyles = () => {
        [mode1Btn, mode2Btn, mode3Btn].forEach(btn => {
            btn.style.opacity = '0.6';
            btn.style.transform = 'scale(1)';
        });
        if (selectedGameMode === 1) mode1Btn.style.opacity = '1';
        else if (selectedGameMode === 2) mode2Btn.style.opacity = '1';
        else if (selectedGameMode === 3) mode3Btn.style.opacity = '1';
    };

    mode1Btn.onclick = () => { selectedGameMode = 1; updateButtonStyles(); };
    mode2Btn.onclick = () => { selectedGameMode = 2; updateButtonStyles(); };
    mode3Btn.onclick = () => { selectedGameMode = 3; updateButtonStyles(); };
    
    updateButtonStyles();
}

// Verification view - dars tekshirish
async function showVerification(unit) {
    try {
        console.log('📋 Verification boshlandi - Unit:', unit);
        const response = await fetch(`${window.API_BASE_URL}/words/${unit}`);
        const words = await response.json();

        if (words.length === 0) {
            showNotification('Bu unitda so\'z yo\'q', 'error');
            return;
        }

        // Verification section ko'rsatish
        const verificationSection = document.getElementById('verification-section');
        const verificationContainer = document.getElementById('verification-container');
        verificationSection.style.display = 'block';
        verificationContainer.innerHTML = '';

        const verificationDiv = document.createElement('div');
        verificationDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;';

        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = 'padding: 15px; background: #f0f8ff; border-radius: 10px;';
        leftDiv.innerHTML = '<h3>📖 Inglizcha</h3>';

        const rightDiv = document.createElement('div');
        rightDiv.style.cssText = 'padding: 15px; background: #fffaf0; border-radius: 10px;';
        rightDiv.innerHTML = '<h3>Uz</h3>';

        // To'g'ri tartibda ko'rsatish (shuffle yo'q)
        words.forEach(word => {
            const englishEl = document.createElement('div');
            englishEl.style.cssText = `
                padding: 12px 15px;
                background: #e3f2fd;
                border-radius: 8px;
                margin: 8px 0;
                border-left: 4px solid #2196F3;
                font-weight: bold;
            `;
            englishEl.textContent = word.english;
            leftDiv.appendChild(englishEl);

            const uzbekEl = document.createElement('div');
            uzbekEl.style.cssText = `
                padding: 12px 15px;
                background: #fff3e0;
                border-radius: 8px;
                margin: 8px 0;
                border-left: 4px solid #FF9800;
                font-weight: bold;
            `;
            uzbekEl.textContent = word.uzbek;
            rightDiv.appendChild(uzbekEl);
        });

        verificationDiv.appendChild(leftDiv);
        verificationDiv.appendChild(rightDiv);
        verificationContainer.appendChild(verificationDiv);

        // Unit raqamini global savday qilish
        window.currentUnit = unit;
        window.currentUnitWords = words;

        // Game mode buttonlarini setup qilish
        setupGameModeButtons();

        // Close button
        document.getElementById('close-verification-btn').onclick = () => {
            verificationSection.style.display = 'none';
        };

        // Start game button
        document.getElementById('start-game-btn').onclick = () => {
            verificationSection.style.display = 'none';
            if (selectedGameMode === 1) {
                startGameMode1(unit, words);
            } else if (selectedGameMode === 2) {
                startGameMode2(unit, words);
            } else if (selectedGameMode === 3) {
                startGameMode3(unit, words);
            }
        };

    } catch (err) {
        console.error('❌ Verification xatosi:', err);
        showNotification('Xato: ' + err.message, 'error');
    }
}

// ============================================================
// GAME MODE 1 - JADVAL CLICK MATCHING
// ============================================================
function startGameMode1(unit, words) {
    console.log('🎮 Game Mode 1 (Click Matching) boshlandi - Unit:', unit);
    const practiceSection = document.getElementById('practice-section');
    const practiceContainer = document.getElementById('practice-container');
    practiceSection.style.display = 'block';
    practiceContainer.innerHTML = '';

    // answeredCorrectly Set-ni reset qilish
    answeredCorrectly = new Set();

    // So'zlarni aralash tartibda
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const uzbekTranslations = [...words.map(w => w.uzbek)].sort(() => Math.random() - 0.5);

    let correctCount = 0;
    let selectedEnglish = null; // Tanlangan inglizcha so'z
    let selectedEnglishId = null;
    const matchMap = new Map();
    
    words.forEach(word => {
        matchMap.set(word.english, word.uzbek);
    });

    console.log('Match Map:', matchMap);

    // UI yaratish
    const gameDiv = document.createElement('div');
    gameDiv.className = 'drag-drop-container';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'drag-drop-column';
    leftDiv.innerHTML = '<h3>En</h3>';
    
    const rightDiv = document.createElement('div');
    rightDiv.className = 'drag-drop-column';
    rightDiv.innerHTML = '<h3>Uz</h3>';

    // Chap tomon - englizcha so'zlar (clickable)
    shuffledWords.forEach((word) => {
        const wordEl = document.createElement('div');
        wordEl.id = `word-${word._id}`;
        wordEl.className = 'word-item';
        wordEl.textContent = word.english;
        wordEl.setAttribute('data-word-id', word._id);
        wordEl.setAttribute('data-english', word.english);
        
        // Click handler - so'zni tanlash
        wordEl.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Agar allaqachon javob bo'lsa, bosmang
            if (wordEl.classList.contains('answered-correctly')) {
                return;
            }

            // Oldingi tanlangan so'zni unselect qilish
            if (selectedEnglishId) {
                const prevElement = document.getElementById(`word-${selectedEnglishId}`);
                if (prevElement) {
                    prevElement.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
                    prevElement.style.border = '2px solid #2196F3';
                    prevElement.style.boxShadow = 'none';
                }
            }

            // Yangi so'zni select qilish
            selectedEnglish = word.english;
            selectedEnglishId = word._id;
            wordEl.style.background = 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)';
            wordEl.style.border = '3px solid #1976d2';
            wordEl.style.boxShadow = '0 0 15px rgba(25, 118, 210, 0.5)';
        });

        leftDiv.appendChild(wordEl);
    });

    // O'ng tomon - o'zbekcha tarjimalar (clickable)
    uzbekTranslations.forEach((translation) => {
        const translationEl = document.createElement('div');
        translationEl.className = 'word-item';
        translationEl.style.cssText = `
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-left: 4px solid #FF9800;
            cursor: pointer;
            margin: 8px 0;
            user-select: none;
            min-height: 30px;
            font-weight: bold;
            transition: all 0.2s;
        `;
        translationEl.textContent = translation;
        translationEl.setAttribute('data-translation', translation);
        
        // Click handler - javobni tekshirish
        translationEl.addEventListener('click', (e) => {
            e.stopPropagation();

            // Agar bu tarjima allaqachon to'g'ri javob bo'lsa
            if (translationEl.classList.contains('answered-correctly')) {
                return;
            }

            // Agar inglizcha so'z tanlangan bo'lsa
            if (selectedEnglish) {
                const correctTranslation = matchMap.get(selectedEnglish);

                if (translation === correctTranslation) {
                    // ✅ TO'G'RI JAVOB
                    translationEl.style.background = '#c8e6c9';
                    translationEl.style.border = '2px solid #4caf50';
                    translationEl.style.color = 'green';
                    translationEl.style.fontWeight = 'bold';
                    translationEl.style.cursor = 'not-allowed';
                    translationEl.textContent = '✅ ' + translation;
                    translationEl.classList.add('answered-correctly');
                    translationEl.style.pointerEvents = 'none';
                    
                    // Englizcha so'zni disable qilish
                    const wordObj = words.find(w => w.english === selectedEnglish);
                    if (wordObj) {
                        // answeredCorrectly Set-a qo'shish (foyiz hisoblanishi uchun)
                        answeredCorrectly.add(wordObj._id);
                        
                        const wordElement = document.getElementById(`word-${wordObj._id}`);
                        if (wordElement) {
                            wordElement.style.opacity = '0.5';
                            wordElement.style.cursor = 'not-allowed';
                            wordElement.classList.add('answered-correctly');
                            wordElement.style.pointerEvents = 'none';
                            wordElement.style.background = 'linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%)';
                            wordElement.style.border = '2px solid #999';
                            wordElement.style.boxShadow = 'none';
                        }
                    }
                    
                    correctCount++;
                    document.getElementById('correct-count').textContent = correctCount;

                    // Barcha so'g'ri joylangan tekshirish
                    if (correctCount === words.length) {
                        setTimeout(() => {
                            completeUnit(unit, words);
                        }, 500);
                    }

                    // Selection-ni tozalash
                    selectedEnglish = null;
                    selectedEnglishId = null;
                } else {
                    // ❌ XA'TO JAVOB
                    translationEl.style.background = '#ffcdd2';
                    translationEl.style.border = '2px solid #f44336';
                    translationEl.style.color = 'red';
                    translationEl.textContent = '❌ ' + translation;
                    
                    setTimeout(() => {
                        translationEl.style.background = '#fff3e0';
                        translationEl.style.border = '2px dashed #FF9800';
                        translationEl.style.color = 'black';
                        translationEl.textContent = translation;
                    }, 1500);
                }
            } else {
                // Avval inglizcha so'z tanlang
                translationEl.style.background = '#fff9c4';
                translationEl.textContent = '⚠️ Avval inglizcha so\'z tanlang!';
                
                setTimeout(() => {
                    translationEl.style.background = '#fff3e0';
                    translationEl.textContent = translation;
                }, 1500);
            }
        });

        rightDiv.appendChild(translationEl);
    });

    gameDiv.appendChild(leftDiv);
    gameDiv.appendChild(rightDiv);
    practiceContainer.appendChild(gameDiv);

    // Hol ko'rsatish
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        margin-top: 20px;
        padding: 15px;
        background: #f0f0f0;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
        font-size: 18px;
    `;
    statusDiv.innerHTML = `<span style="color: #2196F3;">To'g'ri joylangan:</span> <span id="correct-count" style="color: #4caf50; font-size: 24px;">0</span>/<span style="font-size: 24px;">${words.length}</span>`;
    practiceContainer.appendChild(statusDiv);
}

// ============================================================
// GAME MODE 2 - O'ZBEKCHA YOZISH (Text Input)
// ============================================================
function startGameMode2(unit, words) {
    console.log('🎮 Game Mode 2 (O\'zbekcha Yozish) boshlandi - Unit:', unit);
    const practiceSection = document.getElementById('practice-section');
    const practiceContainer = document.getElementById('practice-container');
    practiceSection.style.display = 'block';
    practiceContainer.innerHTML = '';

    let currentIndex = 0;
    let correctCount = 0;
    answeredCorrectly = new Set(); // Reset

    const matchMap = new Map();
    words.forEach(word => {
        matchMap.set(word.english, word.uzbek);
    });

    function showCurrentWord() {
        practiceContainer.innerHTML = '';

        if (currentIndex >= words.length) {
            completeUnit(unit, words);
            return;
        }

        const word = words[currentIndex];

        const containerDiv = document.createElement('div');
        containerDiv.className = 'game-mode-2-container';

        const wordDiv = document.createElement('div');
        wordDiv.className = 'game-mode-2-word';
        wordDiv.textContent = word.uzbek;
        containerDiv.appendChild(wordDiv);

        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = 'font-size: 18px; margin-top: 20px;';
        labelDiv.textContent = `${currentIndex + 1}/${words.length} - Inglizchasi:`;
        containerDiv.appendChild(labelDiv);

        const inputDiv = document.createElement('div');
        inputDiv.style.cssText = 'margin: 20px 0;';

        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'game-mode-2-input';
        inputEl.placeholder = 'Inglizchani yozib kiriting...';
        inputDiv.appendChild(inputEl);
        containerDiv.appendChild(inputDiv);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';

        const checkBtn = document.createElement('button');
        checkBtn.textContent = '✓ Tekshirish';
        checkBtn.style.cssText = `
            flex: 1;
            padding: 15px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        `;

        const skipBtn = document.createElement('button');
        skipBtn.textContent = '⊳ O\'tish';
        skipBtn.style.cssText = `
            flex: 1;
            padding: 15px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        `;

        checkBtn.onclick = () => {
            const userAnswer = inputEl.value.trim().toLowerCase();
            const correctAnswer = word.english.toLowerCase();

            if (userAnswer === correctAnswer) {
                showNotification(`✅ To'g'ri! (${correctCount + 1}/${words.length})`, 'success');
                answeredCorrectly.add(word._id);
                correctCount++;
                currentIndex++;
                showCurrentWord();
            } else {
                showNotification(`❌ Noto'g'ri. To'g'ri javob: ${word.english}`, 'error');
                currentIndex++;
                showCurrentWord();
            }
        };

        skipBtn.onclick = () => {
            showNotification(`⊳ O'tib yuborildi: ${word.english}`, 'info');
            currentIndex++;
            showCurrentWord();
        };

        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkBtn.click();
        });

        buttonsDiv.appendChild(checkBtn);
        buttonsDiv.appendChild(skipBtn);
        containerDiv.appendChild(buttonsDiv);

        practiceContainer.appendChild(containerDiv);

        // Progress bar
        const progressDiv = document.createElement('div');
        progressDiv.style.cssText = `
            background: #ddd;
            height: 10px;
            border-radius: 5px;
            overflow: hidden;
            margin-top: 20px;
        `;

        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            width: ${(currentIndex / words.length) * 100}%;
            transition: width 0.3s;
        `;
        progressDiv.appendChild(progressBar);
        practiceContainer.appendChild(progressDiv);

        inputEl.focus();
    }

    showCurrentWord();
}

// ============================================================
// GAME MODE 3 - TEZKOR TANLOV (Multiple Choice, 5-sec Timer)
// ============================================================
function startGameMode3(unit, words) {
    console.log('🎮 Game Mode 3 (Tezkor Tanlov) boshlandi - Unit:', unit);
    const practiceSection = document.getElementById('practice-section');
    const practiceContainer = document.getElementById('practice-container');
    practiceSection.style.display = 'block';
    practiceContainer.innerHTML = '';

    let currentIndex = 0;
    let correctCount = 0;
    answeredCorrectly = new Set();
    let timeoutId = null;
    let canAnswer = true;

    // Barcha so'zlarni randomize qilish
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const usedIndices = new Set();

    function getRandomAnswerOptions(correctWord, count = 3) {
        // count-1 ta noto'g'ri variant + 1 ta to'g'ri javob = count ta jami
        const allOtherWords = words.filter(w => w._id !== correctWord._id);
        const wrongOptions = [];
        const needOptions = Math.min(count - 1, allOtherWords.length);
        
        while (wrongOptions.length < needOptions && allOtherWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * allOtherWords.length);
            wrongOptions.push(allOtherWords[randomIndex]);
            allOtherWords.splice(randomIndex, 1);
        }
        
        // Javob variantlarini yaratish
        const options = [...wrongOptions, correctWord];
        options.sort(() => Math.random() - 0.5);
        return options;
    }

    function showCurrentWord() {
        practiceContainer.innerHTML = '';
        canAnswer = true;

        if (currentIndex >= shuffledWords.length) {
            completeUnit(unit, words);
            return;
        }

        const word = shuffledWords[currentIndex];
        const options = getRandomAnswerOptions(word);

        const containerDiv = document.createElement('div');
        containerDiv.className = 'game-mode-3-container';

        // So'z ko'rsatish
        const wordDiv = document.createElement('div');
        wordDiv.className = 'game-mode-3-word';
        wordDiv.textContent = word.uzbek;
        containerDiv.appendChild(wordDiv);

        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = 'font-size: 18px; margin-top: 10px;';
        labelDiv.textContent = `${currentIndex + 1}/${shuffledWords.length} - Inglizchasini tanlang:`;
        containerDiv.appendChild(labelDiv);

        // Timing
        let timeLeft = 5;
        const timerDiv = document.createElement('div');
        timerDiv.className = 'timer';
        timerDiv.textContent = timeLeft;
        containerDiv.appendChild(timerDiv);

        // Javob variantlari
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options-container';

        const optionLetters = ['a)', 'b)', 'c)'];
        options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-button';
            optionBtn.textContent = `${optionLetters[index]}\n${option.english}`;
            optionBtn.setAttribute('data-word-id', option._id);

            optionBtn.onmouseover = () => {
                if (canAnswer) {
                    optionBtn.style.background = 'rgba(255, 255, 255, 0.4)';
                    optionBtn.style.transform = 'scale(1.08)';
                }
            };

            optionBtn.onmouseout = () => {
                if (canAnswer) {
                    optionBtn.style.background = 'rgba(255, 255, 255, 0.2)';
                    optionBtn.style.transform = 'scale(1)';
                }
            };

            optionBtn.onclick = async () => {
                if (!canAnswer) return;
                
                canAnswer = false;
                clearInterval(timeoutId);

                if (option._id === word._id) {
                    // To'g'ri javob
                    optionBtn.style.background = '#4caf50';
                    optionBtn.style.border = '2px solid #2e7d32';
                    optionBtn.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.8)';
                    optionBtn.textContent = `✅ ${optionLetters[index]}\n${option.english}`;
                    
                    answeredCorrectly.add(word._id);
                    correctCount++;
                    
                    setTimeout(() => {
                        currentIndex++;
                        showCurrentWord();
                    }, 1500);
                } else {
                    // Noto'g'ri javob
                    optionBtn.style.background = '#f44336';
                    optionBtn.style.border = '2px solid #c62828';
                    optionBtn.style.boxShadow = '0 0 20px rgba(244, 67, 54, 0.8)';
                    optionBtn.textContent = `❌ ${optionLetters[index]}\n${option.english}`;
                    
                    // To'g'ri javobni topish va ko'rsatish
                    const correctIndex = options.findIndex(opt => opt._id === word._id);
                    if (correctIndex !== -1) {
                        const correctBtn = Array.from(optionBtn.parentElement.children)[correctIndex];
                        if (correctBtn) {
                            correctBtn.style.background = '#4caf50';
                            correctBtn.style.border = '2px solid #2e7d32';
                            correctBtn.textContent = `✓ ${optionLetters[correctIndex]}\n${word.english}`;
                        }
                    }
                    
                    setTimeout(() => {
                        currentIndex++;
                        showCurrentWord();
                    }, 2000);
                }
            };

            optionsDiv.appendChild(optionBtn);
        });

        containerDiv.appendChild(optionsDiv);
        practiceContainer.appendChild(containerDiv);

        // Timer logic
        const updateTimer = () => {
            timeLeft--;
            timerDiv.textContent = timeLeft;
            
            if (timeLeft === 0) {
                canAnswer = false;
                timerDiv.style.color = '#ff6b6b';
                // Avtomatik keyingi so'zga o'tish
                setTimeout(() => {
                    currentIndex++;
                    showCurrentWord();
                }, 1500);
            } else if (timeLeft <= 2) {
                timerDiv.style.color = '#ff6b6b';
            }
        };

        timeoutId = setInterval(updateTimer, 1000);

        // Progress bar
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-bar-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${(currentIndex / shuffledWords.length) * 100}%`;
        progressBar.style.background = 'linear-gradient(90deg, #FF9800 0%, #f44336 100%)';
        progressDiv.appendChild(progressBar);
        practiceContainer.appendChild(progressDiv);

        // To'g'ri javoblar sonini ko'rsatish
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-display';
        scoreDiv.innerHTML = `<span>To'g'ri javoblar:</span> <span class="score-number">${correctCount}</span>/<span>${shuffledWords.length}</span>`;
        practiceContainer.appendChild(scoreDiv);
    }

    showCurrentWord();
}

// Global o'zgaruvchilar - to'g'ri javoblar berilgan so'zlarni track qilish
let answeredCorrectly = new Set(); // To'g'ri javob berilgan so'zlarning ID lari

// Unit tugallanganda - statusni update qilish (har bir game mode uchun foyiz saqlaymuz)
async function completeUnit(unit, words) {
    try {
        const correctPercentage = Math.round((answeredCorrectly.size / words.length) * 100);
        console.log(`🎯 Complete Unit ${unit}: ${answeredCorrectly.size}/${words.length} = ${correctPercentage}%`); // Debug
        
        if (answeredCorrectly.size === words.length) {
            showNotification('🎉 Barcha so\'zlar 100% to\'g\'ri! Yodlash tugallandi!', 'success');
        } else {
            showNotification(`✅ O'yin tugadi! ${correctPercentage}% to'g'ri!`, 'success');
        }
        
        console.log(`🎮 Game Mode ${selectedGameMode} tugadi. Foyiz: ${correctPercentage}%`); // Debug
        
        // Batch update - barcha so'zlarni bitta request'da update qilish
        try {
            const updates = [];
            
            for (let word of words) {
                // Bu so'zni o'zining foyizini hisoblash
                const wordCorrect = answeredCorrectly.has(word._id);
                const wordPercentage = wordCorrect ? 100 : 0;
                
                const updateData = { id: word._id };
                
                // Tanlangan game mode uchun foyiz update qilish
                if (selectedGameMode === 1) {
                    updateData.gameMode1 = wordPercentage;
                } else if (selectedGameMode === 2) {
                    updateData.gameMode2 = wordPercentage;
                } else if (selectedGameMode === 3) {
                    updateData.gameMode3 = wordPercentage;
                }
                
                updates.push(updateData);
            }
            
            console.log(`📦 Batch update yuborilmoqda: Unit ${unit}, ${updates.length} ta so'z`); // Debug
            
            const result = await fetch(`${window.API_BASE_URL}/batch-update`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates, unit })
            });
            
            if (result.ok) {
                const batchResult = await result.json();
                const gameModeName = selectedGameMode === 1 ? 'Mode1' : selectedGameMode === 2 ? 'Mode2' : 'Mode3';
                console.log(`✅ Batch update tugallandi: ${batchResult.modified}/${batchResult.matched} so'z. Game Mode ${selectedGameMode}: ${correctPercentage}%`, batchResult.stats); // Debug
            } else {
                console.error(`❌ Batch update failed:`, result.status);
            }
        } catch (err) {
            console.error('Batch update xatosi:', err);
        }

        // Unitlarni qayta yuklash (progress update qilib ko'rsatish uchun)
        setTimeout(() => {
            console.log('🔄 loadUnits chaqirilmoqda...'); // Debug
            document.getElementById('practice-section').style.display = 'none';
            answeredCorrectly = new Set(); // Reset qilish
            loadUnits();
        }, 2000);

    } catch (err) {
        console.error('❌ Complete xatosi:', err);
        showNotification('Xato: ' + err.message, 'error');
    }
}

// Sahifa yuklanganda unitlarni ko'rsatish
window.addEventListener('load', loadUnits);

// ============================================================
// SERVICE WORKER REGISTRATION & PWA SETUP
// ============================================================

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered:', registration);
      
      // Update checking every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
      // New version available notification
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            showNotification('🔄 Yangi versiya mavjud! Sahifani yangilang.', 'info');
          }
        });
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

// PWA Install prompt handling
let deferredPrompt;
let installBtnElement = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('📲 Install prompt available');
  
  // Agar button allaqachon bor bo'lsa, o'chirib tashla
  if (installBtnElement) {
    installBtnElement.remove();
    installBtnElement = null;
  }
  
  // UI'da install button ko'rsatish
  installBtnElement = createInstallButton();
  if (installBtnElement) {
    document.body.appendChild(installBtnElement);
    
    // 5 sekunddan keyin button o'chiriladi
    setTimeout(() => {
      if (installBtnElement && installBtnElement.parentNode) {
        installBtnElement.style.animation = 'slideOut 0.5s ease-in-out';
        setTimeout(() => {
          if (installBtnElement && installBtnElement.parentNode) {
            installBtnElement.remove();
            installBtnElement = null;
          }
        }, 500);
      }
    }, 5000);
  }
});

function createInstallButton() {
  if (!deferredPrompt) return null;
  
  const btn = document.createElement('button');
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: bold;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    font-size: 14px;
    transition: all 0.3s ease;
    animation: slideDown 0.5s ease-out;
  `;
  btn.textContent = '📲 Ilovani O\'rnatish';
  
  btn.onmouseover = () => {
    btn.style.transform = 'translateY(3px)';
    btn.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
  };
  
  btn.onmouseout = () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.4)';
  };
  
  btn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      btn.remove();
      installBtnElement = null;
    }
  };
  
  // slideDown animation qo'shish
  if (!document.getElementById('install-button-styles')) {
    const style = document.createElement('style');
    style.id = 'install-button-styles';
    style.textContent = `
      @keyframes slideDown {
        from {
          transform: translateY(-100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  return btn;
}

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed!');
  deferredPrompt = null;
  showNotification('✅ Ilova muvaffaqiyatli o\'rnatildi!', 'success');
});

// Connection status monitoring
window.addEventListener('online', () => {
  console.log('🌐 Back online');
  showNotification('🌐 Internet ulandi!', 'success');
  loadUnits(); // Refresh data
});

// ========== ENVIRONMENT-BASED API URL ==========
// Determines whether to use localhost or Vercel domain
const API_BASE_URL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  // For Vercel, use relative path (same domain)
  return '/api';
};

// Set global API base
window.API_BASE_URL = API_BASE_URL();

// ========== SERVICE WORKER REGISTRATION ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered:', registration);
      
      // Check for updates every hour
      setInterval(() => {
        registration.update().catch(err => console.log('Update check failed:', err));
      }, 60 * 60 * 1000);
    } catch (error) {
      console.log('❌ Service Worker registration failed:', error);
    }
  });

  // Handle Service Worker messages
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'VERSION_CHECK'
    });
  }

  // Notify when new version is available
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'NEW_VERSION') {
      showNotification('📱 Yangi versiya mavjud. Sahifani qayta yuklash uchun F5 bosing', 'info');
    }
  });
}

window.addEventListener('offline', () => {
  console.log('📴 Offline');
  showNotification('📴 Internet uzildi - Offline mode', 'info');
});

