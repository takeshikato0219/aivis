import { ComponentType } from 'react';

/** Workflow types supported by Detail screen */
export type WorkflowType = 'Family' | 'Store' | 'Enterprise' | 'Hospital';

/** Rule config for each workflow item (with handler injected) */
export interface RuleConfig {
  code: string;
  icon: ComponentType<any>;
  iconName: string;
  handler: ((itemName: string, iconName: string) => void) | (() => void) | '';
}

/** Enterprise workflow — enterprise_attendance as check-in / check-out (API keys `in` / `out`) */
export interface EnterpriseAttendanceInOut {
  in: number;
  out: number;
}

export function isEnterpriseAttendanceInOut(v: unknown): v is EnterpriseAttendanceInOut {
  return (
    typeof v === 'object' &&
    v !== null &&
    'in' in v &&
    'out' in v &&
    typeof (v as { in: unknown; out: unknown }).in === 'number' &&
    typeof (v as { in: unknown; out: unknown }).out === 'number'
  );
}

/** Camera list item displayed in Detail */
export interface CameraListItem {
  id: string | number;
  name: string;
  status: boolean;
  counter: string;
  attendanceSub?: EnterpriseAttendanceInOut;
  code?: string;
  icon?: ComponentType<any>;
  iconName?: string;
  handler?: RuleConfig['handler'];
}

/** Family workflow — stats keys returned for home / family cameras */
export interface FamilyCountDetectionData {
  creature_detection: number;
  home_return_count: { current: number; total: number };
  people_count_ws_url: string;
  daily_passerby: number;
  unregistered_detection: number;
}

/** Store workflow — attendance counts check-in / check-out separately */
export interface AttendanceSubcounts {
  checkin: number;
  checkout: number;
}

export function isAttendanceSubcounts(v: unknown): v is AttendanceSubcounts {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { checkin: unknown; checkout: unknown }).checkin === 'number' &&
    typeof (v as { checkin: unknown; checkout: unknown }).checkout === 'number'
  );
}

/** Store workflow */
export interface StoreCountDetectionData {
  people_count_ws_url: string;
  visitor_count: number;
  vip_customer_detection: number;
  customer_attribute_report: number;
  suspicious_behavior_detection: number;
  access_prohibition_detection: number;
  attendance: AttendanceSubcounts | number;
}

/** Enterprise workflow */
export interface EnterpriseCountDetectionData {
  people_count_ws_url: string;
  enterprise_attendance: number | EnterpriseAttendanceInOut;
  helmet_wearing: number;
  mask_wearing: number;
  glove_wearing: number;
  restricted_area_intrusion: number;
}

/** Hospital workflow — same detection keys as Enterprise plus unexpected incident */
export interface HospitalCountDetectionData extends EnterpriseCountDetectionData {
  unexpected_incident: number;
}

/**
 * API returns shape by camera/workflow; only the relevant keys may be present.
 * Use `key in data` (or similar) before reading a field.
 */
export type CountDetectionData = Partial<
  FamilyCountDetectionData &
    StoreCountDetectionData &
    EnterpriseCountDetectionData &
    HospitalCountDetectionData
>;

/** Filter/mode item for security mode tabs */
export interface FilterItem {
  name: string;
  description: string;
  iconActive: ComponentType<any>;
  iconUnActive: ComponentType<any>;
}
