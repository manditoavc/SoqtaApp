import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const insets = useSafeAreaInsets();

  const handleNumberPress = (num: string) => {
    if (shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimalPress = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setShouldResetDisplay(false);
    }
  };

  const handleOperationPress = (op: string) => {
    if (previousValue !== null && operation !== null && !shouldResetDisplay) {
      handleEquals();
    }
    setPreviousValue(display);
    setOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (previousValue === null || operation === null) return;

    const prev = parseFloat(previousValue);
    const current = parseFloat(display);
    let result = 0;

    switch (operation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '×':
        result = prev * current;
        break;
      case '÷':
        result = current !== 0 ? prev / current : 0;
        break;
      case '%':
        result = (prev * current) / 100;
        break;
    }

    setDisplay(result.toString());
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const buttons = [
    ['C', 'DEL', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  const getButtonStyle = (btn: string) => {
    if (btn === '=') return [styles.button, styles.equalsButton];
    if (btn === 'C' || btn === 'DEL') return [styles.button, styles.clearButton];
    if (['+', '-', '×', '÷', '%'].includes(btn)) return [styles.button, styles.operatorButton];
    return styles.button;
  };

  const handleButtonPress = (btn: string) => {
    if (btn === 'C') handleClear();
    else if (btn === 'DEL') handleDelete();
    else if (btn === '=') handleEquals();
    else if (btn === '.') handleDecimalPress();
    else if (['+', '-', '×', '÷', '%'].includes(btn)) handleOperationPress(btn);
    else handleNumberPress(btn);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculadora</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.displayContainer}>
          {operation && previousValue && (
            <Text style={styles.operationText}>
              {previousValue} {operation}
            </Text>
          )}
          <Text style={styles.displayText}>{display}</Text>
        </View>

        <View style={styles.buttonGrid}>
          {buttons.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.buttonRow}>
              {row.map((btn) => (
                <TouchableOpacity
                  key={btn}
                  style={[
                    getButtonStyle(btn),
                    btn === '0' && styles.zeroButton
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text style={[
                    styles.buttonText,
                    (btn === 'C' || btn === 'DEL') && styles.clearButtonText,
                    ['+', '-', '×', '÷', '%', '='].includes(btn) && styles.operatorButtonText
                  ]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00BCD4',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  displayContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'flex-end' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  operationText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'right' as const,
    marginBottom: 8,
  },
  displayText: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#333',
    textAlign: 'right' as const,
  },
  buttonGrid: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zeroButton: {
    flex: 2.2,
  },
  clearButton: {
    backgroundColor: '#FFEBEE',
  },
  operatorButton: {
    backgroundColor: '#E3F2FD',
  },
  equalsButton: {
    backgroundColor: '#00BCD4',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#333',
  },
  clearButtonText: {
    color: '#f44336',
  },
  operatorButtonText: {
    color: '#1976D2',
    fontWeight: '700' as const,
  },
});
