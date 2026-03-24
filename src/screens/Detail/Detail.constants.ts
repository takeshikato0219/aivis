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
import CameraShopDetailBgPng from '@assets/png/camera-shop-detail-bg.png';
import CameraHomeDetailBgPng from '@assets/png/camera-home-detail-bg.png';
import CameraFactoryDetailBgPng from '@assets/png/camera-factory-detail-bg.png';
import IconAttendance from '@assets/svg/attendance-icon.svg';
import IconBan from '@assets/svg/ban-sign-icon.svg';
import IconHelmet from '@assets/svg/helmet-icon.svg';
import type { WorkflowType } from './Detail.types';

export type RuleHandlerType = 'notification' | 'customerReport' | 'none';

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
    {
      code: 'attendance',
      icon: IconAttendance,
      iconName: 'IconAttendance',
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
      iconName: 'IconMask',
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
      handlerType: 'notification',
    },
  ],
};

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
