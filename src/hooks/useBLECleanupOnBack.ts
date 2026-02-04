import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { jetsonBLEService } from '@/services/jetsonBLEService';

export function useBLECleanupOnBack() {
  const navigation = useNavigation();

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      // Only disconnect when user goes back (GO_BACK, POP), not navigate forward
      const actionType = e.data.action.type;
      if (actionType === 'GO_BACK' || actionType === 'POP') {
        console.log('[BLE] Disconnecting due to back navigation...');
        jetsonBLEService.disconnect();
      }
    });
  }, [navigation]);
}
