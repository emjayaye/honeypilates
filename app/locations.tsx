import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

// Locations — reads studio_locations from the DB so addresses stay
// in one place. Falls back to hard-coded copy if the table is empty
// during early dev.

type Loc = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  hours: any | null;
};

const Eyebrow = ({ children }: { children: string }) => (
  <Text className="text-ink-2 text-[10px] tracking-[0.36em] uppercase font-bodyMd">{children}</Text>
);
const HairlineRule = () => (
  <View
    style={{ height: 1, width: 56, backgroundColor: '#EBC3A1', marginTop: 18, marginBottom: 22 }}
    accessibilityElementsHidden importantForAccessibility="no"
  />
);

const DEFAULT_HOURS = [
  { d: 'Mon – Fri', h: '6:00 a — 8:30 p' },
  { d: 'Saturday',  h: '7:00 a — 4:00 p' },
  { d: 'Sunday',    h: '8:00 a — 2:00 p' },
];

export default function LocationsScreen() {
  const [locs, setLocs] = useState<Loc[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('studio_locations')
        .select('id,slug,name,address,phone,hours')
        .eq('is_active', true)
        .order('name');
      setLocs((data ?? []) as Loc[]);
    })();
  }, []);

  return (
    <ScrollView contentContainerClassName="bg-cream pb-24">
      <View
        className="pt-10"
        style={{ maxWidth: 1100, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}
      >
        <Eyebrow>Visit</Eyebrow>
        <Text
          className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Two studios. South shore.
        </Text>
        <HairlineRule />
        <Text className="text-ink-2 font-body text-[15px] leading-7 max-w-[60ch]">
          Both locations carry the same equipment, the same instructors, and the same
          quiet rhythm. Pick whichever's closer — or both.
        </Text>

        <View
          className="mt-12"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}
        >
          {locs.map((l) => (
            <View
              key={l.id}
              className="p-8 grow basis-[320px]"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E8DCC9',
                borderRadius: 2,
              }}
            >
              <Eyebrow>Studio</Eyebrow>
              <Text className="text-ink font-display italic text-3xl mt-3 leading-9">
                {l.name}
              </Text>
              <HairlineRule />

              {l.address && (
                <View className="flex-row items-start gap-3 mb-4">
                  <Ionicons name="location-outline" size={16} color="#777C75" accessibilityElementsHidden importantForAccessibility="no" />
                  <Text className="text-ink-2 font-body text-[15px] leading-7 flex-1">{l.address}</Text>
                </View>
              )}

              {l.phone && (
                <View className="flex-row items-start gap-3 mb-4">
                  <Ionicons name="call-outline" size={16} color="#777C75" accessibilityElementsHidden importantForAccessibility="no" />
                  <Text className="text-ink-2 font-body text-[15px] leading-7 flex-1">{l.phone}</Text>
                </View>
              )}

              <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mt-3">
                Studio hours
              </Text>
              <View className="mt-2 gap-1">
                {DEFAULT_HOURS.map((h) => (
                  <View key={h.d} className="flex-row justify-between">
                    <Text className="text-ink-2 font-body text-sm">{h.d}</Text>
                    <Text className="text-ink font-body text-sm">{h.h}</Text>
                  </View>
                ))}
              </View>

              <View className="mt-7">
                <Link href="/schedule" asChild>
                  <Pressable
                    className="bg-ink px-6 py-3 self-start active:opacity-80"
                    accessibilityRole="link"
                    accessibilityLabel={`See schedule for ${l.name}`}
                  >
                    <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                      See schedule
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          ))}

          {locs.length === 0 && (
            <View
              className="p-7 grow"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderStyle: 'dashed', borderColor: '#E8DCC9', borderRadius: 2 }}
            >
              <Text className="text-ink-2 font-body italic text-sm">
                Locations will appear here once the studio publishes them.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
