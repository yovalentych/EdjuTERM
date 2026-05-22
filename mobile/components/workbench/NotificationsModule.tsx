import { View, Text, Pressable, Alert } from "react-native";
import * as Icons from "lucide-react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  requestNotificationPermission, getPermissionStatus,
  scheduleExpiryNotifications, scheduleCalibrationNotifications,
  cancelAllLabNotifications, getScheduledLabNotifications,
  triggerLocalAlert,
} from "@/lib/notifications";
import { colors } from "@/constants/theme";
import { lab } from "./constants";
import { s } from "./styles";

export function NotificationsModule({ labInventory, labEquipment }: { labInventory: any[]; labEquipment: any[] }) {
  const [permission, setPermission] = useState<"granted" | "denied" | "undetermined">("undetermined");
  const [scheduled, setScheduled]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [lastSync, setLastSync]     = useState<string | null>(null);

  useEffect(() => {
    getPermissionStatus().then(setPermission);
    getScheduledLabNotifications().then(setScheduled);
  }, []);

  const refresh = async () => {
    const [perm, list] = await Promise.all([getPermissionStatus(), getScheduledLabNotifications()]);
    setPermission(perm);
    setScheduled(list);
  };

  const handleRequest = async () => {
    const ok = await requestNotificationPermission();
    setPermission(ok ? "granted" : "denied");
  };

  const handleScheduleAll = async () => {
    setLoading(true);
    try {
      await scheduleExpiryNotifications(labInventory);
      await scheduleCalibrationNotifications(labEquipment);
      await refresh();
      setLastSync(new Date().toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit" }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAll = async () => {
    Alert.alert("Скасувати всі?", "Усі заплановані нагадування буде видалено.", [
      { text: "Назад", style: "cancel" },
      {
        text: "Скасувати всі", style: "destructive",
        onPress: async () => { await cancelAllLabNotifications(); await refresh(); setLastSync(null); },
      },
    ]);
  };

  const handleTest = async () => {
    if (permission !== "granted") { await handleRequest(); return; }
    await triggerLocalAlert("🔬 Тестове сповіщення", "EdjuTERM успішно надсилає нагадування для вашої лабораторії", { type: "test" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const expiryCount = labInventory.filter(i => {
    if (!i.expirationDate) return false;
    return (new Date(i.expirationDate).getTime() - Date.now()) > 0;
  }).length;
  const calCount = labEquipment.filter(e => e.nextCalibration).length;

  return (
    <View style={{ gap: 16 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#ea580c18" }]}>
          <Icons.Bell size={20} color="#ea580c" strokeWidth={1.7} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Сповіщення</Text>
          <Text style={s.moduleSub}>{scheduled.length} активних нагадувань</Text>
        </View>
        {lastSync && (
          <View style={s.notifSyncBadge}>
            <Icons.CalendarCheck size={10} color={lab.ok} strokeWidth={2.5} />
            <Text style={s.notifSyncText}>{lastSync}</Text>
          </View>
        )}
      </View>

      <View style={[s.notifPermCard, { borderColor: permission === "granted" ? lab.ok + "40" : lab.amber + "40", backgroundColor: permission === "granted" ? lab.ok + "08" : lab.amber + "08" }]}>
        <View style={[s.notifPermIcon, { backgroundColor: permission === "granted" ? lab.ok + "18" : lab.amber + "18" }]}>
          {permission === "granted"
            ? <Icons.BadgeCheck size={22} color={lab.ok} strokeWidth={1.7} />
            : <Icons.BellOff    size={22} color={lab.amber} strokeWidth={1.7} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.notifPermTitle, { color: permission === "granted" ? lab.ok : lab.amber }]}>
            {permission === "granted" ? "Сповіщення дозволено" : permission === "denied" ? "Доступ заборонено" : "Доступ не надано"}
          </Text>
          <Text style={s.notifPermSub}>
            {permission === "granted"
              ? "Застосунок може надсилати локальні нагадування"
              : "Натисніть, щоб дозволити у системних налаштуваннях"}
          </Text>
        </View>
        {permission !== "granted" && (
          <Pressable onPress={handleRequest} style={s.notifPermBtn}>
            <Text style={s.notifPermBtnText}>Дозволити</Text>
          </Pressable>
        )}
      </View>

      <View style={s.notifSummaryRow}>
        <View style={s.notifSummaryCard}>
          <LinearGradient colors={["#dc262618", "#dc262606"]} style={s.notifSummaryIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icons.FlaskRound size={18} color="#dc2626" strokeWidth={1.7} />
          </LinearGradient>
          <Text style={s.notifSummaryNum}>{expiryCount}</Text>
          <Text style={s.notifSummarySub}>Реагентів{"\n"}з терміном</Text>
        </View>
        <View style={s.notifSummaryCard}>
          <LinearGradient colors={["#d9770618", "#d9770606"]} style={s.notifSummaryIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icons.CalendarClock size={18} color="#d97706" strokeWidth={1.7} />
          </LinearGradient>
          <Text style={s.notifSummaryNum}>{calCount}</Text>
          <Text style={s.notifSummarySub}>Приладів{"\n"}під калібрування</Text>
        </View>
        <View style={s.notifSummaryCard}>
          <LinearGradient colors={["#ea580c18", "#ea580c06"]} style={s.notifSummaryIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icons.BellRing size={18} color="#ea580c" strokeWidth={1.7} />
          </LinearGradient>
          <Text style={s.notifSummaryNum}>{scheduled.length}</Text>
          <Text style={s.notifSummarySub}>Запланованих{"\n"}нагадувань</Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable onPress={handleScheduleAll} disabled={loading}
          style={({ pressed }) => [s.notifActionBtn, { backgroundColor: "#ea580c" }, pressed && { opacity: 0.82 }, loading && { opacity: 0.6 }]}
        >
          {loading
            ? <Icons.RefreshCw size={18} color="white" strokeWidth={2} />
            : <Icons.CalendarCheck size={18} color="white" strokeWidth={2} />
          }
          <Text style={s.notifActionBtnText}>{loading ? "Планування…" : "Запланувати всі нагадування"}</Text>
        </Pressable>

        <Pressable onPress={handleTest}
          style={({ pressed }) => [s.notifActionBtn, { backgroundColor: "white", borderWidth: 1.5, borderColor: "#ea580c50" }, pressed && { opacity: 0.82 }]}
        >
          <Icons.Bell size={18} color="#ea580c" strokeWidth={2} />
          <Text style={[s.notifActionBtnText, { color: "#ea580c" }]}>Надіслати тестове сповіщення</Text>
        </Pressable>

        {scheduled.length > 0 && (
          <Pressable onPress={handleCancelAll}
            style={({ pressed }) => [s.notifActionBtn, { backgroundColor: "white", borderWidth: 1.5, borderColor: lab.danger + "40" }, pressed && { opacity: 0.82 }]}
          >
            <Icons.CircleX size={18} color={lab.danger} strokeWidth={2} />
            <Text style={[s.notifActionBtnText, { color: lab.danger }]}>Скасувати всі нагадування</Text>
          </Pressable>
        )}
      </View>

      {scheduled.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={s.sectionLabel}>ЗАПЛАНОВАНІ НАГАДУВАННЯ</Text>
          {scheduled.map(n => {
            const isExpiry  = n.identifier.startsWith("lab-expiry-");
            const color     = isExpiry ? "#dc2626" : "#d97706";
            const NIcon     = isExpiry ? Icons.FlaskRound : Icons.CalendarClock;
            const triggerDate = n.trigger?.value ? new Date(n.trigger.value).toLocaleDateString("uk-UA") : "—";
            return (
              <View key={n.identifier} style={[s.notifItem, { borderLeftColor: color }]}>
                <View style={[s.notifItemIcon, { backgroundColor: color + "14" }]}>
                  <NIcon size={16} color={color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.notifItemTitle}>{n.content.title}</Text>
                  <Text style={s.notifItemBody} numberOfLines={1}>{n.content.body}</Text>
                </View>
                <Text style={s.notifItemDate}>{triggerDate}</Text>
              </View>
            );
          })}
        </View>
      )}

      {scheduled.length === 0 && (
        <View style={s.emptyWrap}>
          <Icons.BellOff size={32} color={colors.mutedSoft} strokeWidth={1.5} />
          <Text style={s.emptyText}>Немає запланованих нагадувань</Text>
        </View>
      )}

      <View style={s.notifInfoCard}>
        <Icons.Info size={14} color="#0369a1" strokeWidth={2} />
        <Text style={s.notifInfoText}>
          Нагадування надсилаються за 7 днів до закінчення терміну придатності реагентів та дати калібрування обладнання.
        </Text>
      </View>
    </View>
  );
}
