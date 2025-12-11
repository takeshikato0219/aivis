import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ErrorBoundary.styles';
import ErrorHandler from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorHandler.handleApiError(error, 'ErrorBoundary');
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container} testID="error-boundary">
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>We're sorry for the inconvenience. Please try again.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            testID="error-boundary-reset"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
