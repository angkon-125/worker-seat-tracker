"""
analyzer.py — Behavior Analysis Engine

Detects:
- Long idle periods (seat unoccupied for extended time during working hours)
- Irregular seat usage (sporadic, unpredictable patterns)
- Inconsistent usage patterns (high variance between days)
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Seat, OccupancyLog


class BehaviorAnalyzer:
    WORK_START_HOUR = 8
    WORK_END_HOUR = 18
    IDLE_THRESHOLD_MINUTES = 90       # flag if seat idle > 90 min during work hours
    MIN_LOGS_FOR_PATTERN = 5          # need at least this many logs to detect a pattern

    def __init__(self, db: Session):
        self.db = db

    def get_logs_for_seat(self, seat_id: int, since_hours: int = 24) -> List[OccupancyLog]:
        cutoff = datetime.utcnow() - timedelta(hours=since_hours)
        return (
            self.db.query(OccupancyLog)
            .filter(OccupancyLog.seat_id == seat_id, OccupancyLog.timestamp >= cutoff)
            .order_by(OccupancyLog.timestamp.asc())
            .all()
        )

    def detect_idle_periods(self, seat_id: int) -> List[Dict[str, Any]]:
        """Return idle periods (vacant stretches) exceeding the threshold."""
        logs = self.get_logs_for_seat(seat_id, since_hours=24)
        idle_periods: List[Dict[str, Any]] = []

        last_vacated: datetime | None = None
        for log in logs:
            ts = log.timestamp.replace(tzinfo=None) if log.timestamp.tzinfo else log.timestamp
            hour = ts.hour
            if not (self.WORK_START_HOUR <= hour < self.WORK_END_HOUR):
                continue  # ignore non-working hours

            if not log.is_occupied:
                last_vacated = ts
            elif log.is_occupied and last_vacated is not None:
                duration = (ts - last_vacated).total_seconds() / 60
                if duration >= self.IDLE_THRESHOLD_MINUTES:
                    idle_periods.append({
                        "seat_id": seat_id,
                        "idle_from": last_vacated.isoformat(),
                        "idle_until": ts.isoformat(),
                        "duration_minutes": round(duration, 1),
                    })
                last_vacated = None

        return idle_periods

    def detect_irregular_usage(self, seat_id: int) -> Dict[str, Any]:
        """Detect high-variance, unpredictable usage over 7 days."""
        daily_sessions: Dict[str, int] = {}
        logs = self.get_logs_for_seat(seat_id, since_hours=168)  # 7 days

        for log in logs:
            if log.is_occupied:
                day_key = log.timestamp.strftime("%Y-%m-%d")
                daily_sessions[day_key] = daily_sessions.get(day_key, 0) + 1

        if not daily_sessions:
            return {"seat_id": seat_id, "irregular": False, "reason": "no_data"}

        counts = list(daily_sessions.values())
        avg = sum(counts) / len(counts)
        variance = sum((c - avg) ** 2 for c in counts) / len(counts)
        std_dev = variance ** 0.5
        coefficient_of_variation = (std_dev / avg) if avg > 0 else 0

        is_irregular = coefficient_of_variation > 0.6  # >60% variation = irregular
        return {
            "seat_id": seat_id,
            "irregular": is_irregular,
            "avg_sessions_per_day": round(avg, 1),
            "std_dev": round(std_dev, 2),
            "coefficient_of_variation": round(coefficient_of_variation, 3),
        }

    def analyze_all_seats(self) -> Dict[str, Any]:
        """Run full behavior analysis across all seats."""
        seats = self.db.query(Seat).all()
        results = {
            "total_seats": len(seats),
            "idle_violations": [],
            "irregular_seats": [],
        }

        for seat in seats:
            idle = self.detect_idle_periods(seat.id)
            if idle:
                results["idle_violations"].extend(idle)

            irregularity = self.detect_irregular_usage(seat.id)
            if irregularity.get("irregular"):
                results["irregular_seats"].append(irregularity)

        return results
