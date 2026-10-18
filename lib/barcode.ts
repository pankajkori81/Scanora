// File: lib/barcode.ts
// ZXing configuration and the "scan a photo" pipeline.
// ZXing is loaded with a dynamic import so it only ships to the browser when needed.

import type { DecodeResult } from "./types";

export type ZXingModule = typeof import("@zxing/library");

export const loadZXing = (): Promise<ZXingModule> => import("@zxing/library");

/** Limiting formats and enabling TRY_HARDER makes decoding faster and more accurate. */
export function buildHints(Z: ZXingModule) {
  const hints = new Map<import("@zxing/library").DecodeHintType, unknown>();
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [
    Z.BarcodeFormat.EAN_13,
    Z.BarcodeFormat.EAN_8,
    Z.BarcodeFormat.UPC_A,
    Z.BarcodeFormat.UPC_E,
    Z.BarcodeFormat.CODE_128,
    Z.BarcodeFormat.CODE_39,
    Z.BarcodeFormat.ITF,
    Z.BarcodeFormat.QR_CODE,
    Z.BarcodeFormat.DATA_MATRIX,
  ]);
  return hints;
}

function decodeGray(Z: ZXingModule, gray: Uint8ClampedArray, w: number, h: number) {
  const reader = new Z.MultiFormatReader();
  reader.setHints(buildHints(Z));
  // Two binarizers handle different lighting conditions.
  for (const Binarizer of [Z.HybridBinarizer, Z.GlobalHistogramBinarizer]) {
    try {
      const source = new Z.RGBLuminanceSource(gray, w, h);
      return reader.decode(new Z.BinaryBitmap(new Binarizer(source)));
    } catch {
      /* NotFoundException: try the next strategy */
    }
  }
  return null;
}

const MAX_SIDE = 1600; // downscale huge phone photos for speed
const ANGLES = [0, 4, -4, 8, -8, 12, -12, 18, -18, 25, -25, 90, -90, 180];

/** Decodes a barcode/QR from an image file, retrying at several tilt angles. */
export async function decodeImageFile(file: File): Promise<DecodeResult | null> {
  const Z = await loadZXing();
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    for (const deg of ANGLES) {
      const rad = (deg * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const cw = Math.ceil(w * cos + h * sin);
      const ch = Math.ceil(w * sin + h * cos);

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, cw, ch);
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate(rad);
      ctx.drawImage(bitmap, -w / 2, -h / 2, w, h);

      const rgba = ctx.getImageData(0, 0, cw, ch).data;
      const gray = new Uint8ClampedArray(cw * ch);
      for (let i = 0; i < gray.length; i++) {
        gray[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
      }

      const result = decodeGray(Z, gray, cw, ch);
      if (result) {
        return { text: result.getText(), format: Z.BarcodeFormat[result.getBarcodeFormat()] };
      }
    }
    return null;
  } finally {
    bitmap.close();
  }
}