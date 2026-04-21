import cv2
import argparse
import sys
import time
from app.services.vision_service import VisionService

class DummySeat:
    def __init__(self, seat_id, x_min, y_min, x_max, y_max):
        self.id = seat_id
        self.x_min = x_min
        self.y_min = y_min
        self.x_max = x_max
        self.y_max = y_max
        self.name = f"Seat {seat_id}"

def main():
    parser = argparse.ArgumentParser(description="Test video using YOLOv8n and check occupancy")
    parser.add_argument("video_path", type=str, help="Path to the video file to test")
    parser.add_argument("--show", action="store_true", help="Display the video with bounding boxes (requires GUI)")
    args = parser.parse_args()

    print(f"Loading YOLO model...")
    vision = VisionService(model_path="yolov8n.pt")
    if vision.model is None:
        print("Failed to load YOLO model. Exiting.")
        sys.exit(1)

    print(f"Opening video: {args.video_path}")
    cap = cv2.VideoCapture(args.video_path)
    if not cap.isOpened():
        print(f"Error opening video file {args.video_path}")
        sys.exit(1)

    # Let's define a couple of dummy seats (normalized coordinates 0.0 to 1.0)
    # Adjust these based on where the seats actually are in the video
    seats = [
        DummySeat(1, 0.2, 0.3, 0.4, 0.8), # Left seat
        DummySeat(2, 0.6, 0.3, 0.8, 0.8)  # Right seat
    ]

    print("Defined Test Seats:")
    for seat in seats:
        print(f"- {seat.name}: [{seat.x_min}, {seat.y_min}, {seat.x_max}, {seat.y_max}]")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30 # fallback
        
    frame_count = 0
    start_time = time.time()
    
    occupancy_history = {seat.id: [] for seat in seats}
    current_status = {seat.id: False for seat in seats}

    print("\nStarting video processing...\n")
    print(f"{'Time (s)':<10} | {'Frame':<10} | {'Seat 1':<10} | {'Seat 2':<10}")
    print("-" * 45)

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Process every Nth frame to speed up testing (e.g., process 2-3 frames per second)
        # Assuming typical 30fps, process every 10 frames
        if frame_count % (int(fps) // 3 if fps > 3 else 1) != 0:
            continue

        # Detect people
        detections = vision.detect_people(frame)
        
        # Check occupancy
        occupancy_results = vision.check_occupancy(detections, seats)
        
        # Print if state changed or periodically
        state_changed = False
        for seat_id, is_occupied in occupancy_results.items():
            if current_status[seat_id] != is_occupied:
                current_status[seat_id] = is_occupied
                state_changed = True
                # Log transition
                timestamp = frame_count / fps
                status_str = "Occupied" if is_occupied else "Vacant  "
                occupancy_history[seat_id].append((timestamp, status_str))

        if state_changed:
            t_sec = round(frame_count / fps, 1)
            print(f"{t_sec:<10} | {frame_count:<10} | {str(current_status[1]):<10} | {str(current_status[2]):<10}")

        if args.show:
            # Draw detections
            h, w, _ = frame.shape
            for det in detections:
                x1, y1, x2, y2 = det
                cv2.rectangle(frame, (int(x1*w), int(y1*h)), (int(x2*w), int(y2*h)), (0, 0, 255), 2)
            
            # Draw seats
            for seat in seats:
                sx1, sy1, sx2, sy2 = int(seat.x_min*w), int(seat.y_min*h), int(seat.x_max*w), int(seat.y_max*h)
                color = (0, 255, 0) if current_status[seat.id] else (255, 0, 0)
                cv2.rectangle(frame, (sx1, sy1), (sx2, sy2), color, 2)
                cv2.putText(frame, seat.name, (sx1, sy1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            cv2.imshow('Video Test', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    end_time = time.time()
    cap.release()
    if args.show:
        cv2.destroyAllWindows()

    print("-" * 45)
    print(f"\nProcessing complete in {round(end_time - start_time, 2)} seconds.")
    print("Summary of Occupancy Transitions:")
    for seat in seats:
        print(f"\n{seat.name}:")
        if not occupancy_history[seat.id]:
            print("  No transitions (always vacant).")
        for ts, status in occupancy_history[seat.id]:
            minute = int(ts // 60)
            sec = int(ts % 60)
            print(f"  [{minute:02d}:{sec:02d}] -> {status}")

if __name__ == "__main__":
    main()
