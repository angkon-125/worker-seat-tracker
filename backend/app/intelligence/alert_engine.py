"""
alert_engine.py — Structured Alert Generation Engine

Rules enforced:
1. Seat idle  > IDLE_THRESHOLD_MINUTES during working hours
2. Camera has not sent a heartbeat in > CAMERA_TIMEOUT_MINUTES
3. Seat usage pattern flagged as highly irregular (from analyzer)
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Seat, OccupancyLog, Camera


class AlertSeverity:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertEngine:
    IDLE_THRESHOLD_MINUTES = 90
    CAMERA_TIMEOUT_MINUTES = 10
    WORK_START_HOUR = 8
    WORK_END_HOUR = 18

    def __init__(self, db: Session):
        self.db = db

    def _is_work_hours(self) -> bool:
        now = datetime.utcnow()
        return self.WORK_START_HOUR <= now.hour < self.WORK_END_HOUR

    # ─────────────────────────────────────────────
    # Rule 1 – Long idle seat alerts
    # ─────────────────────────────────────────────
    def check_idle_seats(self) -> List[Dict[str, Any]]:
        alerts = []
        if not self._is_work_hours():
            return alerts

        seats = self.db.query(Seat).filter(Seat.is_occupied == False).all()
        threshold = datetime.utcnow() - timedelta(minutes=self.IDLE_THRESHOLD_MINUTES)

        for seat in seats:
            last_event = (
                self.db.query(OccupancyLog)
                .filter(OccupancyLog.seat_id == seat.id)
                .order_by(OccupancyLog.timestamp.desc())
                .first()
            )
            if last_event is None:
                continue
            last_ts = last_event.timestamp.replace(tzinfo=None)
            if last_ts < threshold:
                idle_min = int((datetime.utcnow() - last_ts).total_seconds() / 60)
                alerts.append({
                    "alert_id": f"idle-{seat.id}",
                    "type": "seat_idle",
                    "severity": AlertSeverity.MEDIUM if idle_min < 180 else AlertSeverity.HIGH,
                    "seat_id": seat.id,
                    "seat_name": seat.name,
                    "message": f"Seat '{seat.name}' has been idle for {idle_min} min during work hours.",
                    "idle_minutes": idle_min,
                    "timestamp": datetime.utcnow().isoformat(),
                })
        return alerts

    # ─────────────────────────────────────────────
    # Rule 2 – Camera instability / heartbeat loss
    # ─────────────────────────────────────────────
    def check_camera_health(self) -> List[Dict[str, Any]]:
        alerts = []
        cameras = self.db.query(Camera).filter(Camera.is_active == True).all()
        timeout_threshold = datetime.utcnow() - timedelta(minutes=self.CAMERA_TIMEOUT_MINUTES)

        for cam in cameras:
            if cam.last_heartbeat is None:
                alerts.append({
                    "alert_id": f"cam-never-{cam.id}",
                    "type": "camera_offline",
                    "severity": AlertSeverity.CRITICAL,
                    "camera_id": cam.id,
                    "camera_name": cam.name,
                    "message": f"Camera '{cam.name}' has never sent a heartbeat. Stream may be offline.",
                    "timestamp": datetime.utcnow().isoformat(),
                })
            else:
                hb = cam.last_heartbeat.replace(tzinfo=None)
                if hb < timeout_threshold:
                    minutes_lost = int((datetime.utcnow() - hb).total_seconds() / 60)
                    alerts.append({
                        "alert_id": f"cam-timeout-{cam.id}",
                        "type": "camera_timeout",
                        "severity": AlertSeverity.HIGH,
                        "camera_id": cam.id,
                        "camera_name": cam.name,
                        "message": f"Camera '{cam.name}' lost heartbeat {minutes_lost} min ago.",
                        "minutes_since_heartbeat": minutes_lost,
                        "timestamp": datetime.utcnow().isoformat(),
                    })
        return alerts

    # ─────────────────────────────────────────────
    # Rule 3 – Abnormal usage pattern alert
    # ─────────────────────────────────────────────
    def check_abnormal_patterns(self, irregular_seats: List[Dict]) -> List[Dict[str, Any]]:
        alerts = []
        for seat_info in irregular_seats:
            alerts.append({
                "alert_id": f"pattern-{seat_info['seat_id']}",
                "type": "irregular_pattern",
                "severity": AlertSeverity.LOW,
                "seat_id": seat_info["seat_id"],
                "message": (
                    f"Seat {seat_info['seat_id']} shows inconsistent usage "
                    f"(CoV: {seat_info.get('coefficient_of_variation', 'N/A')})."
                ),
                "detail": seat_info,
                "timestamp": datetime.utcnow().isoformat(),
            })
        return alerts

    # ─────────────────────────────────────────────
    # Aggregate all alerts
    # ─────────────────────────────────────────────
    def get_all_alerts(self, irregular_seats: List[Dict] = None) -> List[Dict[str, Any]]:
        if irregular_seats is None:
            irregular_seats = []

        severity_order = {
            AlertSeverity.CRITICAL: 0,
            AlertSeverity.HIGH: 1,
            AlertSeverity.MEDIUM: 2,
            AlertSeverity.LOW: 3,
        }
        alerts = (
            self.check_idle_seats()
            + self.check_camera_health()
            + self.check_abnormal_patterns(irregular_seats)
        )
        return sorted(alerts, key=lambda a: severity_order.get(a["severity"], 99))
