import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

// Quiet global footer — mounts on every page from the root layout.
// Boutique sites typically run a slim footer with key wayfinding
// + the legal one-liner; we mirror that here.
type Col = { eyebrow: string; links: { label: string; href: string }[] };

const COLS: Col[] = [
  {
    eyebrow: 'Studio',
    links: [
      { label: 'Schedule',  href: '/schedule' },
      { label: 'Pricing',   href: '/membership' },
      { label: 'Locations', href: '/locations' },
    ],
  },
  {
    eyebrow: 'Honey Pilates',
    links: [
      { label: 'Meet the team', href: '/instructors' },
      { label: 'FAQ',           href: '/faq' },
      { label: 'Contact',       href: '/contact' },
    ],
  },
  {
    eyebrow: 'Members',
    links: [
      { label: 'Member access', href: '/account' },
      { label: 'Studio waiver', href: '/waiver' },
    ],
  },
];

export function SiteFooter() {
  return (
    <View
      style={{
        backgroundColor: '#1F1F1F',
        borderTopColor: '#3a2f27',
        borderTopWidth: 1,
        paddingVertical: 56,
        paddingHorizontal: 24,
      }}
      accessibilityRole={'contentinfo' as any}
      accessibilityLabel="Site footer"
    >
      <View
        style={{
          maxWidth: 1180,
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 40,
          alignItems: 'flex-start',
        }}
      >
        {/* Brand mark */}
        <View style={{ flexGrow: 1, basis: 240, maxWidth: 320 } as any}>
          <Text className="text-cream font-display italic text-3xl leading-9">honey</Text>
          <Text className="text-peach text-[10px] tracking-[0.4em] uppercase font-bodyMd mt-1">
            Pilates · New York
          </Text>
          <Text className="text-cream/75 font-body text-sm leading-6 mt-5 max-w-[36ch]">
            A luxury boutique Pilates studio in Patchogue & Sayville.
            Reformer + mat for every body.
          </Text>
        </View>

        {/* Link columns */}
        {COLS.map((c) => (
          <View key={c.eyebrow} style={{ minWidth: 140 }}>
            <Text className="text-peach text-[10px] tracking-[0.32em] uppercase font-bodyMd">
              {c.eyebrow}
            </Text>
            <View className="mt-4 gap-3">
              {c.links.map((l) => (
                <Link key={l.href + l.label} href={l.href as any} asChild>
                  <Pressable
                    className="active:opacity-60"
                    accessibilityRole="link"
                    accessibilityLabel={l.label}
                  >
                    <Text className="text-cream/85 font-body text-[15px] leading-6">
                      {l.label}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Hairline rule + legal one-liner */}
      <View
        style={{
          maxWidth: 1180,
          width: '100%',
          alignSelf: 'center',
          marginTop: 48,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: 'rgba(241,232,221,0.12)',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text className="text-cream/55 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          © Honey Pilates LLC · {new Date().getFullYear()}
        </Text>
        <Text className="text-cream/55 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          honeypilates.com · 631 · 600 · 8724
        </Text>
      </View>
    </View>
  );
}
