"""
insights_service.py — Human-Readable Insights Generator

Produces natural language insights such as:
- "Top active seat today"
- "Least active zone"
- "Peak activity window"
- "Camera health summary"
- "Productivity leaders"
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Camera

from .pattern_engine import PatternEngine
from .scoring_engine import ScoringEngine
from .analyzer import BehaviorAnalyzer
from .alert_engine import AlertEngine


class InsightsService:
    def __init__(self, db: Session):
        self.db = db
        self.pattern = PatternEngine(db)
        self.scoring = ScoringEngine(db)
        self.analyzer = BehaviorAnalyzer(db)
        self.alerts = AlertEngine(db)

    # ─────────────────────────────────────────────
    # Top active seat today
    # ─────────────────────────────────────────────
    def top_active_seat(self) -> Dict[str, Any]:
        activity = self.pattern.get_seat_activity(since_hours=24)
        if not activity or activity[0]["activity_count"] == 0:
            return {"insight": "No seat activity recorded today.", "value": None}
        top = activity[0]
        return {
            "insight": f"Seat '{top['seat_name']}' is the most active today with {top['activity_count']} occupancy events.",
            "seat_id": top["seat_id"],
            "seat_name": top["seat_name"],
            "value": top["activity_count"],
        }

    # ─────────────────────────────────────────────
    # Least active zone (camera)
    # ─────────────────────────────────────────────
    def least_active_zone(self) -> Dict[str, Any]:
        zones = self.pattern.get_zone_activity(since_hours=24)
        if not zones:
            return {"insight": "No zone data available.", "value": None}
        least = zones[-1]
        return {
            "insight": (
                f"Zone '{least['camera_name']}' has the lowest activity today "
                f"({least['total_activity']} events across {least['seat_count']} seats)."
            ),
            "camera_id": least["camera_id"],
            "camera_name": least["camera_name"],
            "value": least["total_activity"],
        }

    # ─────────────────────────────────────────────
    # Peak activity time window
    # ─────────────────────────────────────────────
    def peak_activity_time(self) -> Dict[str, Any]:
        peak = self.pattern.get_peak_hour(since_hours=168)
        if not peak["hour"] is not None:
            return {"insight": "Insufficient data to determine peak time.", "value": None}
        return {
            "insight": f"Peak workspace activity occurs between {peak['label']} ({peak['events']} events this week).",
            "hour": peak["hour"],
            "label": peak["label"],
            "value": peak["events"],
        }

    # ─────────────────────────────────────────────
    # Productivity leader (highest score)
    # ─────────────────────────────────────────────
    def productivity_leader(self) -> Dict[str, Any]:
        scores = self.scoring.score_all_seats()
        leaders = [s for s in scores if s["score"] > 0]
        if not leaders:
            return {"insight": "No productivity data available yet.", "value": None}
        top = leaders[0]
        return {
            "insight": (
                f"Seat '{top['seat_name']}' leads productivity with a score of "
                f"{top['score']}/100 (Grade: {top['grade']})."
            ),
            "seat_id": top["seat_id"],
            "seat_name": top["seat_name"],
            "score": top["score"],
            "grade": top["grade"],
        }

    # ─────────────────────────────────────────────
    # Camera health summary
    # ─────────────────────────────────────────────
    def camera_health_summary(self) -> Dict[str, Any]:
        cameras = self.db.query(Camera).all()
        total = len(cameras)
        online = sum(1 for c in cameras if c.is_active)
        offline = total - online
        health_pct = round((online / total * 100) if total else 0, 1)
        status = "healthy" if offline == 0 else ("degraded" if offline < total else "critical")
        return {
            "insight": (
                f"Camera network is {status}: {online}/{total} cameras online ({health_pct}% uptime)."
            ),
            "total": total,
            "online": online,
            "offline": offline,
            "health_pct": health_pct,
            "status": status,
        }

    # ─────────────────────────────────────────────
    # Aggregate all insights
    # ─────────────────────────────────────────────
    def get_all_insights(self) -> Dict[str, Any]:
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "top_active_seat": self.top_active_seat(),
            "least_active_zone": self.least_active_zone(),
            "peak_activity_time": self.peak_activity_time(),
            "productivity_leader": self.productivity_leader(),
            "camera_health": self.camera_health_summary(),
        }

    # ─────────────────────────────────────────────
    # Full intelligence summary  (for /summary endpoint)
    # ─────────────────────────────────────────────
    def get_summary(self) -> Dict[str, Any]:
        behavior = self.analyzer.analyze_all_seats()
        irregular = behavior.get("irregular_seats", [])
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "insights": self.get_all_insights(),
            "heatmap": self.pattern.generate_heatmap(since_hours=24),
            "hourly_distribution": self.pattern.get_hourly_distribution(since_hours=168),
            "productivity_scores": self.scoring.score_all_seats(),
            "alerts": self.alerts.get_all_alerts(irregular_seats=irregular),
            "behavior": behavior,
        }
