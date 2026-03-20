import type { CountDetectionData } from '@/screens/Detail/Detail.types';

export type CountDetectionEventPayload = {
  event_type: string;
  camera_id?: string;
};

type Listener = (payload: CountDetectionEventPayload) => void;

const listeners: Set<Listener> = new Set();

export function subscribeCountDetectionEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitCountDetectionEvent(payload: CountDetectionEventPayload): void {
  listeners.forEach((fn) => fn(payload));
}

/**
 * Apply increment to CountDetectionData based on event_type.
 * - home_return_count: current = min(current + 1, total)
 * - Other numeric keys: value + 1
 */
export function applyCountIncrement(
  data: CountDetectionData | null,
  eventType: string
): CountDetectionData | null {
  if (!data) return null;

  const key = eventType as keyof CountDetectionData;
  if (!key || !(key in data)) return data;

  const value = data[key];
  if (typeof value === 'object' && value !== null && 'current' in value && 'total' in value) {
    const hr = value as { current: number; total: number };
    const newCurrent = Math.min(hr.current + 1, hr.total);
    return {
      ...data,
      [key]: { ...hr, current: newCurrent },
    };
  }

  if (typeof value === 'number') {
    return {
      ...data,
      [key]: value + 1,
    };
  }

  return data;
}
