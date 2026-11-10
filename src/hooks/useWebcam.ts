import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseWebcamOptions {
  width?: number;
  height?: number;
  fps?: number;
}

export function useWebcam(options: UseWebcamOptions = {}) {
  const { width = 640, height = 480, fps = 15 } = options;

  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize hidden canvas for frame extraction
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;

    return () => {
      canvasRef.current = null;
    };
  }, [width, height]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: fps, max: 20 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setHasPermission(true);
    } catch (err: unknown) {
      const e = err as Error;
      let msg = 'Failed to access camera';
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings.';
        setHasPermission(false);
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        msg = 'No video camera detected on this computer.';
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application.';
      } else {
        msg = e.message || msg;
      }
      setError(msg);
      setIsActive(false);
    }
  }, [width, height, fps]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureFrameBase64 = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Return compressed JPEG data URL
    return canvas.toDataURL('image/jpeg', 0.65);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    error,
    hasPermission,
    startCamera,
    stopCamera,
    captureFrameBase64
  };
}

