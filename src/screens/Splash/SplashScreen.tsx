import React, { useEffect } from 'react';
import { View } from 'react-native';
import { styles } from './SplashScreen.style';
import { useAppDispatch } from '@redux/store';
import { checkAuthAsync } from '@redux/slices/authSlice';
import Logo from '@assets/svg/logo.svg';
import { useResponsive } from '@hooks/useResponsive';

interface Props {
  onFinish: () => void;
}

const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const dispatch = useAppDispatch();
  const responsive = useResponsive();

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
      <Logo width={responsive.isTablet ? 400 : 236} height={responsive.isTablet ? 100 : 68} />
    </View>
  );
};

export default SplashScreen;
