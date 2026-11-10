import datetime
import collections
from typing import Dict, Any, Optional
import numpy as np

try:
    from .config import config, FatigueConfig
    from .face_detection import FaceDetector
    from .eye_detection import EyeDetector
    from .yawn_detection import YawnDetector
    from .head_pose import HeadPoseEstimator
except (ImportError, ValueError):
    from config import config, FatigueConfig
    from face_detection import FaceDetector
    from eye_detection import EyeDetector
    from yawn_detection import YawnDetector
    from head_pose import HeadPoseEstimator

class FatigueEngine:
    """
    Core AI Decision Engine.
    Fuses face landmarks, Eye Aspect Ratio (EAR), Mouth Aspect Ratio (MAR),
    and 3D Head Pose with temporal sliding-window analysis (PERCLOS, blink frequency,
    prolonged closure, yawning, nodding) to compute actual fatigue scores and risk levels.
    """

    def __init__(self, cfg: Optional[FatigueConfig] = None):
        self.cfg = cfg or config
        self.face_detector = FaceDetector(
            min_detection_confidence=self.cfg.MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=self.cfg.MIN_TRACKING_CONFIDENCE
        )
        self.eye_detector = EyeDetector(ear_threshold=self.cfg.EAR_THRESHOLD)
        self.yawn_detector = YawnDetector(
            mar_threshold=self.cfg.MAR_THRESHOLD,
            consecutive_frames_threshold=self.cfg.YAWN_CONSECUTIVE_FRAMES
        )
        self.head_pose_estimator = HeadPoseEstimator(
            pitch_drop_thresh=self.cfg.HEAD_DOWN_PITCH_THRESHOLD,
            pitch_up_thresh=self.cfg.HEAD_UP_PITCH_THRESHOLD,
            yaw_thresh=self.cfg.HEAD_YAW_THRESHOLD,
            roll_thresh=self.cfg.HEAD_ROLL_THRESHOLD
        )

        # Sliding window history for PERCLOS (Percentage of Eye Closure)
        # At 15 fps, 60 seconds = 900 frames
        self.history_size = int(self.cfg.TARGET_FPS * self.cfg.HISTORY_WINDOW_SECONDS)
        self.eye_closed_history = collections.deque(maxlen=self.history_size)
        self.yawn_history = collections.deque(maxlen=self.history_size)
        self.head_drop_history = collections.deque(maxlen=self.history_size)

        # Face missing tracking
        self.missing_face_frames = 0
        self.total_frames_processed = 0

        # Temporal smoothed fatigue score
        self.smoothed_fatigue_score = 0.0

        # Driver Presence and Unconsciousness / Fainting Tracking (Mayakkam)
        self.driver_presence_established = False
        self.consecutive_face_frames = 0
        self.head_slumped_frames = 0
        self.unconscious_detected = False
        self.unconscious_reason = ""

    def process_frame(
        self,
        frame_rgb: np.ndarray,
        fps: float = 15.0
    ) -> Dict[str, Any]:
        """
        Processes a single video frame and outputs real-time fatigue assessment.
        """
        self.total_frames_processed += 1
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Step 1: Detect face & landmarks
        face_res = self.face_detector.process_frame(frame_rgb)
        face_detected = face_res["face_detected"]
        confidence = face_res["confidence"]

        if not face_detected:
            self.missing_face_frames += 1
            missing_duration = self.missing_face_frames / max(fps, 1.0)
            self.eye_closed_history.append(False)
            self.yawn_history.append(False)
            self.head_drop_history.append(False)

            # UNCONSCIOUSNESS CHECK: If driver was confirmed present and suddenly collapsed out of view
            if self.driver_presence_established and missing_duration >= self.cfg.UNCONSCIOUS_COLLAPSE_SEC:
                self.unconscious_detected = True
                self.unconscious_reason = f"Driver collapsed out of camera view for {missing_duration:.1f}s (possible fainting / unconsciousness)"
                risk = "critical"
                fatigue_score = 100
            else:
                self.unconscious_detected = False
                self.unconscious_reason = ""
                risk = "normal"
                fatigue_score = 0

            return {
                "face_detected": False,
                "eye_status": "not_visible",
                "eye_closure_duration": 0.0,
                "yawn_detected": False,
                "head_pose": "not_visible",
                "unconscious_detected": self.unconscious_detected,
                "unconscious_reason": self.unconscious_reason,
                "fatigue_score": fatigue_score,
                "risk_level": risk,
                "confidence": 0.0,
                "timestamp": now_iso,
                "details": {
                    "missing_duration_sec": round(missing_duration, 1),
                    "lighting": face_res.get("lighting", {})
                }
            }

        self.missing_face_frames = 0
        self.consecutive_face_frames += 1
        if self.consecutive_face_frames >= 12:
            self.driver_presence_established = True
        landmarks = face_res["landmarks"]
        h, w = frame_rgb.shape[:2]

        # Step 2: Eye closure and EAR
        eye_res = self.eye_detector.process_frame(landmarks, fps=fps)
        self.eye_closed_history.append(eye_res["eye_closed"])

        # Step 3: Yawn and MAR
        yawn_res = self.yawn_detector.process_frame(landmarks, fps=fps)
        self.yawn_history.append(yawn_res["yawn_detected"])

        # Step 4: Head Pose estimation
        head_res = self.head_pose_estimator.estimate_pose(landmarks, frame_width=w, frame_height=h)
        self.head_drop_history.append(head_res["head_dropping"])

        # Step 5: Multi-factor Fatigue Scoring
        # 5.1 PERCLOS (Proportion of time eyes closed in the sliding window)
        if len(self.eye_closed_history) > 0:
            perclos = sum(self.eye_closed_history) / float(len(self.eye_closed_history))
        else:
            perclos = 0.0

        closure_sec = eye_res["closure_duration_sec"]
        is_yawning = yawn_res["yawn_detected"]
        is_head_drop = head_res["head_dropping"]
        is_head_tilt = head_res["head_tilted"]
        head_pose_name = head_res["head_pose_status"]

        # Calculate raw instant score (0 to 100)
        instant_score = 0.0

        # A. Eye closure contribution
        if closure_sec >= 2.0:
            # Sustained closure >= 2.0s is critical danger
            instant_score += 90.0
        elif closure_sec >= 1.0:
            # Closure between 1.0s and 2.0s is serious danger
            instant_score += 65.0 + (closure_sec - 1.0) * 25.0
        elif closure_sec >= 0.4:
            # Extended closure longer than a normal blink
            instant_score += 35.0
        elif eye_res["eye_closed"]:
            # Brief closure
            instant_score += 15.0

        # B. PERCLOS contribution (cumulative fatigue)
        if perclos >= self.cfg.PERCLOS_THRESHOLD_CRITICAL:
            instant_score = max(instant_score, 88.0)
        elif perclos >= self.cfg.PERCLOS_THRESHOLD_DANGER:
            instant_score = max(instant_score, 65.0)
        elif perclos >= self.cfg.PERCLOS_THRESHOLD_WARNING:
            instant_score = max(instant_score, 35.0)

        # C. Yawning contribution
        if is_yawning:
            instant_score += 30.0

        # D. Head position contribution
        if is_head_drop:
            # Nodding/dropping forward while drowsy
            if eye_res["eye_closed"] or closure_sec > 0.3:
                instant_score += 50.0  # lethal combination: eyes closed + head down
            else:
                instant_score += 30.0
        elif is_head_tilt:
            instant_score += 15.0

        instant_score = min(max(instant_score, 0.0), 100.0)

        # Apply exponential moving average (temporal smoothing)
        # alpha=0.3 allows quick response to sharp danger while filtering single-frame noise
        alpha = 0.35 if instant_score > self.smoothed_fatigue_score else 0.15
        self.smoothed_fatigue_score = alpha * instant_score + (1.0 - alpha) * self.smoothed_fatigue_score
        final_fatigue_score = int(round(self.smoothed_fatigue_score))

        pitch = head_res["pitch"]
        roll = head_res["roll"]

        # Check for Unconsciousness / Fainting Indicators (Mayakkam):
        # A. Head slumped heavily forward (chin dropped down towards chest) with closed or drooping eyes
        is_slumped_forward = (pitch < self.cfg.UNCONSCIOUS_HEAD_DROP_PITCH and (eye_res["eye_closed"] or closure_sec >= 0.8)) or pitch < -32.0
        # B. Head slumped sideways (fainted sideways) with closed eyes
        is_slumped_sideways = abs(roll) > self.cfg.UNCONSCIOUS_HEAD_ROLL and (eye_res["eye_closed"] or closure_sec >= 0.8)

        if is_slumped_forward or is_slumped_sideways:
            self.head_slumped_frames += 1
        else:
            self.head_slumped_frames = max(0, self.head_slumped_frames - 2)

        slump_sec = self.head_slumped_frames / max(fps, 1.0)

        if slump_sec >= 1.4:
            self.unconscious_detected = True
            direction = "forward (chin to chest)" if is_slumped_forward else "sideways"
            self.unconscious_reason = f"Driver head slumped {direction} unresponsive ({slump_sec:.1f}s)"
        elif closure_sec >= self.cfg.UNCONSCIOUS_EYE_CLOSURE_SEC:
            self.unconscious_detected = True
            self.unconscious_reason = f"Driver unresponsive with sustained deep eye closure ({closure_sec:.1f}s)"
        else:
            self.unconscious_detected = False
            self.unconscious_reason = ""

        # Automatic Recovery Detection:
        # If the driver has recovered, opened eyes, and head is upright forward:
        if eye_res["eye_status"] == "open" and pitch > -15.0 and abs(roll) < 22.0:
            self.head_slumped_frames = 0
            self.unconscious_detected = False
            self.unconscious_reason = ""
            self.smoothed_fatigue_score = min(self.smoothed_fatigue_score * 0.4, 18.0)
            final_fatigue_score = int(round(self.smoothed_fatigue_score))

        # Risk categorization:
        if self.unconscious_detected:
            risk_level = "critical"
            final_fatigue_score = 100
        elif closure_sec >= 1.8 or (closure_sec >= 1.2 and final_fatigue_score >= 75):
            risk_level = "critical"
        elif closure_sec >= 1.2 or (closure_sec >= 0.8 and final_fatigue_score >= 50):
            risk_level = "danger"
        elif closure_sec >= 0.8 or eye_res["eye_status"] == "prolonged_closed" or (perclos >= self.cfg.PERCLOS_THRESHOLD_WARNING and eye_res["eye_closed"]):
            risk_level = "warning"
        else:
            risk_level = "normal"

        return {
            "face_detected": True,
            "eye_status": eye_res["eye_status"],
            "eye_closure_duration": closure_sec,
            "yawn_detected": is_yawning,
            "head_pose": head_pose_name,
            "unconscious_detected": self.unconscious_detected,
            "unconscious_reason": self.unconscious_reason,
            "fatigue_score": final_fatigue_score,
            "risk_level": risk_level,
            "confidence": round(confidence, 2),
            "timestamp": now_iso,
            "metrics": {
                "ear": eye_res["ear_avg"],
                "mar": yawn_res["mar"],
                "pitch": head_res["pitch"],
                "yaw": head_res["yaw"],
                "roll": head_res["roll"],
                "perclos": round(perclos, 3),
                "total_blinks": eye_res["total_blinks"],
                "total_yawns": yawn_res["yawn_count"],
                "lighting": face_res.get("lighting", {})
            }
        }

    def close(self):
        """Releases underlying detector and graph resources."""
        self.face_detector.close()

    def __del__(self):
        self.close()

    def reset(self):
        """Resets all session tracking state."""
        self.eye_detector.reset()
        self.yawn_detector.reset()
        self.head_pose_estimator.reset()
        self.eye_closed_history.clear()
        self.yawn_history.clear()
        self.head_drop_history.clear()
        self.missing_face_frames = 0
        self.smoothed_fatigue_score = 0.0
        self.total_frames_processed = 0
        self.driver_presence_established = False
        self.consecutive_face_frames = 0
        self.head_slumped_frames = 0
        self.unconscious_detected = False
        self.unconscious_reason = ""
