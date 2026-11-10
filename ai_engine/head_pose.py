import math
import numpy as np
from typing import List, Tuple, Dict, Any

class HeadPoseEstimator:
    """
    Estimates 3D Head Pose (Pitch, Yaw, Roll) using facial landmarks.
    Pitch: Head dropping down (sleep/nodding) or tilting back.
    Yaw: Looking left or right (distraction).
    Roll: Tilting ear towards shoulder (slumping/drowsiness).
    """

    # 3D Generic Anthropomorphic Model Points (in mm)
    MODEL_POINTS_3D = np.array([
        (0.0, 0.0, 0.0),             # Nose tip (index 1)
        (0.0, -330.0, -65.0),         # Chin (index 152)
        (-225.0, 170.0, -135.0),      # Left eye left corner (index 33)
        (225.0, 170.0, -135.0),       # Right eye right corner (index 263)
        (-150.0, -150.0, -125.0),     # Left Mouth corner (index 61)
        (150.0, -150.0, -125.0)       # Right mouth corner (index 291)
    ], dtype=np.float64)

    # Corresponding MediaPipe FaceMesh Indices
    LANDMARK_INDICES = [1, 152, 33, 263, 61, 291]

    def __init__(
        self,
        pitch_drop_thresh: float = -18.0,
        pitch_up_thresh: float = 25.0,
        yaw_thresh: float = 30.0,
        roll_thresh: float = 22.0
    ):
        self.pitch_drop_thresh = pitch_drop_thresh
        self.pitch_up_thresh = pitch_up_thresh
        self.yaw_thresh = yaw_thresh
        self.roll_thresh = roll_thresh
        self.drop_frames_count = 0

    def estimate_pose(
        self,
        landmarks_2d: List[Tuple[float, float]],
        frame_width: int = 640,
        frame_height: int = 480
    ) -> Dict[str, Any]:
        """
        Estimates Pitch, Yaw, Roll angles from 2D facial landmarks.
        """
        if not landmarks_2d or len(landmarks_2d) < 300:
            return {
                "pitch": 0.0,
                "yaw": 0.0,
                "roll": 0.0,
                "head_pose_status": "unknown",
                "head_dropping": False,
                "head_distracted": False,
            }

        # Extract 2D points corresponding to model points
        image_points = []
        for idx in self.LANDMARK_INDICES:
            pt = landmarks_2d[idx]
            image_points.append([pt[0] * frame_width, pt[1] * frame_height])
        image_points = np.array(image_points, dtype=np.float64)

        # Approximate camera focal length and center
        focal_length = frame_width
        center = (frame_width / 2.0, frame_height / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        # Solve PnP
        pitch, yaw, roll = 0.0, 0.0, 0.0
        try:
            import cv2
            success, rotation_vector, translation_vector = cv2.solvePnP(
                self.MODEL_POINTS_3D,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE
            )

            if success:
                rot_mat, _ = cv2.Rodrigues(rotation_vector)
                # Compute Euler angles from rotation matrix
                sy = math.sqrt(rot_mat[0, 0] * rot_mat[0, 0] + rot_mat[1, 0] * rot_mat[1, 0])
                singular = sy < 1e-6

                if not singular:
                    pitch = math.atan2(rot_mat[2, 1], rot_mat[2, 2])
                    yaw = math.atan2(-rot_mat[2, 0], sy)
                    roll = math.atan2(rot_mat[1, 0], rot_mat[0, 0])
                else:
                    pitch = math.atan2(-rot_mat[1, 2], rot_mat[1, 1])
                    yaw = math.atan2(-rot_mat[2, 0], sy)
                    roll = 0

                pitch = math.degrees(pitch)
                yaw = math.degrees(yaw)
                roll = math.degrees(roll)
        except Exception:
            # Fallback estimation using geometric relations directly from 2D points
            nose = landmarks_2d[1]
            chin = landmarks_2d[152]
            left_eye = landmarks_2d[33]
            right_eye = landmarks_2d[263]

            # Roll is angle of line connecting eyes
            dx = (right_eye[0] - left_eye[0]) * frame_width
            dy = (right_eye[1] - left_eye[1]) * frame_height
            roll = math.degrees(math.atan2(dy, dx if abs(dx) > 1e-5 else 1e-5))

            # Pitch is nose-to-chin vertical ratio compared to eye level
            eye_y = (left_eye[1] + right_eye[1]) / 2.0
            nose_chin_dist = (chin[1] - nose[1])
            eye_nose_dist = (nose[1] - eye_y)
            ratio = (nose_chin_dist / (eye_nose_dist + 1e-5))
            # Normal ratio ~ 1.6 to 2.2; dropping chin lowers ratio
            pitch = (ratio - 1.8) * 35.0

            # Yaw is asymmetry in nose distance to outer eye corners
            dist_left = abs(nose[0] - left_eye[0])
            dist_right = abs(nose[0] - right_eye[0])
            yaw = ((dist_left - dist_right) / (dist_left + dist_right + 1e-5)) * 60.0

        # Classify head status
        head_dropping = pitch < self.pitch_drop_thresh
        head_distracted = abs(yaw) > self.yaw_thresh or pitch > self.pitch_up_thresh
        head_tilted = abs(roll) > self.roll_thresh

        if head_dropping:
            self.drop_frames_count += 1
            pose_status = "dropping"
        elif head_distracted:
            self.drop_frames_count = 0
            pose_status = "distracted"
        elif head_tilted:
            self.drop_frames_count = 0
            pose_status = "tilted"
        else:
            self.drop_frames_count = 0
            pose_status = "normal"

        return {
            "pitch": round(pitch, 1),
            "yaw": round(yaw, 1),
            "roll": round(roll, 1),
            "head_pose_status": pose_status,
            "head_dropping": head_dropping,
            "head_distracted": head_distracted,
            "head_tilted": head_tilted,
            "drop_frames_count": self.drop_frames_count
        }

    def reset(self):
        self.drop_frames_count = 0

