import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

// Email-password auth screen. Tab between "Sign in" and "Create account".
// Supabase Auth handles both — sign-up auto-creates the auth.users row,
// the existing tg_create_member_on_signup() trigger creates the
// public.members profile, and tg_promote_owner_and_seed() promotes
// mjalfino@gmail.com to admin with a demo plan + 10-pack.
//
// Email confirmation is on by default in the Supabase dashboard. The
// success message tells users to check their inbox. To skip the email
// step during testing: Supabase Dashboard -> Authentication -> Settings
// -> User Signups -> uncheck "Confirm email".
type Mode = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange in AuthProvider takes it from here.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || null } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo('Check your email to confirm your account, then sign in.');
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      className="px-6 pt-12 pb-16 bg-cream"
      style={{ maxWidth: 460, alignSelf: 'center', width: '100%' }}
    >
      <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
        Member Access
      </Text>
      <Text
        className="text-ink font-display text-[36px] mt-3 leading-[40px]"
        accessibilityRole="header"
        // @ts-expect-error
        aria-level={1}
      >
        {mode === 'sign-in' ? 'Welcome back.' : 'Create your account.'}
      </Text>
      <View
        className="h-[1px] bg-ink/15 mt-6 mb-6 w-16"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      {/* Mode toggle */}
      <View
        className="flex-row gap-2 mb-8"
        accessibilityRole={'tablist' as any}
        accessibilityLabel="Authentication mode"
      >
        {(['sign-in', 'sign-up'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => { setMode(m); setError(null); setInfo(null); }}
            className={'px-4 py-2 ' + (mode === m ? 'border-b-2 border-ink' : 'border-b-2 border-transparent')}
            accessibilityRole={'tab' as any}
            accessibilityState={{ selected: mode === m }}
          >
            <Text
              className={
                (mode === m ? 'text-ink ' : 'text-ink-2 ') +
                'font-bodyBold text-[11px] tracking-[0.28em] uppercase'
              }
            >
              {m === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Form */}
      <View className="gap-4">
        {mode === 'sign-up' && (
          <Field
            label="Full name"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            placeholder="Your name"
          />
        )}
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          secureTextEntry
          placeholder={mode === 'sign-up' ? 'At least 6 characters' : ''}
        />
      </View>

      {/* Inline messages */}
      {error ? (
        <Text
          className="text-[#8a2026] font-body text-sm mt-4"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text
          className="text-ink-2 font-body italic text-sm mt-4"
          accessibilityLiveRegion="polite"
        >
          {info}
        </Text>
      ) : null}

      {/* Submit */}
      <Pressable
        onPress={submit}
        disabled={busy || !email || !password}
        className={
          'bg-ink px-7 py-4 mt-6 active:opacity-80 ' +
          (busy || !email || !password ? 'opacity-50' : '')
        }
        accessibilityRole="button"
        accessibilityLabel={mode === 'sign-in' ? 'Sign in' : 'Create account'}
        accessibilityState={{ disabled: busy || !email || !password }}
      >
        {busy ? (
          <ActivityIndicator color="#F1E8DD" />
        ) : (
          <Text className="text-cream font-bodyBold tracking-[0.18em] uppercase text-xs text-center">
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Text>
        )}
      </Pressable>

      <Text className="text-ink-2 text-xs font-body italic mt-6 leading-5">
        By signing in you agree to the Honey Pilates membership terms and
        studio waiver.
      </Text>
    </View>
  );
}

// ─── tiny labeled-input primitive (in-file to keep the screen one unit) ─
type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: any;
  keyboardType?: any;
  secureTextEntry?: boolean;
};
function Field({ label, value, onChange, placeholder, autoComplete, keyboardType, secureTextEntry }: FieldProps) {
  return (
    <View>
      <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A89E89"
        autoCapitalize="none"
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={label}
        className="text-ink font-body text-base"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#E8DCC9',
          paddingVertical: 10,
        }}
      />
    </View>
  );
}
