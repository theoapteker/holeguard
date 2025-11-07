import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DateRangeFilter } from '../utils/dateFilters';

interface FilterButtonProps {
  filter: DateRangeFilter;
  label: string;
  active: boolean;
  onPress: () => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  filter,
  label,
  active,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.activeButton]}
      onPress={onPress}
    >
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: '#3b82f6',
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
  },
});
