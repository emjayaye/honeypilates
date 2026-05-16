import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { AuthScreen } from '@/components/auth-screen';

// ─── types ───────────────────────────────────────────────────────────
type Member = {
  id: string;
  email: string;
  full_name: string | null;
  preferred_name: string | null;
  role: 'member' | 'instructor' | 'admin';
  joined_at: string;
};
type Membership = {
  id: string;
  plan_name: string;
  price_cents: number;
  status: string;
  current_period_end: string | null;
};
type ClassPack = {
  id: string;
  label: string;
  credits_total: number;
  credits_left: number;
  expires_at: string | null;
  status: string;
};
type ReservationRow = {
  id: string;
  status: string;
  class_session: {
    id: string;
    starts_at: string;
    class_type: { name: string };
    instructor: { preferred_name: string | null; full_name: string | null } | null;
    location: { name: string };
  };
};
type Section = 'overview' | 'bookings' | 'packages' | 'profile' | 'admin';

// ─── formatting ─────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dollars = (cents: number) => '$' + (cents / 100).toFixed(0);
const initialsFor = (m: Member | null, fallback: string) => {
  const src = m?.preferred_name ?? m?.full_name ?? m?.email ?? fallback;
  if (!src) return '·';
  const parts = src.replace(/[^a-zA-Z@ ]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? '·').toUpperCase();
};

// ─── primitives ─────────────────────────────────────────────────────
const Eyebrow = ({ children }: { children: string }) => (
  <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">{children}</Text>
);
const Meta = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-ink-2 font-body text-sm leading-6">{children}</Text>
);
const CardTitle = ({ children }: { children: string }) => (
  <Text className="text-ink font-display text-2xl leading-7">{children}</Text>
);
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View
    className={'p-6 ' + className}
    style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 4 }}
  >
    {children}
  </View>
);
const GhostButton = ({ label, href }: { label: string; href: string }) => (
  <Link href={href as any} asChild>
    <Pressable
      className="border border-ink px-6 py-3.5 active:bg-ink/5 self-start"
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs">{label}</Text>
    </Pressable>
  </Link>
);

// ─── screen ─────────────────────────────────────────────────────────
export default function AccountScreen() {
  const { session } = useAuth();
  if (!session) return <ScrollView contentContainerClassName="bg-cream"><AuthScreen /></ScrollView>;
  return <SignedInDashboard userId={session.user.id} userEmail={session.user.email ?? ''} />;
}

function FullPageLoader() {
  return (
    <View className="flex-1 bg-cream items-center justify-center py-24">
      <ActivityIndicator color="#1F1F1F" />
    </View>
  );
}

// ─── dashboard shell ────────────────────────────────────────────────
function SignedInDashboard({ userId, userEmail }: { userId: string; userEmail: string }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [section, setSection] = useState<Section>('overview');

  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pack, setPack] = useState<ClassPack | null>(null);
  const [upcoming, setUpcoming] = useState<ReservationRow[]>([]);
  const [recent, setRecent] = useState<ReservationRow[]>([]);

  useEffect(() => {
    let live = true;
    const safe = async <T,>(label: string, q: PromiseLike<{ data: T | null; error: any }>): Promise<T | null> => {
      try {
        const race = await Promise.race([
          q.then((r) => r),
          new Promise<{ data: null; error: any }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('timed out') }), 5000),
          ),
        ]);
        if (race.error) { console.error(`[dashboard:${label}]`, race.error); return null; }
        return race.data;
      } catch (e) { console.error(`[dashboard:${label}] threw`, e); return null; }
    };

    (async () => {
      const [m, mem, p, up, re] = await Promise.all([
        safe<Member>('members',
          supabase.from('members').select('id,email,full_name,preferred_name,role,joined_at').eq('id', userId).single()),
        safe<Membership>('membership',
          supabase.from('memberships').select('id,plan_name,price_cents,status,current_period_end')
            .eq('member_id', userId).eq('status', 'active').maybeSingle()),
        safe<ClassPack>('pack',
          supabase.from('class_packs').select('id,label,credits_total,credits_left,expires_at,status')
            .eq('member_id', userId).eq('status', 'active').order('purchased_at', { ascending: false }).limit(1).maybeSingle()),
        safe<ReservationRow[]>('upcoming',
          supabase.from('reservations').select(`id,status,
                     class_session:class_sessions!inner(
                       id, starts_at,
                       class_type:class_types(name),
                       instructor:members(preferred_name, full_name),
                       location:studio_locations(name))`)
            .eq('member_id', userId).in('status', ['booked', 'waitlist']).limit(5)),
        safe<ReservationRow[]>('recent',
          supabase.from('reservations').select(`id,status,
                     class_session:class_sessions!inner(
                       id, starts_at,
                       class_type:class_types(name),
                       instructor:members(preferred_name, full_name),
                       location:studio_locations(name))`)
            .eq('member_id', userId).in('status', ['attended', 'no_show']).limit(3)),
      ]);
      if (!live) return;
      setMember(m); setMembership(mem); setPack(p);
      setUpcoming(up ?? []); setRecent(re ?? []);
    })();
    return () => { live = false; };
  }, [userId]);

  const isOwner = member?.role === 'admin';
  const isInstructorOrAdmin = member?.role === 'instructor' || isOwner;
  const sections: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = useMemo(() => {
    const base: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { key: 'overview', label: 'Overview',  icon: 'home-outline' },
      { key: 'bookings', label: 'Bookings',  icon: 'calendar-outline' },
      { key: 'packages', label: 'Packages',  icon: 'pricetag-outline' },
      { key: 'profile',  label: 'Profile',   icon: 'person-circle-outline' },
    ];
    if (isInstructorOrAdmin) base.push({ key: 'admin', label: 'Studio', icon: 'briefcase-outline' });
    return base;
  }, [isInstructorOrAdmin]);

  return (
    <ScrollView contentContainerClassName="bg-cream pb-16">
      <View
        className="pt-8 px-6"
        style={{ maxWidth: 1200, alignSelf: 'center', width: '100%', flexDirection: isWide ? 'row' : 'column', gap: isWide ? 32 : 12 }}
      >
        <MemberSidebar
          member={member}
          userEmail={userEmail}
          isWide={isWide}
          section={section}
          setSection={setSection}
          sections={sections}
        />

        <View className="flex-1" style={{ minWidth: 0 }}>
          {section === 'overview' && (
            <OverviewSection
              member={member}
              membership={membership}
              pack={pack}
              upcoming={upcoming}
              recent={recent}
              isOwner={isOwner}
              userEmail={userEmail}
            />
          )}
          {section === 'bookings' && <BookingsSection upcoming={upcoming} recent={recent} />}
          {section === 'packages' && <PackagesSection membership={membership} pack={pack} />}
          {section === 'profile'  && <ProfileSection member={member} userEmail={userEmail} />}
          {section === 'admin'    && <AdminSection />}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── sidebar ────────────────────────────────────────────────────────
function MemberSidebar({
  member, userEmail, isWide, section, setSection, sections,
}: {
  member: Member | null;
  userEmail: string;
  isWide: boolean;
  section: Section;
  setSection: (s: Section) => void;
  sections: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[];
}) {
  const initials = initialsFor(member, userEmail);
  const fullName = member?.preferred_name ?? member?.full_name ?? userEmail;
  const isOwner = member?.role === 'admin';
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <View
      style={{
        width: isWide ? 240 : '100%',
        flexShrink: 0,
      }}
    >
      {/* Profile chip */}
      <View
        className="p-5"
        style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 4 }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="bg-peach items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 22 }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Text className="text-ink font-display text-base">{initials}</Text>
          </View>
          <View className="flex-1" style={{ minWidth: 0 }}>
            <Text
              className="text-ink font-display text-base leading-5"
              numberOfLines={1}
              accessibilityRole="text"
            >
              {fullName}
            </Text>
            <Text className="text-ink-2 text-[10px] tracking-[0.24em] uppercase font-bodyMd mt-0.5">
              {isOwner ? 'Owner' : 'Member'}
            </Text>
          </View>
        </View>
      </View>

      {/* Nav */}
      <View
        className="mt-3"
        style={{
          flexDirection: isWide ? 'column' : 'row',
          flexWrap: isWide ? 'nowrap' : 'wrap',
          gap: isWide ? 0 : 6,
        }}
        accessibilityRole={'tablist' as any}
        accessibilityLabel="Account sections"
      >
        {sections.map((s) => {
          const active = section === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              className="flex-row items-center gap-3 active:opacity-70"
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: active ? '#FFFFFF' : 'transparent',
                borderWidth: 1,
                borderColor: active ? '#E8DCC9' : 'transparent',
                borderRadius: 4,
                marginTop: isWide ? 2 : 0,
              }}
              accessibilityRole={'tab' as any}
              accessibilityState={{ selected: active }}
              accessibilityLabel={s.label}
            >
              <Ionicons name={s.icon} size={18} color={active ? '#1F1F1F' : '#777C75'} accessibilityElementsHidden importantForAccessibility="no" />
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
        <Pressable
          onPress={signOut}
          className="mt-6 active:opacity-60"
          style={{ paddingVertical: 12, paddingHorizontal: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Sign out of member access"
        >
          <Text className="text-ink-2 font-bodyMd text-[11px] tracking-[0.22em] uppercase">
            Sign out
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── sections ───────────────────────────────────────────────────────
function OverviewSection({
  member, membership, pack, upcoming, recent, isOwner, userEmail,
}: {
  member: Member | null;
  membership: Membership | null;
  pack: ClassPack | null;
  upcoming: ReservationRow[];
  recent: ReservationRow[];
  isOwner: boolean;
  userEmail: string;
}) {
  const displayName =
    member?.preferred_name ?? member?.full_name?.split(' ')[0] ?? userEmail.split('@')[0];
  const nextRes = upcoming[0];
  const memberSince = member?.joined_at
    ? new Date(member.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      {/* Big greeting block */}
      <View>
        <Eyebrow>{isOwner ? 'Owner Dashboard' : 'Welcome'}</Eyebrow>
        <Text
          className="text-ink font-display text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Good day, {displayName}.
        </Text>
        <Meta>
          {memberSince ? `Member since ${memberSince}` : userEmail}
          {upcoming.length > 0 && ` · ${upcoming.length} class${upcoming.length === 1 ? '' : 'es'} on the books`}
        </Meta>
      </View>

      {/* Stat strip — 3 tiny tiles giving a sense of momentum. */}
      <View className="mt-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatTile label="Upcoming" value={upcoming.length} />
        <StatTile
          label="Credits left"
          value={pack ? `${pack.credits_left}/${pack.credits_total}` : '—'}
        />
        <StatTile
          label="Last 30 days"
          value={recent.length}
        />
      </View>

      {/* Owner-only overview */}
      {isOwner && <OwnerOverviewPanel />}

      {/* Next class — hero ticket */}
      <View className="mt-10">
        <View className="flex-row items-end justify-between mb-3">
          <Eyebrow>Next on the calendar</Eyebrow>
          <Link href="/schedule" asChild>
            <Pressable className="py-3 -my-3 active:opacity-60" accessibilityRole="link" accessibilityLabel="Open the full class schedule">
              <Text className="text-ink font-bodyBold text-xs tracking-[0.18em] uppercase underline">
                Full schedule →
              </Text>
            </Pressable>
          </Link>
        </View>
        {nextRes ? <NextClassHero res={nextRes} /> : <EmptyNext />}
      </View>

      {/* Plan + credits side-by-side */}
      <View className="mt-10" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {membership ? <MembershipCard m={membership} /> : null}
        {pack ? <PackCard p={pack} /> : null}
        {!membership && !pack ? <EmptyPlan /> : null}
      </View>

      {/* More upcoming */}
      {upcoming.length > 1 && (
        <View className="mt-10">
          <Eyebrow>Also coming up</Eyebrow>
          <View className="mt-3 gap-2">
            {upcoming.slice(1).map((r) => <ReservationRowCard key={r.id} res={r} />)}
          </View>
        </View>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <View className="mt-10">
          <Eyebrow>Recent visits</Eyebrow>
          <View
            className="mt-3"
            style={{ borderTopWidth: 1, borderTopColor: '#E8DCC9' }}
          >
            {recent.map((h) => (
              <View
                key={h.id}
                className="flex-row items-center justify-between py-4"
                style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9' }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="bg-cream"
                    style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#E8DCC9', alignItems: 'center', justifyContent: 'center' }}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    <Ionicons name="checkmark" size={14} color="#1F1F1F" />
                  </View>
                  <View>
                    <Text className="text-ink font-display text-base leading-6">
                      {h.class_session.class_type.name}
                    </Text>
                    <Meta>
                      {h.class_session.instructor
                        ? `With ${h.class_session.instructor.preferred_name ?? h.class_session.instructor.full_name}`
                        : ''}
                    </Meta>
                  </View>
                </View>
                <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                  {fmtDate(h.class_session.starts_at)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View
      className="p-4 grow basis-[140px]"
      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 4 }}
    >
      <Eyebrow>{label}</Eyebrow>
      <Text className="text-ink font-display text-3xl mt-2 leading-9">{value}</Text>
    </View>
  );
}

function NextClassHero({ res }: { res: ReservationRow }) {
  const s = res.class_session;
  const instructorName = s.instructor?.preferred_name ?? s.instructor?.full_name ?? 'staff';
  return (
    <View
      className="p-6 overflow-hidden"
      style={{
        backgroundColor: '#1F1F1F',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#1F1F1F',
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        {/* Ticket date column */}
        <View
          className="px-5 py-4"
          style={{
            backgroundColor: '#F1E8DD',
            borderRadius: 4,
            minWidth: 130,
          }}
        >
          <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
            {fmtDate(s.starts_at)}
          </Text>
          <Text className="text-ink font-display text-3xl mt-1 leading-9">{fmtTime(s.starts_at)}</Text>
        </View>
        <View className="grow basis-[200px]">
          <Text className="text-peach text-[10px] tracking-[0.32em] uppercase font-bodyMd">
            Your seat is held
          </Text>
          <Text className="text-cream font-display text-2xl mt-2 leading-7">
            {s.class_type.name}
          </Text>
          <Text className="text-cream/85 font-body text-sm leading-6 mt-1">
            With {instructorName} · {s.location.name}
          </Text>
        </View>
        <View className="flex-row gap-3 flex-wrap">
          <Link href="/schedule" asChild>
            <Pressable
              className="bg-cream px-6 py-3.5 active:opacity-80"
              accessibilityRole="link"
              accessibilityLabel={`Open details for ${s.class_type.name}`}
            >
              <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs">
                View details
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

function EmptyNext() {
  return (
    <Card>
      <Meta>Nothing booked yet — reserve a class to see it here.</Meta>
      <View className="mt-4"><GhostButton label="Browse schedule" href="/schedule" /></View>
    </Card>
  );
}

function MembershipCard({ m }: { m: Membership }) {
  return (
    <Card className="grow basis-[300px]">
      <Eyebrow>Plan</Eyebrow>
      <View className="mt-3"><CardTitle>{m.plan_name}</CardTitle></View>
      <Meta>
        {dollars(m.price_cents)}/month
        {m.current_period_end && ` · renews ${fmtDate(m.current_period_end)}`}
      </Meta>
      <View className="mt-5">
        <View className="bg-peach/40 px-3 py-1.5 self-start">
          <Text className="text-ink text-[10px] tracking-[0.22em] uppercase font-bodyBold">
            {m.status === 'active' ? 'Active' : m.status}
          </Text>
        </View>
      </View>
      <View className="mt-6">
        <GhostButton label="Manage plan" href="/membership" />
      </View>
    </Card>
  );
}

function PackCard({ p }: { p: ClassPack }) {
  const pct = (p.credits_left / p.credits_total) * 100;
  return (
    <Card className="grow basis-[300px]">
      <Eyebrow>Class credits</Eyebrow>
      <View className="mt-3"><CardTitle>{p.label}</CardTitle></View>
      <Meta>
        {p.credits_left} of {p.credits_total} classes left
        {p.expires_at && ` · expires ${fmtDate(p.expires_at)}`}
      </Meta>
      <View
        className="mt-4 bg-cream"
        style={{ height: 6, borderRadius: 2, borderWidth: 1, borderColor: '#E8DCC9' }}
        accessibilityRole={'progressbar' as any}
        accessibilityValue={{ min: 0, max: p.credits_total, now: p.credits_left }}
        accessibilityLabel="Class credits remaining"
      >
        <View className="bg-peach" style={{ width: `${pct}%`, height: '100%', borderRadius: 2 }} />
      </View>
      <View className="mt-6"><GhostButton label="Buy more credits" href="/membership" /></View>
    </Card>
  );
}

function EmptyPlan() {
  return (
    <Card className="grow">
      <Eyebrow>Get started</Eyebrow>
      <View className="mt-3"><CardTitle>No active plan yet.</CardTitle></View>
      <Meta>Pick a class pack or monthly membership to start booking.</Meta>
      <View className="mt-6"><GhostButton label="See plans" href="/membership" /></View>
    </Card>
  );
}

function ReservationRowCard({ res }: { res: ReservationRow }) {
  const s = res.class_session;
  const instructorName = s.instructor?.preferred_name ?? s.instructor?.full_name ?? 'staff';
  return (
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <View style={{ minWidth: 110 }}>
          <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
            {fmtDate(s.starts_at)}
          </Text>
          <Text className="text-ink font-display text-xl mt-1 leading-6">{fmtTime(s.starts_at)}</Text>
        </View>
        <View className="grow basis-[200px]">
          <Text className="text-ink font-display text-lg leading-6">{s.class_type.name}</Text>
          <Meta>With {instructorName} · {s.location.name}</Meta>
        </View>
      </View>
    </Card>
  );
}

// ─── secondary sections ─────────────────────────────────────────────
function BookingsSection({ upcoming, recent }: { upcoming: ReservationRow[]; recent: ReservationRow[] }) {
  return (
    <>
      <Eyebrow>Bookings</Eyebrow>
      <Text
        className="text-ink font-display text-[40px] mt-3 leading-[44px]"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={1}
      >
        All your reservations.
      </Text>
      <Meta>Upcoming above the line, attended below.</Meta>

      <View className="mt-8">
        <Eyebrow>Upcoming</Eyebrow>
        <View className="mt-3 gap-2">
          {upcoming.length > 0
            ? upcoming.map((r) => <ReservationRowCard key={r.id} res={r} />)
            : <Card><Meta>No upcoming reservations.</Meta></Card>}
        </View>
      </View>
      <View className="mt-10">
        <Eyebrow>History</Eyebrow>
        <View className="mt-3 gap-2">
          {recent.length > 0
            ? recent.map((r) => <ReservationRowCard key={r.id} res={r} />)
            : <Card><Meta>No completed classes yet.</Meta></Card>}
        </View>
      </View>
    </>
  );
}

function PackagesSection({ membership, pack }: { membership: Membership | null; pack: ClassPack | null }) {
  return (
    <>
      <Eyebrow>Packages</Eyebrow>
      <Text
        className="text-ink font-display text-[40px] mt-3 leading-[44px]"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={1}
      >
        Plan & credits.
      </Text>
      <Meta>Your active subscriptions and class packs.</Meta>
      <View className="mt-8" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {membership ? <MembershipCard m={membership} /> : null}
        {pack ? <PackCard p={pack} /> : null}
        {!membership && !pack ? <EmptyPlan /> : null}
      </View>
    </>
  );
}

function ProfileSection({ member, userEmail }: { member: Member | null; userEmail: string }) {
  return (
    <>
      <Eyebrow>Profile</Eyebrow>
      <Text
        className="text-ink font-display text-[40px] mt-3 leading-[44px]"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={1}
      >
        Your studio profile.
      </Text>
      <Meta>What we know about you.</Meta>
      <View className="mt-8">
        <Card>
          <ProfileRow label="Name" value={member?.full_name ?? member?.preferred_name ?? '—'} />
          <ProfileRow label="Preferred name" value={member?.preferred_name ?? '—'} />
          <ProfileRow label="Email" value={member?.email ?? userEmail} />
          <ProfileRow label="Role" value={member?.role ?? 'member'} />
          <ProfileRow
            label="Member since"
            value={member?.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
            isLast
          />
        </Card>
        <Meta>
          Editing the profile lands in the next pass — for now this is a read-only snapshot.
        </Meta>
      </View>
    </>
  );
}
function ProfileRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View
      className="py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#E8DCC9',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
      }}
    >
      <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">{label}</Text>
      <Text className="text-ink font-body text-sm">{value}</Text>
    </View>
  );
}

// ─── admin / owner section ──────────────────────────────────────────
function AdminSection() {
  return (
    <>
      <Eyebrow>Studio</Eyebrow>
      <Text
        className="text-ink font-display text-[40px] mt-3 leading-[44px]"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={1}
      >
        Studio overview.
      </Text>
      <Meta>Owner + instructor tools land here. First slice is the live counts panel below.</Meta>
      <View className="mt-8"><OwnerOverviewPanel /></View>
    </>
  );
}

function OwnerOverviewPanel() {
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
    <View className="mt-2 p-6" style={{ backgroundColor: '#1F1F1F', borderRadius: 4 }}>
      <Text className="text-peach text-[10px] tracking-[0.32em] uppercase font-bodyMd">
        Owner Overview
      </Text>
      <Text
        className="text-cream font-display text-2xl mt-2 leading-7"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={2}
      >
        Studio at a glance
      </Text>
      <View className="mt-5" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        <Stat label="Members" value={counts?.members ?? '—'} />
        <Stat label="Active memberships" value={counts?.memberships ?? '—'} />
        <Stat label="Sessions next 7 days" value={counts?.sessions7d ?? '—'} />
      </View>
    </View>
  );
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ minWidth: 120 }}>
      <Text className="text-cream/70 text-[10px] tracking-[0.28em] uppercase font-bodyMd">{label}</Text>
      <Text className="text-cream font-display text-3xl mt-1 leading-9">{value}</Text>
    </View>
  );
}
