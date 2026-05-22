import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { UnitPicker } from './unit-picker';

interface LabInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  unit: string;
  onUnitChange: (unit: any) => void;
  units: string[];
  placeholder?: string;
}

export function LabInput({ label, value, onChange, unit, onUnitChange, units, placeholder }: LabInputProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={placeholder || "0.00"}
          placeholderTextColor={colors.mutedSoft}
        />
        <Pressable style={styles.unitBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.unitText}>{unit}</Text>
          <Feather name="chevron-down" size={14} color={colors.primary} />
        </Pressable>
      </View>
      <UnitPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={`Оберіть одиниці для ${label.toLowerCase()}`}
        units={units}
        selected={unit}
        onSelect={onUnitChange}
      />
    </View>
  );
}

export function LabResultCard({ title, instructions, warnings }: { title: string, instructions: string[], warnings: any[] }) {
  return (
    <View style={styles.resultContainer}>
      <View style={styles.resultHeader}>
        <Feather name="check-circle" size={18} color={colors.success} />
        <Text style={styles.resultTitle}>{title}</Text>
      </View>
      
      <View style={styles.instructions}>
        {instructions.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {warnings.map((w, i) => (
        <View key={i} style={[styles.warningBox, w.type === 'danger' ? styles.warningDanger : styles.warningWarn]}>
          <Feather name="alert-triangle" size={14} color={w.type === 'danger' ? colors.danger : colors.amber} />
          <Text style={[styles.warningText, { color: w.type === 'danger' ? colors.danger : colors.amber }]}>{w.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  unitBtn: {
    width: 80,
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  unitText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.success + '30',
    marginTop: 10,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  instructions: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNum: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.mutedSoft,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    fontFamily: fonts.semiBold,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  warningDanger: {
    backgroundColor: colors.danger + '10',
  },
  warningWarn: {
    backgroundColor: colors.amber + '10',
  },
  warningText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    flex: 1,
  },
});
