// __tests__/components/Card.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Card from '../../src/components/Card/Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <React.Fragment>
          <Text>Card Content</Text>
        </React.Fragment>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('applies elevation prop', () => {
    const { UNSAFE_getByType } = render(
      <Card elevation={3}>
        <Text>Test</Text>
      </Card>
    );
    // PaperCard is the first child
    expect(UNSAFE_getByType(Card).props.elevation).toBe(3);
  });

  it('applies style prop', () => {
    const style = { backgroundColor: 'red' };
    const { UNSAFE_getByType } = render(
      <Card style={style}>
        <Text>Styled</Text>
      </Card>
    );
    expect(UNSAFE_getByType(Card).props.style).toEqual(expect.objectContaining(style));
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Card onPress={onPress}>
        <Text>Pressable</Text>
      </Card>
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// Don't forget to import Text from react-native
import { Text } from 'react-native';
