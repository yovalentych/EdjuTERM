import { View, Text, Pressable } from "react-native";
import * as Icons from "lucide-react-native";
import { useState } from "react";
import { MotiView } from "moti";
import { PieChart } from "react-native-gifted-charts";
import { colors } from "@/constants/theme";
import { s } from "./styles";

const ANALYTICS_TABS = [
  { id: "reagents",  label: "Реагенти",   Icon: Icons.TestTubes },
  { id: "equipment", label: "Обладнання", Icon: Icons.Microscope },
  { id: "activity",  label: "Активність", Icon: Icons.Activity },
] as const;

type AnalyticsTab = "reagents" | "equipment" | "activity";

function KpiCard({ value, label, color, Icon }: any) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 15 }}
      style={s.kpiCard}
    >
      <Icon size={16} color={color} strokeWidth={1.8} />
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </MotiView>
  );
}

function AnalLegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={{ gap: 3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ fontSize: 11, color: colors.muted }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: "900", color }}>{value}</Text>
      </View>
      <View style={[s.wasteProgBar, { height: 4 }]}>
        <MotiView
          from={{ width: "0%" }} animate={{ width: `${pct}%` }}
          transition={{ type: "timing", duration: 600 }}
          style={[s.wasteProgFill, { backgroundColor: color, height: 4 }]}
        />
      </View>
    </View>
  );
}

export function AnalyticsModule({ labInventory, labEquipment, labExperiments, diaryEntries, wasteRecords, safetyInspections }: any) {
  const [tab, setTab] = useState<AnalyticsTab>("reagents");

  const invTotal   = labInventory.length;
  const inStock    = labInventory.filter((i: any) => i.status === "in_stock").length;
  const lowStock   = labInventory.filter((i: any) => i.status === "low_stock").length;
  const depleted   = labInventory.filter((i: any) => i.status === "depleted").length;
  const expired    = labInventory.filter((i: any) => i.status === "expired").length;

  const reagentPie = invTotal > 0 ? [
    inStock  > 0 ? { value: inStock,  color: "#059669" } : null,
    lowStock > 0 ? { value: lowStock, color: "#d97706" } : null,
    depleted > 0 ? { value: depleted, color: "#dc2626" } : null,
    expired  > 0 ? { value: expired,  color: "#94a3b8" } : null,
  ].filter(Boolean) as any[] : [{ value: 1, color: "#e2e8f0" }];

  const expiringSoon = labInventory.filter((i: any) => {
    if (!i.expirationDate) return false;
    const d = new Date(i.expirationDate).getTime() - Date.now();
    return d > 0 && d < 30 * 24 * 3600 * 1000;
  });
  const expiredItems = labInventory.filter((i: any) => {
    if (!i.expirationDate) return false;
    return new Date(i.expirationDate).getTime() < Date.now();
  });

  const eqTotal     = labEquipment.length;
  const operational = labEquipment.filter((e: any) => e.status === "operational").length;
  const maintenance = labEquipment.filter((e: any) => e.status === "maintenance").length;
  const outOfOrder  = labEquipment.filter((e: any) => e.status === "out_of_order").length;

  const equipPie = eqTotal > 0 ? [
    operational > 0 ? { value: operational, color: "#059669" } : null,
    maintenance > 0 ? { value: maintenance, color: "#d97706" } : null,
    outOfOrder  > 0 ? { value: outOfOrder,  color: "#dc2626" } : null,
  ].filter(Boolean) as any[] : [{ value: 1, color: "#e2e8f0" }];

  const upcomingCals = labEquipment
    .filter((e: any) => e.nextCalibrationDate)
    .map((e: any) => ({ ...e, calDays: Math.floor((new Date(e.nextCalibrationDate).getTime() - Date.now()) / (24 * 3600 * 1000)) }))
    .filter((e: any) => e.calDays < 60)
    .sort((a: any, b: any) => a.calDays - b.calDays);

  const expByStatus = {
    planned:   labExperiments.filter((e: any) => e.status === "planned").length,
    active:    labExperiments.filter((e: any) => e.status === "active").length,
    completed: labExperiments.filter((e: any) => e.status === "completed").length,
    failed:    labExperiments.filter((e: any) => e.status === "failed").length,
    paused:    labExperiments.filter((e: any) => e.status === "paused").length,
  };
  const totalExps  = labExperiments.length;
  const successRate = totalExps > 0 ? Math.round((expByStatus.completed / totalExps) * 100) : 0;

  const glpTotal   = diaryEntries.length;
  const todayStr   = new Date().toISOString().split("T")[0];
  const todayGlp   = diaryEntries.filter((e: any) => e.date === todayStr).length;

  const lastInspPct = safetyInspections.length > 0
    ? (() => {
        const last  = safetyInspections[0];
        const ok    = last.items.filter((it: any) => it.result === "ok").length;
        const total = last.items.filter((it: any) => it.result !== "na").length;
        return total > 0 ? Math.round((ok / total) * 100) : 0;
      })()
    : null;

  return (
    <View style={{ gap: 16 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#7c3aed18" }]}>
          <Icons.ChartBarBig size={20} color="#7c3aed" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Аналітика лабораторії</Text>
          <Text style={s.moduleSub}>Зведені показники ефективності</Text>
        </View>
      </View>

      <View style={s.kpiRow}>
        <KpiCard value={invTotal}   label="Реагентів"    color="#059669" Icon={Icons.TestTubes} />
        <KpiCard value={eqTotal}    label="Приладів"     color="#d97706" Icon={Icons.Microscope} />
        <KpiCard value={totalExps}  label="Дослідів"     color="#7c3aed" Icon={Icons.FlaskConical} />
        <KpiCard value={glpTotal}   label="GLP-записів"  color="#0f766e" Icon={Icons.BookOpen} />
      </View>

      <View style={s.filterRow}>
        {ANALYTICS_TABS.map(t => {
          const TabIcon = t.Icon;
          const active  = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[s.filterTab, active && s.filterTabActive]}>
              <TabIcon size={11} color={active ? "#7c3aed" : colors.mutedSoft} strokeWidth={2.5} />
              <Text style={[s.filterTabText, active && { color: "#7c3aed" }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "reagents" && (
        <View style={{ gap: 14 }}>
          <View style={s.analyticsCard}>
            <Text style={s.analyticsCardTitle}>Стан складу</Text>
            <View style={s.analyticsDonutRow}>
              <PieChart donut radius={56} innerRadius={36} data={reagentPie}
                centerLabelComponent={() => (
                  <View style={{ alignItems: "center" }}>
                    <Text style={[s.donutBigNum, { color: "#059669" }]}>{inStock}</Text>
                    <Text style={s.donutBigSub}>OK</Text>
                  </View>
                )}
              />
              <View style={{ flex: 1, gap: 8 }}>
                <AnalLegendRow color="#059669" label="В наявності" value={inStock}  total={invTotal} />
                <AnalLegendRow color="#d97706" label="Залишок"     value={lowStock} total={invTotal} />
                <AnalLegendRow color="#dc2626" label="Відсутній"   value={depleted} total={invTotal} />
                <AnalLegendRow color="#94a3b8" label="Прострочено" value={expired}  total={invTotal} />
              </View>
            </View>
          </View>

          {expiringSoon.length > 0 && (
            <View style={s.analyticsCard}>
              <View style={s.analyticsCardHeader}>
                <Icons.Clock size={14} color="#d97706" strokeWidth={2.5} />
                <Text style={[s.analyticsCardTitle, { color: "#d97706" }]}>Закінчується ({expiringSoon.length})</Text>
              </View>
              {expiringSoon.slice(0, 5).map((item: any) => {
                const d = Math.floor((new Date(item.expirationDate).getTime() - Date.now()) / (24 * 3600 * 1000));
                return (
                  <View key={item._id} style={s.analyticsListItem}>
                    <View style={[s.analyticsListDot, { backgroundColor: d < 7 ? "#dc2626" : "#d97706" }]} />
                    <Text style={s.analyticsListName} numberOfLines={1}>{item.name}</Text>
                    <Text style={[s.analyticsListBadge, { color: d < 7 ? "#dc2626" : "#d97706" }]}>{d} дн.</Text>
                  </View>
                );
              })}
            </View>
          )}

          {expiredItems.length > 0 && (
            <View style={[s.analyticsCard, { borderColor: "#dc262630" }]}>
              <View style={s.analyticsCardHeader}>
                <Icons.AlertTriangle size={14} color="#dc2626" strokeWidth={2.5} />
                <Text style={[s.analyticsCardTitle, { color: "#dc2626" }]}>Прострочено ({expiredItems.length})</Text>
              </View>
              {expiredItems.slice(0, 4).map((item: any) => (
                <View key={item._id} style={s.analyticsListItem}>
                  <View style={[s.analyticsListDot, { backgroundColor: "#dc2626" }]} />
                  <Text style={[s.analyticsListName, { color: "#dc2626" }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.analyticsListBadge}>
                    {new Date(item.expirationDate).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {invTotal === 0 && (
            <View style={s.emptyWrap}>
              <Icons.TestTubes size={36} color={colors.border} strokeWidth={1.2} />
              <Text style={s.emptyText}>Додайте реагенти до складу</Text>
            </View>
          )}
        </View>
      )}

      {tab === "equipment" && (
        <View style={{ gap: 14 }}>
          <View style={s.analyticsCard}>
            <Text style={s.analyticsCardTitle}>Стан обладнання</Text>
            <View style={s.analyticsDonutRow}>
              <PieChart donut radius={56} innerRadius={36} data={equipPie}
                centerLabelComponent={() => (
                  <View style={{ alignItems: "center" }}>
                    <Text style={[s.donutBigNum, { color: "#059669" }]}>{operational}</Text>
                    <Text style={s.donutBigSub}>OK</Text>
                  </View>
                )}
              />
              <View style={{ flex: 1, gap: 8 }}>
                <AnalLegendRow color="#059669" label="Працює"         value={operational} total={eqTotal} />
                <AnalLegendRow color="#d97706" label="Обслуговування" value={maintenance}  total={eqTotal} />
                <AnalLegendRow color="#dc2626" label="Несправний"     value={outOfOrder}   total={eqTotal} />
              </View>
            </View>
          </View>

          <View style={s.analyticsCard}>
            <View style={s.analyticsCardHeader}>
              <Icons.CalendarClock size={14} color="#0369a1" strokeWidth={2.5} />
              <Text style={[s.analyticsCardTitle, { color: "#0369a1" }]}>
                Найближчі калібрування {upcomingCals.length > 0 ? `(${upcomingCals.length})` : ""}
              </Text>
            </View>
            {upcomingCals.length === 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 }}>
                <Icons.CircleCheck size={16} color="#059669" strokeWidth={2} />
                <Text style={{ fontSize: 13, color: colors.muted }}>Всі прилади відкалібровано вчасно</Text>
              </View>
            ) : (
              upcomingCals.map((eq: any) => (
                <View key={eq._id} style={s.analyticsListItem}>
                  <View style={[s.analyticsListDot, { backgroundColor: eq.calDays < 14 ? "#dc2626" : "#d97706" }]} />
                  <Text style={s.analyticsListName} numberOfLines={1}>{eq.name}</Text>
                  <Text style={[s.analyticsListBadge, { color: eq.calDays < 14 ? "#dc2626" : "#d97706" }]}>
                    {eq.calDays < 0 ? "Прострочено!" : `${eq.calDays} дн.`}
                  </Text>
                </View>
              ))
            )}
          </View>

          {eqTotal === 0 && (
            <View style={s.emptyWrap}>
              <Icons.Microscope size={36} color={colors.border} strokeWidth={1.2} />
              <Text style={s.emptyText}>Додайте обладнання до переліку</Text>
            </View>
          )}
        </View>
      )}

      {tab === "activity" && (
        <View style={{ gap: 14 }}>
          <View style={s.analyticsCard}>
            <View style={s.analyticsCardHeader}>
              <Icons.FlaskConical size={14} color="#7c3aed" strokeWidth={2} />
              <Text style={[s.analyticsCardTitle, { color: "#7c3aed" }]}>Експерименти ({totalExps})</Text>
              {totalExps > 0 && (
                <View style={[s.successBadge, { marginLeft: "auto" }]}>
                  <Text style={s.successBadgeText}>{successRate}% успіх</Text>
                </View>
              )}
            </View>
            {totalExps === 0 ? (
              <Text style={{ fontSize: 13, color: colors.muted }}>Дослідів ще немає</Text>
            ) : (
              [
                { key: "active",    label: "Активні",     value: expByStatus.active,    color: "#059669" },
                { key: "planned",   label: "Заплановані", value: expByStatus.planned,   color: "#0369a1" },
                { key: "completed", label: "Завершені",   value: expByStatus.completed, color: "#7c3aed" },
                { key: "failed",    label: "Провалені",   value: expByStatus.failed,    color: "#dc2626" },
                { key: "paused",    label: "Призупинені", value: expByStatus.paused,    color: "#64748b" },
              ].filter(r => r.value > 0).map(row => (
                <View key={row.key} style={s.activityRow}>
                  <View style={[s.analyticsListDot, { backgroundColor: row.color, width: 10, height: 10, borderRadius: 5 }]} />
                  <Text style={s.activityLabel}>{row.label}</Text>
                  <View style={s.activityBarWrap}>
                    <MotiView
                      from={{ width: "0%" }}
                      animate={{ width: `${Math.round((row.value / totalExps) * 100)}%` }}
                      transition={{ type: "timing", duration: 700 }}
                      style={[s.activityBar, { backgroundColor: row.color }]}
                    />
                  </View>
                  <Text style={[s.activityCount, { color: row.color }]}>{row.value}</Text>
                </View>
              ))
            )}
          </View>

          <View style={s.analyticsCard}>
            <View style={s.analyticsCardHeader}>
              <Icons.BookOpen size={14} color="#0f766e" strokeWidth={2} />
              <Text style={[s.analyticsCardTitle, { color: "#0f766e" }]}>GLP-Журнал</Text>
            </View>
            <View style={s.kpiRow}>
              <View style={s.glpKpi}><Text style={[s.glpKpiNum, { color: "#0f766e" }]}>{glpTotal}</Text><Text style={s.glpKpiLabel}>Всього записів</Text></View>
              <View style={s.glpKpi}><Text style={[s.glpKpiNum, { color: "#059669" }]}>{todayGlp}</Text><Text style={s.glpKpiLabel}>Сьогодні</Text></View>
              <View style={s.glpKpi}><Text style={[s.glpKpiNum, { color: "#7c3aed" }]}>{wasteRecords.length}</Text><Text style={s.glpKpiLabel}>Актів відходів</Text></View>
            </View>
          </View>

          {lastInspPct !== null && (
            <View style={s.analyticsCard}>
              <View style={s.analyticsCardHeader}>
                <Icons.ShieldCheck size={14} color="#059669" strokeWidth={2} />
                <Text style={[s.analyticsCardTitle, { color: "#059669" }]}>Остання інспекція безпеки</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={[s.inspScoreCircle, { borderColor: lastInspPct >= 80 ? "#059669" : lastInspPct >= 50 ? "#d97706" : "#dc2626" }]}>
                  <Text style={[s.inspScoreNum, { color: lastInspPct >= 80 ? "#059669" : lastInspPct >= 50 ? "#d97706" : "#dc2626" }]}>{lastInspPct}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inspScoreLabel}>{safetyInspections[0].templateName}</Text>
                  <Text style={s.inspScoreDate}>{safetyInspections[0].date} · {safetyInspections[0].inspector}</Text>
                  <View style={s.wasteProgBar}>
                    <MotiView
                      from={{ width: "0%" }}
                      animate={{ width: `${lastInspPct}%` }}
                      transition={{ type: "timing", duration: 700 }}
                      style={[s.wasteProgFill, { backgroundColor: lastInspPct >= 80 ? "#059669" : lastInspPct >= 50 ? "#d97706" : "#dc2626" }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
