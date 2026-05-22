import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Icons from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMobileStore } from "@/lib/mobile-store";
import { apiRequest } from "@/lib/api";
import { fonts } from "@/constants/theme";

const DISMISS_KEY = "rn.email_verify_dismissed.v1";

/**
 * Показується внизу будь-якого Screen, якщо `user.emailVerifiedAt` ще немає.
 * Дозволяє натиснути "Надіслати знову" (POST /api/auth/verify-email)
 * і ховається до кінця сесії через AsyncStorage.
 */
export function EmailVerifyBanner() {
  const { user, authToken } = useMobileStore();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Show only when user is logged in and email not verified.
  if (!user || user.emailVerifiedAt) return null;
  if (hidden) return null;

  async function dismiss() {
    Haptics.selectionAsync();
    setHidden(true);
    AsyncStorage.setItem(DISMISS_KEY, String(Date.now())).catch(() => undefined);
  }

  async function resend() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/verify-email?locale=uk", {
        method: "POST",
        token: authToken || undefined,
      });
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Помилка", "Не вдалося надіслати лист — спробуйте пізніше.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 16 }}
      style={s.wrap}
    >
      <View style={s.iconBox}>
        <Icons.Mail size={14} color="#d97706" strokeWidth={2.2} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        {sent ? (
          <Text style={s.successText}>
            <Icons.CheckCircle2 size={11} color="#059669" /> Лист надіслано — перевірте пошту
          </Text>
        ) : (
          <>
            <Text style={s.title}>Підтвердіть пошту</Text>
            <Text style={s.sub} numberOfLines={2}>
              Ми надіслали лист на {user.email}. Підтвердження відкриває повний доступ.
            </Text>
          </>
        )}
      </View>

      {!sent && (
        <Pressable
          onPress={resend}
          disabled={busy}
          style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }]}
        >
          {busy ? <ActivityIndicator size="small" color="#d97706" /> : <Icons.RefreshCw size={11} color="#d97706" strokeWidth={2.4} />}
          <Text style={s.actionText}>{busy ? "..." : "Надіслати"}</Text>
        </Pressable>
      )}

      <Pressable onPress={dismiss} hitSlop={8} style={s.closeBtn}>
        <Icons.X size={12} color="#92400e" strokeWidth={2.2} />
      </Pressable>
    </MotiView>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 0.5, borderColor: "rgba(217,119,6,0.35)",
    backgroundColor: "rgba(254,243,199,0.85)",
  },
  iconBox: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(217,119,6,0.18)" },
  title: { fontFamily: fonts.bold, fontSize: 12, color: "#92400e", letterSpacing: -0.2 },
  sub: { fontFamily: fonts.regular, fontSize: 10.5, color: "#a16207", lineHeight: 14 },
  successText: { fontFamily: fonts.bold, fontSize: 11.5, color: "#059669" },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 0.5, borderColor: "rgba(217,119,6,0.4)",
  },
  actionText: { fontFamily: fonts.bold, fontSize: 10, color: "#d97706", letterSpacing: -0.1 },
  closeBtn: {
    width: 22, height: 22, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
});
