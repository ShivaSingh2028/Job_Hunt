import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import {
  Button,
  TextField,
  Card,
  JobCard,
  Chip,
  Avatar,
  Badge,
  SectionHeader,
  EmptyState,
  ErrorState,
  SkeletonJobCard,
  SkeletonListItem,
  Banner,
  ModalSheet,
  ListItem,
  KeyboardScreen,
} from '../src/components/ui';
import type { Job } from '../src/types';

export default function DesignPreviewScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme, typography, spacing, radii } = useTheme();

  // Interactive state
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['All']);
  const [inputText, setInputText] = useState('');
  const [passwordText, setPasswordText] = useState('Secret123!');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const sampleShortTermJob: Job = {
    id: 'demo-1',
    title: 'Event Bartender & Server',
    description: 'Looking for friendly staff for a weekend corporate event. Uniform provided on site.',
    type: 'SHORT_TERM',
    status: 'OPEN',
    pay: 850,
    payUnit: 'FIXED',
    openings: 3,
    filledCount: 1,
    startDate: '2026-11-15T00:00:00.000Z',
    endDate: null,
    startTime: '16:00',
    endTime: '23:00',
    location: {
      lat: 19.076,
      lng: 72.8777,
      label: 'Bandra Kurla Complex, Mumbai',
    },
    approximateDistance: 1800,
    isRemote: false,
    isSaved: false,
    postedBy: {
      id: 'recruiter-1',
      name: 'Apex Events Co.',
      avatarUrl: null,
    },
    createdAt: new Date().toISOString(),
  };

  const sampleLongTermJob: Job = {
    id: 'demo-2',
    title: 'Warehouse Logistics Supervisor',
    description: 'Full-time supervisor managing morning inventory dispatch and team coordination.',
    type: 'LONG_TERM',
    status: 'OPEN',
    pay: 25000,
    payUnit: 'PER_MONTH',
    openings: 2,
    filledCount: 1,
    startDate: '2026-12-01T00:00:00.000Z',
    endDate: null,
    startTime: null,
    endTime: null,
    location: {
      lat: 19.076,
      lng: 72.8777,
      label: 'Andheri East, Mumbai',
    },
    approximateDistance: 4500,
    isRemote: false,
    isSaved: true,
    postedBy: {
      id: 'recruiter-2',
      name: 'BlueDart Hubs',
      avatarUrl: null,
    },
    createdAt: new Date().toISOString(),
  };

  return (
    <KeyboardScreen>
      {/* Header Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={{ ...typography.secondary, color: colors.text, fontWeight: '600' }}>
            Back
          </Text>
        </TouchableOpacity>

        {/* Dark/Light mode switcher */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.surfaceElevated,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={16}
            color={isDark ? colors.accent : colors.primary}
          />
          <Text style={{ ...typography.caption, color: colors.text, fontWeight: '600' }}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ ...typography.display, color: colors.text, marginBottom: 4 }}>
        Design System
      </Text>
      <Text style={{ ...typography.secondary, color: colors.textSecondary, marginBottom: spacing.xl }}>
        Production-grade tokens, components, and semantic states.
      </Text>

      {/* 1. Color Palette */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Color Palette" subtitle="Single theme tokens for Light & Dark mode" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.primary }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Primary</Text>
          </View>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryLight }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Primary Tint</Text>
          </View>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.accent }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Accent</Text>
          </View>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Success</Text>
          </View>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warningBorder }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Warning</Text>
          </View>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Danger</Text>
          </View>
          <View style={styles.colorSwatchContainer}>
            <View style={[styles.colorBox, { backgroundColor: colors.infoBg, borderWidth: 1, borderColor: colors.infoBorder }]} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Info</Text>
          </View>
        </View>
      </Card>

      {/* 2. Typography Scale */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Typography Scale" subtitle="Inter font family with tabular figures" />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Text style={{ ...typography.display, color: colors.text }}>Display 32px Bold</Text>
          <Text style={{ ...typography.title, color: colors.text }}>Title 24px Semibold</Text>
          <Text style={{ ...typography.heading, color: colors.text }}>Heading 18px Semibold</Text>
          <Text style={{ ...typography.body, color: colors.text }}>Body 16px Regular for crisp reading</Text>
          <Text style={{ ...typography.secondary, color: colors.textSecondary }}>Secondary 14px Regular for captions & hints</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Caption 12px Medium for meta and badges</Text>
          <Text style={{ ...typography.body, color: colors.primary, fontVariant: ['tabular-nums'], fontWeight: '600' }}>
            Tabular Numbers: ₹1,250.00 • 2.4 km • 4.9 ★ • 14 Nov 2026
          </Text>
        </View>
      </Card>

      {/* 3. Buttons */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Buttons" subtitle="52px primary touch targets with states" />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Button label="Primary Button" onPress={() => {}} variant="primary" />
          <Button label="Secondary Button" onPress={() => {}} variant="secondary" />
          <Button label="Outline Button" onPress={() => {}} variant="outline" />
          <Button label="Destructive Button" onPress={() => {}} variant="destructive" />
          <Button label="Ghost Button" onPress={() => {}} variant="ghost" />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="With Left Icon"
              onPress={() => {}}
              variant="primary"
              size="md"
              style={{ flex: 1 }}
              leftIcon={<Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
            />
            <Button
              label="Loading"
              onPress={() => {}}
              loading
              variant="primary"
              size="md"
              style={{ flex: 1 }}
            />
          </View>
          <Button label="Disabled Button" onPress={() => {}} disabled variant="primary" />
        </View>
      </Card>

      {/* 4. Text Fields */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Text Inputs" subtitle="Top labels, icon slots, error states, and eye toggle" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <TextField
            label="Full Name"
            placeholder="e.g. Shiva Singh"
            value={inputText}
            onChangeText={setInputText}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            helperText="Enter your official name as shown on ID"
          />
          <TextField
            label="Password"
            placeholder="Enter password"
            value={passwordText}
            onChangeText={setPasswordText}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          />
          <TextField
            label="Email Address"
            placeholder="name@example.com"
            value="invalid-email@"
            error="Please enter a valid email address"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.danger} />}
          />
        </View>
      </Card>

      {/* 5. Chips & Badges */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Chips & Badges" subtitle="Semantic status chips and interactive filters" />
        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Semantic Statuses:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
          <Chip label="Open" variant="success" />
          <Chip label="Short-term" variant="warning" />
          <Chip label="Long-term" variant="info" />
          <Chip label="Remote" variant="info" />
          <Chip label="Cancelled" variant="danger" />
          <Chip label="Completed" variant="neutral" />
        </View>

        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Selectable Filter Chips:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
          {['All', 'Within 5 km', 'Short-term', 'High Pay (₹800+)'].map((filter) => (
            <Chip
              key={filter}
              label={filter}
              selected={selectedFilters.includes(filter)}
              onPress={() => toggleFilter(filter)}
            />
          ))}
        </View>

        <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Badges & Counters:
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Badge label="3" variant="primary" />
          <Badge label="99+" variant="danger" />
          <Badge label="Active" variant="success" />
          <Badge dot variant="success" />
          <Badge dot variant="danger" />
        </View>
      </Card>

      {/* 6. Avatars */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Avatars" subtitle="Initials fallback, verified & online status indicators" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs }}>
          <Avatar name="Shiva Singh" size="sm" isOnline />
          <Avatar name="Alex Rivera" size="md" isVerified />
          <Avatar name="Priya Sharma" size="lg" isOnline />
          <Avatar name="Recruiter Corp" size="xl" isVerified />
        </View>
      </Card>

      {/* 7. Job Cards */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Job Cards" subtitle="Standardized cards for Short-term and Long-term gigs" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <JobCard
            job={sampleShortTermJob}
            onPress={() => {}}
            quickActionLabel="Apply"
            onQuickAction={() => {}}
          />
          <JobCard
            job={sampleLongTermJob}
            onPress={() => {}}
            quickActionLabel="View"
            onQuickAction={() => {}}
          />
        </View>
      </Card>

      {/* 8. List Items */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="List Items" subtitle="Structured rows for settings, accounts and profile" />
        <View style={{ marginTop: spacing.xs }}>
          <ListItem
            title="Account Security"
            subtitle="Password, 2-factor verification"
            leftIcon={<Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />}
            onPress={() => {}}
          />
          <View style={{ height: 1, backgroundColor: colors.borderSubtle }} />
          <ListItem
            title="Notification Preferences"
            subtitle="Push alerts for nearby gigs"
            leftIcon={<Ionicons name="notifications-outline" size={22} color={colors.primary} />}
            onPress={() => {}}
          />
          <View style={{ height: 1, backgroundColor: colors.borderSubtle }} />
          <ListItem
            title="Log Out"
            subtitle="Sign out of this session"
            destructive
            leftIcon={<Ionicons name="log-out-outline" size={22} color={colors.danger} />}
            onPress={() => {}}
          />
        </View>
      </Card>

      {/* 9. Feedback & Banners */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Banners & Feedback" subtitle="Non-intrusive notices for states" />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {bannerVisible && (
            <Banner
              variant="success"
              title="Application Submitted"
              message="The recruiter will review your profile and respond soon."
              onDismiss={() => setBannerVisible(false)}
            />
          )}
          <Banner
            variant="warning"
            title="Location Permission Recommended"
            message="Enable precise location to view gigs within 5 km."
            actionLabel="Settings"
            onAction={() => {}}
          />
          <Banner
            variant="danger"
            title="Connection Interrupted"
            message="Check your network connection and try again."
          />
          <Banner
            variant="offline"
            title="Offline Mode"
            message="Viewing saved gigs offline. Changes will sync when reconnected."
          />
        </View>
      </Card>

      {/* 10. Skeletons */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Loading Skeletons" subtitle="Smooth shimmer placeholders" />
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <SkeletonJobCard />
          <SkeletonListItem />
        </View>
      </Card>

      {/* 11. Empty & Error States */}
      <Card style={{ marginBottom: spacing.lg }}>
        <SectionHeader title="Empty & Error States" subtitle="Consistent illustration, copy and retry actions" />
        <EmptyState
          title="No gigs found"
          description="Try broadening your search radius or clearing some filters."
          actionLabel="Reset Filters"
          onAction={() => setSelectedFilters(['All'])}
        />
        <ErrorState
          inline
          title="Could not load nearby gigs"
          message="Server response timed out."
          onRetry={() => {}}
        />
      </Card>

      {/* 12. Modal BottomSheet Trigger */}
      <Card style={{ marginBottom: spacing.xxxl }}>
        <SectionHeader title="Modal BottomSheet" subtitle="Bottom sheet overlay with handle and close" />
        <Button
          label="Open Preview Bottom Sheet"
          variant="secondary"
          onPress={() => setSheetVisible(true)}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {/* Bottom Sheet Component */}
      <ModalSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Quick Filter Sheet"
        subtitle="Refine your gig search parameters"
      >
        <View style={{ gap: spacing.md, paddingVertical: spacing.md }}>
          <Text style={{ ...typography.secondary, color: colors.textSecondary }}>
            This modal bottom sheet slides up gracefully with drag handle, responsive backdrop dismiss, and keyboard-aware padding.
          </Text>
          <TextField label="Search by keyword" placeholder="e.g. Barista, Warehouse..." />
          <Button
            label="Apply Filters"
            variant="primary"
            onPress={() => setSheetVisible(false)}
          />
        </View>
      </ModalSheet>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  colorSwatchContainer: {
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  colorBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
});
