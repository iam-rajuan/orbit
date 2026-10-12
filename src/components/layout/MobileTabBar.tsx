import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Receipt,
  Menu,
} from 'lucide-react-native';

export const MobileTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { title: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { title: 'Routine', path: '/routine', icon: Clock },
    { title: 'Tasks', path: '/tasks', icon: CheckSquare },
    { title: 'Expenses', path: '/expenses', icon: Receipt },
    { title: 'More', path: '/calendar', icon: Menu },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive =
          tab.path === '/calendar'
            ? pathname.startsWith('/calendar') || pathname.startsWith('/settings')
            : pathname.startsWith(tab.path);
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={tab.path}
            activeOpacity={0.7}
            onPress={() => router.push(tab.path as any)}
            style={styles.tabItem}
            accessibilityLabel={tab.title}
          >
            <Icon
              size={20}
              color={isActive ? '#4F46E5' : '#71717A'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabTitle,
                isActive && styles.tabTitleActive,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
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
    color: '#71717A',
    marginTop: 4,
  },
  tabTitleActive: {
    fontWeight: '700',
    color: '#4F46E5',
  },
});
