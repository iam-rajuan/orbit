import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { GripVertical } from 'lucide-react-native';
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

interface DragState {
  active: boolean;
  startIndex: number | null;
  targetIndex: number | null;
  translateY: number;
}

export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  style,
  contentContainerStyle,
  itemWrapperStyle,
  estimatedItemHeight = 76,
}: SortableListProps<T>) {
  const { isDark } = useTheme();

  const [dragState, setDragState] = useState<DragState>({
    active: false,
    startIndex: null,
    targetIndex: null,
    translateY: 0,
  });

  // Mutable refs for rock-solid gesture tracking without stale closures
  const holdTimerRef = useRef<any>(null);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const activeStartIndexRef = useRef<number | null>(null);
  const currentTargetIndexRef = useRef<number | null>(null);
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

  const getAverageItemHeight = useCallback(() => {
    const layouts = Object.values(itemLayouts.current);
    if (layouts.length > 0) {
      const totalHeight = layouts.reduce((sum, item) => sum + item.height, 0);
      return Math.max(45, totalHeight / layouts.length);
    }
    return estimatedItemHeight;
  }, [estimatedItemHeight]);

  const calculateTargetIndex = useCallback(
    (fromIndex: number, deltaY: number) => {
      const avgHeight = getAverageItemHeight();
      const slotDelta = Math.round(deltaY / avgHeight);
      return Math.max(0, Math.min(data.length - 1, fromIndex + slotDelta));
    },
    [data.length, getAverageItemHeight]
  );

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Universal touch & pointer start for tap-and-hold
  const startHoldGesture = (index: number, clientX: number, clientY: number) => {
    touchStartXRef.current = clientX;
    touchStartYRef.current = clientY;
    activeStartIndexRef.current = index;
    currentTargetIndexRef.current = index;
    isDraggingRef.current = false;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Tap and hold threshold (180ms)
    holdTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDragState({
        active: true,
        startIndex: index,
        targetIndex: index,
        translateY: 0,
      });
    }, 180);
  };

  const updateDragPosition = (clientX: number, clientY: number) => {
    const dy = clientY - touchStartYRef.current;
    const dx = Math.abs(clientX - touchStartXRef.current);

    if (!isDraggingRef.current) {
      // If user moved thumb/pointer noticeably before 180ms hold timer fires,
      // it means they are scrolling or swiping -> cancel hold immediately!
      if (Math.abs(dy) > 8 || dx > 8) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    } else {
      // Dragging is active! Update vertical position & target slot
      const from = activeStartIndexRef.current ?? 0;
      const target = calculateTargetIndex(from, dy);
      currentTargetIndexRef.current = target;

      setDragState((prev) => ({
        ...prev,
        active: true,
        targetIndex: target,
        translateY: dy,
      }));
    }
  };

  const endDragGesture = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (
      isDraggingRef.current &&
      activeStartIndexRef.current !== null &&
      currentTargetIndexRef.current !== null
    ) {
      const from = activeStartIndexRef.current;
      const to = currentTargetIndexRef.current;
      if (from !== to) {
        handleMove(from, to);
      }
    }

    isDraggingRef.current = false;
    activeStartIndexRef.current = null;
    currentTargetIndexRef.current = null;
    setDragState({
      active: false,
      startIndex: null,
      targetIndex: null,
      translateY: 0,
    });
  };

  return (
    <View style={[styles.container, style, contentContainerStyle]}>
      {data.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = dragState.active && dragState.startIndex === index;
        const isTarget = dragState.active && dragState.targetIndex === index && dragState.startIndex !== index;

        // Mobile touch handlers
        const touchHandlers = {
          onTouchStart: (e: any) => {
            const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
            startHoldGesture(index, touch.pageX, touch.pageY);
          },
          onTouchMove: (e: any) => {
            const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
            updateDragPosition(touch.pageX, touch.pageY);
          },
          onTouchEnd: () => {
            endDragGesture();
          },
          onTouchCancel: () => {
            endDragGesture();
          },
        };

        // Web pointer handlers for seamless mouse & touch tracking on web
        const webPointerHandlers =
          Platform.OS === 'web'
            ? {
                onPointerDown: (e: any) => {
                  startHoldGesture(index, e.pageX || e.clientX, e.pageY || e.clientY);

                  if (typeof window !== 'undefined') {
                    const onPointerMove = (evt: PointerEvent) => {
                      if (isDraggingRef.current) {
                        evt.preventDefault();
                      }
                      updateDragPosition(evt.pageX, evt.pageY);
                    };

                    const onPointerUp = () => {
                      endDragGesture();
                      window.removeEventListener('pointermove', onPointerMove);
                      window.removeEventListener('pointerup', onPointerUp);
                      window.removeEventListener('pointercancel', onPointerUp);
                    };

                    window.addEventListener('pointermove', onPointerMove, { passive: false });
                    window.addEventListener('pointerup', onPointerUp);
                    window.addEventListener('pointercancel', onPointerUp);
                  }
                },
              }
            : {};

        const dragHandle = (
          <View
            style={[
              styles.dragHandle,
              {
                backgroundColor: isDragging
                  ? 'rgba(99, 102, 241, 0.22)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDragging
                  ? '#6366F1'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
              isDragging && { transform: [{ scale: 1.1 }] },
              Platform.OS === 'web'
                ? ({
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'none',
                  } as any)
                : {},
            ]}
            accessibilityLabel={`Hold and drag to reorder item ${index + 1}`}
            {...touchHandlers}
            {...webPointerHandlers}
          >
            <GripVertical
              size={15}
              color={
                isDragging
                  ? '#6366F1'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.45)'
                  : 'rgba(0, 0, 0, 0.35)'
              }
              strokeWidth={2.4}
            />
          </View>
        );

        return (
          <React.Fragment key={key}>
            {/* Insertion drop target line when dragging above this item */}
            {isTarget && dragState.startIndex !== null && dragState.startIndex > index && (
              <View style={styles.dropIndicatorContainer}>
                <View style={styles.dropIndicatorLine} />
              </View>
            )}

            <View
              onLayout={(e) => {
                itemLayouts.current[index] = {
                  y: e.nativeEvent.layout.y,
                  height: e.nativeEvent.layout.height,
                };
              }}
              style={[
                styles.itemWrapper,
                itemWrapperStyle,
                isDragging && [
                  styles.itemDraggingActive,
                  {
                    transform: [{ translateY: dragState.translateY }, { scale: 1.025 }],
                    borderColor: '#6366F1',
                    shadowOpacity: isDark ? 0.45 : 0.22,
                  },
                ],
              ]}
            >
              {renderItem({
                item,
                index,
                total: data.length,
                isDragging,
                isOver: isTarget,
                dragHandle,
                moveUp: () => moveUp(index),
                moveDown: () => moveDown(index),
              })}
            </View>

            {/* Insertion drop target line when dragging below this item */}
            {isTarget && dragState.startIndex !== null && dragState.startIndex < index && (
              <View style={styles.dropIndicatorContainer}>
                <View style={styles.dropIndicatorLine} />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
    position: 'relative',
  },
  itemWrapper: {
    width: '100%',
  },
  itemDraggingActive: {
    zIndex: 9999,
    elevation: 20,
    borderWidth: 1.5,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
  },
  dragHandle: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  dropIndicatorContainer: {
    width: '100%',
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropIndicatorLine: {
    width: '98%',
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
});
