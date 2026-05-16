import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';

// Founder section — image on top, bio on bottom for narrow screens;
// side-by-side on wider viewports. Snaps to the parent like the other
// full-bleed sections. Cream background (not a photo overlay) so the
// portrait reads as a calm beat between the cinematic image sections.
export function MeetMariaSection() {
  const { width, height } = useWindowDimensions();
  const sectionHeight = Math.max(height - 60, 640);
  const isWide = width >= 760;

  return (
    <View
      // @ts-expect-error scroll-snap-align is web-only
      style={{ height: sectionHeight, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      className="bg-cream"
      accessibilityRole={Platform.OS === 'web' ? ('region' as any) : undefined}
      accessibilityLabel="Meet Maria, founder of Honey Pilates"
    >
      <View
        className="flex-1"
        style={{
          flexDirection: isWide ? 'row' : 'column',
          paddingHorizontal: isWide ? 0 : 24,
          paddingVertical: isWide ? 0 : 32,
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: 1100,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Portrait */}
        <View
          style={{
            width: isWide ? '46%' : '100%',
            maxWidth: isWide ? 460 : 380,
            aspectRatio: 4 / 5,
            marginRight: isWide ? 40 : 0,
            marginBottom: isWide ? 0 : 24,
          }}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=720&h=900&fit=crop&q=80',
            }}
            accessibilityLabel="Portrait of Maria, founder and Master Pilates Instructor at Honey Pilates"
            style={{ width: '100%', height: '100%', borderRadius: 2 }}
            resizeMode="cover"
          />
        </View>

        {/* Bio */}
        <View style={{ width: isWide ? '46%' : '100%', maxWidth: 480 }}>
          <Text className="text-ink-2 text-[11px] tracking-[0.32em] uppercase font-bodyMd">
            Founder
          </Text>
          <Text
            className="text-ink font-display text-[44px] leading-[48px] mt-3"
            accessibilityRole="header"
            // @ts-expect-error
            aria-level={2}
          >
            Meet Maria.
          </Text>
          <View
            className="h-[1px] bg-ink/20 mt-6 mb-6 w-16"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text className="text-ink-2 font-body text-base leading-7">
            Maria is a Master Instructor with The Pilates Course and the
            founder of Honey Pilates. She built the studio around three
            ideas: precision, elegance, and transformation. Every class is
            small. Every cue is intentional.
          </Text>
          <Text className="text-ink-2 font-body text-base leading-7 mt-4">
            She trains in the contemporary reformer tradition with deep
            roots in classical mat work — and she believes the best class
            you ever take is the one where you finally hear your own body.
          </Text>

          <View className="flex-row flex-wrap gap-3 mt-7">
            <Link href="/schedule" asChild>
              <Pressable
                className="bg-ink px-7 py-4 active:opacity-80"
                accessibilityRole="link"
                accessibilityLabel="Book a class with Maria or another instructor"
              >
                <Text className="text-cream font-bodyBold tracking-[0.18em] uppercase text-xs">
                  Book with Maria
                </Text>
              </Pressable>
            </Link>
            <Link href="/membership" asChild>
              <Pressable
                className="border border-ink px-7 py-4 active:bg-ink/5"
                accessibilityRole="link"
                accessibilityLabel="View 1:1 training options"
              >
                <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs">
                  Private sessions
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
