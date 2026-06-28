import asyncio
from app.services.nlp_engine import full_nlp_analysis
from app.services.ml_predictor import compute_burnout_score
from app.services.recommender import generate_recommendations, generate_recovery_plan

def test_pipeline():
    journal_text = "I am so exhausted and stressed out. I can't sleep and my exams are coming up. I feel burnt out."
    
    try:
        nlp_result = full_nlp_analysis(journal_text)
        print("NLP Result Keys:", nlp_result.keys())
        
        prediction = compute_burnout_score(
            nlp_result=nlp_result,
            sleep_hours=4.0,
            work_hours=12.0,
            break_time=10.0,
            mood_score=2.0,
            has_deadline=True,
            energy_level=0.2,
            social_interaction=0.1,
            physical_exercise=0.0,
            caffeine_intake=0.9,
            study_continuity=0.9,
            previous_mood_delta=-0.2
        )
        print("Prediction Keys:", prediction.keys())
        
        behavioral = {
            "sleep_hours": 4.0,
            "work_hours":  12.0,
            "break_time":  10.0,
            "mood_score":  2.0,
            "has_deadline": True,
            "journal_text": journal_text,
            "yesterday_mood": 4.0
        }
        
        recs = generate_recommendations(prediction, behavioral, nlp_result)
        print("Recs Keys:", recs.keys())
        
        plan = generate_recovery_plan(prediction, behavioral, nlp_result)
        print("Plan OK")
        
        print("ALL OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pipeline()
