import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 3 fills this with a week-view calendar + reservation flow
// backed by Supabase. For now it's a brand-styled placeholder.
export default function ScheduleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-10">
        <Text className="text-sage text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          Studio
        </Text>
        <Text className="text-ink text-[36px] font-display mt-3 leading-[40px]">
          Schedule
        </Text>
        <View className="h-[1px] bg-ink/15 mt-6 mb-5 w-16" />
        <Text className="text-sage font-body leading-7 max-w-[34ch]">
          Coming next: every class this week, instructor, seats remaining,
          and one-tap reservation.
        </Text>
      </View>
    </SafeAreaView>
  );
}
