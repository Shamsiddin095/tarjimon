// Uzbek Grammar Parser - Gaplarni parse qilib verb root va tense'ni aniqlaydigan logika

// Uzbek subject pronoun'lari
const UZBEK_SUBJECTS = {
    'men': 'I',
    'siz': 'you',
    'u': 'he/she/it',
    'biz': 'we',
    'ular': 'they'
};

// Uzbek verb suffixes va ularning English tense mapping'i
const UZBEK_VERB_PATTERNS = [
    // Present Continuous (-yapman, -yoqman, -yapsan, etc.)
    {
        pattern: /^(.+?)(yapman|yoqman|yapsan|yopsiz|yaptiman|yaptiniz|yapmiz|yaptiliman|yaptiniz|yaptiliman)$/,
        tense: 'Present Continuous',
        englishTenseForm: (root, suffix, subject) => {
            return `am/is/are ${root}ing`;
        }
    },
    // Present Simple with -di (past marker) or -adi (habitual)
    {
        pattern: /^(.+?)(adi|idi|edi|adi|odi|adi|ydi|ydi)$/,
        tense: 'Present Simple',
        englishTenseForm: (root, suffix, subject) => {
            return `${root}s`;
        }
    },
    // Past Simple (-di, -tim, -tiz, -tik)
    {
        pattern: /^(.+?)(dim|ding|di|dik|diniz|tim|ting|tik|tiniz)$/,
        tense: 'Past Simple',
        englishTenseForm: (root, suffix, subject) => {
            // Irregular verbs
            const irregulars = {
                'borg': 'went',
                'ketish': 'went',
                'yeguor': 'ran',
                'yogir': 'ran',
                'uxla': 'slept',
                'ye': 'ate'
            };
            return irregulars[root] || `${root}ed`;
        }
    },
    // Past Continuous (-yotgan edi)
    {
        pattern: /^(.+?)(yotgan|yatgan)\s+(edi|edim|eding|edik|ediniz)$/,
        tense: 'Past Continuous',
        englishTenseForm: (root, suffix, subject) => {
            return `was/were ${root}ing`;
        }
    },
    // Future (-aman, -asan, -adi)
    {
        pattern: /^(.+?)(aman|asan|adi|aminiz|asiniz|timan|tisan|tiniz)$/,
        tense: 'Future Simple',
        englishTenseForm: (root, suffix, subject) => {
            return `will ${root}`;
        }
    },
    // Infinitive (-moq, -mak)
    {
        pattern: /^(.+?)(moq|mak)$/,
        tense: 'Infinitive',
        englishTenseForm: (root, suffix, subject) => {
            return `${root}`;
        }
    }
];

/**
 * Uzbek gapni parse qilish
 * @param {string} uzbekSentence - "Men yugurayapman" kabi Uzbek gap
 * @returns {object} {subject, verbRoot, tense, englishTranslation}
 */
window.parseUzbekSentence = function(uzbekSentence) {
    const words = uzbekSentence.toLowerCase().trim().split(/\s+/);
    
    if (words.length === 0) return null;
    
    let result = {
        originalSentence: uzbekSentence,
        subject: null,
        verbRoot: null,
        verbSuffix: null,
        tense: null,
        englishSubject: null,
        englishForm: null
    };
    
    // 1. Subject aniqlaydigan (Men, Siz, U, Biz, Ular)
    let verbStartIndex = 0;
    const firstWord = words[0];
    
    if (UZBEK_SUBJECTS[firstWord]) {
        result.subject = firstWord;
        result.englishSubject = UZBEK_SUBJECTS[firstWord];
        verbStartIndex = 1;
    } else {
        // Agar subject yo'q bo'lsa, "I" deb faraz qilish (default)
        result.englishSubject = 'I';
    }
    
    // 2. Verb'ni topish (birinchi yoki ikkinchi so'z)
    if (verbStartIndex < words.length) {
        const verbWord = words[verbStartIndex];
        
        // Pattern'larni tekshirish
        for (let patternObj of UZBEK_VERB_PATTERNS) {
            const match = verbWord.match(patternObj.pattern);
            if (match) {
                result.verbRoot = match[1];
                result.verbSuffix = match[2];
                result.tense = patternObj.tense;
                
                // English form'ni generate qilish
                result.englishForm = patternObj.englishTenseForm(
                    match[1],
                    match[2],
                    result.englishSubject
                );
                
                break;
            }
        }
    }
    
    return result;
};

/**
 * Uzbek verb root'ni English infinitive'ga o'tkazish
 * @param {string} uzbekRoot - "yugur", "uxla", "bor" kabi root
 * @returns {string} English verb base form
 */
window.mapUzbekRootToEnglish = function(uzbekRoot) {
    const mappings = {
        'yugur': 'run',
        'bor': 'go',
        'ket': 'go',
        'yemo': 'eat',
        'ye': 'eat',
        'uxla': 'sleep',
        'uxla': 'sleep',
        'yoz': 'write',
        'oku': 'read',
        'ko\'r': 'see',
        'eshit': 'hear',
        'ayt': 'say'
    };
    
    return mappings[uzbekRoot] || uzbekRoot;
};

/**
 * Uzbek parsing + English conjugation
 * @param {string} uzbekSentence - Uzbek gap
 * @param {object} verbConjugations - generateVerbConjugation() dan kelingan object
 * @returns {object} Matched conjugation yoki null
 */
window.analyzeUzbekAndFindConjugation = function(uzbekSentence) {
    const parsed = window.parseUzbekSentence(uzbekSentence);
    
    if (!parsed || !parsed.verbRoot) {
        return null;
    }
    
    // Verb root'ni English'ga o'tkazish
    const englishVerb = window.mapUzbekRootToEnglish(parsed.verbRoot);
    
    // Agar verb-conjugation-rules'da bu verb bo'lsa
    if (!window.generateVerbConjugation) {
        return null;
    }
    
    // Dummy Uzbek form - asil shablon verb-conjugation-rules'dan olinadi
    const conjugations = window.generateVerbConjugation(englishVerb, parsed.verbRoot + 'moq');
    
    if (!conjugations || conjugations.length === 0) {
        return null;
    }
    
    // Parsed tense bilan matching conjugation'ni topish
    const matchedConjugation = conjugations.find(c => {
        // Tense name'ni match qilish
        if (parsed.tense === 'Present Continuous') {
            return c.name.includes('Continuous');
        } else if (parsed.tense === 'Past Simple') {
            return c.name === 'Past Simple';
        } else if (parsed.tense === 'Future Simple') {
            return c.name === 'Future Simple';
        } else if (parsed.tense === 'Present Simple') {
            return c.name === 'Present Simple';
        } else if (parsed.tense === 'Past Continuous') {
            return c.name === 'Past Continuous';
        }
        return false;
    });
    
    if (matchedConjugation) {
        return {
            parsed,
            englishVerb,
            conjugation: matchedConjugation,
            englishSentenceTemplate: `${parsed.englishSubject} ${matchedConjugation.form}`,
            englishExample: matchedConjugation.example
        };
    }
    
    return null;
};
