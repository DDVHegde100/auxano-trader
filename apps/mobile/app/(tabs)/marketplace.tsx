import { useAppAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import { SectionHeader } from "@/src/components/SectionHeader";
import { PresetAlgoCard, type PresetPreview } from "@/src/components/PresetAlgoCard";
import { LaymanScoreRing } from "@/src/components/LaymanScoreRing";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatPct } from "@/src/lib/format";
import type { MarketplaceStrategy } from "@auxano/shared";

const FILTERS = ["ALL", "CONSERVATIVE", "MOMENTUM", "MEAN_REVERSION", "AGGRESSIVE"];

interface LaymanDetail {
  score: number;
  grade: string;
  headline: string;
  summary: string;
  strengths: string[];
  cautions: string[];
  breakdown: { label: string; score: number; explanation: string }[];
}

export default function MarketplaceScreen() {
  const { getToken } = useAppAuth();
  const router = useRouter();
  const [presets, setPresets] = useState<PresetPreview[]>([]);
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [ratingModal, setRatingModal] = useState<LaymanDetail | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (search) params.set("search", search);

    const [presetRes, stratRes] = await Promise.all([
      apiFetch<{ presets: PresetPreview[] }>("/api/algorithms/presets"),
      apiFetch<{ strategies: MarketplaceStrategy[] }>(
        `/api/strategies?${params}`,
        { token: token ?? undefined }
      ),
    ]);
    setPresets(presetRes.presets ?? []);
    setStrategies(stratRes.strategies ?? []);
  }, [getToken, category, search]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  function addPresetToTrading(preset: PresetPreview) {
    setMsg(`${preset.name} added — choose an allowed symbol in Trade.`);
    router.push({
      pathname: "/(tabs)/trade",
      params: { preset: preset.id },
    });
  }

  async function toggleFollow(slug: string) {
    const token = await getToken();
    await apiFetch(`/api/strategies/${slug}/follow`, {
      method: "POST",
      token: token ?? undefined,
    });
    load();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Algorithms</Text>
        <Text style={styles.sub}>
          Ready-made strategies for non-coders · rated 0–100 in plain English
        </Text>

        <TextInput
          style={styles.search}
          placeholder="Search community strategies…"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load()}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.filter, category === f && styles.filterOn]}
              onPress={() => setCategory(f)}
            >
              <Text style={category === f ? styles.filterOnText : styles.filterText}>
                {f.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        <SectionHeader
          title="Built-in · DEFAULT"
          subtitle="1-year backtests · tap to add to paper trading (no source code)"
        />

        {loading ? (
          <ActivityIndicator color={theme.success} style={{ marginVertical: 24 }} />
        ) : (
          presets.map((p) => (
            <PresetAlgoCard
              key={p.id}
              preset={p}
              onDeploy={() => addPresetToTrading(p)}
              onRate={() => openPresetRating(p, setRatingModal)}
            />
          ))
        )}

        <SectionHeader
          title="Community marketplace"
          subtitle="Follow, backtest, and explore"
        />

        {strategies.map((s) => (
          <Pressable key={s.id} onPress={() => router.push(`/strategy/${s.slug}`)}>
            <GlassCard>
              <View style={styles.stratRow}>
                <LaymanScoreRing
                  score={Math.min(100, Math.round(s.quantScore / 10))}
                  size="sm"
                />
                <View style={styles.stratMeta}>
                  <Text style={styles.stratName}>{s.name}</Text>
                  <Text style={styles.stratDesc} numberOfLines={2}>
                    {s.description}
                  </Text>
                  <Text style={styles.stratStats}>
                    {s.historicalReturn != null
                      ? formatPct(s.historicalReturn)
                      : "—"}{" "}
                    · {s.followerCount} followers
                  </Text>
                </View>
              </View>
              <View style={styles.stratActions}>
                <PrimaryButton
                  label={s.isFollowing ? "Following" : "Follow"}
                  onPress={() => toggleFollow(s.slug)}
                  variant="ghost"
                  style={styles.smallBtn}
                />
                <PrimaryButton
                  label="Details"
                  onPress={() => router.push(`/strategy/${s.slug}`)}
                  variant="primary"
                  style={styles.smallBtn}
                />
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </ScrollView>

      <RatingModal visible={!!ratingModal} rating={ratingModal} onClose={() => setRatingModal(null)} />
    </SafeAreaView>
  );
}

async function openPresetRating(
  preset: PresetPreview,
  setRating: (r: LaymanDetail) => void
) {
  const res = await apiFetch<{ layman: LaymanDetail }>(
    `/api/algorithms/presets/${preset.id}/rate`
  );
  setRating(res.layman);
}

function RatingModal({
  visible,
  rating,
  onClose,
}: {
  visible: boolean;
  rating: LaymanDetail | null;
  onClose: () => void;
}) {
  if (!rating) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <LaymanScoreRing score={rating.score} grade={rating.grade} size="lg" />
          <Text style={modalStyles.headline}>{rating.headline}</Text>
          <Text style={modalStyles.summary}>{rating.summary}</Text>
          <Text style={modalStyles.section}>Strengths</Text>
          {rating.strengths.map((s) => (
            <Text key={s} style={modalStyles.bullet}>✓ {s}</Text>
          ))}
          <Text style={modalStyles.section}>Watch outs</Text>
          {rating.cautions.map((c) => (
            <Text key={c} style={modalStyles.caution}>! {c}</Text>
          ))}
          {rating.breakdown.map((b) => (
            <View key={b.label} style={modalStyles.breakRow}>
              <Text style={modalStyles.breakLabel}>{b.label}</Text>
              <Text style={modalStyles.breakScore}>{b.score}/100</Text>
            </View>
          ))}
          <PrimaryButton label="Got it" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary },
  sub: { color: theme.textSecondary, marginBottom: 16, lineHeight: 20 },
  search: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  filters: { marginBottom: 16, maxHeight: 40 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  filterOn: { backgroundColor: "rgba(188,138,95,0.12)", borderColor: theme.success },
  filterText: { color: theme.textSecondary, fontSize: 12 },
  filterOnText: { color: theme.success, fontWeight: "600", fontSize: 12 },
  msg: { color: theme.success, marginBottom: 12, textAlign: "center" },
  stratRow: { flexDirection: "row", gap: 12 },
  stratMeta: { flex: 1 },
  stratName: { fontSize: 17, fontWeight: "600", color: theme.textPrimary },
  stratDesc: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  stratStats: { color: theme.success, fontSize: 12, marginTop: 6 },
  stratActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallBtn: { flex: 1, marginBottom: 0 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    maxHeight: "85%",
  },
  headline: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.textPrimary,
    textAlign: "center",
    marginTop: 16,
  },
  summary: { color: theme.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 22 },
  section: {
    alignSelf: "flex-start",
    color: theme.textPrimary,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  bullet: { alignSelf: "flex-start", color: theme.success, marginBottom: 4 },
  caution: { alignSelf: "flex-start", color: theme.loss, marginBottom: 4 },
  breakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  breakLabel: { color: theme.textSecondary },
  breakScore: { color: theme.textPrimary, fontWeight: "600" },
});
