import { Alert, AlertButton } from 'react-native';

export type CommonAlertOptions = {
  title: string;
  message: string;
  buttons?: AlertButton[];
};

export function showCommonAlert({ title, message, buttons }: CommonAlertOptions) {
  Alert.alert(title, message, buttons);
}
