import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ─── Global handler ───────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

const EXPIRY_PREFIX = "lab-expiry-";
const CAL_PREFIX    = "lab-cal-";

// ─── Permission ───────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("lab-alerts", {
      name:             "Лабораторні сповіщення",
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       "#0f766e",
    });
  }
  return true;
}

export async function getPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as any;
}

// ─── Immediate / test alert ───────────────────────────────────────────────────
export async function triggerLocalAlert(title: string, body: string, data?: Record<string, unknown>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: null,
  });
}

// Kept for backwards compatibility
export async function scheduleNotification(title: string, body: string, seconds = 2) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: {} },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

// Kept for backwards compatibility
export async function registerForPushNotificationsAsync() {
  return requestNotificationPermission();
}

// ─── Reagent expiry scheduling ────────────────────────────────────────────────
export async function scheduleExpiryNotifications(items: any[]) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(n => n.identifier.startsWith(EXPIRY_PREFIX))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  const now = Date.now();
  for (const item of items) {
    if (!item.expirationDate) continue;
    const expiry   = new Date(item.expirationDate).getTime();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diffDays <= 0) continue;

    // Notify 7 days before; if < 7 days left — schedule in 30 s (demo)
    const triggerDate =
      diffDays > 7
        ? new Date(expiry - 7 * 24 * 60 * 60 * 1000)
        : new Date(now + 30_000);

    await Notifications.scheduleNotificationAsync({
      identifier: EXPIRY_PREFIX + item._id,
      content: {
        title: "⚗️ Термін придатності спливає",
        body:  `${item.name} — залишилось ${Math.ceil(diffDays)} дн.`,
        data:  { type: "expiry", itemId: item._id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  }
}

// ─── Equipment calibration scheduling ────────────────────────────────────────
export async function scheduleCalibrationNotifications(equipment: any[]) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(n => n.identifier.startsWith(CAL_PREFIX))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  const now = Date.now();
  for (const eq of equipment) {
    if (!eq.nextCalibration) continue;
    const calDate  = new Date(eq.nextCalibration).getTime();
    const diffDays = (calDate - now) / (1000 * 60 * 60 * 24);
    if (diffDays <= 0) continue;

    const triggerDate =
      diffDays > 7
        ? new Date(calDate - 7 * 24 * 60 * 60 * 1000)
        : new Date(now + 30_000);

    await Notifications.scheduleNotificationAsync({
      identifier: CAL_PREFIX + eq._id,
      content: {
        title: "🔬 Калібрування через 7 днів",
        body:  `${eq.name} — запишіть технічне обслуговування`,
        data:  { type: "calibration", equipmentId: eq._id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  }
}

// ─── Cancel / list ────────────────────────────────────────────────────────────
export async function cancelAllLabNotifications() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(n => n.identifier.startsWith(EXPIRY_PREFIX) || n.identifier.startsWith(CAL_PREFIX))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function getScheduledLabNotifications() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter(
    n => n.identifier.startsWith(EXPIRY_PREFIX) || n.identifier.startsWith(CAL_PREFIX)
  );
}
