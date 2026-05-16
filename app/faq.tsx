import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Static FAQ. Authored copy lives in the FAQS array — easy to edit
// without touching markup. Each entry expands on tap (single-open
// accordion is conventional + reads as calm).

type Entry = { q: string; a: string };

const FAQS: Entry[] = [
  {
    q: "I've never done Pilates. Will I fit in?",
    a: "Yes. Every class welcomes first-timers — your instructor will set up your reformer and offer modifications throughout. We recommend starting with Reformer Flow or Mat & Core.",
  },
  {
    q: "What should I wear?",
    a: "Form-fitting clothes you can move in. Grippy socks are required on the reformer; we sell them at the studio for $14 if you need a pair.",
  },
  {
    q: "How early should I arrive?",
    a: "Please arrive ten minutes before class so we can settle you in. The door locks at start time so the practicing room stays quiet.",
  },
  {
    q: "What's your cancellation policy?",
    a: "Cancel up to four hours before class without penalty. Late cancels or no-shows cost one class credit, per studio policy.",
  },
  {
    q: "Are classes safe during pregnancy?",
    a: "Yes — book Prenatal Reformer specifically. We require physician clearance after the first trimester and our instructors are trained in pregnancy-safe modifications.",
  },
  {
    q: "Do you offer private sessions?",
    a: "Yes — 1:1 Training is available daily by appointment. They're the fastest way into the work, especially if you're working around an injury.",
  },
  {
    q: "Can I freeze or pause my membership?",
    a: "Monthly memberships pause for up to thirty days (or sixty days on the Unlimited tier). Email flow@honeypilates.com from your account email to request a freeze.",
  },
  {
    q: "Where are you located?",
    a: "Two studios on Long Island's south shore — Patchogue and Sayville. Full addresses, hours, and parking notes on the Locations page.",
  },
];

const Eyebrow = ({ children }: { children: string }) => (
  <Text className="text-ink-2 text-[10px] tracking-[0.36em] uppercase font-bodyMd">{children}</Text>
);
const HairlineRule = () => (
  <View
    style={{ height: 1, width: 56, backgroundColor: '#EBC3A1', marginTop: 18, marginBottom: 22 }}
    accessibilityElementsHidden importantForAccessibility="no"
  />
);

export default function FAQScreen() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <ScrollView contentContainerClassName="bg-cream pb-24">
      <View
        className="pt-10"
        style={{ maxWidth: 760, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}
      >
        <Eyebrow>Studio</Eyebrow>
        <Text
          className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Questions, answered.
        </Text>
        <HairlineRule />
        <Text className="text-ink-2 font-body text-[15px] leading-7">
          The most common things new members ask. Don't see yours?{' '}
          <Text className="text-ink underline">flow@honeypilates.com</Text>.
        </Text>

        <View className="mt-10" accessibilityRole={'list' as any}>
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <View
                key={f.q}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: '#E8DCC9',
                  paddingVertical: 6,
                }}
              >
                <Pressable
                  onPress={() => setOpenIdx(open ? null : i)}
                  className="py-5 active:opacity-70 flex-row items-start justify-between gap-4"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={f.q}
                >
                  <Text className="text-ink font-display italic text-xl leading-7 flex-1">
                    {f.q}
                  </Text>
                  <Ionicons
                    name={open ? 'remove' : 'add'}
                    size={20}
                    color="#777C75"
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </Pressable>
                {open && (
                  <Text className="text-ink-2 font-body text-[15px] leading-7 pb-6 pr-8">
                    {f.a}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
