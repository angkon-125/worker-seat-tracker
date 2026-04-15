import os
import sys
import numpy as np
import cv2
import threading
import time

# Add app to path
sys.path.append(os.path.join(os.getcwd(), "app"))

try:
    from app.vision.detector_service import detector_service
    from app.core.config import settings
    print("Import success.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

def simulate_worker(worker_id):
    print(f"Worker {worker_id} starting...")
    # Create a mock frame
    frame = np.zeros((settings.FRAME_HEIGHT, settings.FRAME_WIDTH, 3), dtype=np.uint8)
    # Draw something to simulate a person if needed, but for now just test latency/concurrency
    
    start_time = time.time()
    for i in range(5):
        detections = detector_service.detect(frame)
        print(f"Worker {worker_id} - Iter {i}: {len(detections)} persons detected.")
        time.sleep(0.1)
    
    duration = time.time() - start_time
    print(f"Worker {worker_id} finished in {duration:.2f}s")

if __name__ == "__main__":
    print("--- Testing Shared Detector Service ---")
    
    # Test single worker
    simulate_worker(1)
    
    print("\n--- Testing Concurrent Workers ---")
    t1 = threading.Thread(target=simulate_worker, args=(2,))
    t2 = threading.Thread(target=simulate_worker, args=(3,))
    
    start_all = time.time()
    t1.start()
    t2.start()
    
    t1.join()
    t2.join()
    
    print(f"Total concurrent time: {time.time() - start_all:.2f}s")
    print("Test complete.")
