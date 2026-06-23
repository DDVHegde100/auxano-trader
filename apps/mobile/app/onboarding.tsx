import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "@/src/lib/theme";
import { BrandLogo } from "@/src/components/BrandLogo";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { GlassCard } from "@/src/components/GlassCard";
import { PRESET_ALGORITHMS } from "@auxano/shared";
import { apiFetch } from "@/src/lib/api";
import { useAppAuth } from "@/src/hooks/useAuth";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";
import { AuthLoadingScreen } from "@/src/components/AuthLoadingScreen";

const EXPERIENCE = [
  { value: "BEGINNER", label: "Beginner", desc: "New to investing" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "1–3 years" },
  { value: "ADVANCED", label: "Advanced", desc: "3+ years" },
  { value: "PROFESSIONAL", label: "Professional", desc: "Industry" },
];

const RISK = [
  { value: "CONSERVATIVE", label: "Conservative" },
  { value: "MODERATE", label: "Moderate" },
  { value: "AGGRESSIVE", label: "Aggressive" },
  { value: "VERY_AGGRESSIVE", label: "Very Aggressive" },
];

const GOALS = [
  { value: "WEALTH_BUILDING", label: "Wealth Building" },
  { value: "LEARNING", label: "Learning" },
  { value: "INCOME_GENERATION", label: "Income" },
  { value: "RETIREMENT", label: "Retirement" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const authed = useRequireAuth();
  const { getToken } = useAppAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [presetId, setPresetId] = useState("steady-grower");
  const [form, setForm] = useState({
    investingExperience: "",
    riskTolerance: "",
    financialGoal: "",
  });

  async function finish() {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      await apiFetch("/api/user/onboarding", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(form),
      });
      await apiFetch("/api/algorithms/deploy", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ presetId, allocated: 20000, autopilot: true }),
      });
      router.replace("/(tabs)/bots");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not finish setup");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) return <AuthLoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo size="md" style={{ marginBottom: 12 }} />
        <Text style={styles.title}>
          {step === 0 ? "Your experience" : step === 1 ? "Risk & goals" : "Deploy your first bot"}
        </Text>
        <Text style={styles.sub}>
          {step === 2
            ? "We'll start autopilot on paper — no real money."
            : "Quick setup so Auxano fits you."}
        </Text>

        {step === 0 && (
          <View style={styles.options}>
            {EXPERIENCE.map((o) => (
              <Pressable
                key={o.value}
                style={[
                  styles.option,
                  form.investingExperience === o.value && styles.optionOn,
                ]}
                onPress={() =>
                  setForm((f) => ({ ...f, investingExperience: o.value }))
                }
              >
                <Text style={styles.optionLabel}>{o.label}</Text>
                <Text style={styles.optionDesc}>{o.desc}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 1 && (
          <>
            <Text style={styles.section}>Risk tolerance</Text>
            <View style={styles.chips}>
              {RISK.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, form.riskTolerance === o.value && styles.chipOn]}
                  onPress={() => setForm((f) => ({ ...f, riskTolerance: o.value }))}
                >
                  <Text
                    style={
                      form.riskTolerance === o.value ? styles.chipOnText : styles.chipText
                    }
                  >
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.section}>Primary goal</Text>
            <View style={styles.chips}>
              {GOALS.map((o) => (
                <Pressable
                  key={o.value}
                  style={[styles.chip, form.financialGoal === o.value && styles.chipOn]}
                  onPress={() => setForm((f) => ({ ...f, financialGoal: o.value }))}
                >
                  <Text
                    style={
                      form.financialGoal === o.value ? styles.chipOnText : styles.chipText
                    }
                  >
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            {PRESET_ALGORITHMS.slice(0, 4).map((p) => (
              <Pressable key={p.id} onPress={() => setPresetId(p.id)}>
                <GlassCard
                  style={[
                    styles.preset,
                    presetId === p.id && styles.presetOn,
                  ]}
                >
                  <Text style={styles.presetName}>{p.name}</Text>
                  <Text style={styles.presetTag}>{p.tagline}</Text>
                </GlassCard>
              </Pressable>
            ))}
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {step > 0 ? (
            <PrimaryButton
              label="Back"
              onPress={() => setStep((s) => s - 1)}
              variant="ghost"
              style={styles.half}
            />
          ) : null}
          {step < 2 ? (
            <PrimaryButton
              label="Continue"
              onPress={() => setStep((s) => s + 1)}
              variant="primary"
              style={styles.flex}
              disabled={
                (step === 0 && !form.investingExperience) ||
                (step === 1 && (!form.riskTolerance || !form.financialGoal))
              }
            />
          ) : (
            <PrimaryButton
              label={loading ? "Starting bot…" : "Deploy & open Bots"}
              onPress={finish}
              loading={loading}
              variant="success"
              style={styles.flex}
            />
          )}
        </View>
        {loading ? <ActivityIndicator color={theme.success} style={{ marginTop: 16 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: "700", color: theme.textPrimary, textAlign: "center" },
  sub: { color: theme.textSecondary, textAlign: "center", marginBottom: 24, marginTop: 8 },
  options: { gap: 10 },
  option: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  optionOn: { borderColor: theme.success, backgroundColor: "rgba(188,138,95,0.1)" },
  optionLabel: { color: theme.textPrimary, fontWeight: "600", fontSize: 16 },
  optionDesc: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  section: { color: theme.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipOn: { borderColor: theme.success, backgroundColor: "rgba(188,138,95,0.1)" },
  chipText: { color: theme.textSecondary, fontSize: 13 },
  chipOnText: { color: theme.success, fontWeight: "600", fontSize: 13 },
  preset: { marginBottom: 10 },
  presetOn: { borderColor: theme.success },
  presetName: { fontWeight: "600", color: theme.textPrimary },
  presetTag: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  half: { flex: 0.4 },
  flex: { flex: 1 },
  error: { color: theme.loss, textAlign: "center", marginTop: 12 },
});
