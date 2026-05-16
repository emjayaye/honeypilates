import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 4 fills this with class packages + monthly memberships,
// in-app Stripe checkout, and remaining-credit display.
export default function MembershipScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-10">
        <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          Studio
        </Text>
        <Text
          className="text-ink text-[36px] font-display mt-3 leading-[40px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Membership
        </Text>
        <View
          className="h-[1px] bg-ink/15 mt-6 mb-5 w-16"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text className="text-ink-2 font-body leading-7 max-w-[34ch]">
          Coming next: 5-pack, 10-pack, monthly unlimited, and our intro-month
          special — paid in-app via Stripe.
        </Text>
      </View>
    </SafeAreaView>
  );
}
