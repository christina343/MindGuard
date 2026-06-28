import re
import nltk
from textblob import TextBlob
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.corpus import stopwords

# Ensure NLTK data is downloaded
nltk.download('vader_lexicon', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)


stop_words = set(stopwords.words('english'))

KEEP_WORDS = {
    "not", "no", "never", "can't", "won't", "don't", "isn't",
    "wasn't", "couldn't", "wouldn't", "shouldn't", "haven't",
    "hadn't", "doesn't", "didn't", "very", "too", "so",
    "extremely", "really", "barely", "hardly", "scarcely"
}
FINAL_STOP_WORDS = stop_words - KEEP_WORDS


def preprocess_text(text: str) -> dict:
    original = text
    
    # Handle emoticons before stripping punctuation
    for emo, replacement in EMOTICON_MAP.items():
        text = text.replace(emo, replacement)
        
    text_lower = text.lower()
    cleaned = re.sub(r"[^a-zA-Z\s']", '', text_lower)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Check for Hinglish stress words
    hinglish_found = [w for w in HINGLISH_STRESS if w in cleaned]
    
    tokens = cleaned.split()
    filtered_tokens = [t for t in tokens if t not in FINAL_STOP_WORDS]
    sentences = re.split(r'[.!?]+', original)
    sentences = [s.strip() for s in sentences if s.strip()]

    return {
        "original": original,
        "cleaned": cleaned,
        "tokens": filtered_tokens,
        "hinglish_found": hinglish_found,
        "word_count": len(tokens),
        "sentence_count": len(sentences),
        "avg_words_per_sentence": round(len(tokens) / max(len(sentences), 1), 1)
    }


# ============================================================
# LIMITATION 7 FIX — Negation + Context + Sarcasm Handling
# ============================================================

# Negation words that flip meaning
NEGATION_WORDS = {
    "not", "no", "never", "neither", "nor", "barely", "hardly",
    "scarcely", "can't", "cant", "cannot", "won't", "wont", "don't", "dont", 
    "didn't", "didnt", "doesn't", "doesnt", "isn't", "isnt", "wasn't", "wasnt", 
    "wouldn't", "wouldnt", "couldn't", "couldnt", "shouldn't", "shouldnt", 
    "haven't", "havent", "hadn't", "hadnt", "nothing", "nobody", "nowhere",
    "without", "none", "finished", "completed", "over", "holiday", "vacation", "rest",
    "zero", "nah", "noo", "nooo"
}

# Common Hinglish/Code-switching stress words
HINGLISH_STRESS = {
    "pareshan", "thak", "tension", "dimag", "kharab", "neend", "zyada", "bohot",
    "kam", "paisa", "mushkil", "pareshani", "bechain", "ghabrahat"
}

# Basic emoticon mapping
EMOTICON_MAP = {
    ":)": " happy ", ":(": " sad ", ":/": " confused ", ">:(": " angry ", 
    "xD": " laughing ", "D:": " shocked ", ":O": " shocked ", ";)": " wink "
}

# Sarcasm indicator patterns
SARCASM_PATTERNS = [
    r"(yeah\s+right)",
    r"(oh\s+great)",
    r"(just\s+perfect)",
    r"(totally\s+fine)",
    r"(absolutely\s+fine)",
    r"(so\s+much\s+fun)",
    r"(love\s+this\s+so\s+much)",
    r"(best\s+day\s+ever)",
    r"(i\s+guess\s+i'm\s+fine)",
    r"(everything\s+is\s+fine\s+i\s+guess)",
    r"(not\s+like\s+i'm\s+stressed)",
    r"(its\s+all\s+good\s+i\s+guess)",
    r"(i\s+love\s+deadlines)",
    r"(exams\s+are\s+fun)",
    r"(who\s+needs\s+sleep)",
    r"(sleep\s+is\s+overrated)",
    r"(stress\s+is\s+my\s+best\s+friend)",
]

# Context-sensitive phrases: positive words that mean negative in burnout
FALSE_POSITIVE_PHRASES = [
    ("killed it", False),      # "I killed it" = did well, not negative
    ("dead serious", False),   # not fatigue
    ("dying to", False),       # "dying to sleep" could go either way
    ("killing me softly", True),  # = stress
    ("killing myself", True),  # = burnout
    ("dead tired", True),      # = fatigue
    ("dead inside", True),     # = burnout
    ("dead on my feet", True), # = fatigue
]


def detect_negation_context(text: str, keyword: str) -> bool:
    """
    Check if a keyword is negated or completed within a wider 5-word window.
    Rule: if exam_word_found and negation_within_window, context = False.
    """
    text_lower = text.lower()
    words = text_lower.split()

    for i, word in enumerate(words):
        clean_word = re.sub(r"[^a-z']", '', word)
        if keyword in clean_word or clean_word in keyword:
            # Check 5 words before (expanded window for complex sentences)
            window_start = max(0, i - 5)
            preceding = words[window_start:i]
            preceding_clean = [re.sub(r"[^a-z']", '', w) for w in preceding]
            if any(neg in preceding_clean for neg in NEGATION_WORDS):
                return True
            
            # Check 4 words after (e.g. "exams are completely over now")
            window_end = min(len(words), i + 5)
            following = words[i+1:window_end]
            following_clean = [re.sub(r"[^a-z']", '', w) for w in following]
            completion_words = {"over", "finished", "completed", "done", "none", "holiday", "vacation", "rest"}
            if any(cw in following_clean for cw in completion_words):
                return True
    return False


def detect_sarcasm(text: str) -> dict:
    """
    Detect sarcasm patterns in text.
    Returns sarcasm score and detected patterns.
    """
    text_lower = text.lower()
    detected = []

    for pattern in SARCASM_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            detected.append(match.group())

    sarcasm_score = min(len(detected) / 3.0, 1.0)

    return {
        "sarcasm_detected": len(detected) > 0,
        "sarcasm_score": round(sarcasm_score, 3),
        "sarcasm_patterns_found": detected
    }


def resolve_false_positives(text: str) -> dict:
    """
    Handle context-sensitive phrases that are misread by VADER.
    Returns corrections to apply to sentiment score.
    """
    text_lower = text.lower()
    corrections = []
    sentiment_adjustment = 0.0

    for phrase, is_negative in FALSE_POSITIVE_PHRASES:
        if phrase in text_lower:
            if not is_negative:
                # VADER may read this as negative but it's positive/neutral
                corrections.append(f"'{phrase}' is contextually neutral/positive")
                sentiment_adjustment += 0.1  # push score toward positive
            else:
                corrections.append(f"'{phrase}' confirms burnout/fatigue")
                sentiment_adjustment -= 0.1  # push score toward negative

    return {
        "corrections": corrections,
        "sentiment_adjustment": round(sentiment_adjustment, 3)
    }


# ============================================================
# KARTHIKEYA — Emotion Analysis (with context awareness)
# ============================================================

sia = SentimentIntensityAnalyzer()

EMOTION_KEYWORDS = {
    "stressed": [
        "stressed", "overwhelmed", "pressure", "anxious", "anxiety",
        "panic", "tense", "nervous", "worried", "deadline", "overloaded",
        "burden", "hectic", "chaotic", "frantic", "rushing", "suffocating"
    ],
    "sad": [
        "sad", "depressed", "hopeless", "empty", "lonely", "miserable",
        "unhappy", "gloomy", "down", "blue", "heartbroken", "crying",
        "tearful", "grief", "sorrow", "disappointed", "discouraged",
        "felt low", "wanted to isolate myself", "negative thoughts",
        "tasks felt heavy"
    ],
    "angry": [
        "angry", "frustrated", "irritated", "annoyed", "furious",
        "mad", "rage", "hate", "hatred", "bitter", "resentful",
        "agitated", "outraged", "hostile", "fed up", "sick of"
    ],
    "fatigued": [
        "tired", "exhausted", "drained", "burned out", "burnout",
        "mentally exhausted", "no energy", "sleepy", "fatigued", 
        "worn out", "low energy", "sluggish", "lethargic", "zombie", 
        "dead tired", "running on empty", "can't go on", "mentally drained",
        "physically exhausted", "numb", "hollow", "heavy eyelids",
        "drained emotionally", "empty", "hopeless", "hard to stay motivated"
    ],
    "positive": [
        "happy", "excited", "motivated", "energetic", "great",
        "wonderful", "amazing", "fantastic", "good", "productive",
        "refreshed", "confident", "focused", "calm", "relaxed", "content"
    ]
}


def analyze_sentiment(text: str) -> dict:
    """
    Karthikeya — Emotion Analysis
    NOW WITH: negation handling, sarcasm detection, false positive correction
    """
    vader_scores = sia.polarity_scores(text)
    compound = vader_scores['compound']

    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    # --- Context correction ---
    fp_result = resolve_false_positives(text)
    compound = compound + fp_result["sentiment_adjustment"]
    compound = max(-1.0, min(1.0, compound))  # clamp to -1..1

    # --- Sarcasm detection ---
    sarcasm = detect_sarcasm(text)
    if sarcasm["sarcasm_detected"]:
        # Sarcasm usually means person is NOT okay despite positive words
        # Flip compound toward negative
        compound = compound - (sarcasm["sarcasm_score"] * 0.3)
        compound = max(-1.0, compound)

    # --- Context-aware keyword matching (with negation check) ---
    text_lower = text.lower()
    emotion_counts = {}
    emotion_words_found = {}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        found = []
        for kw in keywords:
            if kw in text_lower:
                # Check if this keyword is negated
                if not detect_negation_context(text, kw):
                    found.append(kw)
                # If negated, skip it — "not stressed" ≠ stressed
        emotion_counts[emotion] = len(found)
        emotion_words_found[emotion] = found

    # Determine dominant emotion
    max_keyword_emotion = max(emotion_counts, key=emotion_counts.get)
    max_keyword_count = emotion_counts[max_keyword_emotion]

    # Rule: Positive emotion only appears if positive words outweigh others
    pos_count = emotion_counts.get("positive", 0)
    other_counts = sum(v for k, v in emotion_counts.items() if k != "positive")
    
    if max_keyword_count >= 2:
        dominant_emotion = max_keyword_emotion
    elif max_keyword_count == 1 and compound < 0:
        dominant_emotion = max_keyword_emotion
    else:
        if compound >= 0.05 and pos_count > other_counts:
            dominant_emotion = "positive"
        elif compound <= -0.5:
            dominant_emotion = "stressed"
        elif compound <= -0.2:
            dominant_emotion = "sad"
        else:
            dominant_emotion = "neutral"

    # Rule: If "felt low", "no energy" etc. are found, classify as Sad/Fatigued
    low_mood_keywords = ["felt low", "no energy", "hard to stay motivated", "negative thoughts", 
                         "tasks felt heavy", "wanted to isolate myself", "empty", "hopeless", "drained emotionally"]
    
    found_low_mood = [kw for kw in low_mood_keywords if kw in text_lower]
    if found_low_mood:
        if emotion_counts.get("fatigued", 0) >= emotion_counts.get("sad", 0):
            dominant_emotion = "fatigued"
        else:
            dominant_emotion = "sad"

    # Override: if sarcasm detected and emotion looks positive, push to stressed
    if sarcasm["sarcasm_detected"] and dominant_emotion == "positive":
        dominant_emotion = "stressed"

    intensity = abs(compound)
    if dominant_emotion == "positive":
        intensity = max(compound, 0)
    elif dominant_emotion == "neutral":
        intensity = 0.2

    # --- Emotion Percentage Distribution (Strict Consistency Rules) ---
    raw_pos = vader_scores['pos']
    raw_neg = vader_scores['neg']
    raw_neu = vader_scores['neu']

    # 1. Rule: Ensure Negative score reflects Stress Intensity (for negative states)
    if compound < -0.05:
        # Avoid showing 0% intensity
        intensity = max(intensity, 0.15)
        
    if dominant_emotion in ["stressed", "sad", "angry", "fatigued"]:
        # Only boost raw_neg if it's currently very low, allowing neutral to co-exist
        raw_neg = max(raw_neg, intensity * 0.7) 
        # No more aggressive neutral capping, allowing for mixed emotions as requested.

    # 2. Rule: If intensity is high, dominant emotion should push out neutral
    if intensity > 0.5:
        if dominant_emotion != "neutral" and dominant_emotion != "positive" and compound < 0:
            raw_neu = min(raw_neu, 0.2)
        elif dominant_emotion == "positive" and compound > 0:
            raw_neu = min(raw_neu, 0.3)

    # Normalize to 100%
    total = raw_pos + raw_neg + raw_neu
    final_pos = round(raw_pos / total, 3)
    final_neg = round(raw_neg / total, 3)
    final_neu = round(raw_neu / total, 3)

    return {
        "compound_score": round(compound, 3),
        "positive": final_pos,
        "negative": final_neg,
        "neutral": final_neu,
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "dominant_emotion": dominant_emotion,
        "emotional_intensity": round(min(abs(intensity), 1.0), 3),
        "emotion_keyword_counts": emotion_counts,
        "emotion_words_found": emotion_words_found,
        "sarcasm_detected": sarcasm["sarcasm_detected"],
        "sarcasm_patterns": sarcasm["sarcasm_patterns_found"],
        "context_corrections": fp_result["corrections"]
    }


# ============================================================
# JAQUEEN — Cognitive Pattern Detection (expanded keyword list)
# ============================================================

# Limitation 8 fix — expanded keyword lists
STRESS_KEYWORDS = [
    "exhausted", "overwhelmed", "stressed", "anxious", "tired",
    "burnt out", "burnout", "can't focus", "can't sleep", "deadline",
    "pressure", "panic", "worried", "hopeless", "giving up",
    "too much", "drained", "no energy", "struggling", "falling behind",
    "losing motivation", "hate this", "can't do this", "breaking down",
    "losing it", "falling apart", "can't cope", "suffocating",
    "drowning", "collapsing", "overworked", "sleep deprived",
    "no time", "running out of time", "behind schedule", "piling up",
    "so much to do", "never ending", "trapped", "stuck", "helpless",
    "desperate", "at my limit", "beyond my limit", "breaking point"
]

NEGATIVE_PATTERNS = [
    "i can't", "i give up", "too much", "no point",
    "what's the point", "nothing works", "i'm failing",
    "i hate", "i'm so tired", "not enough", "never good enough",
    "i'm broken", "i'm done", "don't care anymore",
    "i'm useless", "i'm worthless", "no one cares",
    "i can't handle", "it's impossible", "i'll never",
    "everything is wrong", "nothing is right",
    "i always fail", "i never succeed", "why bother",
    "what's the use", "i can't win", "nothing helps",
    "nobody understands", "i'm invisible", "i'm a burden",
    "i can't keep up", "i'm falling apart", "i'm losing my mind",
    "i don't know how", "i'm not good enough"
]

FATIGUE_KEYWORDS = [
    "exhausted", "drained", "tired", "burned out", "burnout",
    "mentally exhausted", "no energy", "low energy", "fatigue",
    "sluggish", "can't get up", "no motivation", "procrastinating",
    "zoned out", "brain fog", "can't think", "mind blank",
    "mentally drained", "physically exhausted", "running on empty",
    "zombie", "dead inside", "numb", "hollow", "disconnected",
    "checked out", "going through motions", "autopilot",
    "barely functioning", "heavy eyelids", "can't concentrate",
    "losing focus", "spacing out", "mentally checked out",
    "no drive", "no desire", "no interest", "everything is effort"
]

BURNOUT_PHRASES = [
    "burnt out", "burnout", "burned out", "completely done",
    "reached my limit", "hit a wall", "can't go on",
    "need a break", "need to stop", "can't continue",
    "running on fumes", "empty inside", "lost all motivation",
    "don't enjoy anything", "nothing excites me",
    "dreading tomorrow", "dreading today", "can't face",
    "want to disappear", "want to escape", "need to escape",
    "just want to sleep forever", "done with everything",
    "can't do this anymore", "at my breaking point",
    "completely overwhelmed", "totally overwhelmed",
    "i'm finished", "i'm over it", "i'm beyond caring"
]

# Limitation 8 fix — student-specific academic stress keywords
ACADEMIC_STRESS_KEYWORDS = [
    "exam", "exams", "test", "finals", "viva", "midterm", "assignment", "project",
    "deadline", "submission", "due date", "marks", "grades", "gpa", "cgpa",
    "attendance", "presentation", "lab", "practical",
    "semester", "backlog", "arrear", "failed", "failing",
    "professor", "faculty", "college stress", "study stress",
    "all nighter", "all night", "studying all night",
    "no sleep studying", "cramming", "last minute"
]


def detect_stress_keywords(text: str, preprocessed_data: dict = None) -> dict:
    """
    Jaqueen — Cognitive Pattern Detection
    Now with negation awareness and expanded academic keywords
    """
    text_lower = text.lower()

    # Use negation-aware detection for main keywords
    found_stress = []
    for kw in STRESS_KEYWORDS:
        if kw in text_lower and not detect_negation_context(text, kw):
            found_stress.append(kw)

    found_negative = [p for p in NEGATIVE_PATTERNS if p in text_lower]

    found_fatigue = []
    for kw in FATIGUE_KEYWORDS:
        if kw in text_lower and not detect_negation_context(text, kw):
            found_fatigue.append(kw)

    found_burnout = [p for p in BURNOUT_PHRASES if p in text_lower]

    # Academic stress — student specific
    found_academic = []
    for kw in ACADEMIC_STRESS_KEYWORDS:
        if kw in text_lower and not detect_negation_context(text, kw):
            found_academic.append(kw)
    academic_score = min(len(found_academic) / 5.0, 1.0)

    # Initial scores based on keyword counts
    stress_score   = min(len(found_stress)   / 6.0, 1.0)
    negative_score = min(len(found_negative) / 4.0, 1.0)
    fatigue_score  = min(len(found_fatigue)  / 5.0, 1.0)
    burnout_score  = min(len(found_burnout)  / 3.0, 1.0)

    # Context multiplier for academic stress
    if len(found_academic) > 0:
        stress_score += 0.15
        burnout_score += 0.1
        stress_score = min(stress_score, 1.0)
        burnout_score = min(burnout_score, 1.0)

    # --- Cognitive Load Aggregation (Strict Weighting) ---
    cognitive_load = (negative_score * 0.40) + (fatigue_score * 0.30) + (stress_score * 0.30)
    
    # Context Awareness: Boosts
    hinglish_found = []
    if preprocessed_data:
        hinglish_found = preprocessed_data.get("hinglish_found", [])
    else:
        # Fallback to direct check if preprocessed_data not provided
        hinglish_found = [w for w in HINGLISH_STRESS if w in text.lower()]
        
    if len(hinglish_found) > 0:
        stress_score += 0.10
        cognitive_load += 0.10
        
    if len(found_academic) > 0:
        cognitive_load += 0.15
        
    if len(found_fatigue) > 0:
        cognitive_load += 0.10
        
    # Amplify for multiple signals
    if len(found_stress) >= 3:
        cognitive_load += 0.1
    if len(found_fatigue) >= 2:
        cognitive_load += 0.1
    if len(found_burnout) >= 1:
        cognitive_load += 0.15

    cognitive_load = min(round(cognitive_load, 3), 1.0)

    exclamation_count = text.count('!')
    caps_words = len([w for w in text.split() if w.isupper() and len(w) > 2])
    agitation_score = min((exclamation_count + caps_words) / 5.0, 1.0)

    return {
        "stress_keywords_found":    found_stress,
        "negative_patterns_found":  found_negative,
        "fatigue_keywords_found":   found_fatigue,
        "burnout_phrases_found":    found_burnout,
        "academic_stress_found":    found_academic,
        "exam_context":             len(found_academic) > 0,
        "stress_keyword_score":     round(stress_score, 3),
        "negative_pattern_score":   round(negative_score, 3),
        "fatigue_keyword_score":    round(fatigue_score, 3),
        "burnout_phrase_score":     round(burnout_score, 3),
        "academic_stress_score":    round(academic_score, 3),
        "cognitive_load_score":     cognitive_load,
        "agitation_score":          round(agitation_score, 3)
    }


# ============================================================
# FULL PIPELINE
# ============================================================

def full_nlp_analysis(text: str) -> dict:
    preprocessed = preprocess_text(text)
    sentiment    = analyze_sentiment(text)
    keywords     = detect_stress_keywords(text, preprocessed)

    sentiment_says_positive  = sentiment["compound_score"] > 0.2
    keywords_say_negative    = keywords["cognitive_load_score"] > 0.4
    inconsistency_detected   = sentiment_says_positive and keywords_say_negative

    # Also flag inconsistency if sarcasm detected
    if sentiment["sarcasm_detected"]:
        inconsistency_detected = True

    return {
        "preprocessed":          preprocessed,
        "sentiment":             sentiment,
        "keyword_analysis":      keywords,
        "inconsistency_detected": inconsistency_detected
    }