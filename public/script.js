// Global search functionality
let allWordsForSearch = [];
let allUnitsData = []; // Unit ma'lumotlari uchun

// ============== LANGUAGE SETTINGS ==============
let searchLanguage = 'uz-en'; // Default: UZ-EN (o'zbek'dan inglizcha'ga)
let voiceLanguage = 'uz-UZ'; // O'zbek tili bilan qidiruv

// ============== SPEECH RECOGNITION SETUP ==============
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage; // O'zbek tili
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
        isListening = true;
        const btn = document.getElementById('voice-search-btn');
        btn.style.background = '#4caf50';
        btn.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.6)';
        btn.textContent = '🎤 📢';
    };
    
    recognition.onresult = (event) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            transcript += t;
        }
        
        // Qidiruv inputiga yozing
        const searchInput = document.getElementById('global-search-input');
        searchInput.value = transcript.toLowerCase();
        
        // Qidiruv bajaring
        if (event.results[event.results.length - 1].isFinal) {
            performSearch(transcript.toLowerCase());
        }
    };
    
    recognition.onend = () => {
        isListening = false;
        const btn = document.getElementById('voice-search-btn');
        btn.style.background = 'rgba(255, 255, 255, 0.25)';
        btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        btn.textContent = '🎤';
    };
    
    recognition.onerror = (event) => {
        console.error('Ovoz tanishmoda xato:', event.error);
        showNotification('Ovoz tanishmoda xato: ' + event.error, 'error');
        isListening = false;
        const btn = document.getElementById('voice-search-btn');
        btn.style.background = 'rgba(255, 255, 255, 0.25)';
        btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        btn.textContent = '🎤';
    };
}

// Til almashish tugmasi
document.getElementById('language-toggle-btn').addEventListener('click', () => {
    if (searchLanguage === 'uz-en') {
        searchLanguage = 'en-uz';
        voiceLanguage = 'en-US';
        document.getElementById('language-display').textContent = 'EN-UZ';
    } else {
        searchLanguage = 'uz-en';
        voiceLanguage = 'uz-UZ';
        document.getElementById('language-display').textContent = 'UZ-EN';
    }
    
    // Recognition tilini o'zgartirilish
    if (recognition) {
        recognition.lang = voiceLanguage;
    }
});

// Ovoz qidirish tugmasi
document.getElementById('voice-search-btn').addEventListener('click', () => {
    if (!SpeechRecognition) {
        showNotification('Bu brauzer ovoz tanishmasni qo\'llamaymapti', 'error');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        // Qidiruv inputini bo'sh qiling
        document.getElementById('global-search-input').value = '';
        recognition.start();
    }
});

// ============== TEXT-TO-SPEECH FUNCTIONALITY ==============
function speakWord(word, language = 'en') {
    // Eski so'zni tozalash
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(word);
    
    // Til bo'yicha tilni o'rnatish
    if (language === 'uz') {
        utterance.lang = 'uz-UZ';
    } else {
        utterance.lang = 'en-US';
    }
    
    utterance.rate = 0.9; // Tez emas, diqqat bilan
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // O'g'il bola ovozini tanlash
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(voice => voice.name.includes('Male') || voice.name.includes('male'));
    if (maleVoice) {
        utterance.voice = maleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

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
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px 0; font-size: 0.9em;">Topilmadi</p>';
        return;
    }
    
    container.innerHTML = results.map(word => `
        <div style="
            padding: 8px 10px;
            margin-bottom: 6px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            transition: all 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        " onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='#f8f9fa'">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #667eea; margin-bottom: 3px; font-size: 0.85em;">
                    ${word.english}
                </div>
                <div style="color: #666; font-size: 0.8em;">
                    ${word.uzbek}
                </div>
                <div style="color: #999; font-size: 0.7em; margin-top: 3px;">
                    Unit ${word.unit}
                </div>
            </div>
            <button 
                onclick="speakWord('${word.english}', 'en'); speakWord('${word.uzbek}', 'uz');"
                style="
                    padding: 6px 8px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 10px;
                    white-space: nowrap;
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='#764ba2'; this.style.transform='scale(1.05)'"
                onmouseout="this.style.background='#667eea'; this.style.transform='scale(1)'"
                title="Ovozda o'qish"
            >
                🔊
            </button>
        </div>
    `).join('');
    
    // Birinchi natijaning ovozida o'qib berish
    if (results.length > 0) {
        setTimeout(() => {
            // Qidiruv tiliga qarab aytish
            if (searchLanguage === 'en-uz') {
                // EN-UZ: inglizcha qidiruv, o'zbek natija -> o'zbek aytish
                speakWord(results[0].uzbek, 'uz');
            } else {
                // UZ-EN: o'zbek qidiruv, inglizcha natija -> inglizcha aytish
                speakWord(results[0].english, 'en');
            }
        }, 300);
    }
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
    newRow.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 15px;
        padding: 10px;
        background: #f9f9f9;
        border-radius: 6px;
        border-left: 3px solid #667eea;
    `;
    newRow.innerHTML = `
        <div style="display: flex; gap: 10px;">
            <input type="text" class="english-input" placeholder="Inglizcha" style="flex: 1;">
            <input type="text" class="uzbek-input" placeholder="O'zbekcha" style="flex: 1;">
        </div>
        <input type="text" class="word-description-input" placeholder="Tavsif (ixtiyoriy)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    `;
    container.appendChild(newRow);
});

// Saqlash tugmasi
document.getElementById('save-words').addEventListener('click', async function() {
    const unitNumber = document.getElementById('unit-number').value;
    const unitName = document.getElementById('unit-name-input').value.trim();
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
        // Har bir so'zning o'zining description'i
        const description = row.querySelector('.word-description-input').value.trim();

        if (english && uzbek) {
            try {
                console.log('📤 So\'z yuborilmoqda:', { english, uzbek, unit: unitNumber, unitName, description });
                const response = await fetch(`${window.API_BASE_URL}/words`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        english, 
                        uzbek, 
                        unit: parseFloat(unitNumber),
                        unitName: unitName || '',
                        description: description || null // Har bir so'zning description'i
                    })
                });

                console.log('Response status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ So\'z saqlandi:', result);
                    savedCount++;
                    row.querySelector('.english-input').value = '';
                    row.querySelector('.uzbek-input').value = '';
                    row.querySelector('.word-description-input').value = '';
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
        
        // Unit raqami va nomini tozalash
        document.getElementById('unit-number').value = '';
        document.getElementById('unit-name-input').value = '';
        
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
        const [wordsRes, statsRes, unitsRes] = await Promise.all([
            fetch(`${window.API_BASE_URL}/all-words`),
            fetch(`${window.API_BASE_URL}/unit-stats`),
            fetch(`${window.API_BASE_URL}/units`)
        ]);
        
        if (!wordsRes.ok || !statsRes.ok || !unitsRes.ok) {
            throw new Error(`API Error`);
        }
        
        const allWords = await wordsRes.json();
        const allStats = await statsRes.json();
        const allUnits = await unitsRes.json();
        
        // Search uchun barcha so'zlarni saqlab qo'yish
        allWordsForSearch = allWords;
        allUnitsData = allUnits; // Global saqlash
        
        console.log('✅ So\'zlar yuklandi:', allWords);
        console.log('📊 Unit stats yuklandi:', allStats);
        console.log('📚 Units yuklandi:', allUnits);

        const unitSet = new Set(allWords.map(w => w.unit));
        const unitsList = document.getElementById('units-list');
        unitsList.innerHTML = '';
        
        // Vertikal layout
        unitsList.style.display = 'flex';
        unitsList.style.flexDirection = 'column';
        unitsList.style.gap = '10px';
        unitsList.style.width = '100%';

        if (unitSet.size === 0) {
            unitsList.innerHTML = '<p>Hali hech qanday unit yo\'q</p>';
            return;
        }

        // Unitlarni sort qilish
        const sortedUnits = Array.from(unitSet).sort((a, b) => a - b);

        sortedUnits.forEach(unit => {
            // Unit ma'lumotlarini olish
            const unitData = allUnits.find(u => u.unit === unit);
            const unitName = unitData?.unitName || '';
            
            // Unit stats'dan foydalanish (yangi unit uchun default 0)
            const unitStat = allStats.find(s => s.unit === unit);
            const mode1Percentage = unitStat?.gameMode1Avg || 0;
            const mode2Percentage = unitStat?.gameMode2Avg || 0;
            const mode3Percentage = unitStat?.gameMode3Avg || 0;
            
            const hasStats = unitStat && (mode1Percentage > 0 || mode2Percentage > 0 || mode3Percentage > 0);
            const overallPercentage = hasStats ? Math.max(mode1Percentage, mode2Percentage, mode3Percentage) : 0;
            
            // Accordion container
            const accordion = document.createElement('div');
            accordion.className = 'unit-accordion';
            accordion.style.cssText = `
                width: 100%;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            `;
            
            // Unit header (button) - har doim oq fonda qora yozuv, pastda progress liniya
            const header = document.createElement('button');
            header.style.cssText = `
                width: 100%;
                padding: 15px 20px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                border: none;
                background: white;
                color: #333;
                transition: all 0.3s;
                text-align: left;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                overflow: visible;
                border: 1px solid #e0e0e0;
                border-bottom: none;
            `;
            
            // Progress bar container - tugma pastida
            const progressBarContainer = document.createElement('div');
            progressBarContainer.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: #f0f0f0;
                border-radius: 0;
            `;
            
            // Har bir so'zning 3 ta game mode - har biri 33.3%
            let unitProgress = 0;
            if (allWords && allWords.length > 0) {
                const unitWords = allWords.filter(w => w.unit === unit);
                if (unitWords.length > 0) {
                    let totalProgress = 0;
                    unitWords.forEach(word => {
                        let wordProgress = 0;
                        // Har game mode 100% bo'lsa 33.3% qo'shiladi
                        if ((word.gameMode1 || 0) >= 100) wordProgress += 33.33;
                        if ((word.gameMode2 || 0) >= 100) wordProgress += 33.33;
                        if ((word.gameMode3 || 0) >= 100) wordProgress += 33.34;
                        totalProgress += wordProgress;
                    });
                    unitProgress = Math.round(totalProgress / unitWords.length);
                }
            }
            
            // Progress fill bar - rangi foyizga qarab o'zgaradi
            let progressColor = '#f44336'; // Qizil (0-30%)
            if (unitProgress > 30 && unitProgress <= 70) {
                progressColor = '#ffc107'; // Sariq (30-70%)
            } else if (unitProgress > 70 && unitProgress < 90) {
                progressColor = '#667eea'; // Ko'k (70-90%)
            } else if (unitProgress >= 90) {
                progressColor = '#4caf50'; // Yashil (90-100%)
            }
            
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                height: 100%;
                background: ${progressColor};
                width: ${unitProgress}%;
                transition: width 0.3s ease, background 0.3s ease;
                border-radius: 0;
            `;
            progressBarContainer.appendChild(progressFill);
            header.appendChild(progressBarContainer);
            
            // Content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.style.cssText = `
                position: relative;
                z-index: 1;
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const textContent = document.createElement('div');
            textContent.innerHTML = `
                <div style="font-size: 18px;">
                    Unit ${unit} - ${unitName || '📚 Mavzu kiritilmagan'}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 3px;">
                    ${unitProgress > 0 ? unitProgress + '% Yodlandi' : '0% Boshlang\'ich'}
                </div>
            `;
            contentWrapper.appendChild(textContent);
            
            const arrow = document.createElement('span');
            arrow.className = 'accordion-arrow';
            arrow.style.cssText = 'font-size: 20px; transition: transform 0.3s;';
            arrow.textContent = '▼';
            contentWrapper.appendChild(arrow);
            
            header.appendChild(contentWrapper);
            
            // Store update function
            header._updateProgressBar = function(newProgress) {
                unitProgress = newProgress;
                progressFill.style.width = newProgress + '%';
                progressFill.style.background = newProgress === 100 ? '#4caf50' : '#667eea';
                textContent.innerHTML = `
                    <div style="font-size: 18px;">
                        Unit ${unit} - ${unitName || '📚 Mavzu kiritilmagan'}
                    </div>
                    <div style="font-size: 12px; color: #999; margin-top: 3px;">
                        ${newProgress > 0 ? newProgress + '% Yodlandi' : '0% Boshlang\'ich'}
                    </div>
                `;
            };
            
            // Content container
            const content = document.createElement('div');
            content.className = 'unit-content';
            content.style.cssText = `
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: white;
            `;
            
            // Toggle accordion
            let isOpen = false;
            header.onclick = async () => {
                if (isOpen) {
                    // Yopish
                    content.style.maxHeight = '0';
                    header.querySelector('.accordion-arrow').style.transform = 'rotate(0deg)';
                    isOpen = false;
                } else {
                    // Ochish
                    if (!content.hasChildNodes()) {
                        content.innerHTML = '<div style="padding: 20px; text-align: center;">⏳ Yuklanmoqda...</div>';
                        await loadUnitContent(unit, content);
                    }
                    content.style.maxHeight = content.scrollHeight + 'px';
                    header.querySelector('.accordion-arrow').style.transform = 'rotate(180deg)';
                    isOpen = true;
                    
                    // Scroll to header
                    setTimeout(() => {
                        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            };
            
            header.onmouseover = () => {
                header.style.opacity = '0.9';
            };
            header.onmouseout = () => {
                header.style.opacity = '1';
            };
            
            accordion.appendChild(header);
            accordion.appendChild(content);
            unitsList.appendChild(accordion);
        });
        
        // Scroll to units section
        setTimeout(() => {
            const unitsSection = document.getElementById('units-section');
            if (unitsSection) {
                unitsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
        
    } catch (err) {
        console.error('❌ Unitlarni yuklashda xato:', err);
        document.getElementById('units-list').innerHTML = `<p style="color:red;">Xato: ${err.message}</p>`;
    }
}

// Unit content'ni yuklash (so'zlar va game mode'lar)
async function loadUnitContent(unit, container) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/words/${unit}`);
        const words = await response.json();
        
        container.innerHTML = '';
        
        // Progress section - foiz ko'rsatgichi
        const progressSection = document.createElement('div');
        progressSection.style.cssText = `
            padding: 15px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            margin-bottom: 15px;
            color: white;
        `;
        
        // Har bir game mode uchun foiz hisoblash
        let mode1Total = 0, mode2Total = 0, mode3Total = 0;
        words.forEach(word => {
            mode1Total += (word.gameMode1 || 0);
            mode2Total += (word.gameMode2 || 0);
            mode3Total += (word.gameMode3 || 0);
        });
        
        const mode1Percent = words.length > 0 ? Math.round((mode1Total / words.length) / 100 * 100) : 0;
        const mode2Percent = words.length > 0 ? Math.round((mode2Total / words.length) / 100 * 100) : 0;
        const mode3Percent = words.length > 0 ? Math.round((mode3Total / words.length) / 100 * 100) : 0;
        
        progressSection.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold;">${mode1Percent}%</div>
                    <div style="font-size: 12px; opacity: 0.9;">📋 Game 1</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold;">${mode2Percent}%</div>
                    <div style="font-size: 12px; opacity: 0.9;">✏️ Game 2</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold;">${mode3Percent}%</div>
                    <div style="font-size: 12px; opacity: 0.9;">⚡ Game 3</div>
                </div>
            </div>
        `;
        
        container.appendChild(progressSection);
        
        // Verification section
        const verificationSection = document.createElement('div');
        verificationSection.style.cssText = `
            padding: 20px;
            border-bottom: 2px solid #f0f0f0;
        `;
        
        verificationSection.innerHTML = `<h3 style="margin: 0 0 15px 0; color: #667eea;">📚 So'zlar ro'yxati</h3>`;
        
        if (words.length === 0) {
            verificationSection.innerHTML += '<p style="color: #999;">Bu unitda hali so\'z yo\'q</p>';
        } else {
            const wordsTable = document.createElement('div');
            wordsTable.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 8px;
            `;
            
            words.forEach(word => {
                const wordRow = document.createElement('div');
                wordRow.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    transition: all 0.2s;
                `;
                
                // Data attributes qo'shish
                wordRow.setAttribute('data-word-english', word.english);
                wordRow.setAttribute('data-mode1', word.gameMode1 || 0);
                wordRow.setAttribute('data-mode2', word.gameMode2 || 0);
                wordRow.setAttribute('data-mode3', word.gameMode3 || 0);
                
                wordRow.onmouseover = () => wordRow.style.background = '#e9ecef';
                wordRow.onmouseout = () => wordRow.style.background = '#f8f9fa';
                
                const wordContent = document.createElement('div');
                wordContent.style.cssText = `
                    flex: 1;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                `;
                
                const englishDiv = document.createElement('div');
                englishDiv.style.cssText = 'flex: 1; font-weight: bold; color: #333;';
                englishDiv.textContent = word.english;
                
                if (word.description) {
                    englishDiv.style.cursor = 'help';
                    englishDiv.onmouseenter = (e) => showDescriptionTooltip(e, word.description);
                    englishDiv.onmouseleave = hideDescriptionTooltip;
                    englishDiv.onmousemove = moveDescriptionTooltip;
                }
                
                const uzbekDiv = document.createElement('div');
                uzbekDiv.style.cssText = 'flex: 1; color: #666;';
                uzbekDiv.textContent = word.uzbek;
                
                wordContent.appendChild(englishDiv);
                wordContent.appendChild(uzbekDiv);
                
                // Action buttons
                const actionsDiv = document.createElement('div');
                actionsDiv.style.cssText = 'display: flex; gap: 5px;';
                
                const editBtn = document.createElement('button');
                editBtn.innerHTML = '✏️';
                editBtn.style.cssText = `
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 5px;
                    opacity: 0.6;
                    transition: all 0.2s;
                `;
                editBtn.onmouseover = () => editBtn.style.opacity = '1';
                editBtn.onmouseout = () => editBtn.style.opacity = '0.6';
                editBtn.onclick = () => editWord(unit, word);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = `
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 5px;
                    opacity: 0.6;
                    transition: all 0.2s;
                `;
                deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
                deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.6';
                deleteBtn.onclick = () => deleteWord(unit, word._id);
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                
                wordRow.appendChild(wordContent);
                wordRow.appendChild(actionsDiv);
                wordsTable.appendChild(wordRow);
            });
            
            verificationSection.appendChild(wordsTable);
        }
        
        container.appendChild(verificationSection);
        
        // Game modes section
        const gamesSection = document.createElement('div');
        gamesSection.style.cssText = `
            padding: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        `;
        
        // Game mode 1 button
        const mode1Btn = document.createElement('button');
        mode1Btn.innerHTML = '📋 Game Mode 1';
        mode1Btn.style.cssText = `
            flex: 1; 
            min-width: 150px; 
            padding: 15px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s;
        `;
        mode1Btn.onclick = () => startGameMode1(unit, words, container);
        
        // Game mode 2 button
        const mode2Btn = document.createElement('button');
        mode2Btn.innerHTML = '✏️ Game Mode 2';
        mode2Btn.style.cssText = `
            flex: 1; 
            min-width: 150px; 
            padding: 15px; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s;
        `;
        mode2Btn.onclick = () => startGameMode2(unit, words, container);
        
        // Game mode 3 button
        const mode3Btn = document.createElement('button');
        mode3Btn.innerHTML = '⚡ Game Mode 3';
        mode3Btn.style.cssText = `
            flex: 1; 
            min-width: 150px; 
            padding: 15px; 
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s;
        `;
        mode3Btn.onclick = () => startGameMode3(unit, words, container);
        
        gamesSection.appendChild(mode1Btn);
        gamesSection.appendChild(mode2Btn);
        gamesSection.appendChild(mode3Btn);
        
        container.appendChild(gamesSection);
        
        // Max height'ni qayta hisoblash va progress bar'ni update qilish
        setTimeout(() => {
            container.style.maxHeight = container.scrollHeight + 'px';
            // Progress bar'ni update qilish
            updateProgressBar(container);
        }, 10);
        
    } catch (err) {
        container.innerHTML = `<p style="padding: 20px; color: red;">Xato: ${err.message}</p>`;
    }
}

// Progress bar'ni update qilish funksiyasi
function updateProgressBar(container) {
    // Ushbu container'ning unit raqamini topish
    try {
        // Container'ning parent (content) va grandparent (accordion)'ni topish
        let current = container;
        let accordion = null;
        
        while (current && !accordion) {
            const parent = current.parentElement;
            if (parent && parent.classList.contains('unit-accordion')) {
                accordion = parent;
                break;
            }
            current = parent;
        }
        
        if (accordion) {
            const header = accordion.querySelector('button');
            if (header && header._updateProgressBar) {
                // Words dan foiz hisobla
                const words = container.querySelectorAll('[data-word-english]');
                if (words.length > 0) {
                    let totalProgress = 0;
                    
                    words.forEach(word => {
                        let wordProgress = 0;
                        // Har game mode 100% bo'lsa 33.3% qo'shiladi
                        const mode1 = parseInt(word.getAttribute('data-mode1') || 0);
                        const mode2 = parseInt(word.getAttribute('data-mode2') || 0);
                        const mode3 = parseInt(word.getAttribute('data-mode3') || 0);
                        
                        if (mode1 >= 100) wordProgress += 33.33;
                        if (mode2 >= 100) wordProgress += 33.33;
                        if (mode3 >= 100) wordProgress += 33.34;
                        
                        totalProgress += wordProgress;
                    });
                    
                    const unitProgress = Math.round(totalProgress / words.length);
                    
                    // Header'dagi update funksiyasini chaqirish
                    header._updateProgressBar(unitProgress);
                }
            }
        }
    } catch (err) {
        console.error('Progress bar update xatosi:', err);
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
        verificationDiv.style.cssText = 'display: flex; gap: 8px; margin: 10px 0; overflow-x: auto; min-height: 200px;';

        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = 'flex: 1; min-width: 0; padding: 0;';
        leftDiv.innerHTML = '<h3 style="margin: 0 0 8px 0; font-size: 0.9em; text-align: center;">📖 Inglizcha</h3>';

        const rightDiv = document.createElement('div');
        rightDiv.style.cssText = 'flex: 1; min-width: 0; padding: 0;';
        rightDiv.innerHTML = '<h3 style="margin: 0 0 8px 0; font-size: 0.9em; text-align: center;">Uz</h3>';

        // To'g'ri tartibda ko'rsatish (shuffle yo'q)
        words.forEach(word => {
            // Har bir so'z uchun container yaratish (so'z + tugmalar)
            const wordContainer = document.createElement('div');
            wordContainer.style.cssText = 'position: relative; margin: 3px 0;';
            
            const englishEl = document.createElement('div');
            englishEl.style.cssText = `
                padding: 6px 4px;
                background: #e3f2fd;
                border-radius: 4px;
                border: none;
                font-weight: 500;
                font-size: 0.85em;
                word-break: break-word;
                overflow-wrap: break-word;
                cursor: ${word.description ? 'help' : 'default'};
                position: relative;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            
            const englishText = document.createElement('span');
            englishText.textContent = word.english;
            englishEl.appendChild(englishText);
            
            // Edit va Delete tugmalar
            const actionButtons = document.createElement('div');
            actionButtons.style.cssText = 'display: flex; gap: 4px;';
            
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.style.cssText = 'background: transparent; border: none; cursor: pointer; font-size: 0.9em; padding: 2px 4px;';
            editBtn.title = 'Tahrirlash';
            editBtn.onclick = () => editWord(unit, word);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.style.cssText = 'background: transparent; border: none; cursor: pointer; font-size: 0.9em; padding: 2px 4px;';
            deleteBtn.title = 'O\'chirish';
            deleteBtn.onclick = () => deleteWord(unit, word._id);
            
            actionButtons.appendChild(editBtn);
            actionButtons.appendChild(deleteBtn);
            englishEl.appendChild(actionButtons);
            
            // Agar description bo'lsa, hover event qo'shish
            if (word.description) {
                englishText.addEventListener('mouseenter', (e) => showDescriptionTooltip(e, word.description));
                englishText.addEventListener('mouseleave', hideDescriptionTooltip);
                englishText.addEventListener('mousemove', moveDescriptionTooltip);
            }
            
            wordContainer.appendChild(englishEl);
            leftDiv.appendChild(wordContainer);

            const uzbekEl = document.createElement('div');
            uzbekEl.style.cssText = `
                padding: 6px 4px;
                background: #fff3e0;
                border-radius: 4px;
                margin: 3px 0;
                border: none;
                font-weight: 500;
                font-size: 0.85em;
                word-break: break-word;
                overflow-wrap: break-word;
                cursor: ${word.description ? 'help' : 'default'};
            `;
            uzbekEl.textContent = word.uzbek;
            
            // Agar description bo'lsa, hover event qo'shish
            if (word.description) {
                uzbekEl.addEventListener('mouseenter', (e) => showDescriptionTooltip(e, word.description));
                uzbekEl.addEventListener('mouseleave', hideDescriptionTooltip);
                uzbekEl.addEventListener('mousemove', moveDescriptionTooltip);
            }
            
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
function startGameMode1(unit, words, container) {
    console.log('🎮 Game Mode 1 (Click Matching) boshlandi - Unit:', unit);
    
    // Soʻzlar jadvalini yashirish
    const verificationSection = container.querySelector('[style*="border-bottom"]');
    if (verificationSection) {
        verificationSection.style.display = 'none';
    }
    
    // Game mode tugmalarini yashirish
    const gamesSection = container.querySelector('div[style*="display: flex"][style*="padding: 20px"]');
    if (gamesSection) {
        gamesSection.style.display = 'none';
    }
    
    // O'yin uchun container yaratish
    let gameContainer = container.querySelector('.game-mode-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.className = 'game-mode-container';
        gameContainer.style.cssText = `
            padding: 20px;
            border-top: 2px solid #f0f0f0;
        `;
        container.appendChild(gameContainer);
    }
    gameContainer.innerHTML = '';
    
    // Scroll to game container
    setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Back button yaratish
    const backBtn = document.createElement('button');
    backBtn.innerHTML = '← Orqaga';
    backBtn.style.cssText = `
        padding: 10px 20px;
        background: #999;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 15px;
        font-weight: bold;
    `;
    backBtn.onclick = () => {
        gameContainer.innerHTML = '';
        if (verificationSection) verificationSection.style.display = 'block';
        if (gamesSection) gamesSection.style.display = 'flex';
    };
    gameContainer.appendChild(backBtn);

    // answeredCorrectly Set-ni reset qilish
    answeredCorrectly = new Set();
    selectedGameMode = 1; // Game mode 1 ni set qilish

    // So'zlarni aralash tartibda
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const uzbekTranslations = [...words.map(w => w.uzbek)].sort(() => Math.random() - 0.5);

    let correctCount = 0;
    let answeredCount = 0; // Jami javob berilgan so'zlar
    let selectedEnglish = null; // Tanlangan inglizcha so'z
    let selectedEnglishId = null;
    const matchMap = new Map();
    const answeredWords = new Set(); // Javob berilgan so'zlarni kuzatish
    
    words.forEach(word => {
        matchMap.set(word.english, word.uzbek);
    });

    console.log('Match Map:', matchMap);

    // UI yaratish
    const gameDiv = document.createElement('div');
    gameDiv.style.cssText = 'display: flex; gap: 6px; margin: 10px 0; overflow-x: auto; min-height: 300px;';

    const leftDiv = document.createElement('div');
    leftDiv.style.cssText = 'flex: 1; min-width: 0;';
    leftDiv.innerHTML = '<h3 style="margin: 0 0 6px 0; font-size: 0.85em; text-align: center;">En</h3>';
    
    const rightDiv = document.createElement('div');
    rightDiv.style.cssText = 'flex: 1; min-width: 0;';
    rightDiv.innerHTML = '<h3 style="margin: 0 0 6px 0; font-size: 0.85em; text-align: center;">Uz</h3>';

    // Chap tomon - englizcha so'zlar (clickable)
    shuffledWords.forEach((word) => {
        const wordEl = document.createElement('div');
        wordEl.id = `word-${word._id}`;
        wordEl.style.cssText = `
            padding: 5px 3px;
            background: #e3f2fd;
            border-radius: 4px;
            margin: 2px 0;
            border: none;
            font-weight: 500;
            font-size: 0.75em;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            word-break: break-word;
            overflow-wrap: break-word;
        `;
        wordEl.textContent = word.english;
        wordEl.setAttribute('data-word-id', word._id);
        wordEl.setAttribute('data-english', word.english);
        
        // Description tooltip - agar description bo'lsa
        if (word.description) {
            wordEl.style.cursor = 'help';
            wordEl.addEventListener('mouseenter', (e) => showDescriptionTooltip(e, word.description));
            wordEl.addEventListener('mouseleave', hideDescriptionTooltip);
            wordEl.addEventListener('mousemove', moveDescriptionTooltip);
        }
        
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
                    prevElement.style.background = '#e3f2fd';
                    prevElement.style.boxShadow = 'none';
                }
            }

            // Yangi so'zni select qilish
            selectedEnglish = word.english;
            selectedEnglishId = word._id;
            wordEl.style.background = '#90caf9';
            wordEl.style.boxShadow = '0 0 8px rgba(25, 118, 210, 0.4)';
        });

        leftDiv.appendChild(wordEl);
    });

    // O'ng tomon - o'zbekcha tarjimalar (clickable)
    uzbekTranslations.forEach((translation) => {
        const translationEl = document.createElement('div');
        translationEl.style.cssText = `
            padding: 5px 3px;
            background: #fff3e0;
            border-radius: 4px;
            margin: 2px 0;
            border: none;
            font-weight: 500;
            font-size: 0.75em;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            word-break: break-word;
            overflow-wrap: break-word;
        `;
        translationEl.textContent = translation;
        translationEl.setAttribute('data-translation', translation);
        
        // Click handler - javobni tekshirish
        translationEl.addEventListener('click', (e) => {
            e.stopPropagation();

            // Agar bu tarjima allaqachon javob berilgan bo'lsa (to'g'ri yoki xato)
            if (translationEl.classList.contains('answered')) {
                return;
            }

            // Agar inglizcha so'z tanlangan bo'lsa
            if (selectedEnglish) {
                const correctTranslation = matchMap.get(selectedEnglish);

                if (translation === correctTranslation) {
                    // ✅ TO'G'RI JAVOB
                    translationEl.style.background = '#c8e6c9';
                    translationEl.style.color = 'green';
                    translationEl.style.fontWeight = 'bold';
                    translationEl.style.cursor = 'not-allowed';
                    translationEl.textContent = '✅ ' + translation;
                    translationEl.classList.add('answered');
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
                            wordElement.style.background = '#e0e0e0';
                            wordElement.style.boxShadow = 'none';
                        }
                    }
                    
                    correctCount++;
                    answeredWords.add(wordObj._id);
                    document.getElementById('correct-count').textContent = correctCount;

                    // Agar barcha so'zlarga javob berilgan bo'lsa, o'yinni tugatish
                    if (answeredWords.size === words.length) {
                        setTimeout(() => {
                            completeUnit(unit, words, container);
                        }, 500);
                    }

                    // Selection-ni tozalash
                    selectedEnglish = null;
                    selectedEnglishId = null;
                } else {
                    // ❌ XA'TO JAVOB - BIRJALANG QO'LIR
                    translationEl.style.background = '#ffcdd2';
                    translationEl.style.color = 'red';
                    translationEl.style.fontWeight = 'bold';
                    translationEl.style.cursor = 'not-allowed';
                    translationEl.textContent = '❌ ' + translation;
                    translationEl.classList.add('answered');
                    translationEl.style.pointerEvents = 'none';
                    
                    // Englizcha so'zni ham disable qilish (xato joylagani ham qolsin)
                    const wordObj = words.find(w => w.english === selectedEnglish);
                    if (wordObj) {
                        answeredWords.add(wordObj._id);
                        
                        const wordElement = document.getElementById(`word-${wordObj._id}`);
                        if (wordElement) {
                            wordElement.style.opacity = '0.5';
                            wordElement.style.cursor = 'not-allowed';
                            wordElement.classList.add('answered');
                            wordElement.style.pointerEvents = 'none';
                            wordElement.style.background = '#ffcdd2';
                            wordElement.style.boxShadow = 'none';
                            wordElement.textContent = wordObj.english + ' ❌';
                        }
                        
                        // Agar barcha so'zlarga javob berilgan bo'lsa, o'yinni tugatish
                        if (answeredWords.size === words.length) {
                            setTimeout(() => {
                                completeUnit(unit, words, container);
                            }, 500);
                        }
                    }
                    
                    // Selection-ni tozalash
                    selectedEnglish = null;
                    selectedEnglishId = null;
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
    gameContainer.appendChild(gameDiv);

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
    gameContainer.appendChild(statusDiv);
    
    // Max height'ni qayta hisoblash
    setTimeout(() => {
        container.style.maxHeight = container.scrollHeight + 'px';
    }, 10);
}

// ============================================================
// GAME MODE 2 - O'ZBEKCHA YOZISH (Text Input)
// ============================================================
function startGameMode2(unit, words, container) {
    console.log('🎮 Game Mode 2 (O\'zbekcha Yozish) boshlandi - Unit:', unit);
    
    // Soʻzlar jadvalini yashirish
    const verificationSection = container.querySelector('[style*="border-bottom"]');
    if (verificationSection) {
        verificationSection.style.display = 'none';
    }
    
    // Game mode tugmalarini yashirish
    const gamesSection = container.querySelector('div[style*="display: flex"][style*="padding: 20px"]');
    if (gamesSection) {
        gamesSection.style.display = 'none';
    }
    
    // O'yin uchun container yaratish
    let gameContainer = container.querySelector('.game-mode-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.className = 'game-mode-container';
        gameContainer.style.cssText = `
            padding: 20px;
            border-top: 2px solid #f0f0f0;
        `;
        container.appendChild(gameContainer);
    }
    gameContainer.innerHTML = '';
    
    // Scroll to game container
    setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Back button yaratish
    const backBtn = document.createElement('button');
    backBtn.innerHTML = '← Orqaga';
    backBtn.style.cssText = `
        padding: 10px 20px;
        background: #999;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 15px;
        font-weight: bold;
    `;
    backBtn.onclick = () => {
        gameContainer.innerHTML = '';
        if (verificationSection) verificationSection.style.display = 'block';
        if (gamesSection) gamesSection.style.display = 'flex';
    };
    gameContainer.appendChild(backBtn);

    let currentIndex = 0;
    let correctCount = 0;
    answeredCorrectly = new Set(); // Reset
    selectedGameMode = 2; // Game mode 2 ni set qilish

    const matchMap = new Map();
    words.forEach(word => {
        matchMap.set(word.english, word.uzbek);
    });

    function showCurrentWord() {
        const contentDiv = gameContainer.querySelector('.game-content');
        if (contentDiv) {
            contentDiv.innerHTML = '';
        }

        if (currentIndex >= words.length) {
            completeUnit(unit, words, container);
            return;
        }

        const word = words[currentIndex];

        const containerDiv = document.createElement('div');
        containerDiv.className = 'game-mode-2-container game-content';

        const wordDiv = document.createElement('div');
        wordDiv.className = 'game-mode-2-word';
        wordDiv.textContent = word.uzbek;
        
        // Description tooltip - agar description bo'lsa
        if (word.description) {
            wordDiv.style.cursor = 'help';
            wordDiv.addEventListener('mouseenter', (e) => showDescriptionTooltip(e, word.description));
            wordDiv.addEventListener('mouseleave', hideDescriptionTooltip);
            wordDiv.addEventListener('mousemove', moveDescriptionTooltip);
        }
        
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
        inputEl.autocomplete = 'off';
        inputDiv.appendChild(inputEl);
        containerDiv.appendChild(inputDiv);
        
        // Mobil klaviatura focus vaqtida scroll qilish
        inputEl.addEventListener('focus', () => {
            // Container scroll qilish
            setTimeout(() => {
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Parent container scroll
                gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        });
        
        // Prevent keyboard from zooming
        inputEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            inputEl.focus();
        });

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

        gameContainer.appendChild(containerDiv);

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
        gameContainer.appendChild(progressDiv);

        // Max height'ni qayta hisoblash
        setTimeout(() => {
            container.style.maxHeight = container.scrollHeight + 'px';
            // Input focus qilish (mobil klaviatura ochiladi)
            inputEl.focus();
        }, 100);
    }

    showCurrentWord();
}

// ============================================================
// GAME MODE 3 - TEZKOR TANLOV (Multiple Choice, 5-sec Timer)
// ============================================================
function startGameMode3(unit, words, container) {
    console.log('🎮 Game Mode 3 (Tezkor Tanlov) boshlandi - Unit:', unit);
    
    // Soʻzlar jadvalini yashirish
    const verificationSection = container.querySelector('[style*="border-bottom"]');
    if (verificationSection) {
        verificationSection.style.display = 'none';
    }
    
    // Game mode tugmalarini yashirish
    const gamesSection = container.querySelector('div[style*="display: flex"][style*="padding: 20px"]');
    if (gamesSection) {
        gamesSection.style.display = 'none';
    }
    
    // O'yin uchun container yaratish
    let gameContainer = container.querySelector('.game-mode-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.className = 'game-mode-container';
        gameContainer.style.cssText = `
            padding: 20px;
            border-top: 2px solid #f0f0f0;
        `;
        container.appendChild(gameContainer);
    }
    gameContainer.innerHTML = '';
    
    // Scroll to game container
    setTimeout(() => {
        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Back button yaratish
    const backBtn = document.createElement('button');
    backBtn.innerHTML = '← Orqaga';
    backBtn.style.cssText = `
        padding: 10px 20px;
        background: #999;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 15px;
        font-weight: bold;
    `;
    backBtn.onclick = () => {
        gameContainer.innerHTML = '';
        if (verificationSection) verificationSection.style.display = 'block';
        if (gamesSection) gamesSection.style.display = 'flex';
    };
    gameContainer.appendChild(backBtn);

    let currentIndex = 0;
    let correctCount = 0;
    answeredCorrectly = new Set();
    selectedGameMode = 3; // Game mode 3 ni set qilish
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
        const contentDiv = gameContainer.querySelector('.game-content');
        if (contentDiv) {
            contentDiv.remove();
        }
        canAnswer = true;

        if (currentIndex >= shuffledWords.length) {
            completeUnit(unit, words, container);
            return;
        }

        const word = shuffledWords[currentIndex];
        const options = getRandomAnswerOptions(word);

        const containerDiv = document.createElement('div');
        containerDiv.className = 'game-mode-3-container game-content';

        // So'z ko'rsatish
        const wordDiv = document.createElement('div');
        wordDiv.className = 'game-mode-3-word';
        wordDiv.textContent = word.uzbek;
        
        // Description tooltip - agar description bo'lsa
        if (word.description) {
            wordDiv.style.cursor = 'help';
            wordDiv.addEventListener('mouseenter', (e) => showDescriptionTooltip(e, word.description));
            wordDiv.addEventListener('mouseleave', hideDescriptionTooltip);
            wordDiv.addEventListener('mousemove', moveDescriptionTooltip);
        }
        
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
        gameContainer.appendChild(containerDiv);

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
        gameContainer.appendChild(progressDiv);

        // To'g'ri javoblar sonini ko'rsatish
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-display';
        scoreDiv.innerHTML = `<span>To'g'ri javoblar:</span> <span class="score-number">${correctCount}</span>/<span>${shuffledWords.length}</span>`;
        gameContainer.appendChild(scoreDiv);
        
        // Max height'ni qayta hisoblash
        setTimeout(() => {
            container.style.maxHeight = container.scrollHeight + 'px';
        }, 10);
    }

    showCurrentWord();
}

// Global o'zgaruvchilar - to'g'ri javoblar berilgan so'zlarni track qilish
let answeredCorrectly = new Set(); // To'g'ri javob berilgan so'zlarning ID lari

// Unit tugallanganda - statusni update qilish (har bir game mode uchun foyiz saqlaymuz)
async function completeUnit(unit, words, container) {
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
                
                // Container bo'lsa, o'yin natijasini ko'rsatish
                if (container) {
                    const gameContainer = container.querySelector('.game-mode-container');
                    if (gameContainer) {
                        gameContainer.innerHTML = `
                            <div style="padding: 20px; text-align: center; background: #f0f0f0; border-radius: 8px;">
                                <h2 style="color: #667eea; margin: 20px 0;">🎉 O'yin Tugallandi!</h2>
                                <div style="font-size: 24px; color: #4caf50; margin: 20px 0; font-weight: bold;">
                                    ${correctPercentage}% To'g'ri
                                </div>
                                <div style="font-size: 16px; color: #666; margin-bottom: 20px;">
                                    ${answeredCorrectly.size}/${words.length} so'z to'g'ri javob berildi
                                </div>
                                <button onclick="location.reload()" style="padding: 15px 30px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">
                                    ✓ Davom Etish
                                </button>
                            </div>
                        `;
                        
                        // Scroll to results
                        setTimeout(() => {
                            gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            // Max height'ni qayta hisoblash
                            container.style.maxHeight = container.scrollHeight + 'px';
                        }, 100);
                    }
                } else {
                    // Eski usuli - practice section bo'lsa
                    document.getElementById('practice-section').style.display = 'none';
                    answeredCorrectly = new Set(); // Reset qilish
                    loadUnits();
                }
            } else {
                console.error(`❌ Batch update failed:`, result.status);
            }
        } catch (err) {
            console.error('Batch update xatosi:', err);
        }

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
      const registration = await navigator.serviceWorker.register('./sw.js');
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

// ========== DESCRIPTION TOOLTIP FUNCTIONS ==========
function showDescriptionTooltip(event, description) {
  const tooltip = document.getElementById('description-tooltip');
  const tooltipText = document.getElementById('tooltip-description');
  
  tooltipText.textContent = description;
  tooltip.style.display = 'block';
  
  // Tooltip pozitsiyasini o'rnatish
  const x = event.clientX + 15;
  const y = event.clientY + 15;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideDescriptionTooltip() {
  const tooltip = document.getElementById('description-tooltip');
  tooltip.style.display = 'none';
}

function moveDescriptionTooltip(event) {
  const tooltip = document.getElementById('description-tooltip');
  if (tooltip.style.display === 'block') {
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }
}

// ========== MODAL YARATISH ==========
function showModal(message, type = 'confirm') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s;
        `;
        
        const box = document.createElement('div');
        box.style.cssText = `
            background: white;
            padding: 25px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideIn 0.3s;
        `;
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        messageText.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #333;
            line-height: 1.5;
        `;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        if (type === 'confirm') {
            const noBtn = document.createElement('button');
            noBtn.textContent = "Yo'q";
            noBtn.style.cssText = `
                padding: 10px 25px;
                background: #ccc;
                color: #333;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s;
            `;
            noBtn.onmouseover = () => noBtn.style.background = '#bbb';
            noBtn.onmouseout = () => noBtn.style.background = '#ccc';
            noBtn.onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
            
            const yesBtn = document.createElement('button');
            yesBtn.textContent = 'Xa';
            yesBtn.style.cssText = `
                padding: 10px 25px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s;
            `;
            yesBtn.onmouseover = () => yesBtn.style.background = '#5568d3';
            yesBtn.onmouseout = () => yesBtn.style.background = '#667eea';
            yesBtn.onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
            
            buttonContainer.appendChild(noBtn);
            buttonContainer.appendChild(yesBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.style.cssText = `
                padding: 10px 30px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s;
            `;
            okBtn.onmouseover = () => okBtn.style.background = '#5568d3';
            okBtn.onmouseout = () => okBtn.style.background = '#667eea';
            okBtn.onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
            
            buttonContainer.appendChild(okBtn);
        }
        
        box.appendChild(messageText);
        box.appendChild(buttonContainer);
        modal.appendChild(box);
        document.body.appendChild(modal);
    });
}

// ========== UNIT VA SO'Z O'CHIRISH / TAHRIRLASH ==========
async function deleteWord(unit, wordId) {
    const confirmed = await showModal("Bu so'zni o'chirmoqchimisiz?", 'confirm');
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/word-action?unit=${unit}&wordId=${wordId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('So\'zni o\'chirishda xatolik');
        }
        
        await showModal("So'z muvaffaqiyatli o'chirildi!", 'alert');
        
        // Accordion content'ni qayta yuklash
        const accordions = document.querySelectorAll('.unit-accordion');
        accordions.forEach(acc => {
            const header = acc.querySelector('button');
            if (header.textContent.includes(`Unit ${unit}`)) {
                const content = acc.querySelector('.unit-content');
                loadUnitContent(unit, content);
            }
        });
    } catch (error) {
        console.error('❌ Delete word error:', error);
        await showModal('Xatolik yuz berdi!', 'alert');
    }
}

async function editWord(unit, word) {
    // Unit ma'lumotlarini olish
    const unitData = allUnitsData.find(u => u.unit === unit);
    const currentUnitName = unitData?.unitName || '';
    
    // Modal yaratish
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    const form = document.createElement('div');
    form.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
    `;
    
    form.innerHTML = `
        <h3 style="margin: 0 0 15px 0;">So'zni tahrirlash</h3>
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Unit raqami:</label>
        <input type="number" step="0.1" id="edit-unit" value="${unit}" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;">
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Unit nomi (Mavzu):</label>
        <input type="text" id="edit-unit-name" value="${currentUnitName}" placeholder="Masalan: Mevalar" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;">
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">English:</label>
        <input type="text" id="edit-english" value="${word.english}" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;">
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">O'zbekcha:</label>
        <input type="text" id="edit-uzbek" value="${word.uzbek}" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px;">
        
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
        <textarea id="edit-description" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; min-height: 60px;">${word.description || ''}</textarea>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancel-edit" style="padding: 8px 15px; background: #ccc; border: none; border-radius: 5px; cursor: pointer;">Bekor qilish</button>
            <button id="save-edit" style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Saqlash</button>
        </div>
    `;
    
    modal.appendChild(form);
    document.body.appendChild(modal);
    
    // Bekor qilish
    document.getElementById('cancel-edit').onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Saqlash
    document.getElementById('save-edit').onclick = async () => {
        const newUnit = parseFloat(document.getElementById('edit-unit').value);
        const unitName = document.getElementById('edit-unit-name').value.trim();
        const english = document.getElementById('edit-english').value.trim();
        const uzbek = document.getElementById('edit-uzbek').value.trim();
        const description = document.getElementById('edit-description').value.trim();
        
        console.log('📝 Edit qilinmoqda:', { 
            oldUnit: unit, 
            newUnit, 
            unitName, 
            english, 
            uzbek, 
            description,
            wordId: word._id 
        });
        
        if (!english || !uzbek || isNaN(newUnit)) {
            await showModal('English, O\'zbekcha va Unit raqami majburiy!', 'alert');
            return;
        }
        
        try {
            const apiUrl = `${window.API_BASE_URL}/word-action?oldUnit=${unit}&wordId=${word._id}`;
            const requestBody = { english, uzbek, description, newUnit, unitName };
            
            console.log('🌐 API URL:', apiUrl);
            console.log('📦 Request body:', requestBody);
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Server xatosi:', errorData);
                throw new Error('So\'zni yangilashda xatolik');
            }
            
            const result = await response.json();
            console.log('✅ Server javobi:', result);
            
            document.body.removeChild(modal);
            await showModal('So\'z muvaffaqiyatli yangilandi!', 'alert');
            
            // Har doim loadUnits() chaqirish (unit nomi o'zgarganda ham yangilanadi)
            loadUnits();
        } catch (error) {
            console.error('❌ Edit word error:', error);
            await showModal('Xatolik yuz berdi!', 'alert');
        }
    };
}

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


window.addEventListener('offline', () => {
  console.log('📴 Offline');
  showNotification('📴 Internet uzildi - Offline mode', 'info');
});

