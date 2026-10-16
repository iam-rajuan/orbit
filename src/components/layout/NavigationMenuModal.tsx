import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { AppModal } from '../ui/AppModal';
import { OrbitLogo } from '../brand/OrbitLogo';
import {
  LayoutDashboard,
  Clock,
  UtensilsCrossed,
  CheckSquare,
  Receipt,
  Calendar,
  Settings,
  Dumbbell,
  Moon as MoonIcon,
  BookOpen,
  Cloud,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

interface NavigationMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NavigationMenuModal: React.FC<NavigationMenuModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark } = useTheme();

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const currentModules = [
    {
      title: 'Dashboard',
      subtitle: 'Productivity score, trends & daily pulse',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: '#4F46E5',
      badge: 'Core',
    },
    {
      title: 'Daily Routine',
      subtitle: 'Habits timeline & completion tracking',
      path: '/routine',
      icon: Clock,
      color: '#10B981',
      badge: 'Habits',
    },
    {
      title: 'Diet & Nutrition',
      subtitle: 'Calorie tracking, macros, deficit & meal routine',
      path: '/nutrition',
      icon: UtensilsCrossed,
      color: '#0EA5E9',
      badge: 'New',
    },
    {
      title: 'Tasks & Projects',
      subtitle: 'High-impact to-do list, priorities & categories',
      path: '/tasks',
      icon: CheckSquare,
      color: '#8B5CF6',
    },
    {
      title: 'Expenses & Budget',
      subtitle: 'Daily spending ledger, Needs vs. Wants',
      path: '/expenses',
      icon: Receipt,
      color: '#F43F5E',
    },
    {
      title: 'Calendar & History',
      subtitle: 'Monthly overview & historical log review',
      path: '/calendar',
      icon: Calendar,
      color: '#F59E0B',
    },
    {
      title: 'Settings & Data',
      subtitle: 'Preferences, export/import, themes & currency',
      path: '/settings',
      icon: Settings,
      color: '#71717A',
    },
  ];

  const upcomingRoadmap = [
    {
      title: 'Workout & Fitness Log',
      description: 'Exercise sets, reps, personal records & muscle split analytics',
      status: 'Coming Soon',
      statusColor: '#0EA5E9',
      icon: Dumbbell,
    },
    {
      title: 'Sleep & Circadian Rhythm',
      description: 'Sleep duration, recovery scores & optimal bedtime habits',
      status: 'In Development',
      statusColor: '#8B5CF6',
      icon: MoonIcon,
    },
    {
      title: 'Mindfulness & Journaling',
      description: 'Daily reflection prompts, mental clarity & mood logs',
      status: 'Planned',
      statusColor: '#10B981',
      icon: BookOpen,
    },
    {
      title: 'End-to-End Cloud Sync',
      description: 'Encrypted multi-device sync across iOS, Android & Desktop',
      status: 'Planned',
      statusColor: '#F59E0B',
      icon: Cloud,
    },
  ];

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title=""
      maxWidth={540}
    >
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Top Orbit Brand Header */}
        <View style={styles.brandRow}>
          <OrbitLogo size={24} showTagline={true} />
          <View
            style={[
              styles.versionPill,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.versionText, { color: theme.textMuted }]}>v4.2.0</Text>
          </View>
        </View>

        {/* Section 1: Active App Modules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            APPLICATION MODULES
          </Text>

          <View style={styles.modulesList}>
            {currentModules.map((mod) => {
              const isActive = pathname.startsWith(mod.path);
              const Icon = mod.icon;

              return (
                <TouchableOpacity
                  key={mod.path}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate(mod.path)}
                  style={[
                    styles.moduleCard,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.15)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E4E4E7',
                      },
                    ]}
                  >
                    <Icon size={18} color={mod.color} />
                  </View>

                  <View style={styles.moduleTextGroup}>
                    <View style={styles.moduleTitleRow}>
                      <Text
                        style={[
                          styles.moduleTitle,
                          { color: isActive ? theme.primary : theme.textPrimary },
                          isActive && styles.moduleTitleActive,
                        ]}
                      >
                        {mod.title}
                      </Text>
                      {mod.badge && (
                        <View
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor:
                                mod.badge === 'New'
                                  ? isDark
                                    ? 'rgba(14, 165, 233, 0.2)'
                                    : '#E0F2FE'
                                  : isDark
                                  ? 'rgba(99, 102, 241, 0.2)'
                                  : '#EEF2FF',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color:
                                  mod.badge === 'New'
                                    ? isDark
                                      ? '#38BDF8'
                                      : '#0284C7'
                                    : theme.primary,
                              },
                            ]}
                          >
                            {mod.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.moduleSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                      {mod.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={16} color={isActive ? theme.primary : theme.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Upcoming in Orbit (Roadmap) */}
        <View style={styles.section}>
          <View style={styles.roadmapHeaderRow}>
            <Sparkles size={14} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.textMuted, marginBottom: 0 }]}>
              UPCOMING IN FUTURE UPDATES
            </Text>
          </View>

          <View style={styles.roadmapList}>
            {upcomingRoadmap.map((item, idx) => {
              const Icon = item.icon;
              return (
                <View
                  key={idx}
                  style={[
                    styles.roadmapCard,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.roadmapIconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#FFFFFF',
                      },
                    ]}
                  >
                    <Icon size={16} color={item.statusColor} />
                  </View>

                  <View style={styles.roadmapTextGroup}>
                    <View style={styles.roadmapTitleRow}>
                      <Text style={[styles.roadmapTitle, { color: theme.textPrimary }]}>
                        {item.title}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : '#F4F4F5',
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: item.statusColor }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.roadmapDesc, { color: theme.textMuted }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    maxHeight: 560,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  versionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modulesList: {
    gap: 6,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    cursor: 'pointer' as any,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextGroup: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  moduleTitleActive: {
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  moduleSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  roadmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roadmapList: {
    gap: 6,
  },
  roadmapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  roadmapIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapTextGroup: {
    flex: 1,
  },
  roadmapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  roadmapTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  roadmapDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
