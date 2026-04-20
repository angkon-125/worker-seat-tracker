"""
scoring_engine.py — Productivity Scoring Engine

Calculates a productivity score (0–100) per seat based on:
  - Total seated/active time  (weight: 50%)
  - Session consistency       (weight: 30%)  [low variance = more consistent]
  - Healthy break patterns    (weight: 20%)  [not too many, not too few breaks]

Score is seat-based (seats map 1-to-1 to workers in this system).
"""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Seat, OccupancyLog


class ScoringEngine:
    WORK_HOURS_PER_DAY = 10          # 08:00–18:00
    IDEAL_BREAK_COUNT_PER_DAY = 3    # ~3 breaks is healthy
    BREAK_TOLERANCE = 2              # +/- 2 breaks still considered healthy

    def __init__(self, db: Session):
        self.db = db

    def _get_logs(self, seat_id: int, since_hours: int = 168) -> List[OccupancyLog]:
        cutoff = datetime.utcnow() - timedelta(hours=since_hours)
        return (
            self.db.query(OccupancyLog)
            .filter(OccupancyLog.seat_id == seat_id, OccupancyLog.timestamp >= cutoff)
            .order_by(OccupancyLog.timestamp.asc())
            .all()
        )

    def _compute_active_minutes(self, logs: List[OccupancyLog]) -> float:
        """Sum duration of all occupied spans in minutes."""
        total = 0.0
        occupied_since = None
        for log in logs:
            ts = log.timestamp.replace(tzinfo=None)
            if log.is_occupied:
                occupied_since = ts
            elif occupied_since is not None:
                total += (ts - occupied_since).total_seconds() / 60
                occupied_since = None
        return total

    def _compute_daily_sessions(self, logs: List[OccupancyLog]) -> Dict[str, int]:
        """Count number of occupancy sessions per day."""
        daily: Dict[str, int] = defaultdict(int)
        for log in logs:
            if log.is_occupied:
                day = log.timestamp.strftime("%Y-%m-%d")
                daily[day] += 1
        return dict(daily)

    def score_seat(self, seat_id: int, seat_name: str) -> Dict[str, Any]:
        logs = self._get_logs(seat_id, since_hours=168)   # 7-day window

        if len(logs) < 3:
            return {
                "seat_id": seat_id,
                "seat_name": seat_name,
                "score": 0,
                "grade": "N/A",
                "breakdown": {"reason": "insufficient_data"},
            }

        # ── Component 1: Active time score (50 pts) ──────────────────────
        active_minutes = self._compute_active_minutes(logs)
        # Ideal = 7 days × 8 productive hours = 3360 min
        ideal_active_minutes = 7 * 8 * 60
        time_ratio = min(active_minutes / ideal_active_minutes, 1.0)
        time_score = round(time_ratio * 50, 1)

        # ── Component 2: Session consistency (30 pts) ─────────────────────
        daily_sessions = self._compute_daily_sessions(logs)
        counts = list(daily_sessions.values())
        if len(counts) > 1:
            avg = sum(counts) / len(counts)
            variance = sum((c - avg) ** 2 for c in counts) / len(counts)
            std = variance ** 0.5
            cov = std / avg if avg > 0 else 1.0
            consistency_ratio = max(0.0, 1.0 - cov)
        else:
            consistency_ratio = 0.5   # neutral if only 1 day
        consistency_score = round(consistency_ratio * 30, 1)

        # ── Component 3: Break pattern (20 pts) ───────────────────────────
        # Count vacant→occupied transitions per day (each = a "return from break")
        break_counts_per_day: Dict[str, int] = defaultdict(int)
        prev_occupied = None
        for log in logs:
            day = log.timestamp.strftime("%Y-%m-%d")
            if prev_occupied is False and log.is_occupied:
                break_counts_per_day[day] += 1
            prev_occupied = log.is_occupied

        if break_counts_per_day:
            avg_breaks = sum(break_counts_per_day.values()) / len(break_counts_per_day)
            deviation = abs(avg_breaks - self.IDEAL_BREAK_COUNT_PER_DAY)
            break_ratio = max(0.0, 1.0 - deviation / (self.IDEAL_BREAK_COUNT_PER_DAY + self.BREAK_TOLERANCE))
        else:
            break_ratio = 0.0
        break_score = round(break_ratio * 20, 1)

        # ── Final score ───────────────────────────────────────────────────
        total = round(time_score + consistency_score + break_score, 1)

        if total >= 80:
            grade = "A"
        elif total >= 60:
            grade = "B"
        elif total >= 40:
            grade = "C"
        elif total >= 20:
            grade = "D"
        else:
            grade = "F"

        return {
            "seat_id": seat_id,
            "seat_name": seat_name,
            "score": total,
            "grade": grade,
            "breakdown": {
                "time_score": time_score,
                "consistency_score": consistency_score,
                "break_score": break_score,
                "active_minutes_7d": round(active_minutes, 0),
            },
        }

    def score_all_seats(self) -> List[Dict[str, Any]]:
        seats = self.db.query(Seat).all()
        results = [self.score_seat(s.id, s.name) for s in seats]
        return sorted(results, key=lambda x: x["score"], reverse=True)
