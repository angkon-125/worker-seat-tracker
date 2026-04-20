"""
intelligence_routes.py — API v1 Intelligence Endpoints

GET /api/v1/intelligence/summary    → full intelligence snapshot
GET /api/v1/intelligence/heatmap    → seat intensity map
GET /api/v1/intelligence/alerts     → structured alert list
GET /api/v1/intelligence/insights   → human-readable insight cards
GET /api/v1/intelligence/worker/{id} → per-seat productivity score
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, Dict
from ..database import get_db
from ..intelligence.insights_service import InsightsService
from ..intelligence.pattern_engine import PatternEngine
from ..intelligence.alert_engine import AlertEngine
from ..intelligence.scoring_engine import ScoringEngine
from ..intelligence.analyzer import BehaviorAnalyzer

router = APIRouter(prefix="/intelligence", tags=["Intelligence Engine"])


@router.get("/summary")
def get_intelligence_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Full intelligence snapshot: insights + heatmap + scores + alerts."""
    service = InsightsService(db)
    return service.get_summary()


@router.get("/heatmap")
def get_heatmap(since_hours: int = 24, db: Session = Depends(get_db)):
    """Returns seat intensity heatmap data (0.0–1.0 per seat)."""
    engine = PatternEngine(db)
    return {
        "since_hours": since_hours,
        "heatmap": engine.generate_heatmap(since_hours=since_hours),
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
    }


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Returns all active system alerts sorted by severity."""
    alert_engine = AlertEngine(db)
    analyzer = BehaviorAnalyzer(db)
    behavior = analyzer.analyze_all_seats()
    irregular = behavior.get("irregular_seats", [])
    alerts = alert_engine.get_all_alerts(irregular_seats=irregular)
    return {
        "total": len(alerts),
        "alerts": alerts,
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
    }


@router.get("/insights")
def get_insights(db: Session = Depends(get_db)):
    """Returns curated human-readable insight cards."""
    service = InsightsService(db)
    return service.get_all_insights()


@router.get("/worker/{seat_id}")
def get_worker_score(seat_id: int, db: Session = Depends(get_db)):
    """Returns detailed productivity score for a specific seat/worker."""
    engine = ScoringEngine(db)
    from ..models import Seat
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Seat {seat_id} not found.")
    score = engine.score_seat(seat.id, seat.name)
    return score


@router.get("/scores")
def get_all_scores(db: Session = Depends(get_db)):
    """Returns productivity scores for all seats, ranked."""
    engine = ScoringEngine(db)
    return {
        "scores": engine.score_all_seats(),
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
    }


@router.get("/patterns")
def get_patterns(since_hours: int = 168, db: Session = Depends(get_db)):
    """Returns hourly distribution and zone activity."""
    engine = PatternEngine(db)
    return {
        "hourly_distribution": engine.get_hourly_distribution(since_hours=since_hours),
        "peak_hour": engine.get_peak_hour(since_hours=since_hours),
        "zone_activity": engine.get_zone_activity(since_hours=since_hours),
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
