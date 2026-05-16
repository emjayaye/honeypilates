import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Global top navigation. Logo wordmark on the left, route links on
// the right. Active route gets an underline + ink color; inactive
// routes use the secondary ink-2 token. On narrow viewports the link
// row scrolls horizontally rather than wrapping, so the logo stays
// pinned left and tap targets stay comfortable.
type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: '/',           label: 'Home' },
  { href: '/schedule',   label: 'Schedule' },
  { href: '/membership', label: 'Pricing' },
  { href: '/account',    label: 'Account' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <SafeAreaView
      edges={['top']}
      className="bg-cream"
      style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9' }}
    >
      <View
        accessibilityRole={Platform.OS === 'web' ? ('navigation' as any) : undefined}
        accessibilityLabel="Primary navigation"
        className="flex-row items-center justify-between px-5 py-3"
        style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}
      >
        {/* Logo — text wordmark for now. Swap for an SVG or PNG when
            the studio's mark is finalized; keep the Link wrapper so
            it routes home from every page. */}
        <Link href="/" asChild>
          <Pressable
            className="active:opacity-70"
            accessibilityRole="link"
            accessibilityLabel="Honey Pilates — home"
            hitSlop={8}
          >
            <View className="flex-row items-baseline">
              <Text
                className="text-ink font-display text-xl tracking-tight"
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                honey
              </Text>
              <Text
                className="text-ink-2 font-bodyMd text-[11px] tracking-[0.32em] uppercase ml-2"
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                pilates
              </Text>
            </View>
          </Pressable>
        </Link>

        {/* Nav links */}
        <View className="flex-row items-center gap-1">
          {NAV.map((n) => {
            const active =
              n.href === '/'
                ? pathname === '/' || pathname === '/index'
                : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href as any} asChild>
                <Pressable
                  className="px-3 py-3 active:opacity-60"
                  accessibilityRole="link"
                  accessibilityLabel={n.label}
                  accessibilityState={{ selected: active }}
                  // @ts-expect-error web-only ARIA forwarding for current page
                  aria-current={active ? 'page' : undefined}
                  hitSlop={4}
                >
                  <Text
                    className={
                      (active ? 'text-ink ' : 'text-ink-2 ') +
                      'font-bodyMd text-[11px] tracking-[0.28em] uppercase'
                    }
                    style={
                      active
                        ? {
                            textDecorationLine: 'underline',
                            textDecorationColor: '#1F1F1F',
                            // @ts-expect-error textUnderlineOffset is web-only
                            textUnderlineOffset: 6,
                          }
                        : undefined
                    }
                  >
                    {n.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
