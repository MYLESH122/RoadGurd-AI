import math
from typing import List, Tuple, Dict, Any

class YawnDetector:
    """
    Computes Mouth Aspect Ratio (MAR) to detect yawning while distinguishing
    normal speech movement through temporal thresholding.
    MAR = (||p14 - p18|| + ||p15 - p17||) / (2 * ||p13 - p16||)
    """

    # MediaPipe FaceMesh mouth indices:
    # Top lip points: 13, 14 (inner top)
    # Bottom lip points: 17, 18 (inner bottom)
    # Left mouth corner: 78
    # Right mouth corner: 308
    # Additional vertical points: 82, 312 (top), 87, 317 (bottom)
    MOUTH_TOP_LIP = 13
    MOUTH_BOTTOM_LIP = 14
    MOUTH_LEFT_CORNER = 61
    MOUTH_RIGHT_CORNER = 291
    MOUTH_UPPER_INNER = [81, 13, 311]
    MOUTH_LOWER_INNER = [178, 14, 402]

    def __init__(self, mar_threshold: float = 0.65, consecutive_frames_threshold: int = 18):
        self.mar_threshold = mar_threshold
        self.consecutive_frames_threshold = consecutive_frames_threshold
        self.mouth_open_frames = 0
        self.yawn_count = 0
        self.is_currently_yawning = False

    @staticmethod
    def _euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    def calculate_mar(self, landmarks_2d: List[Tuple[float, float]]) -> float:
        """Calculates Mouth Aspect Ratio."""
        if len(landmarks_2d) < 405:
            return 0.1

        # Vertical inner lip distance
        v1 = self._euclidean_distance(landmarks_2d[self.MOUTH_UPPER_INNER[0]], landmarks_2d[self.MOUTH_LOWER_INNER[0]])
        v2 = self._euclidean_distance(landmarks_2d[self.MOUTH_TOP_LIP], landmarks_2d[self.MOUTH_BOTTOM_LIP])
        v3 = self._euclidean_distance(landmarks_2d[self.MOUTH_UPPER_INNER[2]], landmarks_2d[self.MOUTH_LOWER_INNER[2]])

        # Horizontal mouth width
        h = self._euclidean_distance(landmarks_2d[self.MOUTH_LEFT_CORNER], landmarks_2d[self.MOUTH_RIGHT_CORNER])

        if h < 1e-6:
            return 0.0

        mar = (v1 + v2 + v3) / (3.0 * h)
        return mar

    def process_frame(
        self,
        landmarks_2d: List[Tuple[float, float]],
        fps: float = 15.0
    ) -> Dict[str, Any]:
        """
        Processes frame for yawn detection.
        Normal speaking opens the mouth briefly (< 0.5s).
        Yawning is characterized by sustained wide opening (> 1.2s).
        """
        mar = self.calculate_mar(landmarks_2d)
        is_wide_open = mar >= self.mar_threshold

        if is_wide_open:
            self.mouth_open_frames += 1
            if self.mouth_open_frames >= self.consecutive_frames_threshold and not self.is_currently_yawning:
                self.yawn_count += 1
                self.is_currently_yawning = True
        else:
            self.mouth_open_frames = 0
            self.is_currently_yawning = False

        duration_sec = self.mouth_open_frames / max(fps, 1.0)
        yawn_active = self.is_currently_yawning

        return {
            "mar": round(mar, 3),
            "yawn_detected": yawn_active,
            "yawn_count": self.yawn_count,
            "mouth_open_duration_sec": round(duration_sec, 2),
            "mouth_status": "yawning" if yawn_active else ("open" if is_wide_open else "closed")
        }

    def reset(self):
        self.mouth_open_frames = 0
        self.yawn_count = 0
        self.is_currently_yawning = False

