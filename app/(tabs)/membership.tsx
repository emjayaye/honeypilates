import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Pricing — the studio's full catalog. Reads subscription_plans +
// class_pack_offerings from the DB so the owner can edit pricing /
// add tiers without a code change.
//
// Stripe checkout isn't wired yet — the "Begin" / "Buy" CTAs show a
// graceful "Stripe checkout coming online" message. Once the studio
// has a Stripe account + we wire the edge function, these CTAs will
// launch the real flow.

type Plan = {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_cents: number;
  classes_per_month: number | null;
  features: string[] | null;
  badge: string | null;
  stripe_price_id: string | null;
};
type Pack = {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  credits: number;
  price_cents: number;
  valid_days: number;
  badge: string | null;
  stripe_price_id: string | null;
};

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
const HairlineRule = ({ tone = 'ink' }: { tone?: 'ink' | 'peach' | 'cream' }) => (
  <View
    style={{
      height: 1,
      width: 56,
      backgroundColor: tone === 'peach' ? '#EBC3A1' : tone === 'cream' ? 'rgba(241,232,221,0.6)' : 'rgba(31,31,31,0.35)',
      marginTop: 18, marginBottom: 22,
    }}
    accessibilityElementsHidden
    importantForAccessibility="no"
  />
);
const dollars = (cents: number) => '$' + (cents / 100).toFixed(0);

export default function MembershipScreen() {
  const { session } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [p, k] = await Promise.all([
        supabase.from('subscription_plans')
          .select('id,key,name,tagline,description,price_cents,classes_per_month,features,badge,stripe_price_id')
          .eq('is_published', true)
          .order('sort_order'),
        supabase.from('class_pack_offerings')
          .select('id,key,name,tagline,description,credits,price_cents,valid_days,badge,stripe_price_id')
          .eq('is_published', true)
          .order('sort_order'),
      ]);
      setPlans((p.data ?? []) as Plan[]);
      setPacks((k.data ?? []) as Pack[]);
    })();
  }, []);

  const beginCheckout = async (item: { name: string; stripe_price_id: string | null }) => {
    if (!session) {
      setFlash('Sign in to start a membership.');
      return;
    }
    if (!item.stripe_price_id) {
      setFlash(`${item.name} — Stripe checkout coming online soon. The studio is finalizing payment setup.`);
      return;
    }
    // Phase 4b: redirect to Supabase Edge Function /create-checkout-session
    // which returns a Stripe Checkout URL. Until then this branch never runs.
    setFlash('Redirecting to checkout…');
  };

  return (
    <ScrollView contentContainerClassName="bg-cream pb-24">
      <View
        className="pt-10"
        style={{ maxWidth: 1100, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}
      >
        <Eyebrow>Pricing</Eyebrow>
        <Text
          className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Memberships & packs.
        </Text>
        <HairlineRule tone="peach" />
        <Text className="text-ink-2 font-body text-[15px] leading-7">
          Two paths into the practice. Choose a monthly membership for unlimited rhythm,
          or buy a pack and pace yourself.
        </Text>

        {flash && (
          <View
            className="mt-6 p-4"
            style={{ backgroundColor: '#FAEEE3', borderWidth: 1, borderColor: '#EBC3A1' }}
            accessibilityLiveRegion="polite"
          >
            <Text className="text-ink font-body text-sm">{flash}</Text>
          </View>
        )}

        {/* Monthly memberships */}
        <View className="mt-12">
          <Eyebrow>Monthly</Eyebrow>
          <Text
            className="text-ink font-display italic text-3xl mt-3 leading-9"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            Steady rhythm.
          </Text>
          <HairlineRule />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {plans.map((p) => <PlanCard key={p.id} p={p} onBegin={() => beginCheckout(p)} />)}
            {plans.length === 0 && <ComingSoon label="Plans" />}
          </View>
        </View>

        {/* Class packs */}
        <View className="mt-14">
          <Eyebrow>Packs</Eyebrow>
          <Text
            className="text-ink font-display italic text-3xl mt-3 leading-9"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            Pay as you go.
          </Text>
          <HairlineRule />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {packs.map((p) => <PackCard key={p.id} p={p} onBuy={() => beginCheckout(p)} />)}
            {packs.length === 0 && <ComingSoon label="Packs" />}
          </View>
        </View>

        {/* Fine print + waiver reminder */}
        <View className="mt-14">
          <Text className="text-ink-2 font-body italic text-sm leading-6">
            All members sign the studio waiver before their first class. Memberships can
            be paused or cancelled anytime from your account. Packs expire after the
            window above — unused credits roll once per pack, per membership.
          </Text>
        </View>

        {!session && (
          <View className="mt-10 p-7" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2 }}>
            <Text className="text-ink font-display italic text-2xl leading-7">
              Already a member?
            </Text>
            <Text className="text-ink-2 font-body text-sm leading-6 mt-2">
              Sign in to manage your plan or check remaining credits.
            </Text>
            <View className="mt-5">
              <Link href="/account" asChild>
                <Pressable
                  className="border border-ink px-6 py-3.5 self-start active:bg-ink/5"
                  accessibilityRole="link"
                  accessibilityLabel="Sign in to your member account"
                >
                  <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                    Sign in
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── plan card (subscriptions) ──────────────────────────────────────
function PlanCard({ p, onBegin }: { p: Plan; onBegin: () => void }) {
  const isPopular = p.badge === 'Most popular';
  return (
    <View
      className="p-7 grow basis-[260px]"
      style={{
        backgroundColor: isPopular ? '#1F1F1F' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isPopular ? '#1F1F1F' : '#E8DCC9',
        borderRadius: 2,
        minHeight: 360,
        justifyContent: 'space-between',
      }}
    >
      <View>
        {p.badge && (
          <Text
            className={
              (isPopular ? 'text-peach ' : 'text-ink-2 ') +
              'text-[10px] tracking-[0.36em] uppercase font-bodyMd'
            }
          >
            {p.badge}
          </Text>
        )}
        <Text className={(isPopular ? 'text-cream ' : 'text-ink ') + 'font-display italic text-[28px] mt-3 leading-8'}>
          {p.name}
        </Text>
        {p.tagline && (
          <Text className={(isPopular ? 'text-cream/70 ' : 'text-ink-2 ') + 'font-body italic text-sm leading-6 mt-1'}>
            {p.tagline}
          </Text>
        )}
        <View
          style={{
            height: 1, width: 40,
            backgroundColor: isPopular ? 'rgba(235,195,161,0.6)' : 'rgba(31,31,31,0.35)',
            marginTop: 18, marginBottom: 18,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text className={(isPopular ? 'text-cream ' : 'text-ink ') + 'font-display text-[44px] leading-[48px]'}>
          {dollars(p.price_cents)}
          <Text className={(isPopular ? 'text-cream/60 ' : 'text-ink-2 ') + 'font-body text-base'}>
            {' '}/mo
          </Text>
        </Text>
        {p.classes_per_month !== null && (
          <Text className={(isPopular ? 'text-cream/70 ' : 'text-ink-2 ') + 'font-body text-sm leading-6 mt-1'}>
            {p.classes_per_month} classes / month
          </Text>
        )}
        {p.description && (
          <Text className={(isPopular ? 'text-cream/85 ' : 'text-ink-2 ') + 'font-body text-sm leading-6 mt-3'}>
            {p.description}
          </Text>
        )}
        {p.features && p.features.length > 0 && (
          <View className="mt-4 gap-1.5">
            {p.features.map((f, i) => (
              <Text
                key={i}
                className={(isPopular ? 'text-cream/80 ' : 'text-ink-2 ') + 'font-body text-sm leading-6'}
              >
                · {f}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View className="mt-6">
        <Pressable
          onPress={onBegin}
          className={(isPopular ? 'bg-cream ' : 'bg-ink ') + 'px-6 py-3.5 self-start active:opacity-80'}
          accessibilityRole="button"
          accessibilityLabel={`Begin ${p.name} membership`}
        >
          <Text
            className={
              (isPopular ? 'text-ink ' : 'text-cream ') +
              'font-bodyBold tracking-[0.22em] uppercase text-[11px]'
            }
          >
            Begin
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── pack card (one-time) ───────────────────────────────────────────
function PackCard({ p, onBuy }: { p: Pack; onBuy: () => void }) {
  const perClass = p.price_cents / p.credits / 100;
  return (
    <View
      className="p-7 grow basis-[260px]"
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8DCC9',
        borderRadius: 2,
        minHeight: 340,
        justifyContent: 'space-between',
      }}
    >
      <View>
        {p.badge && (
          <Text className="text-peach text-[10px] tracking-[0.36em] uppercase font-bodyMd">
            {p.badge}
          </Text>
        )}
        <Text className="text-ink font-display italic text-[28px] mt-3 leading-8">{p.name}</Text>
        {p.tagline && (
          <Text className="text-ink-2 font-body italic text-sm leading-6 mt-1">{p.tagline}</Text>
        )}
        <View
          style={{ height: 1, width: 40, backgroundColor: 'rgba(31,31,31,0.35)', marginTop: 18, marginBottom: 18 }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text className="text-ink font-display text-[44px] leading-[48px]">
          {dollars(p.price_cents)}
        </Text>
        <Text className="text-ink-2 font-body text-sm leading-6 mt-1">
          {p.credits} {p.credits === 1 ? 'class' : 'classes'} · ${perClass.toFixed(0)} each · valid {p.valid_days} days
        </Text>
        {p.description && (
          <Text className="text-ink-2 font-body text-sm leading-6 mt-3">{p.description}</Text>
        )}
      </View>
      <View className="mt-6">
        <Pressable
          onPress={onBuy}
          className="border border-ink px-6 py-3.5 self-start active:bg-ink/5"
          accessibilityRole="button"
          accessibilityLabel={`Buy ${p.name}`}
        >
          <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">
            Buy pack
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <View
      className="p-7 grow"
      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2, borderStyle: 'dashed' }}
    >
      <Text className="text-ink-2 font-body italic text-sm">{label} catalog hasn't been published yet.</Text>
    </View>
  );
}
