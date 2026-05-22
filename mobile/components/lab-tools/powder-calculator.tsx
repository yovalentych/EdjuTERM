import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LabInput, LabResultCard } from './inputs';
import { calculatePowder } from '@/lib/lab-tools/engine';
import { substances } from '@/lib/lab-tools/substances';
import { ConcUnit, VolUnit, Substance } from '@/lib/lab-tools/types';
import { colors, fonts } from '@/constants/theme';
import { Title, Body, Card, Eyebrow } from '@/components/ui';

export function PowderCalculator() {
  const [sub, setSub] = useState<Substance | null>(null);
  const [mw, setMw] = useState('58.44');
  const [tc, setTc] = useState('150');
  const [tu, setTu] = useState<ConcUnit>('mM');
  const [vol, setVol] = useState('100');
  const [vu, setVu] = useState<VolUnit>('mL');

  const result = useMemo(() => {
    const valC = parseFloat(tc);
    const valV = parseFloat(vol);
    const valMW = parseFloat(mw);
    if (isNaN(valC) || isNaN(valV) || isNaN(valMW)) return null;
    return calculatePowder(valC, tu, valV, vu, valMW);
  }, [tc, tu, vol, vu, mw]);

  const selectSub = (s: Substance) => {
    setSub(s);
    if (s.mw) setMw(s.mw.toString());
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card tone="dark" style={styles.hero}>
        <Eyebrow inverse>Приготування з сухої речовини</Eyebrow>
        <Title inverse>m = C × V × Mw</Title>
        <Body inverse>Розрахуйте наважку для заданого об'єму та молярності</Body>
      </Card>

      <View style={styles.form}>
        <Eyebrow>Оберіть речовину або вкажіть MW вручну</Eyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subList}>
          {substances.map(s => (
            <Pressable 
              key={s.id} 
              onPress={() => selectSub(s)}
              style={[styles.subChip, sub?.id === s.id && styles.subChipActive]}
            >
              <Text style={[styles.subChipText, sub?.id === s.id && styles.subChipTextActive]}>{s.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <LabInput
          label="Молекулярна маса (г/моль)"
          value={mw}
          onChange={setMw}
          unit="g/mol"
          onUnitChange={() => {}}
          units={['g/mol']}
          placeholder="58.44"
        />

        <LabInput
          label="Цільова концентрація"
          value={tc}
          onChange={setTc}
          unit={tu}
          onUnitChange={setTu}
          units={['M', 'mM', 'uM', 'nM', 'pM']}
        />

        <LabInput
          label="Кінцевий об'єм"
          value={vol}
          onChange={setVol}
          unit={vu}
          onUnitChange={setVu}
          units={['L', 'mL', 'uL']}
        />

        {result && (
          <LabResultCard
            title={`Необхідна наважка: ${result.mass.toFixed(4)} ${result.massUnit}`}
            instructions={result.instructions}
            warnings={result.warnings}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { padding: 24, marginBottom: 20 },
  form: { paddingHorizontal: 4, gap: 12 },
  subList: { gap: 8, marginBottom: 8, paddingBottom: 4 },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
  },
  subChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subChipText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.muted,
  },
  subChipTextActive: {
    color: 'white',
  },
});
