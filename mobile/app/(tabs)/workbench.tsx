import { useState, useEffect } from "react";
import { View, Text, Pressable, RefreshControl } from "react-native";
import * as Icons from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { Screen } from "@/components/screen";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore } from "@/lib/mobile-store";
import { QuickRunModule } from "@/components/lab-tools/quick-run";
import { CourseSessionModule } from "@/components/lab-tools/course-session";
import { ActivityFeedModule } from "@/components/lab-tools/activity-feed";
import { LabDashboard, GenericDashboard } from "@/components/workbench/LabDashboard";
import { InventoryModule } from "@/components/workbench/InventoryModule";
import { EquipmentModule } from "@/components/workbench/EquipmentModule";
import { LabToolsModule } from "@/components/workbench/LabToolsModule";
import { ExperimentsModule } from "@/components/workbench/ExperimentsModule";
import { GlpJournalModule } from "@/components/workbench/GlpJournalModule";
import { SafetyModule } from "@/components/workbench/SafetyModule";
import { WasteModule } from "@/components/workbench/WasteModule";
import { AnalyticsModule } from "@/components/workbench/AnalyticsModule";
import { ReportsModule } from "@/components/workbench/ReportsModule";
import { NotificationsModule } from "@/components/workbench/NotificationsModule";
import { AccessControlModule } from "@/components/workbench/AccessControlModule";
import { LabCalendarModule } from "@/components/workbench/LabCalendarModule";
import { DiaryModule } from "@/components/workbench/DiaryModule";
import { LibraryModule } from "@/components/workbench/LibraryModule";
import { ChatModule } from "@/components/workbench/ChatModule";
import { StyleSheet } from "react-native";

const lab = { accent: "#0f766e" };

type Module = "quick_run" | "course_session" | "activity_feed" | "lab_tools" | "inventory" | "equipment" | "diary" | "glp_journal" | "experiments" | "safety" | "waste" | "analytics" | "reports" | "notifications" | "schedule" | "access" | "library" | "team_chat";

export default function WorkbenchScreen() {
  const {
    addDiaryDraft, clearDrafts, drafts, syncDiaryEntry,
    diaryEntries, fetchDiaryEntries,
    libraryItems, fetchLibraryItems,
    chatMessages, sendChatMessage, fetchChatMessages,
    labInventory, fetchLabInventory,
    labEquipment, fetchLabEquipment,
    labExperiments, fetchLabExperiments,
    createExperiment, updateExperiment, deleteExperiment,
    safetyInspections, saveInspection, removeInspection,
    wasteRecords, addWasteRecord, removeWasteRecord,
    labBookings, addLabBooking, cancelLabBooking,
    labAccessLogs, logLabAccess, labEquipmentAccess, setEquipmentBsl,
    loading, activeProjectId, activeWorkspaceItem, projects, user,
  } = useMobileStore();

  const [activeModule, setActiveModule]   = useState<Module | null>(null);
  const [activeSubTool, setActiveSubTool] = useState<string | null>(null);

  const legacyProject  = projects.find(p => String(p.id) === String(activeProjectId));
  const isLabProject   = activeWorkspaceItem?.type === "laboratory" || legacyProject?.projectType === "laboratory";
  const isTeamProject  = (activeWorkspaceItem?.members.length ?? legacyProject?.memberCount ?? 0) > 1;
  const currentProject = activeWorkspaceItem
    ? {
        id: activeWorkspaceItem.legacyProjectId || activeWorkspaceItem.id,
        title: activeWorkspaceItem.title,
        acronym: activeWorkspaceItem.tags[0] || legacyProject?.acronym || "",
        roomNumber: (activeWorkspaceItem.fields as any)?.roomNumber || legacyProject?.roomNumber,
        safetyLevel: (activeWorkspaceItem.fields as any)?.bslLevel || (legacyProject as any)?.safetyLevel,
        projectType: isLabProject ? "laboratory" : "other",
      }
    : legacyProject;

  useEffect(() => {
    if (!activeProjectId) return;
    fetchDiaryEntries();
    fetchLibraryItems();
    if (activeModule === "team_chat")   fetchChatMessages();
    if (activeModule === "inventory")   fetchLabInventory();
    if (activeModule === "equipment")   fetchLabEquipment();
    if (activeModule === "experiments") fetchLabExperiments();
    if (activeModule === "analytics")   { fetchLabInventory(); fetchLabEquipment(); fetchLabExperiments(); }
  }, [activeProjectId, activeModule]);

  const onRefresh = () => {
    fetchDiaryEntries(); fetchLibraryItems();
    if (activeModule === "team_chat")   fetchChatMessages();
    if (activeModule === "inventory")   fetchLabInventory();
    if (activeModule === "equipment")   fetchLabEquipment();
    if (activeModule === "experiments") fetchLabExperiments();
  };

  const handleBack = () => activeSubTool ? setActiveSubTool(null) : setActiveModule(null);

  const operational  = labEquipment.filter(e => e.status === "operational").length;
  const inStock      = labInventory.filter(i => i.status === "in_stock").length;
  const expiringSoon = labInventory.filter(i => {
    if (!i.expirationDate) return false;
    return (new Date(i.expirationDate).getTime() - Date.now()) < 30 * 24 * 3600 * 1000
        && (new Date(i.expirationDate).getTime() - Date.now()) > 0;
  }).length;

  const userName = user ? `${user.firstName} ${user.lastName}` : "";
  const userId   = user?._id || "";

  return (
    <Screen
      scroll={activeModule !== "team_chat"}
      refreshControl={
        activeModule !== "team_chat"
          ? <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={lab.accent} />
          : undefined
      }
    >
      <AnimatePresence exitBeforeEnter>
        {!activeModule ? (
          <MotiView key="dashboard" from={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
            {isLabProject
              ? <LabDashboard
                  project={currentProject}
                  operational={operational}
                  inStock={inStock}
                  expiringSoon={expiringSoon}
                  isTeamProject={isTeamProject}
                  onSelect={(m: string) => setActiveModule(m as Module)}
                />
              : <GenericDashboard
                  isTeamProject={isTeamProject}
                  hasLabData={labInventory.length > 0 || labEquipment.length > 0}
                  onSelect={(m: string) => setActiveModule(m as Module)}
                />
            }
          </MotiView>
        ) : (
          <MotiView key="module" from={{ opacity: 0, translateX: 40 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: 40 }} style={{ flex: 1 }}>
            <Pressable onPress={handleBack} style={s.backBtn}>
              <Icons.ArrowLeft size={18} color={lab.accent} strokeWidth={2.5} />
              <Text style={s.backBtnText}>{activeSubTool ? "Назад" : "До головної панелі"}</Text>
            </Pressable>

            {activeModule === "quick_run"      && <QuickRunModule />}
            {activeModule === "course_session" && <CourseSessionModule />}
            {activeModule === "activity_feed"  && <ActivityFeedModule />}
            {activeModule === "lab_tools"      && (
              <LabToolsModule activeTool={activeSubTool} onSelectTool={setActiveSubTool} />
            )}
            {activeModule === "inventory"   && <InventoryModule items={labInventory} />}
            {activeModule === "equipment"   && <EquipmentModule equipment={labEquipment} />}
            {activeModule === "experiments" && (
              <ExperimentsModule
                experiments={labExperiments}
                onCreate={createExperiment}
                onUpdate={updateExperiment}
                onDelete={deleteExperiment}
                activeProjectId={activeProjectId}
              />
            )}
            {activeModule === "glp_journal" && (
              <GlpJournalModule
                drafts={drafts} entries={diaryEntries}
                onSync={syncDiaryEntry} onAddDraft={addDiaryDraft} onClear={clearDrafts}
                labEquipment={labEquipment} labInventory={labInventory}
              />
            )}
            {activeModule === "safety" && (
              <SafetyModule
                inspections={safetyInspections}
                onSave={saveInspection}
                onRemove={removeInspection}
                projectId={activeProjectId}
                inspectorName={userName}
              />
            )}
            {activeModule === "waste" && (
              <WasteModule
                records={wasteRecords}
                onAdd={addWasteRecord}
                onRemove={removeWasteRecord}
                handlerName={userName}
              />
            )}
            {activeModule === "analytics" && (
              <AnalyticsModule
                labInventory={labInventory}
                labEquipment={labEquipment}
                labExperiments={labExperiments}
                diaryEntries={diaryEntries}
                wasteRecords={wasteRecords}
                safetyInspections={safetyInspections}
              />
            )}
            {activeModule === "reports" && (
              <ReportsModule
                labInventory={labInventory}
                labEquipment={labEquipment}
                labExperiments={labExperiments}
                diaryEntries={diaryEntries}
                wasteRecords={wasteRecords}
                project={currentProject}
              />
            )}
            {activeModule === "notifications" && (
              <NotificationsModule labInventory={labInventory} labEquipment={labEquipment} />
            )}
            {activeModule === "access" && (
              <AccessControlModule
                logs={labAccessLogs}
                equipment={labEquipment}
                equipmentAccess={labEquipmentAccess}
                onLog={(action, zone, notes) => {
                  const entry = logLabAccess(action, zone, notes);
                  Object.assign(entry, { userId, userName });
                }}
                onSetBsl={setEquipmentBsl}
                projectBsl={(currentProject as any)?.safetyLevel || "BSL-1"}
                userName={userName}
                userId={userId}
              />
            )}
            {activeModule === "schedule" && (
              <LabCalendarModule
                bookings={labBookings}
                equipment={labEquipment}
                onAdd={addLabBooking}
                onCancel={cancelLabBooking}
                userName={userName}
                userId={userId}
              />
            )}
            {activeModule === "diary" && (
              <DiaryModule
                drafts={drafts} entries={diaryEntries}
                onSync={syncDiaryEntry} onAddDraft={addDiaryDraft} onClear={clearDrafts}
              />
            )}
            {activeModule === "library"   && <LibraryModule items={libraryItems} />}
            {activeModule === "team_chat" && (
              <ChatModule
                messages={chatMessages} onSend={sendChatMessage}
                currentUser={user} onRefresh={onRefresh} loading={loading}
              />
            )}
          </MotiView>
        )}
      </AnimatePresence>
      <View style={{ height: 100 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  backBtn:     { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.65)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8 },
  backBtnText: { fontSize: 13, fontFamily: fonts.bold, color: lab.accent, letterSpacing: -0.2 },
});
