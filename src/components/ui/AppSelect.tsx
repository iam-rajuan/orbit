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

  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.selectBox,
          error ? styles.selectBoxError : null,
        ]}
      >
        <Text
          style={[
            styles.valueText,
            !selectedOption ? styles.placeholderText : null,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color="#A1A1AA" />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType={isMobile ? 'slide' : 'fade'}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContent,
                isMobile && styles.modalContentMobile,
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label || 'Select'}</Text>
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
                          isSelected && styles.optionItemSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && <Check size={16} color="#4F46E5" />}
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
    color: '#3F3F46',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    cursor: 'pointer' as any,
  },
  selectBoxError: {
    borderColor: '#F43F5E',
    backgroundColor: '#FFF1F2',
  },
  valueText: {
    fontSize: 14,
    color: '#18181B',
  },
  placeholderText: {
    color: '#A1A1AA',
  },
  errorText: {
    fontSize: 12,
    color: '#F43F5E',
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    maxHeight: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
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
    borderBottomColor: '#F4F4F5',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
    cursor: 'pointer' as any,
  },
  optionItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  optionText: {
    fontSize: 14,
    color: '#3F3F46',
  },
  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
