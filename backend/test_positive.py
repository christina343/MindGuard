import asyncio
from app.services.nlp_engine import full_nlp_analysis
from app.services.ml_predictor import compute_burnout_score

def test_positive_entry():
    journal_text = "I feel amazing today! I had a great sleep and am highly motivated to work on my projects."
    
    try:
        nlp_result = full_nlp_analysis(journal_text)
        print("Emotion:", nlp_result["sentiment"]["dominant_emotion"])
        print("NLP Cognitive:", nlp_result["keyword_analysis"].get("cognitive_load_score", 0))
        
        prediction = compute_burnout_score(
            nlp_result=nlp_result,
            sleep_hours=8.0,
            work_hours=5.0,
            break_time=45.0,
            mood_score=9.0,
            has_deadline=False,
            energy_level=0.9,
            social_interaction=0.8,
            physical_exercise=0.8,
            caffeine_intake=0.1,
            study_continuity=0.5,
            previous_mood_delta=0.1
        )
        
        print("Burnout Score:", prediction["burnout_score"])
        print("Cognitive Load in Prediction:", prediction["score_breakdown"]["cognitive"])
        print("Behavioral Breakdown:", prediction["score_breakdown"]["behavioral"])
        print("Summary:", prediction["reasoning"].get("summary"))
        print("ALL OK")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_positive_entry()
