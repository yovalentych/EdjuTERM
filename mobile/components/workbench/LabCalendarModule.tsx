import { View, Text, Pressable, TextInput, Alert } from "react-native";
import * as Icons from "lucide-react-native";
import { useState } from "react";
import { Calendar } from "react-native-calendars";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";
import { type LabBooking } from "@/lib/mobile-store";
import { lab } from "./constants";
import { s } from "./styles";

function BookingCard({ booking: b, onCancel, currentUserId }: { booking: LabBooking; onCancel: (id: string) => void; currentUserId: string }) {
  const isOwn = b.userId === currentUserId;
  return (
    <View style={s.bookingCard}>
      <View style={s.bookingTimeCol}>
        <Text style={s.bookingStart}>{b.startTime}</Text>
        <View style={s.bookingTimeLine} />
        <Text style={s.bookingEnd}>{b.endTime}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.bookingEqName}>{b.equipmentName}</Text>
        <Text style={s.bookingPurpose} numberOfLines={2}>{b.purpose}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
          <Icons.UserCheck size={11} color={colors.muted} strokeWidth={2} />
          <Text style={s.bookingUser}>{b.userName}</Text>
        </View>
      </View>
      {isOwn && (
        <Pressable
          onPress={() => Alert.alert("Скасувати?", `Бронювання "${b.equipmentName}" ${b.date}`, [
            { text: "Ні", style: "cancel" },
            { text: "Скасувати", style: "destructive", onPress: () => onCancel(b.id) },
          ])}
          style={s.bookingCancelBtn}
        >
          <Icons.X size={14} color={lab.danger} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}

export function LabCalendarModule({ bookings, equipment, onAdd, onCancel, userName, userId }: {
  bookings: LabBooking[];
  equipment: any[];
  onAdd: (data: any) => LabBooking | null;
  onCancel: (id: string) => void;
  userName: string;
  userId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [tab, setTab]               = useState<"calendar" | "mine" | "new">("calendar");
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm]             = useState({ equipmentId: "", equipmentName: "", startTime: "09:00", endTime: "11:00", purpose: "" });
  const [saving, setSaving]         = useState(false);

  const confirmed = bookings.filter(b => b.status === "confirmed");

  const markedDates = confirmed.reduce<Record<string, any>>((acc, b) => {
    acc[b.date] = {
      marked: true, dotColor: "#0891b2",
      ...(b.date === selectedDate ? { selected: true, selectedColor: "#0891b2" } : {}),
    };
    return acc;
  }, { [selectedDate]: { selected: true, selectedColor: "#0891b2" } });

  const dayBookings = confirmed.filter(b => b.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const myBookings  = confirmed.filter(b => b.userId === userId && b.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const handleSave = () => {
    if (!form.equipmentId || !form.purpose.trim()) {
      Alert.alert("Заповніть всі поля", "Оберіть обладнання та вкажіть мету бронювання."); return;
    }
    if (form.startTime >= form.endTime) {
      Alert.alert("Помилка", "Час початку має бути раніше за час завершення."); return;
    }
    setSaving(true);
    const result = onAdd({ equipmentId: form.equipmentId, equipmentName: form.equipmentName, userId, userName, date: selectedDate, startTime: form.startTime, endTime: form.endTime, purpose: form.purpose.trim() });
    setSaving(false);
    if (!result) {
      Alert.alert("Конфлікт бронювання", "Це обладнання вже заброньовано на обраний час. Оберіть інший часовий слот.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setForm({ equipmentId: "", equipmentName: "", startTime: "09:00", endTime: "11:00", purpose: "" });
      setTab("calendar");
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#0891b218" }]}>
          <Icons.CalendarDays size={20} color="#0891b2" strokeWidth={1.7} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Розклад лабораторії</Text>
          <Text style={s.moduleSub}>{confirmed.length} активних бронювань</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {([["calendar", "Календар"], ["mine", "Мої"], ["new", "Нове"]] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={[s.filterTab, tab === id && s.filterTabActive]}>
            <Text style={[s.filterTabText, tab === id && { color: "#0891b2" }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "calendar" && (
        <View style={{ gap: 14 }}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: "#0891b2",
              todayTextColor: "#0891b2",
              arrowColor: "#0891b2",
              dotColor: "#0891b2",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              calendarBackground: "white",
              textSectionTitleColor: "#64748b",
              dayTextColor: "#0f172a",
            }}
            style={s.calendarWidget}
          />
          <Text style={s.sectionLabel}>
            {selectedDate === today ? "СЬОГОДНІ" : selectedDate.split("-").reverse().join(".")}
          </Text>
          {dayBookings.length === 0 ? (
            <View style={s.emptyWrap}>
              <Icons.CalendarCheck size={30} color={colors.mutedSoft} strokeWidth={1.5} />
              <Text style={s.emptyText}>Бронювань немає</Text>
            </View>
          ) : (
            dayBookings.map(b => <BookingCard key={b.id} booking={b} onCancel={onCancel} currentUserId={userId} />)
          )}
        </View>
      )}

      {tab === "mine" && (
        <View style={{ gap: 10 }}>
          {myBookings.length === 0 ? (
            <View style={s.emptyWrap}>
              <Icons.CalendarDays size={30} color={colors.mutedSoft} strokeWidth={1.5} />
              <Text style={s.emptyText}>У вас немає майбутніх бронювань</Text>
            </View>
          ) : (
            myBookings.map(b => <BookingCard key={b.id} booking={b} onCancel={onCancel} currentUserId={userId} />)
          )}
        </View>
      )}

      {tab === "new" && (
        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text style={s.formLabel}>Обладнання *</Text>
            <View style={{ gap: 8 }}>
              {equipment.filter(e => e.status === "operational").map(eq => (
                <Pressable key={eq._id} onPress={() => setForm(f => ({ ...f, equipmentId: eq._id, equipmentName: eq.name }))}
                  style={[s.eqPickerRow, form.equipmentId === eq._id && s.eqPickerRowActive]}>
                  <View style={[s.eqPickerDot, { backgroundColor: form.equipmentId === eq._id ? "#0891b2" : colors.border }]} />
                  <Text style={[s.eqPickerLabel, form.equipmentId === eq._id && { color: "#0891b2" }]}>{eq.name}</Text>
                  {form.equipmentId === eq._id && <Icons.CircleCheck size={16} color="#0891b2" strokeWidth={2} />}
                </Pressable>
              ))}
              {equipment.filter(e => e.status === "operational").length === 0 && (
                <Text style={s.emptyText}>Немає справного обладнання</Text>
              )}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={s.formLabel}>Дата *</Text>
            <TextInput style={s.formInput} value={selectedDate} onChangeText={v => setSelectedDate(v)} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedSoft} />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.formLabel}>Початок</Text>
              <View style={s.timePickerWrap}>
                {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t => (
                  <Pressable key={t} onPress={() => setForm(f => ({ ...f, startTime: t }))} style={[s.timeChip, form.startTime === t && s.timeChipActive]}>
                    <Text style={[s.timeChipText, form.startTime === t && { color: "#0891b2" }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.formLabel}>Кінець</Text>
              <View style={s.timePickerWrap}>
                {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"].map(t => (
                  <Pressable key={t} onPress={() => setForm(f => ({ ...f, endTime: t }))} style={[s.timeChip, form.endTime === t && s.timeChipActive]}>
                    <Text style={[s.timeChipText, form.endTime === t && { color: "#0891b2" }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={s.formLabel}>Мета використання *</Text>
            <TextInput
              style={[s.formInput, { minHeight: 80, textAlignVertical: "top" }]}
              value={form.purpose}
              onChangeText={v => setForm(f => ({ ...f, purpose: v }))}
              placeholder="Наприклад: вимірювання оптичної густини зразків…"
              placeholderTextColor={colors.mutedSoft}
              multiline
            />
          </View>

          <Pressable onPress={handleSave} disabled={saving}
            style={({ pressed }) => [s.notifActionBtn, { backgroundColor: "#0891b2" }, pressed && { opacity: 0.82 }]}
          >
            <Icons.CalendarCheck size={18} color="white" strokeWidth={2} />
            <Text style={s.notifActionBtnText}>Забронювати</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
