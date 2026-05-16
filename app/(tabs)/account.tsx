import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 2 fills this with auth-aware UI: signed-out shows sign-in /
// sign-up; signed-in shows profile, upcoming bookings, waiver, prefs.
export default function AccountScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-10">
        <Text className="text-sage text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          You
        </Text>
        <Text className="text-ink text-[36px] font-display mt-3 leading-[40px]">
          Account
        </Text>
        <View className="h-[1px] bg-ink/15 mt-6 mb-5 w-16" />
        <Text className="text-sage font-body leading-7 max-w-[34ch]">
          Coming next: email + Apple/Google sign-in, your bookings, your
          waiver, and your studio profile.
        </Text>
      </View>
    </SafeAreaView>
  );
}
