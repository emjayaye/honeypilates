import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

// Quiet global footer — single horizontal strip on cream with a
// hairline top rule. Boutique luxury sites don't shout a sitemap;
// they show wayfinding sparingly. Wraps to two rows on narrow
// viewports but stays tight either way.

const LINKS: { label: string; href: string }[] = [
  { label: 'Schedule',    href: '/schedule' },
  { label: 'Pricing',     href: '/membership' },
  { label: 'Instructors', href: '/instructors' },
  { label: 'Locations',   href: '/locations' },
  { label: 'FAQ',         href: '/faq' },
  { label: 'Contact',     href: '/contact' },
];

export function SiteFooter() {
  return (
    <View
      style={{
        backgroundColor: '#F1E8DD',
        borderTopColor: '#E8DCC9',
        borderTopWidth: 1,
        paddingVertical: 20,
        paddingHorizontal: 24,
      }}
      accessibilityRole={'contentinfo' as any}
      accessibilityLabel="Site footer"
    >
      <View
        style={{
          maxWidth: 1240,
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 18,
          rowGap: 12,
        }}
      >
        {/* Brand mark — tiny */}
        <View className="flex-row items-baseline gap-2">
          <Text className="text-ink font-display italic text-base">honey</Text>
          <Text className="text-ink-2 text-[9px] tracking-[0.4em] uppercase font-bodyMd">
            Pilates · NY
          </Text>
        </View>

        {/* Hairline dot separator */}
        <View
          style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(31,31,31,0.25)' }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />

        {/* Wayfinding links — tracked-out, tiny */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, flex: 1 }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href as any} asChild>
              <Pressable
                className="py-1 active:opacity-60"
                accessibilityRole="link"
                accessibilityLabel={l.label}
              >
                <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
                  {l.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>

        {/* Copyright — pushed right */}
        <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
          © Honey Pilates · {new Date().getFullYear()}
        </Text>
      </View>
    </View>
  );
}
