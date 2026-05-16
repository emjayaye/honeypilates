import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Honey Pilates — landing.
// Visual language pulled from honeypilates.com: cream background,
// peach accent, ink-on-cream copy, Fahkwang display, DM Sans body.
// Boutique-luxe boutique tone: precision, elegance, transformation.
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="pb-16">
        {/* Brand mark + tagline strip */}
        <View className="px-6 pt-4 pb-1">
          <Text className="text-ink text-xs tracking-[0.32em] uppercase font-bodyMd">
            Honey Pilates
          </Text>
        </View>

        {/* Hero */}
        <View className="px-6 pt-10 pb-12">
          <Text className="text-ink text-[44px] leading-[48px] font-display">
            Precision.{'\n'}Elegance.{'\n'}Transformation.
          </Text>
          <View className="h-[1px] bg-ink/15 mt-7 mb-5 w-16" />
          <Text className="text-sage text-base leading-7 font-body max-w-[28ch]">
            A luxury boutique Pilates studio for women in Patchogue & Sayville —
            small reformer + mat classes with real attention.
          </Text>
          <View className="flex-row gap-3 mt-7">
            <Link href="/schedule" asChild>
              <Pressable className="bg-ink px-7 py-3.5 active:opacity-80">
                <Text className="text-cream font-bodyBold tracking-[0.18em] uppercase text-xs">
                  Book a class
                </Text>
              </Pressable>
            </Link>
            <Link href="/membership" asChild>
              <Pressable className="border border-ink px-7 py-3.5 active:bg-ink/5">
                <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs">
                  Memberships
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Peach feature band — echoing the live site's section colorways */}
        <View className="bg-peach py-12 px-6">
          <Text className="text-ink text-[10px] tracking-[0.32em] uppercase font-bodyMd">
            Women's Group Classes
          </Text>
          <Text className="text-ink text-3xl font-display mt-3 leading-9">
            Strength, grace, and connection — on the reformer.
          </Text>
          <Text className="text-ink/80 mt-4 font-body leading-7">
            Eight reformers. One instructor. Sixty minutes of intentional movement
            for every body, from first-timer to seasoned practitioner.
          </Text>
          <Link href="/schedule" asChild>
            <Pressable className="self-start mt-5 active:opacity-70">
              <Text className="text-ink font-bodyBold tracking-[0.18em] uppercase text-xs underline">
                See the schedule →
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* On Demand teaser */}
        <View className="px-6 pt-12">
          <Text className="text-sage text-[10px] tracking-[0.32em] uppercase font-bodyMd">
            On Demand
          </Text>
          <Text className="text-ink text-3xl font-display mt-3 leading-9">
            Practice anywhere.{'\n'}Anytime.
          </Text>
          <Text className="text-sage mt-4 font-body leading-7">
            A curated library of mat flows + targeted programs, recorded by our
            studio instructors. Yours with any active membership.
          </Text>
        </View>

        {/* Lifestyle tagline */}
        <View className="px-6 pt-14">
          <Text className="text-ink text-2xl font-display italic leading-9">
            "Move slowly enough to listen. Move strongly enough to feel."
          </Text>
        </View>

        {/* Quick links */}
        <View className="px-6 pt-12 flex-row gap-3">
          <Link href="/schedule" asChild>
            <Pressable className="flex-1 bg-ink px-5 py-6 active:opacity-80">
              <Ionicons name="calendar-outline" size={20} color="#F1E8DD" />
              <Text className="text-cream font-display text-lg mt-3">
                This week
              </Text>
              <Text className="text-peach text-[10px] tracking-[0.28em] uppercase mt-1 font-bodyMd">
                Reservations
              </Text>
            </Pressable>
          </Link>
          <Link href="/membership" asChild>
            <Pressable className="flex-1 bg-peach-200 px-5 py-6 active:opacity-80">
              <Ionicons name="pricetag-outline" size={20} color="#1F1F1F" />
              <Text className="text-ink font-display text-lg mt-3">
                Membership
              </Text>
              <Text className="text-ink/70 text-[10px] tracking-[0.28em] uppercase mt-1 font-bodyMd">
                Packages & plans
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Footer line */}
        <View className="px-6 pt-16 pb-4">
          <Text className="text-sage text-[10px] tracking-[0.28em] uppercase font-bodyMd text-center">
            Patchogue · Sayville · honeypilates.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
