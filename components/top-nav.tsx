import React from 'react';
import { View, Text, Pressable, Image, Platform } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';

const LOGO = require('@/assets/images/logo.webp');

// Pull the most personable name we can from the Supabase session:
// preferred -> first name -> email handle. Returns null if no session.
function displayNameFor(session: ReturnType<typeof useAuth>['session']): string | null {
  if (!session?.user) return null;
  const meta = (session.user.user_metadata ?? {}) as Record<string, any>;
  const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
  if (full) return full.split(' ')[0];
  const email = session.user.email ?? '';
  return email.includes('@') ? email.split('@')[0] : email || null;
}

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
];

export function TopNav() {
  const pathname = usePathname();
  const { session } = useAuth();
  const displayName = displayNameFor(session);

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
        {/* Logo — Honey Pilates New York wordmark. Kept tall enough
            (56px) so the "NEW YORK" tagline below the script remains
            readable. The Image is decorative; the Link's
            accessibilityLabel carries the meaning for screen readers. */}
        <Link href="/" asChild>
          <Pressable
            className="active:opacity-70"
            accessibilityRole="link"
            accessibilityLabel="Honey Pilates New York — home"
            hitSlop={8}
          >
            <Image
              source={LOGO}
              style={{ height: 56, width: 92, resizeMode: 'contain' }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        </Link>

        {/* Nav links + standout Member Access CTA */}
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

          {/* CTA toggles on session.
              - Signed out: filled ink "Member Access" pill.
              - Signed in: filled ink pill with a small peach dot +
                first name, links to /account. The dot reads as
                "you're signed in" and matches the rest of the
                cream/peach/ink palette. */}
          <Link href="/account" asChild>
            <Pressable
              className="bg-ink px-5 py-3 ml-3 active:opacity-80 flex-row items-center gap-2"
              accessibilityRole="link"
              accessibilityLabel={
                displayName
                  ? `Signed in as ${displayName}. Open your account.`
                  : 'Member access — sign in or view your account'
              }
              hitSlop={4}
            >
              {displayName ? (
                <>
                  <View
                    className="bg-peach"
                    style={{ width: 7, height: 7, borderRadius: 99 }}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text className="text-cream font-bodyBold text-[11px] tracking-[0.22em] uppercase">
                    {displayName}
                  </Text>
                </>
              ) : (
                <Text className="text-cream font-bodyBold text-[11px] tracking-[0.28em] uppercase">
                  Member Access
                </Text>
              )}
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
