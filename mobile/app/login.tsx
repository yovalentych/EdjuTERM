import { useState } from "react";
import { router, Link } from "expo-router";
import {
  StyleSheet, TextInput, View, Pressable, Text, ActivityIndicator,
} from "react-native";
import * as Icons from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Title } from "@/components/ui";
import { colors, fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useMobileStore, type User } from "@/lib/mobile-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REMEMBER_EMAIL_KEY = "research_navigator_mobile.remember_email.v1";

export default function LoginScreen() {
  const { fetchMe, fetchPersonalProfile, setAuthToken } = useMobileStore();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-load last remembered email on mount
  useState(() => {
    AsyncStorage.getItem(REMEMBER_EMAIL_KEY).then((saved) => {
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    }).catch(() => undefined);
  });

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const canSubmit  = EMAIL_RE.test(email) && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ user: User; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe: remember }),
      });

      setAuthToken(res.token);
      const user = await fetchMe(res.token);
      if (!user) throw new Error("Не вдалося отримати дані користувача");
      const profile = await fetchPersonalProfile(res.token);

      if (remember) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email).catch(() => undefined);
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY).catch(() => undefined);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(profile?.onboardingCompleted === false ? "/profile" : "/space");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(error instanceof Error ? error.message : "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    router.push("/forgot-password");
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Icons.ArrowLeft size={18} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18 }}
        style={styles.content}
      >
        <View style={styles.titleContainer}>
          <Title>З поверненням</Title>
          <Body>Увійдіть у свій дослідницький контур</Body>
        </View>

        <View style={styles.form}>
          {errorMsg && (
            <MotiView
              from={{ opacity: 0, translateY: -4 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.errorBox}
            >
              <Icons.AlertTriangle size={14} color="#be123c" strokeWidth={2.2} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </MotiView>
          )}

          {/* ── Email ─────────────────────────────────────────── */}
          <View style={[styles.inputContainer, !emailValid && styles.inputContainerError]}>
            <Icons.Mail size={18} color={colors.mutedSoft} strokeWidth={2} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={colors.mutedSoft}
              style={styles.input}
              autoComplete="email"
            />
            {email.length > 0 && EMAIL_RE.test(email) && (
              <Icons.CheckCircle2 size={16} color="#10b981" strokeWidth={2.2} />
            )}
          </View>
          {!emailValid && (
            <Text style={styles.hintText}>Перевірте формат пошти</Text>
          )}

          {/* ── Password ──────────────────────────────────────── */}
          <View style={styles.inputContainer}>
            <Icons.Lock size={18} color={colors.mutedSoft} strokeWidth={2} style={styles.inputIcon} />
            <TextInput
              placeholder="Пароль"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry={!showPwd}
              style={styles.input}
              autoComplete="current-password"
            />
            <Pressable onPress={() => setShowPwd(v => !v)} hitSlop={10}>
              {showPwd
                ? <Icons.EyeOff size={18} color={colors.mutedSoft} strokeWidth={2} />
                : <Icons.Eye size={18} color={colors.mutedSoft} strokeWidth={2} />}
            </Pressable>
          </View>

          {/* ── Remember me + Forgot ──────────────────────────── */}
          <View style={styles.rowBetween}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setRemember(v => !v); }}
              style={styles.checkboxRow}
              hitSlop={4}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Icons.Check size={11} color="#fff" strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>Запам'ятати на 30 днів</Text>
            </Pressable>
            <Pressable onPress={handleForgot} hitSlop={8}>
              <Text style={styles.forgotLink}>Забули пароль?</Text>
            </Pressable>
          </View>

          {/* ── Submit ─────────────────────────────────────────── */}
          <View style={{ opacity: canSubmit ? 1 : 0.55 }} pointerEvents={canSubmit ? "auto" : "none"}>
            <ActionButton
              label={loading ? "Вхід..." : "Увійти"}
              icon="ArrowRight"
              onPress={handleLogin}
            />
          </View>

          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 4 }} />}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Немає акаунту? </Text>
            <Link href="/register" asChild>
              <Pressable hitSlop={6}>
                <Text style={styles.linkText}>Зареєструватися</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </MotiView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 10 },
  backButton: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#0b1626", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  content: { flex: 1, paddingTop: 36 },
  titleContainer: { marginBottom: 28 },
  form: { gap: 12 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "rgba(190,18,60,0.08)",
    borderWidth: 0.5, borderColor: "rgba(190,18,60,0.3)",
    borderRadius: 12,
  },
  errorText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 12, color: "#be123c", letterSpacing: -0.1 },

  inputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14, gap: 8,
    shadowColor: "#0b1626", shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  inputContainerError: { borderColor: "rgba(190,18,60,0.35)", borderWidth: 1 },
  inputIcon: { marginRight: 2 },
  input: {
    fontFamily: fonts.regular, flex: 1, paddingVertical: 14,
    color: colors.ink, fontSize: 15,
  },
  hintText: { fontFamily: fonts.regular, fontSize: 11, color: "#be123c", paddingLeft: 4 },

  rowBetween: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 2, marginTop: 4, marginBottom: 4,
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.muted, letterSpacing: -0.1 },
  forgotLink: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  footerText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 14 },
  linkText:   { fontFamily: fonts.bold, color: colors.primary, fontSize: 14 },
});
