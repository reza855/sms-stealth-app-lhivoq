
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../styles/commonStyles';

interface CalculatorProps {
  onSecretCode: () => void;
}

const { width } = Dimensions.get('window');
const buttonSize = (width - 60) / 4;

export default function Calculator({ onSecretCode }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [secretInput, setSecretInput] = useState('');

  const inputNumber = (num: string) => {
    console.log('Input number:', num);
    
    // Check for secret code
    const newSecretInput = secretInput + num;
    setSecretInput(newSecretInput);
    
    if (newSecretInput === '1978') {
      console.log('Secret code entered!');
      onSecretCode();
      setSecretInput('');
      return;
    }
    
    // Reset secret input if it gets too long or doesn't match
    if (newSecretInput.length > 4 || !('1978'.startsWith(newSecretInput))) {
      setSecretInput(num);
    }

    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    console.log('Input operation:', nextOperation);
    setSecretInput(''); // Reset secret input on operation
    
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    console.log('Perform calculation');
    setSecretInput(''); // Reset secret input on calculation
    
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    console.log('Clear calculator');
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setSecretInput('');
  };

  const renderButton = (text: string, onPress: () => void, style?: any) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, style?.color && { color: style.color }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.row}>
          {renderButton('C', clear, styles.operatorButton)}
          {renderButton('±', () => {}, styles.operatorButton)}
          {renderButton('%', () => {}, styles.operatorButton)}
          {renderButton('÷', () => inputOperation('÷'), styles.operatorButton)}
        </View>

        <View style={styles.row}>
          {renderButton('7', () => inputNumber('7'))}
          {renderButton('8', () => inputNumber('8'))}
          {renderButton('9', () => inputNumber('9'))}
          {renderButton('×', () => inputOperation('×'), styles.operatorButton)}
        </View>

        <View style={styles.row}>
          {renderButton('4', () => inputNumber('4'))}
          {renderButton('5', () => inputNumber('5'))}
          {renderButton('6', () => inputNumber('6'))}
          {renderButton('-', () => inputOperation('-'), styles.operatorButton)}
        </View>

        <View style={styles.row}>
          {renderButton('1', () => inputNumber('1'))}
          {renderButton('9', () => inputNumber('9'))}
          {renderButton('7', () => inputNumber('7'))}
          {renderButton('+', () => inputOperation('+'), styles.operatorButton)}
        </View>

        <View style={styles.row}>
          {renderButton('0', () => inputNumber('0'), styles.zeroButton)}
          {renderButton('.', () => {})}
          {renderButton('8', () => inputNumber('8'))}
          {renderButton('=', performCalculation, styles.operatorButton)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  display: {
    flex: 1,
    backgroundColor: colors.calculator.display,
    borderRadius: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    marginBottom: 20,
  },
  displayText: {
    fontSize: 48,
    fontWeight: '300',
    color: colors.calculator.displayText,
  },
  buttonContainer: {
    flex: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    width: buttonSize - 5,
    height: buttonSize - 5,
    backgroundColor: colors.calculator.button,
    borderRadius: buttonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.calculator.buttonText,
  },
  operatorButton: {
    backgroundColor: colors.calculator.operator,
    color: colors.calculator.operatorText,
  },
  zeroButton: {
    width: (buttonSize * 2) - 5,
    borderRadius: buttonSize / 2,
  },
});
