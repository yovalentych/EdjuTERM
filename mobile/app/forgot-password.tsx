import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, TextInput, View, Pressable, Text, ActivityIndicator } from "react-native";
import * as Icons from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Title } from "@/components/ui";
import { colors, fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const canSubmit  = EMAIL_RE.test(email) && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email, locale: "uk" }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg("Не вдалося надіслати лист. Перевірте підключення.");
    } finally {
      setLoading(false);
    }
  }

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
          <Title>Скидання пароля</Title>
          <Body>Введіть email і ми надішлемо посилання для встановлення нового пароля.</Body>
        </View>

        {sent ? (
          <MotiView
            from={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14 }}
            style={styles.successBox}
          >
            <View style={styles.successIcon}>
              <Icons.CheckCircle2 size={28} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={styles.successTitle}>Лист надіслано</Text>
            <Text style={styles.successBody}>
              Якщо цей email зареєстрований — ми надіслали посилання для скидання пароля. Перевірте папку Спам.
            </Text>
            <ActionButton
              label="Повернутися до входу"
              icon="ArrowLeft"
              variant="secondary"
              onPress={() => router.replace("/login")}
            />
          </MotiView>
        ) : (
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
                autoFocus
              />
              {email.length > 0 && EMAIL_RE.test(email) && (
                <Icons.CheckCircle2 size={16} color="#10b981" strokeWidth={2.2} />
              )}
            </View>
            {!emailValid && <Text style={styles.hintText}>Перевірте формат пошти</Text>}

            <View style={{ opacity: canSubmit ? 1 : 0.55 }} pointerEvents={canSubmit ? "auto" : "none"}>
              <ActionButton
                label={loading ? "Надсилаємо..." : "Надіслати посилання"}
                icon="Send"
                onPress={handleSubmit}
              />
            </View>

            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 4 }} />}

            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Назад до входу</Text>
            </Pressable>
          </View>
        )}
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
  form: { gap: 14 },

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
  input: { fontFamily: fonts.regular, flex: 1, paddingVertical: 14, color: colors.ink, fontSize: 15 },
  hintText: { fontFamily: fonts.regular, fontSize: 11, color: "#be123c", paddingLeft: 4 },

  backLink: { alignSelf: "center", paddingVertical: 8 },
  backLinkText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },

  successBox: {
    gap: 14,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(16,185,129,0.3)",
    alignItems: "center",
  },
  successIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: "rgba(16,185,129,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontFamily: fonts.title, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  successBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 19, paddingHorizontal: 4 },
});
