import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { ViewStyle } from 'react-native';
import { styles } from './Card.styles';

interface CardProps {
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  style?: ViewStyle;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({ children, elevation = 1, style, onPress }) => {
  return (
    <PaperCard elevation={elevation} style={[styles.card, style]} onPress={onPress}>
      <PaperCard.Content>{children}</PaperCard.Content>
    </PaperCard>
  );
};

export default Card;
