from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from typing import Optional
import json, os
from datetime import datetime

from app.services.nlp_engine import full_nlp_analysis
from app.services.ml_predictor import compute_burnout_score
from app.services.recommender import generate_recommendations, generate_recovery_plan

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "../data_store.json")


class AnalysisRequest(BaseModel):
    journal_text: str
    sleep_hours: float
    work_hours: float
    break_time: float
    mood_score: float
    has_deadline: bool = False
    energy_level: float = 0.5
    social_interaction: float = 0.5
    physical_exercise: float = 0.5
    caffeine_intake: float = 0.5
    study_continuity: float = 0.5
    yesterday_mood: Optional[float] = None


def load_data():
    """Load entries from user-isolated data store"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r") as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        return {}
    except:
        return {}


def save_data(data):
    """Save user-isolated data store"""
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_user_history(user_id: str) -> list:
    """Get history for a specific user"""
    data = load_data()
    return data.get(user_id, [])


def save_user_history(user_id: str, entries: list):
    """Update history for a specific user"""
    data = load_data()
    data[user_id] = entries[-100:] # Keep last 100 entries per user
    save_data(data)


@router.options("/analyze")
async def options_analyze():
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })


@router.post("/analyze")
async def analyze_burnout(req: AnalysisRequest, user_id: str = "guest"):
    try:
        # Step 1: NLP
        nlp_result = full_nlp_analysis(req.journal_text)

        # Step 2: Load history for this user
        history_entries = get_user_history(user_id)

        # Calculate mood trend (yesterday to today)
        previous_mood_delta = 0.0
        if req.yesterday_mood is not None:
            previous_mood_delta = (req.mood_score - req.yesterday_mood) / 10.0  # normalize to -1 to 1
        elif history_entries:
            # If yesterday_mood not provided, use last entry's mood
            last_mood = history_entries[-1].get("mood_score", req.mood_score)
            previous_mood_delta = (req.mood_score - last_mood) / 10.0

        behavioral = {
            "sleep_hours": req.sleep_hours,
            "work_hours":  req.work_hours,
            "break_time":  req.break_time,
            "mood_score":  req.mood_score,
            "has_deadline": req.has_deadline,
            "journal_text": req.journal_text,
            "yesterday_mood": req.yesterday_mood
        }

        # Step 3: ML Prediction
        prediction = compute_burnout_score(
            nlp_result=nlp_result,
            sleep_hours=req.sleep_hours,
            work_hours=req.work_hours,
            break_time=req.break_time,
            mood_score=req.mood_score,
            has_deadline=req.has_deadline,
            history=history_entries,
            energy_level=req.energy_level,
            social_interaction=req.social_interaction,
            physical_exercise=req.physical_exercise,
            caffeine_intake=req.caffeine_intake,
            study_continuity=req.study_continuity,
            previous_mood_delta=previous_mood_delta
        )

        # Step 4: Recommendations (journal-aware)
        recommendations = generate_recommendations(prediction, behavioral, nlp_result)

        # Step 5: Recovery Plan (journal-aware)
        recovery_plan = generate_recovery_plan(prediction, behavioral, nlp_result)

        # Step 6: Warning
        warning = None
        if prediction.get("critical_warning"):
            warning = {
                "active": True,
                "message": prediction["critical_warning"],
                "severity": "critical"
            }
        elif nlp_result["sentiment"]["dominant_emotion"] == "sad":
            warning = {
                "active": True,
                "message": "Low mood detected. Prioritize gentle recovery today.",
                "severity": "warning"
            }
        elif prediction["burnout_score"] > 0.70:
            warning = {
                "active": True,
                "message": "⚠️ You are entering a high fatigue pattern. Take preventive rest immediately.",
                "severity": "critical"
            }
        elif prediction["burnout_score"] > 0.50:
            warning = {
                "active": True,
                "message": "You're showing early burnout signals. Reduce workload and rest more.",
                "severity": "warning"
            }

        # Step 7: Save with mood trend
        # --- Cognitive Load Refinement ---
        cognitive_load = nlp_result["keyword_analysis"]["cognitive_load_score"]
        
        # Amplify if sleep is low
        if req.sleep_hours < 6:
            cognitive_load += 0.15
        elif req.sleep_hours < 4:
            cognitive_load += 0.25
            
        cognitive_load = min(round(cognitive_load, 3), 1.0)

        entry = {
            "user_id":       user_id,
            "timestamp":     datetime.now().isoformat(),
            "burnout_score": prediction["burnout_score"],
            "risk_level":    prediction["risk_level"],
            "mood_score":    req.mood_score,
            "mood_delta":    round(previous_mood_delta, 2),
            "sleep_hours":   req.sleep_hours,
            "work_hours":    req.work_hours,
            "emotion":       nlp_result["sentiment"]["dominant_emotion"],
            "cognitive_load": cognitive_load,
            "keywords": {
                "positive": nlp_result["sentiment"]["emotion_words_found"].get("positive", [])[:5],
                "negative": nlp_result["keyword_analysis"].get("stress_keywords_found", [])[:5]
            },
            "journal_preview": req.journal_text[:80] + "..." if len(req.journal_text) > 80 else req.journal_text
        }

        history_entries.append(entry)
        save_user_history(user_id, history_entries)

        return {
            "burnout_score": prediction["burnout_score"],
            "burnout_level": prediction["risk_level"],
            "primary_emotion": nlp_result["sentiment"]["dominant_emotion"],
            "emotion_distribution": {
                "positive": nlp_result["sentiment"]["positive"],
                "negative": nlp_result["sentiment"]["negative"],
                "neutral": nlp_result["sentiment"]["neutral"]
            },
            "cognitive_load_score": cognitive_load,
            "fatigue_indicators": nlp_result["keyword_analysis"].get("fatigue_keywords_found", []),
            "patterns": nlp_result["keyword_analysis"].get("negative_patterns_found", []),
            "score_breakdown": prediction["score_breakdown"],
            "reasoning": prediction["reasoning"],
            "nlp_analysis": nlp_result, # Keep for debugging
            "recommendations": recommendations,
            "recovery_plan": recovery_plan,
            "warning": warning,
            "inconsistency_alert": prediction.get("inconsistency_alert")
        }

    except Exception as e:
        import traceback
        print("ERROR:", traceback.format_exc())
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(user_id: str = "guest"):
    entries = get_user_history(user_id)
    return {"entries": entries}


@router.delete("/history")
async def clear_history(user_id: str = "guest"):
    save_user_history(user_id, [])
    return {"message": "History cleared"}