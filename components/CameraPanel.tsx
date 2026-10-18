// File: components/CameraPanel.tsx
"use client";

import { useRef, useState } from "react";
import { Camera, CameraOff, Flashlight, ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { decodeImageFile } from "@/lib/barcode";
import { cn } from "@/lib/cn";
import { useScanner } from "@/hooks/useScanner";
import type { DecodeResult, ScanSource } from "@/lib/types";

interface Props {
  onDetect: (result: DecodeResult, source: ScanSource) => void;
}

export function CameraPanel({ onDetect }: Props) {
  const { videoRef, state, error, torchSupported, torchOn, start, stop, toggleTorch } = useScanner(
    (result) => onDetect(result, "camera")
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const scanning = state === "scanning";

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setBusy(true);
    setPhotoMessage(null);
    try {
      const result = await decodeImageFile(file);
      if (result) onDetect(result, "photo");
      else setPhotoMessage("No barcode found. Try a sharper, closer photo with the whole code visible.");
    } catch {
      setPhotoMessage("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Viewfinder */}
      <div className="relative aspect-[4/3] w-full bg-slate-950">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn("size-full object-cover", !scanning && "invisible")}
        />

        {!scanning && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="space-y-3 text-slate-400">
              {state === "starting" ? (
                <Loader2 className="mx-auto size-10 animate-spin" aria-hidden />
              ) : (
                <CameraOff className="mx-auto size-10" aria-hidden />
              )}
              <p className="text-sm">
                {state === "starting" ? "Starting camera…" : "Camera is off"}
              </p>
            </div>
          </div>
        )}

        {scanning && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-[42%] w-[78%]">
              <span className="absolute left-0 top-0 size-7 rounded-tl-lg border-l-4 border-t-4 border-white" />
              <span className="absolute right-0 top-0 size-7 rounded-tr-lg border-r-4 border-t-4 border-white" />
              <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-4 border-l-4 border-white" />
              <span className="absolute bottom-0 right-0 size-7 rounded-br-lg border-b-4 border-r-4 border-white" />
              <span className="scan-line absolute inset-x-2 h-0.5 rounded bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.9)]" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          {scanning ? (
            <Button variant="secondary" onClick={stop}>
              <CameraOff className="size-4" aria-hidden /> Stop camera
            </Button>
          ) : (
            <Button onClick={start} disabled={state === "starting"}>
              <Camera className="size-4" aria-hidden /> Start camera
            </Button>
          )}
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ImageUp className="size-4" aria-hidden />
            )}
            Upload photo
          </Button>
        </div>

        {scanning && torchSupported && (
          <Button variant={torchOn ? "primary" : "ghost"} onClick={toggleTorch} className="w-full">
            <Flashlight className="size-4" aria-hidden /> {torchOn ? "Turn light off" : "Turn light on"}
          </Button>
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />

        <p
          aria-live="polite"
          className={cn(
            "text-sm",
            error || photoMessage ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
          )}
        >
          {error ??
            photoMessage ??
            (scanning
              ? "Hold the code flat inside the frame and keep steady."
              : "Start the camera or upload a photo of a barcode or QR code.")}
        </p>
      </div>
    </section>
  );
}