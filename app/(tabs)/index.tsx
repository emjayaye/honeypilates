import React from 'react';
import { ScrollView, View, Text, Pressable, Platform } from 'react-native';
import { Link } from 'expo-router';

import { FullBleedSection } from '@/components/full-bleed-section';
import { MeetMariaSection } from '@/components/meet-maria-section';

// Honey Pilates — landing.
// Vertical full-viewport snap-scroll: each section takes the screen,
// snaps into place when the user releases their scroll, with a slow
// Ken Burns zoom on each image (cancelled under prefers-reduced-motion
// via global.css). Cinematic, boutique, image-forward.
//
// Sections:
//   1. Hero               — full-bleed intro shot + "Precision. Elegance."
//   2. Group Classes      — reformer studio in motion
//   3. 1:1 Training       — instructor + student
//   4. On Demand          — at-home practice
//   5. Meet Maria         — founder portrait + bio
//   6. Visit              — locations + closing CTA
export default function HomeScreen() {
  return (
    <ScrollView
      // Web-only scroll-snap container. Native uses pagingEnabled.
      // @ts-expect-error CSS scrollSnapType is RN-web only
      style={{ scrollSnapType: 'y mandatory' }}
      pagingEnabled={Platform.OS !== 'web'}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="bg-cream"
    >
      <FullBleedSection
        image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&h=2200&fit=crop&q=85"
        alt="A woman performing a stretching pose on a Pilates reformer in a warm-lit studio"
        eyebrow="Honey Pilates"
        title={'Precision.\nElegance.\nTransformation.'}
        body="A luxury boutique Pilates studio for women in Patchogue and Sayville — small reformer + mat classes with real attention."
        ctas={[
          { label: 'Book a class', href: '/schedule' },
          { label: 'Memberships', href: '/membership' },
        ]}
        align="end"
        scrim={0.45}
        level={1}
      />

      <FullBleedSection
        image="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&h=2200&fit=crop&q=85"
        alt="Women practicing a group Pilates mat class in a softly lit studio"
        eyebrow="Women's Group Classes"
        title="Strength, grace, and connection."
        body="Eight reformers. One instructor. Sixty minutes of intentional movement for every body, from first-timer to seasoned practitioner."
        ctas={[{ label: 'See the schedule', href: '/schedule' }]}
        align="center"
        scrim={0.4}
      />

      <FullBleedSection
        image="https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?w=1600&h=2200&fit=crop&q=85"
        alt="A Pilates instructor coaching a private student through a reformer exercise"
        eyebrow="1:1 Training"
        title="One instructor. One body. One hour."
        body="Private sessions tailored to your form, your goals, and where you are today. The fastest way into the work."
        ctas={[{ label: 'Book a private', href: '/schedule' }]}
        align="start"
        scrim={0.4}
      />

      <FullBleedSection
        image="https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1600&h=2200&fit=crop&q=85"
        alt="A woman practicing Pilates at home with sunlight pouring in"
        eyebrow="On Demand"
        title={'Practice anywhere.\nAnytime.'}
        body="A curated library of mat flows and targeted programs, recorded by our studio instructors. Yours with any active membership."
        align="end"
        scrim={0.35}
      />

      <MeetMariaSection />

      {/* Visit / footer section — cream, half-height, closing CTA */}
      <View
        // @ts-expect-error scroll-snap-align is web-only
        style={{ scrollSnapAlign: 'start', minHeight: 420 }}
        className="bg-ink px-7 py-16"
      >
        <View style={{ maxWidth: 720, alignSelf: 'center', width: '100%' }}>
          <Text className="text-peach text-[11px] tracking-[0.32em] uppercase font-bodyMd">
            Visit
          </Text>
          <Text
            className="text-cream font-display text-4xl leading-[44px] mt-3"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            Patchogue · Sayville
          </Text>
          <Text className="text-cream/85 font-body text-base leading-7 mt-5 max-w-[42ch]">
            Two locations across Long Island's south shore. Walk in, kick
            your shoes off, and find a reformer with your name on it.
          </Text>

          <View className="flex-row flex-wrap gap-3 mt-7">
            <Link href="/schedule" asChild>
              <Pressable
                className="bg-cream px-7 py-4 active:opacity-80"
                accessibilityRole="link"
                accessibilityLabel="Book a class"
              >
                <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs">
                  Book a class
                </Text>
              </Pressable>
            </Link>
            <Link href="/membership" asChild>
              <Pressable
                className="border border-cream px-7 py-4 active:bg-cream/10"
                accessibilityRole="link"
                accessibilityLabel="View pricing and memberships"
              >
                <Text className="text-cream font-bodyBold tracking-[0.18em] uppercase text-xs">
                  Pricing
                </Text>
              </Pressable>
            </Link>
          </View>

          <Text className="text-cream/60 text-[11px] tracking-[0.28em] uppercase font-bodyMd mt-12">
            honeypilates.com · 631 · 600 · 8724
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
