import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const size = 180;
const center = size / 2;
const sweepColor = '#5AF7FF';

export const RadarScan: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const sweepAngle = 60; // degrees
  const sweepRadian = (sweepAngle * Math.PI) / 180;

  const createSweepPath = (r: number, startAngle: number, sweep: number) => {
    const x1 = center + r * Math.cos(startAngle);
    const y1 = center + r * Math.sin(startAngle);
    const x2 = center + r * Math.cos(startAngle + sweep);
    const y2 = center + r * Math.sin(startAngle + sweep);

    const move = `M ${center} ${center}`;
    const arc1 = `L ${x1} ${y1}`;
    const arc2 = `A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    const close = 'Z';
    return `${move} ${arc1} ${arc2} ${close}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.radarWrap}>
      <Svg width={size} height={size}>
        {[1, 2, 3, 4].map((v) => (
          <Circle
            key={v}
            cx={center}
            cy={center}
            r={center * (v / 4)}
            stroke="#4CC6FF"
            strokeOpacity={0.6 - v * 0.1}
            strokeWidth={1.2}
            fill="none"
          />
        ))}
      </Svg>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          // eslint-disable-next-line react-native/no-inline-styles
          {
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: spin }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={size} height={size}>
          <Path
            d={createSweepPath(center, -sweepRadian / 2, sweepRadian)}
            fill={sweepColor}
            fillOpacity={0.34}
          />
        </Svg>
      </Animated.View>
      {/* Dot/trung tâm */}
      <View style={[styles.dotCenter, { top: center - 7, left: center - 7 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  radarWrap: {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCenter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#89EFFF',
    borderWidth: 2,
    borderColor: '#23E0FF',
    opacity: 0.8,
    zIndex: 10,
  },
});

export default RadarScan;
