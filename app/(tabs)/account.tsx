import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
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

// ─── shared formatting ──────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dollars = (cents: number) => '$' + (cents / 100).toFixed(0);

// ─── small inline primitives ────────────────────────────────────────
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

  // No loading gate — if there's no session yet, the user always sees
  // the AuthScreen and can act immediately. When a real session
  // arrives (initial restore or after sign-in), this re-renders into
  // the dashboard. No spinner ever blocks the UI from being usable.
  if (!session) return <ScrollView contentContainerClassName="bg-cream"><AuthScreen /></ScrollView>;
  return <SignedInDashboard userId={session.user.id} />;
}

// ─── dashboard ──────────────────────────────────────────────────────
function SignedInDashboard({ userId }: { userId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pack, setPack] = useState<ClassPack | null>(null);
  const [upcoming, setUpcoming] = useState<ReservationRow[]>([]);
  const [recent, setRecent] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    // Wrap every Supabase query in a 5s timeout race + try/catch so a
    // single hung or errored query can't trap the dashboard in its
    // loading state. Every error logs to the browser console so we
    // can see exactly which query misbehaved.
    const safe = async <T,>(label: string, q: PromiseLike<{ data: T | null; error: any }>): Promise<T | null> => {
      try {
        const race = await Promise.race([
          q.then((r) => r),
          new Promise<{ data: null; error: any }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('timed out') }), 5000),
          ),
        ]);
        if (race.error) {
          // eslint-disable-next-line no-console
          console.error(`[dashboard:${label}] error:`, race.error);
          return null;
        }
        // eslint-disable-next-line no-console
        console.log(`[dashboard:${label}] ok`);
        return race.data;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`[dashboard:${label}] threw:`, e);
        return null;
      }
    };

    (async () => {
      // eslint-disable-next-line no-console
      console.log('[dashboard] loading for user', userId);
      const [m, mem, p, up, re] = await Promise.all([
        safe<Member>('members',
          supabase.from('members')
            .select('id,email,full_name,preferred_name,role,joined_at')
            .eq('id', userId)
            .single()),
        safe<Membership>('membership',
          supabase.from('memberships')
            .select('id,plan_name,price_cents,status,current_period_end')
            .eq('member_id', userId)
            .eq('status', 'active')
            .maybeSingle()),
        safe<ClassPack>('pack',
          supabase.from('class_packs')
            .select('id,label,credits_total,credits_left,expires_at,status')
            .eq('member_id', userId)
            .eq('status', 'active')
            .order('purchased_at', { ascending: false })
            .limit(1)
            .maybeSingle()),
        safe<ReservationRow[]>('upcoming',
          supabase.from('reservations')
            .select(`id,status,
                     class_session:class_sessions!inner(
                       id, starts_at,
                       class_type:class_types(name),
                       instructor:members(preferred_name, full_name),
                       location:studio_locations(name)
                     )`)
            .eq('member_id', userId)
            .in('status', ['booked', 'waitlist'])
            .limit(5)),
        safe<ReservationRow[]>('recent',
          supabase.from('reservations')
            .select(`id,status,
                     class_session:class_sessions!inner(
                       id, starts_at,
                       class_type:class_types(name),
                       instructor:members(preferred_name, full_name),
                       location:studio_locations(name)
                     )`)
            .eq('member_id', userId)
            .in('status', ['attended', 'no_show'])
            .limit(3)),
      ]);
      if (!live) return;
      setMember(m);
      setMembership(mem);
      setPack(p);
      setUpcoming(up ?? []);
      setRecent(re ?? []);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [userId]);

  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading || !member) return <FullPageLoader />;

  const displayName = member.preferred_name ?? (member.full_name?.split(' ')[0]) ?? 'there';
  const isOwner = member.role === 'admin';
  const nextRes = upcoming[0];

  return (
    <ScrollView contentContainerClassName="bg-cream pb-16">
      <View className="px-6 pt-10" style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
        {/* Greeting */}
        <View className="flex-row items-center gap-3">
          <Eyebrow>{isOwner ? 'Owner' : 'Member'}</Eyebrow>
          {isOwner && (
            <View className="bg-ink px-2.5 py-1">
              <Text className="text-peach text-[9px] tracking-[0.22em] uppercase font-bodyBold">
                Owner Access
              </Text>
            </View>
          )}
        </View>
        <Text
          className="text-ink font-display text-[42px] mt-3 leading-[46px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Welcome back, {displayName}.
        </Text>
        <View className="h-[1px] bg-ink/15 mt-6 w-16" accessibilityElementsHidden importantForAccessibility="no" />
        <Meta>
          {member.email}
          {upcoming.length > 0 && ` · ${upcoming.length} class${upcoming.length === 1 ? '' : 'es'} on the books`}
        </Meta>

        {/* Owner-only panel */}
        {isOwner && <OwnerPanel />}

        {/* Status grid */}
        <View className="mt-10" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
          {membership && (
            <Card className="grow basis-[320px]">
              <Eyebrow>Plan</Eyebrow>
              <View className="mt-3"><CardTitle>{membership.plan_name}</CardTitle></View>
              <Meta>
                {dollars(membership.price_cents)}/month
                {membership.current_period_end &&
                  ` · renews ${fmtDate(membership.current_period_end)}`}
              </Meta>
              <View className="mt-5">
                <View className="bg-peach/40 px-3 py-1.5 self-start">
                  <Text className="text-ink text-[10px] tracking-[0.22em] uppercase font-bodyBold">
                    {membership.status === 'active' ? 'Active' : membership.status}
                  </Text>
                </View>
              </View>
              <View className="mt-6 flex-row gap-3 flex-wrap">
                <GhostButton label="Manage plan" href="/membership" />
              </View>
            </Card>
          )}

          {pack && (
            <Card className="grow basis-[320px]">
              <Eyebrow>Class Credits</Eyebrow>
              <View className="mt-3"><CardTitle>{pack.label}</CardTitle></View>
              <Meta>
                {pack.credits_left} of {pack.credits_total} classes left
                {pack.expires_at && ` · expires ${fmtDate(pack.expires_at)}`}
              </Meta>
              <View
                className="mt-4 bg-cream"
                style={{ height: 6, borderRadius: 2, borderWidth: 1, borderColor: '#E8DCC9' }}
                accessibilityRole={'progressbar' as any}
                accessibilityValue={{ min: 0, max: pack.credits_total, now: pack.credits_left }}
                accessibilityLabel="Class credits remaining"
              >
                <View
                  className="bg-peach"
                  style={{ width: `${(pack.credits_left / pack.credits_total) * 100}%`, height: '100%', borderRadius: 2 }}
                />
              </View>
              <View className="mt-6">
                <GhostButton label="Buy more credits" href="/membership" />
              </View>
            </Card>
          )}

          {!membership && !pack && (
            <Card className="grow">
              <Eyebrow>Get started</Eyebrow>
              <View className="mt-3"><CardTitle>No active plan yet.</CardTitle></View>
              <Meta>Pick a class pack or monthly membership to start booking.</Meta>
              <View className="mt-6 flex-row gap-3 flex-wrap">
                <GhostButton label="See plans" href="/membership" />
              </View>
            </Card>
          )}
        </View>

        {/* Next class */}
        <View className="mt-12">
          <View className="flex-row items-end justify-between mb-4">
            <View>
              <Eyebrow>Next on the calendar</Eyebrow>
              <Text
                className="text-ink font-display text-2xl mt-2 leading-7"
                accessibilityRole="header"
                // @ts-expect-error
                aria-level={2}
              >
                {nextRes ? 'Your next class' : 'No upcoming class'}
              </Text>
            </View>
            <Link href="/schedule" asChild>
              <Pressable className="py-3 -my-3 active:opacity-60" accessibilityRole="link" accessibilityLabel="See the full class schedule">
                <Text className="text-ink font-bodyBold text-xs tracking-[0.18em] uppercase underline">
                  Full schedule →
                </Text>
              </Pressable>
            </Link>
          </View>

          {nextRes ? (
            <ReservationCard res={nextRes} featured />
          ) : (
            <Card>
              <Meta>Nothing booked yet. Reserve a class to see it here.</Meta>
              <View className="mt-4">
                <GhostButton label="Browse schedule" href="/schedule" />
              </View>
            </Card>
          )}
        </View>

        {/* Also coming up */}
        {upcoming.length > 1 && (
          <View className="mt-10">
            <Eyebrow>Also coming up</Eyebrow>
            <View className="mt-4 gap-2">
              {upcoming.slice(1).map((u) => <ReservationCard key={u.id} res={u} />)}
            </View>
          </View>
        )}

        {/* Shortcuts */}
        <View className="mt-12">
          <Eyebrow>Shortcuts</Eyebrow>
          <View className="mt-4" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <ShortcutTile icon="calendar-outline" label="Book a class" href="/schedule" tint="ink" />
            <ShortcutTile icon="play-outline" label="On Demand library" href="/account" tint="peach" />
            <ShortcutTile icon="settings-outline" label="Account settings" href="/account" tint="outline" />
          </View>
        </View>

        {/* Recent */}
        {recent.length > 0 && (
          <View className="mt-12">
            <Eyebrow>Recent</Eyebrow>
            <Text
              className="text-ink font-display text-2xl mt-2 leading-7"
              accessibilityRole="header"
              // @ts-expect-error
              aria-level={2}
            >
              Your last few classes
            </Text>
            <View className="mt-4" style={{ borderTopWidth: 1, borderTopColor: '#E8DCC9' }}>
              {recent.map((h) => (
                <View
                  key={h.id}
                  className="flex-row items-center justify-between py-4"
                  style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9' }}
                >
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
                  <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                    {fmtDate(h.class_session.starts_at)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sign out */}
        <View className="mt-16 items-start">
          <Pressable
            onPress={signOut}
            className="border border-ink-2 px-6 py-3.5 active:bg-ink/5"
            accessibilityRole="button"
            accessibilityLabel="Sign out of member access"
          >
            <Text className="text-ink-2 font-bodyBold tracking-[0.18em] uppercase text-xs">Sign out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── helper components ──────────────────────────────────────────────
function ReservationCard({ res, featured = false }: { res: ReservationRow; featured?: boolean }) {
  const s = res.class_session;
  const instructorName =
    s.instructor?.preferred_name ?? s.instructor?.full_name ?? 'staff';

  return (
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <View style={{ minWidth: 100 }}>
          <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
            {fmtDate(s.starts_at)}
          </Text>
          <Text className={'text-ink font-display ' + (featured ? 'text-3xl mt-1 leading-9' : 'text-xl mt-1 leading-6')}>
            {fmtTime(s.starts_at)}
          </Text>
        </View>
        <View className="grow basis-[200px]">
          <Text className={'text-ink font-display ' + (featured ? 'text-2xl leading-7' : 'text-lg leading-6')}>
            {s.class_type.name}
          </Text>
          <Meta>With {instructorName} · {s.location.name}</Meta>
        </View>
      </View>
    </Card>
  );
}

function ShortcutTile({
  icon, label, href, tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
  tint: 'ink' | 'peach' | 'outline';
}) {
  const cls =
    'px-5 py-5 grow basis-[200px] active:opacity-80 ' +
    (tint === 'ink' ? 'bg-ink' : tint === 'peach' ? 'bg-peach-200' : 'border border-ink bg-transparent');
  const iconColor = tint === 'ink' ? '#F1E8DD' : '#1F1F1F';
  const textCls = tint === 'ink' ? 'text-cream' : 'text-ink';
  return (
    <Link href={href as any} asChild>
      <Pressable className={cls} accessibilityRole="link" accessibilityLabel={label}>
        <Ionicons name={icon} size={20} color={iconColor} accessibilityElementsHidden importantForAccessibility="no" />
        <Text className={`font-display text-lg mt-3 ${textCls}`}>{label}</Text>
      </Pressable>
    </Link>
  );
}

// Owner-only overview panel — visible only when role === 'admin'.
// First slice: live counts of total members + active memberships +
// upcoming sessions in the next 7 days. Subsequent commits add the
// member directory, instructor management, and schedule templates.
function OwnerPanel() {
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
    <View className="mt-10 p-6" style={{ backgroundColor: '#1F1F1F', borderRadius: 4 }}>
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
