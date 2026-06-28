"""
ml_predictor.py
Burnout Prediction Engine — Random Forest Classifier

DATASET APPROACH:
- Uses a hybrid synthetic dataset designed from mental health research patterns
- Inspired by: Mental Health Text Classification + Sentiment Analysis for Mental Health datasets
- Dataset is generated ONCE and saved as burnout_model.pkl
- On every subsequent server start, model loads from pkl instantly (no retraining)
- To retrain: delete burnout_model.pkl from app/services/

DATASET DESIGN BASIS:
- Class distribution: Low 25% | Moderate 45% | High 30% (realistic imbalance)
- Features mimic patterns found in validated burnout research (Maslach Burnout Inventory)
- Student-specific context: academic stress, exam pressure, sleep deprivation patterns
- Intentional feature contradictions: burnt-out students can have "okay" days in some metrics
"""

import numpy as np
import os
import pickle

from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), "burnout_model.pkl")


# ─────────────────────────────────────────────
# FEATURE NAMES (must match extract_features order)
# ─────────────────────────────────────────────
FEATURE_NAMES = [
    "sentiment_burnout",
    "sleep_deficit",
    "overwork_score",
    "break_deficit",
    "mood_burnout",
    "keyword_stress",
    "deadline",
    "cognitive_load",
    "emotional_intensity",
    "energy_level",
    "social_interaction",
    "physical_exercise",
    "caffeine_intake",
    "study_continuity",
    "previous_mood_delta",
]

 
def _make_sample(label: str) -> list:
    """
    Generate one realistic student data sample with 15 features.
    label: 'Low' | 'Moderate' | 'High'

    Distributions use Beta distribution for realistic skew.
    30% of samples have one "contradiction" feature (mimics real world inconsistency).
    Gaussian noise added to every feature.
    
    NEW FEATURES:
    - energy_level: 0-1 (1 = high energy)
    - social_interaction: 0-1 (1 = good social engagement)
    - physical_exercise: 0-1 (1 = regular exercise)
    - caffeine_intake: 0-1 (1 = high caffeine, stressful)
    - study_continuity: 0-1 (1 = long study sessions without breaks)
    - previous_mood_delta: -1 to 1 (change from previous day)
    """
    rng = np.random

    if label == "High":
        # Mostly bad indicators
        sentiment_burnout   = rng.beta(7, 2)
        sleep_deficit       = rng.beta(6, 2)
        overwork_score      = rng.beta(7, 2.5)
        break_deficit       = rng.beta(6, 3)
        mood_burnout        = rng.beta(7, 2)
        keyword_stress      = rng.beta(6, 2.5)
        deadline            = float(rng.choice([0, 1], p=[0.15, 0.85]))
        cognitive_load      = rng.beta(7, 2)
        emotional_intensity = rng.beta(6, 2)
        # NEW: burnt out students have low energy, poor social engagement, no exercise, high caffeine
        energy_level        = rng.beta(2, 6)       # low energy
        social_interaction  = rng.beta(2, 6)       # withdrawn
        physical_exercise   = rng.beta(2, 7)       # sedentary
        caffeine_intake     = rng.beta(7, 2)       # high caffeine (stress coping)
        study_continuity    = rng.beta(7, 2)       # long sessions without breaks
        previous_mood_delta = rng.normal(-0.3, 0.2) # mood worsening

        if rng.random() < 0.30:
            idx = rng.randint(0, 13)
            contradiction = rng.beta(2, 6)
            sample = [sentiment_burnout, sleep_deficit, overwork_score, break_deficit,
                      mood_burnout, keyword_stress, deadline, cognitive_load, emotional_intensity,
                      energy_level, social_interaction, physical_exercise, caffeine_intake,
                      study_continuity, previous_mood_delta]
            if idx < len(sample) and idx not in [6]:
                sample[idx] = contradiction
            return sample

    elif label == "Moderate":
        # Mid-range, high variance
        sentiment_burnout   = rng.beta(4, 4)
        sleep_deficit       = rng.beta(3.5, 4)
        overwork_score      = rng.beta(3.5, 3.5)
        break_deficit       = rng.beta(3, 4)
        mood_burnout        = rng.beta(4, 4)
        keyword_stress      = rng.beta(3.5, 4)
        deadline            = float(rng.choice([0, 1], p=[0.45, 0.55]))
        cognitive_load      = rng.beta(4, 4)
        emotional_intensity = rng.beta(3.5, 4)
        energy_level        = rng.beta(4, 4)
        social_interaction  = rng.beta(3.5, 4)
        physical_exercise   = rng.beta(3, 4)
        caffeine_intake     = rng.beta(3.5, 4)
        study_continuity    = rng.beta(3.5, 3.5)
        previous_mood_delta = rng.normal(0, 0.25)

        if rng.random() < 0.40:
            idx = rng.randint(0, 13)
            sample = [sentiment_burnout, sleep_deficit, overwork_score, break_deficit,
                      mood_burnout, keyword_stress, deadline, cognitive_load, emotional_intensity,
                      energy_level, social_interaction, physical_exercise, caffeine_intake,
                      study_continuity, previous_mood_delta]
            if idx not in [6]:
                sample[idx] = rng.beta(7, 2) if rng.random() < 0.5 else rng.beta(2, 7)
            return sample

    else:  # Low
        # Mostly healthy indicators
        sentiment_burnout   = rng.beta(2, 7)
        sleep_deficit       = rng.beta(2, 7)
        overwork_score      = rng.beta(2, 6)
        break_deficit       = rng.beta(2, 7)
        mood_burnout        = rng.beta(2, 7)
        keyword_stress      = rng.beta(2, 7)
        deadline            = float(rng.choice([0, 1], p=[0.75, 0.25]))
        cognitive_load      = rng.beta(2, 7)
        emotional_intensity = rng.beta(2, 6)
        # NEW: healthy students have good energy, social, exercise, low caffeine
        energy_level        = rng.beta(7, 2)       # high energy
        social_interaction  = rng.beta(7, 2)       # socially engaged
        physical_exercise   = rng.beta(6, 2)       # active
        caffeine_intake     = rng.beta(2, 6)       # moderate/low caffeine
        study_continuity    = rng.beta(2, 7)       # good break habits
        previous_mood_delta = rng.normal(0.2, 0.25) # mood improving

        if rng.random() < 0.25:
            idx = rng.randint(0, 13)
            sample = [sentiment_burnout, sleep_deficit, overwork_score, break_deficit,
                      mood_burnout, keyword_stress, deadline, cognitive_load, emotional_intensity,
                      energy_level, social_interaction, physical_exercise, caffeine_intake,
                      study_continuity, previous_mood_delta]
            if idx not in [6]:
                sample[idx] = rng.beta(6, 2)
            return sample

    # Add Gaussian noise to continuous features
    sample = [sentiment_burnout, sleep_deficit, overwork_score, break_deficit,
              mood_burnout, keyword_stress, deadline, cognitive_load, emotional_intensity,
              energy_level, social_interaction, physical_exercise, caffeine_intake,
              study_continuity, previous_mood_delta]

    for i in range(len(sample)):
        if i != 6:  # don't add noise to binary deadline
            sample[i] += rng.normal(0, 0.04)
            sample[i] = float(np.clip(sample[i], -1.0, 1.0) if i == 14 else np.clip(sample[i], 0.0, 1.0))

    return sample


def generate_student_dataset(n: int = 2500):
    """
    Generate a student burnout dataset.
    n = total samples
    Distribution: Low 25% | Moderate 45% | High 30%
    """
    print("Generating student burnout dataset...")

    n_low      = int(n * 0.25)   # 625
    n_moderate = int(n * 0.45)   # 1125
    n_high     = int(n * 0.30)   # 750

    X, y = [], []

    for _ in range(n_low):
        X.append(_make_sample("Low"))
        y.append(0)

    for _ in range(n_moderate):
        X.append(_make_sample("Moderate"))
        y.append(1)

    for _ in range(n_high):
        X.append(_make_sample("High"))
        y.append(2)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    print(f"  Low:      {n_low} samples ({int(n_low/n*100)}%)")
    print(f"  Moderate: {n_moderate} samples ({int(n_moderate/n*100)}%)")
    print(f"  High:     {n_high} samples ({int(n_high/n*100)}%)")

    return X, y


# ─────────────────────────────────────────────
# MODEL TRAINING
# ─────────────────────────────────────────────
def train_model():
    """
    Train a Decision Tree model on synthetic dataset.
    Uses StratifiedKFold cross-validation for honest accuracy reporting.
    Saves trained model + scaler to pkl.
    """
    X, y = generate_student_dataset(n=2500)

    # 80/20 stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # Decision Tree Classifier - Simple and interpretable
    model = DecisionTreeClassifier(
        max_depth=8,
        min_samples_leaf=10,
        min_samples_split=15,
        random_state=42,
    )

    print("Training burnout prediction model (Decision Tree)...")
    model.fit(X_train_scaled, y_train)

    # Test accuracy
    y_pred = model.predict(X_test_scaled)
    test_acc = accuracy_score(y_test, y_pred)
    print(f"\n✓ Test Accuracy: {test_acc * 100:.2f}%")

    # 5-Fold cross-validation accuracy
    X_all_scaled = scaler.fit_transform(X)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_all_scaled, y, cv=cv, scoring="accuracy")
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()
    print(f"✓ 5-Fold CV Accuracy: {cv_mean * 100:.2f}% ± {cv_std * 100:.2f}%")

    # Feature importances
    importances = model.feature_importances_
    print("\n📊 Top 5 Most Important Features:")
    top_features = sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])[:5]
    for idx, (name, imp) in enumerate(top_features, 1):
        print(f"  {idx}. {name}: {imp * 100:.1f}%")

    # Save model + scaler
    payload = {"model": model, "scaler": scaler}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(payload, f)
    print(f"\n✓ Model saved to {MODEL_PATH}")

    return payload


def load_model():
    """
    Load model from pkl if it exists, otherwise train a new one.
    Training only happens ONCE — on first server start.
    All subsequent starts load from pkl instantly.
    """
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                payload = pickle.load(f)
            print("Burnout model loaded from cache (burnout_model.pkl)")
            return payload
        except Exception as e:
            print(f"Failed to load pkl ({e}), retraining...")
            os.remove(MODEL_PATH)

    return train_model()


# ─────────────────────────────────────────────
# LOAD MODEL ON MODULE IMPORT
# ─────────────────────────────────────────────
_payload = load_model()
_model  = _payload["model"]
_scaler = _payload["scaler"]


# ─────────────────────────────────────────────
# FEATURE EXTRACTION
# ─────────────────────────────────────────────
def extract_features(
    nlp_result: dict,
    sleep_hours: float,
    work_hours: float,
    break_time: float,
    mood_score: float,
    has_deadline: bool,
    energy_level: float = 0.5,
    social_interaction: float = 0.5,
    physical_exercise: float = 0.5,
    caffeine_intake: float = 0.5,
    study_continuity: float = 0.5,
    previous_mood_delta: float = 0.0,
) -> np.ndarray:
    """Convert NLP + behavioral inputs into the 15-feature vector."""

    sentiment = nlp_result["sentiment"]
    keywords  = nlp_result.get("keyword_analysis", {})

    # Original 9 features
    sentiment_burnout = (1 - (sentiment["compound_score"] + 1) / 2)
    sleep_deficit = float(np.clip((8 - sleep_hours) / 8, 0.0, 1.0))
    overwork_score = float(np.clip(work_hours / 14.0, 0.0, 1.0))
    break_deficit = float(np.clip((60 - break_time) / 60, 0.0, 1.0))
    mood_burnout = float((10 - mood_score) / 9)
    
    kw_stress   = keywords.get("stress_keyword_score", 0)
    kw_fatigue  = keywords.get("fatigue_keyword_score", 0)
    kw_negative = keywords.get("negative_pattern_score", 0)
    kw_burnout  = keywords.get("burnout_phrase_score", 0)
    keyword_stress = float(
        kw_stress * 0.30 + kw_fatigue * 0.25 + kw_negative * 0.25 + kw_burnout * 0.20
    )

    deadline = 1.0 if has_deadline else 0.0
    cognitive_load = float(nlp_result.get("cognitive_load", keyword_stress))
    emotional_intensity = float(sentiment.get("emotional_intensity", abs(sentiment["compound_score"])))

    # New 6 features (normalized to 0-1 range)
    energy_norm = float(np.clip(energy_level, 0.0, 1.0))
    social_norm = float(np.clip(social_interaction, 0.0, 1.0))
    exercise_norm = float(np.clip(physical_exercise, 0.0, 1.0))
    caffeine_norm = float(np.clip(caffeine_intake, 0.0, 1.0))
    continuity_norm = float(np.clip(study_continuity, 0.0, 1.0))
    mood_delta_norm = float(np.clip((previous_mood_delta + 1.0) / 2.0, 0.0, 1.0))  # convert -1 to 1 range to 0 to 1

    features = np.array([[
        sentiment_burnout, sleep_deficit, overwork_score, break_deficit,
        mood_burnout, keyword_stress, deadline, cognitive_load, emotional_intensity,
        energy_norm, social_norm, exercise_norm, caffeine_norm, continuity_norm, mood_delta_norm,
    ]], dtype=np.float32)

    return features


# ─────────────────────────────────────────────
# MAIN PREDICTION FUNCTION
# ─────────────────────────────────────────────
def compute_burnout_score(
    nlp_result: dict,
    sleep_hours: float,
    work_hours: float,
    break_time: float,
    mood_score: float,
    has_deadline: bool,
    history: list = None,
    energy_level: float = 0.5,
    social_interaction: float = 0.5,
    physical_exercise: float = 0.5,
    caffeine_intake: float = 0.5,
    study_continuity: float = 0.5,
    previous_mood_delta: float = 0.0,
) -> dict:
    """
    Predict burnout score using trained decision tree model.
    Returns score 0–1, risk level, XAI reasons, confidence, and baseline note.
    """
    sentiment = nlp_result["sentiment"]
    keywords  = nlp_result.get("keyword_analysis", {})

    # Clamp input sliders to valid 1-10 or 0-X range
    mood_score = max(1, min(mood_score, 10))
    sleep_hours = max(0, min(sleep_hours, 24))
    work_hours = max(0, min(work_hours, 24))
    
    # Behavioral Inconsistency Check (e.g. sleep + work > 20h)
    total_active_hours = sleep_hours + work_hours
    inconsistency_alert = total_active_hours > 20

    features = extract_features(
        nlp_result, sleep_hours, work_hours, break_time, mood_score, has_deadline,
        energy_level, social_interaction, physical_exercise, caffeine_intake,
        study_continuity, previous_mood_delta
    )

    features_scaled = _scaler.transform(features)

    # Predict class probabilities
    proba  = _model.predict_proba(features_scaled)[0]  # [P(Low), P(Moderate), P(High)]
    pred_class = int(np.argmax(proba))

    # Initial continuous score from model
    ml_burnout_score = float(proba[0] * 0.15 + proba[1] * 0.50 + proba[2] * 0.85)

    # --- HEURISTIC BLENDED SCORE ---
    # weighted combination of 8 key factors
    sleep_deficit       = (8 - min(sleep_hours, 8)) / 8
    work_overload      = min(work_hours / 14.0, 1.0)
    break_deficit      = max(0, (60 - break_time) / 60) if work_hours > 0 else 0.0
    mood_deficit       = (10 - mood_score) / 9
    sentiment_deficit  = max(0, 1 - (sentiment["compound_score"] + 1) / 2)
    stress_keywords    = keywords.get("stress_keyword_score", 0)
    cognitive_overload = keywords.get("cognitive_load_score", 0)
    deadline_pressure  = 1.0 if has_deadline else 0.0

    heuristic_score = (
        (sleep_deficit       * 0.15) +
        (work_overload      * 0.15) +
        (break_deficit      * 0.10) +
        (mood_deficit       * 0.15) +
        (sentiment_deficit  * 0.15) +
        (stress_keywords    * 0.15) +
        (deadline_pressure  * 0.05) +
        (cognitive_overload * 0.10)
    )

    # Blend tree and heuristic (40/60) to stay grounded
    burnout_score = (ml_burnout_score * 0.4) + (heuristic_score * 0.6)

    # --- LOW MOOD BOOSTS ---
    # Rule: If mood slider <= 3, add +18 score automatically
    if mood_score <= 3:
        burnout_score += 0.18

    # Rule: Keyword count based boost (12-20 points)
    low_mood_keywords = ["felt low", "no energy", "hard to stay motivated", "negative thoughts", 
                         "tasks felt heavy", "wanted to isolate myself", "empty", "hopeless", "drained emotionally"]
    journal_text_lower = nlp_result["preprocessed"]["cleaned"].lower()
    low_mood_found_count = sum(1 for kw in low_mood_keywords if kw in journal_text_lower)
    
    if low_mood_found_count > 0:
        # 12 pts for first, 2 pts each additional, cap at 20
        keyword_boost = 0.12 + (max(0, low_mood_found_count - 1) * 0.02)
        burnout_score += min(keyword_boost, 0.20)

    # --- EMOTION OVERRIDES ---
    # Rule: If mood <= 2, emotion cannot be Positive
    if mood_score <= 2 and nlp_result["sentiment"]["dominant_emotion"] == "positive":
        nlp_result["sentiment"]["dominant_emotion"] = "sad" # Fallback to sad if mood is critical

    # --- LOW WORKLOAD SADNESS CAP ---
    is_low_workload = (
        sleep_hours >= 7 and
        work_hours <= 4 and
        break_time >= 45 and
        not has_deadline
    )
    
    is_sad = nlp_result["sentiment"]["dominant_emotion"] in ["sad", "fatigued"]
    
    if is_low_workload and is_sad:
        # Severe crisis keywords check (expanded)
        crisis_keywords = ["burnout", "can't go on", "hopeless", "giving up", "helpless", "suicidal", "pointless"]
        has_crisis = any(kw in journal_text_lower for kw in crisis_keywords) or \
                     len(nlp_result["keyword_analysis"].get("burnout_phrases_found", [])) > 0
        
        if not has_crisis:
            # Rule: burnout score cannot exceed 50 unless severe crisis keywords exist
            burnout_score = min(burnout_score, 0.50)
            
        # Rule: If burnout_score > 55 and workload == low: recalculate downward
        if burnout_score > 0.55 and not has_crisis:
            burnout_score = burnout_score * 0.85 # 15% reduction for low workload context
            burnout_score = max(burnout_score, 0.45) # Keep in mild-moderate range

    # --- POSITIVE ENTRY OVERRIDE ---
    is_positive_entry = (
        mood_score >= 8 and
        sleep_hours >= 7 and
        break_time >= 30 and
        not keywords.get("stress_keywords_found") and
        sentiment["compound_score"] > 0.2
    )

    if is_positive_entry:
        burnout_score = min(burnout_score, 0.20)
        keywords["cognitive_load_score"] = min(keywords.get("cognitive_load_score", 0), 0.10)
        
    burnout_score = round(float(np.clip(burnout_score, 0.0, 1.0)), 3)
    confidence    = round(float(np.max(proba) * 100), 1)

    # --- SHORT INPUT HANDLING ---
    word_count = nlp_result["preprocessed"].get("word_count", 0)
    is_short_input = word_count < 5 and word_count > 0
    
    # --- CRITICAL HEALTH ALERT (Extreme vs Reality) ---
    is_critical_sleep = sleep_hours < 3
    is_severe_burnout = burnout_score > 0.85
    
    critical_warning = None
    if is_critical_sleep:
        critical_warning = "Critical sleep deprivation detected. Physical health is at risk."
    elif is_severe_burnout and mood_score <= 2:
        critical_warning = "Severe burnout indicators detected. Professional support is recommended."

    # 5-Tier Risk Level mapping
    score_pct = burnout_score * 100
    if score_pct <= 30:
        risk_level = "Low Risk"
        risk_color = "#22c55e" # Green
    elif score_pct <= 50:
        risk_level = "Mild Stress"
        risk_color = "#84cc16" # Yellow-Green
    elif score_pct <= 70:
        risk_level = "Moderate Risk"
        risk_color = "#f59e0b" # Orange
    elif score_pct <= 85:
        risk_level = "High Risk"
        risk_color = "#ef4444" # Red
    else:
        risk_level = "Severe Burnout Warning"
        risk_color = "#991b1b" # Dark Red

    # ─── STRUCTURED REASONING ───
    reasoning = {
        "behavioral": [],
        "emotional": [],
        "cognitive": [],
        "context": []
    }

    sleep_deficit = (8 - sleep_hours) / 8

    if sleep_deficit > 0.25:
        reasoning["behavioral"].append(f"Low sleep time ({sleep_hours}h)")
    if work_hours > 10:
        reasoning["behavioral"].append(f"Long study/work hours ({work_hours}h)")
    if break_time < 20:
        reasoning["behavioral"].append(f"Low break time ({break_time} min)")

    if sentiment["compound_score"] < -0.3:
        reasoning["emotional"].append("Worried or negative tone detected")
    if nlp_result.get("sarcasm_detected"):
        reasoning["emotional"].append("Potential masking of true feelings")
    if nlp_result.get("agitation_score", 0) > 0.4:
        reasoning["emotional"].append("Agitation present in writing")

    if keywords.get("stress_keywords_found"):
        reasoning["cognitive"].append("Stress or pressure patterns")
    if keywords.get("fatigue_keywords_found"):
        reasoning["cognitive"].append("Mental exhaustion signals")
    if keywords.get("negative_patterns_found"):
        reasoning["cognitive"].append("Negative self-talk cycles")
    if keywords.get("burnout_phrases_found"):
        reasoning["cognitive"].append("Overload patterns")

    if has_deadline:
        reasoning["context"].append("Upcoming exams or deadlines contributing pressure")
    if is_low_workload and is_sad:
        reasoning["context"].append("Low mood detected, but workload and sleep are stable")
    elif inconsistency_alert:
        reasoning["context"].append("Behavioral data pattern seems irregular (High sleep + High work)")
    elif is_short_input:
        reasoning["context"].append("Journal entry is too brief for deep emotional analysis")
    elif nlp_result.get("inconsistency_detected"):
        reasoning["context"].append("Mixed emotional signals")

    # Final reasons list for backward compatibility or simple display
    reasons = [r for cat in reasoning.values() for r in cat]
    if not reasons:
        reasons.append("No significant burnout indicators detected")
        if nlp_result["sentiment"]["dominant_emotion"] == "sad":
            reasoning["summary"] = "Low mood detected despite stable daily metrics."
        else:
            reasoning["summary"] = "Overall mental wellbeing is stable."
    else:
        # Create a human readable summary
        summary_parts = []
        if reasoning["emotional"]:
            summary_parts.append("emotional strain")
        if reasoning["cognitive"] or reasoning["context"]:
            if has_deadline:
                summary_parts.append("exam pressure")
            else:
                summary_parts.append("mental overload")
        if reasoning["behavioral"]:
            if sleep_deficit > 0.25:
                summary_parts.append("fatigue/poor sleep")
            else:
                summary_parts.append("overwork")
        
        if len(summary_parts) > 1:
            reasoning["summary"] = f"Detected {', '.join(summary_parts[:-1])} and {summary_parts[-1]}."
        elif len(summary_parts) == 1:
            reasoning["summary"] = f"Detected {summary_parts[0]}."
        else:
            reasoning["summary"] = "Minor stressors detected but managing well."

    # ─── PERSONAL BASELINE COMPARISON ───
    baseline_note = None
    if history and len(history) >= 5:
        recent_scores = [e["burnout_score"] for e in history[-5:]]
        avg_recent    = round(sum(recent_scores) / len(recent_scores), 3)
        diff          = burnout_score - avg_recent

        if diff > 0.12:
            baseline_note = f"This is significantly worse than your recent average ({int(avg_recent*100)}%)"
        elif diff < -0.12:
            baseline_note = f"Great improvement! This is better than your recent average ({int(avg_recent*100)}%)"
        else:
            baseline_note = f"Similar to your recent average ({int(avg_recent*100)}%)"

    # ─── INCONSISTENCY DETECTION ───
    inconsistency = None
    if (sentiment["compound_score"] > 0.1 and
            (keywords.get("burnout_phrase_score", 0) > 0.3 or
             keywords.get("stress_keyword_score", 0) > 0.4)):
        inconsistency = "Your writing tone seems positive, but stress/burnout keywords were detected. You may be masking stress."

    behavioral_score = ((8 - min(sleep_hours, 8)) / 8 * 0.5) + (work_hours / 14.0 * 0.5)
    if work_hours <= 7 and break_time >= 20:
        behavioral_score = max(0.0, behavioral_score - 0.20)

    return {
        "burnout_score": burnout_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "confidence": confidence,
        "reasons": reasons,
        "reasoning": reasoning,
        "critical_warning": critical_warning,
        "is_short_input": is_short_input,
        "baseline_note": baseline_note,
        "inconsistency_alert": inconsistency,
        "model_name": "MindGuard ML Engine",
        "class_probabilities": {
            "Low": float(proba[0]),
            "Moderate": float(proba[1]),
            "High": float(proba[2])
        },
        "score_breakdown": {
            "sentiment": round(float(max(0.0, min(1.0, 1 - (sentiment["compound_score"] + 1) / 2))), 3),
            "cognitive": round(float(max(0.0, min(1.0, keywords.get("cognitive_load_score", 0)))), 3),
            "behavioral": round(float(max(0.0, min(1.0, behavioral_score))), 3),
            "context": round(float(1.0 if has_deadline else 0.0), 3)
        },
    }