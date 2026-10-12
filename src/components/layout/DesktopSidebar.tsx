import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Receipt,
  Calendar,
  Settings,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { title: 'Daily Routine', path: '/routine', icon: Clock },
    { title: 'Tasks', path: '/tasks', icon: CheckSquare },
    { title: 'Expenses', path: '/expenses', icon: Receipt },
    { title: 'Calendar', path: '/calendar', icon: Calendar },
    { title: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.surface,
          borderRightColor: theme.border,
        },
        collapsed && styles.sidebarCollapsed,
      ]}
    >
      {/* App Branding */}
      <View style={styles.branding}>
        <View style={styles.logoBadge}>
          <Flame size={20} color="#ffffff" />
        </View>
        {!collapsed && (
          <View style={styles.brandText}>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>Daily View</Text>
            <Text style={[styles.appSub, { color: theme.textMuted }]}>V4 • Productivity</Text>
          </View>
        )}
      </View>

      {/* Nav items */}
      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.path}
              activeOpacity={0.7}
              onPress={() => router.push(item.path as any)}
              style={[
                styles.navItem,
                isActive && { backgroundColor: theme.primaryBg },
                collapsed && styles.navItemCollapsed,
              ]}
              accessibilityLabel={item.title}
            >
              <Icon
                size={18}
                color={isActive ? theme.primary : theme.textSecondary}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && (
                <Text
                  style={[
                    styles.navTitle,
                    { color: isActive ? theme.primary : theme.textSecondary },
                    isActive && styles.navTitleActive,
                  ]}
                >
                  {item.title}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Collapse button */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleCollapse}
          style={styles.collapseBtn}
        >
          {collapsed ? (
            <ChevronRight size={18} color={theme.textSecondary} />
          ) : (
            <>
              <ChevronLeft size={18} color={theme.textSecondary} />
              <Text style={[styles.collapseText, { color: theme.textSecondary }]}>Collapse</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  sidebarCollapsed: {
    width: 68,
    paddingHorizontal: 8,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 24,
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  brandText: {
    flexDirection: 'column',
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  appSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  navContainer: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    cursor: 'pointer' as any,
    gap: 12,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  navTitleActive: {
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    cursor: 'pointer' as any,
    gap: 8,
  },
  collapseText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
