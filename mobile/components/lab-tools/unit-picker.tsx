import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';

const { height } = Dimensions.get('window');

interface UnitPickerProps {
  visible: boolean;
  onClose: () => void;
  units: string[];
  selected: string;
  onSelect: (unit: any) => void;
  title: string;
}

export function UnitPicker({ visible, onClose, units, selected, onSelect, title }: UnitPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}><Feather name="x" size={20} color={colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {units.map((unit) => (
              <Pressable 
                key={unit} 
                style={[styles.item, selected === unit && styles.itemSelected]}
                onPress={() => { onSelect(unit); onClose(); }}
              >
                <Text style={[styles.itemText, selected === unit && styles.itemTextSelected]}>{unit}</Text>
                {selected === unit && <Feather name="check" size={16} color={colors.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  list: {
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  itemSelected: {
    backgroundColor: colors.primary + '10',
  },
  itemText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.muted,
  },
  itemTextSelected: {
    color: colors.primary,
  },
});
