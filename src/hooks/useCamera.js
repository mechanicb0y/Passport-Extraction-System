import { useCallback, useRef, useState } from "react";
import { dataUrlToFile } from "../utils/fileUtils.js";

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOpen(true);
    } catch (error) {
      setCameraError(error?.message ?? "Camera access was blocked.");
      setIsCameraOpen(false);
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png", 0.96);

    return {
      dataUrl,
      file: dataUrlToFile(dataUrl, `camera-passport-${Date.now()}.png`)
    };
  }, []);

  return {
    videoRef,
    isCameraOpen,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame
  };
}
