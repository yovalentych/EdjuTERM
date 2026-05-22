import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DilutionCalculator } from "@/components/lab-tools/dilution-calculator";
import { PowderCalculator } from "@/components/lab-tools/powder-calculator";
import { lab } from "./constants";
import { s } from "./styles";

function ToolCard({ icon, title, desc, onPress, badge }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.toolCard, pressed && { opacity: 0.8 }]}>
      <View style={s.toolIcon}><Feather name={icon} size={22} color={lab.accent} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.toolTitle}>{title}</Text>
        <Text style={s.toolDesc}>{desc}</Text>
      </View>
      {badge
        ? <View style={s.toolBadge}><Text style={s.toolBadgeText}>{badge}</Text></View>
        : <Feather name="chevron-right" size={18} color="#cbd5e1" />
      }
    </Pressable>
  );
}

export function LabToolsModule({ activeTool, onSelectTool }: { activeTool: string | null; onSelectTool: (id: string) => void }) {
  if (activeTool === "dilution") return <DilutionCalculator />;
  if (activeTool === "powder")   return <PowderCalculator />;

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: lab.accent + "18" }]}>
          <Feather name="activity" size={20} color={lab.accent} />
        </View>
        <View>
          <Text style={s.moduleTitle}>Лабораторний інструментарій</Text>
          <Text style={s.moduleSub}>Розрахункові інструменти GLP</Text>
        </View>
      </View>

      <ToolCard icon="droplet"       title="Розведення (C₁V₁ = C₂V₂)" desc="Розрахунок об'єму стоку для цільової концентрації" onPress={() => onSelectTool("dilution")} />
      <ToolCard icon="box"           title="Зважування сухої речовини"  desc="Маса наважки за MW, об'ємом та молярністю"       onPress={() => onSelectTool("powder")} />
      <ToolCard icon="trending-down" title="Серійні розведення"         desc="Побудова калібрувальних кривих (1:2, 1:10...)"   badge="Soon" />
    </View>
  );
}
