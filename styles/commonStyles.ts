
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  primary: '#2196F3',      // Blue
  secondary: '#4CAF50',    // Green
  accent: '#FF9800',       // Orange
  background: '#F5F5F5',   // Light gray background
  backgroundAlt: '#FFFFFF', // White
  text: '#212121',         // Dark text
  textSecondary: '#757575', // Gray text
  grey: '#E0E0E0',         // Light gray
  card: '#FFFFFF',         // White card background
  success: '#4CAF50',      // Green
  warning: '#FF9800',      // Orange
  error: '#F44336',        // Red
  calculator: {
    display: '#000000',    // Black display
    displayText: '#FFFFFF', // White text on display
    button: '#E0E0E0',     // Light gray buttons
    buttonText: '#000000', // Black text on buttons
    operator: '#FF9800',   // Orange operator buttons
    operatorText: '#FFFFFF', // White text on operator buttons
  }
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.text,
  },
});
