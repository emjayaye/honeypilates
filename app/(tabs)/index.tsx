import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Honey Pilates — landing screen.
// Marketing-first: brand, value props, CTAs into the schedule + membership.
// After auth lands in Phase 2, this will also surface the user's upcoming
// class + remaining package balance above the fold.
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="pb-12">
        {/* Hero */}
        <View className="px-6 pt-8 pb-12 bg-honey-100">
          <Text className="text-honey-700 text-xs tracking-widest uppercase">
            Welcome to
          </Text>
          <Text className="text-walnut text-5xl font-serifBold mt-2">
            Honey{'\n'}Pilates
          </Text>
          <Text className="text-honey-800 text-base italic mt-4 leading-6">
            Slow, intentional movement. Warm community.{'\n'}Reformer + mat
            classes for every body.
          </Text>
          <Link href="/schedule" asChild>
            <Pressable className="bg-honey-500 mt-6 self-start px-6 py-3 rounded-full active:bg-honey-600">
              <Text className="text-cream font-sansBold tracking-wide">
                Book a class →
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Value props */}
        <View className="px-6 mt-10">
          <Text className="text-honey-700 text-xs tracking-widest uppercase">
            What you'll find here
          </Text>
          <View className="mt-4 gap-3">
            {[
              {
                icon: 'leaf-outline',
                title: 'Small, focused classes',
                body: 'Max 8 reformers. Real attention from your instructor.',
              },
              {
                icon: 'heart-outline',
                title: 'Beginner-friendly',
                body: 'Start where you are. We meet you on the mat.',
              },
              {
                icon: 'calendar-outline',
                title: 'Easy booking',
                body: 'Reserve a class, hold your spot, get a reminder.',
              },
            ].map((v) => (
              <View
                key={v.title}
                className="flex-row items-start gap-4 bg-white/60 rounded-2xl p-4 border border-honey-200"
              >
                <View className="w-10 h-10 rounded-full bg-honey-100 items-center justify-center">
                  <Ionicons name={v.icon as any} size={20} color="#8B581A" />
                </View>
                <View className="flex-1">
                  <Text className="text-walnut font-sansBold text-base">
                    {v.title}
                  </Text>
                  <Text className="text-honey-800 text-sm mt-1 leading-5">
                    {v.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Studio promise */}
        <View className="px-6 mt-12">
          <Text className="text-honey-700 text-xs tracking-widest uppercase">
            Our promise
          </Text>
          <Text className="text-walnut text-2xl font-serif italic mt-3 leading-8">
            "Move slowly enough to listen. Move strongly enough to feel."
          </Text>
        </View>

        {/* Quick links */}
        <View className="px-6 mt-12 flex-row gap-3">
          <Link href="/schedule" asChild>
            <Pressable className="flex-1 bg-walnut rounded-2xl px-4 py-5 active:opacity-80">
              <Ionicons name="calendar" size={22} color="#FAF5EA" />
              <Text className="text-cream font-sansBold mt-2">This week</Text>
              <Text className="text-honey-300 text-xs mt-1">
                See the schedule
              </Text>
            </Pressable>
          </Link>
          <Link href="/membership" asChild>
            <Pressable className="flex-1 bg-honey-600 rounded-2xl px-4 py-5 active:opacity-80">
              <Ionicons name="card" size={22} color="#FAF5EA" />
              <Text className="text-cream font-sansBold mt-2">Memberships</Text>
              <Text className="text-honey-200 text-xs mt-1">
                Packages + plans
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
