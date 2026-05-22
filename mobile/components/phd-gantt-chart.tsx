import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { colors, fonts } from '@/constants/theme';
import { type PhdPlan, type PhdWorkStatus } from '@/lib/mobile-store';

// ── Layout constants ──────────────────────────────────────────────────────────

const UK_MONTHS = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
const MONTH_W = 60;  // px per month
const ROW_H = 40;
const GROUP_H = 30;
const HEADER_H = 50;
const LABEL_W = 120; // Narrower for mobile
const BAR_H = 22;

const STATUS_COLOR: Record<PhdWorkStatus, string> = {
  pending: "#94a3b8",
  completed: "#10b981",
  not_completed: "#ef4444",
  partial: "#f59e0b",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Bar = {
  id: string;
  label: string;
  badge?: string;
  from: Date;
  to: Date;
  color: string;
  estimated?: boolean;
};

type Group = {
  id: string;
  title: string;
  bgColor: string;
  titleColor: string;
  bars: Bar[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePeriod(s: string): [Date, Date] | null {
  if (!s) return null;
  const parts = s.trim().split(/\s*—\s*/);
  const p = (str: string) => { const d = new Date(str ?? ""); return isNaN(d.getTime()) ? null : d; };
  if (parts.length >= 2) {
    const a = p(parts[0] ?? ""), b = p(parts[1] ?? "");
    if (a && b) return a <= b ? [a, b] : [b, a];
    if (a) return [a, new Date(a.getTime() + 30 * 86400000)];
  }
  const d = p(parts[0] ?? "");
  return d ? [d, new Date(d.getTime() + 14 * 86400000)] : null;
}

function studyYearRange(enrollDate: Date | null, year: number): [Date, Date] {
  const refYear = enrollDate ? enrollDate.getFullYear() : new Date().getFullYear() - year + 1;
  const refMonth = enrollDate ? enrollDate.getMonth() : 8; 
  const from = new Date(refYear + year - 1, refMonth, 1);
  const to = new Date(refYear + year, refMonth - 1, 28);
  return [from, to];
}

export function PhdGanttChart({ plan }: { plan: PhdPlan | null }) {
  const { groups, startDate, totalMonths } = useMemo(() => {
    if (!plan) return { groups: [], startDate: new Date(), totalMonths: 0 };

    const enrollDate = plan.enrollmentDate ? new Date(plan.enrollmentDate) : null;
    const groups: Group[] = [];
    const allDates: Date[] = [];

    // --- Process yearly plans ---
    const sortedPlans = [...(plan.yearlyPlans || [])].sort((a, b) => a.year - b.year);
    
    for (const yp of sortedPlans) {
      const fallback = studyYearRange(enrollDate, yp.year);

      // Educational
      const eduBars: Bar[] = (yp.educationalCourses || []).map(c => {
        const r = parsePeriod(c.period ?? "") ?? fallback;
        allDates.push(r[0], r[1]);
        return { 
          id: c.ycid, 
          label: c.title, 
          badge: c.subgroup === "mandatory" ? "ОК" : "ВК", 
          from: r[0], to: r[1], 
          color: c.subgroup === "mandatory" ? colors.primary : "#7c3aed",
          estimated: !c.period 
        };
      });
      if (eduBars.length > 0) {
        groups.push({ 
          id: `edu${yp.year}`, 
          title: `${yp.year}-й рік · Навчання`, 
          bgColor: "#f1f5f9", titleColor: colors.ink, bars: eduBars 
        });
      }

      // Scientific
      const sciBars: Bar[] = (yp.scientificWorkItems || []).map(item => {
        const r = parsePeriod(item.period ?? "") ?? fallback;
        allDates.push(r[0], r[1]);
        return { 
          id: item.wsid, 
          label: item.title, 
          from: r[0], to: r[1], 
          color: STATUS_COLOR[item.status] || STATUS_COLOR.pending,
          estimated: !item.period 
        };
      });
      if (sciBars.length > 0) {
        groups.push({ 
          id: `sci${yp.year}`, 
          title: `${yp.year}-й рік · Наука`, 
          bgColor: "#f0fdf4", titleColor: "#166534", bars: sciBars 
        });
      }
    }

    if (allDates.length === 0) return { groups: [], startDate: new Date(), totalMonths: 0 };

    const minTs = Math.min(...allDates.map(d => d.getTime()));
    const maxTs = Math.max(...allDates.map(d => d.getTime()));
    const minD = new Date(minTs);
    const maxD = new Date(maxTs);
    const startDate = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const endDate = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 1);
    
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    return { groups, startDate, totalMonths };
  }, [plan]);

  if (!plan || groups.length === 0) return null;

  const totalWidth = totalMonths * MONTH_W;
  const chartHeight = groups.reduce((acc, g) => acc + GROUP_H + (g.bars.length * ROW_H), HEADER_H);

  function xOf(d: Date): number {
    const mDiff = (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
    return mDiff * MONTH_W + (d.getDate() / 30) * MONTH_W;
  }

  const todayX = xOf(new Date());

  return (
    <View style={styles.outerContainer}>
      <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={[styles.headerRow, { width: LABEL_W + totalWidth }]}>
            <View style={[styles.stickyLabel, { width: LABEL_W, backgroundColor: colors.border + '20' }]} />
            <Svg width={totalWidth} height={HEADER_H}>
              {Array.from({ length: totalMonths }).map((_, i) => {
                const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                const x = i * MONTH_W;
                return (
                  <G key={i}>
                    <Line x1={x} y1={0} x2={x} y2={HEADER_H} stroke={colors.border} strokeWidth={0.5} />
                    <SvgText x={x + MONTH_W/2} y={HEADER_H - 10} fontSize="10" fill={colors.muted} textAnchor="middle">
                      {UK_MONTHS[d.getMonth()]}
                    </SvgText>
                    {d.getMonth() === 0 && (
                      <SvgText x={x + 4} y={15} fontSize="10" fontWeight="bold" fill={colors.ink}>
                        {d.getFullYear()}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>
          </View>

          {/* Groups & Bars */}
          <ScrollView style={{ height: 400 }}>
            {groups.map(group => (
              <View key={group.id}>
                {/* Group Header */}
                <View style={[styles.groupHeaderRow, { width: LABEL_W + totalWidth, backgroundColor: group.bgColor }]}>
                  <View style={[styles.stickyLabel, { width: LABEL_W, backgroundColor: group.bgColor }]}>
                    <Text style={[styles.groupTitle, { color: group.titleColor }]}>{group.title}</Text>
                  </View>
                  <Svg width={totalWidth} height={GROUP_H}>
                    {Array.from({ length: totalMonths }).map((_, i) => (
                      <Line key={i} x1={i * MONTH_W} y1={0} x2={i * MONTH_W} y2={GROUP_H} stroke={colors.border} strokeWidth={0.2} />
                    ))}
                  </Svg>
                </View>

                {/* Bars */}
                {group.bars.map((bar, idx) => {
                  const x1 = xOf(bar.from);
                  const x2 = xOf(bar.to);
                  const w = Math.max(x2 - x1, 5);
                  return (
                    <View key={bar.id} style={[styles.barRow, { width: LABEL_W + totalWidth, backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }]}>
                      <View style={[styles.stickyLabel, { width: LABEL_W, backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }]}>
                        <Text style={styles.barLabel} numberOfLines={1}>{bar.label}</Text>
                      </View>
                      <Svg width={totalWidth} height={ROW_H}>
                        {Array.from({ length: totalMonths }).map((_, i) => (
                          <Line key={i} x1={i * MONTH_W} y1={0} x2={i * MONTH_W} y2={ROW_H} stroke={colors.border} strokeWidth={0.2} />
                        ))}
                        <Rect 
                          x={x1} y={(ROW_H - BAR_H) / 2} 
                          width={w} height={BAR_H} 
                          fill={bar.color} rx={4} ry={4}
                          opacity={bar.estimated ? 0.4 : 0.8}
                        />
                      </Svg>
                    </View>
                  );
                })}
              </View>
            ))}
            
            {/* Today Line overlay (simplification: just one tall line if we could, but here we'll draw it per row or use absolute overlay) */}
          </ScrollView>
        </View>
      </ScrollView>
      
      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="ОК" />
        <LegendItem color="#7c3aed" label="ВК" />
        <LegendItem color="#10b981" label="Виконано" />
        <LegendItem color="#f59e0b" label="Частково" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendBox, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
    overflow: 'hidden',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    height: HEADER_H,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    height: GROUP_H,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  barRow: {
    flexDirection: 'row',
    height: ROW_H,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border + '40',
  },
  stickyLabel: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    height: '100%',
    zIndex: 10,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  groupTitle: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#f8fafc',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 6,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: fonts.bold,
  }
});
