import { View, Text, Pressable, TextInput } from "react-native";
import * as Icons from "lucide-react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";
import { type LabAccessLog, type BslLevel, type LabEquipmentAccess } from "@/lib/mobile-store";
import { lab } from "./constants";
import { s } from "./styles";

const BSL_LEVELS: BslLevel[] = ["BSL-1", "BSL-2", "BSL-3", "BSL-4"];
const BSL_COLOR: Record<BslLevel, string> = {
  "BSL-1": lab.ok,
  "BSL-2": lab.amber,
  "BSL-3": "#ea580c",
  "BSL-4": lab.danger,
};
function bslNum(bsl: BslLevel) { return parseInt(bsl.replace("BSL-", "")); }

export function AccessControlModule({ logs, equipment, equipmentAccess, onLog, onSetBsl, projectBsl, userName, userId }: {
  logs: LabAccessLog[];
  equipment: any[];
  equipmentAccess: LabEquipmentAccess[];
  onLog: (action: LabAccessLog["action"], zone: BslLevel, notes?: string) => void;
  onSetBsl: (equipmentId: string, bsl: BslLevel) => void;
  projectBsl: BslLevel;
  userName: string;
  userId: string;
}) {
  const [tab, setTab]   = useState<"status" | "journal" | "equipment">("status");
  const [zone, setZone] = useState<BslLevel>(projectBsl);
  const [notes, setNotes] = useState("");

  const myLastLog    = logs.find(l => l.userId === userId);
  const isInLab      = myLastLog?.action === "enter";
  const projectBslNum = bslNum(projectBsl);

  const getBsl      = (eqId: string): BslLevel => equipmentAccess.find(e => e.equipmentId === eqId)?.bslRequired ?? "BSL-1";
  const canAccess   = (eqId: string) => bslNum(getBsl(eqId)) <= projectBslNum;

  const handleToggle = () => {
    onLog(isInLab ? "exit" : "enter", zone, notes.trim());
    setNotes("");
    Haptics.notificationAsync(isInLab ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#b91c1c18" }]}>
          <Icons.ShieldAlert size={20} color="#b91c1c" strokeWidth={1.7} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Доступ BSL</Text>
          <Text style={s.moduleSub}>Рівень проєкту: {projectBsl} · {logs.length} записів у журналі</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {([["status", "Статус"], ["journal", "Журнал"], ["equipment", "Обладнання"]] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={[s.filterTab, tab === id && s.filterTabActive]}>
            <Text style={[s.filterTabText, tab === id && { color: "#b91c1c" }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "status" && (
        <View style={{ gap: 14 }}>
          <LinearGradient
            colors={isInLab ? [lab.ok + "20", lab.ok + "08"] : ["#f1f5f9", "#f8fafc"]}
            style={s.accessStatusCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={[s.accessStatusIcon, { backgroundColor: isInLab ? lab.ok + "20" : "#e2e8f0" }]}>
              {isInLab
                ? <Icons.DoorOpen   size={28} color={lab.ok}    strokeWidth={1.5} />
                : <Icons.DoorClosed size={28} color={colors.muted} strokeWidth={1.5} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.accessStatusTitle, { color: isInLab ? lab.ok : colors.muted }]}>
                {isInLab ? "Ви у лабораторії" : "Ви поза лабораторією"}
              </Text>
              {myLastLog && (
                <Text style={s.accessStatusSub}>
                  {isInLab ? "Вхід" : "Вихід"}: {new Date(myLastLog.timestamp).toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  {myLastLog.zone !== "BSL-1" && ` · ${myLastLog.zone}`}
                </Text>
              )}
            </View>
            <View style={[s.bslIndicator, { borderColor: BSL_COLOR[projectBsl] }]}>
              <Text style={[s.bslIndicatorText, { color: BSL_COLOR[projectBsl] }]}>{projectBsl}</Text>
            </View>
          </LinearGradient>

          <View style={{ gap: 8 }}>
            <Text style={s.formLabel}>BSL-зона входу</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {BSL_LEVELS.filter(b => bslNum(b) <= projectBslNum).map(b => (
                <Pressable key={b} onPress={() => setZone(b)}
                  style={[s.bslChip, { borderColor: BSL_COLOR[b] + "60" }, zone === b && { backgroundColor: BSL_COLOR[b] + "18", borderColor: BSL_COLOR[b] }]}
                >
                  <Text style={[s.bslChipText, { color: zone === b ? BSL_COLOR[b] : colors.muted }]}>{b}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            style={s.formInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={isInLab ? "Причина виходу (необов'язково)" : "Мета відвідування (необов'язково)"}
            placeholderTextColor={colors.mutedSoft}
          />

          <Pressable onPress={handleToggle}
            style={({ pressed }) => [s.accessToggleBtn, { backgroundColor: isInLab ? lab.danger : lab.ok }, pressed && { opacity: 0.82 }]}
          >
            {isInLab
              ? <Icons.LogOut size={20} color="white" strokeWidth={2} />
              : <Icons.LogIn  size={20} color="white" strokeWidth={2} />
            }
            <Text style={s.accessToggleBtnText}>{isInLab ? "Зафіксувати вихід" : "Зафіксувати вхід"}</Text>
          </Pressable>

          <View style={s.notifInfoCard}>
            <Icons.Info size={14} color="#0369a1" strokeWidth={2} />
            <Text style={s.notifInfoText}>
              BSL-{projectBslNum} — рівень безпеки вашого проєкту. Журнал фіксує час та зону доступу відповідно до вимог GLP.
            </Text>
          </View>
        </View>
      )}

      {tab === "journal" && (
        <View style={{ gap: 10 }}>
          {logs.length === 0 ? (
            <View style={s.emptyWrap}>
              <Icons.ShieldAlert size={30} color={colors.mutedSoft} strokeWidth={1.5} />
              <Text style={s.emptyText}>Журнал порожній</Text>
            </View>
          ) : (
            logs.slice(0, 50).map(l => {
              const isEnter  = l.action === "enter";
              const bslColor = BSL_COLOR[l.zone] || lab.ok;
              return (
                <View key={l.id} style={[s.accessLogCard, { borderLeftColor: isEnter ? lab.ok : lab.danger }]}>
                  <View style={[s.accessLogIcon, { backgroundColor: (isEnter ? lab.ok : lab.danger) + "14" }]}>
                    {isEnter
                      ? <Icons.LogIn  size={16} color={lab.ok}    strokeWidth={2} />
                      : <Icons.LogOut size={16} color={lab.danger} strokeWidth={2} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={s.accessLogAction}>{isEnter ? "Вхід" : "Вихід"}</Text>
                      <View style={[s.bslMicroBadge, { backgroundColor: bslColor + "18" }]}>
                        <Text style={[s.bslMicroText, { color: bslColor }]}>{l.zone}</Text>
                      </View>
                    </View>
                    <Text style={s.accessLogUser}>{l.userName || "—"}</Text>
                    {!!l.notes && <Text style={s.accessLogNotes}>{l.notes}</Text>}
                  </View>
                  <Text style={s.accessLogTime}>
                    {new Date(l.timestamp).toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}

      {tab === "equipment" && (
        <View style={{ gap: 10 }}>
          <View style={s.notifInfoCard}>
            <Icons.Info size={14} color="#0369a1" strokeWidth={2} />
            <Text style={s.notifInfoText}>
              Встановіть мінімальний рівень BSL для кожного приладу. Зелений — доступний за рівнем вашого проєкту ({projectBsl}).
            </Text>
          </View>
          {equipment.map(eq => {
            const required   = getBsl(eq._id);
            const accessible = canAccess(eq._id);
            const reqColor   = BSL_COLOR[required];
            return (
              <View key={eq._id} style={[s.accessEqCard, { borderLeftColor: accessible ? lab.ok : lab.danger }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={s.accessEqName}>{eq.name}</Text>
                    {accessible
                      ? <Icons.CircleCheck size={14} color={lab.ok}    strokeWidth={2.5} />
                      : <Icons.ShieldBan   size={14} color={lab.danger} strokeWidth={2.5} />
                    }
                  </View>
                  <Text style={s.accessEqSub}>Потребує: {required}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {BSL_LEVELS.map(b => (
                    <Pressable key={b} onPress={() => onSetBsl(eq._id, b)}
                      style={[s.bslStepBtn, { borderColor: BSL_COLOR[b] + "60" }, required === b && { backgroundColor: BSL_COLOR[b] + "20", borderColor: BSL_COLOR[b] }]}
                    >
                      <Text style={[s.bslStepText, { color: required === b ? BSL_COLOR[b] : colors.mutedSoft }]}>
                        {b.replace("BSL-", "")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
          {equipment.length === 0 && (
            <View style={s.emptyWrap}>
              <Icons.Microscope size={28} color={colors.mutedSoft} strokeWidth={1.5} />
              <Text style={s.emptyText}>Немає обладнання</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
