import os
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

import numpy as np
from typing import List, Tuple, Dict, Any, Optional

class FaceDetector:
    """
    Detects driver face and tracks dense facial landmarks.
    Integrates MediaPipe FaceMesh / FaceLandmarker with fallback capability.
    """

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        max_num_faces: int = 1
    ):
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self.max_num_faces = max_num_faces
        self._mp_face_mesh = None
        self._mediapipe_failed = False
        
        # Load OpenCV cascades for robust CPU face & eye tracking
        self._init_opencv_cascades()
        self._init_mediapipe()

    def _init_opencv_cascades(self):
        try:
            import cv2
            cascade_path = cv2.data.haarcascades
            self.face_cascade = cv2.CascadeClassifier(cascade_path + 'haarcascade_frontalface_default.xml')
            self.eye_cascade = cv2.CascadeClassifier(cascade_path + 'haarcascade_eye.xml')
            self.eye_glasses_cascade = cv2.CascadeClassifier(cascade_path + 'haarcascade_eye_tree_eyeglasses.xml')
        except Exception:
            self.face_cascade = None
            self.eye_cascade = None
            self.eye_glasses_cascade = None

    def _init_mediapipe(self):
        if self._mediapipe_failed:
            return
        try:
            import mediapipe as mp
            self._mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=self.max_num_faces,
                refine_landmarks=False,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence
            )
        except Exception:
            self._mp_face_mesh = None
            self._mediapipe_failed = True

    def close(self):
        """Release underlying MediaPipe native threads and resources."""
        if self._mp_face_mesh is not None:
            try:
                self._mp_face_mesh.close()
            except Exception:
                pass
            self._mp_face_mesh = None

    def __del__(self):
        self.close()

    def assess_lighting(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        """Evaluates image lighting conditions and contrast."""
        if frame_bgr is None or frame_bgr.size == 0:
            return {"brightness": 0, "status": "no_frame"}

        # Calculate brightness from grayscale mean
        if len(frame_bgr.shape) == 3:
            gray = np.dot(frame_bgr[...,:3], [0.114, 0.587, 0.299])
        else:
            gray = frame_bgr

        mean_brightness = float(np.mean(gray))

        if mean_brightness < 40.0:
            lighting = "too_dark"
        elif mean_brightness > 220.0:
            lighting = "too_bright"
        else:
            lighting = "good"

        return {
            "brightness": round(mean_brightness, 1),
            "status": lighting
        }

    def process_frame(
        self,
        frame_rgb: np.ndarray
    ) -> Dict[str, Any]:
        """
        Processes an RGB image frame.
        Returns:
            face_detected (bool)
            confidence (float)
            landmarks (List of (x, y) normalized coordinates)
            bounding_box (x, y, w, h)
            lighting (dict)
        """
        if frame_rgb is None or frame_rgb.size == 0:
            return {
                "face_detected": False,
                "confidence": 0.0,
                "landmarks": [],
                "bbox": None,
                "lighting": {"brightness": 0, "status": "no_frame"}
            }

        h, w = frame_rgb.shape[:2]
        lighting = self.assess_lighting(frame_rgb)

        # Lazy init mediapipe if not yet initialized
        if self._mp_face_mesh is None:
            self._init_mediapipe()

        if self._mp_face_mesh is not None:
            try:
                results = self._mp_face_mesh.process(frame_rgb)
                if results.multi_face_landmarks:
                    face_landmarks = results.multi_face_landmarks[0]
                    landmarks = [(lm.x, lm.y) for lm in face_landmarks.landmark]

                    # Compute bounding box
                    xs = [p[0] * w for p in landmarks]
                    ys = [p[1] * h for p in landmarks]
                    bbox = {
                        "x": int(min(xs)),
                        "y": int(min(ys)),
                        "w": int(max(xs) - min(xs)),
                        "h": int(max(ys) - min(ys))
                    }

                    confidence = 0.95 if lighting["status"] == "good" else 0.75

                    return {
                        "face_detected": True,
                        "confidence": confidence,
                        "landmarks": landmarks,
                        "bbox": bbox,
                        "lighting": lighting
                    }
            except Exception:
                # If MediaPipe fails (e.g. NSOpenGL on macOS), safely release and permanently disable it
                try:
                    self._mp_face_mesh.close()
                except Exception:
                    pass
                self._mp_face_mesh = None
                self._mediapipe_failed = True

        # Robust High-Speed CPU Face & Eye Detection via OpenCV
        if self.face_cascade is not None:
            try:
                import cv2
                gray = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=4, minSize=(70, 70))

                if len(faces) > 0:
                    fx, fy, fw, fh = faces[0]

                    # Scan upper face (18% to 52% of height) for open eyes
                    eye_roi_y1 = fy + int(fh * 0.18)
                    eye_roi_y2 = fy + int(fh * 0.52)
                    eye_roi = gray[eye_roi_y1:eye_roi_y2, fx:fx + fw]

                    eyes = ()
                    if self.eye_cascade is not None and eye_roi.size > 0:
                        eyes = self.eye_cascade.detectMultiScale(
                            eye_roi,
                            scaleFactor=1.1,
                            minNeighbors=3,
                            minSize=(int(fw * 0.10), int(fh * 0.07))
                        )
                    if len(eyes) == 0 and self.eye_glasses_cascade is not None and eye_roi.size > 0:
                        eyes = self.eye_glasses_cascade.detectMultiScale(
                            eye_roi,
                            scaleFactor=1.1,
                            minNeighbors=2,
                            minSize=(int(fw * 0.10), int(fh * 0.07))
                        )

                    # Eyes detected in eye zone = eyes are open
                    # No eyes detected in eye zone = eyes closed
                    are_eyes_open = len(eyes) >= 1

                    landmarks = self._synthesize_landmarks_from_bbox(fx, fy, fw, fh, w, h, are_eyes_open=are_eyes_open)
                    return {
                        "face_detected": True,
                        "confidence": 0.90 if are_eyes_open else 0.85,
                        "landmarks": landmarks,
                        "bbox": {"x": int(fx), "y": int(fy), "w": int(fw), "h": int(fh)},
                        "lighting": lighting
                    }
            except Exception:
                pass

        return {
            "face_detected": False,
            "confidence": 0.0,
            "landmarks": [],
            "bbox": None,
            "lighting": lighting
        }

    def _synthesize_landmarks_from_bbox(
        self,
        fx: int,
        fy: int,
        fw: int,
        fh: int,
        img_w: int,
        img_h: int,
        are_eyes_open: bool = True
    ) -> List[Tuple[float, float]]:
        """Generates standard landmark indices from bbox with actual open/closed eye state."""
        landmarks = [(0.5, 0.5)] * 478
        # Nose tip
        landmarks[1] = ((fx + fw * 0.5) / img_w, (fy + fh * 0.55) / img_h)
        # Chin
        landmarks[152] = ((fx + fw * 0.5) / img_w, (fy + fh * 0.95) / img_h)

        # Eye locations
        lx = fx + fw * 0.32
        rx = fx + fw * 0.68
        ly = fy + fh * 0.37
        ry = fy + fh * 0.37
        ew = fw * 0.12

        # In normalized coords:
        # If open: eh gives EAR ~ 0.32
        # If closed: eh gives EAR ~ 0.07
        eh = (fh * 0.035) if are_eyes_open else (fh * 0.007)

        # Left eye
        landmarks[33] = ((lx - ew) / img_w, ly / img_h)
        landmarks[160] = (lx / img_w, (ly - eh) / img_h)
        landmarks[158] = ((lx + ew * 0.5) / img_w, (ly - eh) / img_h)
        landmarks[133] = ((lx + ew) / img_w, ly / img_h)
        landmarks[153] = ((lx + ew * 0.5) / img_w, (ly + eh) / img_h)
        landmarks[144] = (lx / img_w, (ly + eh) / img_h)

        # Right eye
        landmarks[362] = ((rx - ew) / img_w, ry / img_h)
        landmarks[385] = (rx / img_w, (ry - eh) / img_h)
        landmarks[387] = ((rx + ew * 0.5) / img_w, (ry - eh) / img_h)
        landmarks[263] = ((rx + ew) / img_w, ry / img_h)
        landmarks[373] = ((rx + ew * 0.5) / img_w, (ry + eh) / img_h)
        landmarks[380] = (rx / img_w, (ry + eh) / img_h)

        # Mouth
        mx = fx + fw * 0.5
        my = fy + fh * 0.74
        mw = fw * 0.16
        mh = fh * 0.02
        landmarks[61] = ((mx - mw) / img_w, my / img_h)
        landmarks[291] = ((mx + mw) / img_w, my / img_h)
        landmarks[13] = (mx / img_w, (my - mh) / img_h)
        landmarks[14] = (mx / img_w, (my + mh) / img_h)
        landmarks[81] = ((mx - mw * 0.5) / img_w, (my - mh * 0.8) / img_h)
        landmarks[178] = ((mx - mw * 0.5) / img_w, (my + mh * 0.8) / img_h)
        landmarks[311] = ((mx + mw * 0.5) / img_w, (my - mh * 0.8) / img_h)
        landmarks[402] = ((mx + mw * 0.5) / img_w, (my + mh * 0.8) / img_h)

        return landmarks

