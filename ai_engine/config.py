import os
from dataclasses import dataclass

@dataclass
class FatigueConfig:
    # Calibrated Eye Aspect Ratio threshold (0.18 strictly prevents false positives when eyes are open)
    # Open eyes: ~0.22 - 0.35 | Closed eyes: ~0.06 - 0.15
    EAR_THRESHOLD: float = 0.18
    BLINK_MAX_FRAMES: int = 7            # Normal blinks last 1-7 frames (70-450ms)
    DROWSY_EYE_FRAMES: int = 12          # ~0.8s of sustained closure triggers warning
    CRITICAL_EYE_FRAMES: int = 26        # ~1.7s of sustained closure triggers critical alarm

    # Unconsciousness / Fainting Thresholds (Mayakkam / Loss of Consciousness)
    UNCONSCIOUS_HEAD_DROP_PITCH: float = -20.0  # Chin to chest / severe downward slump
    UNCONSCIOUS_HEAD_ROLL: float = 30.0        # Head slumped heavily sideways
    UNCONSCIOUS_EYE_CLOSURE_SEC: float = 2.2   # Deep sustained unresponsive closure
    UNCONSCIOUS_COLLAPSE_SEC: float = 3.0      # Face suddenly dropped out of camera frame

    # Mouth Aspect Ratio thresholds (Yawn)
    MAR_THRESHOLD: float = 0.65
    YAWN_CONSECUTIVE_FRAMES: int = 20    # Sustained mouth opening > 1.3s to filter out speech

    # Head Pose Thresholds (Degrees)
    HEAD_DOWN_PITCH_THRESHOLD: float = -18.0  # Head drooping down
    HEAD_UP_PITCH_THRESHOLD: float = 25.0     # Head tilted back
    HEAD_YAW_THRESHOLD: float = 30.0          # Distracted looking away
    HEAD_ROLL_THRESHOLD: float = 20.0         # Severe sideways tilt

    # Temporal analysis windows
    HISTORY_WINDOW_SECONDS: int = 60          # 1 minute sliding window
    PERCLOS_THRESHOLD_WARNING: float = 0.15   # 15% eye closure over window triggers warning
    PERCLOS_THRESHOLD_DANGER: float = 0.30    # 30% eye closure triggers danger
    PERCLOS_THRESHOLD_CRITICAL: float = 0.50  # 50% eye closure triggers critical

    # Target processing parameters
    TARGET_FPS: float = 15.0
    MIN_DETECTION_CONFIDENCE: float = 0.5
    MIN_TRACKING_CONFIDENCE: float = 0.5

config = FatigueConfig()
