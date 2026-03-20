import { ComponentType } from 'react';

/** Workflow types supported by Detail screen */
export type WorkflowType = 'Family' | 'Store' | 'Enterprise';

/** Rule config for each workflow item (with handler injected) */
export interface RuleConfig {
  code: string;
  icon: ComponentType<any>;
  iconName: string;
  handler: ((itemName: string, iconName: string) => void) | (() => void) | '';
}

/** Camera list item displayed in Detail */
export interface CameraListItem {
  id: string | number;
  name: string;
  status: boolean;
  counter: string;
  code?: string;
  icon?: ComponentType<any>;
  iconName?: string;
  handler?: RuleConfig['handler'];
}

/** Count detection data from API */
export interface CountDetectionData {
  creature_detection: number;
  home_return_count: { current: number; total: number };
  people_count_ws_url: string;
  daily_passerby: number;
  unregistered_detection: number;
}

/** Filter/mode item for security mode tabs */
export interface FilterItem {
  name: string;
  description: string;
  iconActive: ComponentType<any>;
  iconUnActive: ComponentType<any>;
}
