import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppAuth } from "@/src/hooks/useAuth";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import { LaymanScoreRing } from "@/src/components/LaymanScoreRing";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { MiniChart } from "@/src/components/MiniChart";
import { SectionHeader } from "@/src/components/SectionHeader";
import { theme } from "@/src/lib/theme";
import { apiFetch } from "@/src/lib/api";
import { formatPct } from "@/src/lib/format";

export default function StrategyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { getToken } = useAppAuth();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [layman, setLayman] = useState<{
    score: number;
    grade: string;
    headline: string;
    summary: string;
    strengths: string[];
    cautions: string[];
  } | null>(null);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"overview" | "risk" | "social">("overview");

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const d = await apiFetch<Record<string, unknown>>(`/api/strategies/${slug}`, {
        token: token ?? undefined,
      });
      setData(d);
      if (d.logicJson) {
        const rate = await apiFetch<{ layman: typeof layman }>("/api/algorithms/rate", {
          method: "POST",
          body: JSON.stringify({
            logicJson: d.logicJson,
            symbol: "AAPL",
            days: 252,
          }),
        });
        setLayman(rate.layman);
      }
    })();
  }, [slug, getToken]);

  async function follow() {
    const token = await getToken();
    await apiFetch(`/api/strategies/${slug}/follow`, {
      method: "POST",
      token: token ?? undefined,
    });
    const d = await apiFetch<Record<string, unknown>>(`/api/strategies/${slug}`, {
      token: token ?? undefined,
    });
    setData(d);
    setMsg("Follow updated");
  }

  async function like() {
    const token = await getToken();
    await apiFetch(`/api/strategies/${slug}/like`, {
      method: "POST",
      token: token ?? undefined,
    });
    const d = await apiFetch<Record<string, unknown>>(`/api/strategies/${slug}`, {
      token: token ?? undefined,
    });
    setData(d);
  }

  async function postComment() {
    if (!comment.trim()) return;
    const token = await getToken();
    await apiFetch(`/api/strategies/${slug}/comment`, {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ content: comment }),
    });
    setComment("");
    const d = await apiFetch<Record<string, unknown>>(`/api/strategies/${slug}`, {
      token: token ?? undefined,
    });
    setData(d);
    setMsg("Comment posted");
  }

  async function deploy(withAutopilot: boolean) {
    const token = await getToken();
    await apiFetch(`/api/strategies/${slug}/deploy`, {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ allocated: 15000, autopilot: withAutopilot }),
    });
    setMsg(
      withAutopilot
        ? "Deployed with autopilot — check Bots tab"
        : "Strategy deployed to your paper account"
    );
    router.push(withAutopilot ? "/(tabs)/bots" : "/(tabs)/dashboard");
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.success} />
      </View>
    );
  }

  const equity =
    (
      data.backtests as { result?: { equityCurve: { value: number }[] } }[]
    )?.[0]?.result?.equityCurve?.map((p) => p.value) ?? [];

  const laymanScore =
    layman?.score ?? Math.min(100, Math.round((data.quantScore as number) / 10));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LaymanScoreRing
          score={laymanScore}
          grade={layman?.grade ?? "Rated"}
          size="lg"
        />
        <Text style={styles.laymanLabel}>Strength score (plain English)</Text>
        {layman ? (
          <Text style={styles.headline}>{layman.headline}</Text>
        ) : null}

        <Text style={styles.title}>{data.name as string}</Text>
        <Text style={styles.creator}>
          {(data.creator as { name: string }).name} · {data.category as string}
        </Text>

        <View style={styles.tabs}>
          {(["overview", "risk", "social"] as const).map((t) => (
            <PrimaryButton
              key={t}
              label={t}
              onPress={() => setTab(t)}
              variant={tab === t ? "success" : "ghost"}
              style={styles.tabBtn}
            />
          ))}
        </View>

        {tab === "overview" && (
          <>
            <GlassCard>
              <Text style={styles.desc}>{data.description as string}</Text>
              {equity.length > 2 ? (
                <MiniChart data={equity} height={100} positive />
              ) : null}
            </GlassCard>
            <View style={styles.stats}>
              <Stat label="Return" value={formatPct(data.historicalReturn as number)} />
              <Stat label="Sharpe" value={(data.sharpeRatio as number)?.toFixed(2) ?? "—"} />
              <Stat label="Win %" value={`${(data.winRate as number)?.toFixed(0) ?? "—"}`} />
              <Stat label="Max DD" value={`${(data.maxDrawdown as number)?.toFixed(1) ?? "—"}%`} />
            </View>
          </>
        )}

        {tab === "risk" && layman && (
          <GlassCard>
            <Text style={styles.desc}>{layman.summary}</Text>
            <SectionHeader title="Strengths" />
            {layman.strengths.map((s) => (
              <Text key={s} style={styles.good}>✓ {s}</Text>
            ))}
            <SectionHeader title="Cautions" />
            {layman.cautions.map((c) => (
              <Text key={c} style={styles.bad}>! {c}</Text>
            ))}
          </GlassCard>
        )}

        {tab === "social" && (
          <GlassCard>
            <View style={styles.socialBtns}>
              <PrimaryButton
                label={data.isFollowing ? "Unfollow" : "Follow"}
                onPress={follow}
                variant="primary"
                style={styles.half}
              />
              <PrimaryButton
                label={data.isLiked ? "Liked ✓" : "Like"}
                onPress={like}
                variant="ghost"
                style={styles.half}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Write a comment…"
              placeholderTextColor={theme.textSecondary}
              value={comment}
              onChangeText={setComment}
            />
            <PrimaryButton label="Post comment" onPress={postComment} />
            {(
              data.comments as {
                content: string;
                user: { name: string };
              }[]
            )?.map((c, i) => (
              <View key={i} style={styles.comment}>
                <Text style={styles.commentUser}>{c.user.name}</Text>
                <Text style={styles.commentBody}>{c.content}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        <PrimaryButton
          label="Deploy paper simulation"
          onPress={() => deploy(false)}
          variant="primary"
        />
        <PrimaryButton
          label="Deploy + autopilot bot"
          onPress={() => deploy(true)}
          variant="success"
          style={{ marginTop: 10 }}
        />
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      </ScrollView>
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, paddingBottom: 48, alignItems: "center" },
  laymanLabel: { color: theme.textSecondary, fontSize: 12, marginTop: 8 },
  headline: {
    color: theme.textPrimary,
    textAlign: "center",
    marginTop: 8,
    fontSize: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.textPrimary,
    marginTop: 20,
    textAlign: "center",
  },
  creator: { color: theme.textSecondary, marginTop: 4 },
  tabs: { flexDirection: "row", gap: 8, marginVertical: 20, width: "100%" },
  tabBtn: { flex: 1, marginBottom: 0, paddingVertical: 10 },
  desc: { color: theme.textSecondary, lineHeight: 22 },
  stats: { flexDirection: "row", flexWrap: "wrap", width: "100%", gap: 12 },
  stat: {
    width: "47%",
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statVal: { fontSize: 18, fontWeight: "700", color: theme.textPrimary },
  statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 4 },
  good: { color: theme.success, marginBottom: 6 },
  bad: { color: theme.loss, marginBottom: 6 },
  socialBtns: { flexDirection: "row", gap: 8, marginBottom: 12 },
  half: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  comment: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
    marginTop: 12,
  },
  commentUser: { fontWeight: "600", color: theme.textPrimary },
  commentBody: { color: theme.textSecondary, marginTop: 4 },
  msg: { color: theme.success, marginTop: 12 },
});
