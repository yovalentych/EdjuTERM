import { useState, useEffect, useRef } from "react";
import {
  StyleSheet, View, Text, Pressable, Platform, Dimensions, Animated, Easing,
} from "react-native";
import * as Icons from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore } from "@/lib/mobile-store";
import { MoreMenuSheet } from "./more-menu-sheet";

const { width: SCREEN_W } = Dimensions.get("window");

type TabDef = { name: string; label: string; Icon: LucideIcon };

const LAB_TABS: TabDef[] = [
  { name: "space",     label: "Простір", Icon: Icons.LayoutGrid },
  { name: "workbench", label: "Досліди", Icon: Icons.Beaker },
  // center FAB inserted between [1] and [2]
  { name: "management", label: "Проєкт", Icon: Icons.Briefcase },
  { name: "profile",   label: "Профіль", Icon: Icons.User },
];

const GENERIC_TABS: TabDef[] = [
  { name: "space",     label: "Простір",  Icon: Icons.LayoutGrid },
  { name: "learning",  label: "Навчання", Icon: Icons.BookOpen },
  // center FAB
  { name: "management", label: "Проєкт",   Icon: Icons.Briefcase },
  { name: "profile",   label: "Профіль",  Icon: Icons.User },
];

export function GlassTabBar(props: BottomTabBarProps) {
  const { state, navigation } = props;
  const insets = useSafeAreaInsets();
  const { activeWorkspaceItem, activeProjectId, projects } = useMobileStore();
  const legacyProject = projects.find(p => String(p.id) === String(activeProjectId));
  const isLab = activeWorkspaceItem?.type === "laboratory" || legacyProject?.projectType === "laboratory";

  const tabs = isLab ? LAB_TABS : GENERIC_TABS;
  const visibleRouteNames = state.routes.map(r => r.name);
  // keep only tabs that match registered routes (defensive)
  const renderTabs = tabs.filter(t => visibleRouteNames.includes(t.name));

  const [sheetOpen, setSheetOpen] = useState(false);
  const fabRotation = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fabRotation, { toValue: sheetOpen ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 0.85, duration: 120, useNativeDriver: true }),
        Animated.spring(fabScale, { toValue: 1, bounciness: 12, speed: 14, useNativeDriver: true }),
      ]),
    ]).start();
  }, [sheetOpen]);

  function handleTabPress(routeName: string, isFocused: boolean) {
    Haptics.selectionAsync();
    const event = navigation.emit({ type: "tabPress", target: routeName, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }

  function handleFabPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetOpen(v => !v);
  }

  const rotateAnim = fabRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "135deg"] });
  const activeIdx = state.routes.findIndex(r => r.key === state.routes[state.index].key);
  const activeName = state.routes[state.index]?.name;

  return (
    <>
      <View style={[s.container, { paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 12 }]}>
        {/* Glass bar */}
        <View style={s.barWrap}>
          <BlurView intensity={Platform.OS === "ios" ? 70 : 100} tint="light" style={s.bar}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.7)",
                "rgba(255,255,255,0.45)",
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            />
            <View style={s.innerRow}>
              {/* Left 2 tabs */}
              {renderTabs.slice(0, 2).map(t => (
                <TabButton
                  key={t.name}
                  tab={t}
                  active={activeName === t.name}
                  onPress={() => handleTabPress(t.name, activeName === t.name)}
                />
              ))}

              {/* Center FAB spacer */}
              <View style={s.fabSpacer} />

              {/* Right 2 tabs */}
              {renderTabs.slice(2, 4).map(t => (
                <TabButton
                  key={t.name}
                  tab={t}
                  active={activeName === t.name}
                  onPress={() => handleTabPress(t.name, activeName === t.name)}
                />
              ))}
            </View>
          </BlurView>

          {/* Glass highlight (top inner border) */}
          <View pointerEvents="none" style={s.barHighlight} />
        </View>

        {/* Center FAB — floats above the bar */}
        <View style={s.fabContainer} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <Pressable onPress={handleFabPress} style={({ pressed }) => [s.fab, pressed && { opacity: 0.92 }]}>
              <LinearGradient
                colors={sheetOpen ? ["#be123c", "#7c3aed"] : ["#0f766e", "#073d35"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={{ transform: [{ rotate: rotateAnim }] }}>
                <Icons.Plus size={26} color="#fff" strokeWidth={2.4} />
              </Animated.View>
            </Pressable>
          </Animated.View>
          {/* Glow ring */}
          <View pointerEvents="none" style={s.fabGlow} />
        </View>
      </View>

      <MoreMenuSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

function TabButton({ tab, active, onPress }: { tab: TabDef; active: boolean; onPress: () => void }) {
  const pillScale = useRef(new Animated.Value(active ? 1 : 0.7)).current;
  const pillOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale, { toValue: active ? 1 : 0.7, bounciness: 10, speed: 16, useNativeDriver: true }),
      Animated.timing(pillOpacity, { toValue: active ? 1 : 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [active]);

  return (
    <Pressable onPress={onPress} style={s.tabBtn} hitSlop={4}>
      <Animated.View
        style={[
          s.pillBg,
          { opacity: pillOpacity, transform: [{ scale: pillScale }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(15,118,110,0.22)", "rgba(15,118,110,0.08)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={s.tabContent}>
        <tab.Icon size={20} color={active ? colors.primary : colors.mutedSoft} strokeWidth={active ? 2.2 : 1.7} />
        <Text style={[s.tabLabel, { color: active ? colors.primary : colors.mutedSoft, fontFamily: active ? fonts.bold : fonts.semiBold }]} numberOfLines={1}>
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
}

const FAB_SIZE = 58;
const BAR_HEIGHT = 64;

const s = StyleSheet.create({
  container:  { position: "absolute", left: 0, right: 0, bottom: 0 },
  barWrap:    { marginHorizontal: 14, borderRadius: 26, overflow: "visible" },
  bar:        { height: BAR_HEIGHT, borderRadius: 26, overflow: "hidden", borderWidth: Platform.OS === "ios" ? 0.5 : 1, borderColor: "rgba(255,255,255,0.65)" },
  barHighlight: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.85)", borderTopLeftRadius: 26, borderTopRightRadius: 26 },

  innerRow:   { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  tabBtn:     { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  pillBg:     { position: "absolute", top: 6, left: "18%", right: "18%", bottom: 6, borderRadius: 18, overflow: "hidden" },
  tabContent: { alignItems: "center", gap: 2 },
  tabLabel:   { fontSize: 10, letterSpacing: -0.2 },

  fabSpacer:  { width: FAB_SIZE + 16 },

  fabContainer: { position: "absolute", left: 0, right: 0, top: -FAB_SIZE / 2 - 4, alignItems: "center", justifyContent: "center" },
  fab:        { width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 3, borderColor: "rgba(255,255,255,0.92)", shadowColor: "#0f766e", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
  fabGlow:    { position: "absolute", width: FAB_SIZE + 22, height: FAB_SIZE + 22, borderRadius: (FAB_SIZE + 22) / 2, backgroundColor: "rgba(15,118,110,0.12)", zIndex: -1 },
});
