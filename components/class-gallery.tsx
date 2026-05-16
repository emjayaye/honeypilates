import React from 'react';
import { ScrollView, View, Text, Pressable, ImageBackground } from 'react-native';
import { Link } from 'expo-router';

// ─── data ─────────────────────────────────────────────────────────────
// Curated Pilates / reformer / movement photography from Unsplash.
// Each entry includes an `alt` that screen readers announce — replace
// with descriptive copy when you swap in studio photography.
type ClassCard = {
  key: string;
  label: string;
  blurb: string;
  image: string;
  alt: string;
  href: string;
};

const CLASSES: ClassCard[] = [
  {
    key: 'reformer',
    label: 'Reformer Flow',
    blurb: '60 min · all levels',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=720&h=960&fit=crop&q=80',
    alt: 'A woman performing a stretching pose on a Pilates reformer',
    href: '/schedule',
  },
  {
    key: 'mat',
    label: 'Mat & Core',
    blurb: '45 min · all levels',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=720&h=960&fit=crop&q=80',
    alt: 'Women practicing a Pilates mat class in a softly lit studio',
    href: '/schedule',
  },
  {
    key: 'sculpt',
    label: 'Sculpt + Sweat',
    blurb: '50 min · intermediate',
    image:
      'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=720&h=960&fit=crop&q=80',
    alt: 'A woman working out with resistance equipment in a movement studio',
    href: '/schedule',
  },
  {
    key: 'prenatal',
    label: 'Prenatal Reformer',
    blurb: '50 min · pregnancy-safe',
    image:
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=720&h=960&fit=crop&q=80',
    alt: 'A woman doing gentle stretching exercises during pregnancy',
    href: '/schedule',
  },
  {
    key: 'one-on-one',
    label: '1:1 Training',
    blurb: 'Private session · book direct',
    image:
      'https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?w=720&h=960&fit=crop&q=80',
    alt: 'An instructor coaching a student one-on-one on a Pilates reformer',
    href: '/schedule',
  },
];

// Sizing — 280-wide × 4:5 aspect, next card peeks for the swipe affordance.
const CARD_WIDTH = 280;
const CARD_GAP = 14;
const SNAP = CARD_WIDTH + CARD_GAP;

export function ClassGallery() {
  return (
    <View className="pt-12">
      {/* Section header */}
      <View className="px-6 pb-5">
        <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          The Studio
        </Text>
        <View className="flex-row items-end justify-between mt-3">
          <Text
            className="text-ink text-3xl font-display leading-9 max-w-[20ch]"
            accessibilityRole="header"
            // @ts-expect-error aria-level forwards as a web role attr
            aria-level={2}
          >
            Classes for every body.
          </Text>
          <Link href="/schedule" asChild>
            <Pressable
              className="py-3 -my-3 active:opacity-60"
              accessibilityRole="link"
              accessibilityLabel="See all class types and schedule"
            >
              <Text className="text-ink font-bodyBold text-xs tracking-[0.18em] uppercase underline">
                See all →
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Horizontal snap-scroller */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 80 }}
        // Screen readers expose the list as a group of cards.
        accessibilityRole="list"
        accessibilityLabel="Class types"
      >
        {CLASSES.map((c, i) => (
          <Link key={c.key} href={c.href as any} asChild>
            <Pressable
              style={{
                width: CARD_WIDTH,
                marginRight: i === CLASSES.length - 1 ? 0 : CARD_GAP,
              }}
              className="active:opacity-90"
              accessibilityRole="link"
              accessibilityLabel={`${c.label}. ${c.blurb}. ${c.alt}.`}
              accessibilityHint="Opens the class schedule"
            >
              <ImageBackground
                source={{ uri: c.image }}
                imageStyle={{ borderRadius: 4 }}
                style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.25 }}
                accessible={false}
                accessibilityLabel={c.alt}
              >
                {/* Bottom-aligned label pill — cream over image for high
                    contrast (ink-on-cream ~13:1, AAA). */}
                <View className="absolute bottom-0 left-0 right-0 p-5">
                  <View
                    className="bg-cream/95 px-4 py-3"
                    style={{ borderRadius: 2 }}
                  >
                    <Text className="text-ink font-display text-lg leading-6">
                      {c.label}
                    </Text>
                    <Text className="text-ink-2 font-body text-xs tracking-[0.12em] uppercase mt-1">
                      {c.blurb}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          </Link>
        ))}
      </ScrollView>

      {/* Swipe affordance — visual only, hidden from screen readers
          since they don't swipe horizontally. */}
      <Text
        className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd text-center mt-4"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        Swipe ›
      </Text>
    </View>
  );
}
