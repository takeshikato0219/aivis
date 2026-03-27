import type { CountDetectionData } from '@/screens/Detail/Detail.types';
import { isAttendanceSubcounts } from '@/screens/Detail/Detail.types';

export type CountDetectionEventPayload = {
  /** Rule codes from RULE_CONFIGS_BY_WORKFLOW (FCM may send multiple keys in one payload). */
  codes: string[];
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
 * Apply increment to CountDetectionData based on rule `code`.
 * - home_return_count: current = min(current + 1, total)
 * - Other numeric keys: value + 1
 */
function bumpAttendanceSub(
  data: CountDetectionData,
  sub: 'checkin' | 'checkout'
): CountDetectionData {
  const cur = data.attendance;
  if (isAttendanceSubcounts(cur)) {
    return {
      ...data,
      attendance: { ...cur, [sub]: cur[sub] + 1 },
    };
  }
  if (typeof cur === 'number') {
    return {
      ...data,
      attendance: {
        checkin: sub === 'checkin' ? cur + 1 : cur,
        checkout: sub === 'checkout' ? 1 : 0,
      },
    };
  }
  return {
    ...data,
    attendance: {
      checkin: sub === 'checkin' ? 1 : 0,
      checkout: sub === 'checkout' ? 1 : 0,
    },
  };
}

export function applyCountIncrement(
  data: CountDetectionData | null,
  code: string
): CountDetectionData | null {
  if (!data) return null;

  if (code === 'attendance_checkin') {
    return bumpAttendanceSub(data, 'checkin');
  }
  if (code === 'attendance_checkout') {
    return bumpAttendanceSub(data, 'checkout');
  }

  if (code === 'attendance') {
    const value = data.attendance;
    if (isAttendanceSubcounts(value)) {
      return {
        ...data,
        attendance: { ...value, checkin: value.checkin + 1 },
      };
    }
    if (typeof value === 'number') {
      return {
        ...data,
        attendance: { checkin: value + 1, checkout: 0 },
      };
    }
    if (!('attendance' in data)) {
      return {
        ...data,
        attendance: { checkin: 1, checkout: 0 },
      };
    }
    return data;
  }

  const key = code as keyof CountDetectionData;
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

/** Apply increment for each rule code in order (multi-key FCM payload). */
export function applyCountIncrements(
  data: CountDetectionData | null,
  codes: string[]
): CountDetectionData | null {
  if (!codes.length) return data;
  let next = data;
  for (const code of codes) {
    next = applyCountIncrement(next, code);
  }
  return next;
}
