import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { styles } from './SplashScreen.style';
import { useAppDispatch } from '@redux/store';
import { checkAuthAsync } from '@redux/slices/authSlice';

interface Props {
  onFinish: () => void;
}

const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        await dispatch(checkAuthAsync()).unwrap();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
      } finally {
        setTimeout(() => {
          onFinish();
        }, 1500);
      }
    };

    restoreAuth();
  }, [dispatch, onFinish]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Timima01</Text>
    </View>
  );
};

export default SplashScreen;
