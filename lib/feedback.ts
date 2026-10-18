// File: lib/feedback.ts
// Haptic + audio confirmation after a successful scan.

let audio: AudioContext | null = null;

export function notifyScan(): void {
  try {
    navigator.vibrate?.(60);
  } catch {
    /* vibration not supported */
  }
  try {
    audio ??= new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.12);
  } catch {
    /* audio blocked by the browser */
  }
}