import base64
import sys
import os
import numpy as np
from typing import Dict, Any, Optional

# Add root directory to path to import ai-engine
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from ai_engine.fatigue_engine import FatigueEngine

class AIService:
    def __init__(self):
        # Maintain isolated fatigue engines per active session
        self._engines: Dict[str, FatigueEngine] = {}

    def get_or_create_engine(self, session_id: str) -> FatigueEngine:
        if session_id not in self._engines:
            self._engines[session_id] = FatigueEngine()
        return self._engines[session_id]

    def remove_engine(self, session_id: str):
        if session_id in self._engines:
            try:
                self._engines[session_id].close()
            except Exception:
                pass
            del self._engines[session_id]

    @staticmethod
    def decode_frame(frame_data: str) -> Optional[np.ndarray]:
        """
        Decodes base64 frame string (JPEG, WebP, PNG, with or without data:image/... prefix).
        Returns an RGB numpy array uint8 (H, W, 3).
        """
        try:
            if "," in frame_data:
                # Strip data:image/...;base64,
                frame_data = frame_data.split(",", 1)[1]

            image_bytes = base64.b64decode(frame_data)

            # Fast OpenCV decode
            try:
                import cv2
                np_arr = np.frombuffer(image_bytes, np.uint8)
                bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if bgr is not None:
                    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                    return rgb
            except Exception:
                pass

            # Fallback PIL decode
            try:
                import io
                from PIL import Image
                img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                return np.array(img, dtype=np.uint8)
            except Exception:
                pass

        except Exception:
            pass
        return None

    def process_frame(
        self,
        session_id: str,
        frame_rgb: np.ndarray,
        fps: float = 15.0
    ) -> Dict[str, Any]:
        engine = self.get_or_create_engine(session_id)
        return engine.process_frame(frame_rgb, fps=fps)

ai_service = AIService()

