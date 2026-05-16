import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';

// Schedule — public, but reserve actions require auth. The list runs
// off RLS-allowed reads of class_sessions joined to class_types,
// instructors, locations. Each row is its own bookable unit.

type Session = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  cancelled_at: string | null;
  class_type: { name: string; duration_min: number; level: string };
  instructor: { preferred_name: string | null; full_name: string | null } | null;
  location: { id: string; name: string };
  booked_count?: number;
  my_reservation?: { id: string; status: string } | null;
};

const Eyebrow = ({ children }: { children: string }) => (
  <Text className="text-ink-2 text-[10px] tracking-[0.36em] uppercase font-bodyMd">{children}</Text>
);
const HairlineRule = () => (
  <View
    style={{ height: 1, width: 56, backgroundColor: '#EBC3A1', marginTop: 18, marginBottom: 22 }}
    accessibilityElementsHidden
    importantForAccessibility="no"
  />
);

export default function ScheduleScreen() {
  const router = useRouter();
  const { session: auth } = useAuth();
  const userId = auth?.user.id ?? null;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // 14-day window ahead. Future-only.
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`id, starts_at, ends_at, capacity, cancelled_at,
               class_type:class_types(name,duration_min,level),
               instructor:members(preferred_name, full_name),
               location:studio_locations(id,name)`)
      .gte('starts_at', from)
      .lte('starts_at', to)
      .is('cancelled_at', null)
      .order('starts_at', { ascending: true });
    if (error) {
      console.error('[schedule] load failed', error);
      setSessions([]);
      setLoading(false);
      return;
    }
    const raw = (data ?? []) as unknown as Session[];

    // Fan out booked-counts + my reservation lookups (RLS protects each).
    const ids = raw.map((s) => s.id);
    const [{ data: countsByGroup }, { data: mine }] = await Promise.all([
      ids.length
        ? supabase.from('reservations').select('class_session_id').in('class_session_id', ids).eq('status', 'booked')
        : Promise.resolve({ data: [] as any[] }),
      userId && ids.length
        ? supabase.from('reservations').select('id,status,class_session_id').in('class_session_id', ids).eq('member_id', userId)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const bookedMap = new Map<string, number>();
    for (const r of (countsByGroup ?? []) as any[]) {
      bookedMap.set(r.class_session_id, (bookedMap.get(r.class_session_id) ?? 0) + 1);
    }
    const mineMap = new Map<string, { id: string; status: string }>();
    for (const r of (mine ?? []) as any[]) {
      if (r.status === 'booked' || r.status === 'waitlist') {
        mineMap.set(r.class_session_id, { id: r.id, status: r.status });
      }
    }
    setSessions(raw.map((s) => ({
      ...s,
      booked_count: bookedMap.get(s.id) ?? 0,
      my_reservation: mineMap.get(s.id) ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  // Group by day so the rendered list reads like an editorial calendar.
  const grouped = useMemo(() => {
    const days = new Map<string, Session[]>();
    for (const s of sessions) {
      const key = new Date(s.starts_at).toDateString();
      const arr = days.get(key) ?? [];
      arr.push(s);
      days.set(key, arr);
    }
    return Array.from(days.entries());
  }, [sessions]);

  const reserve = async (sessionId: string) => {
    if (!userId) {
      setFlash({ kind: 'err', text: 'Sign in to reserve a class.' });
      return;
    }
    setBusyId(sessionId);
    try {
      const { data, error } = await supabase.rpc('reserve_class', { p_session_id: sessionId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setFlash({
        kind: 'ok',
        text: row?.status === 'waitlist' ? "Class is full — you're on the waitlist." : 'Reserved.',
      });
      await load();
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('waiver_required')) {
        // Send the member straight to the waiver screen rather than
        // showing a cryptic error.
        setFlash({ kind: 'ok', text: 'One moment — opening the studio waiver.' });
        setTimeout(() => router.push('/waiver'), 400);
      } else {
        setFlash({ kind: 'err', text: msg || 'Could not reserve.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (reservationId: string) => {
    setBusyId(reservationId);
    try {
      const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: reservationId });
      if (error) throw error;
      setFlash({ kind: 'ok', text: 'Reservation cancelled.' });
      await load();
    } catch (e: any) {
      setFlash({ kind: 'err', text: e?.message ?? 'Could not cancel.' });
    } finally {
      setBusyId(null);
    }
  };

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
          Schedule.
        </Text>
        <HairlineRule />
        <Text className="text-ink-2 font-body text-[15px] leading-7">
          Two weeks of reformer + mat classes across our Patchogue and Sayville studios.
          {userId ? ' Reserve in one tap.' : ' Sign in to reserve a seat.'}
        </Text>

        {/* Flash */}
        {flash && (
          <View
            className="mt-6 p-4"
            style={{
              backgroundColor: flash.kind === 'ok' ? '#FAEEE3' : '#FBE2E0',
              borderWidth: 1,
              borderColor: flash.kind === 'ok' ? '#EBC3A1' : '#D88883',
              borderRadius: 2,
            }}
            accessibilityLiveRegion="polite"
          >
            <Text className="text-ink font-body text-sm">{flash.text}</Text>
          </View>
        )}

        {/* List */}
        <View className="mt-10">
          {loading ? (
            <ActivityIndicator color="#1F1F1F" />
          ) : grouped.length === 0 ? (
            <EmptySchedule isSignedIn={!!userId} />
          ) : (
            grouped.map(([day, items]) => (
              <View key={day} className="mb-10">
                <Eyebrow>{day}</Eyebrow>
                <HairlineRule />
                <View className="gap-3">
                  {items.map((s) => (
                    <SessionRow
                      key={s.id}
                      s={s}
                      isSignedIn={!!userId}
                      busy={busyId === s.id || (s.my_reservation?.id ? busyId === s.my_reservation.id : false)}
                      onReserve={() => reserve(s.id)}
                      onCancel={() => s.my_reservation && cancel(s.my_reservation.id)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function EmptySchedule({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <View
      className="p-7"
      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2 }}
    >
      <Text className="text-ink font-display italic text-2xl leading-7">
        No classes on the schedule yet.
      </Text>
      <Text className="text-ink-2 font-body text-sm leading-6 mt-3">
        {isSignedIn
          ? 'Check back soon — the studio is putting next week’s sessions on the calendar.'
          : 'Once the studio publishes upcoming classes, they will appear here. Sign in to reserve.'}
      </Text>
    </View>
  );
}

function SessionRow({
  s, isSignedIn, busy, onReserve, onCancel,
}: {
  s: Session;
  isSignedIn: boolean;
  busy: boolean;
  onReserve: () => void;
  onCancel: () => void;
}) {
  const time = new Date(s.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const instructor = s.instructor?.preferred_name ?? s.instructor?.full_name ?? 'staff';
  const seatsLeft = Math.max(0, (s.capacity ?? 0) - (s.booked_count ?? 0));
  const isFull = seatsLeft === 0;
  const myStatus = s.my_reservation?.status;

  return (
    <View
      className="p-6"
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: myStatus ? '#EBC3A1' : '#E8DCC9',
        borderRadius: 2,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <View style={{ minWidth: 92 }}>
        <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
          {time}
        </Text>
        <Text className="text-ink font-display italic text-[28px] mt-1 leading-8">
          {s.class_type.duration_min}<Text className="text-ink-2 font-body text-base"> min</Text>
        </Text>
      </View>
      <View className="grow basis-[220px]" style={{ minWidth: 0 }}>
        <Text className="text-ink font-display italic text-2xl leading-7">
          {s.class_type.name}
        </Text>
        <Text className="text-ink-2 font-body text-sm leading-6 mt-1">
          With {instructor} · {s.location.name} · {s.class_type.level}
        </Text>
        <View className="flex-row items-center gap-3 mt-3 flex-wrap">
          <View className="flex-row items-center gap-1.5">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isFull ? '#777C75' : '#5C6E4F' }} />
            <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd">
              {isFull ? 'Full' : `${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`}
            </Text>
          </View>
          {myStatus && (
            <Text className="text-peach-700 text-[10px] tracking-[0.28em] uppercase font-bodyBold">
              {myStatus === 'booked' ? '· You are booked' : '· You are on the waitlist'}
            </Text>
          )}
        </View>
      </View>
      <View>
        {!isSignedIn ? (
          <Link href="/account" asChild>
            <Pressable
              className="border border-ink px-6 py-3 active:bg-ink/5"
              accessibilityRole="link"
              accessibilityLabel="Sign in to reserve"
            >
              <Text className="text-ink font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                Sign in
              </Text>
            </Pressable>
          </Link>
        ) : myStatus ? (
          <Pressable
            onPress={onCancel}
            disabled={busy}
            className="border border-ink-2 px-6 py-3 active:bg-ink/5"
            style={busy ? { opacity: 0.5 } : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Cancel reservation for ${s.class_type.name} at ${time}`}
          >
            <Text className="text-ink-2 font-bodyBold tracking-[0.22em] uppercase text-[11px]">
              {busy ? '…' : 'Cancel'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onReserve}
            disabled={busy}
            className="bg-ink px-6 py-3 active:opacity-80"
            style={busy ? { opacity: 0.5 } : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Reserve ${s.class_type.name} at ${time}${isFull ? ' (waitlist)' : ''}`}
          >
            <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">
              {busy ? '…' : isFull ? 'Waitlist' : 'Reserve'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
