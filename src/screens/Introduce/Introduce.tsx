import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  LayoutChangeEvent,
  ScrollView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { styles } from './Introduce.styles';
import { useResponsive } from '@hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '@assets/svg/logo.svg';
import { isTablet } from '@utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import IntroduceBackgroundPng from '@assets/png/intro-background.png';
import MoveRightIcon from '@assets/svg/vector-right.svg';

const slides = [
  {
    key: '1',
    image: '',
  },
];

export default function Introduce() {
  const flatListRef = useRef<FlatList<any>>(null);
  const responsive = useResponsive();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Add dynamic states for the width and height of the slide.
  const [slideSize, setSlideSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  const isLandscape = slideSize.width > slideSize.height;

  // Update the size when the layout changes (rotate horizontally/vertically).
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSlideSize({ width, height });
  };

  const goToHome = () => {
    navigation.navigate('Home' as any);
  };

  const renderItem = ({ item }: { item: { key: string; image: any } }) => {
    const isPortrait = !isLandscape;
    const slideWidth = slideSize.width;
    const slideHeight = slideSize.height * (isTablet() ? 0.6 : 0.46);
    const imageWidth = slideWidth * 0.85;
    const imageHeight = isPortrait
      ? slideSize.height * (isTablet() ? 0.45 : 0.36)
      : imageWidth * 0.6;

    const renderImage = () =>
      typeof item.image === 'function' ? (
        <item.image
          width={isPortrait ? slideWidth : '100%'}
          height={isPortrait ? slideSize.height : '100%'}
          preserveAspectRatio={!isPortrait ? 'xMidYMid meet' : undefined}
        />
      ) : (
        <Image source={item.image} resizeMode="contain" />
      );

    const content = (
      <View style={[styles.slideInner, { width: imageWidth, height: imageHeight }]}>
        {renderImage()}
      </View>
    );

    return (
      <View
        style={[styles.slide, { width: slideWidth, height: isPortrait ? slideHeight : undefined }]}
      >
        {isPortrait ? (
          content
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.styleLandscape}
          >
            {content}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={IntroduceBackgroundPng}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} onLayout={onLayout}>
          {/*<Image source={IntroduceBackgroundPng} style={styles.absoluteFill} resizeMode="cover" />*/}
          {/* Header */}
          <View style={[styles.header, responsive.isTablet && styles.headerTablet]}>
            <Logo width={responsive.isTablet ? 400 : 236} height={responsive.isTablet ? 100 : 68} />
          </View>
          <Text style={styles.headerText}>{t('introduce.aiHomeControl')}</Text>
          <FlatList
            data={slides}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            ref={flatListRef}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: slideSize.width,
              offset: slideSize.width * index,
              index,
            })}
            style={{ width: slideSize.width, height: slideSize.height * 0.6 }}
            scrollEnabled={false}
          />
          <TouchableOpacity style={styles.manualButton} onPress={goToHome}>
            <Text style={styles.manualButtonText}>{t('introduce.goToHome')}</Text>
            <MoveRightIcon />
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
