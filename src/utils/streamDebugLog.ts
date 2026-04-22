const PREFIX = '[CameraLive]';

/** Dev-only structured logs for stream load diagnostics (API → WebView → playback). */
export function streamDebugLog(
  phase: string,
  payload?: Record<string, string | number | boolean | null | undefined>
): void {
  if (!__DEV__) {
    return;
  }
  const line = payload ? `${JSON.stringify({ t: Date.now(), ...payload })}` : `${Date.now()}`;
  console.log(PREFIX, phase, line);
}
