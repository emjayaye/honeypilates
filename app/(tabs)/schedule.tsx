import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 3 will fill this in with a real class calendar + reservation flow
// backed by Supabase. For now it's a placeholder so the tab resolves.
export default function ScheduleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-6 pt-8">
        <Text className="text-honey-700 text-xs tracking-widest uppercase">
          Studio
        </Text>
        <Text className="text-walnut text-4xl font-serifBold mt-2">
          Schedule
        </Text>
        <Text className="text-honey-800 italic mt-3 leading-6">
          Coming next: a week-view of every class, instructor, and seat
          left, with one-tap reservation.
        </Text>
      </View>
    </SafeAreaView>
  );
}
