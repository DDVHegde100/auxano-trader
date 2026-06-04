import { View, Text, StyleSheet, Pressable } from "react-native";
import { GlassCard } from "./GlassCard";
import { LaymanScoreRing } from "./LaymanScoreRing";
import { PrimaryButton } from "./PrimaryButton";
import { theme } from "@/src/lib/theme";
import { formatPct } from "@/src/lib/format";

export interface PresetPreview {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  difficulty: string;
  description: string;
  whoItsFor: string;
  suggestedSymbols: string[];
  preview: {
    laymanScore: number;
    grade: string;
    headline: string;
    annualReturn: number;
    winRate: number;
    maxDrawdown: number;
  };
}

export function PresetAlgoCard({
  preset,
  onDeploy,
  onRate,
  deploying,
}: {
  preset: PresetPreview;
  onDeploy: () => void;
  onRate: () => void;
  deploying?: boolean;
}) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{preset.emoji}</Text>
        <View style={styles.meta}>
          <Text style={styles.name}>{preset.name}</Text>
          <Text style={styles.tag}>{preset.tagline}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>{preset.difficulty}</Text>
            <Text style={styles.badgeMuted}>
              {preset.suggestedSymbols.join(" · ")}
            </Text>
          </View>
        </View>
        <LaymanScoreRing
          score={preset.preview.laymanScore}
          grade={preset.preview.grade}
          size="sm"
        />
      </View>

      <Text style={styles.desc} numberOfLines={3}>{preset.description}</Text>
      <Text style={styles.who}>{preset.whoItsFor}</Text>

      <View style={styles.stats}>
        <Stat label="Backtest return" value={formatPct(preset.preview.annualReturn)} />
        <Stat label="Win rate" value={`${preset.preview.winRate.toFixed(0)}%`} />
        <Stat label="Max drop" value={`${preset.preview.maxDrawdown.toFixed(1)}%`} />
      </View>

      <Text style={styles.headline}>{preset.preview.headline}</Text>

      <View style={styles.actions}>
        <PrimaryButton
          label={deploying ? "Deploying…" : "Deploy to paper account"}
          onPress={onDeploy}
          variant="success"
          loading={deploying}
          style={styles.btn}
        />
        <PrimaryButton label="Full rating" onPress={onRate} variant="ghost" style={styles.btn} />
      </View>
    </GlassCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { flexDirection: "row", gap: 12, marginBottom: 12 },
  emoji: { fontSize: 32 },
  meta: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", color: theme.textPrimary },
  tag: { color: theme.textSecondary, fontSize: 13 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  badge: {
    fontSize: 11,
    color: theme.success,
    backgroundColor: "rgba(0,200,83,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeMuted: { fontSize: 11, color: theme.textSecondary },
  desc: { color: theme.textSecondary, lineHeight: 20, fontSize: 14 },
  who: { color: theme.accent, fontSize: 12, marginTop: 8, fontStyle: "italic" },
  stats: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  stat: { alignItems: "center", flex: 1 },
  statVal: { color: theme.textPrimary, fontWeight: "600", fontSize: 15 },
  statLabel: { color: theme.textSecondary, fontSize: 10, marginTop: 4 },
  headline: { color: theme.textPrimary, fontSize: 13, marginTop: 12, textAlign: "center" },
  actions: { marginTop: 16, gap: 8 },
  btn: { width: "100%" },
});
