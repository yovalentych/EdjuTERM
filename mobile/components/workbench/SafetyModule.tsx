import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "@/constants/theme";
import { type SafetyInspection, type SafetyCheckItem, type SafetyCheckResult } from "@/lib/mobile-store";
import { lab } from "./constants";
import { s } from "./styles";

const SAFETY_TEMPLATES: { id: string; name: string; icon: string; color: string; items: string[] }[] = [
  {
    id: "general", name: "Загальна безпека", icon: "shield", color: "#dc2626",
    items: [
      "Наявні та придатні засоби пожежогасіння",
      "Аптечка першої допомоги укомплектована",
      "Маршрути евакуації чисті та позначені",
      "Засоби індивідуального захисту доступні",
      "Журнал відвідувань ведеться",
      "Мобільний зв'язок доступний в лабораторії",
      "Розміщені інструкції з безпеки",
      "Контакти аварійних служб на видному місці",
    ],
  },
  {
    id: "chemicals", name: "Хімічне сховище", icon: "package", color: "#7c3aed",
    items: [
      "Реагенти зберігаються за сумісністю (не кислоти з основами)",
      "Леткі речовини зберігаються у витяжній шафі",
      "Всі ємності марковані згідно GHS",
      "Прострочені реагенти виявлені та відокремлені",
      "Журнал складу актуальний",
      "Холодильники для хімреагентів не містять їжі",
      "Відходи зібрані у позначені контейнери",
      "Вентиляція сховища справна",
    ],
  },
  {
    id: "equipment", name: "Стан обладнання", icon: "cpu", color: "#d97706",
    items: [
      "Калібрування приладів актуальне",
      "Кабелі та проводка без пошкоджень",
      "Автоклав/центрифуга пройшли технічне обслуговування",
      "Витяжна шафа перевірена та справна",
      "Захисне заземлення обладнання перевірено",
      "Прилади з дефектами позначені та виведені з роботи",
      "GLP-журнали обладнання актуальні",
    ],
  },
  {
    id: "biosafety", name: "Біобезпека", icon: "alert-triangle", color: "#047857",
    items: [
      "Автоклав для стерилізації відходів справний",
      "Біологічні зразки зберігаються у відповідних умовах",
      "Персонал має допуск BSL відповідного рівня",
      "Процедури деконтамінації поверхонь виконуються",
      "Засоби для розливів біоматеріалів доступні",
      "Журнал культур та зразків ведеться",
    ],
  },
];

export function SafetyModule({ inspections, onSave, onRemove, projectId, inspectorName }: {
  inspections: SafetyInspection[];
  onSave: (data: Omit<SafetyInspection, "id" | "projectId">) => SafetyInspection;
  onRemove: (id: string) => void;
  projectId: string | null;
  inspectorName: string;
}) {
  const [view, setView]         = useState<"list" | "run" | "detail">("list");
  const [template, setTemplate] = useState<typeof SAFETY_TEMPLATES[0] | null>(null);
  const [items, setItems]       = useState<SafetyCheckItem[]>([]);
  const [inspector, setInspector] = useState(inspectorName);
  const [selected, setSelected] = useState<SafetyInspection | null>(null);

  function startInspection(tmpl: typeof SAFETY_TEMPLATES[0]) {
    setTemplate(tmpl);
    setItems(tmpl.items.map((label, i) => ({ id: String(i), label, result: "ok" as SafetyCheckResult, comment: "" })));
    setInspector(inspectorName);
    setView("run");
  }

  function setResult(id: string, result: SafetyCheckResult) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, result } : it));
  }

  function handleComplete() {
    if (!template) return;
    const okCount   = items.filter(i => i.result === "ok").length;
    const failCount = items.filter(i => i.result === "fail").length;
    Alert.alert(
      "Завершити перевірку?",
      `✓ ${okCount} в нормі · ✗ ${failCount} порушень`,
      [
        { text: "Продовжити", style: "cancel" },
        { text: "Зберегти", onPress: () => {
          onSave({
            templateId: template.id, templateName: template.name,
            date: new Date().toISOString().split("T")[0],
            inspector: inspector.trim() || "Невідомо",
            items, completedAt: new Date().toISOString(),
          });
          setView("list");
          Alert.alert("GLP", "Перевірку безпеки збережено.");
        }},
      ]
    );
  }

  if (view === "run" && template) {
    const okCount   = items.filter(i => i.result === "ok").length;
    const failCount = items.filter(i => i.result === "fail").length;
    const naCount   = items.filter(i => i.result === "na").length;
    const done      = okCount + failCount + naCount;

    return (
      <View style={{ gap: 14 }}>
        <Pressable onPress={() => setView("list")} style={s.backBtn}>
          <Feather name="arrow-left" size={18} color="#dc2626" />
          <Text style={[s.backBtnText, { color: "#dc2626" }]}>Скасувати перевірку</Text>
        </Pressable>

        <View style={[s.safetyBanner, { borderColor: template.color + "40", backgroundColor: template.color + "0c" }]}>
          <View style={s.safetyBannerTop}>
            <View style={[s.safetyBannerIcon, { backgroundColor: template.color + "18" }]}>
              <Feather name={template.icon as any} size={20} color={template.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.safetyBannerTitle, { color: template.color }]}>{template.name}</Text>
              <Text style={s.safetyBannerSub}>{done}/{items.length} перевірено</Text>
            </View>
            <View style={s.safetyScoreRow}>
              {failCount > 0 && <Text style={s.failScore}>✗{failCount}</Text>}
              <Text style={s.okScore}>✓{okCount}</Text>
            </View>
          </View>
          <View style={s.safetyProgress}>
            <View style={[s.safetyProgressFill, { width: `${(done / items.length) * 100}%`, backgroundColor: failCount > 0 ? "#dc2626" : template.color }]} />
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[s.sectionLabel, { color: "#dc2626" }]}>ПУНКТИ ПЕРЕВІРКИ</Text>
          {items.map(item => (
            <View key={item.id} style={[s.checkItem, item.result === "fail" && s.checkItemFail]}>
              <Text style={s.checkLabel} numberOfLines={3}>{item.label}</Text>
              <View style={s.checkBtns}>
                {(["ok", "fail", "na"] as SafetyCheckResult[]).map(r => (
                  <Pressable key={r} onPress={() => setResult(item.id, r)}
                    style={[s.checkBtn,
                      r === "ok"   && item.result === "ok"   && s.checkBtnOk,
                      r === "fail" && item.result === "fail" && s.checkBtnFail,
                      r === "na"   && item.result === "na"   && s.checkBtnNa,
                    ]}>
                    <Text style={[s.checkBtnText,
                      r === "ok"   && item.result === "ok"   && { color: lab.ok },
                      r === "fail" && item.result === "fail" && { color: lab.danger },
                      r === "na"   && item.result === "na"   && { color: lab.neutral },
                    ]}>
                      {r === "ok" ? "✓ OK" : r === "fail" ? "✗ НІ" : "N/A"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={s.sectionLabel}>ІНСПЕКТОР</Text>
          <TextInput value={inspector} onChangeText={setInspector} style={s.inspectorInput} placeholder="ПІБ інспектора" />
        </View>

        <Pressable onPress={handleComplete} style={[s.safetyCompleteBtn, { backgroundColor: failCount > 0 ? "#dc2626" : lab.ok }]}>
          <Feather name="check-circle" size={18} color="white" />
          <Text style={s.safetyCompleteBtnText}>
            {failCount > 0 ? `Завершити (${failCount} порушень)` : "Завершити перевірку"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (view === "detail" && selected) {
    const okCount   = selected.items.filter(i => i.result === "ok").length;
    const failCount = selected.items.filter(i => i.result === "fail").length;
    const naCount   = selected.items.filter(i => i.result === "na").length;
    const pct       = Math.round((okCount / selected.items.length) * 100);

    return (
      <View style={{ gap: 14 }}>
        <Pressable onPress={() => setView("list")} style={s.backBtn}>
          <Feather name="arrow-left" size={18} color="#dc2626" />
          <Text style={[s.backBtnText, { color: "#dc2626" }]}>До списку</Text>
        </Pressable>

        <View style={s.safetyDetailCard}>
          <View style={s.safetyDetailTop}>
            <Text style={s.safetyDetailName}>{selected.templateName}</Text>
            <View style={[s.safetyScoreBig, { backgroundColor: failCount > 0 ? "#dc262618" : "#04785718" }]}>
              <Text style={[s.safetyScoreBigText, { color: failCount > 0 ? "#dc2626" : "#047857" }]}>{pct}%</Text>
            </View>
          </View>
          <Text style={s.safetyDetailMeta}>Інспектор: {selected.inspector} · {selected.date}</Text>
          <View style={s.safetyDetailStats}>
            <Text style={[s.safetyStatText, { color: lab.ok }]}>✓ {okCount} в нормі</Text>
            {failCount > 0 && <Text style={[s.safetyStatText, { color: lab.danger }]}>✗ {failCount} порушень</Text>}
            {naCount   > 0 && <Text style={[s.safetyStatText, { color: lab.neutral }]}>— {naCount} N/A</Text>}
          </View>
        </View>

        {failCount > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: lab.danger }]}>ПОРУШЕННЯ</Text>
            {selected.items.filter(i => i.result === "fail").map(it => (
              <View key={it.id} style={s.failItem}>
                <Feather name="x-circle" size={14} color={lab.danger} />
                <Text style={s.failItemText}>{it.label}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.sectionLabel}>ВСІ ПУНКТИ</Text>
        {selected.items.map(it => (
          <View key={it.id} style={s.detailItem}>
            <Text style={[s.detailItemResult,
              it.result === "ok" && { color: lab.ok },
              it.result === "fail" && { color: lab.danger },
              it.result === "na" && { color: lab.neutral },
            ]}>
              {it.result === "ok" ? "✓" : it.result === "fail" ? "✗" : "—"}
            </Text>
            <Text style={s.detailItemLabel}>{it.label}</Text>
          </View>
        ))}

        <View style={s.dangerZone}>
          <Text style={s.dangerTitle}>Небезпечна зона</Text>
          <Pressable style={s.removeInspBtn} onPress={() => Alert.alert("Видалити?", "Записи перевірки буде видалено.", [
            { text: "Скасувати", style: "cancel" },
            { text: "Видалити", style: "destructive", onPress: () => { onRemove(selected.id); setView("list"); }},
          ])}>
            <Feather name="trash-2" size={14} color={lab.danger} />
            <Text style={s.removeInspBtnText}>Видалити запис перевірки</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#dc262618" }]}>
          <Feather name="shield" size={20} color="#dc2626" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Перевірки безпеки GLP</Text>
          <Text style={s.moduleSub}>{inspections.length} перевірок збережено</Text>
        </View>
      </View>

      <Text style={[s.sectionLabel, { color: "#dc2626" }]}>ОБЕРІТЬ ШАБЛОН ПЕРЕВІРКИ</Text>
      {SAFETY_TEMPLATES.map(tmpl => {
        const lastInsp  = inspections.find(i => i.templateId === tmpl.id);
        const lastFails = lastInsp?.items.filter(i => i.result === "fail").length || 0;
        return (
          <Pressable key={tmpl.id} onPress={() => startInspection(tmpl)}
            style={({ pressed }) => [s.safetyTmpl, { borderLeftColor: tmpl.color }, pressed && { opacity: 0.75 }]}>
            <View style={[s.safetyTmplIcon, { backgroundColor: tmpl.color + "18" }]}>
              <Feather name={tmpl.icon as any} size={20} color={tmpl.color} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.safetyTmplName}>{tmpl.name}</Text>
              <Text style={s.safetyTmplSub}>{tmpl.items.length} пунктів</Text>
              {lastInsp && (
                <Text style={[s.safetyTmplLast, lastFails > 0 && { color: lab.danger }]}>
                  Остання: {lastInsp.date} {lastFails > 0 ? `· ✗ ${lastFails} порушень` : "· ✓ OK"}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={16} color={colors.border} />
          </Pressable>
        );
      })}

      {inspections.length > 0 && (
        <>
          <Text style={s.sectionLabel}>ІСТОРІЯ ПЕРЕВІРОК</Text>
          {inspections.slice(0, 10).map(insp => {
            const okPct = Math.round((insp.items.filter(i => i.result === "ok").length / insp.items.length) * 100);
            const fails = insp.items.filter(i => i.result === "fail").length;
            return (
              <Pressable key={insp.id} onPress={() => { setSelected(insp); setView("detail"); }}
                style={({ pressed }) => [s.inspHistCard, pressed && { opacity: 0.75 }]}>
                <View style={[s.inspHistLeft, { backgroundColor: fails > 0 ? "#dc262618" : "#04785718" }]}>
                  <Text style={[s.inspHistPct, { color: fails > 0 ? "#dc2626" : "#047857" }]}>{okPct}%</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.inspHistName}>{insp.templateName}</Text>
                  <Text style={s.inspHistMeta}>{insp.date} · {insp.inspector}</Text>
                  {fails > 0 && <Text style={{ fontSize: 11, color: lab.danger }}>✗ {fails} порушень</Text>}
                </View>
                <Feather name="chevron-right" size={16} color={colors.border} />
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}
