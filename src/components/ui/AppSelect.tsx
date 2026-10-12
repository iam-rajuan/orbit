import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface SelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const AppSelect: React.FC<AppSelectProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { theme } = useTheme();

  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.selectBox,
          {
            backgroundColor: theme.surfaceSubtle,
            borderColor: error ? theme.danger : theme.border,
          },
          error ? { backgroundColor: theme.dangerBg } : null,
        ]}
      >
        <Text
          style={[
            styles.valueText,
            { color: selectedOption ? theme.textPrimary : theme.textMuted },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={theme.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType={isMobile ? 'slide' : 'fade'}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.backdrop }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: theme.isDark ? 1 : 0,
                    shadowColor: theme.shadowColor,
                  },
                  isMobile && styles.modalContentMobile,
                ]}
              >
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{label || 'Select'}</Text>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          onSelect(item.value);
                          setModalVisible(false);
                        }}
                        style={[
                          styles.optionItem,
                          {
                            borderBottomColor: theme.border,
                            backgroundColor: isSelected ? theme.primaryBg : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: isSelected ? theme.primary : theme.textPrimary },
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && <Check size={16} color={theme.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    cursor: 'pointer' as any,
  },
  valueText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  modalContentMobile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: '100%',
    maxHeight: '60%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    cursor: 'pointer' as any,
  },
  optionText: {
    fontSize: 14,
  },
  optionTextSelected: {
    fontWeight: '700',
  },
});
