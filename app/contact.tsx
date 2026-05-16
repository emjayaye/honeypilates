import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

const Eyebrow = ({ children }: { children: string }) => (
  <Text className="text-ink-2 text-[10px] tracking-[0.36em] uppercase font-bodyMd">{children}</Text>
);
const HairlineRule = () => (
  <View
    style={{ height: 1, width: 56, backgroundColor: '#EBC3A1', marginTop: 18, marginBottom: 22 }}
    accessibilityElementsHidden importantForAccessibility="no"
  />
);

const TOPICS = ['General question', 'New member', 'Private session', 'Press / partnership', 'Other'];
const LOCATIONS = [
  { value: 'patchogue', label: 'Patchogue' },
  { value: 'sayville', label: 'Sayville' },
  { value: '', label: 'Either / no preference' },
];

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in name, email, and message.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: name.trim(),
        email: email.trim(),
        topic,
        preferred_location: location || null,
        message: message.trim(),
        source_page: 'contact',
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not send. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="bg-cream pb-24">
      <View
        className="pt-10"
        style={{ maxWidth: 760, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }}
      >
        <Eyebrow>Studio</Eyebrow>
        <Text
          className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          Say hello.
        </Text>
        <HairlineRule />
        <Text className="text-ink-2 font-body text-[15px] leading-7">
          Questions, private session inquiries, press — we'll get back to you within
          one business day. For quick replies, text us at <Text className="text-ink font-bodyMd">631-600-8724</Text>.
        </Text>

        {done ? (
          <View
            className="mt-10 p-7"
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBC3A1', borderRadius: 2 }}
          >
            <Text className="text-ink font-display italic text-2xl leading-7">Thank you.</Text>
            <Text className="text-ink-2 font-body text-[15px] leading-7 mt-3">
              Your note is on the way to the studio. We'll be in touch shortly.
            </Text>
          </View>
        ) : (
          <View className="mt-10 gap-5">
            <Field label="Your name" value={name} onChange={setName} autoComplete="name" placeholder="First Last" />
            <Field label="Email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" keyboardType="email-address" />

            <View>
              <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">
                Topic
              </Text>
              <ChipRow value={topic} onChange={setTopic} options={TOPICS.map((t) => ({ value: t, label: t }))} />
            </View>

            <View>
              <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">
                Preferred location
              </Text>
              <ChipRow value={location} onChange={setLocation} options={LOCATIONS} />
            </View>

            <View>
              <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">
                Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="What can we help with?"
                placeholderTextColor="#A89E89"
                multiline
                numberOfLines={6}
                accessibilityLabel="Message"
                className="text-ink font-body text-base"
                style={{
                  borderWidth: 1, borderColor: '#E8DCC9',
                  padding: 12, minHeight: 140, textAlignVertical: 'top',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>

            {error && (
              <Text className="text-[#8a2026] font-body text-sm" accessibilityLiveRegion="polite">{error}</Text>
            )}

            <Pressable
              onPress={submit}
              disabled={busy}
              className="bg-ink px-7 py-4 mt-2 self-start active:opacity-80"
              style={busy ? { opacity: 0.5 } : undefined}
              accessibilityRole="button"
              accessibilityLabel="Send your message to the studio"
            >
              {busy ? (
                <ActivityIndicator color="#F1E8DD" />
              ) : (
                <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                  Send message
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, autoComplete, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: any;
  keyboardType?: any;
}) {
  return (
    <View>
      <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A89E89"
        autoCapitalize="none"
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        className="text-ink font-body text-base"
        style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9', paddingVertical: 10 }}
      />
    </View>
  );
}

function ChipRow({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value || 'none'}
            onPress={() => onChange(o.value)}
            className="px-3 py-2 active:opacity-60"
            style={{ borderWidth: 1, borderColor: active ? '#1F1F1F' : '#E8DCC9' }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            <Text className={(active ? 'text-ink ' : 'text-ink-2 ') + 'font-bodyMd text-[11px] tracking-[0.12em]'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
