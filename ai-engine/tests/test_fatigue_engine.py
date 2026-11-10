import unittest
import numpy as np
import sys
import os

# Add parent directory to path so imports work cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from eye_detection import EyeDetector
from yawn_detection import YawnDetector
from head_pose import HeadPoseEstimator
from fatigue_engine import FatigueEngine

class TestFatigueDetectionEngine(unittest.TestCase):
    def setUp(self):
        self.engine = FatigueEngine()
        self.eye_detector = EyeDetector(ear_threshold=0.22)
        self.yawn_detector = YawnDetector(mar_threshold=0.65)
        self.pose_estimator = HeadPoseEstimator()

    def test_ear_calculation_open_and_closed(self):
        # Synthesize standard 478 landmarks
        landmarks = [(0.5, 0.5)] * 478

        # Open eye landmarks setup (left eye)
        # 33 (outer), 160 (top-outer), 158 (top-inner), 133 (inner), 153 (bottom-inner), 144 (bottom-outer)
        landmarks[33] = (0.2, 0.3)
        landmarks[133] = (0.3, 0.3)
        landmarks[160] = (0.24, 0.26)
        landmarks[158] = (0.26, 0.26)
        landmarks[144] = (0.24, 0.34)
        landmarks[153] = (0.26, 0.34)

        ear_open = self.eye_detector.calculate_ear(landmarks, EyeDetector.LEFT_EYE_INDICES)
        self.assertGreater(ear_open, 0.25, "Open eye EAR should be > 0.25")

        # Now collapse vertical landmarks to simulate closed eye
        landmarks[160] = (0.24, 0.298)
        landmarks[158] = (0.26, 0.298)
        landmarks[144] = (0.24, 0.302)
        landmarks[153] = (0.26, 0.302)

        ear_closed = self.eye_detector.calculate_ear(landmarks, EyeDetector.LEFT_EYE_INDICES)
        self.assertLess(ear_closed, 0.15, "Closed eye EAR should be < 0.15")

    def test_yawn_mar_calculation(self):
        landmarks = [(0.5, 0.5)] * 478
        # Corners at (0.4, 0.6) and (0.6, 0.6) -> width = 0.2
        landmarks[YawnDetector.MOUTH_LEFT_CORNER] = (0.4, 0.6)
        landmarks[YawnDetector.MOUTH_RIGHT_CORNER] = (0.6, 0.6)

        # Closed mouth lips
        landmarks[YawnDetector.MOUTH_TOP_LIP] = (0.5, 0.59)
        landmarks[YawnDetector.MOUTH_BOTTOM_LIP] = (0.5, 0.61)
        landmarks[YawnDetector.MOUTH_UPPER_INNER[0]] = (0.45, 0.59)
        landmarks[YawnDetector.MOUTH_LOWER_INNER[0]] = (0.45, 0.61)
        landmarks[YawnDetector.MOUTH_UPPER_INNER[2]] = (0.55, 0.59)
        landmarks[YawnDetector.MOUTH_LOWER_INNER[2]] = (0.55, 0.61)

        mar_closed = self.yawn_detector.calculate_mar(landmarks)
        self.assertLess(mar_closed, 0.3, "Closed mouth MAR should be small")

        # Open mouth for yawn (height = 0.16, width = 0.20 -> MAR ~ 0.8)
        landmarks[YawnDetector.MOUTH_TOP_LIP] = (0.5, 0.52)
        landmarks[YawnDetector.MOUTH_BOTTOM_LIP] = (0.5, 0.68)
        landmarks[YawnDetector.MOUTH_UPPER_INNER[0]] = (0.45, 0.52)
        landmarks[YawnDetector.MOUTH_LOWER_INNER[0]] = (0.45, 0.68)
        landmarks[YawnDetector.MOUTH_UPPER_INNER[2]] = (0.55, 0.52)
        landmarks[YawnDetector.MOUTH_LOWER_INNER[2]] = (0.55, 0.68)

        mar_yawn = self.yawn_detector.calculate_mar(landmarks)
        self.assertGreater(mar_yawn, 0.65, "Yawning MAR should exceed 0.65")

    def test_missing_face_behavior(self):
        # Empty frame should not trigger unconsciousness/sleep
        blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        res = self.engine.process_frame(blank_frame, fps=15.0)

        self.assertFalse(res["face_detected"])
        self.assertEqual(res["eye_status"], "not_visible")
        self.assertEqual(res["head_pose"], "not_visible")
        self.assertIn(res["risk_level"], ["normal", "warning"])

    def test_sustained_closure_escalates_to_critical(self):
        # Simulate sequence of frames with closed eyes
        engine = FatigueEngine()
        # Create a synthetic frame with face
        face_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128
        # Mock face detector output to feed closed eyes
        engine.face_detector.process_frame = lambda f: {
            "face_detected": True,
            "confidence": 0.95,
            "landmarks": [(0.5, 0.5)] * 478,
            "bbox": {"x": 200, "y": 150, "w": 240, "h": 240},
            "lighting": {"brightness": 128, "status": "good"}
        }
        # Mock eye detector to report closed eye
        engine.eye_detector.process_frame = lambda lms, fps: {
            "ear_left": 0.10,
            "ear_right": 0.10,
            "ear_avg": 0.10,
            "eye_status": "prolonged_closed",
            "eye_closed": True,
            "closure_duration_sec": 2.2,
            "closure_frames": 33,
            "total_blinks": 0
        }

        # Process multiple frames
        result = None
        for _ in range(10):
            result = engine.process_frame(face_frame, fps=15.0)

        self.assertIsNotNone(result)
        self.assertEqual(result["risk_level"], "critical")
        self.assertGreaterEqual(result["fatigue_score"], 80)
        self.assertEqual(result["eye_status"], "prolonged_closed")

if __name__ == "__main__":
    unittest.main()

