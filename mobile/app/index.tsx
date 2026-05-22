import { router } from "expo-router";
import { StyleSheet, View, Text, Pressable, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import * as Icons from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";

const FEATURES = [
  { icon: Icons.Compass,      label: "Усі ваші проєкти — в одному просторі" },
  { icon: Icons.FlaskConical, label: "Лабораторії, дисертації, курси, гранти" },
  { icon: Icons.Sparkles,     label: "Сучасний інтерфейс, синхронізація з вебом" },
];

export default function OnboardingScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Background gradient + decorative blobs ─────────────────────── */}
      <LinearGradient
        colors={["#04201e", "#073d35", "#0f5c50", colors.primary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, { top: -120, right: -90, backgroundColor: "rgba(208,250,245,0.10)", width: 280, height: 280 }]} />
        <View style={[styles.blob, { bottom: -180, left: -120, backgroundColor: "rgba(124,58,237,0.18)", width: 360, height: 360 }]} />
        <View style={[styles.blob, { top: 220, left: -60, backgroundColor: "rgba(15,118,110,0.18)", width: 200, height: 200 }]} />
      </View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.content}>
          {/* ── Logo ───────────────────────────────────────────────── */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18 }}
            style={styles.logoWrap}
          >
            <View style={styles.logoOuter}>
              <LinearGradient
                colors={["rgba(208,250,245,0.25)", "rgba(124,58,237,0.18)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.logoCircle}
              >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.logoText}>RN</Text>
              </LinearGradient>
            </View>
            <Text style={styles.eyebrow}>Research Navigator</Text>
          </MotiView>

          {/* ── Hero text ──────────────────────────────────────────── */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, delay: 120 }}
            style={styles.textBlock}
          >
            <Text style={styles.title}>Науковий простір у кишені</Text>
            <Text style={styles.subtitle}>
              Лабораторії, дисертації, курси та ініціативи в одному застосунку — синхронізовані з вебом.
            </Text>
          </MotiView>

          {/* ── Feature bullets ────────────────────────────────────── */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, delay: 200 }}
            style={styles.featuresWrap}
          >
            {FEATURES.map((f, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <f.icon size={14} color="#d0faf5" strokeWidth={2.2} />
                </View>
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </MotiView>

          {/* ── CTAs ───────────────────────────────────────────────── */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, delay: 280 }}
            style={styles.footer}
          >
            <Pressable
              onPress={() => router.push("/login")}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}
            >
              <LinearGradient
                colors={["#1a8c81", colors.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.primaryBtnText}>Почати роботу</Text>
              <Icons.ArrowRight size={18} color="#fff" strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPress={() => router.push("/register")}
              hitSlop={10}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.secondaryBtnText}>Створити акаунт</Text>
            </Pressable>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#04201e" },
  blob: { position: "absolute", borderRadius: 999 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: "space-between",
  },

  logoWrap: { alignItems: "center", gap: 12, marginTop: 24 },
  logoOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  logoText: {
    fontFamily: fonts.titleBlack,
    fontSize: 34,
    color: "#fff",
    letterSpacing: -1,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2.4,
    color: "rgba(208,250,245,0.75)",
    textTransform: "uppercase",
  },

  textBlock: { gap: 12, paddingHorizontal: 4 },
  title: {
    fontFamily: fonts.title,
    fontSize: 32,
    lineHeight: 38,
    color: "#fff",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.78)",
  },

  featuresWrap: { gap: 12, paddingHorizontal: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(208,250,245,0.14)",
    borderWidth: 0.5,
    borderColor: "rgba(208,250,245,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.88)",
    letterSpacing: -0.1,
    lineHeight: 18,
  },

  footer: { gap: 12 },
  primaryBtn: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#fff",
    letterSpacing: -0.2,
  },
  secondaryBtn: { alignItems: "center", paddingVertical: 10 },
  secondaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "rgba(208,250,245,0.9)",
    letterSpacing: -0.1,
  },
});
