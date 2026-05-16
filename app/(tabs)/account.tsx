import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Member Dashboard.
// Static mock for v1 — every value below comes from a hardcoded MEMBER
// object so the design + flow can be validated before auth is wired.
// Phase 2 (Supabase Auth) replaces MEMBER with a real session + the
// queries against `memberships`, `class_credits`, `reservations`.
const MEMBER = {
  name: 'Sarah Bennett',
  firstName: 'Sarah',
  initials: 'SB',
  joinedYear: 2024,
  monthly: {
    plan: 'Monthly Unlimited',
    price: 129,
    renewsOn: 'May 28',
    active: true,
  },
  pack: {
    label: '10-Class Pack',
    creditsLeft: 6,
    creditsTotal: 10,
    expiresOn: 'Aug 14',
  },
  upcoming: [
    {
      id: 'r1',
      className: 'Reformer Flow',
      instructor: 'Maria',
      date: 'Wed, May 21',
      time: '6:00 PM',
      studio: 'Patchogue',
    },
    {
      id: 'r2',
      className: 'Sculpt + Sweat',
      instructor: 'Joelle',
      date: 'Fri, May 23',
      time: '7:00 AM',
      studio: 'Sayville',
    },
  ],
  recent: [
    { id: 'h1', className: 'Mat & Core',    date: 'May 12', instructor: 'Maria' },
    { id: 'h2', className: 'Reformer Flow', date: 'May 9',  instructor: 'Joelle' },
    { id: 'h3', className: 'Reformer Flow', date: 'May 7',  instructor: 'Maria' },
  ],
};

// ─── small inline primitives so the dashboard reads as one file ────
const Eyebrow = ({ children }: { children: string }) => (
  <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
    {children}
  </Text>
);

const CardTitle = ({ children }: { children: string }) => (
  <Text className="text-ink font-display text-2xl leading-7">{children}</Text>
);

const Meta = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-ink-2 font-body text-sm leading-6">{children}</Text>
);

// Cream card on cream background — leans on a hairline border + lots of
// internal padding rather than shadow, to match the boutique tone.
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View
    className={'p-6 ' + className}
    style={{
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E8DCC9',
      borderRadius: 4,
    }}
  >
    {children}
  </View>
);

// Ink filled CTA matching the rest of the brand.
const PrimaryButton = ({
  label, href, fullWidth = false,
}: { label: string; href: string; fullWidth?: boolean }) => (
  <Link href={href as any} asChild>
    <Pressable
      className={'bg-ink px-6 py-3.5 active:opacity-80 ' + (fullWidth ? 'self-stretch' : 'self-start')}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text className={'text-cream font-bodyBold tracking-[0.18em] uppercase text-xs ' + (fullWidth ? 'text-center' : '')}>
        {label}
      </Text>
    </Pressable>
  </Link>
);

const GhostButton = ({ label, href }: { label: string; href: string }) => (
  <Link href={href as any} asChild>
    <Pressable
      className="border border-ink px-6 py-3.5 active:bg-ink/5 self-start"
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs">
        {label}
      </Text>
    </Pressable>
  </Link>
);

// ─── screen ────────────────────────────────────────────────────────
export default function AccountScreen() {
  const nextClass = MEMBER.upcoming[0];
  const packPct = (MEMBER.pack.creditsLeft / MEMBER.pack.creditsTotal) * 100;

  return (
    <ScrollView contentContainerClassName="bg-cream pb-16">
      {/* Demo banner — removed once Phase 2 auth lands and the page is gated on a real session. */}
      <View className="bg-peach/40 border-b border-peach px-6 py-2">
        <Text className="text-ink-2 text-[10px] tracking-[0.24em] uppercase font-bodyMd text-center">
          Demo · Auth + live data wire-up in Phase 2
        </Text>
      </View>

      <View className="px-6 pt-10" style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
        {/* Greeting */}
        <Eyebrow>Member</Eyebrow>
        <Text
          className="text-ink font-display text-[42px] mt-3 leading-[46px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Welcome back, {MEMBER.firstName}.
        </Text>
        <View
          className="h-[1px] bg-ink/15 mt-6 w-16"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Meta>
          Member since {MEMBER.joinedYear} · You have {MEMBER.upcoming.length} class{MEMBER.upcoming.length === 1 ? '' : 'es'} on the books.
        </Meta>

        {/* Status cards — Membership + Next class side by side on >=760px */}
        <View
          className="mt-10"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          {/* Monthly membership card */}
          <Card className="grow basis-[320px]">
            <Eyebrow>Plan</Eyebrow>
            <View className="mt-3">
              <CardTitle>{MEMBER.monthly.plan}</CardTitle>
            </View>
            <Meta>${MEMBER.monthly.price}/month · renews {MEMBER.monthly.renewsOn}</Meta>
            <View className="mt-5 flex-row items-center gap-3">
              <View className="bg-peach/40 px-3 py-1.5">
                <Text className="text-ink text-[10px] tracking-[0.22em] uppercase font-bodyBold">
                  Active
                </Text>
              </View>
            </View>
            <View className="mt-6 flex-row gap-3 flex-wrap">
              <GhostButton label="Manage plan" href="/membership" />
            </View>
          </Card>

          {/* Pack credits card */}
          <Card className="grow basis-[320px]">
            <Eyebrow>Class Credits</Eyebrow>
            <View className="mt-3">
              <CardTitle>{MEMBER.pack.label}</CardTitle>
            </View>
            <Meta>
              {MEMBER.pack.creditsLeft} of {MEMBER.pack.creditsTotal} classes left · expires {MEMBER.pack.expiresOn}
            </Meta>
            {/* Credit progress meter — peach fill on cream track. */}
            <View
              className="mt-4 bg-cream"
              style={{ height: 6, borderRadius: 2, borderWidth: 1, borderColor: '#E8DCC9' }}
              accessibilityRole={'progressbar' as any}
              accessibilityValue={{ min: 0, max: MEMBER.pack.creditsTotal, now: MEMBER.pack.creditsLeft }}
              accessibilityLabel="Class credits remaining"
            >
              <View
                className="bg-peach"
                style={{ width: `${packPct}%`, height: '100%', borderRadius: 2 }}
              />
            </View>
            <View className="mt-6">
              <GhostButton label="Buy more credits" href="/membership" />
            </View>
          </Card>
        </View>

        {/* Next class — featured row */}
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
                Your next class
              </Text>
            </View>
            <Link href="/schedule" asChild>
              <Pressable
                className="py-3 -my-3 active:opacity-60"
                accessibilityRole="link"
                accessibilityLabel="See the full class schedule"
              >
                <Text className="text-ink font-bodyBold text-xs tracking-[0.18em] uppercase underline">
                  Full schedule →
                </Text>
              </Pressable>
            </Link>
          </View>

          {nextClass ? (
            <Card>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
                <View style={{ minWidth: 90 }}>
                  <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                    {nextClass.date}
                  </Text>
                  <Text className="text-ink font-display text-3xl mt-1 leading-9">
                    {nextClass.time}
                  </Text>
                </View>
                <View className="grow basis-[200px]">
                  <CardTitle>{nextClass.className}</CardTitle>
                  <Meta>
                    With {nextClass.instructor} · {nextClass.studio}
                  </Meta>
                </View>
                <View className="flex-row gap-3 flex-wrap">
                  <PrimaryButton label="View details" href="/schedule" />
                  <Pressable
                    className="px-6 py-3.5 active:opacity-60"
                    accessibilityRole="button"
                    accessibilityLabel={`Cancel ${nextClass.className} on ${nextClass.date}`}
                  >
                    <Text className="text-ink-2 font-bodyBold tracking-[0.18em] uppercase text-xs underline">
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ) : (
            <Card>
              <Meta>Nothing booked yet.</Meta>
              <View className="mt-4">
                <PrimaryButton label="Book a class" href="/schedule" />
              </View>
            </Card>
          )}
        </View>

        {/* Upcoming classes list */}
        {MEMBER.upcoming.length > 1 && (
          <View className="mt-10">
            <Eyebrow>Also coming up</Eyebrow>
            <View className="mt-4 gap-2">
              {MEMBER.upcoming.slice(1).map((u) => (
                <Card key={u.id}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                    <View style={{ minWidth: 100 }}>
                      <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                        {u.date}
                      </Text>
                      <Text className="text-ink font-display text-xl mt-1 leading-6">{u.time}</Text>
                    </View>
                    <View className="grow basis-[200px]">
                      <Text className="text-ink font-display text-lg leading-6">{u.className}</Text>
                      <Meta>With {u.instructor} · {u.studio}</Meta>
                    </View>
                    <Pressable
                      className="py-3 -my-3 active:opacity-60"
                      accessibilityRole="button"
                      accessibilityLabel={`Cancel ${u.className} on ${u.date}`}
                    >
                      <Text className="text-ink-2 font-bodyBold tracking-[0.18em] uppercase text-xs underline">
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View className="mt-12">
          <Eyebrow>Shortcuts</Eyebrow>
          <View
            className="mt-4"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
          >
            {[
              { icon: 'calendar-outline' as const, label: 'Book a class',      href: '/schedule',   tint: 'ink' as const },
              { icon: 'play-outline'     as const, label: 'On Demand library', href: '/account',    tint: 'peach' as const },
              { icon: 'settings-outline' as const, label: 'Account settings',  href: '/account',    tint: 'outline' as const },
            ].map((a) => (
              <Link key={a.label} href={a.href as any} asChild>
                <Pressable
                  className={
                    'px-5 py-5 grow basis-[200px] active:opacity-80 ' +
                    (a.tint === 'ink' ? 'bg-ink' : a.tint === 'peach' ? 'bg-peach-200' : 'border border-ink bg-transparent')
                  }
                  accessibilityRole="link"
                  accessibilityLabel={a.label}
                >
                  <Ionicons
                    name={a.icon}
                    size={20}
                    color={a.tint === 'ink' ? '#F1E8DD' : '#1F1F1F'}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text
                    className={
                      'font-display text-lg mt-3 ' +
                      (a.tint === 'ink' ? 'text-cream' : 'text-ink')
                    }
                  >
                    {a.label}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        {/* Recent activity */}
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
          <View className="mt-4 gap-px" style={{ borderTopWidth: 1, borderTopColor: '#E8DCC9' }}>
            {MEMBER.recent.map((h) => (
              <View
                key={h.id}
                className="flex-row items-center justify-between py-4"
                style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9' }}
              >
                <View>
                  <Text className="text-ink font-display text-base leading-6">{h.className}</Text>
                  <Meta>With {h.instructor}</Meta>
                </View>
                <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                  {h.date}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings rail */}
        <View className="mt-12">
          <Eyebrow>Account</Eyebrow>
          <View className="mt-4" style={{ borderTopWidth: 1, borderTopColor: '#E8DCC9' }}>
            {[
              { label: 'Profile',          href: '/account', hint: 'Name, photo, emergency contact' },
              { label: 'Payment methods',  href: '/account', hint: 'Cards on file, billing history' },
              { label: 'Waiver',           href: '/account', hint: 'Signed Apr 2024 · view + re-sign' },
              { label: 'Notifications',    href: '/account', hint: 'Reminders, schedule changes' },
              { label: 'Sign out',         href: '/account', hint: 'Leave member access' },
            ].map((row) => (
              <Link key={row.label} href={row.href as any} asChild>
                <Pressable
                  className="flex-row items-center justify-between py-4 active:bg-ink/5"
                  style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9' }}
                  accessibilityRole="link"
                  accessibilityLabel={`${row.label}. ${row.hint}.`}
                >
                  <View className="flex-1 pr-4">
                    <Text className="text-ink font-display text-lg leading-6">{row.label}</Text>
                    <Meta>{row.hint}</Meta>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#777C75"
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
