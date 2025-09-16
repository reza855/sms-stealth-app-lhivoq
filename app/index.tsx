
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/commonStyles';
import Calculator from '../components/Calculator';
import SMSManager from '../components/SMSManager';

export default function MainScreen() {
  const [showSMSManager, setShowSMSManager] = useState(false);

  const handleSecretCode = () => {
    console.log('Secret code activated - showing SMS manager');
    setShowSMSManager(true);
  };

  const handleBackToCalculator = () => {
    console.log('Back to calculator');
    setShowSMSManager(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {showSMSManager ? (
        <SMSManager onBack={handleBackToCalculator} />
      ) : (
        <Calculator onSecretCode={handleSecretCode} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
