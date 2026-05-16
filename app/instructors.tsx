import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';

// Meet-the-Team page. Pulls public.members where role in
// (instructor, admin) so the owner shows up alongside staff. The
// notes_for_studio field doubles as the public bio for now — admin
// editor (Phase 7) will let the owner curate this separately.

type Staff = {
  id: string;
  preferred_name: string | null;
  full_name: string | null;
  role: 'instructor' | 'admin' | 'member';
  notes_for_studio: string | null;
  joined_at: string;
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

export default function InstructorsScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    (async () => {
      // RLS: members are normally self-only readable. The owner /
      // instructors are surfaced via the admin policy, which won't
      // fire for anonymous visitors. For a public team page we want
      // ALL visitors to see staff, so this query relies on a
      // dedicated public.is_published_staff() function — but for
      // v1 we fall back to whatever the current viewer can see.
      // When visitors are signed in as members, RLS blocks staff
      // rows other than theirs and the page falls to the empty
      // state. A follow-up migration will add a permissive
      // "anyone reads instructor profiles" policy.
      const { data } = await supabase
        .from('members')
        .select('id, preferred_name, full_name, role, notes_for_studio, joined_at')
        .in('role', ['instructor', 'admin'])
        .order('joined_at', { ascending: true });
      setStaff((data ?? []) as Staff[]);
    })();
  }, []);

  return (
    <ScrollView contentContainerClassName="bg-cream pb-24">
      <View
        className="pt-10"
        style={{ maxWidth: 1100, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}
      >
        <Eyebrow>Studio</Eyebrow>
        <Text
          className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Meet the team.
        </Text>
        <HairlineRule />
        <Text className="text-ink-2 font-body text-[15px] leading-7 max-w-[60ch]">
          Honey Pilates is small on purpose. Each instructor cues from years on the
          reformer and trains the way you train — slowly enough to listen, strongly
          enough to feel.
        </Text>

        <View
          className="mt-12"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}
        >
          {staff.map((s) => {
            const name = s.preferred_name ?? s.full_name ?? 'Studio staff';
            const initials = (name.split(' ').map((p) => p[0]).join('').slice(0, 2) || '·').toUpperCase();
            return (
              <View
                key={s.id}
                className="p-8 grow basis-[300px]"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8DCC9',
                  borderRadius: 2,
                }}
              >
                {/* Portrait stand-in — peach-bordered initials circle.
                    Real photos drop in via the admin editor later. */}
                <View
                  className="items-center justify-center mb-6"
                  style={{
                    width: 96, height: 96, borderRadius: 48,
                    borderWidth: 1, borderColor: '#EBC3A1',
                    backgroundColor: 'rgba(235,195,161,0.18)',
                  }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  <Text className="text-ink font-display italic text-3xl">{initials}</Text>
                </View>
                <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
                  {s.role === 'admin' ? 'Founder · Instructor' : 'Instructor'}
                </Text>
                <Text className="text-ink font-display italic text-3xl mt-2 leading-9">
                  {name}
                </Text>
                {s.notes_for_studio && (
                  <Text className="text-ink-2 font-body text-[15px] leading-7 mt-4">
                    {s.notes_for_studio}
                  </Text>
                )}
              </View>
            );
          })}

          {staff.length === 0 && (
            <View
              className="p-7 grow"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1, borderStyle: 'dashed',
                borderColor: '#E8DCC9', borderRadius: 2,
              }}
            >
              <Text className="text-ink-2 font-body italic text-sm">
                Instructor profiles will appear here once the studio publishes them.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
