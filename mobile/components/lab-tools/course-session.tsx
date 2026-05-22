import { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type LabMethodology, type LabCourseSession, type MethodologyStep, type MethodologyMaterial,
  type GradingCriterion, type SessionStepProgress, type SessionGradeBreakdown,
  type LabMethodologyStatus, type LabSessionStatus, type BslLevel, type LabRole,
} from "@/lib/mobile-store";
import { METHODOLOGY_PRESETS, type MethodologyPreset } from "@/lib/methodology-presets";

type ViewMode = "student" | "instructor";

const lab = { accent: "#0f766e", bio: "#7c3aed", amber: "#d97706", danger: "#be123c", ok: "#047857" };

const SESSION_STATUS_META: Record<LabSessionStatus, { label: string; color: string; icon: string }> = {
  assigned:    { label: "Призначено", color: "#0369a1", icon: "📋" },
  in_progress: { label: "У роботі",    color: lab.accent, icon: "⏳" },
  submitted:   { label: "Здано",       color: "#7c3aed", icon: "📤" },
  graded:      { label: "Оцінено",     color: lab.ok,    icon: "✅" },
  returned:    { label: "На доопрац.", color: lab.amber, icon: "↩️" },
};

export function CourseSessionModule() {
  const { userRole, labMethodologies, labCourseSessions, user } = useMobileStore();

  // Default mode based on role
  const defaultMode: ViewMode = userRole === "lab_manager" || userRole === "researcher" || userRole === "technician" ? "instructor" : "student";
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<LabMethodology | null>(null);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [methodDetail, setMethodDetail] = useState<LabMethodology | null>(null);
  const [sessionDetail, setSessionDetail] = useState<LabCourseSession | null>(null);
  const [graderOpen, setGraderOpen] = useState<LabCourseSession | null>(null);

  const publishedMethods = labMethodologies.filter(m => m.status === "published");
  const draftMethods = labMethodologies.filter(m => m.status === "draft");

  const myStudentSessions = labCourseSessions.filter(s => s.studentId === user?._id);
  const allInstructorSessions = labCourseSessions; // instructor бачить всі

  return (
    <View style={{ gap: 14 }}>
      <ModeSwitcher mode={mode} onChange={setMode} />

      {mode === "instructor" ? (
        <InstructorView
          published={publishedMethods}
          drafts={draftMethods}
          sessions={allInstructorSessions}
          onCreate={() => { setEditingMethod(null); setPresetPickerOpen(true); }}
          onEdit={(m) => { setEditingMethod(m); setEditorOpen(true); }}
          onOpenMethod={setMethodDetail}
          onOpenSession={setSessionDetail}
          onGrade={setGraderOpen}
        />
      ) : (
        <StudentView
          available={publishedMethods}
          sessions={myStudentSessions}
          onOpenMethod={setMethodDetail}
          onOpenSession={setSessionDetail}
        />
      )}

      <PresetPickerModal
        visible={presetPickerOpen}
        onClose={() => setPresetPickerOpen(false)}
        onPickPreset={(preset) => {
          setPresetPickerOpen(false);
          setEditingMethod({ id: "", ...presetToMethodology(preset) } as LabMethodology);
          setEditorOpen(true);
        }}
        onBlank={() => { setPresetPickerOpen(false); setEditingMethod(null); setEditorOpen(true); }}
      />

      <MethodologyEditor
        visible={editorOpen}
        seed={editingMethod}
        onClose={() => { setEditorOpen(false); setEditingMethod(null); }}
      />

      <MethodologyDetailModal
        method={methodDetail}
        mode={mode}
        onClose={() => setMethodDetail(null)}
        onEdit={(m) => { setMethodDetail(null); setEditingMethod(m); setEditorOpen(true); }}
      />

      <SessionRunnerModal
        session={sessionDetail}
        mode={mode}
        onClose={() => setSessionDetail(null)}
        onGrade={(s) => { setSessionDetail(null); setGraderOpen(s); }}
      />

      <GraderModal
        session={graderOpen}
        onClose={() => setGraderOpen(null)}
      />
    </View>
  );
}

// ─── Mode Switcher ────────────────────────────────────────────────────────────
function ModeSwitcher({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <View style={s.switcher}>
      {(["student", "instructor"] as ViewMode[]).map(m => (
        <Pressable
          key={m}
          onPress={() => { Haptics.selectionAsync(); onChange(m); }}
          style={[s.switchTab, mode === m && s.switchTabActive]}
        >
          <Text style={[s.switchText, mode === m && s.switchTextActive]}>
            {m === "student" ? "Як студент" : "Як викладач"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Instructor View ──────────────────────────────────────────────────────────
function InstructorView({ published, drafts, sessions, onCreate, onEdit, onOpenMethod, onOpenSession, onGrade }: {
  published: LabMethodology[]; drafts: LabMethodology[]; sessions: LabCourseSession[];
  onCreate: () => void;
  onEdit: (m: LabMethodology) => void;
  onOpenMethod: (m: LabMethodology) => void;
  onOpenSession: (s: LabCourseSession) => void;
  onGrade: (s: LabCourseSession) => void;
}) {
  const submitted = sessions.filter(s => s.status === "submitted");
  const inProgress = sessions.filter(s => s.status === "in_progress");

  return (
    <View style={{ gap: 16 }}>
      <LinearGradient colors={["#7c3aed", "#5b21b6"]} style={s.heroCard}>
        <View style={s.heroIconWrap}>
          <Icons.GraduationCap size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Викладацький центр</Text>
          <Text style={s.heroSub}>Створюйте методички, призначайте студентам, оцінюйте здані роботи.</Text>
        </View>
      </LinearGradient>

      <Pressable style={s.createBtn} onPress={onCreate}>
        <Icons.Plus size={18} color="#fff" />
        <Text style={s.createBtnText}>Нова методичка</Text>
      </Pressable>

      {submitted.length > 0 && (
        <>
          <Text style={s.sectionLabel}>⚡ ЧЕКАЮТЬ ОЦІНЮВАННЯ ({submitted.length})</Text>
          <View style={{ gap: 8 }}>
            {submitted.map(s2 => (
              <SessionCard key={s2.id} session={s2} onPress={() => onOpenSession(s2)} actionLabel="Оцінити" onAction={() => onGrade(s2)} />
            ))}
          </View>
        </>
      )}

      {inProgress.length > 0 && (
        <>
          <Text style={s.sectionLabel}>СТУДЕНТИ У РОБОТІ ({inProgress.length})</Text>
          <View style={{ gap: 8 }}>
            {inProgress.map(s2 => (
              <SessionCard key={s2.id} session={s2} onPress={() => onOpenSession(s2)} />
            ))}
          </View>
        </>
      )}

      <Text style={s.sectionLabel}>ОПУБЛІКОВАНІ ({published.length})</Text>
      {published.length === 0 ? (
        <View style={s.emptyBox}>
          <Icons.FileText size={20} color={colors.mutedSoft} />
          <Text style={s.emptyText}>Немає опублікованих методичок. Створіть першу.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {published.map(m => (
            <MethodologyCard key={m.id} method={m} onPress={() => onOpenMethod(m)} onEdit={() => onEdit(m)} />
          ))}
        </View>
      )}

      {drafts.length > 0 && (
        <>
          <Text style={s.sectionLabel}>ЧЕРНЕТКИ ({drafts.length})</Text>
          <View style={{ gap: 8 }}>
            {drafts.map(m => (
              <MethodologyCard key={m.id} method={m} onPress={() => onOpenMethod(m)} onEdit={() => onEdit(m)} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Student View ─────────────────────────────────────────────────────────────
function StudentView({ available, sessions, onOpenMethod, onOpenSession }: {
  available: LabMethodology[]; sessions: LabCourseSession[];
  onOpenMethod: (m: LabMethodology) => void;
  onOpenSession: (s: LabCourseSession) => void;
}) {
  const active = sessions.filter(s => s.status === "assigned" || s.status === "in_progress" || s.status === "returned");
  const past   = sessions.filter(s => s.status === "submitted" || s.status === "graded");

  const startedMethodIds = new Set(sessions.filter(s => s.status !== "graded").map(s => s.methodologyId));
  const availableNotStarted = available.filter(m => !startedMethodIds.has(m.id));

  return (
    <View style={{ gap: 16 }}>
      <LinearGradient colors={[lab.accent, "#0f5c50"]} style={s.heroCard}>
        <View style={s.heroIconWrap}>
          <Icons.BookOpen size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Студентські лабораторні</Text>
          <Text style={s.heroSub}>Виконуйте методички крок за кроком — прогрес зберігається автоматично.</Text>
        </View>
      </LinearGradient>

      {active.length > 0 && (
        <>
          <Text style={s.sectionLabel}>МОЇ РОБОТИ ({active.length})</Text>
          <View style={{ gap: 8 }}>
            {active.map(s2 => (
              <SessionCard key={s2.id} session={s2} onPress={() => onOpenSession(s2)} />
            ))}
          </View>
        </>
      )}

      <Text style={s.sectionLabel}>ДОСТУПНІ ({availableNotStarted.length})</Text>
      {availableNotStarted.length === 0 ? (
        <View style={s.emptyBox}>
          <Icons.FolderOpen size={20} color={colors.mutedSoft} />
          <Text style={s.emptyText}>Немає доступних методичок. Зверніться до викладача.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {availableNotStarted.map(m => (
            <MethodologyCard key={m.id} method={m} onPress={() => onOpenMethod(m)} showAssign />
          ))}
        </View>
      )}

      {past.length > 0 && (
        <>
          <Text style={s.sectionLabel}>ВИКОНАНІ ({past.length})</Text>
          <View style={{ gap: 8 }}>
            {past.map(s2 => (
              <SessionCard key={s2.id} session={s2} onPress={() => onOpenSession(s2)} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Methodology Card ─────────────────────────────────────────────────────────
function MethodologyCard({ method, onPress, onEdit, showAssign }: {
  method: LabMethodology; onPress: () => void; onEdit?: () => void; showAssign?: boolean;
}) {
  const stepCount = method.procedureSteps.length;
  return (
    <Pressable onPress={onPress} style={s.card}>
      <Text style={s.cardEmoji}>{method.emoji}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.cardTitle} numberOfLines={1}>{method.title}</Text>
        <Text style={s.cardMeta} numberOfLines={1}>
          {stepCount} кроків  ·  {method.durationMinutes} хв  ·  {method.bslLevel}  ·  {method.maxScore} балів
        </Text>
      </View>
      {method.status === "draft" && (
        <View style={[s.statusBadge, { backgroundColor: lab.amber + "15" }]}>
          <Text style={[s.statusBadgeText, { color: lab.amber }]}>Чернетка</Text>
        </View>
      )}
      {onEdit && (
        <Pressable hitSlop={8} onPress={onEdit} style={s.iconBtn}>
          <Icons.Pencil size={14} color={colors.muted} />
        </Pressable>
      )}
      {showAssign && <Icons.ChevronRight size={14} color={colors.muted} />}
    </Pressable>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session, onPress, actionLabel, onAction }: {
  session: LabCourseSession; onPress: () => void;
  actionLabel?: string; onAction?: () => void;
}) {
  const meta = SESSION_STATUS_META[session.status];
  const completed = session.stepProgress.filter(p => p.completed).length;
  const total = session.stepProgress.length;
  return (
    <Pressable onPress={onPress} style={s.card}>
      <Text style={s.cardEmoji}>{session.methodologyEmoji}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.cardTitle} numberOfLines={1}>{session.methodologyTitle}</Text>
        <Text style={s.cardMeta} numberOfLines={1}>
          {session.studentName}  ·  {completed}/{total} кроків
          {session.totalScore !== undefined ? `  ·  ${session.totalScore}/${session.maxScore} балів` : ""}
        </Text>
      </View>
      <View style={[s.statusBadge, { backgroundColor: meta.color + "15" }]}>
        <Text style={[s.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
      {onAction && actionLabel && (
        <Pressable onPress={onAction} style={s.actionBtnSmall}>
          <Text style={s.actionBtnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// ─── Preset Picker Modal ──────────────────────────────────────────────────────
function PresetPickerModal({ visible, onClose, onPickPreset, onBlank }: {
  visible: boolean; onClose: () => void;
  onPickPreset: (p: MethodologyPreset) => void;
  onBlank: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Створення методички</Text>
          <Text style={s.sheetSub}>Оберіть готову основу або почніть з порожньої.</Text>
          <Pressable style={s.blankBtn} onPress={onBlank}>
            <Icons.FilePlus size={14} color={colors.primary} />
            <Text style={s.blankBtnText}>Створити з нуля</Text>
          </Pressable>
          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 8 }}>
            {METHODOLOGY_PRESETS.map(p => (
              <Pressable key={p.id} onPress={() => onPickPreset(p)} style={s.presetRow}>
                <Text style={s.cardEmoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={s.cardMeta} numberOfLines={1}>
                    {p.subject}  ·  {p.level === "school" ? "Школа" : p.level === "bachelor" ? "Бакалавр" : "Магістр"}  ·  {p.durationMinutes} хв
                  </Text>
                </View>
                <Icons.ChevronRight size={14} color={colors.muted} />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Methodology Editor ───────────────────────────────────────────────────────
function MethodologyEditor({ visible, seed, onClose }: {
  visible: boolean; seed: LabMethodology | null; onClose: () => void;
}) {
  const { createMethodology, updateMethodology, publishMethodology, deleteMethodology } = useMobileStore();

  const [title, setTitle] = useState(seed?.title || "");
  const [emoji, setEmoji] = useState(seed?.emoji || "📋");
  const [description, setDescription] = useState(seed?.description || "");
  const [steps, setSteps] = useState<MethodologyStep[]>(seed?.procedureSteps || []);
  const [materials, setMaterials] = useState<MethodologyMaterial[]>(seed?.materials || []);
  const [safety, setSafety] = useState(seed?.safetyNotes || "");
  const [expected, setExpected] = useState(seed?.expectedResults || "");
  const [criteria, setCriteria] = useState<GradingCriterion[]>(seed?.gradingCriteria || []);
  const [duration, setDuration] = useState(String(seed?.durationMinutes ?? 90));
  const [bsl, setBsl] = useState<BslLevel>(seed?.bslLevel || "BSL-1");

  // Reset when seed changes
  useMemo(() => {
    setTitle(seed?.title || "");
    setEmoji(seed?.emoji || "📋");
    setDescription(seed?.description || "");
    setSteps(seed?.procedureSteps || []);
    setMaterials(seed?.materials || []);
    setSafety(seed?.safetyNotes || "");
    setExpected(seed?.expectedResults || "");
    setCriteria(seed?.gradingCriteria || []);
    setDuration(String(seed?.durationMinutes ?? 90));
    setBsl(seed?.bslLevel || "BSL-1");
  }, [seed?.id, seed?.title]);

  const maxScore = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const isExisting = !!seed?.id;

  function handleSave(publish: boolean) {
    if (!title.trim()) { Alert.alert("Заповніть назву методички"); return; }
    const payload: Partial<LabMethodology> = {
      title: title.trim(),
      emoji,
      description: description.trim(),
      procedureSteps: steps,
      materials,
      safetyNotes: safety.trim(),
      expectedResults: expected.trim(),
      gradingCriteria: criteria,
      maxScore: maxScore || 100,
      durationMinutes: parseInt(duration, 10) || 90,
      bslLevel: bsl,
      status: publish ? "published" : "draft",
    };
    if (isExisting && seed) {
      updateMethodology(seed.id, payload);
      if (publish) publishMethodology(seed.id);
    } else {
      const m = createMethodology(payload);
      if (publish) publishMethodology(m.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  function handleDelete() {
    if (!isExisting || !seed) return;
    Alert.alert("Видалити методичку?", "Усі пов'язані сесії також видаляться.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: () => { deleteMethodology(seed.id); onClose(); } },
    ]);
  }

  function addStep() {
    setSteps(prev => [...prev, { id: `st_${Date.now()}`, title: "", description: "", expectedMinutes: 15 }]);
  }
  function addMaterial() {
    setMaterials(prev => [...prev, { id: `mat_${Date.now()}`, name: "", kind: "reagent", quantity: "" }]);
  }
  function addCriterion() {
    setCriteria(prev => [...prev, { id: `cr_${Date.now()}`, label: "", maxPoints: 10 }]);
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.editorSheet} onPress={() => {}}>
          <View style={s.editorHeader}>
            <Text style={s.sheetTitle}>{isExisting ? "Редагування методички" : "Нова методичка"}</Text>
            <Pressable onPress={onClose}><Icons.X size={20} color={colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            <FieldRow label="Назва">
              <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="напр., Кислотно-основне титрування" placeholderTextColor={colors.mutedSoft} />
            </FieldRow>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 0.3 }}>
                <FieldRow label="Емодзі">
                  <TextInput style={s.input} value={emoji} onChangeText={setEmoji} maxLength={4} />
                </FieldRow>
              </View>
              <View style={{ flex: 0.35 }}>
                <FieldRow label="Тривалість, хв">
                  <TextInput style={s.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" />
                </FieldRow>
              </View>
              <View style={{ flex: 0.35 }}>
                <FieldRow label="BSL">
                  <View style={s.bslRow}>
                    {(["BSL-1", "BSL-2", "BSL-3"] as BslLevel[]).map(b => (
                      <Pressable key={b} onPress={() => setBsl(b)} style={[s.bslChip, bsl === b && { backgroundColor: lab.accent + "20", borderColor: lab.accent }]}>
                        <Text style={[s.bslChipText, bsl === b && { color: lab.accent }]}>{b.replace("BSL-", "")}</Text>
                      </Pressable>
                    ))}
                  </View>
                </FieldRow>
              </View>
            </View>
            <FieldRow label="Опис">
              <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} multiline placeholder="Коротка анотація — мета та суть роботи" placeholderTextColor={colors.mutedSoft} />
            </FieldRow>

            <ListSection title="Кроки виконання" count={steps.length} onAdd={addStep}>
              {steps.map((step, i) => (
                <View key={step.id} style={s.listItem}>
                  <Text style={s.listIdx}>{i + 1}.</Text>
                  <View style={{ flex: 1, gap: 6 }}>
                    <TextInput style={s.input} value={step.title} placeholder="Назва кроку" placeholderTextColor={colors.mutedSoft} onChangeText={t => setSteps(prev => prev.map(p => p.id === step.id ? { ...p, title: t } : p))} />
                    <TextInput style={[s.input, { minHeight: 50, textAlignVertical: "top" }]} value={step.description} placeholder="Інструкція" placeholderTextColor={colors.mutedSoft} multiline onChangeText={t => setSteps(prev => prev.map(p => p.id === step.id ? { ...p, description: t } : p))} />
                    <TextInput style={[s.input, { width: 100 }]} value={String(step.expectedMinutes)} placeholder="хв" placeholderTextColor={colors.mutedSoft} keyboardType="number-pad" onChangeText={t => setSteps(prev => prev.map(p => p.id === step.id ? { ...p, expectedMinutes: parseInt(t, 10) || 0 } : p))} />
                  </View>
                  <Pressable onPress={() => setSteps(prev => prev.filter(p => p.id !== step.id))} hitSlop={8}>
                    <Icons.Trash2 size={14} color={lab.danger} />
                  </Pressable>
                </View>
              ))}
            </ListSection>

            <ListSection title="Матеріали" count={materials.length} onAdd={addMaterial}>
              {materials.map(m => (
                <View key={m.id} style={s.listItem}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <TextInput style={s.input} value={m.name} placeholder="Назва" placeholderTextColor={colors.mutedSoft} onChangeText={t => setMaterials(prev => prev.map(p => p.id === m.id ? { ...p, name: t } : p))} />
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View style={{ flex: 0.55 }}>
                        <View style={s.bslRow}>
                          {(["reagent", "equipment", "consumable", "sample"] as MethodologyMaterial["kind"][]).map(k => (
                            <Pressable key={k} onPress={() => setMaterials(prev => prev.map(p => p.id === m.id ? { ...p, kind: k } : p))} style={[s.bslChip, m.kind === k && { backgroundColor: lab.accent + "20", borderColor: lab.accent }]}>
                              <Text style={[s.bslChipText, m.kind === k && { color: lab.accent }]}>{k === "reagent" ? "реаг." : k === "equipment" ? "прил." : k === "consumable" ? "розх." : "зраз."}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      <TextInput style={[s.input, { flex: 0.45 }]} value={m.quantity} placeholder="Кількість" placeholderTextColor={colors.mutedSoft} onChangeText={t => setMaterials(prev => prev.map(p => p.id === m.id ? { ...p, quantity: t } : p))} />
                    </View>
                  </View>
                  <Pressable onPress={() => setMaterials(prev => prev.filter(p => p.id !== m.id))} hitSlop={8}>
                    <Icons.Trash2 size={14} color={lab.danger} />
                  </Pressable>
                </View>
              ))}
            </ListSection>

            <FieldRow label="Техніка безпеки">
              <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} value={safety} onChangeText={setSafety} multiline placeholder="ЗІЗ, ризики, перша допомога" placeholderTextColor={colors.mutedSoft} />
            </FieldRow>

            <FieldRow label="Очікувані результати">
              <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} value={expected} onChangeText={setExpected} multiline placeholder="Які значення/спостереження вважати успіхом" placeholderTextColor={colors.mutedSoft} />
            </FieldRow>

            <ListSection title={`Критерії оцінювання (всього ${maxScore} балів)`} count={criteria.length} onAdd={addCriterion}>
              {criteria.map(c => (
                <View key={c.id} style={s.listItem}>
                  <TextInput style={[s.input, { flex: 1 }]} value={c.label} placeholder="Критерій" placeholderTextColor={colors.mutedSoft} onChangeText={t => setCriteria(prev => prev.map(p => p.id === c.id ? { ...p, label: t } : p))} />
                  <TextInput style={[s.input, { width: 70 }]} value={String(c.maxPoints)} keyboardType="number-pad" onChangeText={t => setCriteria(prev => prev.map(p => p.id === c.id ? { ...p, maxPoints: parseInt(t, 10) || 0 } : p))} />
                  <Pressable onPress={() => setCriteria(prev => prev.filter(p => p.id !== c.id))} hitSlop={8}>
                    <Icons.Trash2 size={14} color={lab.danger} />
                  </Pressable>
                </View>
              ))}
            </ListSection>
          </ScrollView>
          <View style={s.editorActions}>
            {isExisting && (
              <Pressable style={[s.actionBtn, { backgroundColor: lab.danger + "15" }]} onPress={handleDelete}>
                <Icons.Trash2 size={14} color={lab.danger} />
                <Text style={[s.actionBtnText, { color: lab.danger }]}>Видалити</Text>
              </Pressable>
            )}
            <Pressable style={[s.actionBtn, { backgroundColor: "#f1f5f9" }]} onPress={() => handleSave(false)}>
              <Text style={[s.actionBtnText, { color: colors.muted }]}>Чернетка</Text>
            </Pressable>
            <Pressable style={[s.actionBtn, { backgroundColor: lab.accent, flex: 1 }]} onPress={() => handleSave(true)}>
              <Icons.Send size={14} color="#fff" />
              <Text style={[s.actionBtnText, { color: "#fff" }]}>Опублікувати</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Methodology Detail Modal ─────────────────────────────────────────────────
function MethodologyDetailModal({ method, mode, onClose, onEdit }: {
  method: LabMethodology | null; mode: ViewMode; onClose: () => void; onEdit: (m: LabMethodology) => void;
}) {
  const { assignSession } = useMobileStore();
  if (!method) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.sheetHandle} />
          <View style={s.detailHead}>
            <Text style={s.detailEmoji}>{method.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.sheetTitle}>{method.title}</Text>
              <Text style={s.detailMeta}>{method.durationMinutes} хв  ·  {method.bslLevel}  ·  {method.maxScore} балів</Text>
            </View>
          </View>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
            {method.description ? (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>ОПИС</Text>
                <Text style={s.detailBoxText}>{method.description}</Text>
              </View>
            ) : null}
            {method.procedureSteps.length > 0 && (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>КРОКИ ({method.procedureSteps.length})</Text>
                {method.procedureSteps.map((st, i) => (
                  <View key={st.id} style={{ marginBottom: 8 }}>
                    <Text style={s.stepRowTitle}>{i + 1}. {st.title || "(без назви)"}  <Text style={s.stepDur}>· {st.expectedMinutes} хв</Text></Text>
                    {st.description ? <Text style={s.detailBoxText}>{st.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}
            {method.materials.length > 0 && (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>МАТЕРІАЛИ</Text>
                {method.materials.map(m => (
                  <Text key={m.id} style={s.detailBoxText}>• {m.name} ({m.quantity || "—"})</Text>
                ))}
              </View>
            )}
            {method.safetyNotes ? (
              <View style={[s.detailBox, { backgroundColor: lab.amber + "10" }]}>
                <Text style={s.detailBoxLabel}>⚠ БЕЗПЕКА</Text>
                <Text style={s.detailBoxText}>{method.safetyNotes}</Text>
              </View>
            ) : null}
            {method.expectedResults ? (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>ОЧІКУВАНІ РЕЗУЛЬТАТИ</Text>
                <Text style={s.detailBoxText}>{method.expectedResults}</Text>
              </View>
            ) : null}
            {method.gradingCriteria.length > 0 && (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>ОЦІНЮВАННЯ</Text>
                {method.gradingCriteria.map(c => (
                  <Text key={c.id} style={s.detailBoxText}>• {c.label} — {c.maxPoints} балів</Text>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {mode === "instructor" && (
              <Pressable style={[s.actionBtn, { backgroundColor: "#f1f5f9", flex: 1 }]} onPress={() => onEdit(method)}>
                <Icons.Pencil size={14} color={colors.muted} />
                <Text style={[s.actionBtnText, { color: colors.muted }]}>Редагувати</Text>
              </Pressable>
            )}
            {mode === "student" && method.status === "published" && (
              <Pressable
                style={[s.actionBtn, { backgroundColor: lab.accent, flex: 1 }]}
                onPress={() => {
                  const session = assignSession(method.id);
                  if (session) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onClose();
                  } else {
                    Alert.alert("Не вдалося розпочати", "Перевірте методичку.");
                  }
                }}
              >
                <Icons.PlayCircle size={14} color="#fff" />
                <Text style={[s.actionBtnText, { color: "#fff" }]}>Розпочати</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Session Runner / Detail ─────────────────────────────────────────────────
function SessionRunnerModal({ session, mode, onClose, onGrade }: {
  session: LabCourseSession | null; mode: ViewMode;
  onClose: () => void; onGrade: (s: LabCourseSession) => void;
}) {
  const { labMethodologies, toggleSessionStep, updateSessionSubmission, submitSession, deleteSession } = useMobileStore();
  const [tab, setTab] = useState<"steps" | "submit">("steps");
  if (!session) return null;
  const method = labMethodologies.find(m => m.id === session.methodologyId);
  const completedCount = session.stepProgress.filter(p => p.completed).length;
  const progress = method && method.procedureSteps.length > 0 ? completedCount / method.procedureSteps.length : 0;
  const meta = SESSION_STATUS_META[session.status];
  const canSubmit = mode === "student" && session.status !== "submitted" && session.status !== "graded" && completedCount > 0;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.editorSheet} onPress={() => {}}>
          <View style={s.editorHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Text style={s.cardEmoji}>{session.methodologyEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle} numberOfLines={1}>{session.methodologyTitle}</Text>
                <Text style={s.detailMeta}>{session.studentName}  ·  {meta.label}</Text>
              </View>
            </View>
            <Pressable onPress={onClose}><Icons.X size={20} color={colors.muted} /></Pressable>
          </View>

          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: meta.color }]} />
          </View>
          <Text style={s.progressText}>{completedCount} з {method?.procedureSteps.length || 0} кроків</Text>

          {session.status === "graded" && (
            <View style={[s.detailBox, { backgroundColor: lab.ok + "0d", borderWidth: 1, borderColor: lab.ok + "33" }]}>
              <Text style={s.detailBoxLabel}>ОЦІНКА</Text>
              <Text style={[s.detailBoxText, { fontSize: 16, fontFamily: fonts.bold, color: lab.ok }]}>
                {session.totalScore} / {session.maxScore} балів
              </Text>
              {session.instructorFeedback ? <Text style={[s.detailBoxText, { marginTop: 6 }]}>{session.instructorFeedback}</Text> : null}
            </View>
          )}

          <View style={s.tabs}>
            {(["steps", "submit"] as const).map(t => (
              <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === "steps" ? "Кроки" : "Звіт"}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
            {tab === "steps" && method && method.procedureSteps.map((st, i) => {
              const p = session.stepProgress.find(pp => pp.stepId === st.id);
              const done = p?.completed;
              return (
                <Pressable
                  key={st.id}
                  onPress={() => mode === "student" && session.status !== "submitted" && session.status !== "graded" && toggleSessionStep(session.id, st.id)}
                  style={[s.stepCard, done && { backgroundColor: lab.ok + "0d", borderColor: lab.ok + "33" }]}
                >
                  <View style={[s.stepCheck, done && { backgroundColor: lab.ok, borderColor: lab.ok }]}>
                    {done && <Icons.Check size={12} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.stepRowTitle, done && { textDecorationLine: "line-through", color: colors.muted }]}>
                      {i + 1}. {st.title}
                    </Text>
                    {st.description ? <Text style={s.detailBoxText}>{st.description}</Text> : null}
                    <Text style={s.stepDur}>· {st.expectedMinutes} хв</Text>
                  </View>
                </Pressable>
              );
            })}
            {tab === "submit" && (
              <View style={{ gap: 12 }}>
                <FieldRow label="Спостереження / процес">
                  <TextInput
                    style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
                    multiline
                    editable={mode === "student" && session.status !== "submitted" && session.status !== "graded"}
                    value={session.submissionNotes}
                    onChangeText={t => updateSessionSubmission(session.id, { submissionNotes: t })}
                    placeholder="Опишіть процес, відхилення, проблеми"
                    placeholderTextColor={colors.mutedSoft}
                  />
                </FieldRow>
                <FieldRow label="Висновки">
                  <TextInput
                    style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
                    multiline
                    editable={mode === "student" && session.status !== "submitted" && session.status !== "graded"}
                    value={session.conclusions}
                    onChangeText={t => updateSessionSubmission(session.id, { conclusions: t })}
                    placeholder="Кінцеві висновки і інтерпретація"
                    placeholderTextColor={colors.mutedSoft}
                  />
                </FieldRow>
                {session.linkedRunIds.length > 0 && (
                  <View style={s.detailBox}>
                    <Text style={s.detailBoxLabel}>ШВИДКІ АНАЛІЗИ В РАМКАХ</Text>
                    <Text style={s.detailBoxText}>{session.linkedRunIds.length} прив'язано</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {mode === "instructor" && (
              <>
                <Pressable style={[s.actionBtn, { backgroundColor: lab.danger + "15" }]} onPress={() => Alert.alert("Видалити сесію?", "", [
                  { text: "Скасувати", style: "cancel" },
                  { text: "Видалити", style: "destructive", onPress: () => { deleteSession(session.id); onClose(); } },
                ])}>
                  <Icons.Trash2 size={14} color={lab.danger} />
                </Pressable>
                {session.status === "submitted" && (
                  <Pressable style={[s.actionBtn, { backgroundColor: lab.accent, flex: 1 }]} onPress={() => onGrade(session)}>
                    <Icons.Award size={14} color="#fff" />
                    <Text style={[s.actionBtnText, { color: "#fff" }]}>Оцінити</Text>
                  </Pressable>
                )}
              </>
            )}
            {canSubmit && (
              <Pressable style={[s.actionBtn, { backgroundColor: lab.bio, flex: 1 }]} onPress={() => { submitSession(session.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); }}>
                <Icons.Send size={14} color="#fff" />
                <Text style={[s.actionBtnText, { color: "#fff" }]}>Здати на оцінку</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Grader Modal ─────────────────────────────────────────────────────────────
function GraderModal({ session, onClose }: { session: LabCourseSession | null; onClose: () => void }) {
  const { labMethodologies, gradeSession, returnSession } = useMobileStore();
  const method = session ? labMethodologies.find(m => m.id === session.methodologyId) : null;
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");

  if (!session || !method) return null;

  const totalScore = method.gradingCriteria.reduce((sum, c) => sum + (parseInt(scores[c.id], 10) || 0), 0);

  function handleSubmit() {
    if (!session || !method) return;
    const breakdown: SessionGradeBreakdown[] = method.gradingCriteria.map(c => ({
      criterionId: c.id,
      points: Math.min(c.maxPoints, parseInt(scores[c.id], 10) || 0),
      comment: "",
    }));
    gradeSession(session.id, { totalScore, breakdown, feedback });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  function handleReturn() {
    if (!session) return;
    if (!feedback.trim()) { Alert.alert("Додайте коментар з причиною повернення"); return; }
    returnSession(session.id, feedback);
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.editorSheet} onPress={() => {}}>
          <View style={s.editorHeader}>
            <Text style={s.sheetTitle}>Оцінювання</Text>
            <Pressable onPress={onClose}><Icons.X size={20} color={colors.muted} /></Pressable>
          </View>
          <Text style={s.detailMeta}>{session.studentName} · {session.methodologyTitle}</Text>

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
            <View style={s.detailBox}>
              <Text style={s.detailBoxLabel}>СПОСТЕРЕЖЕННЯ СТУДЕНТА</Text>
              <Text style={s.detailBoxText}>{session.submissionNotes || "(порожньо)"}</Text>
            </View>
            <View style={s.detailBox}>
              <Text style={s.detailBoxLabel}>ВИСНОВКИ СТУДЕНТА</Text>
              <Text style={s.detailBoxText}>{session.conclusions || "(порожньо)"}</Text>
            </View>

            <Text style={s.sectionLabel}>БАЛИ ЗА КРИТЕРІЯМИ</Text>
            {method.gradingCriteria.map(c => (
              <View key={c.id} style={s.gradeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.gradeLabel}>{c.label}</Text>
                  <Text style={s.gradeMax}>макс. {c.maxPoints}</Text>
                </View>
                <TextInput
                  style={[s.input, { width: 80, textAlign: "center" }]}
                  value={scores[c.id] || ""}
                  onChangeText={t => setScores(prev => ({ ...prev, [c.id]: t.replace(/[^0-9]/g, "") }))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedSoft}
                />
              </View>
            ))}

            <View style={[s.detailBox, { backgroundColor: lab.accent + "0d", borderWidth: 1, borderColor: lab.accent + "33" }]}>
              <Text style={[s.detailBoxText, { fontSize: 18, fontFamily: fonts.bold, color: lab.accent, textAlign: "center" }]}>
                {totalScore} / {method.maxScore} балів
              </Text>
            </View>

            <FieldRow label="Коментар для студента">
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
                multiline
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Що вийшло добре, що варто покращити"
                placeholderTextColor={colors.mutedSoft}
              />
            </FieldRow>
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={[s.actionBtn, { backgroundColor: lab.amber + "15" }]} onPress={handleReturn}>
              <Icons.RotateCcw size={14} color={lab.amber} />
              <Text style={[s.actionBtnText, { color: lab.amber }]}>На доопрацювання</Text>
            </Pressable>
            <Pressable style={[s.actionBtn, { backgroundColor: lab.ok, flex: 1 }]} onPress={handleSubmit}>
              <Icons.CircleCheck size={14} color="#fff" />
              <Text style={[s.actionBtnText, { color: "#fff" }]}>Зберегти оцінку</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ListSection({ title, count, onAdd, children }: { title: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return (
    <View style={s.listSection}>
      <View style={s.listHeader}>
        <Text style={s.fieldLabel}>{title} ({count})</Text>
        <Pressable onPress={onAdd} style={s.addBtn}>
          <Icons.Plus size={12} color={lab.accent} />
          <Text style={s.addBtnText}>Додати</Text>
        </Pressable>
      </View>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );
}

function presetToMethodology(p: MethodologyPreset): Omit<LabMethodology, "id" | "projectId" | "instructorId" | "instructorName" | "status" | "createdAt" | "updatedAt"> {
  return {
    title: p.title,
    emoji: p.emoji,
    description: p.description,
    procedureSteps: p.procedureSteps.map((st, i) => ({ ...st, id: `st_${Date.now()}_${i}` })),
    materials: p.materials.map((m, i) => ({ ...m, id: `mat_${Date.now()}_${i}` })),
    safetyNotes: p.safetyNotes,
    expectedResults: p.expectedResults,
    gradingCriteria: p.gradingCriteria.map((c, i) => ({ ...c, id: `cr_${Date.now()}_${i}` })),
    maxScore: p.maxScore,
    durationMinutes: p.durationMinutes,
    bslLevel: p.bslLevel,
  };
}

const s = StyleSheet.create({
  heroCard:     { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: 16 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.13)", alignItems: "center", justifyContent: "center" },
  heroTitle:    { fontSize: 16, fontFamily: fonts.bold, color: "#fff" },
  heroSub:      { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2, lineHeight: 16 },

  switcher:     { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 12, padding: 4 },
  switchTab:    { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
  switchTabActive: { backgroundColor: "#fff", elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3 },
  switchText:   { fontSize: 12, fontWeight: "700", color: colors.muted },
  switchTextActive: { color: colors.ink },

  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase" },

  createBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: lab.accent, padding: 12, borderRadius: 12 },
  createBtnText: { fontSize: 13, color: "#fff", fontWeight: "800" },

  emptyBox:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f8fafc", borderRadius: 12, padding: 14 },
  emptyText:    { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 16 },

  card:         { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "white", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  cardEmoji:    { fontSize: 26 },
  cardTitle:    { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  cardMeta:     { fontSize: 11, color: colors.muted, marginTop: 1 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  statusBadgeText: { fontSize: 10, fontWeight: "900" },
  iconBtn:      { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },
  actionBtnSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: lab.accent },
  actionBtnText: { fontSize: 11, fontWeight: "800", color: "#fff" },

  backdrop:     { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 28, gap: 12, maxHeight: "92%" },
  sheetHandle:  { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  sheetTitle:   { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  sheetSub:     { fontSize: 12, color: colors.muted, lineHeight: 16 },
  editorSheet:  { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 28, gap: 10, maxHeight: "92%" },
  editorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  editorActions: { flexDirection: "row", gap: 8, marginTop: 6 },

  blankBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, borderStyle: "dashed" },
  blankBtnText: { fontSize: 13, fontWeight: "800", color: colors.primary },
  presetRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, backgroundColor: "#f8fafc" },

  fieldLabel:   { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: colors.muted, textTransform: "uppercase" },
  input:        { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 9, fontSize: 13, color: colors.ink },
  bslRow:       { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  bslChip:      { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  bslChipText:  { fontSize: 10, fontWeight: "800", color: colors.muted },

  listSection:  { gap: 6 },
  listHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addBtn:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: lab.accent + "15", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  addBtnText:   { fontSize: 11, color: lab.accent, fontWeight: "800" },
  listItem:     { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  listIdx:      { fontSize: 13, fontWeight: "800", color: colors.muted, marginTop: 10 },

  actionBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 10 },

  detailHead:   { flexDirection: "row", alignItems: "center", gap: 10 },
  detailEmoji:  { fontSize: 28 },
  detailMeta:   { fontSize: 11, color: colors.muted, marginTop: 2 },
  detailBox:    { backgroundColor: "#f8fafc", borderRadius: 10, padding: 12 },
  detailBoxLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: colors.mutedSoft, marginBottom: 4 },
  detailBoxText: { fontSize: 12, color: colors.ink, lineHeight: 17 },
  stepRowTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  stepDur:      { fontSize: 11, color: colors.muted, fontWeight: "600" },

  // Session runner
  progressBar:  { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, color: colors.muted, fontWeight: "700" },
  tabs:         { flexDirection: "row", gap: 4, backgroundColor: "#f1f5f9", padding: 3, borderRadius: 10 },
  tab:          { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 7 },
  tabActive:    { backgroundColor: "#fff", elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2 },
  tabText:      { fontSize: 12, color: colors.muted, fontWeight: "700" },
  tabTextActive: { color: colors.ink },
  stepCard:     { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  stepCheck:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 2 },

  // Grader
  gradeRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  gradeLabel:   { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  gradeMax:     { fontSize: 11, color: colors.muted, marginTop: 1 },
});
