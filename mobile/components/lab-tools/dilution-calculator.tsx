import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LabInput, LabResultCard } from './inputs';
import { calculateDilution } from '@/lib/lab-tools/engine';
import { ConcUnit, VolUnit } from '@/lib/lab-tools/types';
import { colors, fonts } from '@/constants/theme';
import { Title, Body, Card, Eyebrow } from '@/components/ui';

export function DilutionCalculator() {
  const [c1, setC1] = useState('10');
  const [u1, setU1] = useState<ConcUnit>('mM');
  const [c2, setC2] = useState('100');
  const [u2, setU2] = useState<ConcUnit>('uM');
  const [v2, setV2] = useState('1');
  const [vu2, setVu2] = useState<VolUnit>('mL');

  const result = useMemo(() => {
    const val1 = parseFloat(c1);
    const val2 = parseFloat(c2);
    const volv2 = parseFloat(v2);
    if (isNaN(val1) || isNaN(val2) || isNaN(volv2)) return null;
    return calculateDilution(val1, u1, val2, u2, volv2, vu2);
  }, [c1, u1, c2, u2, v2, vu2]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card tone="dark" style={styles.hero}>
        <Eyebrow inverse>Калькулятор розведень</Eyebrow>
        <Title inverse>C₁V₁ = C₂V₂</Title>
        <Body inverse>Розрахуйте об'єм стоку для цільової концентрації</Body>
      </Card>

      <View style={styles.form}>
        <LabInput
          label="Концентрація Сток-розчину (C1)"
          value={c1}
          onChange={setC1}
          unit={u1}
          onUnitChange={setU1}
          units={['M', 'mM', 'uM', 'nM', 'pM', 'x']}
        />
        <LabInput
          label="Бажана концентрація (C2)"
          value={c2}
          onChange={setC2}
          unit={u2}
          onUnitChange={setU2}
          units={['M', 'mM', 'uM', 'nM', 'pM', 'x']}
        />
        <LabInput
          label="Кінцевий об'єм (V2)"
          value={v2}
          onChange={setV2}
          unit={vu2}
          onUnitChange={setVu2}
          units={['L', 'mL', 'uL', 'nL']}
        />

        {result && (
          <LabResultCard
            title={`Результат: ${result.stockVol.toFixed(2)} ${result.stockVolUnit}`}
            instructions={result.instructions}
            warnings={result.warnings}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    padding: 24,
    marginBottom: 20,
  },
  form: {
    paddingHorizontal: 4,
    gap: 4,
  },
});
