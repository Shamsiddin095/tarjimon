// Present Continuous sentence analysis (UZ -> EN)
(function () {
    function translateSentenceAndDisplay(sentence, context = {}) {
        const {
            allWordsForSearch = window.allWordsForSearch || [],
            searchLanguage = window.searchLanguage || 'uz-en',
            displaySentenceInSearchModal = window.displaySentenceInSearchModal,
            speakWord = window.speakWord
        } = context;

        const normalizeLookup = (str) => {
            if (!str) return '';
            return str
                .toLowerCase()
                .replace(/\s*\(.*?\)\s*/g, '')
                .replace(/[^\p{L}\p{M}'’ʼ-]+/gu, '')
                .trim();
        };

        const isUzbekPresentContinuous = (token) => {
            return /((yap|ayap)(man|san|miz|siz|ti|dilar)|yapmanmi|yapsanmi|yaptimi|ayapman|ayapsan|ayapmiz|ayapsiz|ayapti|ayapdilar)$/.test(token);
        };

        const isUzbekNegative = (token) => {
            return /(mayapman|mayapsan|mayapmiz|mayapsiz|mayapti|mayapdilar)$/.test(token);
        };

        const isUzbekNegativeQuestion = (token) => {
            return /(mayapmanmi|mayapsanmi|mayapmizmi|mayapsizmi|mayaptimi|mayapdilarmi)$/.test(token);
        };

        const isUzbekPositiveQuestion = (token) => {
            return /((yap|ayap)(man|san|miz|siz|ti|dilar)mi|yaptimi|ayaptimi|yammanmi)$/.test(token);
        };

        const isUzbekQuestion = (token) => {
            return isUzbekNegativeQuestion(token) || isUzbekPositiveQuestion(token) || /(mi\?|mi)$/.test(token);
        };

        const stripUzbekVerbSuffix = (token) => {
            const suffixes = [
                'mayapmanmi', 'mayapsanmi', 'mayaptimi', 'mayapmizmi', 'mayapsizmi', 'mayapdilarmi',
                'mayapman', 'mayapsan', 'mayapmiz', 'mayapsiz', 'mayapti', 'mayapdilar',
                'ayapmanmi', 'ayapsanmi', 'ayaptimi',
                'yapmanmi', 'yapsanmi', 'yaptimi',
                'ayapman', 'ayapsan', 'ayapmiz', 'ayapsiz', 'ayapti', 'ayapdilar',
                'yapman', 'yapsan', 'yapmiz', 'yapsiz', 'yapti', 'yapdilar',
                'man', 'san', 'miz', 'siz', 'di', 'ti', 'yap', 'ayap', 'mayap', 'moqda'
            ];

            for (const suffix of suffixes) {
                if (token.endsWith(suffix) && token.length > suffix.length) {
                    return token.slice(0, -suffix.length);
                }
            }

            return token;
        };

        const normalizeUzbekVerbBase = (base, originalToken, uzbekMap) => {
            if (uzbekMap.has(base)) return base;

            if (originalToken && /layap/.test(originalToken)) {
                const withA = `${base}a`;
                if (uzbekMap.has(withA)) return withA;
            }

            if (base.endsWith('y') && uzbekMap.has(base.slice(0, -1))) {
                return base.slice(0, -1);
            }
            if (base.endsWith('a') && uzbekMap.has(base.slice(0, -1))) {
                return base.slice(0, -1);
            }
            return base;
        };

        const detectPronoun = (token) => {
            const map = {
                'men': 'I',
                'sen': 'you',
                'siz': 'you',
                'u': 'he',
                'biz': 'we',
                'ular': 'they'
            };
            return map[token] || null;
        };

        const detectPronounFromVerbToken = (token) => {
            if (/(yapsiz|ayapsiz|mayapsiz)$/.test(token)) return 'you';
            if (/(yapman|ayapman|mayapman)$/.test(token)) return 'I';
            if (/(yapsan|ayapsan|mayapsan)$/.test(token)) return 'you';
            if (/(yapmiz|ayapmiz|mayapmiz)$/.test(token)) return 'we';
            if (/(yapti|ayapti|mayapti)$/.test(token)) return 'he';
            if (/(yapdilar|ayapdilar|mayapdilar)$/.test(token)) return 'they';
            return null;
        };

        const detectQuestionWord = (token) => {
            const map = {
                'nima': 'what',
                'qachon': 'when',
                'qayer': 'where',
                'nega': 'why',
                'qanday': 'how',
                'kim': 'who'
            };
            return map[token] || null;
        };

        const detectTimeAdverb = (token) => {
            const map = {
                'hozir': 'now',
                'hozirda': 'now',
                'bugun': 'today',
                'kecha': 'yesterday',
                'ertaga': 'tomorrow',
                'doim': 'always',
                'har doim': 'always',
                'har safar': 'every time'
            };
            return map[token] || null;
        };

        const toAdverb = (word) => {
            if (!word) return word;
            if (word.endsWith('ly')) return word;
            if (word.endsWith('y')) return `${word.slice(0, -1)}ily`;
            return `${word}ly`;
        };

        const toIng = (verb) => {
            if (!verb) return verb;
            if (verb.endsWith('ie')) return `${verb.slice(0, -2)}ying`;
            if (verb.endsWith('e') && !verb.endsWith('ee')) return `${verb.slice(0, -1)}ing`;
            return `${verb}ing`;
        };

        const detectDative = (token) => {
            if (/(ga|ka|qa|ke)$/.test(token)) {
                return token.replace(/(ga|ka|qa|ke)$/, '');
            }
            return null;
        };

        const detectLocative = (token) => {
            if (/(da|ta)$/.test(token)) {
                return token.replace(/(da|ta)$/, '');
            }
            return null;
        };

        const detectAblative = (token) => {
            if (/(dan|tan)$/.test(token)) {
                return token.replace(/(dan|tan)$/, '');
            }
            return null;
        };

        const tokens = sentence
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        const uzbekMap = new Map();
        const englishMap = new Map();

        allWordsForSearch.forEach(word => {
            const uzKey = normalizeLookup(word.uzbek);
            const enKey = normalizeLookup(word.english);

            if (uzKey && !uzbekMap.has(uzKey)) uzbekMap.set(uzKey, word);
            if (enKey && !englishMap.has(enKey)) englishMap.set(enKey, word);
        });

        const translatedTokens = [];
        const words = [];
        let detectedPronoun = null;
        let detectedVerb = null;
        let detectedObject = null;
        let detectedPrep = null;
        let detectedTime = null;
        let detectedAdjective = null;
        let detectedQuestionWord = null;
        let isPresentContinuous = false;
        let isNegative = false;
        let isQuestion = false;

        tokens.forEach((rawToken, idx) => {
            const key = normalizeLookup(rawToken);
            let matched = null;

            if (searchLanguage === 'uz-en') {
                if (rawToken === 'har' && tokens[idx + 1] === 'kuni' && !detectedTime) {
                    detectedTime = 'everyday';
                }

                if (rawToken === 'ayni' && tokens[idx + 1] === 'vaqtda' && !detectedTime) {
                    detectedTime = 'at the moment';
                }

                const pronoun = detectPronoun(key);
                if (pronoun && !detectedPronoun) {
                    detectedPronoun = pronoun;
                }

                const inferredPronoun = detectPronounFromVerbToken(key);
                if (inferredPronoun && !detectedPronoun) {
                    detectedPronoun = inferredPronoun;
                }

                const qWord = detectQuestionWord(key);
                if (qWord && !detectedQuestionWord) {
                    detectedQuestionWord = qWord;
                }

                const time = detectTimeAdverb(key);
                if (time && !detectedTime) {
                    detectedTime = time;
                }

                const dativeBase = detectDative(key);
                if (dativeBase && !detectedObject) {
                    const dativeMatch = uzbekMap.get(dativeBase);
                    if (dativeMatch) {
                        detectedObject = dativeMatch.english;
                    } else {
                        detectedObject = dativeBase;
                    }
                    detectedPrep = 'to';
                }

                const locativeBase = detectLocative(key);
                if (locativeBase && !detectedObject) {
                    if (rawToken === 'vaqtda' && tokens[idx - 1] === 'ayni') {
                        // Skip locative object for "ayni vaqtda"
                    } else {
                        const locativeMatch = uzbekMap.get(locativeBase);
                    if (locativeMatch) {
                        detectedObject = locativeMatch.english;
                    } else {
                        detectedObject = locativeBase;
                    }
                    detectedPrep = 'at';
                    }
                }

                const ablativeBase = detectAblative(key);
                if (ablativeBase && !detectedObject) {
                    const ablativeMatch = uzbekMap.get(ablativeBase);
                    if (ablativeMatch) {
                        detectedObject = ablativeMatch.english;
                    } else {
                        detectedObject = ablativeBase;
                    }
                    detectedPrep = 'from';
                }

                let lookupKey = key;
                if (!uzbekMap.has(lookupKey)) {
                    lookupKey = stripUzbekVerbSuffix(key);
                }

                if (!uzbekMap.has(lookupKey) && lookupKey.endsWith('ma')) {
                    const withoutNegative = lookupKey.slice(0, -2);
                    if (uzbekMap.has(withoutNegative)) {
                        lookupKey = withoutNegative;
                    }
                }

                if (!uzbekMap.has(lookupKey)) {
                    lookupKey = normalizeUzbekVerbBase(lookupKey, key, uzbekMap);
                }

                if (isUzbekPresentContinuous(key)) {
                    isPresentContinuous = true;
                }

                if (isUzbekNegative(key)) {
                    isNegative = true;
                    isPresentContinuous = true;
                }

                if (isUzbekNegativeQuestion(key)) {
                    isNegative = true;
                    isPresentContinuous = true;
                    isQuestion = true;
                }

                if (isUzbekPositiveQuestion(key) || isUzbekQuestion(key) || rawToken === 'mi') {
                    isQuestion = true;
                }

                matched = uzbekMap.get(lookupKey);

                if (!matched && dativeBase) {
                    matched = uzbekMap.get(dativeBase);
                }

                if (!matched && locativeBase) {
                    matched = uzbekMap.get(locativeBase);
                }

                if (!matched && ablativeBase) {
                    matched = uzbekMap.get(ablativeBase);
                }

                if (matched && matched.type === 'adverb' && !detectedTime) {
                    detectedTime = matched.english;
                }

                if (matched && matched.type === 'adjective' && !detectedAdjective) {
                    detectedAdjective = matched.english;
                }

                if (matched && matched.type === 'noun' && !detectedObject) {
                    detectedObject = matched.english;
                }

                if (matched && matched.type === 'verb' && !detectedVerb) {
                    detectedVerb = matched.english;
                }

                if (!detectedVerb && (lookupKey === 'qil' || lookupKey === 'qila' || lookupKey === 'qilmoq')) {
                    detectedVerb = 'do';
                }
            } else {
                matched = englishMap.get(key);
            }

            if (matched) {
                const translated = searchLanguage === 'uz-en' ? matched.english : matched.uzbek;
                translatedTokens.push(translated);
                words.push({
                    english: matched.english,
                    uzbek: matched.uzbek,
                    type: matched.type || 'unknown',
                    found: true
                });
            } else {
                translatedTokens.push(rawToken);
                words.push({
                    english: searchLanguage === 'uz-en' ? rawToken : rawToken,
                    uzbek: searchLanguage === 'uz-en' ? rawToken : rawToken,
                    type: 'unknown',
                    found: false
                });
            }
        });

        let translatedSentence = translatedTokens.join(' ').replace(/\s+/g, ' ').trim();

        if (searchLanguage === 'uz-en') {
            if (detectedPronoun && detectedVerb) {
                let verbForm = detectedVerb;
                let aux = '';

                if (isPresentContinuous) {
                    aux = 'am';
                    if (detectedPronoun !== 'I') {
                        aux = 'are';
                        if (['he', 'she', 'it'].includes(detectedPronoun)) {
                            aux = 'is';
                        }
                    }

                    verbForm = toIng(detectedVerb);
                } else {
                    aux = ['he', 'she', 'it'].includes(detectedPronoun) ? 'does' : 'do';
                    verbForm = detectedVerb;
                }

                const parts = [];

                if (isQuestion) {
                    if (detectedQuestionWord) {
                        parts.push(detectedQuestionWord, aux, detectedPronoun);
                    } else {
                        parts.push(aux, detectedPronoun);
                    }
                    if (isNegative) {
                        parts.push('not');
                    }
                    parts.push(verbForm);
                } else {
                    parts.push(detectedPronoun);
                    if (isNegative) {
                        parts.push(aux, 'not', verbForm);
                    } else if (isPresentContinuous) {
                        parts.push(aux, verbForm);
                    } else {
                        parts.push(verbForm);
                    }
                }

                if (detectedObject) {
                    if (detectedPrep) {
                        parts.push(detectedPrep, detectedObject);
                    } else {
                        parts.push(detectedObject);
                    }
                }

                if (detectedAdjective) {
                    parts.push(toAdverb(detectedAdjective));
                }

                if (detectedTime) {
                    parts.push(detectedTime);
                }

                translatedSentence = parts.join(' ').replace(/\s+/g, ' ').trim();
                if (isQuestion) {
                    translatedSentence = `${translatedSentence}?`;
                }
            } else if (!detectedPronoun && detectedVerb && isPresentContinuous) {
                translatedSentence = `${detectedVerb}ing`;
            } else if (!detectedVerb && detectedObject) {
                translatedSentence = detectedPrep ? `${detectedPrep} ${detectedObject}` : detectedObject;
            }
        }

        const data = {
            success: true,
            words,
            structure: {
                subject: [],
                verb: [],
                preposition: [],
                noun: [],
                adjective: [],
                adverb: []
            },
            english: translatedSentence,
            tense: isPresentContinuous ? 'Present Continuous' : 'Present Simple'
        };

        if (typeof displaySentenceInSearchModal === 'function') {
            displaySentenceInSearchModal(data);
        }

        if (translatedSentence && typeof speakWord === 'function') {
            const targetLang = searchLanguage === 'uz-en' ? 'en' : 'uz';
            speakWord(translatedSentence, targetLang);
        }
    }

    window.translateSentenceAndDisplay = translateSentenceAndDisplay;
})();
