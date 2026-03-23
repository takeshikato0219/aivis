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
      code: '',
      icon: IconBear,
      iconName: 'IconBear',
      handlerType: 'notification',
    },
    {
      code: 'attendance',
      icon: IconBear,
      iconName: 'IconBear',
      handlerType: 'none',
    },
  ],
  Enterprise: [
    {
      code: '',
      icon: IconHome,
      iconName: 'IconHome',
      handlerType: 'none',
    },
    {
      code: 'enterprise_attendance',
      icon: IconPerson,
      iconName: 'IconPerson',
      handlerType: 'none',
    },
    {
      code: 'unexpected_incident',
      icon: IconPerson,
      iconName: 'IconPerson',
      handlerType: 'none',
    },
    {
      code: 'helmet_wearing',
      icon: IconSuspect,
      iconName: 'IconSuspect',
      handlerType: 'none',
    },
    {
      code: 'mask_wearing',
      icon: IconMark,
      iconName: 'IconMask',
      handlerType: 'none',
    },
    {
      code: 'glove_wearing',
      icon: IconGlove,
      iconName: 'IconGlove',
      handlerType: 'none',
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
