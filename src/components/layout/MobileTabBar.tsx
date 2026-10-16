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
    { title: 'Diet', path: '/nutrition', icon: UtensilsCrossed },
    { title: 'Tasks', path: '/tasks', icon: CheckSquare },
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
                size={20}
                color={isActive ? theme.primary : theme.textMuted}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.tabTitle,
                  { color: isActive ? theme.primary : theme.textMuted },
                  isActive && styles.tabTitleActive,
                ]}
              >
                {tab.title}
              </Text>
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
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
    cursor: 'pointer' as any,
  },
  tabTitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  tabTitleActive: {
    fontWeight: '700',
  },
});
