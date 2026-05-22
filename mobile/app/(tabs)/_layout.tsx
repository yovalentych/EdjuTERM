import { Tabs } from "expo-router";
import { useMobileStore } from "@/lib/mobile-store";
import { GlassTabBar } from "@/components/glass-tab-bar";

export default function TabsLayout() {
  const { activeWorkspaceItem } = useMobileStore();
  const itemType = activeWorkspaceItem?.type;
  const isLab    = itemType === "laboratory";
  const isLearn  = itemType === "course" || itemType === "phd"
                || itemType === "bachelor" || itemType === "master";

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen name="space"      options={{ title: "Простір" }} />
      <Tabs.Screen name="workbench"  options={isLab   ? { title: "Досліди" }  : { href: null }} />
      <Tabs.Screen name="learning"   options={isLearn ? { title: "Навчання" } : { href: null }} />
      <Tabs.Screen name="management" options={itemType ? { title: "Проєкт" } : { href: null }} />
      <Tabs.Screen name="profile"    options={{ title: "Профіль" }} />
      {/* hidden — доступні через router.push, але не в табах */}
      <Tabs.Screen name="home" options={{ href: null }} />
      <Tabs.Screen name="lab-inventory" options={{ href: null }} />
      <Tabs.Screen name="lab-equipment" options={{ href: null }} />
    </Tabs>
  );
}
