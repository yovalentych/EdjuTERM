import { View, Text, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ActionButton } from "@/components/ui";
import { colors } from "@/constants/theme";
import { type LabEquipment, useMobileStore } from "@/lib/mobile-store";
import { lab } from "./constants";
import { s } from "./styles";

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  operational:    { color: lab.ok,      label: "Працює",     icon: "check-circle" },
  maintenance:    { color: lab.amber,   label: "Обслугов.",  icon: "tool" },
  out_of_order:   { color: lab.danger,  label: "Несправний", icon: "alert-octagon" },
  decommissioned: { color: lab.neutral, label: "Списаний",   icon: "slash" },
};

export function EquipmentModule({ equipment }: { equipment: LabEquipment[] }) {
  const { fetchLabEquipmentLogs, labEquipmentLogs, addEquipmentLog } = useMobileStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = equipment.find(e => e._id === selectedId);

  if (selected) {
    const cfg     = STATUS_CONFIG[selected.status] || STATUS_CONFIG.operational;
    const cal     = selected.nextCalibrationDate ? new Date(selected.nextCalibrationDate) : null;
    const calDays = cal ? Math.floor((cal.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;

    return (
      <View style={{ gap: 14 }}>
        <ActionButton label="До списку" variant="ghost" icon="arrow-left" onPress={() => setSelectedId(null)} />

        <LinearGradient colors={[lab.dark, lab.mid]} style={s.equipDetailBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.equipStatusRow}>
            <View style={[s.equipStatusDot, { backgroundColor: cfg.color }]} />
            <Text style={[s.equipStatusLabel, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
          </View>
          <Text style={s.equipDetailName}>{selected.name}</Text>
          <Text style={s.equipDetailModel}>{selected.manufacturer} · {selected.model}</Text>
          <Text style={s.equipDetailSN}>S/N: <Text style={s.mono}>{selected.serialNumber}</Text></Text>
          <View style={s.equipDetailMeta}>
            <Feather name="map-pin" size={11} color={lab.soft + "80"} />
            <Text style={s.equipDetailMetaText}>{selected.location || "—"}</Text>
          </View>
        </LinearGradient>

        {calDays !== null && calDays < 60 && (
          <View style={[s.calAlert, { borderColor: calDays < 14 ? lab.danger + "50" : lab.amber + "50", backgroundColor: calDays < 14 ? lab.danger + "0a" : lab.amber + "0a" }]}>
            <Feather name="clock" size={14} color={calDays < 14 ? lab.danger : lab.amber} />
            <Text style={[s.calAlertText, { color: calDays < 14 ? lab.danger : lab.amber }]}>
              {calDays < 0 ? "Калібрування прострочено!" : `Наступне калібрування через ${calDays} дн.`}
            </Text>
          </View>
        )}

        <Text style={s.sectionLabel}>GLP — ЖУРНАЛ ВИКОРИСТАННЯ</Text>
        <ActionButton
          label="Зафіксувати використання"
          icon="play"
          onPress={() => {
            addEquipmentLog(selected._id, { type: "usage", description: "Мобільний запис" });
            Alert.alert("GLP", "Сесія зафіксована у журналі.");
          }}
        />

        {(labEquipmentLogs[selected._id] || []).length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>Записів поки немає</Text>
          </View>
        ) : (
          (labEquipmentLogs[selected._id] || []).map(log => (
            <View key={log._id} style={s.glpLogItem}>
              <View style={[s.glpLogType, { backgroundColor: log.type === "calibration" ? lab.accent + "20" : log.type === "failure_report" ? lab.danger + "15" : "#f1f5f9" }]}>
                <Text style={[s.glpLogTypeText, { color: log.type === "failure_report" ? lab.danger : lab.accent }]}>
                  {log.type === "usage" ? "USE" : log.type === "maintenance" ? "MNT" : log.type === "calibration" ? "CAL" : "ERR"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.glpLogDesc}>{log.description}</Text>
                <Text style={s.glpLogDate}>{new Date(log.createdAt).toLocaleString("uk-UA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: lab.amber + "18" }]}>
          <Feather name="cpu" size={20} color={lab.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Обладнання</Text>
          <Text style={s.moduleSub}>{equipment.length} приладів · {equipment.filter(e => e.status === "operational").length} у роботі</Text>
        </View>
      </View>

      {equipment.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="cpu" size={36} color={colors.mutedSoft} />
          <Text style={s.emptyText}>Обладнання не додано</Text>
        </View>
      ) : (
        equipment.map(eq => {
          const cfg     = STATUS_CONFIG[eq.status] || STATUS_CONFIG.operational;
          const cal     = eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate) : null;
          const calDays = cal ? Math.floor((cal.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;
          return (
            <Pressable key={eq._id} onPress={() => { setSelectedId(eq._id); fetchLabEquipmentLogs(eq._id); }}
              style={({ pressed }) => [s.equipCard, pressed && { opacity: 0.75 }]}>
              <View style={[s.equipStatusStrip, { backgroundColor: cfg.color }]} />
              <View style={s.equipIconWrap}>
                <Feather name={cfg.icon as any} size={18} color={cfg.color} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.equipName}>{eq.name}</Text>
                <Text style={s.equipModel}>{eq.manufacturer} {eq.model}</Text>
                {calDays !== null && calDays < 30 && (
                  <Text style={[s.calBadge, { color: calDays < 14 ? lab.danger : lab.amber }]}>
                    ⏰ Калібрування через {calDays} дн.
                  </Text>
                )}
              </View>
              <View style={[s.equipStatusTag, { backgroundColor: cfg.color + "18" }]}>
                <Text style={[s.equipStatusTagText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.border} style={{ marginLeft: 4 }} />
            </Pressable>
          );
        })
      )}
    </View>
  );
}
