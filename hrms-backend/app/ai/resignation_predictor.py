from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.models.employee import Employee
from app.models.attendance import AttendanceLog
from app.models.leave import LeaveRequest
from app.models.performance import PerformanceReview

def calculate_resignation_risk(
    employee_id: str,
    db: Session
) -> dict:
    today = datetime.utcnow()
    this_year = today.year
    this_month = today.month
    
    emp = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()
    if not emp:
        return None
    
    risk_score = 0
    risk_factors = []
    positive_factors = []
    
    # ── TENURE CHECK ──────────────────────────
    tenure_days = (today.date() - 
        emp.joining_date).days \
        if emp.joining_date else 0
    tenure_months = tenure_days // 30
    
    # Sweet spot risk: 18-36 months
    # (enough experience to leave easily)
    if 18 <= tenure_months <= 36:
        risk_score += 15
        risk_factors.append(
            f"At high-turnover tenure "
            f"({tenure_months} months)")
    elif tenure_months > 48:
        risk_score += 20
        risk_factors.append(
            f"Long tenure with possible stagnation"
            f" ({tenure_months//12} years)")
    else:
        positive_factors.append(
            "Healthy tenure stage")
    
    # ── PERFORMANCE CHECK ─────────────────────
    last_2_reviews = db.query(PerformanceReview)\
        .filter(
            PerformanceReview.employee_id 
            == employee_id,
            PerformanceReview.status == "SUBMITTED"
        ).order_by(
            PerformanceReview.created_at.desc()
        ).limit(2).all()
    
    if last_2_reviews:
        avg_rating = sum(
            r.overall_rating 
            for r in last_2_reviews
        ) / len(last_2_reviews)
        
        if avg_rating < 2.0:
            risk_score += 35
            risk_factors.append(
                f"Very low performance rating "
                f"({avg_rating:.1f}/5) — "
                f"may be managed out or self-exit")
        elif avg_rating < 3.0:
            risk_score += 20
            risk_factors.append(
                f"Below average rating "
                f"({avg_rating:.1f}/5)")
        elif avg_rating >= 4.0:
            risk_score -= 10
            positive_factors.append(
                f"Strong performer ({avg_rating:.1f}/5)")
    else:
        risk_score += 20
        risk_factors.append(
            "No performance review on record — "
            "employee may feel unrecognized")
    
    # ── ATTENDANCE TREND ──────────────────────
    # Last 30 days attendance
    thirty_days_ago = today - timedelta(days=30)
    recent_logs = db.query(AttendanceLog)\
        .filter(
            AttendanceLog.employee_id == employee_id,
            AttendanceLog.date >= thirty_days_ago.date()
        ).all()
    
    if recent_logs:
        working_logs = [l for l in recent_logs
            if l.status not in 
            ["WEEKEND", "HOLIDAY"]]
        
        if working_logs:
            present = sum(1 for l in working_logs
                if l.status == "PRESENT")
            att_rate = present / len(working_logs)
            
            late_count = sum(1 for l in working_logs
                if l.status == "LATE")
            
            if att_rate < 0.70:
                risk_score += 30
                risk_factors.append(
                    f"Very low attendance "
                    f"({round(att_rate*100)}%) "
                    f"— likely disengaged")
            elif att_rate < 0.80:
                risk_score += 20
                risk_factors.append(
                    f"Low attendance "
                    f"({round(att_rate*100)}%)")
            elif att_rate < 0.85:
                risk_score += 10
                risk_factors.append(
                    f"Slightly low attendance "
                    f"({round(att_rate*100)}%)")
            else:
                positive_factors.append(
                    f"Good attendance "
                    f"({round(att_rate*100)}%)")
            
            if late_count >= 6:
                risk_score += 15
                risk_factors.append(
                    f"Frequent late arrivals "
                    f"({late_count} times this month)")
    
    # ── LEAVE USAGE ───────────────────────────
    leaves_this_year = db.query(
        func.sum(LeaveRequest.days))\
        .filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status == "APPROVED",
            extract('year',
                LeaveRequest.start_date) == this_year
        ).scalar() or 0
    
    if leaves_this_year > 18:
        risk_score += 20
        risk_factors.append(
            f"Very high leave usage "
            f"({leaves_this_year} days this year) "
            f"— possible disengagement")
    elif leaves_this_year > 12:
        risk_score += 10
        risk_factors.append(
            f"Above average leave usage "
            f"({leaves_this_year} days)")
    else:
        positive_factors.append(
            f"Normal leave usage "
            f"({leaves_this_year} days)")
    
    # ── LEAVE PATTERN CHECK ───────────────────
    # Frequent short leaves = job hunting signal
    short_leaves = db.query(LeaveRequest)\
        .filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.days == 1,
            LeaveRequest.status == "APPROVED",
            extract('year',
                LeaveRequest.start_date) == this_year
        ).count()
    
    if short_leaves >= 8:
        risk_score += 15
        risk_factors.append(
            f"Many single-day leaves ({short_leaves})"
            f" — possible interview pattern")
    
    # ── CAP SCORE AT 100 ──────────────────────
    risk_score = max(0, min(100, risk_score))
    
    # ── RISK LEVEL ────────────────────────────
    if risk_score >= 65:
        risk_level = "HIGH"
        prediction = "Likely to resign within 30 days"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
        prediction = "At risk — monitor closely"
    else:
        risk_level = "LOW"
        prediction = "Stable — no immediate concern"
    
    return {
        "employee_id": employee_id,
        "employee_name": f"{emp.first_name} "
                         f"{emp.last_name}",
        "department": emp.department.name
            if emp.department else "N/A",
        "designation": emp.designation,
        "tenure_months": tenure_months,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "prediction": prediction,
        "risk_factors": risk_factors,
        "positive_factors": positive_factors,
        "recommended_actions": 
            get_recommendations(
                risk_level, risk_factors,
                emp.designation)
    }

def get_recommendations(
    risk_level: str,
    risk_factors: list,
    designation: str
) -> list:
    actions = []
    
    if risk_level == "HIGH":
        actions.append(
            "Schedule 1:1 retention meeting "
            "within 48 hours")
        actions.append(
            "Review compensation vs market rate")
        actions.append(
            "Discuss career growth roadmap")
        
        if any("performance" in f.lower() 
               for f in risk_factors):
            actions.append(
                "Create Performance Improvement "
                "Plan (PIP) or support plan")
        
        if any("tenure" in f.lower() 
               for f in risk_factors):
            actions.append(
                "Consider promotion or role change")
    
    elif risk_level == "MEDIUM":
        actions.append(
            "Schedule check-in meeting this week")
        actions.append(
            "Review workload and project assignment")
        actions.append(
            "Acknowledge recent contributions")
    
    else:
        actions.append(
            "Continue regular 1:1 meetings")
        actions.append(
            "Keep engagement high with new projects")
    
    return actions

def get_ai_insight_for_employee(
    employee_data: dict,
    risk_data: dict
) -> str:
    """
    Get Gemini's personalized insight for
    one high-risk employee.
    Only called for HIGH risk employees.
    """
    prompt = f"""
An employee shows resignation risk signals.

Employee: {risk_data['employee_name']}
Role: {risk_data['designation']}
Department: {risk_data['department']}
Tenure: {risk_data['tenure_months']} months
Risk Score: {risk_data['risk_score']}/100
Risk Factors: {risk_data['risk_factors']}

Write a 2-sentence personalized retention 
recommendation for the HR manager.
Be specific and actionable.
Return plain text, no JSON, no markdown.
"""
    try:
        from app.ai.gemini_client import generate_text
        return generate_text(prompt)
    except:
        return (f"Schedule an urgent retention "
                f"meeting with "
                f"{risk_data['employee_name']}. "
                f"Address the identified risk "
                f"factors immediately.")

def run_company_risk_analysis(
    db: Session
) -> dict:
    """
    Run resignation risk for ALL active employees.
    Returns sorted list highest risk first.
    """
    active_employees = db.query(Employee)\
        .filter(Employee.status == "ACTIVE")\
        .all()
    
    results = []
    for emp in active_employees:
        try:
            risk = calculate_resignation_risk(
                emp.id, db)
            if risk:
                results.append(risk)
        except Exception as e:
            print(f"Risk calc error for "
                  f"{emp.id}: {e}")
    
    # Sort by risk score descending
    results.sort(
        key=lambda x: x["risk_score"],
        reverse=True)
    
    # Get AI insight for top 3 high risk only
    # (avoid too many Gemini calls)
    high_risk = [r for r in results
        if r["risk_level"] == "HIGH"][:3]
    
    # AI Insight fetch removed to prevent API timeouts during bulk analysis
    # Individual employee API endpoint will still fetch it.
    
    # Summary stats
    total = len(results)
    high = sum(1 for r in results
        if r["risk_level"] == "HIGH")
    medium = sum(1 for r in results
        if r["risk_level"] == "MEDIUM")
    low = sum(1 for r in results
        if r["risk_level"] == "LOW")
    
    return {
        "summary": {
            "total_analyzed": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
            "risk_percentage": round(
                (high + medium) / total * 100
                if total else 0, 1)
        },
        "employees": results,
        "analyzed_at": datetime.utcnow()\
            .strftime("%B %d, %Y %H:%M")
    }
