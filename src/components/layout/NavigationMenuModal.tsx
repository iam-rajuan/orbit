import React, { useState } from 'react';
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
import { BmiCalculatorModal } from '../../features/nutrition/components/BmiCalculatorModal';
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
  Activity,
  Gift,
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
  const [bmiModalOpen, setBmiModalOpen] = useState(false);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  // Primary destinations with concise, professional titles & subtitles
  const primaryUtilities = [
    {
      id: 'upcoming-tasks',
      title: 'Upcoming Tasks',
      subtitle: 'Planned tasks & future notes',
      path: '/tasks?tab=upcoming',
      icon: Sparkles,
      color: '#8B5CF6',
    },
    {
      id: 'wishlist',
      title: 'Wishlist & Buy Later',
      subtitle: 'Saved items & cooling-off tracker',
      path: '/expenses?tab=wishlist',
      icon: Gift,
      color: '#EC4899',
    },
    {
      id: 'bmi',
      title: 'BMI Calculator',
      subtitle: 'Health gauge & healthy weight targets',
      icon: Activity,
      color: '#10B981',
      isBmiModal: true,
      path: '#bmi',
    },
    {
      id: 'calendar',
      title: 'Calendar & History',
      subtitle: 'Monthly records & historical logs',
      path: '/calendar',
      icon: Calendar,
      color: '#F59E0B',
    },
    {
      id: 'settings',
      title: 'Settings & Data',
      subtitle: 'Preferences, backup & appearance',
      path: '/settings',
      icon: Settings,
      color: '#71717A',
    },
  ];

  // Core application modules
  const coreModules = [
    {
      title: 'Dashboard',
      subtitle: 'Daily score, trends & quick overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      color: '#4F46E5',
    },
    {
      title: 'Daily Routine',
      subtitle: 'Habits timeline & streak tracking',
      path: '/routine',
      icon: Clock,
      color: '#10B981',
    },
    {
      title: 'Diet & Nutrition',
      subtitle: 'Meal logs, calories & macros',
      path: '/nutrition',
      icon: UtensilsCrossed,
      color: '#0EA5E9',
      badge: 'New',
    },
    {
      title: 'Tasks',
      subtitle: 'High-impact to-dos & priorities',
      path: '/tasks',
      icon: CheckSquare,
      color: '#8B5CF6',
    },
    {
      title: 'Expenses',
      subtitle: 'Daily spending & budget tracking',
      path: '/expenses',
      icon: Receipt,
      color: '#F43F5E',
    },
  ];

  // Upcoming features on Orbit's product roadmap
  const upcomingRoadmap = [
    {
      title: 'Workout & Fitness Log',
      description: 'Exercise sets, reps & split analytics',
      status: 'Coming Soon',
      statusColor: '#0EA5E9',
      icon: Dumbbell,
    },
    {
      title: 'Sleep & Circadian Rhythm',
      description: 'Sleep recovery & bedtime routine',
      status: 'In Dev',
      statusColor: '#8B5CF6',
      icon: MoonIcon,
    },
    {
      title: 'Mindfulness & Journaling',
      description: 'Daily reflection prompts & mood tracking',
      status: 'Planned',
      statusColor: '#10B981',
      icon: BookOpen,
    },
    {
      title: 'End-to-End Cloud Sync',
      description: 'Multi-device encrypted synchronization',
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
      maxWidth={520}
    >
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Top Orbit Brand Header */}
        <View style={styles.brandRow}>
          <OrbitLogo size={22} showTagline={true} />
          <View
            style={[
              styles.versionPill,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.versionText, { color: theme.textMuted }]}>v4.2.0</Text>
          </View>
        </View>

        {/* Section 1: Features & Utilities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            FEATURES & UTILITIES
          </Text>

          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            {primaryUtilities.map((mod, index) => {
              const isActive = !mod.isBmiModal && pathname.startsWith(mod.path);
              const Icon = mod.icon;

              return (
                <TouchableOpacity
                  key={mod.id || mod.path}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (mod.isBmiModal) {
                      setBmiModalOpen(true);
                    } else {
                      handleNavigate(mod.path);
                    }
                  }}
                  style={[
                    styles.menuRow,
                    index > 0 && [
                      styles.rowDivider,
                      { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ],
                    isActive && {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E4E4E7',
                      },
                    ]}
                  >
                    <Icon size={17} color={mod.color} />
                  </View>

                  <View style={styles.menuTextGroup}>
                    <Text
                      style={[
                        styles.menuTitle,
                        { color: isActive ? theme.primary : theme.textPrimary },
                        isActive && styles.menuTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {mod.title}
                    </Text>
                    <Text
                      style={[styles.menuSubtitle, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
                      {mod.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={15} color={isActive ? theme.primary : theme.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Core Modules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            CORE MODULES
          </Text>

          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            {coreModules.map((mod, index) => {
              const isActive = pathname.startsWith(mod.path);
              const Icon = mod.icon;

              return (
                <TouchableOpacity
                  key={mod.path}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate(mod.path)}
                  style={[
                    styles.menuRow,
                    index > 0 && [
                      styles.rowDivider,
                      { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ],
                    isActive && {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E4E4E7',
                      },
                    ]}
                  >
                    <Icon size={17} color={mod.color} />
                  </View>

                  <View style={styles.menuTextGroup}>
                    <View style={styles.menuTitleRow}>
                      <Text
                        style={[
                          styles.menuTitle,
                          { color: isActive ? theme.primary : theme.textPrimary },
                          isActive && styles.menuTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {mod.title}
                      </Text>
                      {mod.badge && (
                        <View
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: isDark ? '#38BDF8' : '#0284C7',
                              },
                            ]}
                          >
                            {mod.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.menuSubtitle, { color: theme.textMuted }]}
                      numberOfLines={1}
                    >
                      {mod.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={15} color={isActive ? theme.primary : theme.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: Roadmap (Compact) */}
        <View style={styles.section}>
          <View style={styles.roadmapHeaderRow}>
            <Sparkles size={12} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.textMuted, marginBottom: 0 }]}>
              COMING SOON
            </Text>
          </View>

          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            {upcomingRoadmap.map((item, idx) => {
              const Icon = item.icon;
              return (
                <View
                  key={idx}
                  style={[
                    styles.menuRow,
                    idx > 0 && [
                      styles.rowDivider,
                      { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ],
                  ]}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E4E4E7',
                      },
                    ]}
                  >
                    <Icon size={15} color={item.statusColor} />
                  </View>

                  <View style={styles.menuTextGroup}>
                    <View style={styles.menuTitleRow}>
                      <Text style={[styles.menuTitle, { color: theme.textPrimary }]} numberOfLines={1}>
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
                    <Text style={[styles.menuSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Speedometer BMI Calculator Modal */}
      <BmiCalculatorModal
        visible={bmiModalOpen}
        onClose={() => setBmiModalOpen(false)}
      />
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
    paddingBottom: 12,
    marginBottom: 8,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    cursor: 'pointer' as any,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  menuTitleActive: {
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  menuSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  roadmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
