import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ImageBackground,
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

// Editorial photography — used across the dashboard's cinematic moments.
const HERO_IMG =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&h=900&fit=crop&q=85';
const NEXT_CLASS_IMG =
  'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=1400&h=900&fit=crop&q=85';

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
const timeOfDayGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── primitives ─────────────────────────────────────────────────────
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

// Editorial section header used on Bookings / Packages / Profile / Studio.
const SectionHero = ({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) => (
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

// Refined card — no shadow, hairline border, generous padding. Used
// sparingly so it reads as paper, not as a UI chassis.
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

const PrimaryLink = ({ label, href }: { label: string; href: string }) => (
  <Link href={href as any} asChild>
    <Pressable
      className="bg-ink px-7 py-3.5 active:opacity-80 self-start"
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">{label}</Text>
    </Pressable>
  </Link>
);
const GhostLink = ({ label, href }: { label: string; href: string }) => (
  <Link href={href as any} asChild>
    <Pressable
      className="border border-ink px-7 py-3.5 active:bg-ink/5 self-start"
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">{label}</Text>
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
  const isWide = width >= 960;
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
  const sections: { key: Section; label: string }[] = useMemo(() => {
    const base: { key: Section; label: string }[] = [
      { key: 'overview', label: 'Overview' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'packages', label: 'Plan' },
      { key: 'profile',  label: 'Profile' },
    ];
    if (isInstructorOrAdmin) base.push({ key: 'admin', label: 'Studio' });
    return base;
  }, [isInstructorOrAdmin]);

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
  sections: { key: Section; label: string }[];
}) {
  const initials = initialsFor(member, userEmail);
  const fullName = member?.preferred_name ?? member?.full_name ?? userEmail;
  const isOwner = member?.role === 'admin';
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <View
      style={{
        width: isWide ? 232 : '100%',
        flexShrink: 0,
      }}
    >
      {/* Profile mark — peach ring around initials, name + role beneath. */}
      <View className={isWide ? '' : 'flex-row items-center gap-4'}>
        <View
          className="items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 1,
            borderColor: '#EBC3A1',
            backgroundColor: 'rgba(235,195,161,0.18)',
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Text className="text-ink font-display text-xl">{initials}</Text>
        </View>
        <View className={isWide ? 'mt-5' : 'flex-1'} style={{ minWidth: 0 }}>
          <Text
            className="text-ink font-display text-xl leading-6"
            numberOfLines={1}
            accessibilityRole="text"
          >
            {fullName}
          </Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
              {isOwner ? 'Owner' : 'Member'}
            </Text>
            {isOwner && (
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#EBC3A1' }} />
            )}
          </View>
        </View>
      </View>

      {/* Nav — vertical text list on desktop, horizontal chips on mobile. */}
      <View
        className={isWide ? 'mt-8' : 'mt-5'}
        style={{
          flexDirection: isWide ? 'column' : 'row',
          flexWrap: isWide ? 'nowrap' : 'wrap',
          gap: isWide ? 0 : 8,
        }}
        accessibilityRole={'tablist' as any}
        accessibilityLabel="Account sections"
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
              accessibilityLabel={s.label}
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
          <Pressable
            onPress={signOut}
            className="py-2 active:opacity-60"
            style={{ paddingLeft: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Sign out of member access"
          >
            <Text className="text-ink-2 font-bodyMd text-[11px] tracking-[0.22em] uppercase">
              Sign out
            </Text>
          </Pressable>

          {/* Quiet brand mark at the bottom of the rail — boutique
              wayfinding without competing with the top header. */}
          <View style={{ marginTop: 64 }}>
            <Text className="text-ink-2 font-display italic text-base">honey</Text>
            <Text className="text-ink-2 text-[10px] tracking-[0.4em] uppercase font-bodyMd mt-1">
              Pilates · NY
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── OVERVIEW ───────────────────────────────────────────────────────
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

  return (
    <>
      {/* Editorial greeting */}
      <View>
        <Eyebrow>{isOwner ? 'Studio Owner' : timeOfDayGreeting()}</Eyebrow>
        <Text
          className="text-ink font-display italic text-[56px] mt-3 leading-[60px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          {timeOfDayGreeting()}, {displayName}.
        </Text>
        <HairlineRule tone="peach" />
        <Body>
          {nextRes
            ? `You're on the calendar ${fmtDate(nextRes.class_session.starts_at)} at ${fmtTime(nextRes.class_session.starts_at)} with ${nextRes.class_session.instructor?.preferred_name ?? nextRes.class_session.instructor?.full_name ?? 'staff'}.`
            : 'Your reformer is waiting — book a class when you’re ready.'}
        </Body>
      </View>

      {/* Cinematic next-class hero — photographic background, ink scrim. */}
      <View className="mt-12">
        {nextRes ? <NextClassPoster res={nextRes} /> : <EmptyPoster />}
      </View>

      {/* Concierge cards — plan + pack as tall paired panels. */}
      <View className="mt-12" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        {membership ? <ConciergeMembership m={membership} /> : null}
        {pack ? <ConciergePack p={pack} /> : null}
        {!membership && !pack ? <EmptyPlan /> : null}
      </View>

      {/* Owner-only studio strip — sits below the personal section so
          the member ritual still leads. */}
      {isOwner && (
        <View className="mt-14">
          <Eyebrow>Studio</Eyebrow>
          <Text
            className="text-ink font-display italic text-3xl mt-3 leading-9"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            At a glance.
          </Text>
          <HairlineRule />
          <OwnerOverviewPanel />
        </View>
      )}

      {/* Also coming up — refined list */}
      {upcoming.length > 1 && (
        <View className="mt-14">
          <Eyebrow>Also coming up</Eyebrow>
          <Text
            className="text-ink font-display italic text-3xl mt-3 leading-9"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            Your week ahead.
          </Text>
          <HairlineRule />
          <ReservationTimeline items={upcoming.slice(1)} />
        </View>
      )}

      {/* Recent visits — quiet timeline */}
      {recent.length > 0 && (
        <View className="mt-14">
          <Eyebrow>Recent visits</Eyebrow>
          <Text
            className="text-ink font-display italic text-3xl mt-3 leading-9"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            Where you’ve been.
          </Text>
          <HairlineRule />
          <ReservationTimeline items={recent} variant="history" />
        </View>
      )}
    </>
  );
}

// ─── posters / cards ────────────────────────────────────────────────
function NextClassPoster({ res }: { res: ReservationRow }) {
  const s = res.class_session;
  const instructorName = s.instructor?.preferred_name ?? s.instructor?.full_name ?? 'staff';
  return (
    <ImageBackground
      source={{ uri: NEXT_CLASS_IMG }}
      style={{ borderRadius: 2, overflow: 'hidden', minHeight: 360 }}
      imageStyle={{ borderRadius: 2 }}
      accessible={false}
    >
      {/* Layered scrim — softer gradient feel via two stacked ink layers. */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31,31,31,0.55)' }}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(31,31,31,0.35)' }}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View className="p-9" style={{ minHeight: 360, justifyContent: 'space-between' }}>
        <View>
          <Eyebrow tone="peach">Your reservation</Eyebrow>
          <Text
            className="text-cream font-display italic text-[40px] mt-3 leading-[44px]"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            {s.class_type.name}
          </Text>
          <Text className="text-cream/85 font-body text-base leading-7 mt-3">
            With {instructorName} at the {s.location.name}.
          </Text>
        </View>

        <View
          className="flex-row flex-wrap items-end justify-between mt-6"
          style={{ gap: 18 }}
        >
          <View>
            <Text className="text-peach text-[10px] tracking-[0.32em] uppercase font-bodyMd">
              {fmtDate(s.starts_at)}
            </Text>
            <Text className="text-cream font-display text-[52px] mt-1 leading-[56px]">
              {fmtTime(s.starts_at)}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Link href="/schedule" asChild>
              <Pressable
                className="bg-cream px-7 py-3.5 active:opacity-80"
                accessibilityRole="link"
                accessibilityLabel={`Open details for ${s.class_type.name}`}
              >
                <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                  View details
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

function EmptyPoster() {
  return (
    <ImageBackground
      source={{ uri: HERO_IMG }}
      style={{ borderRadius: 2, overflow: 'hidden', minHeight: 320 }}
      imageStyle={{ borderRadius: 2 }}
      accessible={false}
    >
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31,31,31,0.55)' }}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View className="p-9" style={{ minHeight: 320, justifyContent: 'flex-end' }}>
        <Eyebrow tone="peach">No reservation</Eyebrow>
        <Text
          className="text-cream font-display italic text-[36px] mt-3 leading-[40px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={2}
        >
          Reserve your reformer.
        </Text>
        <View className="mt-5">
          <Link href="/schedule" asChild>
            <Pressable
              className="bg-cream px-7 py-3.5 active:opacity-80 self-start"
              accessibilityRole="link"
              accessibilityLabel="Browse the class schedule"
            >
              <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                Browse schedule
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ImageBackground>
  );
}

function ConciergeMembership({ m }: { m: Membership }) {
  return (
    <View
      className="p-8 grow basis-[300px]"
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8DCC9',
        borderRadius: 2,
        minHeight: 280,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Eyebrow>Membership</Eyebrow>
        <Text className="text-ink font-display italic text-[28px] mt-3 leading-8">
          {m.plan_name}
        </Text>
        <HairlineRule />
        <Text className="text-ink font-display text-[44px] leading-[48px]">
          {dollars(m.price_cents)}
          <Text className="text-ink-2 font-body text-base"> /mo</Text>
        </Text>
        {m.current_period_end ? (
          <Text className="text-ink-2 font-body text-sm mt-2">
            Renews {fmtDate(m.current_period_end)}
          </Text>
        ) : null}
      </View>
      <View className="mt-6 flex-row items-center justify-between gap-3 flex-wrap">
        <View className="flex-row items-center gap-2">
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#5C6E4F' }} />
          <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
            {m.status === 'active' ? 'Active' : m.status}
          </Text>
        </View>
        <GhostLink label="Manage" href="/membership" />
      </View>
    </View>
  );
}

function ConciergePack({ p }: { p: ClassPack }) {
  const pct = (p.credits_left / p.credits_total) * 100;
  return (
    <View
      className="p-8 grow basis-[300px]"
      style={{
        backgroundColor: '#1F1F1F',
        borderRadius: 2,
        minHeight: 280,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Eyebrow tone="peach">Class credits</Eyebrow>
        <Text className="text-cream font-display italic text-[28px] mt-3 leading-8">
          {p.label}
        </Text>
        <HairlineRule tone="cream" />
        <Text className="text-cream font-display text-[44px] leading-[48px]">
          {p.credits_left}
          <Text className="text-cream/60 font-body text-base"> /{p.credits_total} left</Text>
        </Text>
        {p.expires_at ? (
          <Text className="text-cream/70 font-body text-sm mt-2">
            Expires {fmtDate(p.expires_at)}
          </Text>
        ) : null}
        {/* Hairline progress meter */}
        <View
          style={{ height: 2, backgroundColor: 'rgba(241,232,221,0.2)', marginTop: 18 }}
          accessibilityRole={'progressbar' as any}
          accessibilityValue={{ min: 0, max: p.credits_total, now: p.credits_left }}
        >
          <View style={{ height: 2, width: `${pct}%`, backgroundColor: '#EBC3A1' }} />
        </View>
      </View>
      <View className="mt-6">
        <Link href="/membership" asChild>
          <Pressable
            className="border border-cream px-7 py-3.5 active:bg-cream/10 self-start"
            accessibilityRole="link"
            accessibilityLabel="Buy more credits"
          >
            <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">
              Buy more
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

function EmptyPlan() {
  return (
    <PaperCard className="grow">
      <Eyebrow>Get started</Eyebrow>
      <Text className="text-ink font-display italic text-3xl mt-3 leading-9">
        Begin a practice.
      </Text>
      <HairlineRule />
      <Body>
        Pick a class pack or a monthly membership and the studio will be waiting.
      </Body>
      <View className="mt-7"><PrimaryLink label="See plans" href="/membership" /></View>
    </PaperCard>
  );
}

// Vertical hairline-rule timeline used for "Also coming up" + "Recent".
function ReservationTimeline({ items, variant = 'upcoming' }: { items: ReservationRow[]; variant?: 'upcoming' | 'history' }) {
  return (
    <View
      style={{
        borderLeftWidth: 1,
        borderLeftColor: '#E8DCC9',
        paddingLeft: 22,
      }}
    >
      {items.map((r, i) => {
        const s = r.class_session;
        const instr = s.instructor?.preferred_name ?? s.instructor?.full_name ?? 'staff';
        return (
          <View key={r.id} style={{ position: 'relative', paddingBottom: i === items.length - 1 ? 0 : 22 }}>
            {/* Bullet — peach for upcoming, ink-outlined for history */}
            <View
              style={{
                position: 'absolute',
                left: -28,
                top: 6,
                width: 9,
                height: 9,
                borderRadius: 4.5,
                backgroundColor: variant === 'upcoming' ? '#EBC3A1' : 'transparent',
                borderWidth: variant === 'history' ? 1 : 0,
                borderColor: '#1F1F1F',
              }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
              {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)}
            </Text>
            <Text className="text-ink font-display italic text-2xl mt-1 leading-7">
              {s.class_type.name}
            </Text>
            <Text className="text-ink-2 font-body text-sm leading-6 mt-1">
              With {instr} · {s.location.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── secondary sections ─────────────────────────────────────────────
function BookingsSection({ upcoming, recent }: { upcoming: ReservationRow[]; recent: ReservationRow[] }) {
  return (
    <>
      <SectionHero
        eyebrow="Reservations"
        title="Your bookings."
        body="Everything you have on the calendar — upcoming and attended."
      />
      <View className="mt-10">
        <Eyebrow>Upcoming</Eyebrow>
        <HairlineRule />
        {upcoming.length > 0
          ? <ReservationTimeline items={upcoming} />
          : <PaperCard><Body>No upcoming reservations.</Body></PaperCard>}
      </View>
      <View className="mt-12">
        <Eyebrow>History</Eyebrow>
        <HairlineRule />
        {recent.length > 0
          ? <ReservationTimeline items={recent} variant="history" />
          : <PaperCard><Body>No completed classes yet.</Body></PaperCard>}
      </View>
    </>
  );
}

function PackagesSection({ membership, pack }: { membership: Membership | null; pack: ClassPack | null }) {
  return (
    <>
      <SectionHero
        eyebrow="Plan"
        title="Membership & credits."
        body="What's keeping your practice on the books."
      />
      <View className="mt-10" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        {membership ? <ConciergeMembership m={membership} /> : null}
        {pack ? <ConciergePack p={pack} /> : null}
        {!membership && !pack ? <EmptyPlan /> : null}
      </View>
    </>
  );
}

function ProfileSection({ member, userEmail }: { member: Member | null; userEmail: string }) {
  return (
    <>
      <SectionHero
        eyebrow="Profile"
        title="The studio's notes on you."
        body="Editing lands in the next pass. For now this is a read-only snapshot."
      />
      <View className="mt-10">
        <PaperCard>
          <ProfileRow label="Name" value={member?.full_name ?? member?.preferred_name ?? '—'} />
          <ProfileRow label="Preferred name" value={member?.preferred_name ?? '—'} />
          <ProfileRow label="Email" value={member?.email ?? userEmail} />
          <ProfileRow label="Role" value={member?.role ?? 'member'} />
          <ProfileRow
            label="Member since"
            value={member?.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
            isLast
          />
        </PaperCard>
      </View>
    </>
  );
}
function ProfileRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View
      className="py-4"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#E8DCC9',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">{label}</Text>
      <Text className="text-ink font-display italic text-base">{value}</Text>
    </View>
  );
}

// ─── admin / owner section ──────────────────────────────────────────
function AdminSection() {
  return (
    <>
      <SectionHero
        eyebrow="Studio"
        title="Owner ledger."
        body="A live look across the studio. More tools land here as we build them."
      />
      <View className="mt-10"><OwnerOverviewPanel /></View>
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
