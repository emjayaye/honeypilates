import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Waiver e-signature screen. Members are routed here:
//   - From their dashboard if they have not signed the active version
//   - From /schedule when a reserve_class() call returns
//     'waiver_required'
//
// Renders the currently-active waiver_documents row, accepts the
// member's typed full legal name, and calls sign_waiver(). On
// success, returns the member to wherever they came from.

type WaiverDoc = {
  id: string;
  version: string;
  title: string;
  body_md: string;
  effective_at: string;
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

export default function WaiverScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [doc, setDoc] = useState<WaiverDoc | null>(null);
  const [signed, setSigned] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!session) { setLoading(false); return; }
      const [{ data: d }, { data: existing }] = await Promise.all([
        supabase
          .from('waiver_documents')
          .select('id,version,title,body_md,effective_at')
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('waivers')
          .select('id,doc_version,signed_at')
          .eq('member_id', session.user.id),
      ]);
      setDoc(d as WaiverDoc | null);
      const sig = (existing ?? []).find((w: any) => d && w.doc_version === d.version);
      setSigned(!!sig);
      setLoading(false);
    })();
  }, [session]);

  if (authLoading) return null;
  if (!session) return <Redirect href="/account" />;

  const submit = async () => {
    if (!agreed) { setError('Please confirm you agree before signing.'); return; }
    if (signature.trim().length < 3) { setError('Please type your full legal name.'); return; }
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.rpc('sign_waiver', { p_signature_text: signature.trim() });
      if (error) throw error;
      // Bounce back to schedule (most common entry point) on success.
      router.replace('/schedule');
    } catch (e: any) {
      setError(e?.message ?? 'Could not record signature.');
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
        <Eyebrow>Member waiver</Eyebrow>
        <Text
          className="text-ink font-display italic text-[44px] mt-3 leading-[48px]"
          accessibilityRole="header"
          // @ts-expect-error
          aria-level={1}
        >
          {signed ? 'On file.' : 'Before your first class.'}
        </Text>
        <HairlineRule />
        <Text className="text-ink-2 font-body text-[15px] leading-7">
          {signed
            ? 'Your signature is recorded against the current waiver. You can re-read the document below anytime.'
            : 'Read and sign once. The signature stays on file for the active waiver version.'}
        </Text>

        {loading ? (
          <View className="mt-10"><ActivityIndicator color="#1F1F1F" /></View>
        ) : !doc ? (
          <View className="mt-10 p-7" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2 }}>
            <Text className="text-ink-2 font-body italic text-sm">
              No active waiver on file yet. The studio is finalizing the document.
            </Text>
          </View>
        ) : (
          <>
            {/* Document — renders the markdown as styled text. We
                don't pull in a full md renderer; the structure is
                simple enough that line-by-line styling suffices. */}
            <View
              className="mt-10 p-7"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DCC9', borderRadius: 2 }}
              accessibilityLabel={doc.title}
            >
              <Text className="text-ink-2 text-[10px] tracking-[0.32em] uppercase font-bodyMd">
                Version {doc.version}
              </Text>
              <Text
                className="text-ink font-display italic text-2xl mt-2 leading-7"
                accessibilityRole="header"
                // @ts-expect-error
                aria-level={2}
              >
                {doc.title}
              </Text>
              <View className="mt-5 gap-3">
                {doc.body_md.split('\n').map((line, i) => {
                  if (!line.trim()) return null;
                  if (line.startsWith('### ')) {
                    return (
                      <Text
                        key={i}
                        className="text-ink font-bodyBold text-base tracking-[0.04em] mt-3"
                      >
                        {line.replace(/^###\s+/, '')}
                      </Text>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <Text
                        key={i}
                        className="text-ink-2 font-body italic text-sm"
                      >
                        {line.replace(/^\*\*|\*\*$/g, '')}
                      </Text>
                    );
                  }
                  return (
                    <Text key={i} className="text-ink font-body text-[15px] leading-7">
                      {line.replace(/\*\*(.+?)\*\*/g, '$1')}
                    </Text>
                  );
                })}
              </View>
            </View>

            {/* Sign form — hidden once signed */}
            {!signed && (
              <View className="mt-8">
                <Eyebrow>Sign</Eyebrow>
                <HairlineRule />

                <Text className="text-ink-2 text-[10px] tracking-[0.28em] uppercase font-bodyMd mb-2">
                  Type your full legal name
                </Text>
                <TextInput
                  value={signature}
                  onChangeText={setSignature}
                  placeholder="First Last"
                  placeholderTextColor="#A89E89"
                  autoComplete="name"
                  className="text-ink font-display italic text-2xl"
                  style={{ borderBottomWidth: 1, borderBottomColor: '#E8DCC9', paddingVertical: 12 }}
                  accessibilityLabel="Full legal name for electronic signature"
                />

                <Pressable
                  onPress={() => setAgreed(!agreed)}
                  className="flex-row items-start gap-3 mt-6 active:opacity-60"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                  accessibilityLabel="I have read and agree to the waiver"
                >
                  <View
                    style={{
                      width: 20, height: 20, borderRadius: 2,
                      borderWidth: 1, borderColor: '#1F1F1F',
                      backgroundColor: agreed ? '#1F1F1F' : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {agreed && <Text className="text-cream text-xs font-bodyBold">✓</Text>}
                  </View>
                  <Text className="text-ink-2 font-body text-[15px] leading-6 flex-1">
                    I have read the waiver above and agree to its terms. I understand
                    that typing my name and clicking the button below counts as my
                    legal signature under the federal E-SIGN Act and New York law.
                  </Text>
                </Pressable>

                {error && (
                  <Text
                    className="text-[#8a2026] font-body text-sm mt-4"
                    accessibilityLiveRegion="polite"
                  >
                    {error}
                  </Text>
                )}

                <Pressable
                  onPress={submit}
                  disabled={busy || !agreed || signature.trim().length < 3}
                  className="bg-ink px-7 py-4 mt-7 self-start active:opacity-80"
                  style={busy || !agreed || signature.trim().length < 3 ? { opacity: 0.5 } : undefined}
                  accessibilityRole="button"
                  accessibilityLabel="Sign the waiver"
                >
                  <Text className="text-cream font-bodyBold tracking-[0.22em] uppercase text-[11px]">
                    {busy ? 'Signing…' : 'Sign waiver'}
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
