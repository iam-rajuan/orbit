import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Pressable,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { CornerUpRight, Edit2, Trash2 } from 'lucide-react-native';

const ACTION_WIDTH = 156; // 3 buttons * 52px
const SWIPE_THRESHOLD = 50;

interface SwipeableTaskCardProps {
  children: React.ReactNode;
  isCurrentOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onSwipeStart?: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  children,
  isCurrentOpen,
  onOpen,
  onClose,
  onSwipeStart,
  onForward,
  onEdit,
  onDelete,
  containerStyle,
}) => {
  const [translateX] = useState(() => new Animated.Value(0));
  const [isOpen, setIsOpen] = useState(false);

  const snapOpen = useCallback(() => {
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      useNativeDriver: true,
      tension: 75,
      friction: 9,
    }).start(() => {
      setIsOpen(true);
      onOpen?.();
    });
  }, [translateX, onOpen]);

  const snapClose = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start(() => {
      setIsOpen(false);
      onClose?.();
    });
  }, [translateX, onClose]);

  // Close when another card opens
  useEffect(() => {
    if (isCurrentOpen === false && isOpen) {
      snapClose();
    }
  }, [isCurrentOpen, isOpen, snapClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Capture gesture only when horizontal drag is clearly dominant
          const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
          return isHorizontal && Math.abs(gestureState.dx) > 7;
        },
        onPanResponderGrant: () => {
          translateX.stopAnimation();
          translateX.extractOffset();
          onSwipeStart?.();
        },
        onPanResponderMove: (_, gestureState) => {
          translateX.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          translateX.flattenOffset();
          const currentVal = (translateX as unknown as { _value?: number })._value ?? 0;

          if (currentVal < -SWIPE_THRESHOLD || gestureState.vx < -0.35) {
            snapOpen();
          } else {
            snapClose();
          }
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [translateX, snapOpen, snapClose, onSwipeStart]
  );
  const drawerOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -25, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const drawerTranslateX = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, 0],
    outputRange: [0, ACTION_WIDTH * 0.3],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {/* Background Action Drawer (iOS style) - strictly hidden when closed */}
      <Animated.View
        style={[
          styles.actionsDrawer,
          {
            opacity: drawerOpacity,
            transform: [{ translateX: drawerTranslateX }],
          },
        ]}
      >
        {/* 1. Postpone / Forward Action */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.actionBtn, styles.postponeBtn]}
          onPress={() => {
            snapClose();
            onForward();
          }}
          accessibilityLabel="Postpone to tomorrow"
        >
          <CornerUpRight size={19} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* 2. Edit Action */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => {
            snapClose();
            onEdit();
          }}
          accessibilityLabel="Edit task"
        >
          <Edit2 size={17} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* 3. Delete Action */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => {
            snapClose();
            onDelete();
          }}
          accessibilityLabel="Delete task"
        >
          <Trash2 size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </Animated.View>

      {/* Foreground Card Surface that slides smoothly */}
      <Animated.View
        style={[
          styles.surface,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}

        {/* When swiped open, an invisible overlay intercepts touches to close the drawer */}
        {isOpen && (
          <Pressable
            style={styles.tapToCloseOverlay}
            onPress={(e) => {
              e.stopPropagation?.();
              snapClose();
            }}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionsDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    zIndex: 1,
  },
  actionBtn: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postponeBtn: {
    backgroundColor: '#6366F1', // iOS Indigo
  },
  editBtn: {
    backgroundColor: '#64748B', // iOS Slate
  },
  deleteBtn: {
    backgroundColor: '#EF4444', // iOS Vibrant Red
  },
  surface: {
    width: '100%',
    zIndex: 2,
    ...Platform.select({
      web: {
        touchAction: 'pan-y',
      },
    }),
  },
  tapToCloseOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
});
