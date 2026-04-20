"""
pattern_engine.py — Pattern Analysis Engine

Aggregates occupancy logs to find:
- Peak activity hours (by hour of day)
- Most/least active seats over any time window
- Hourly heatmap intensity values per seat/zone
"""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Seat, OccupancyLog, Camera, Room


class PatternEngine:
    def __init__(self, db: Session):
        self.db = db

    # ─────────────────────────────────────────────
    # Hourly distribution (0-23) of occupancy events
    # ─────────────────────────────────────────────
    def get_hourly_distribution(self, since_hours: int = 168) -> List[Dict[str, Any]]:
        """Returns a 24-bucket list showing total occupancy events per hour."""
        cutoff = datetime.utcnow() - timedelta(hours=since_hours)
        logs = (
            self.db.query(OccupancyLog)
            .filter(OccupancyLog.timestamp >= cutoff, OccupancyLog.is_occupied == True)
            .all()
        )
        hourly: Dict[int, int] = defaultdict(int)
        for log in logs:
            hour = log.timestamp.hour
            hourly[hour] += 1

        return [{"hour": h, "events": hourly[h]} for h in range(24)]

    # ─────────────────────────────────────────────
    # Peak hour (most events)
    # ─────────────────────────────────────────────
    def get_peak_hour(self, since_hours: int = 168) -> Dict[str, Any]:
        distribution = self.get_hourly_distribution(since_hours)
        if not distribution:
            return {"hour": None, "events": 0}
        peak = max(distribution, key=lambda x: x["events"])
        label = f"{peak['hour']:02d}:00 – {peak['hour']:02d}:59"
        return {"hour": peak["hour"], "label": label, "events": peak["events"]}

    # ─────────────────────────────────────────────
    # Per-seat activity count
    # ─────────────────────────────────────────────
    def get_seat_activity(self, since_hours: int = 24) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(hours=since_hours)
        logs = (
            self.db.query(OccupancyLog)
            .filter(OccupancyLog.timestamp >= cutoff, OccupancyLog.is_occupied == True)
            .all()
        )
        seat_counts: Dict[int, int] = defaultdict(int)
        for log in logs:
            seat_counts[log.seat_id] += 1

        seats = self.db.query(Seat).all()
        result = []
        for seat in seats:
            result.append({
                "seat_id": seat.id,
                "seat_name": seat.name,
                "camera_id": seat.camera_id,
                "activity_count": seat_counts.get(seat.id, 0),
            })
        return sorted(result, key=lambda x: x["activity_count"], reverse=True)

    # ─────────────────────────────────────────────
    # Heatmap data: intensity per seat (0.0 – 1.0)
    # ─────────────────────────────────────────────
    def generate_heatmap(self, since_hours: int = 24) -> List[Dict[str, Any]]:
        activity = self.get_seat_activity(since_hours)
        max_count = max((a["activity_count"] for a in activity), default=1) or 1

        seats = {s.id: s for s in self.db.query(Seat).all()}
        heatmap = []
        for item in activity:
            seat = seats.get(item["seat_id"])
            if not seat:
                continue
            intensity = round(item["activity_count"] / max_count, 3)
            heatmap.append({
                "seat_id": seat.id,
                "seat_name": seat.name,
                "x_min": seat.x_min,
                "y_min": seat.y_min,
                "x_max": seat.x_max,
                "y_max": seat.y_max,
                "intensity": intensity,           # 0.0 = cold, 1.0 = hot
                "activity_count": item["activity_count"],
            })
        return heatmap

    # ─────────────────────────────────────────────
    # Zone-level aggregation (by camera/room)
    # ─────────────────────────────────────────────
    def get_zone_activity(self, since_hours: int = 24) -> List[Dict[str, Any]]:
        seat_activity = {a["seat_id"]: a["activity_count"] for a in self.get_seat_activity(since_hours)}
        cameras = self.db.query(Camera).all()
        zones = []
        for cam in cameras:
            total = sum(seat_activity.get(s.id, 0) for s in cam.seats)
            zones.append({
                "camera_id": cam.id,
                "camera_name": cam.name,
                "room_id": cam.room_id,
                "total_activity": total,
                "seat_count": len(cam.seats),
                "avg_activity_per_seat": round(total / len(cam.seats), 1) if cam.seats else 0,
            })
        return sorted(zones, key=lambda x: x["total_activity"], reverse=True)
