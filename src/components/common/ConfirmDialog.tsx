import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { AppButton } from '../ui/AppButton';
import { AlertTriangle } from 'lucide-react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = true,
}) => {
  return (
    <AppModal visible={visible} onClose={onCancel} title={title} maxWidth={420}>
      <View style={styles.body}>
        {destructive && (
          <View style={styles.iconCircle}>
            <AlertTriangle size={24} color="#F43F5E" />
          </View>
        )}
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.buttonRow}>
        <AppButton
          title={cancelText}
          variant="outline"
          onPress={onCancel}
          style={styles.btn}
        />
        <AppButton
          title={confirmText}
          variant={destructive ? 'danger' : 'primary'}
          onPress={onConfirm}
          style={styles.btn}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#52525B',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  btn: {
    minWidth: 96,
  },
});
