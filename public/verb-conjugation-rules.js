// Verb Conjugation Rules - Ingliz va O'zbek tillar uchun

// Irregular verbs ro'yxati (eng keng tarqalgan)
const IRREGULAR_VERBS = {
    'go': { past: 'went', pastParticiple: 'gone', presentThird: 'goes' },
    'eat': { past: 'ate', pastParticiple: 'eaten', presentThird: 'eats' },
    'run': { past: 'ran', pastParticiple: 'run', presentThird: 'runs' },
    'sleep': { past: 'slept', pastParticiple: 'slept', presentThird: 'sleeps' },
    'drink': { past: 'drank', pastParticiple: 'drunk', presentThird: 'drinks' },
    'write': { past: 'wrote', pastParticiple: 'written', presentThird: 'writes' },
    'read': { past: 'read', pastParticiple: 'read', presentThird: 'reads' },
    'speak': { past: 'spoke', pastParticiple: 'spoken', presentThird: 'speaks' },
    'take': { past: 'took', pastParticiple: 'taken', presentThird: 'takes' },
    'give': { past: 'gave', pastParticiple: 'given', presentThird: 'gives' },
    'see': { past: 'saw', pastParticiple: 'seen', presentThird: 'sees' },
    'come': { past: 'came', pastParticiple: 'come', presentThird: 'comes' },
    'make': { past: 'made', pastParticiple: 'made', presentThird: 'makes' },
    'know': { past: 'knew', pastParticiple: 'known', presentThird: 'knows' },
    'think': { past: 'thought', pastParticiple: 'thought', presentThird: 'thinks' },
    'get': { past: 'got', pastParticiple: 'gotten', presentThird: 'gets' },
    'find': { past: 'found', pastParticiple: 'found', presentThird: 'finds' },
    'tell': { past: 'told', pastParticiple: 'told', presentThird: 'tells' },
    'become': { past: 'became', pastParticiple: 'become', presentThird: 'becomes' },
    'leave': { past: 'left', pastParticiple: 'left', presentThird: 'leaves' },
    'feel': { past: 'felt', pastParticiple: 'felt', presentThird: 'feels' },
    'bring': { past: 'brought', pastParticiple: 'brought', presentThird: 'brings' },
    'begin': { past: 'began', pastParticiple: 'begun', presentThird: 'begins' },
    'keep': { past: 'kept', pastParticiple: 'kept', presentThird: 'keeps' },
    'hold': { past: 'held', pastParticiple: 'held', presentThird: 'holds' },
    'stand': { past: 'stood', pastParticiple: 'stood', presentThird: 'stands' },
    'hear': { past: 'heard', pastParticiple: 'heard', presentThird: 'hears' },
    'let': { past: 'let', pastParticiple: 'let', presentThird: 'lets' },
    'mean': { past: 'meant', pastParticiple: 'meant', presentThird: 'means' },
    'set': { past: 'set', pastParticiple: 'set', presentThird: 'sets' },
    'meet': { past: 'met', pastParticiple: 'met', presentThird: 'meets' },
    'pay': { past: 'paid', pastParticiple: 'paid', presentThird: 'pays' },
    'sit': { past: 'sat', pastParticiple: 'sat', presentThird: 'sits' },
    'lose': { past: 'lost', pastParticiple: 'lost', presentThird: 'loses' },
    'buy': { past: 'bought', pastParticiple: 'bought', presentThird: 'buys' },
    'send': { past: 'sent', pastParticiple: 'sent', presentThird: 'sends' },
    'fall': { past: 'fell', pastParticiple: 'fallen', presentThird: 'falls' },
    'understand': { past: 'understood', pastParticiple: 'understood', presentThird: 'understands' },
    'choose': { past: 'chose', pastParticiple: 'chosen', presentThird: 'chooses' },
    'build': { past: 'built', pastParticiple: 'built', presentThird: 'builds' },
    'fly': { past: 'flew', pastParticiple: 'flown', presentThird: 'flies' },
    'wear': { past: 'wore', pastParticiple: 'worn', presentThird: 'wears' },
    'draw': { past: 'drew', pastParticiple: 'drawn', presentThird: 'draws' },
    'teach': { past: 'taught', pastParticiple: 'taught', presentThird: 'teaches' },
    'catch': { past: 'caught', pastParticiple: 'caught', presentThird: 'catches' },
    'fight': { past: 'fought', pastParticiple: 'fought', presentThird: 'fights' },
    'sing': { past: 'sang', pastParticiple: 'sung', presentThird: 'sings' },
    'swim': { past: 'swam', pastParticiple: 'swum', presentThird: 'swims' }
};

// Regular verb conjugation rules
function conjugateRegularVerb(baseForm) {
    const base = baseForm.toLowerCase();
    let presentThird, past, pastParticiple, presentParticiple;
    
    // Present Participle (-ing form)
    if (base.endsWith('e') && !base.endsWith('ee')) {
        presentParticiple = base.slice(0, -1) + 'ing'; // make -> making
    } else if (base.match(/[^aeiou][aeiou][^aeiou]$/) && !base.endsWith('w') && !base.endsWith('x') && !base.endsWith('y')) {
        // Double consonant: run -> running, stop -> stopping
        presentParticiple = base + base.slice(-1) + 'ing';
    } else {
        presentParticiple = base + 'ing';
    }
    
    // Past and Past Participle
    if (base.endsWith('e')) {
        past = pastParticiple = base + 'd'; // love -> loved
    } else if (base.endsWith('y') && !base.match(/[aeiou]y$/)) {
        past = pastParticiple = base.slice(0, -1) + 'ied'; // study -> studied
    } else if (base.match(/[^aeiou][aeiou][^aeiouwxy]$/)) {
        // Double consonant: stop -> stopped
        past = pastParticiple = base + base.slice(-1) + 'ed';
    } else {
        past = pastParticiple = base + 'ed';
    }
    
    // Present Third Person
    if (base.endsWith('s') || base.endsWith('sh') || base.endsWith('ch') || base.endsWith('x') || base.endsWith('z')) {
        presentThird = base + 'es'; // wash -> washes
    } else if (base.endsWith('y') && !base.match(/[aeiou]y$/)) {
        presentThird = base.slice(0, -1) + 'ies'; // study -> studies
    } else {
        presentThird = base + 's';
    }
    
    return { presentThird, past, pastParticiple, presentParticiple };
}

// O'zbek fe'l conjugation (basic rules)
function conjugateUzbekVerb(baseForm) {
    // baseForm: "yugurmoq", "ketish", etc.
    const base = baseForm.toLowerCase();
    
    // Base formdan -moq/-mok yoki -ish ni olib tashlash
    let root = base;
    if (base.endsWith('moq') || base.endsWith('mok')) {
        root = base.slice(0, -3);
    } else if (base.endsWith('ish')) {
        root = base.slice(0, -3);
    }
    
    return {
        presentSimple: root + 'adi',              // yuguradi, ketadi
        presentContinuous: root + 'ayotman',      // yugurayotman
        presentPerfect: root + 'ib ketgan',       // yugurub ketgan
        presentPerfectCont: root + 'ayotgan bo\'ldi',
        pastSimple: root + 'di',                  // yugurdi
        pastContinuous: root + 'ayotgan edi',     // yugurayotgan edi
        pastPerfect: root + 'ib ketgan edi',
        pastPerfectCont: root + 'ayotgan edi',
        futureSimple: root + 'adi',               // yuguradi (kelajak)
        futureContinuous: root + 'ayotgan bo\'ladi',
        futurePerfect: root + 'ib ketgan bo\'ladi',
        futurePerfectCont: root + 'ayotgan bo\'ladi',
        conditionalSimple: root + 'ardi',         // yugurardi
        conditionalCont: root + 'ayotgan bo\'lardi',
        conditionalPerfect: root + 'ib ketgan bo\'lardi',
        conditionalPerfectCont: root + 'ayotgan bo\'lardi'
    };
}

// Example sentence templates
const EXAMPLE_TEMPLATES = {
    'Present Simple': {
        subjects: ['I', 'You', 'He', 'She', 'We', 'They'],
        subjectsUzbek: ['Men', 'Siz', 'U', 'U', 'Biz', 'Ular'],
        timeExpressions: ['every day', 'usually', 'always', 'often', 'sometimes'],
        timeExpressionsUzbek: ['har kun', 'odatda', 'doim', 'tez-tez', 'ba\'zan']
    },
    'Present Continuous': {
        subjects: ['I', 'You', 'He', 'She', 'We', 'They'],
        subjectsUzbek: ['Men', 'Siz', 'U', 'U', 'Biz', 'Ular'],
        timeExpressions: ['now', 'right now', 'at the moment', 'currently'],
        timeExpressionsUzbek: ['hozir', 'ayni paytda', 'hozirda', 'shu vaqtda']
    },
    'Past Simple': {
        subjects: ['I', 'You', 'He', 'She', 'We', 'They'],
        subjectsUzbek: ['Men', 'Siz', 'U', 'U', 'Biz', 'Ular'],
        timeExpressions: ['yesterday', 'last week', 'last year', 'ago'],
        timeExpressionsUzbek: ['kecha', 'o\'tgan hafta', 'o\'tgan yil', 'avval']
    },
    'Future Simple': {
        subjects: ['I', 'You', 'He', 'She', 'We', 'They'],
        subjectsUzbek: ['Men', 'Siz', 'U', 'U', 'Biz', 'Ular'],
        timeExpressions: ['tomorrow', 'next week', 'soon', 'later'],
        timeExpressionsUzbek: ['ertaga', 'kelgusi hafta', 'tez orada', 'keyinroq']
    }
};

// Generate full conjugation for a verb
window.generateVerbConjugation = function(englishVerb, uzbekVerb) {
    const base = englishVerb.toLowerCase().trim();
    const uzbekBase = uzbekVerb.toLowerCase().trim();
    
    // Check if irregular
    const isIrregular = IRREGULAR_VERBS[base];
    
    let englishForms;
    if (isIrregular) {
        englishForms = {
            base: base,
            presentThird: isIrregular.presentThird,
            past: isIrregular.past,
            pastParticiple: isIrregular.pastParticiple,
            presentParticiple: base.endsWith('e') ? base.slice(0, -1) + 'ing' : base + 'ing'
        };
    } else {
        const regular = conjugateRegularVerb(base);
        englishForms = {
            base: base,
            presentThird: regular.presentThird,
            past: regular.past,
            pastParticiple: regular.pastParticiple,
            presentParticiple: regular.presentParticiple
        };
    }
    
    const uzbekForms = conjugateUzbekVerb(uzbekBase);
    
    // Generate tenses array
    const tenses = [
        {
            name: 'Present Simple',
            form: `${base}/${englishForms.presentThird}`,
            uzbek: uzbekForms.presentSimple,
            example: `I ${base} every day`,
            exampleUzbek: `Men har kun ${uzbekForms.presentSimple.replace('adi', 'aman')}`
        },
        {
            name: 'Present Continuous',
            form: `am/is/are ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.presentContinuous,
            example: `I am ${englishForms.presentParticiple} now`,
            exampleUzbek: `Men hozir ${uzbekForms.presentContinuous}`
        },
        {
            name: 'Present Perfect',
            form: `have/has ${englishForms.pastParticiple}`,
            uzbek: uzbekForms.presentPerfect,
            example: `I have ${englishForms.pastParticiple}`,
            exampleUzbek: `Men ${uzbekForms.presentPerfect}`
        },
        {
            name: 'Present Perfect Continuous',
            form: `have/has been ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.presentPerfectCont,
            example: `I have been ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.presentPerfectCont}`
        },
        {
            name: 'Past Simple',
            form: englishForms.past,
            uzbek: uzbekForms.pastSimple,
            example: `I ${englishForms.past} yesterday`,
            exampleUzbek: `Men kecha ${uzbekForms.pastSimple.replace('di', 'dim')}`
        },
        {
            name: 'Past Continuous',
            form: `was/were ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.pastContinuous,
            example: `I was ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.pastContinuous.replace('edi', 'edim')}`
        },
        {
            name: 'Past Perfect',
            form: `had ${englishForms.pastParticiple}`,
            uzbek: uzbekForms.pastPerfect,
            example: `I had ${englishForms.pastParticiple}`,
            exampleUzbek: `Men ${uzbekForms.pastPerfect.replace('edi', 'edim')}`
        },
        {
            name: 'Past Perfect Continuous',
            form: `had been ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.pastPerfectCont,
            example: `I had been ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.pastPerfectCont.replace('edi', 'edim')}`
        },
        {
            name: 'Future Simple',
            form: `will ${base}`,
            uzbek: uzbekForms.futureSimple,
            example: `I will ${base} tomorrow`,
            exampleUzbek: `Men ertaga ${uzbekForms.futureSimple.replace('adi', 'aman')}`
        },
        {
            name: 'Future Continuous',
            form: `will be ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.futureContinuous,
            example: `I will be ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.futureContinuous.replace('bo\'ladi', 'bo\'laman')}`
        },
        {
            name: 'Future Perfect',
            form: `will have ${englishForms.pastParticiple}`,
            uzbek: uzbekForms.futurePerfect,
            example: `I will have ${englishForms.pastParticiple}`,
            exampleUzbek: `Men ${uzbekForms.futurePerfect.replace('bo\'ladi', 'bo\'laman')}`
        },
        {
            name: 'Future Perfect Continuous',
            form: `will have been ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.futurePerfectCont,
            example: `I will have been ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.futurePerfectCont.replace('bo\'ladi', 'bo\'laman')}`
        },
        {
            name: 'Conditional Simple',
            form: `would ${base}`,
            uzbek: uzbekForms.conditionalSimple,
            example: `I would ${base}`,
            exampleUzbek: `Men ${uzbekForms.conditionalSimple.replace('ardi', 'ardim')}`
        },
        {
            name: 'Conditional Continuous',
            form: `would be ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.conditionalCont,
            example: `I would be ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.conditionalCont.replace('bo\'lardi', 'bo\'lardim')}`
        },
        {
            name: 'Conditional Perfect',
            form: `would have ${englishForms.pastParticiple}`,
            uzbek: uzbekForms.conditionalPerfect,
            example: `I would have ${englishForms.pastParticiple}`,
            exampleUzbek: `Men ${uzbekForms.conditionalPerfect.replace('bo\'lardi', 'bo\'lardim')}`
        },
        {
            name: 'Conditional Perfect Continuous',
            form: `would have been ${englishForms.presentParticiple}`,
            uzbek: uzbekForms.conditionalPerfectCont,
            example: `I would have been ${englishForms.presentParticiple}`,
            exampleUzbek: `Men ${uzbekForms.conditionalPerfectCont.replace('bo\'lardi', 'bo\'lardim')}`
        }
    ];
    
    return tenses;
};
