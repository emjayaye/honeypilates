import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// ─── types ───────────────────────────────────────────────────────────
type AdminSection = 'overview' | 'members' | 'schedule' | 'instructors' | 'rewards' | 'messages' | 'plans' | 'reports' | 'settings';

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
    { key: 'rewards',     label: 'Rewards' },
    { key: 'messages',    label: 'Messages' },
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
          {section === 'rewards'     && <RewardsSection />}
          {section === 'messages'    && <MessagesSection />}
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
  const [members, setMembers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, email, full_name, preferred_name, role, joined_at')
      .order('joined_at', { ascending: false })
      .limit(200);
    setMembers(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (id: string, role: 'member' | 'instructor' | 'admin') => {
    setBusyId(id);
    await supabase.from('members').update({ role }).eq('id', id);
    await load();
    setBusyId(null);
  };

  const filtered = members.filter((m) => {
    const q = filter.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.full_name ?? '').toLowerCase().includes(q) ||
      (m.preferred_name ?? '').toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionHero
        eyebrow="Members"
        title="The roster."
        body="Every Honey Pilates account. Use the role chip to promote an instructor or grant admin access."
      />
      <View className="mt-8">
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Search by name or email"
          placeholderTextColor="#A89E89"
          accessibilityLabel="Search members"
          className="text-ink font-body text-base"
          style={{
            borderWidth: 1,
            borderColor: '#E8DCC9',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        />
      </View>
      <View className="mt-6 gap-2">
        {filtered.length === 0 ? (
          <PaperCard><Text className="text-ink-2 font-body italic text-sm">No members match.</Text></PaperCard>
        ) : filtered.map((m) => {
          const name = m.preferred_name ?? m.full_name ?? m.email;
          const initials = (name?.split(/\s+/).map((p: string) => p[0]).join('').slice(0, 2) ?? '·').toUpperCase();
          return (
            <View
              key={m.id}
              className="p-5"
              style={{
                backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2,
                flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <View className="flex-row items-center gap-4" style={{ minWidth: 0, flexShrink: 1, flexGrow: 1, basis: 240 }}>
                <View
                  className="items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(235,195,161,0.18)', borderWidth: 1, borderColor: '#EBC3A1' }}
                  accessibilityElementsHidden importantForAccessibility="no"
                >
                  <Text className="text-ink font-display italic text-base">{initials}</Text>
                </View>
                <View style={{ minWidth: 0, flex: 1 }}>
                  <Text className="text-ink font-display italic text-lg leading-6" numberOfLines={1}>{name}</Text>
                  <Text className="text-ink-2 font-body text-sm leading-6" numberOfLines={1}>
                    {m.email} · joined {new Date(m.joined_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(['member', 'instructor', 'admin'] as const).map((r) => {
                  const active = m.role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => !active && setRole(m.id, r)}
                      disabled={active || busyId === m.id}
                      className="px-3 py-2 active:opacity-60"
                      style={{ borderWidth: 1, borderColor: active ? '#1F1F1F' : '#E8DCC9', opacity: busyId === m.id ? 0.5 : 1 }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Set ${name} as ${r}`}
                    >
                      <Text className={(active ? 'text-ink ' : 'text-ink-2 ') + 'font-bodyMd text-[10px] tracking-[0.22em] uppercase'}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function ScheduleSection() {
  return (
    <>
      <SectionHero
        eyebrow="Schedule"
        title="Class calendar."
        body="Create a session, mark attendance, cancel a class. Real grid-calendar view is the next pass."
      />
      <View className="mt-10"><CreateSessionForm /></View>
      <View className="mt-10"><UpcomingSessionsList /></View>
      <View className="mt-10"><AttendanceLog /></View>
    </>
  );
}

function CreateSessionForm() {
  const [classTypes, setClassTypes] = useState<{ id: string; name: string; duration_min: number; default_capacity: number }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; preferred_name: string | null; full_name: string | null }[]>([]);
  const [classTypeId, setClassTypeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const [ct, loc, ins] = await Promise.all([
        supabase.from('class_types').select('id,name,duration_min,default_capacity').eq('is_active', true).order('sort_order'),
        supabase.from('studio_locations').select('id,name').eq('is_active', true),
        supabase.from('members').select('id,preferred_name,full_name').in('role', ['instructor', 'admin']).order('full_name'),
      ]);
      setClassTypes(ct.data ?? []);
      setLocations(loc.data ?? []);
      setInstructors(ins.data ?? []);
    })();
  }, []);

  const submit = async () => {
    setFlash(null);
    if (!classTypeId || !locationId || !startsAt) {
      setFlash({ kind: 'err', text: 'Pick a class type, location, and start time.' });
      return;
    }
    setBusy(true);
    try {
      const ct = classTypes.find((c) => c.id === classTypeId);
      const start = new Date(startsAt);
      if (Number.isNaN(start.getTime())) throw new Error('Invalid start time. Use YYYY-MM-DD HH:MM');
      const end = new Date(start.getTime() + (ct?.duration_min ?? 60) * 60_000);
      const { error } = await supabase.from('class_sessions').insert({
        class_type_id: classTypeId,
        location_id: locationId,
        instructor_id: instructorId || null,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        capacity: parseInt(capacity, 10) || (ct?.default_capacity ?? 8),
      });
      if (error) throw error;
      setFlash({ kind: 'ok', text: 'Session created.' });
      setStartsAt('');
    } catch (e: any) {
      setFlash({ kind: 'err', text: e?.message ?? 'Could not create session.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="p-7" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2 }}>
      <Eyebrow>New session</Eyebrow>
      <Text className="text-ink font-display italic text-2xl mt-3 leading-7">Schedule a class.</Text>
      <HairlineRule />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        <Field label="Class type">
          <Select value={classTypeId} onChange={setClassTypeId}
            options={classTypes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Pick a class" />
        </Field>
        <Field label="Location">
          <Select value={locationId} onChange={setLocationId}
            options={locations.map((l) => ({ value: l.id, label: l.name }))}
            placeholder="Pick a studio" />
        </Field>
        <Field label="Instructor (optional)">
          <Select value={instructorId} onChange={setInstructorId}
            options={[{ value: '', label: 'Unassigned' }, ...instructors.map((i) => ({
              value: i.id, label: i.preferred_name ?? i.full_name ?? 'Staff',
            }))]} />
        </Field>
        <Field label="Starts at">
          <TextInput
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="2026-05-20 18:00"
            placeholderTextColor="#A89E89"
            className="text-ink font-body text-base"
            style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9', paddingVertical: 10, minWidth: 220 }}
          />
        </Field>
        <Field label="Capacity">
          <TextInput
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
            className="text-ink font-body text-base"
            style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9', paddingVertical: 10, minWidth: 80 }}
          />
        </Field>
      </View>

      {flash && (
        <View
          className="mt-5 p-3"
          style={{
            backgroundColor: flash.kind === 'ok' ? '#FAEEE3' : '#FBE2E0',
            borderWidth: 1,
            borderColor: flash.kind === 'ok' ? '#EBC3A1' : '#D88883',
          }}
          accessibilityLiveRegion="polite"
        >
          <Text className="text-ink font-body text-sm">{flash.text}</Text>
        </View>
      )}

      <Pressable
        onPress={submit}
        disabled={busy}
        className="bg-ink px-6 py-3 mt-6 self-start active:opacity-80"
        style={busy ? { opacity: 0.5 } : undefined}
        accessibilityRole="button"
        accessibilityLabel="Create session"
      >
        <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">
          {busy ? 'Saving…' : 'Create session'}
        </Text>
      </Pressable>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexGrow: 1, basis: 200, minWidth: 200 } as any}>
      <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">{label}</Text>
      {children}
    </View>
  );
}

// Lightweight cross-platform select — chip row that toggles selection.
// Real native picker can swap in later; this works on web + RN.
function Select({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.length === 0 && placeholder && (
        <Text className="text-ink-2 font-body italic text-sm">{placeholder}</Text>
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value || 'none'}
            onPress={() => onChange(o.value)}
            className="px-3 py-2 active:opacity-60"
            style={{ borderWidth: 1, borderColor: active ? '#1F1F1F' : '#E8DCC9' }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            <Text className={(active ? 'text-ink ' : 'text-ink-2 ') + 'font-bodyMd text-[11px] tracking-[0.12em]'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function UpcomingSessionsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const { data } = await supabase
      .from('class_sessions')
      .select(`id, starts_at, capacity, cancelled_at,
               class_type:class_types(name),
               location:studio_locations(name),
               instructor:members(preferred_name, full_name)`)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(20);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);
  const cancel = async (id: string) => {
    setBusy(id);
    await supabase.from('class_sessions').update({ cancelled_at: new Date().toISOString(), cancel_reason: 'Cancelled by studio' }).eq('id', id);
    await load();
    setBusy(null);
  };
  return (
    <View>
      <Eyebrow>Upcoming sessions</Eyebrow>
      <HairlineRule />
      {rows.length === 0 ? (
        <PlaceholderTable label="No upcoming sessions yet" />
      ) : (
        <View className="gap-2">
          {rows.map((r) => {
            const time = new Date(r.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
            const instr = r.instructor?.preferred_name ?? r.instructor?.full_name ?? 'unassigned';
            return (
              <View
                key={r.id}
                className="p-5"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2,
                         flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
              >
                <View style={{ minWidth: 0, flexShrink: 1 }}>
                  <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">{time}</Text>
                  <Text className="text-ink font-display italic text-lg leading-6 mt-1">
                    {r.class_type?.name ?? 'Class'}
                  </Text>
                  <Text className="text-ink-2 font-body text-sm leading-6 mt-0.5">
                    {r.location?.name} · with {instr} · cap {r.capacity}
                  </Text>
                </View>
                <Pressable
                  onPress={() => cancel(r.id)}
                  disabled={busy === r.id}
                  className="border border-ink-2 px-4 py-2 active:bg-ink/5"
                  accessibilityRole="button"
                  accessibilityLabel={`Cancel class on ${time}`}
                >
                  <Text className="text-ink-2 font-bodyBold tracking-[0.22em] uppercase text-[10px]">
                    {busy === r.id ? '…' : 'Cancel'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function AttendanceLog() {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    // Pull recent booked / waitlisted reservations for the next 7 days
    // so the owner can mark attendance after each class.
    const { data } = await supabase
      .from('reservations')
      .select(`id, status, member_id,
               member:members(preferred_name, full_name, email),
               class_session:class_sessions(id, starts_at,
                 class_type:class_types(name),
                 location:studio_locations(name))`)
      .in('status', ['booked', 'waitlist', 'attended'])
      .order('id', { ascending: false })
      .limit(40);
    setRows((data ?? []).filter((r: any) => r.class_session));
  };
  useEffect(() => { load(); }, []);

  const mark = async (id: string) => {
    setBusy(id);
    try {
      await supabase.rpc('mark_attended', { p_reservation_id: id });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View>
      <Eyebrow>Reservations</Eyebrow>
      <HairlineRule />
      {rows.length === 0 ? (
        <PlaceholderTable label="No reservations yet — they appear here as members reserve" />
      ) : (
        <View className="gap-2">
          {rows.map((r) => {
            const t = new Date(r.class_session.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
            const name = r.member?.preferred_name ?? r.member?.full_name ?? r.member?.email ?? 'member';
            const isAttended = r.status === 'attended';
            return (
              <View
                key={r.id}
                className="p-5"
                style={{
                  backgroundColor: '#FFFFFF', borderWidth: 1,
                  borderColor: isAttended ? '#EBC3A1' : '#E8DCC9', borderRadius: 2,
                  flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center',
                }}
              >
                <View style={{ minWidth: 0, flexShrink: 1 }}>
                  <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">{t}</Text>
                  <Text className="text-ink font-display italic text-lg leading-6 mt-1">
                    {r.class_session.class_type?.name} · {name}
                  </Text>
                  <Text className="text-ink-2 font-body text-sm leading-6">
                    {r.class_session.location?.name} · status: {r.status}
                  </Text>
                </View>
                {!isAttended ? (
                  <Pressable
                    onPress={() => mark(r.id)}
                    disabled={busy === r.id}
                    className="bg-ink px-4 py-2 active:opacity-80"
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${name} attended for ${t}`}
                  >
                    <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[10px]">
                      {busy === r.id ? '…' : 'Mark attended'}
                    </Text>
                  </Pressable>
                ) : (
                  <Text className="text-peach-700 font-bodyBold tracking-[0.22em] uppercase text-[10px]">
                    Attended ✓
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
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

function RewardsSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showFulfilled, setShowFulfilled] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('member_milestones')
      .select(`id, status, achieved_at, fulfilled_at, notes,
               milestone:milestones(label, threshold, free_credits, merch_label, perks_json),
               member:members(preferred_name, full_name, email)`)
      .order('achieved_at', { ascending: false })
      .limit(200);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const fulfill = async (id: string) => {
    setBusyId(id);
    await supabase
      .from('member_milestones')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', id);
    await load();
    setBusyId(null);
  };

  const visible = rows.filter((r) => showFulfilled || r.status === 'earned');

  return (
    <>
      <SectionHero
        eyebrow="Rewards"
        title="Honors fulfillment."
        body="Members who've crossed a milestone and are owed merch, perks, or recognition. Mark fulfilled once you've handed off the gift."
      />

      <View className="mt-8 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setShowFulfilled(false)}
          className="px-3 py-2 active:opacity-60"
          style={{ borderWidth: 1, borderColor: !showFulfilled ? '#1F1F1F' : '#E8DCC9' }}
          accessibilityRole="button"
          accessibilityState={{ selected: !showFulfilled }}
        >
          <Text className={(!showFulfilled ? 'text-ink ' : 'text-ink-2 ') + 'font-bodyMd text-[10px] tracking-[0.22em] uppercase'}>
            Pending
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowFulfilled(true)}
          className="px-3 py-2 active:opacity-60"
          style={{ borderWidth: 1, borderColor: showFulfilled ? '#1F1F1F' : '#E8DCC9' }}
          accessibilityRole="button"
          accessibilityState={{ selected: showFulfilled }}
        >
          <Text className={(showFulfilled ? 'text-ink ' : 'text-ink-2 ') + 'font-bodyMd text-[10px] tracking-[0.22em] uppercase'}>
            Show all
          </Text>
        </Pressable>
      </View>

      <View className="mt-6 gap-2">
        {visible.length === 0 ? (
          <PaperCard><Text className="text-ink-2 font-body italic text-sm">No pending honors right now.</Text></PaperCard>
        ) : visible.map((r) => {
          const member = r.member?.preferred_name ?? r.member?.full_name ?? r.member?.email ?? 'member';
          const ms = r.milestone;
          const isFulfilled = r.status === 'fulfilled';
          return (
            <View
              key={r.id}
              className="p-5"
              style={{
                backgroundColor: '#FFFFFF', borderWidth: 1,
                borderColor: isFulfilled ? '#E8DCC9' : '#EBC3A1',
                borderRadius: 2,
                flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <View style={{ minWidth: 0, flexShrink: 1, flexGrow: 1, basis: 240 }}>
                <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                  {new Date(r.achieved_at).toLocaleDateString()} · {ms?.label}
                </Text>
                <Text className="text-ink font-display italic text-lg leading-6 mt-1">
                  {member}
                </Text>
                <Text className="text-ink-2 font-body text-sm leading-6 mt-1">
                  Reached {ms?.threshold} classes.
                  {ms?.merch_label && ` · Gift: ${ms.merch_label}`}
                  {ms?.free_credits > 0 && ` · ${ms.free_credits} free credit${ms.free_credits === 1 ? '' : 's'}`}
                </Text>
              </View>
              {isFulfilled ? (
                <Text className="text-peach-700 font-bodyBold tracking-[0.22em] uppercase text-[10px]">
                  Fulfilled ✓
                </Text>
              ) : (
                <Pressable
                  onPress={() => fulfill(r.id)}
                  disabled={busyId === r.id}
                  className="bg-ink px-4 py-2 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${ms?.label} fulfilled for ${member}`}
                >
                  <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[10px]">
                    {busyId === r.id ? '…' : 'Mark fulfilled'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </>
  );
}

function MessagesSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('contact_messages')
      .select('id, name, email, topic, preferred_location, message, source_page, responded_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const markResponded = async (id: string) => {
    setBusyId(id);
    await supabase.from('contact_messages').update({ responded_at: new Date().toISOString() }).eq('id', id);
    await load();
    setBusyId(null);
  };

  return (
    <>
      <SectionHero
        eyebrow="Messages"
        title="Inbox."
        body="Notes from the public contact form. Reply by email and tap Mark replied once you've sent it."
      />
      <View className="mt-8 gap-2">
        {rows.length === 0 ? (
          <PaperCard><Text className="text-ink-2 font-body italic text-sm">No messages yet.</Text></PaperCard>
        ) : rows.map((r) => (
          <View
            key={r.id}
            className="p-5"
            style={{
              backgroundColor: '#FFFFFF', borderWidth: 1,
              borderColor: r.responded_at ? '#E8DCC9' : '#EBC3A1',
              borderRadius: 2,
            }}
          >
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                {new Date(r.created_at).toLocaleString()}
                {r.topic && ` · ${r.topic}`}
                {r.preferred_location && ` · ${r.preferred_location}`}
              </Text>
              {r.responded_at ? (
                <Text className="text-peach-700 font-bodyBold tracking-[0.22em] uppercase text-[10px]">Replied ✓</Text>
              ) : (
                <Pressable
                  onPress={() => markResponded(r.id)}
                  disabled={busyId === r.id}
                  className="bg-ink px-3 py-1.5 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel={`Mark message from ${r.name} replied`}
                >
                  <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[10px]">
                    {busyId === r.id ? '…' : 'Mark replied'}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text className="text-ink font-display italic text-lg leading-6 mt-2">
              {r.name} <Text className="text-ink-2 font-body text-sm">· {r.email}</Text>
            </Text>
            <Text className="text-ink-2 font-body text-[15px] leading-7 mt-2">{r.message}</Text>
          </View>
        ))}
      </View>
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
