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
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? 'rgba(18, 18, 22, 0.82)' : 'rgba(255, 255, 255, 0.84)',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(30px) saturate(210%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(210%)',
                } as any)
              : {}),
          },
        ]}
      >
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isMenuTab = tab.path === '#menu';
            const isActive = isMenuTab
              ? menuOpen || pathname.startsWith('/calendar') || pathname.startsWith('/settings')
              : pathname.startsWith(tab.path);
            const Icon = tab.icon;

            const iconColor = isActive ? theme.primary : (isDark ? '#8E8E93' : '#8E8E93');

            return (
              <TouchableOpacity
                key={tab.path}
                activeOpacity={0.65}
                onPress={() => handleTabPress(tab.path)}
                style={styles.tabItem}
                accessibilityLabel={tab.title}
              >
                <View style={styles.iconContainer}>
                  <Icon
                    size={21}
                    color={iconColor}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </View>
                <Text
                  style={[
                    styles.tabTitle,
                    {
                      color: isActive ? theme.primary : '#8E8E93',
                      fontWeight: isActive ? '700' : '500',
                    },
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
  tabBar: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 18 : 26,
    zIndex: 90,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    cursor: 'pointer' as any,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  tabTitle: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
