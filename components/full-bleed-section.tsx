import React from 'react';
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';

type CTA = { label: string; href: string };

type Props = {
  image: string;
  alt: string;
  eyebrow?: string;
  title: string;
  body?: string;
  ctas?: CTA[];
  /** Where text overlays sit. Default center. */
  align?: 'start' | 'center' | 'end';
  /** Dark scrim opacity 0..1. Default 0.35. */
  scrim?: number;
  /** Heading level for screen readers. Default 2 (1 for the page hero). */
  level?: 1 | 2 | 3;
  /** Footer/banner sections may want a fixed height instead of full viewport. */
  heightOverride?: number;
};

// A single full-viewport section with a full-bleed image, dark scrim,
// and overlaid copy. CSS `scroll-snap-align` keeps it locked to the
// snap container on web; native uses ScrollView pagingEnabled (set on
// the parent). Honors prefers-reduced-motion via global.css (no
// inline animations — the Ken Burns effect lives in CSS too).
export function FullBleedSection({
  image,
  alt,
  eyebrow,
  title,
  body,
  ctas,
  align = 'center',
  scrim = 0.35,
  level = 2,
  heightOverride,
}: Props) {
  const { height } = useWindowDimensions();
  const sectionHeight = heightOverride ?? Math.max(height - 60, 560);

  const justify =
    align === 'start' ? 'flex-start'
    : align === 'end' ? 'flex-end'
    : 'center';

  return (
    <View
      // @ts-expect-error CSS-only style for web scroll-snap target
      style={{ height: sectionHeight, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      accessibilityRole={Platform.OS === 'web' ? ('region' as any) : undefined}
      accessibilityLabel={title}
    >
      <ImageBackground
        source={{ uri: image }}
        style={{ flex: 1, justifyContent: justify }}
        // @ts-expect-error CSS-only Ken Burns — subtle zoom; reduced-motion override in global.css
        imageStyle={{ animationName: 'honeyKenBurns', animationDuration: '24s', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' }}
        accessible={false}
        accessibilityLabel={alt}
      >
        {/* Dark scrim for legibility */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: `rgba(31,31,31,${scrim})`,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />

        {/* Content column */}
        <View
          className="px-7 py-12"
          style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}
        >
          {eyebrow ? (
            <Text className="text-cream/90 text-[11px] tracking-[0.32em] uppercase font-bodyMd">
              {eyebrow}
            </Text>
          ) : null}

          <Text
            className="text-cream font-display text-[44px] leading-[50px] mt-3"
            accessibilityRole="header"
            // @ts-expect-error aria-level is a valid web role attr
            aria-level={level}
          >
            {title}
          </Text>

          {body ? (
            <Text className="text-cream/95 font-body text-base leading-7 mt-5 max-w-[40ch]">
              {body}
            </Text>
          ) : null}

          {ctas && ctas.length > 0 ? (
            <View className="flex-row flex-wrap gap-3 mt-7">
              {ctas.map((c, i) => (
                <Link key={c.href + c.label} href={c.href as any} asChild>
                  <Pressable
                    className={
                      i === 0
                        ? 'bg-cream px-7 py-4 active:opacity-80'
                        : 'border border-cream px-7 py-4 active:bg-cream/10'
                    }
                    accessibilityRole="link"
                    accessibilityLabel={c.label}
                  >
                    <Text
                      className={
                        (i === 0 ? 'text-ink ' : 'text-cream ') +
                        'font-bodyBold tracking-[0.18em] uppercase text-xs'
                      }
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  );
}
