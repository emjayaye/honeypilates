import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// ─── types ───────────────────────────────────────────────────────────
type AdminSection = 'overview' | 'members' | 'schedule' | 'instructors' | 'plans' | 'reports' | 'settings';

// ─── primitives shared with the dashboard editorial language ────────
const Eyebrow = ({ children, tone = 'ink' }: { children: string; tone?: 'ink' | 'peach' | 'cream' }) => (
  <Text
    className={
      (tone === 'peach' ? 'text-peach ' : tone === 'cream' ? 'text-cream/80 ' : 'text-ink-2 ') +
      'text-[10px] tracking-[0.36em] uppercase font-bodyMd'
    }
  >
    {children}
  </Text>
);
const Body = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-ink-2 font-body text-[15px] leading-7">{children}</Text>
);
const HairlineRule = ({ tone = 'ink' }: { tone?: 'ink' | 'peach' | 'cream' }) => (
  <View
    style={{
      height: 1,
      width: 56,
      backgroundColor: tone === 'peach' ? '#EBC3A1' : tone === 'cream' ? 'rgba(241,232,221,0.6)' : 'rgba(31,31,31,0.35)',
      marginTop: 18,
      marginBottom: 22,
    }}
    accessibilityElementsHidden
    importantForAccessibility="no"
  />
);
const PaperCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View
    className={'p-7 ' + className}
    style={{
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E8DCC9',
      borderRadius: 2,
    }}
  >
    {children}
  </View>
);

// ─── route ──────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { session, isInstructorOrAdmin, loading } = useAuth();

  // Quiet gate: signed-out users bounce to /account so they can sign in.
  // Signed-in non-staff get a polite "not authorized" notice rather than
  // a hard redirect so they understand what happened.
  if (loading) return null;
  if (!session) return <Redirect href="/account" />;
  if (!isInstructorOrAdmin) return <NotAuthorized />;

  return <AdminPanel />;
}

function NotAuthorized() {
  return (
    <ScrollView contentContainerClassName="bg-cream pb-16">
      <View
        className="px-6 pt-20 pb-16"
        style={{ maxWidth: 600, alignSelf: 'center', width: '100%' }}
      >
        <Eyebrow>Restricted</Eyebrow>
        <Text
          className="text-ink font-display italic text-[40px] mt-3 leading-[44px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Studio access only.
        </Text>
        <HairlineRule tone="peach" />
        <Body>
          This area is reserved for Honey Pilates staff. If you should have access,
          ask the studio owner to update your role.
        </Body>
        <View className="mt-7">
          <Link href="/account" asChild>
            <Pressable
              className="border border-ink px-7 py-3.5 active:bg-ink/5 self-start"
              accessibilityRole="link"
              accessibilityLabel="Return to your account"
            >
              <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                Back to my account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── panel shell ────────────────────────────────────────────────────
function AdminPanel() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [section, setSection] = useState<AdminSection>('overview');

  const sections: { key: AdminSection; label: string }[] = useMemo(() => ([
    { key: 'overview',    label: 'Overview' },
    { key: 'members',     label: 'Members' },
    { key: 'schedule',    label: 'Schedule' },
    { key: 'instructors', label: 'Instructors' },
    { key: 'plans',       label: 'Plans' },
    { key: 'reports',     label: 'Reports' },
    { key: 'settings',    label: 'Settings' },
  ]), []);

  return (
    <ScrollView contentContainerClassName="bg-cream pb-24">
      <View
        style={{
          maxWidth: 1240,
          alignSelf: 'center',
          width: '100%',
          flexDirection: isWide ? 'row' : 'column',
          paddingHorizontal: isWide ? 40 : 24,
          paddingTop: isWide ? 32 : 20,
          gap: isWide ? 48 : 16,
        }}
      >
        <AdminSidebar isWide={isWide} section={section} setSection={setSection} sections={sections} />

        <View className="flex-1" style={{ minWidth: 0 }}>
          {section === 'overview'    && <OverviewSection />}
          {section === 'members'     && <MembersSection />}
          {section === 'schedule'    && <ScheduleSection />}
          {section === 'instructors' && <InstructorsSection />}
          {section === 'plans'       && <PlansSection />}
          {section === 'reports'     && <ReportsSection />}
          {section === 'settings'    && <SettingsSection />}
        </View>
      </View>
    </ScrollView>
  );
}

function AdminSidebar({
  isWide, section, setSection, sections,
}: {
  isWide: boolean;
  section: AdminSection;
  setSection: (s: AdminSection) => void;
  sections: { key: AdminSection; label: string }[];
}) {
  return (
    <View style={{ width: isWide ? 232 : '100%', flexShrink: 0 }}>
      <View
        className={isWide ? '' : 'flex-row items-center gap-4'}
      >
        <View
          className="items-center justify-center"
          style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: '#1F1F1F',
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Ionicons name="briefcase-outline" size={22} color="#EBC3A1" />
        </View>
        <View className={isWide ? 'mt-5' : 'flex-1'}>
          <Text className="text-ink font-display italic text-xl leading-6">Studio</Text>
          <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd mt-1">
            Admin Panel
          </Text>
        </View>
      </View>

      <View
        className={isWide ? 'mt-8' : 'mt-5'}
        style={{
          flexDirection: isWide ? 'column' : 'row',
          flexWrap: isWide ? 'nowrap' : 'wrap',
          gap: isWide ? 0 : 8,
        }}
        accessibilityRole={'tablist' as any}
        accessibilityLabel="Admin sections"
      >
        {sections.map((s) => {
          const active = section === s.key;
          if (isWide) {
            return (
              <Pressable
                key={s.key}
                onPress={() => setSection(s.key)}
                className="py-3 active:opacity-60"
                style={{ borderLeftWidth: 2, borderLeftColor: active ? '#1F1F1F' : 'transparent', paddingLeft: 14 }}
                accessibilityRole={'tab' as any}
                accessibilityState={{ selected: active }}
                accessibilityLabel={s.label}
              >
                <Text
                  className={
                    (active ? 'text-ink ' : 'text-ink-2 ') +
                    'font-bodyMd text-[12px] tracking-[0.22em] uppercase'
                  }
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              className="px-4 py-2 active:opacity-60"
              style={{ borderWidth: 1, borderColor: active ? '#1F1F1F' : '#E8DCC9' }}
              accessibilityRole={'tab' as any}
              accessibilityState={{ selected: active }}
            >
              <Text
                className={
                  (active ? 'text-ink ' : 'text-ink-2 ') +
                  'font-bodyMd text-[11px] tracking-[0.22em] uppercase'
                }
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isWide && (
        <>
          <View
            style={{ height: 1, backgroundColor: 'rgba(31,31,31,0.12)', marginTop: 32, marginBottom: 16 }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Link href="/account" asChild>
            <Pressable
              className="py-2 active:opacity-60"
              style={{ paddingLeft: 16 }}
              accessibilityRole="link"
              accessibilityLabel="Back to your member dashboard"
            >
              <Text className="text-ink-2 font-bodyMd text-[11px] tracking-[0.22em] uppercase">
                ← Member view
              </Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
}

// ─── sections ───────────────────────────────────────────────────────
function SectionHero({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <View className="mb-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text
        className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={1}
      >
        {title}
      </Text>
      <HairlineRule tone="peach" />
      {body ? <Body>{body}</Body> : null}
    </View>
  );
}

function OverviewSection() {
  return (
    <>
      <SectionHero
        eyebrow="Studio"
        title="Owner ledger."
        body="A live look across the studio. Each tile below has its own dedicated section in the rail to the left."
      />
      <View className="mt-10"><LiveCountsPanel /></View>
      <View className="mt-12" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        <ShortcutTile label="Members" hint="Roster, roles, notes" href="#" />
        <ShortcutTile label="Schedule" hint="Add or cancel classes" href="#" />
        <ShortcutTile label="Instructors" hint="Bios + availability" href="#" />
      </View>
    </>
  );
}

function MembersSection() {
  return (
    <>
      <SectionHero
        eyebrow="Members"
        title="The roster."
        body="Search, filter, and edit anyone with a Honey Pilates login. Coming up next: search box, role toggle, plan editor."
      />
      <View className="mt-10"><PlaceholderTable label="Member roster lands here" /></View>
    </>
  );
}

function ScheduleSection() {
  return (
    <>
      <SectionHero
        eyebrow="Schedule"
        title="Class calendar."
        body="Add sessions, cancel a class, swap instructors. The grid view lives here next pass; for now we'll use a simple list."
      />
      <View className="mt-10"><PlaceholderTable label="Editable class schedule lands here" /></View>
    </>
  );
}

function InstructorsSection() {
  return (
    <>
      <SectionHero
        eyebrow="Instructors"
        title="Your team."
        body="Bios, photos, and weekly availability. Promote a member to instructor from the member row."
      />
      <View className="mt-10"><PlaceholderTable label="Instructor roster lands here" /></View>
    </>
  );
}

function PlansSection() {
  return (
    <>
      <SectionHero
        eyebrow="Plans"
        title="What you sell."
        body="Class packs, monthly memberships, intro offers — define the catalog members see on the pricing page."
      />
      <View className="mt-10"><PlaceholderTable label="Plan catalog editor lands here" /></View>
    </>
  );
}

function ReportsSection() {
  return (
    <>
      <SectionHero
        eyebrow="Reports"
        title="Studio health."
        body="Weekly attendance, recurring revenue, no-show rates, drop-off cohorts. Charts land in the next pass."
      />
      <View className="mt-10"><PlaceholderTable label="Charts + downloadable CSVs land here" /></View>
    </>
  );
}

function SettingsSection() {
  return (
    <>
      <SectionHero
        eyebrow="Settings"
        title="Studio settings."
        body="Locations, hours, branding, payment gateway, notification templates."
      />
      <View className="mt-10"><PlaceholderTable label="Studio-wide configuration lands here" /></View>
    </>
  );
}

// ─── small parts ────────────────────────────────────────────────────
function ShortcutTile({ label, hint, href }: { label: string; hint: string; href: string }) {
  return (
    <View
      className="p-6 grow basis-[220px]"
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8DCC9',
        borderRadius: 2,
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <Text className="text-ink font-display italic text-2xl mt-3 leading-7">{label}</Text>
      <Text className="text-ink-2 font-body text-sm leading-6 mt-2">{hint}</Text>
    </View>
  );
}

function PlaceholderTable({ label }: { label: string }) {
  return (
    <PaperCard>
      <View
        className="items-center justify-center py-12"
        style={{ borderWidth: 1, borderColor: '#E8DCC9', borderStyle: 'dashed', borderRadius: 2 }}
      >
        <Ionicons name="construct-outline" size={22} color="#777C75" accessibilityElementsHidden importantForAccessibility="no" />
        <Text className="text-ink-2 font-body text-sm mt-3 italic text-center px-6">
          {label}.
        </Text>
        <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd mt-3">
          Coming next
        </Text>
      </View>
    </PaperCard>
  );
}

function LiveCountsPanel() {
  const [counts, setCounts] = useState<{ members: number; memberships: number; sessions7d: number } | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const [m, mem, s] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('class_sessions').select('id', { count: 'exact', head: true })
          .gte('starts_at', new Date().toISOString())
          .lte('starts_at', new Date(Date.now() + 7 * 24 * 3600_000).toISOString()),
      ]);
      if (!live) return;
      setCounts({ members: m.count ?? 0, memberships: mem.count ?? 0, sessions7d: s.count ?? 0 });
    })();
    return () => { live = false; };
  }, []);
  return (
    <View className="p-8" style={{ backgroundColor: '#1F1F1F', borderRadius: 2 }}>
      <Eyebrow tone="peach">Studio ledger</Eyebrow>
      <Text
        className="text-cream font-display italic text-3xl mt-3 leading-9"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={2}
      >
        At a glance.
      </Text>
      <HairlineRule tone="cream" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32 }}>
        <Stat label="Members" value={counts?.members ?? '—'} />
        <Stat label="Active memberships" value={counts?.memberships ?? '—'} />
        <Stat label="Sessions next 7 days" value={counts?.sessions7d ?? '—'} />
      </View>
    </View>
  );
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ minWidth: 140 }}>
      <Text className="text-cream/70 text-[10px] tracking-[0.32em] uppercase font-bodyMd">{label}</Text>
      <Text className="text-cream font-display italic text-[44px] mt-1 leading-[48px]">{value}</Text>
    </View>
  );
}
