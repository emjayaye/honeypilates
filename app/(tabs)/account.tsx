import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 2 will replace this with auth-aware UI: signed-out shows
// sign-in / sign-up; signed-in shows profile, upcoming bookings,
// waiver status, push prefs, etc.
export default function AccountScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-8">
        <Text className="text-honey-700 text-xs tracking-widest uppercase">
          You
        </Text>
        <Text className="text-walnut text-4xl font-serifBold mt-2">
          Account
        </Text>
        <Text className="text-honey-800 italic mt-3 leading-6">
          Coming next: email + Apple/Google sign-in, your bookings,
          your waiver, and your studio profile.
        </Text>
      </View>
    </SafeAreaView>
  );
}
