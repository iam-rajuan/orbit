import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Receipt,
  UtensilsCrossed,
  Menu,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { NavigationMenuModal } from './NavigationMenuModal';

export const MobileTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { title: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { title: 'Routine', path: '/routine', icon: Clock },
    { title: 'Tasks', path: '/tasks', icon: CheckSquare },
    { title: 'Diet', path: '/nutrition', icon: UtensilsCrossed },
    { title: 'Expenses', path: '/expenses', icon: Receipt },
    { title: 'Menu', path: '#menu', icon: Menu },
  ];

  const handleTabPress = (path: string) => {
    if (path === '#menu') {
      setMenuOpen(true);
    } else {
      router.push(path as any);
    }
  };

  return (
    <>
      <View style={styles.floatingWrapper}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 28, 0.78)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
              shadowColor: '#000000',
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 18,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(30px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(190%)',
                  } as any)
                : {}),
            },
          ]}
        >
          {tabs.map((tab) => {
            const isMenuTab = tab.path === '#menu';
            const isActive = isMenuTab
              ? menuOpen || pathname.startsWith('/calendar') || pathname.startsWith('/settings')
              : pathname.startsWith(tab.path);
            const Icon = tab.icon;

            return (
              <TouchableOpacity
                key={tab.path}
                activeOpacity={0.7}
                onPress={() => handleTabPress(tab.path)}
                style={[
                  styles.tabItem,
                  isActive && [
                    styles.tabItemActive,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.18)'
                        : 'rgba(79, 70, 229, 0.09)',
                    },
                  ],
                ]}
                accessibilityLabel={tab.title}
              >
                <Icon
                  size={18}
                  color={isActive ? theme.primary : theme.textMuted}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                <Text
                  style={[
                    styles.tabTitle,
                    { color: isActive ? theme.primary : theme.textMuted },
                    isActive && styles.tabTitleActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Merged Navigation Menu Modal */}
      <NavigationMenuModal
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 3,
    backgroundColor: 'transparent',
  },
  container: {
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingVertical: 3,
    elevation: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 20,
    flex: 1,
    cursor: 'pointer' as any,
  },
  tabItemActive: {
    transform: [{ scale: 1.02 }],
  },
  tabTitle: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  tabTitleActive: {
    fontWeight: '700',
  },
});
