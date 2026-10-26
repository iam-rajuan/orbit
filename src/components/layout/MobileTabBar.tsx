import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { theme } = useTheme();
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
          styles.container,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            shadowColor: theme.shadowColor,
            shadowOpacity: theme.shadowOpacity,
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
              style={styles.tabItem}
              accessibilityLabel={tab.title}
            >
              <Icon
                size={19}
                color={isActive ? theme.primary : theme.textMuted}
                strokeWidth={isActive ? 2.4 : 1.8}
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
              {isActive && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
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
  container: {
    height: 64,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 6,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    flex: 1,
    cursor: 'pointer' as any,
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
  activeDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    marginTop: 2,
  },
});
