import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
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
  dragHandle?: React.ReactNode;
  moveUp: () => void;
  moveDown: () => void;
}

interface SortableListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (props: SortableRenderItemProps<T>) => React.ReactNode;
  onReorder: (newData: T[]) => void;
  onItemPress?: (item: T, index: number) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  itemWrapperStyle?: StyleProp<ViewStyle>;
  estimatedItemHeight?: number;
}

interface DragState {
  active: boolean;
  startIndex: number | null;
  targetIndex: number | null;
  translateX: number;
  translateY: number;
}

const EDGE_THRESHOLD = 110; // Distance in px from viewport top/bottom to trigger auto-scroll
const MAX_SCROLL_SPEED = 18; // Max auto-scroll px per frame

function findScrollableParent(el: any): HTMLElement | Window {
  if (typeof window === 'undefined' || !el) return window;
  let curr = el.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    const overflowY = style.overflowY || style.overflow;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      if (curr.scrollHeight > curr.clientHeight) {
        return curr;
      }
    }
    curr = curr.parentElement;
  }
  return window;
}

export function SortableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  onItemPress,
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
    translateX: 0,
    translateY: 0,
  });

  const [itemHeight, setItemHeight] = useState<number>(estimatedItemHeight);

  const containerRef = useRef<View>(null);

  // Mutable refs for rock-solid gesture tracking without stale closures
  const holdTimerRef = useRef<any>(null);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const currentClientYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const activeStartIndexRef = useRef<number | null>(null);
  const currentTargetIndexRef = useRef<number | null>(null);
  const itemLayouts = useRef<Record<number, { x: number; y: number; width: number; height: number }>>({});
  const autoScrollFrameRef = useRef<number | null>(null);

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
    (fromIndex: number, deltaX: number, deltaY: number) => {
      const fromItem = itemLayouts.current[fromIndex];
      const avgH = getAverageItemHeight();
      const fromX = fromItem?.x ?? 0;
      const fromY = fromItem?.y ?? fromIndex * avgH;
      const fromW = fromItem?.width ?? 150;
      const fromH = fromItem?.height ?? avgH;

      const currentCenterX = fromX + fromW / 2 + deltaX;
      const currentCenterY = fromY + fromH / 2 + deltaY;

      let bestIndex = fromIndex;
      let minDistance = Infinity;

      for (let i = 0; i < data.length; i++) {
        const item = itemLayouts.current[i];
        const itemX = item?.x ?? 0;
        const itemY = item?.y ?? i * avgH;
        const itemW = item?.width ?? 150;
        const itemH = item?.height ?? avgH;

        const itemCenterX = itemX + itemW / 2;
        const itemCenterY = itemY + itemH / 2;

        const dist = Math.hypot(currentCenterX - itemCenterX, currentCenterY - itemCenterY);
        if (dist < minDistance) {
          minDistance = dist;
          bestIndex = i;
        }
      }

      return Math.max(0, Math.min(data.length - 1, bestIndex));
    },
    [data.length, getAverageItemHeight]
  );

  // Auto-scroll loop when dragging near top/bottom viewport edges
  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return;

    const scrollLoop = () => {
      if (!isDraggingRef.current) {
        stopAutoScroll();
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const clientY = currentClientYRef.current;
        const viewportHeight = window.innerHeight;
        let scrollDelta = 0;

        // Near bottom edge of viewport -> auto-scroll DOWN
        if (clientY > viewportHeight - EDGE_THRESHOLD) {
          const proximity = Math.min(1, (clientY - (viewportHeight - EDGE_THRESHOLD)) / EDGE_THRESHOLD);
          scrollDelta = Math.max(2, Math.round(proximity * MAX_SCROLL_SPEED));
        }
        // Near top edge of viewport -> auto-scroll UP
        else if (clientY < EDGE_THRESHOLD && clientY > 0) {
          const proximity = Math.min(1, (EDGE_THRESHOLD - clientY) / EDGE_THRESHOLD);
          scrollDelta = -Math.max(2, Math.round(proximity * MAX_SCROLL_SPEED));
        }

        if (scrollDelta !== 0) {
          const scrollParent = findScrollableParent(containerRef.current);
          if (scrollParent && scrollParent !== window) {
            (scrollParent as HTMLElement).scrollTop += scrollDelta;
          } else {
            window.scrollBy(0, scrollDelta);
          }

          touchStartYRef.current -= scrollDelta;

          const from = activeStartIndexRef.current ?? 0;
          const currentY = clientY + (window.scrollY || window.pageYOffset || 0);
          const dy = currentY - touchStartYRef.current;
          const dx = touchStartXRef.current ? (touchStartXRef.current - touchStartXRef.current) : 0;
          const target = calculateTargetIndex(from, dx, dy);
          currentTargetIndexRef.current = target;

          setDragState((prev) => ({
            ...prev,
            active: true,
            targetIndex: target,
            translateY: dy,
          }));
        }
      }

      autoScrollFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    autoScrollFrameRef.current = requestAnimationFrame(scrollLoop);
  }, [calculateTargetIndex, stopAutoScroll]);

  // Clean up timers & frames on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  // Start hold gesture
  const startHoldGesture = (index: number, pageX: number, pageY: number, clientY: number) => {
    touchStartXRef.current = pageX;
    touchStartYRef.current = pageY;
    currentClientYRef.current = clientY;
    activeStartIndexRef.current = index;
    currentTargetIndexRef.current = index;
    isDraggingRef.current = false;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Tap-and-hold threshold (180ms)
    holdTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDragState({
        active: true,
        startIndex: index,
        targetIndex: index,
        translateX: 0,
        translateY: 0,
      });
      startAutoScroll();
    }, 180);
  };

  const updateDragPosition = (pageX: number, pageY: number, clientY: number) => {
    currentClientYRef.current = clientY;
    const dy = pageY - touchStartYRef.current;
    const dx = pageX - touchStartXRef.current;

    if (!isDraggingRef.current) {
      // If user moved thumb noticeably before 180ms -> scroll gesture, cancel hold
      if (Math.hypot(dx, dy) > 28) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    } else {
      // Drag is active: update position & target slot in 2D
      const from = activeStartIndexRef.current ?? 0;
      const target = calculateTargetIndex(from, dx, dy);
      currentTargetIndexRef.current = target;

      setDragState((prev) => ({
        ...prev,
        active: true,
        targetIndex: target,
        translateX: dx,
        translateY: dy,
      }));
    }
  };

  const endDragGesture = () => {
    stopAutoScroll();

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
      translateX: 0,
      translateY: 0,
    });
  };

  return (
    <View ref={containerRef} style={[styles.container, style, contentContainerStyle]}>
      {data.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = dragState.active && dragState.startIndex === index;
        const isTarget =
          dragState.active &&
          dragState.targetIndex === index &&
          dragState.startIndex !== index;

        // Mobile touch handlers
        const touchHandlers = {
          onTouchStart: (e: any) => {
            const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
            const clientY = touch.clientY || touch.pageY;
            startHoldGesture(index, touch.pageX, touch.pageY, clientY);
          },
          onTouchMove: (e: any) => {
            const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
            const clientY = touch.clientY || touch.pageY;
            updateDragPosition(touch.pageX, touch.pageY, clientY);
          },
          onTouchEnd: () => {
            const wasDragging = isDraggingRef.current;
            endDragGesture();
            if (!wasDragging && onItemPress) {
              onItemPress(item, index);
            }
          },
          onTouchCancel: () => {
            endDragGesture();
          },
        };

        // Web pointer handlers
        const webPointerHandlers =
          Platform.OS === 'web'
            ? {
                onPointerDown: (e: any) => {
                  const targetTagName = (e.target?.tagName || '').toLowerCase();
                  if (targetTagName === 'input' || targetTagName === 'textarea') {
                    return;
                  }

                  const clientY = e.clientY ?? e.pageY ?? 0;
                  const pageY = e.pageY ?? (clientY + (window.scrollY || 0));
                  const pageX = e.pageX ?? e.clientX ?? 0;

                  startHoldGesture(index, pageX, pageY, clientY);

                  if (typeof window !== 'undefined') {
                    const onPointerMove = (evt: PointerEvent) => {
                      if (isDraggingRef.current) {
                        evt.preventDefault();
                      }
                      const moveClientY = evt.clientY ?? evt.pageY ?? 0;
                      const movePageY = evt.pageY ?? (moveClientY + (window.scrollY || 0));
                      const movePageX = evt.pageX ?? evt.clientX ?? 0;
                      updateDragPosition(movePageX, movePageY, moveClientY);
                    };

                    const onPointerUp = () => {
                      const wasDragging = isDraggingRef.current;
                      endDragGesture();
                      window.removeEventListener('pointermove', onPointerMove);
                      window.removeEventListener('pointerup', onPointerUp);
                      window.removeEventListener('pointercancel', onPointerUp);

                      if (!wasDragging && onItemPress) {
                        onItemPress(item, index);
                      }
                    };

                    window.addEventListener('pointermove', onPointerMove, { passive: false });
                    window.addEventListener('pointerup', onPointerUp);
                    window.addEventListener('pointercancel', onPointerUp);
                  }
                },
              }
            : {};

        return (
          <View
            key={key}
            onLayout={(e) => {
              const { x, y, width, height: h } = e.nativeEvent.layout;
              if (h > 0 && Math.abs(h - itemHeight) > 5) {
                setItemHeight(h);
              }
              itemLayouts.current[index] = {
                x,
                y,
                width,
                height: h,
              };
            }}
            style={[
              styles.itemWrapper,
              itemWrapperStyle,
              isDragging && [
                styles.itemDraggingActive,
                {
                  transform: [
                    { translateX: dragState.translateX },
                    { translateY: dragState.translateY },
                    { scale: 1.05 },
                  ],
                  borderColor: '#6366F1',
                  zIndex: 9999,
                  shadowOpacity: isDark ? 0.5 : 0.25,
                },
              ],
              isTarget && {
                borderColor: '#8B5CF6',
                borderWidth: 2,
                borderRadius: 18,
                transform: [{ scale: 0.98 }],
                opacity: 0.75,
              },
              Platform.OS === 'web'
                ? ({
                    userSelect: dragState.active ? 'none' : 'auto',
                    WebkitUserSelect: dragState.active ? 'none' : 'auto',
                    touchAction: dragState.active ? 'none' : 'pan-y',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging ? 'none' : 'transform 0.16s ease, opacity 0.16s ease',
                  } as any)
                : {},
            ]}
            {...touchHandlers}
            {...webPointerHandlers}
          >
            {renderItem({
              item,
              index,
              total: data.length,
              isDragging,
              isOver: isTarget,
              dragHandle: null,
              moveUp: () => moveUp(index),
              moveDown: () => moveDown(index),
            })}
          </View>
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
});
