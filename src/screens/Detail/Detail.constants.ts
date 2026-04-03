import IconHome from '@assets/svg/icon-home.svg';
import IconPerson from '@assets/svg/icon-person.svg';
import IconSuspect from '@assets/svg/icon-suspect.svg';
import IconBear from '@assets/svg/icon-bear.svg';
import IconMark from '@assets/svg/face-mask-icon.svg';
import IconGlove from '@assets/svg/gloves-icon.svg';
import IconWarningUnActive from '@assets/svg/icon-warning-unactive.svg';
import IconWarningActive from '@assets/svg/icon-warning-active.svg';
import IconSafeActive from '@assets/svg/icon-safe-active.svg';
import IconSafeUnActive from '@assets/svg/icon-safe-unactive.svg';
import IconUnlockActive from '@assets/svg/icon-lock-active.svg';
import IconUnlockUnActive from '@assets/svg/icon-lock-unactive.svg';
import CameraShopDetailBgPng from '@assets/webp/camera-shop-detail-bg.webp';
import CameraHomeDetailBgPng from '@assets/webp/camera-home-detail-bg.webp';
import CameraFactoryDetailBgPng from '@assets/webp/camera-factory-detail-bg.webp';
import IconAttendance from '@assets/svg/attendance-icon.svg';
import IconBan from '@assets/svg/ban-sign-icon.svg';
import IconHelmet from '@assets/svg/helmet-icon.svg';
import IconVip from '@assets/svg/vip-label-icon.svg';
import type { WorkflowType } from './Detail.types';

export type RuleHandlerType = 'notification' | 'customerReport' | 'restrictedZone' | 'none';

export interface RuleConfigStatic {
  code: string;
  icon: React.ComponentType<any>;
  iconName: string;
  handlerType: RuleHandlerType;
}

export const RULE_CONFIGS_BY_WORKFLOW: Record<WorkflowType, RuleConfigStatic[]> = {
  Family: [
    {
      code: 'home_return_count',
      icon: IconHome,
      iconName: 'IconHome',
      handlerType: 'notification',
    },
    {
      code: 'daily_passerby',
      icon: IconPerson,
      iconName: 'IconPerson',
      handlerType: 'notification',
    },
    {
      code: 'unregistered_detection',
      icon: IconSuspect,
      iconName: 'IconSuspect',
      handlerType: 'notification',
    },
    {
      code: 'creature_detection',
      icon: IconBear,
      iconName: 'IconBear',
      handlerType: 'notification',
    },
  ],
  Store: [
    {
      code: 'visitor_count',
      icon: IconHome,
      iconName: 'IconHome',
      handlerType: 'notification',
    },
    {
      code: 'vip_customer_detection',
      icon: IconVip,
      iconName: 'IconVip',
      handlerType: 'notification',
    },
    {
      code: 'customer_attribute_report',
      icon: IconPerson,
      iconName: 'IconPerson',
      handlerType: 'customerReport',
    },
    {
      code: 'suspicious_behavior_detection',
      icon: IconSuspect,
      iconName: 'IconSuspect',
      handlerType: 'notification',
    },
    {
      code: 'access_prohibition_detection',
      icon: IconBan,
      iconName: 'IconBan',
      handlerType: 'notification',
    },
  ],
  Enterprise: [
    {
      code: 'enterprise_attendance',
      icon: IconAttendance,
      iconName: 'IconAttendance',
      handlerType: 'notification',
    },
    {
      code: 'unexpected_incident',
      icon: IconPerson,
      iconName: 'IconPerson',
      handlerType: 'notification',
    },
    {
      code: 'helmet_wearing',
      icon: IconHelmet,
      iconName: 'IconHelmet',
      handlerType: 'notification',
    },
    {
      code: 'mask_wearing',
      icon: IconMark,
      iconName: 'IconMark',
      handlerType: 'notification',
    },
    {
      code: 'glove_wearing',
      icon: IconGlove,
      iconName: 'IconGlove',
      handlerType: 'notification',
    },
    {
      code: 'restricted_area_intrusion',
      icon: IconBan,
      iconName: 'IconBan',
      handlerType: 'restrictedZone',
    },
  ],
};

/** All rule `code` values from RULE_CONFIGS_BY_WORKFLOW (e.g. push payload `code`, count keys in `data`). */
export const ALL_RULE_CODES = new Set<string>([
  ...(Object.keys(RULE_CONFIGS_BY_WORKFLOW) as WorkflowType[]).flatMap((wf) =>
    RULE_CONFIGS_BY_WORKFLOW[wf].map((c) => c.code)
  ),
  'enterprise_attendance_in',
  'enterprise_attendance_out',
]);

function toPositiveInt(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.floor(v);
  if (typeof v === 'string') {
    const n = Number(v.trim());
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return 0;
}

function normalizeEnterpriseAttendanceFcmRaw(raw: unknown): unknown {
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.parse(t) as unknown;
      } catch {
        try {
          // Backend may send Python repr e.g. "{'in': 1}" — JSON requires double-quoted keys/strings
          const jsonish = t.replace(/'/g, '"');
          return JSON.parse(jsonish) as unknown;
        } catch {
          return raw;
        }
      }
    }
  }
  return raw;
}

/**
 * Maps `enterprise_attendance` from FCM `data` to increment codes.
 *
 * Contract: each push uses exactly one of:
 * - `{ enterprise_attendance: { in: 1 } }`  → `enterprise_attendance_in`
 * - `{ enterprise_attendance: { out: 1 } }` → `enterprise_attendance_out`
 *
 * FCM often stringifies nested objects, so `data.enterprise_attendance` may be the string `'{"in":1}'` / `'{"out":1}'`.
 * Zero / invalid / missing `in` & `out` → `[]` (no phantom increment).
 */
export function enterpriseAttendanceCodesFromFcmValue(raw: unknown): string[] {
  if (raw == null || raw === '') return [];

  const normalized = normalizeEnterpriseAttendanceFcmRaw(raw);

  if (typeof normalized !== 'object' || normalized === null) return [];

  const o = normalized as Record<string, unknown>;
  if (!('in' in o) && !('out' in o)) return [];

  const codes: string[] = [];
  const inCount = toPositiveInt(o.in);
  const outCount = toPositiveInt(o.out);
  for (let i = 0; i < inCount; i++) codes.push('enterprise_attendance_in');
  for (let i = 0; i < outCount; i++) codes.push('enterprise_attendance_out');
  return codes;
}

/**
 * FCM `data` may use rule keys directly (e.g. `{ visitor_count: "1", vip_customer_detection: "1" }`) without a `code` field.
 * Returns every key that matches RULE_CONFIGS_BY_WORKFLOW / ALL_RULE_CODES (payload key order preserved).
 */
export function getRuleCodesFromFcmData(
  data: Record<string, unknown> | undefined | null
): string[] {
  if (!data || typeof data !== 'object') return [];
  const codes: string[] = [];
  for (const key of Object.keys(data)) {
    if (!ALL_RULE_CODES.has(key)) continue;
    if (key === 'enterprise_attendance') {
      codes.push(...enterpriseAttendanceCodesFromFcmValue(data[key]));
      continue;
    }
    codes.push(key);
  }
  return codes;
}

export const MODE_BACKGROUNDS = [
  CameraShopDetailBgPng,
  CameraHomeDetailBgPng,
  CameraFactoryDetailBgPng,
];

export const MODE_ICONS = [
  { iconActive: IconWarningActive, iconUnActive: IconWarningUnActive },
  { iconActive: IconSafeActive, iconUnActive: IconSafeUnActive },
  { iconActive: IconUnlockActive, iconUnActive: IconUnlockUnActive },
];
