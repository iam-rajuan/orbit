import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StyleProp,
  ViewStyle,
  Modal,
  Text,
} from 'react-native';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [removed] = newArray.splice(from, 1);
  newArray.splice(to, 0, removed);
  return newArray;
}

export interface SortableRenderItemProps<T> {
  item: T;
  index: number;
  total: number;
  isDragging: boolean;
  isOver: boolean;
  dragHandle: React.ReactNode;
  moveUp: () => void;
  moveDown: () => void;
}

interface SortableListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (props: SortableRenderItemProps<T>) => React.ReactNode;
  onReorder: (newData: T[]) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  itemWrapperStyle?: StyleProp<ViewStyle>;
  estimatedItemHeight?: number;
}

export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  style,
  contentContainerStyle,
  itemWrapperStyle,
  estimatedItemHeight = 72,
}: SortableListProps<T>) {
  const { theme, isDark } = useTheme();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Quick Move Sheet state for tap on grip handle
  const [quickMoveIndex, setQuickMoveIndex] = useState<number | null>(null);

  // Touch tracking for mobile
  const touchStartY = useRef<number>(0);
  const touchStartIndex = useRef<number | null>(null);
  const currentOverIndex = useRef<number | null>(null);
  const itemLayouts = useRef<Record<number, { y: number; height: number }>>({});

  const handleMove = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= data.length || to >= data.length) return;
      const reordered = arrayMove(data, from, to);
      onReorder(reordered);
    },
    [data, onReorder]
  );

  const moveUp = useCallback(
    (idx: number) => {
      if (idx > 0) handleMove(idx, idx - 1);
    },
    [handleMove]
  );

  const moveDown = useCallback(
    (idx: number) => {
      if (idx < data.length - 1) handleMove(idx, idx + 1);
    },
    [handleMove, data.length]
  );

  return (
    <View style={[styles.container, style, contentContainerStyle]}>
      {data.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = draggedIndex === index;
        const isOver = overIndex === index && draggedIndex !== null && draggedIndex !== index;

        // Web drag events
        const webDragProps =
          Platform.OS === 'web'
            ? {
                draggable: true,
                onDragStart: (e: any) => {
                  setDraggedIndex(index);
                  if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                  }
                },
                onDragOver: (e: any) => {
                  e.preventDefault();
                  if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'move';
                  }
                  if (overIndex !== index) {
                    setOverIndex(index);
                  }
                },
                onDragEnd: () => {
                  if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
                    handleMove(draggedIndex, overIndex);
                  }
                  setDraggedIndex(null);
                  setOverIndex(null);
                },
                onDrop: (e: any) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== index) {
                    handleMove(draggedIndex, index);
                  }
                  setDraggedIndex(null);
                  setOverIndex(null);
                },
              }
            : {};

        // Mobile touch drag handlers
        const touchDragProps = {
          onTouchStart: (e: any) => {
            const pageY = e.nativeEvent.pageY;
            touchStartY.current = pageY;
            touchStartIndex.current = index;
            currentOverIndex.current = index;
            setDraggedIndex(index);
          },
          onTouchMove: (e: any) => {
            if (touchStartIndex.current === null) return;
            const deltaY = e.nativeEvent.pageY - touchStartY.current;
            const steps = Math.round(deltaY / estimatedItemHeight);
            const target = Math.max(0, Math.min(data.length - 1, touchStartIndex.current + steps));
            if (currentOverIndex.current !== target) {
              currentOverIndex.current = target;
              setOverIndex(target);
            }
          },
          onTouchEnd: () => {
            if (
              touchStartIndex.current !== null &&
              currentOverIndex.current !== null &&
              touchStartIndex.current !== currentOverIndex.current
            ) {
              handleMove(touchStartIndex.current, currentOverIndex.current);
            }
            touchStartIndex.current = null;
            currentOverIndex.current = null;
            setDraggedIndex(null);
            setOverIndex(null);
          },
        };

        const dragHandle = (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setQuickMoveIndex(index)}
            style={styles.dragHandle}
            accessibilityLabel={`Drag to reorder item ${index + 1}`}
            {...touchDragProps}
            {...(Platform.OS === 'web'
              ? {
                  style: [
                    styles.dragHandle,
                    {
                      cursor: isDragging ? 'grabbing' : 'grab',
                    } as any,
                  ],
                }
              : {})}
          >
            <GripVertical size={16} color={theme.textMuted} strokeWidth={2.2} />
          </TouchableOpacity>
        );

        return (
          <View
            key={key}
            onLayout={(e) => {
              itemLayouts.current[index] = {
                y: e.nativeEvent.layout.y,
                height: e.nativeEvent.layout.height,
              };
            }}
            style={[
              styles.itemWrapper,
              itemWrapperStyle,
              isDragging && styles.itemDragging,
              isOver && {
                borderTopWidth: 2,
                borderTopColor: theme.primary,
                transform: [{ translateY: -2 }],
              },
            ]}
            {...webDragProps}
          >
            {renderItem({
              item,
              index,
              total: data.length,
              isDragging,
              isOver,
              dragHandle,
              moveUp: () => moveUp(index),
              moveDown: () => moveDown(index),
            })}
          </View>
        );
      })}

      {/* Quick Move Dialog when tap on grip icon */}
      {quickMoveIndex !== null && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setQuickMoveIndex(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setQuickMoveIndex(null)}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Reorder Item (#{quickMoveIndex + 1})
              </Text>
              <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                Drag the grip icon or use quick move buttons below:
              </Text>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  disabled={quickMoveIndex === 0}
                  onPress={() => {
                    moveUp(quickMoveIndex);
                    setQuickMoveIndex(quickMoveIndex - 1);
                  }}
                  style={[
                    styles.modalMoveBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      opacity: quickMoveIndex === 0 ? 0.4 : 1,
                    },
                  ]}
                >
                  <ArrowUp size={16} color={theme.textPrimary} />
                  <Text style={[styles.modalMoveBtnText, { color: theme.textPrimary }]}>
                    Move Up
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={quickMoveIndex === data.length - 1}
                  onPress={() => {
                    moveDown(quickMoveIndex);
                    setQuickMoveIndex(quickMoveIndex + 1);
                  }}
                  style={[
                    styles.modalMoveBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      opacity: quickMoveIndex === data.length - 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <ArrowDown size={16} color={theme.textPrimary} />
                  <Text style={[styles.modalMoveBtnText, { color: theme.textPrimary }]}>
                    Move Down
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setQuickMoveIndex(null)}
                style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
  },
  itemWrapper: {
    width: '100%',
  },
  itemDragging: {
    opacity: 0.4,
    transform: [{ scale: 0.98 }],
  },
  dragHandle: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modalMoveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalMoveBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalDoneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
