import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "./api";
import { type MobileProject, type LearningSession, type LearningAssignment } from "./mock-data";

const DIARY_DRAFTS_KEY = "research_navigator_mobile.diary_drafts.v1";
const PURCHASE_DRAFTS_KEY = "research_navigator_mobile.purchase_drafts.v1";
const ACTIVE_PROJECT_KEY = "research_navigator_mobile.active_project_id.v1";

export type User = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type QuickDraft = {
  id: string;
  body: string;
  createdAt: string;
  projectId: string;
  type: "diary";
};

export type PurchaseRequestDraft = {
  id: string;
  amount: number;
  category: string;
  createdAt: string;
  projectId: string;
  title: string;
  vendor?: string;
};

export type DiaryEntryInput = {
  type: "note" | "meeting" | "task_done" | "event";
  title: string;
  body: string;
  date: string;
};

type MobileStore = {
  user: User | null;
  activeProjectId: string | null;
  projects: MobileProject[];
  sessions: LearningSession[];
  assignments: LearningAssignment[];
  drafts: QuickDraft[];
  hydrated: boolean;
  loading: boolean;
  purchaseDrafts: PurchaseRequestDraft[];
  setActiveProject: (id: string | null, remember: boolean) => void;
  fetchMe: () => Promise<User | null>;
  fetchProjects: () => Promise<void>;
  fetchLearningData: () => Promise<void>;
  addDiaryDraft: (body: string) => QuickDraft;
  syncDiaryEntry: (input: DiaryEntryInput) => Promise<void>;
  addPurchaseDraft: (input: Omit<PurchaseRequestDraft, "createdAt" | "id" | "projectId">) => PurchaseRequestDraft;
  clearDrafts: () => void;
  clearPurchaseDrafts: () => void;
};

const MobileStoreContext = createContext<MobileStore | null>(null);

export function MobileStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<MobileProject[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [assignments, setAssignments] = useState<LearningAssignment[]>([]);
  const [drafts, setDrafts] = useState<QuickDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchaseDrafts, setPurchaseDrafts] = useState<PurchaseRequestDraft[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      const [diaryValue, purchaseValue, activeId] = await Promise.all([
        AsyncStorage.getItem(DIARY_DRAFTS_KEY),
        AsyncStorage.getItem(PURCHASE_DRAFTS_KEY),
        AsyncStorage.getItem(ACTIVE_PROJECT_KEY),
      ]);

      if (!mounted) return;
      if (diaryValue) setDrafts(JSON.parse(diaryValue) as QuickDraft[]);
      if (purchaseValue) setPurchaseDrafts(JSON.parse(purchaseValue) as PurchaseRequestDraft[]);
      if (activeId) setActiveProjectId(activeId);
      
      // Try to restore session
      try {
        const res = await apiRequest<{ user: User }>("/api/auth/me");
        if (mounted) setUser(res.user);
      } catch {
        // ignore — not logged in
      }
      
      setHydrated(true);
    }

    loadInitialData().catch(() => setHydrated(true));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(DIARY_DRAFTS_KEY, JSON.stringify(drafts)).catch(() => undefined);
  }, [drafts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PURCHASE_DRAFTS_KEY, JSON.stringify(purchaseDrafts)).catch(() => undefined);
  }, [hydrated, purchaseDrafts]);

  const store = useMemo<MobileStore>(() => ({
    user,
    activeProjectId,
    projects,
    sessions,
    assignments,
    drafts,
    hydrated,
    loading,
    purchaseDrafts,
    setActiveProject: (id, remember) => {
      setActiveProjectId(id);
      if (remember && id) {
        AsyncStorage.setItem(ACTIVE_PROJECT_KEY, id).catch(() => undefined);
      } else if (!id) {
        AsyncStorage.removeItem(ACTIVE_PROJECT_KEY).catch(() => undefined);
      }
    },
    fetchMe: async () => {
      try {
        const res = await apiRequest<{ user: User }>("/api/auth/me");
        setUser(res.user);
        return res.user;
      } catch {
        setUser(null);
        return null;
      }
    },
    fetchProjects: async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ projects: MobileProject[] }>("/api/projects");
        setProjects(res.projects);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      } finally {
        setLoading(false);
      }
    },
    fetchLearningData: async () => {
      if (!activeProjectId) return;
      setLoading(true);
      try {
        const res = await apiRequest<{ sessions: LearningSession[], assignments: LearningAssignment[] }>(
          `/api/learning?projectId=${activeProjectId}`
        );
        setSessions(res.sessions);
        setAssignments(res.assignments);
      } catch (e) {
        console.error("Failed to fetch learning data", e);
      } finally {
        setLoading(false);
      }
    },
    syncDiaryEntry: async (input) => {
      if (!activeProjectId) return;
      await apiRequest("/api/records/diary", {
        method: "POST",
        body: JSON.stringify({
          ...input,
          projectId: activeProjectId,
        }),
      });
    },
    addDiaryDraft: (body) => {
      const draft: QuickDraft = {
        id: `${Date.now()}`,
        body: body.trim(),
        createdAt: new Date().toISOString(),
        projectId: activeProjectId || "demo-project",
        type: "diary",
      };
      setDrafts((current) => [draft, ...current]);
      return draft;
    },
    addPurchaseDraft: (input) => {
      const draft: PurchaseRequestDraft = {
        ...input,
        amount: Math.max(0, input.amount),
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        projectId: activeProjectId || "demo-project",
        title: input.title.trim(),
        vendor: input.vendor?.trim() || undefined,
      };
      setPurchaseDrafts((current) => [draft, ...current]);
      return draft;
    },
    clearDrafts: () => setDrafts([]),
    clearPurchaseDrafts: () => setPurchaseDrafts([]),
  }), [user, activeProjectId, projects, sessions, assignments, drafts, hydrated, loading, purchaseDrafts]);

  useEffect(() => {
    if (user && hydrated) {
      store.fetchProjects().catch(() => undefined);
      if (activeProjectId) {
        store.fetchLearningData().catch(() => undefined);
      }
    }
  }, [user, activeProjectId, hydrated]);

  return (
    <MobileStoreContext.Provider value={store}>
      {children}
    </MobileStoreContext.Provider>
  );
}

export function useMobileStore() {
  const store = useContext(MobileStoreContext);
  if (!store) {
    throw new Error("useMobileStore must be used inside MobileStoreProvider");
  }
  return store;
}
