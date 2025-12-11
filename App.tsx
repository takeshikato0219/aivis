import React from 'react';
import { StatusBar } from 'react-native';
import AppProvider from './src/providers/AppProvider';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <AppProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </AppProvider>
  );
};

export default App;
