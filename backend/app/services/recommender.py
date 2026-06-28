"""
recommender.py
--------------
Limitation 5 fix: Recovery plan is now dynamic.
Instead of 3 fixed plans, the plan tasks adapt based on:
- Your specific detected keywords
- Your dominant emotion
- Your exact behavioral inputs
- Academic stress indicators
"""


def generate_recommendations(burnout_result: dict, behavioral: dict, nlp_result: dict = None) -> dict:
    score    = burnout_result["burnout_score"]
    risk     = burnout_result["risk_level"]
    sleep    = behavioral.get("sleep_hours", 7)
    work     = behavioral.get("work_hours", 8)
    breaks   = behavioral.get("break_time", 30)
    has_exam_toggle = behavioral.get("has_deadline", False)

    dominant_emotion  = "neutral"
    academic_stress   = []
    exam_context      = False

    if nlp_result:
        dominant_emotion = nlp_result.get("sentiment", {}).get("dominant_emotion", "neutral")
        kw_analysis = nlp_result.get("keyword_analysis", {})
        academic_stress = kw_analysis.get("academic_stress_found", [])
        # Rule: academic_context = true only when toggle ON or keywords found (and not negated)
        exam_context = has_exam_toggle or kw_analysis.get("exam_context", False)

    recommendations = []
    primary_issue   = "General Stress"

    # Archetype detection
    is_sleep_issue = sleep < 6
    is_exam_stress = exam_context and (len(academic_stress) >= 1)
    is_overload = work > 10 or score > 0.75
    is_anxiety = dominant_emotion == "stressed" or "anxious" in str(nlp_result)

    # --- SLEEP ISSUE ---
    if is_sleep_issue:
        primary_issue = "Sleep Recovery"
        recommendations += [
            f"Prioritize 8 hours of sleep tonight — set alarm for 10 PM",
            "Stop using screens 45 minutes before bed",
            "Try 5 minutes of 4-7-8 breathing before sleep",
            "Avoid caffeine after 2 PM to protect sleep quality",
            "Prepare your sleeping environment: dark and cool"
        ]

    # --- EXAM STRESS (ONLY IF CONTEXT IS TRUE) ---
    elif is_exam_stress:
        primary_issue = "Exam Management"
        recommendations += [
            "Use 25-min Pomodoro blocks with mandatory 5-min breaks",
            "Active Recall: spend 15 mins writing everything you remember",
            "No new material after 8 PM — focus on light review",
            "Identify 3 high-impact topics to focus on tomorrow",
            "Walk outdoors for 15 minutes between study sessions"
        ]

    # --- OVERLOAD ---
    elif is_overload:
        primary_issue = "Workload Reduction"
        recommendations += [
            "Reduce tomorrow's priority list to only 3 essential tasks",
            "Schedule a mandatory 15-minute walk at 2 PM",
            "Take a strict 10-minute break every 90 minutes",
            "Set a hard stop time for all activity tonight",
            "Delegate or postpone one non-urgent task"
        ]

    # --- EMOTIONAL / WELLNESS (REPLACES STUDY TASKS) ---
    elif dominant_emotion == "sad" or not exam_context:
        primary_issue = "Wellness & Grounding"
        recommendations += [
            "Take a 15-minute gentle walk outdoors to reset",
            "Get 10 minutes of direct sunlight to boost mood",
            "Focus on 'easy tasks only' today — no heavy lifting",
            "Stay hydrated and engage in a calming hobby",
            "Declutter one small area (like your desk) for mental clarity"
        ]

    # --- LOW RISK / MAINTENANCE ---
    else:
        primary_issue = "Wellness Maintenance"
        recommendations += [
            "Keep your current sleep routine — it is your defense",
            "Add 20 minutes of light physical activity today",
            "Acknowledge 2 things you did well today",
            "Plan one purely enjoyable activity for this evening",
            "Continue taking regular breaks as you have been doing"
        ]

    # --- KEYWORD-SPECIFIC INJECTIONS (Limitation fix) ---
    journal_text = behavioral.get("journal_text", "").lower()
    if any(kw in journal_text for kw in ["back", "neck", "shoulder", "sitting"]):
        recommendations.insert(0, "Perform 5 minutes of ergonomic stretching for your back and neck")
    if "water" in journal_text or "thirsty" in journal_text:
        recommendations.insert(0, "Boost your immediate hydration — drink a full glass of water now")
    if "eye" in journal_text or "screen" in journal_text:
        recommendations.insert(0, "Practice the 20-20-20 rule to reduce digital eye strain")

    return {
        "primary_issue":    primary_issue,
        "risk_level":       risk,
        "recommendations":  recommendations[:5],
        "urgency": "immediate" if score > 0.75 else "moderate" if score > 0.45 else "preventive"
    }


def generate_recovery_plan(burnout_result: dict, behavioral: dict, nlp_result: dict = None) -> dict:
    score  = burnout_result["burnout_score"]
    risk   = burnout_result["risk_level"]
    sleep  = behavioral.get("sleep_hours", 7)
    work   = behavioral.get("work_hours", 8)
    has_exam_toggle = behavioral.get("has_deadline", False)

    exam_context = has_exam_toggle
    if nlp_result:
        exam_context = has_exam_toggle or nlp_result.get("keyword_analysis", {}).get("exam_context", False)

    is_sleep_issue = sleep < 6
    is_overload = work > 10 or score > 0.7

    morning = []
    if exam_context:
        morning.append("08:30 AM - Review top 2 high-priority study topics only")
        morning.append("09:00 AM - Start first 50-min study block with active recall")
    else:
        morning.append("08:30 AM - Light stretching and 10 minutes of morning sunlight")
        morning.append("09:00 AM - Hydration check + 15-minute gentle walk")

    afternoon = []
    if is_overload:
        afternoon.append("01:30 PM - Mandatory 15-minute outdoor walk (no phone)")
        afternoon.append("03:00 PM - 10-minute quiet break; hydration check")
    elif exam_context:
        afternoon.append("02:00 PM - 25-min Pomodoro session + 5-min movement break")
        afternoon.append("04:00 PM - Switch environment to reset focus")
    else:
        afternoon.append("02:00 PM - Engage in a hobby or light creative activity")
        afternoon.append("03:30 PM - Quick room declutter (5-10 minutes)")

    evening = []
    if is_sleep_issue:
        evening.append("08:00 PM - Begin wind-down: stop all activity")
        evening.append("09:15 PM - No screens; read or listen to calming audio")
    else:
        evening.append("07:30 PM - Social connection: call a friend or family member")
        evening.append("08:30 PM - Reflective journaling: write 3 wins from today")

    night = []
    if is_sleep_issue:
        night.append("10:00 PM - Lights out; target 8.5 hours of recovery sleep")
    elif exam_context:
        night.append("10:30 PM - Brief planning for tomorrow then sleep")
    else:
        night.append("10:30 PM - Nightly routine: hydration + early sleep prep")

    return {
        "risk_level":   risk,
        "burnout_score": score,
        "plan_focus":   "Recovery" if score > 0.7 else "Balance" if score > 0.4 else "Maintenance",
        "daily_plan": {
            "morning":   morning,
            "afternoon": afternoon,
            "evening":   evening,
            "night":     night
        }
    }