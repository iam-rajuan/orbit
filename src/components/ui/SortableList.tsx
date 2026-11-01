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
  const [itemLayoutsState, setItemLayoutsState] = useState<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const containerRef = useRef<View>(null);
  const containerWidthRef = useRef<number>(0);

  // Mutable refs for rock-solid gesture tracking without stale closures
  const holdTimerRef = useRef<any>(null);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const currentClientYRef = useRef<number>(0);
  const currentClientXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const activeStartIndexRef = useRef<number | null>(null);
  const currentTargetIndexRef = useRef<number | null>(null);
  const itemLayouts = useRef<Record<number, { x: number; y: number; width: number; height: number }>>({});
  const autoScrollFrameRef = useRef<number | null>(null);

  const registerLayout = useCallback(
    (index: number, layout: { x: number; y: number; width: number; height: number }) => {
      itemLayouts.current[index] = layout;
      setItemLayoutsState((prev) => {
        const existing = prev[index];
        if (
          existing &&
          existing.x === layout.x &&
          existing.y === layout.y &&
          existing.width === layout.width &&
          existing.height === layout.height
        ) {
          return prev;
        }
        return { ...prev, [index]: layout };
      });
    },
    []
  );

  // Reset layout measurements ref when data length changes
  useEffect(() => {
    itemLayouts.current = {};
  }, [data.length]);

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

  const getSlotLayout = useCallback(
    (slotIndex: number) => {
      const existing = itemLayouts.current[slotIndex];
      if (existing) return existing;

      const avgH = getAverageItemHeight();
      const first = itemLayouts.current[0];
      const second = itemLayouts.current[1];
      const isMultiCol = second && first && Math.abs(second.y - first.y) < 15;

      if (isMultiCol && first) {
        const colCount = Math.max(
          2,
          Math.round((containerWidthRef.current || 360) / (first.width || 160))
        );
        const col = slotIndex % colCount;
        const row = Math.floor(slotIndex / colCount);
        const colW = first.width || 160;
        const gapX = second ? Math.max(0, second.x - (first.x + first.width)) : 10;
        return {
          x: col * (colW + gapX),
          y: row * avgH,
          width: colW,
          height: avgH,
        };
      }

      return {
        x: 0,
        y: slotIndex * avgH,
        width: first?.width ?? 320,
        height: avgH,
      };
    },
    [getAverageItemHeight]
  );

  const getRenderSlotLayout = useCallback(
    (slotIndex: number) => {
      const existing = itemLayoutsState[slotIndex];
      if (existing) return existing;

      const layouts = Object.values(itemLayoutsState);
      const avgH =
        layouts.length > 0
          ? Math.max(45, layouts.reduce((sum, item) => sum + item.height, 0) / layouts.length)
          : estimatedItemHeight;

      const first = itemLayoutsState[0];
      const second = itemLayoutsState[1];
      const isMultiCol = second && first && Math.abs(second.y - first.y) < 15;

      if (isMultiCol && first) {
        const colCount = Math.max(
          2,
          Math.round((containerWidth || 360) / (first.width || 160))
        );
        const col = slotIndex % colCount;
        const row = Math.floor(slotIndex / colCount);
        const colW = first.width || 160;
        const gapX = second ? Math.max(0, second.x - (first.x + first.width)) : 10;
        return {
          x: col * (colW + gapX),
          y: row * avgH,
          width: colW,
          height: avgH,
        };
      }

      return {
        x: 0,
        y: slotIndex * avgH,
        width: first?.width ?? 320,
        height: avgH,
      };
    },
    [itemLayoutsState, estimatedItemHeight, containerWidth]
  );

  const calculateTargetIndex = useCallback(
    (fromIndex: number, deltaX: number, deltaY: number) => {
      const fromItem = getSlotLayout(fromIndex);
      const fromX = fromItem.x;
      const fromY = fromItem.y;
      const fromW = fromItem.width;
      const fromH = fromItem.height;

      const currentCenterX = fromX + fromW / 2 + deltaX;
      const currentCenterY = fromY + fromH / 2 + deltaY;

      let bestIndex = fromIndex;
      let minDistance = Infinity;

      for (let i = 0; i < data.length; i++) {
        const item = getSlotLayout(i);
        const itemCenterX = item.x + item.width / 2;
        const itemCenterY = item.y + item.height / 2;

        const dist = Math.hypot(currentCenterX - itemCenterX, currentCenterY - itemCenterY);
        if (dist < minDistance) {
          minDistance = dist;
          bestIndex = i;
        }
      }

      return Math.max(0, Math.min(data.length - 1, bestIndex));
    },
    [data.length, getSlotLayout]
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
          const dx = (currentClientXRef.current || touchStartXRef.current) - touchStartXRef.current;
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
    currentClientXRef.current = pageX;
    activeStartIndexRef.current = index;
    currentTargetIndexRef.current = index;
    isDraggingRef.current = false;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    // Tap-and-hold threshold (180ms)
    holdTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).vibrate) {
        try {
          (navigator as any).vibrate(15);
        } catch {}
      }
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
    currentClientXRef.current = pageX;
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

  // Helper to compute where other cards shift while moving the selected card
  const getDestinationSlot = (itemIndex: number, from: number | null, to: number | null) => {
    if (from === null || to === null || from === to) return itemIndex;
    if (from < to) {
      if (itemIndex > from && itemIndex <= to) {
        return itemIndex - 1;
      }
    } else if (from > to) {
      if (itemIndex >= to && itemIndex < from) {
        return itemIndex + 1;
      }
    }
    return itemIndex;
  };

  return (
    <View
      ref={containerRef}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        containerWidthRef.current = w;
        setContainerWidth(w);
      }}
      style={[styles.container, style, contentContainerStyle]}
    >
      {/* Drop slot indicator / placeholder when dragging */}
      {dragState.active && dragState.targetIndex !== null && (
        (() => {
          const targetLayout = getRenderSlotLayout(dragState.targetIndex);
          return (
            <View
              style={[
                styles.dropPlaceholder,
                {
                  position: 'absolute',
                  left: targetLayout.x,
                  top: targetLayout.y,
                  width: targetLayout.width,
                  height: targetLayout.height,
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.45)' : 'rgba(99, 102, 241, 0.45)',
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(99, 102, 241, 0.06)',
                  ...(Platform.OS === 'web'
                    ? ({
                        transition:
                          'top 0.24s cubic-bezier(0.2, 0, 0, 1), left 0.24s cubic-bezier(0.2, 0, 0, 1), width 0.2s ease, height 0.2s ease',
                      } as any)
                    : {}),
                },
              ]}
              pointerEvents="none"
            />
          );
        })()
      )}

      {data.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = dragState.active && dragState.startIndex === index;
        const destSlot = getDestinationSlot(index, dragState.startIndex, dragState.targetIndex);

        let shiftX = 0;
        let shiftY = 0;

        if (!isDragging && dragState.active && destSlot !== index) {
          const destLayout = getRenderSlotLayout(destSlot);
          const currLayout = getRenderSlotLayout(index);
          shiftX = destLayout.x - currLayout.x;
          shiftY = destLayout.y - currLayout.y;
        }

        const itemTransform = isDragging
          ? [
              { translateX: dragState.translateX },
              { translateY: dragState.translateY },
              { scale: 1.05 },
            ]
          : shiftX !== 0 || shiftY !== 0
          ? [
              { translateX: shiftX },
              { translateY: shiftY },
            ]
          : undefined;

        // Mobile touch handlers
        const touchHandlers = {
          onTouchStart: (e: any) => {
            const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
            const clientY = touch.clientY || touch.pageY;
            startHoldGesture(index, touch.pageX, touch.pageY, clientY);
          },
          onTouchMove: (e: any) => {
            if (isDraggingRef.current) {
              if (e.cancelable && e.preventDefault) {
                e.preventDefault();
              }
            }
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

                  if (e.target && typeof (e.target as any).setPointerCapture === 'function') {
                    try {
                      (e.target as any).setPointerCapture(e.pointerId);
                    } catch {}
                  }

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
              if (isDraggingRef.current) return;
              const { x, y, width, height: h } = e.nativeEvent.layout;
              if (h > 0 && Math.abs(h - itemHeight) > 5) {
                setItemHeight(h);
              }
              registerLayout(index, { x, y, width, height: h });
            }}
            style={[
              styles.itemWrapper,
              itemWrapperStyle,
              itemTransform ? { transform: itemTransform } : null,
              isDragging && [
                styles.itemDraggingActive,
                {
                  borderColor: '#6366F1',
                  zIndex: 9999,
                  shadowOpacity: isDark ? 0.5 : 0.25,
                },
              ],
              Platform.OS === 'web'
                ? ({
                    userSelect: dragState.active ? 'none' : 'auto',
                    WebkitUserSelect: dragState.active ? 'none' : 'auto',
                    touchAction: dragState.active ? 'none' : 'pan-y',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging
                      ? 'none'
                      : 'transform 0.28s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, opacity 0.2s ease',
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
              isOver: dragState.active && dragState.targetIndex === index,
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
  dropPlaceholder: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 0,
    overflow: 'hidden',
  },
});
