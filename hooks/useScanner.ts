// File: hooks/useScanner.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildHints, loadZXing } from "@/lib/barcode";
import type { DecodeResult } from "@/lib/types";

export type CameraState = "idle" | "starting" | "scanning" | "error";

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
      return "Camera permission was denied. Allow camera access in your browser settings and try again.";
    case "NotFoundError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again.";
    case "OverconstrainedError":
      return "This camera does not support the requested settings.";
    default:
      return "Could not start the camera. You can still scan from a photo.";
  }
}

function getVideoTrack(video: HTMLVideoElement | null): MediaStreamTrack | null {
  const stream = video?.srcObject;
  return stream instanceof MediaStream ? (stream.getVideoTracks()[0] ?? null) : null;
}

/** Owns the camera lifecycle: start, stop, torch, cleanup on unmount. */
export function useScanner(onDetect: (result: DecodeResult) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<{ reset: () => void } | null>(null);
  const onDetectRef = useRef(onDetect);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Always call the latest callback without restarting the camera.
  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const stop = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
    setTorchOn(false);
    setTorchSupported(false);
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("Camera access needs a secure (https) connection and a modern browser.");
      return;
    }
    setError(null);
    setState("starting");
    try {
      const Z = await loadZXing();
      const reader = new Z.BrowserMultiFormatReader(buildHints(Z), 250);
      readerRef.current = reader;

      await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current!,
        (result) => {
          if (result) {
            onDetectRef.current({
              text: result.getText(),
              format: Z.BarcodeFormat[result.getBarcodeFormat()],
            });
          }
        }
      );

      const caps = getVideoTrack(videoRef.current)?.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      setTorchSupported(Boolean(caps?.torch));
      setState("scanning");
    } catch (err) {
      readerRef.current?.reset();
      readerRef.current = null;
      setState("error");
      setError(cameraErrorMessage(err));
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = getVideoTrack(videoRef.current);
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      /* torch not available on this camera */
    }
  }, [torchOn]);

  // Release the camera when leaving the page.
  useEffect(() => () => readerRef.current?.reset(), []);

  return { videoRef, state, error, torchSupported, torchOn, start, stop, toggleTorch };
}