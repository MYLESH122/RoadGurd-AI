import math
from typing import List, Tuple, Dict, Any

class EyeDetector:
    """
    Computes Eye Aspect Ratio (EAR) using standard 6 landmarks per eye.
    EAR formula: (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
    Features automatic baseline calibration to prevent false alarms on naturally narrow eyes.
    """

    # MediaPipe FaceMesh indices for eyes:
    # Left eye: outer corner 33, top-outer 160, top-inner 158, inner corner 133, bottom-inner 153, bottom-outer 144
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    # Right eye: outer corner 362, top-outer 385, top-inner 387, inner corner 263, bottom-inner 373, bottom-outer 380
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

    def __init__(self, ear_threshold: float = 0.18):
        self.ear_threshold = ear_threshold
        self.closed_frames_count = 0
        self.total_blinks = 0
        self.is_currently_closed = False
        self.blink_frames = 0
        
        # Adaptive baseline calibration
        self.calibration_samples: List[float] = []
        self.calibrated_open_ear: float = 0.26
        self.effective_threshold: float = ear_threshold

    @staticmethod
    def _euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    def calculate_ear(self, landmarks_2d: List[Tuple[float, float]], indices: List[int]) -> float:
        """Calculates EAR for a given eye landmark sequence."""
        if len(landmarks_2d) < max(indices) + 1:
            return 0.28  # Safe open-eye fallback if landmarks insufficient

        p1 = landmarks_2d[indices[0]]
        p2 = landmarks_2d[indices[1]]
        p3 = landmarks_2d[indices[2]]
        p4 = landmarks_2d[indices[3]]
        p5 = landmarks_2d[indices[4]]
        p6 = landmarks_2d[indices[5]]

        # Vertical distances between upper and lower eyelids
        v1 = self._euclidean_distance(p2, p6)
        v2 = self._euclidean_distance(p3, p5)

        # Horizontal distance between eye corners
        h = self._euclidean_distance(p1, p4)

        if h < 1e-6:
            return 0.0

        ear = (v1 + v2) / (2.0 * h)
        return ear

    def process_frame(
        self,
        landmarks_2d: List[Tuple[float, float]],
        fps: float = 15.0
    ) -> Dict[str, Any]:
        """
        Analyzes eye landmarks and updates temporal closure metrics.
        Returns eye status, ear values, closure duration in seconds, and blink stats.
        """
        if not landmarks_2d or len(landmarks_2d) < 400:
            return {
                "ear_left": 0.28,
                "ear_right": 0.28,
                "ear_avg": 0.28,
                "eye_status": "open",
                "eye_closed": False,
                "closure_duration_sec": 0.0,
                "closure_frames": 0,
                "total_blinks": self.total_blinks,
            }

        left_ear = self.calculate_ear(landmarks_2d, self.LEFT_EYE_INDICES)
        right_ear = self.calculate_ear(landmarks_2d, self.RIGHT_EYE_INDICES)
        avg_ear = (left_ear + right_ear) / 2.0

        # Calibration stage (first 25 frames while user looks at screen with open eyes)
        if len(self.calibration_samples) < 25 and avg_ear > 0.16:
            self.calibration_samples.append(avg_ear)
            if len(self.calibration_samples) >= 15:
                # Use 70% of median open eye as the personalized closure threshold
                sorted_samples = sorted(self.calibration_samples)
                median_ear = sorted_samples[len(sorted_samples) // 2]
                self.calibrated_open_ear = median_ear
                # Threshold is between 0.14 and 0.20
                self.effective_threshold = max(0.14, min(0.20, median_ear * 0.70))

        # Test eye closure against effective threshold
        is_closed = avg_ear < self.effective_threshold

        if is_closed:
            self.closed_frames_count += 1
            self.blink_frames += 1
            self.is_currently_closed = True
        else:
            if self.is_currently_closed:
                # Normal involuntary blink lasts 1-5 frames (70-300ms)
                if 1 <= self.blink_frames <= 5:
                    self.total_blinks += 1
                self.blink_frames = 0
            self.closed_frames_count = 0
            self.is_currently_closed = False

        closure_duration_sec = self.closed_frames_count / max(fps, 1.0)

        # Distinguish normal blinking vs real prolonged drowsiness
        if self.closed_frames_count >= 15:  # >= 1.0 sec continuous
            eye_status = "prolonged_closed"
        elif self.closed_frames_count >= 6:  # >= 0.4 sec continuous
            eye_status = "closed"
        elif is_closed:
            eye_status = "blinking"
        else:
            eye_status = "open"

        return {
            "ear_left": round(left_ear, 3),
            "ear_right": round(right_ear, 3),
            "ear_avg": round(avg_ear, 3),
            "eye_status": eye_status,
            "eye_closed": is_closed and self.closed_frames_count >= 6,
            "closure_duration_sec": round(closure_duration_sec, 2),
            "closure_frames": self.closed_frames_count,
            "total_blinks": self.total_blinks,
            "calibrated_threshold": round(self.effective_threshold, 3)
        }

    def reset(self):
        self.closed_frames_count = 0
        self.total_blinks = 0
        self.is_currently_closed = False
        self.blink_frames = 0
        self.calibration_samples.clear()
        self.effective_threshold = self.ear_threshold
