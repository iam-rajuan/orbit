import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  Platform,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';

export interface HorizontalScrollRowProps extends ScrollViewProps {
  children: React.ReactNode;
  edgeToEdge?: boolean;
  paddingHorizontal?: number;
  gap?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const HorizontalScrollRow: React.FC<HorizontalScrollRowProps> = ({
  children,
  edgeToEdge = true,
  paddingHorizontal = 16,
  gap = 6,
  containerStyle,
  contentContainerStyle,
  style,
  ...rest
}) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // React Native Web internal scrollable DOM element
    const scrollNode =
      (scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement })?.getScrollableNode?.() ||
      (scrollRef.current as unknown as HTMLElement);

    if (!scrollNode || typeof scrollNode.addEventListener !== 'function') return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    const onMouseDown = (e: MouseEvent) => {
      // Primary button only
      if (e.button !== 0) return;
      isDown = true;
      hasMoved = false;
      startX = e.pageX - scrollNode.offsetLeft;
      scrollLeft = scrollNode.scrollLeft;
      scrollNode.style.cursor = 'grabbing';
      scrollNode.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollNode.offsetLeft;
      const walk = (x - startX) * 1.35;
      if (Math.abs(walk) > 4) {
        hasMoved = true;
      }
      scrollNode.scrollLeft = scrollLeft - walk;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      scrollNode.style.cursor = 'grab';
      scrollNode.style.removeProperty('user-select');
    };

    const onMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      scrollNode.style.cursor = 'grab';
      scrollNode.style.removeProperty('user-select');
    };

    const onClickCapture = (e: MouseEvent) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
        hasMoved = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) > 0 && e.shiftKey) {
        scrollNode.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    scrollNode.style.cursor = 'grab';
    scrollNode.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    scrollNode.addEventListener('mouseleave', onMouseLeave);
    scrollNode.addEventListener('click', onClickCapture, true);
    scrollNode.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      scrollNode.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      scrollNode.removeEventListener('mouseleave', onMouseLeave);
      scrollNode.removeEventListener('click', onClickCapture, true);
      scrollNode.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <View
      style={[
        styles.wrapper,
        edgeToEdge && {
          marginHorizontal: -paddingHorizontal,
        },
        containerStyle,
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        style={[
          styles.scrollView,
          style,
        ]}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: edgeToEdge ? paddingHorizontal : 0,
            gap,
          },
          contentContainerStyle,
        ]}
        {...rest}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 'auto',
  },
  scrollView: {
    flexGrow: 0,
    ...Platform.select({
      web: {
        touchAction: 'pan-x',
        overflowX: 'auto',
      },
    }),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
