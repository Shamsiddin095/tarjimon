// Present Simple sentence analysis (UZ -> EN)
(function () {
    function translatePresentSimple(sentence, context = {}) {
        const {
            allWordsForSearch = window.allWordsForSearch || [],
            searchLanguage = window.searchLanguage || 'uz-en',
            displaySentenceInSearchModal = window.displaySentenceInSearchModal,
            speakWord = window.speakWord,
            returnOnly = false
        } = context;

        if (searchLanguage !== 'uz-en') {
            return false;
        }

        const normalizeLookup = (str) => {
            if (!str) return '';
            return str
                .toLowerCase()
                .replace(/\s*\(.*?\)\s*/g, '')
                .replace(/[^\p{L}\p{M}'’ʼ-]+/gu, '')
                .trim();
        };

        const hasPresentContinuousMarkers = (token) => {
            return /(yap|ayap|mayap)(man|san|miz|siz|ti|dilar)?(mi)?$/.test(token);
        };

        const isUzbekNegativeSimple = (token) => {
            return /(mayman|maysan|maydi|maymiz|maysiz|maydilar)$/.test(token);
        };

        const isUzbekQuestionSimple = (token) => {
            return /(manmi|sanmi|mizmi|sizmi|adimi|aydimi|ydimi|adilar(mi)?|ymanmi|ymizmi|ydilarmi|maymanmi|maysanmi|maymizmi|maysizmi|maydimi|maydilarmi)$/.test(token) || /(mi)$/.test(token);
        };

        const stripUzbekPresentSimpleSuffix = (token) => {
            const suffixes = [
                'mayman', 'maysan', 'maydi', 'maymiz', 'maysiz', 'maydilar',
                'amisanmi', 'amisan', 'amisanmi',
                'amanmi', 'asanmi', 'adimi', 'aydimi', 'ydimi', 'amizmi', 'asizmi', 'adilarmi', 'ymanmi', 'ymizmi', 'ydilarmi',
                'aman', 'asan', 'aydi', 'ydi', 'adi', 'amiz', 'asiz', 'adilar', 'yman', 'ymiz', 'ydilar',
                'man', 'san', 'miz', 'siz', 'di', 'ydi'
            ];

            for (const suffix of suffixes) {
                if (token.endsWith(suffix) && token.length > suffix.length) {
                    return token.slice(0, -suffix.length);
                }
            }

            return token;
        };

        const normalizeUzbekVerbBase = (base, uzbekMap) => {
            if (uzbekMap.has(base)) return base;
            if (base.endsWith('a') && uzbekMap.has(base.slice(0, -1))) return base.slice(0, -1);
            if (base.endsWith('y') && uzbekMap.has(base.slice(0, -1))) return base.slice(0, -1);
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
            if (/maymanmi$/.test(token)) return 'I';
            if (/maysanmi$/.test(token)) return 'you';
            if (/maymizmi$/.test(token)) return 'we';
            if (/maysizmi$/.test(token)) return 'you';
            if (/maydilarmi$/.test(token)) return 'they';
            if (/maydimi$/.test(token)) return 'he';
            if (/mayman$/.test(token)) return 'I';
            if (/maysan$/.test(token)) return 'you';
            if (/maymiz$/.test(token)) return 'we';
            if (/maysiz$/.test(token)) return 'you';
            if (/maydilar$/.test(token)) return 'they';
            if (/maydi$/.test(token)) return 'he';
            if (/(amanmi|manmi)$/.test(token)) return 'I';
            if (/(asanmi|sanmi)$/.test(token)) return 'you';
            if (/(amizmi|mizmi)$/.test(token)) return 'we';
            if (/(asizmi|sizmi)$/.test(token)) return 'you';
            if (/(adilar(mi)?)$/.test(token)) return 'they';
            if (/adimi$/.test(token)) return 'he';
            if (/aydimi$/.test(token)) return 'he';
            if (/ydimi$/.test(token)) return 'he';
            if (/ymanmi$/.test(token)) return 'I';
            if (/ymizmi$/.test(token)) return 'we';
            if (/ydilarmi$/.test(token)) return 'they';
            if (/(aman|man)$/.test(token)) return 'I';
            if (/(asan|san)$/.test(token)) return 'you';
            if (/(amiz|miz)$/.test(token)) return 'we';
            if (/(asiz|siz)$/.test(token)) return 'you';
            if (/(adilar|dilar)$/.test(token)) return 'they';
            if (/(adi|di)$/.test(token)) return 'he';
            if (/(aydi|ydi)$/.test(token)) return 'he';
            if (/yman$/.test(token)) return 'I';
            if (/ymiz$/.test(token)) return 'we';
            if (/ydilar$/.test(token)) return 'they';
            return null;
        };

        const detectTimeAdverb = (token) => {
            const map = {
                'har': 'every',
                'bugun': 'today',
                'doim': 'always',
                'ko\'pincha': 'usually',
                'tez-tez': 'often'
            };
            return map[token] || null;
        };

        const toAdverb = (word) => {
            if (!word) return word;
            if (word.endsWith('ly')) return word;
            if (word.endsWith('y')) return `${word.slice(0, -1)}ily`;
            return `${word}ly`;
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

        const toSimplePresent = (verb, pronoun) => {
            if (!verb) return verb;
            if (!['he', 'she', 'it'].includes(pronoun)) return verb;

            if (verb === 'go') return 'goes';
            if (/(s|sh|ch|x|o)$/.test(verb)) return `${verb}es`;
            if (verb.endsWith('y') && !/[aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
            return `${verb}s`;
        };

        const tokens = sentence
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (tokens.some(hasPresentContinuousMarkers)) {
            return false;
        }

        const uzbekMap = new Map();
        const englishMap = new Map();

        allWordsForSearch.forEach(word => {
            const uzKey = normalizeLookup(word.uzbek);
            const enKey = normalizeLookup(word.english);

            if (uzKey && !uzbekMap.has(uzKey)) uzbekMap.set(uzKey, word);
            if (enKey && !englishMap.has(enKey)) englishMap.set(enKey, word);
        });

        const words = [];
        let detectedPronoun = null;
        let detectedVerb = null;
        let detectedObject = null;
        let detectedPrep = null;
        let detectedTime = null;
        let isNegative = false;
        let isQuestion = false;
        let detectedAdjective = null;

        tokens.forEach((rawToken, idx) => {
            const key = normalizeLookup(rawToken);
            let matched = null;
            if (isUzbekNegativeSimple(key)) {
                isNegative = true;
            }

            if (isUzbekQuestionSimple(key) || rawToken === 'mi') {
                isQuestion = true;
            }

            if (rawToken === 'har' && tokens[idx + 1] === 'kuni' && !detectedTime) {
                detectedTime = 'everyday';
            }

            const pronoun = detectPronoun(key);
            if (pronoun && !detectedPronoun) {
                detectedPronoun = pronoun;
            }

            const inferredPronoun = detectPronounFromVerbToken(key);
            if (inferredPronoun && !detectedPronoun) {
                detectedPronoun = inferredPronoun;
            }

            const time = detectTimeAdverb(key);
            if (time && !detectedTime) {
                detectedTime = time;
            }

            const dativeBase = detectDative(key);
            if (dativeBase && !detectedObject) {
                const dativeMatch = uzbekMap.get(dativeBase);
                detectedObject = dativeMatch ? dativeMatch.english : dativeBase;
                detectedPrep = 'to';
            }

            const locativeBase = detectLocative(key);
            if (locativeBase && !detectedObject) {
                const locativeMatch = uzbekMap.get(locativeBase);
                detectedObject = locativeMatch ? locativeMatch.english : locativeBase;
                detectedPrep = 'at';
            }

            const ablativeBase = detectAblative(key);
            if (ablativeBase && !detectedObject) {
                const ablativeMatch = uzbekMap.get(ablativeBase);
                detectedObject = ablativeMatch ? ablativeMatch.english : ablativeBase;
                detectedPrep = 'from';
            }

            let lookupKey = key;
            if (!uzbekMap.has(lookupKey)) {
                lookupKey = stripUzbekPresentSimpleSuffix(key);
            }

            if (!uzbekMap.has(lookupKey)) {
                lookupKey = normalizeUzbekVerbBase(lookupKey, uzbekMap);
            }

            matched = uzbekMap.get(lookupKey) || uzbekMap.get(dativeBase) || uzbekMap.get(locativeBase) || uzbekMap.get(ablativeBase);

            if (matched && matched.type === 'noun' && !detectedObject) {
                detectedObject = matched.english;
            }

            if (matched && matched.type === 'adjective' && !detectedAdjective) {
                detectedAdjective = matched.english;
            }

            if (matched && matched.type === 'verb' && !detectedVerb) {
                detectedVerb = matched.english;
            }

            if (matched) {
                words.push({
                    english: matched.english,
                    uzbek: matched.uzbek,
                    type: matched.type || 'unknown',
                    found: true
                });
            } else {
                words.push({
                    english: key,
                    uzbek: key,
                    type: 'unknown',
                    found: false
                });
            }
        });

        if (!detectedPronoun || !detectedVerb) {
            return false;
        }

        const baseVerb = detectedVerb;
        const verbForm = isNegative ? baseVerb : toSimplePresent(baseVerb, detectedPronoun);
        const parts = [];

        if (isQuestion) {
            const aux = ['he', 'she', 'it'].includes(detectedPronoun) ? 'does' : 'do';
            parts.push(aux, detectedPronoun);
            if (isNegative) {
                parts.push('not');
            }
            parts.push(baseVerb);
        } else {
            parts.push(detectedPronoun);
            if (isNegative) {
                const aux = ['he', 'she', 'it'].includes(detectedPronoun) ? "doesn't" : "don't";
                parts.push(aux, baseVerb);
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

        let translatedSentence = parts.join(' ').replace(/\s+/g, ' ').trim();
        if (isQuestion) {
            translatedSentence = `${translatedSentence}?`;
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
            tense: 'Present Simple'
        };

        if (!returnOnly) {
            if (typeof displaySentenceInSearchModal === 'function') {
                displaySentenceInSearchModal(data);
            }

            if (translatedSentence && typeof speakWord === 'function') {
                speakWord(translatedSentence, 'en');
            }
        }

        if (returnOnly) {
            return data;
        }

        return true;
    }

    window.translatePresentSimple = translatePresentSimple;
})();
