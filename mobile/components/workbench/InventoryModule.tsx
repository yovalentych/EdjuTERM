import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "@/constants/theme";
import { type LabInventoryItem } from "@/lib/mobile-store";
import { lab, hazardColor, hazardIcon } from "./constants";
import { s } from "./styles";

function MetaChip({ icon, text, mono, bold }: { icon: string; text: string; mono?: boolean; bold?: boolean }) {
  return (
    <View style={s.metaChip}>
      <Feather name={icon as any} size={10} color={lab.neutral} />
      <Text style={[s.metaChipText, mono && s.mono, bold && { fontFamily: "System", fontWeight: "700", color: colors.ink }]}>{text}</Text>
    </View>
  );
}

function InventoryCard({ item }: { item: LabInventoryItem }) {
  const hColor  = hazardColor(item.hazardClass);
  const hIcon   = hazardIcon(item.hazardClass);
  const exp     = item.expirationDate ? new Date(item.expirationDate) : null;
  const daysLeft = exp ? Math.floor((exp.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;
  const expWarn  = daysLeft !== null && daysLeft < 30;
  const expired  = daysLeft !== null && daysLeft < 0;

  return (
    <View style={[s.invCard, { borderLeftColor: hColor }]}>
      <View style={s.invTop}>
        <View style={[s.hazardBubble, { backgroundColor: hColor + "18" }]}>
          <Text style={s.hazardEmoji}>{hIcon}</Text>
          <Text style={[s.hazardLabel, { color: hColor }]}>{item.hazardClass.toUpperCase()}</Text>
        </View>
        <View style={[s.stockBadge, { backgroundColor: item.status === "in_stock" ? lab.ok + "18" : lab.amber + "18" }]}>
          <Text style={[s.stockText, { color: item.status === "in_stock" ? lab.ok : lab.amber }]}>
            {item.status === "in_stock" ? "В наявності" : item.status === "low_stock" ? "Залишок" : "Відсутній"}
          </Text>
        </View>
      </View>

      <Text style={s.invName}>{item.name}</Text>

      <View style={s.invMeta}>
        <MetaChip icon="hash"    text={item.casNumber || "CAS —"} mono />
        <MetaChip icon="layers"  text={`${item.quantity} ${item.unit}`} bold />
        <MetaChip icon="map-pin" text={item.location} />
      </View>

      {(item.lotNumber || item.storageConditions) && (
        <View style={s.invDetail}>
          {item.lotNumber && <Text style={s.invDetailText}>Лот: <Text style={s.mono}>{item.lotNumber}</Text></Text>}
          {item.storageConditions && <Text style={s.invDetailText}>📦 {item.storageConditions}</Text>}
        </View>
      )}

      {exp && (
        <View style={[s.expRow, expired && s.expRowDanger, expWarn && !expired && s.expRowWarn]}>
          <Feather name="calendar" size={11} color={expired ? lab.danger : expWarn ? lab.amber : lab.neutral} />
          <Text style={[s.expText, { color: expired ? lab.danger : expWarn ? lab.amber : lab.neutral }]}>
            {expired
              ? `Прострочено ${Math.abs(daysLeft!)} дн. тому`
              : expWarn
              ? `Придатний ще ${daysLeft} дн.`
              : `Придатний до ${exp.toLocaleDateString("uk-UA")}`}
          </Text>
        </View>
      )}
    </View>
  );
}

export function InventoryModule({ items }: { items: LabInventoryItem[] }) {
  const [filter, setFilter] = useState<"all" | "warning">("all");

  const displayed = filter === "warning"
    ? items.filter(i => {
        const exp = i.expirationDate ? new Date(i.expirationDate).getTime() - Date.now() : Infinity;
        return exp < 30 * 24 * 3600 * 1000 || i.status !== "in_stock";
      })
    : items;

  const warnCount = items.filter(i => {
    const exp = i.expirationDate ? new Date(i.expirationDate).getTime() - Date.now() : Infinity;
    return exp < 30 * 24 * 3600 * 1000 || i.status !== "in_stock";
  }).length;

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: lab.danger + "18" }]}>
          <Feather name="package" size={20} color={lab.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Склад реагентів</Text>
          <Text style={s.moduleSub}>{items.length} позицій · {items.filter(i => i.status === "in_stock").length} в наявності</Text>
        </View>
        {warnCount > 0 && (
          <View style={s.warnChip}>
            <Feather name="alert-triangle" size={11} color={lab.amber} />
            <Text style={s.warnChipText}>{warnCount}</Text>
          </View>
        )}
      </View>

      <View style={s.filterRow}>
        <Pressable onPress={() => setFilter("all")} style={[s.filterTab, filter === "all" && s.filterTabActive]}>
          <Text style={[s.filterTabText, filter === "all" && s.filterTabTextActive]}>Всі ({items.length})</Text>
        </Pressable>
        <Pressable onPress={() => setFilter("warning")} style={[s.filterTab, filter === "warning" && s.filterTabActive]}>
          <Feather name="alert-triangle" size={11} color={filter === "warning" ? lab.amber : colors.mutedSoft} />
          <Text style={[s.filterTabText, filter === "warning" && { color: lab.amber }]}>Увага ({warnCount})</Text>
        </Pressable>
      </View>

      {displayed.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="check-circle" size={36} color={lab.ok} />
          <Text style={s.emptyText}>Склад в порядку</Text>
        </View>
      ) : (
        displayed.map(item => <InventoryCard key={item._id} item={item} />)
      )}
    </View>
  );
}
