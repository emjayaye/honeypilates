import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 4 will list class packages + unlimited memberships, integrate
// with Stripe (mobile + web), and surface the user's remaining balance.
export default function MembershipScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-8">
        <Text className="text-honey-700 text-xs tracking-widest uppercase">
          Studio
        </Text>
        <Text className="text-walnut text-4xl font-serifBold mt-2">
          Membership
        </Text>
        <Text className="text-honey-800 italic mt-3 leading-6">
          Coming next: 5-pack, 10-pack, monthly unlimited, and our
          intro-month special — paid in-app via Stripe.
        </Text>
      </View>
    </SafeAreaView>
  );
}
