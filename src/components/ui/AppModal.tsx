import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 520,
  style,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isMobile ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: theme.backdrop }]}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.modalCard,
                {
                  maxWidth: isMobile ? '100%' : maxWidth,
                  backgroundColor: theme.surface,
                  shadowColor: theme.shadowColor,
                  borderWidth: theme.isDark ? 1 : 0,
                  borderColor: theme.border,
                },
                isMobile && styles.modalCardMobile,
                style,
              ]}
            >
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
                  {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: theme.surfaceSubtle }]}
                >
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  modalCardMobile: {
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  body: {
    padding: 24,
  },
});
