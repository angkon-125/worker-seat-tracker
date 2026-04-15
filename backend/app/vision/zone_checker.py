from typing import List, Dict

def calculate_overlap(person_box: List[float], seat_zone: Dict[str, float]) -> float:
    """
    Calculate what fraction of the seat zone is covered by the person bounding box.

    Args:
        person_box: [x1, y1, x2, y2] normalized (0.0–1.0)
        seat_zone:  {"x": float, "y": float, "w": float, "h": float}

    Returns:
        Overlap fraction relative to seat zone area (0.0–1.0)
    """
    px1, py1, px2, py2 = person_box
    sx1, sy1 = seat_zone["x"], seat_zone["y"]
    sx2, sy2 = sx1 + seat_zone["w"], sy1 + seat_zone["h"]

    # Calculate intersection coordinates
    ix1, iy1 = max(px1, sx1), max(py1, sy1)
    ix2, iy2 = min(px2, sx2), min(py2, sy2)

    if ix1 < ix2 and iy1 < iy2:
        intersection_area = (ix2 - ix1) * (iy2 - iy1)
        seat_area = seat_zone["w"] * seat_zone["h"]
        return intersection_area / seat_area if seat_area > 0 else 0.0
    
    return 0.0

def is_person_in_zone(persons: List[List[float]], seat_zone: Dict[str, float], threshold: float) -> bool:
    """Check if any detected person significantly overlaps with the seat zone."""
    return any(calculate_overlap(p, seat_zone) >= threshold for p in persons)
