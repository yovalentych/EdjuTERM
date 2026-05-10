"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileJson,
  FileSignature,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  Layout,
  List,
  Minus,
  Plus,
  Printer,
  Quote,
  Save,
  Sigma,
  Table as TableIcon,
  Terminal,
  Trash2,
  Type,
  Users,
  X,
} from "lucide-react";
import { useLayoutEffect, useRef, useState, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  Manuscript,
  ManuscriptAuthor,
  ManuscriptBlock,
  ManuscriptBlockType,
  ManuscriptStatus,
  SafeUser,
} from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import { exportManuscriptToDocx } from "@/lib/exporters/manuscript-docx-exporter";
import { exportManuscriptToMd } from "@/lib/exporters/manuscript-md-exporter";
import { updateManuscriptAction } from "@/app/actions";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUSES: ManuscriptStatus[] = ["draft", "review", "submitted", "revision", "published"];

const STATUS_LABEL_UK: Record<ManuscriptStatus, string> = {
  draft: "Чернетка",
  review: "Рецензування",
  submitted: "Подано",
  revision: "Ревізія",
  published: "Опубліковано",
};
const STATUS_LABEL_EN: Record<ManuscriptStatus, string> = {
  draft: "Draft",
  review: "Review",
  submitted: "Submitted",
  revision: "Revision",
  published: "Published",
};
const STATUS_COLOR: Record<ManuscriptStatus, string> = {
  draft: "border-slate-300 bg-slate-50 text-slate-600",
  review: "border-amber-300 bg-amber-50 text-amber-700",
  submitted: "border-blue-400 bg-blue-50 text-blue-700",
  revision: "border-orange-400 bg-orange-50 text-orange-700",
  published: "border-emerald-400 bg-emerald-50 text-emerald-700",
};
const STATUS_ACTIVE: Record<ManuscriptStatus, string> = {
  draft: "border-slate-500 bg-slate-600 text-white shadow",
  review: "border-amber-500 bg-amber-500 text-white shadow",
  submitted: "border-blue-600 bg-blue-600 text-white shadow",
  revision: "border-orange-500 bg-orange-500 text-white shadow",
  published: "border-emerald-600 bg-emerald-600 text-white shadow",
};

// ── Dissertation compliance checks ───────────────────────────────────────────

interface ComplianceCheck {
  key: string;
  label_uk: string;
  label_en: string;
  pass: boolean;
}

function getDissertationChecks(state: {
  abstract: string;
  keywords: string[];
  authors: ManuscriptAuthor[];
  blocks: ManuscriptBlock[];
}): ComplianceCheck[] {
  const blockText = (b: ManuscriptBlock) => b.content.toLowerCase();
  const hasHeading = (needle: string) =>
    state.blocks.some((b) => b.type.startsWith("h") && blockText(b).includes(needle));
  const hasContent = (needle: string) =>
    state.blocks.some((b) => blockText(b).includes(needle));

  return [
    {
      key: "abstract",
      label_uk: "Анотація (≥100 символів)",
      label_en: "Abstract (≥100 chars)",
      pass: state.abstract.trim().length >= 100,
    },
    {
      key: "keywords",
      label_uk: "Ключових слів ≥ 5",
      label_en: "Keywords ≥ 5",
      pass: state.keywords.length >= 5,
    },
    {
      key: "authors",
      label_uk: "Автори вказані",
      label_en: "Authors listed",
      pass: state.authors.length > 0,
    },
    {
      key: "vstup",
      label_uk: "Розділ ВСТУП",
      label_en: "Introduction section",
      pass: hasHeading("вступ"),
    },
    {
      key: "aktualnist",
      label_uk: "Актуальність теми",
      label_en: "Relevance stated",
      pass: hasContent("актуальність"),
    },
    {
      key: "meta_zadachi",
      label_uk: "Мета і задачі дослідження",
      label_en: "Aim and objectives",
      pass: hasContent("мета") && hasContent("задач"),
    },
    {
      key: "novizna",
      label_uk: "Наукова новизна",
      label_en: "Scientific novelty",
      pass: hasContent("наукова новизна") || hasContent("новизна одержаних"),
    },
    {
      key: "praktychne",
      label_uk: "Практичне значення",
      label_en: "Practical significance",
      pass: hasContent("практичне значення"),
    },
    {
      key: "vysnovky_rozdilu",
      label_uk: "Висновки до розділів",
      label_en: "Chapter conclusions",
      pass: hasContent("висновки до розділу") || hasContent("висновки до главы"),
    },
    {
      key: "vysnovky",
      label_uk: "Розділ ВИСНОВКИ",
      label_en: "Conclusions section",
      pass: hasHeading("висновк"),
    },
    {
      key: "bibliography",
      label_uk: "Список використаних джерел",
      label_en: "Bibliography",
      pass: hasContent("список використаних"),
    },
    {
      key: "publications",
      label_uk: "Список публікацій здобувача",
      label_en: "Applicant's publications",
      pass: hasContent("список публікацій"),
    },
  ];
}

// ── Auto-resize textarea ──────────────────────────────────────────────────────

function AutoResizeTextarea({
  value,
  onChange,
  className,
  placeholder,
  minRows = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = Math.max(el.scrollHeight, minRows * 24) + "px";
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={{ overflow: "hidden", resize: "none" }}
    />
  );
}

// ── Keyword tag input ─────────────────────────────────────────────────────────

function KeywordInput({
  keywords,
  onChange,
  locale,
}: {
  keywords: string[];
  onChange: (kw: string[]) => void;
  locale: string;
}) {
  const [input, setInput] = useState("");
  const isUk = locale === "uk";

  const addKeyword = () => {
    const kw = input.trim();
    if (!kw || keywords.includes(kw) || keywords.length >= 20) return;
    onChange([...keywords, kw]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <span key={kw} className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {kw}
            <button
              type="button"
              onClick={() => onChange(keywords.filter((k) => k !== kw))}
              className="ml-0.5 text-blue-400 hover:text-blue-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addKeyword();
            }
          }}
          placeholder={isUk ? "Ключове слово + Enter" : "Keyword + Enter"}
          className="input-control flex-1 px-2 py-1.5 text-xs outline-none"
        />
      </div>
    </div>
  );
}

// ── Author list editor ────────────────────────────────────────────────────────

function AuthorsEditor({
  authors,
  members,
  onChange,
  locale,
}: {
  authors: ManuscriptAuthor[];
  members: SafeUser[];
  onChange: (authors: ManuscriptAuthor[]) => void;
  locale: string;
}) {
  const isUk = locale === "uk";
  const [customName, setCustomName] = useState("");

  const isAdded = (userId?: string) =>
    !!userId && authors.some((a) => a.userId === userId);

  const addMember = (member: SafeUser) => {
    if (isAdded(member._id)) {
      onChange(authors.filter((a) => a.userId !== member._id));
      return;
    }
    const newAuthor: ManuscriptAuthor = {
      name: `${member.firstName} ${member.lastName}`,
      affiliation: member.affiliation ?? "",
      role: authors.length === 0 ? "first" : "co",
      userId: member._id,
    };
    onChange([...authors, newAuthor]);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    onChange([...authors, { name, affiliation: "", role: "co" }]);
    setCustomName("");
  };

  const removeAuthor = (idx: number) => {
    onChange(authors.filter((_, i) => i !== idx));
  };

  const setRole = (idx: number, role: ManuscriptAuthor["role"]) => {
    onChange(authors.map((a, i) => (i === idx ? { ...a, role } : a)));
  };

  const roleLabel = (role: ManuscriptAuthor["role"]) =>
    isUk
      ? role === "first" ? "перший" : role === "corresponding" ? "відп." : "спів."
      : role === "first" ? "first" : role === "corresponding" ? "corr." : "co";

  return (
    <div className="space-y-2">
      {/* Added authors */}
      {authors.length > 0 && (
        <ul className="space-y-1">
          {authors.map((a, idx) => (
            <li key={idx} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <span className="flex-1 truncate text-xs font-medium text-slate-800">{a.name}</span>
              <select
                value={a.role}
                onChange={(e) => setRole(idx, e.target.value as ManuscriptAuthor["role"])}
                className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] text-slate-600 outline-none"
              >
                <option value="first">{isUk ? "перший" : "first"}</option>
                <option value="corresponding">{isUk ? "відпов." : "corr."}</option>
                <option value="co">{isUk ? "співавт." : "co"}</option>
              </select>
              <button onClick={() => removeAuthor(idx)} className="text-slate-300 hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Project members */}
      {members.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {members.map((m) => (
            <button
              key={m._id}
              type="button"
              onClick={() => addMember(m)}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                isAdded(m._id)
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-500 hover:border-blue-200"
              }`}
            >
              {isAdded(m._id) ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              {m.firstName} {m.lastName}
            </button>
          ))}
        </div>
      )}

      {/* External author */}
      <div className="flex gap-1">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder={isUk ? "Зовнішній автор + Enter" : "External author + Enter"}
          className="input-control flex-1 px-2 py-1.5 text-xs outline-none"
        />
      </div>
    </div>
  );
}

// ── Block insert bar ──────────────────────────────────────────────────────────

const INSERT_BLOCKS: Array<{ type: ManuscriptBlockType; icon?: React.ReactNode; label?: string; title: string }> = [
  { type: "paragraph", icon: <Type className="h-3 w-3" />, title: "Text" },
  { type: "h2", label: "H2", title: "Heading 2" },
  { type: "h3", label: "H3", title: "Heading 3" },
  { type: "quote", icon: <Quote className="h-3 w-3" />, title: "Quote" },
  { type: "table", icon: <TableIcon className="h-3 w-3" />, title: "Table" },
  { type: "figure", icon: <ImageIcon className="h-3 w-3" />, title: "Figure" },
  { type: "code", icon: <Terminal className="h-3 w-3" />, title: "Code" },
  { type: "math", icon: <Sigma className="h-3 w-3" />, title: "Math" },
  { type: "divider", icon: <Minus className="h-3 w-3" />, title: "Divider" },
];

// ── Main editor ───────────────────────────────────────────────────────────────

export function ManuscriptEditor({
  manuscript,
  onBack,
  onUpdate,
  dictionary,
  locale,
  user,
  projectId,
  records = [],
  members = [],
}: {
  manuscript: Manuscript;
  onBack: () => void;
  onUpdate: (updated: Manuscript) => void;
  dictionary: Dictionary;
  locale: string;
  user: SafeUser;
  projectId: string;
  records?: any[];
  members?: SafeUser[];
}) {
  const isUk = locale === "uk";

  // Editor state
  const [blocks, setBlocks] = useState<ManuscriptBlock[]>(manuscript.blocks);
  const [title, setTitle] = useState(manuscript.title);
  const [status, setStatus] = useState<ManuscriptStatus>(manuscript.status);
  const [abstract, setAbstract] = useState(manuscript.abstract ?? "");
  const [keywords, setKeywords] = useState<string[]>(manuscript.keywords ?? []);
  const [authors, setAuthors] = useState<ManuscriptAuthor[]>(manuscript.authors ?? []);
  const [journal, setJournal] = useState(manuscript.journal ?? "");
  const [doi, setDoi] = useState(manuscript.doi ?? "");
  const [attachedRecordIds, setAttachedRecordIds] = useState<string[]>(manuscript.attachedRecordIds);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"toc" | "info" | "check">("toc");

  // ── Derived ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const text = blocks.map((b) => b.content).join(" ");
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    const chars = text.replace(/\s/g, "").length;
    const readTime = Math.ceil(words / 200);
    return { words, chars, readTime };
  }, [blocks]);

  const toc = useMemo(() => {
    return blocks
      .filter((b) => b.type.startsWith("h"))
      .map((b) => ({
        id: b.id,
        text: b.content || (isUk ? "Без заголовка" : "Untitled"),
        level: parseInt(b.type.charAt(1)) || 1,
      }));
  }, [blocks, isUk]);

  const complianceChecks = useMemo(
    () =>
      manuscript.type === "dissertation"
        ? getDissertationChecks({ abstract, keywords, authors, blocks })
        : [],
    [manuscript.type, abstract, keywords, authors, blocks],
  );
  const compliancePassed = complianceChecks.filter((c) => c.pass).length;

  // ── Block operations ──────────────────────────────────────────────────────────

  const addBlock = useCallback((type: ManuscriptBlockType, afterIndex?: number) => {
    const newBlock: ManuscriptBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: "",
    };
    if (typeof afterIndex === "number") {
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, newBlock);
        return next;
      });
    } else {
      setBlocks((prev) => [...prev, newBlock]);
    }
  }, []);

  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  }, []);

  const updateBlockMeta = useCallback((id: string, key: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, meta: { ...b.meta, [key]: value } } : b)),
    );
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const moveBlock = useCallback((index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const scrollToBlock = (id: string) => {
    document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateManuscriptAction(manuscript._id!, projectId, {
      title,
      status,
      abstract,
      keywords,
      authors,
      journal,
      doi,
      blocks,
      attachedRecordIds,
    });
    if (result.ok) {
      const updated = { ...manuscript, title, status, abstract, keywords, authors, journal, doi, blocks, attachedRecordIds, updatedAt: new Date() };
      onUpdate(updated);
      setSavedAt(new Date());
    }
    setIsSaving(false);
  };

  const currentManuscript = { ...manuscript, title, status, abstract, keywords, authors, journal, doi, blocks };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-start lg:gap-5">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="print:hidden sticky top-[88px] hidden w-56 shrink-0 lg:block">
        {/* Tab switcher */}
        <div className="mb-3 flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setSidebarTab("toc")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
              sidebarTab === "toc" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            {isUk ? "Зміст" : "TOC"}
          </button>
          <button
            onClick={() => setSidebarTab("info")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
              sidebarTab === "info" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            {isUk ? "Інфо" : "Info"}
          </button>
          {manuscript.type === "dissertation" && (
            <button
              onClick={() => setSidebarTab("check")}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                sidebarTab === "check" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {isUk ? "Чекліст" : "Check"}
              {compliancePassed < complianceChecks.length && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">
                  {complianceChecks.length - compliancePassed}
                </span>
              )}
            </button>
          )}
        </div>

        {/* TOC */}
        {sidebarTab === "toc" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <nav className="shell-scrollbar max-h-[45vh] overflow-y-auto">
                {toc.length === 0 ? (
                  <p className="text-xs italic text-slate-400">
                    {isUk ? "Додайте заголовки" : "Add headings"}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {toc.map((item) => (
                      <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 10}px` }}>
                        <button
                          onClick={() => scrollToBlock(item.id)}
                          className="line-clamp-1 text-left text-xs text-slate-500 hover:text-blue-600"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700">
                <Hash className="h-3.5 w-3.5" />
                {isUk ? "Статистика" : "Stats"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isUk ? "Слів" : "Words"}
                  </p>
                  <p className="text-lg font-bold text-slate-900">{stats.words.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isUk ? "Знаків" : "Chars"}
                  </p>
                  <p className="text-lg font-bold text-slate-900">{stats.chars.toLocaleString()}</p>
                </div>
                <div className="col-span-2 border-t border-slate-50 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isUk ? "Час читання" : "Read time"}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    ~{stats.readTime} {isUk ? "хв" : "min"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dissertation compliance checklist */}
        {sidebarTab === "check" && manuscript.type === "dissertation" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* Progress */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isUk ? "Готовність дисертації" : "Dissertation progress"}
                </p>
                <span className={`text-xs font-bold ${compliancePassed === complianceChecks.length ? "text-emerald-600" : "text-amber-600"}`}>
                  {compliancePassed}/{complianceChecks.length}
                </span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    compliancePassed === complianceChecks.length ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${(compliancePassed / complianceChecks.length) * 100}%` }}
                />
              </div>

              {/* Checklist items */}
              <ul className="space-y-2">
                {complianceChecks.map((check) => (
                  <li key={check.key} className="flex items-start gap-2">
                    {check.pass ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    )}
                    <span className={`text-xs leading-snug ${check.pass ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"}`}>
                      {isUk ? check.label_uk : check.label_en}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {compliancePassed === complianceChecks.length && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
                <p className="mt-1.5 text-xs font-semibold text-emerald-700">
                  {isUk ? "Всі вимоги виконано!" : "All requirements met!"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info panel */}
        {sidebarTab === "info" && (
          <div className="space-y-3">
            {/* Status */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Статус" : "Status"}
              </p>
              <div className="flex flex-col gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-lg border px-3 py-1.5 text-left text-xs font-semibold transition ${
                      status === s ? STATUS_ACTIVE[s] : STATUS_COLOR[s] + " hover:opacity-80"
                    }`}
                  >
                    {isUk ? STATUS_LABEL_UK[s] : STATUS_LABEL_EN[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Abstract */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Анотація" : "Abstract"}
              </p>
              <AutoResizeTextarea
                value={abstract}
                onChange={setAbstract}
                minRows={3}
                placeholder={isUk ? "Коротко опишіть суть роботи..." : "Brief description..."}
                className="w-full border-none bg-transparent text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>

            {/* Keywords */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Ключові слова" : "Keywords"}
              </p>
              <KeywordInput keywords={keywords} onChange={setKeywords} locale={locale} />
            </div>

            {/* Authors */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isUk ? "Автори" : "Authors"}
                </p>
              </div>
              <AuthorsEditor
                authors={authors}
                members={members}
                onChange={setAuthors}
                locale={locale}
              />
            </div>

            {/* Journal */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isUk ? "Журнал / Конференція" : "Journal / Conference"}
              </p>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder={isUk ? "Назва видання..." : "Publication name..."}
                className="input-control w-full px-2 py-1.5 text-xs outline-none"
              />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                DOI
              </p>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.xxxx/..."
                className="input-control mt-1 w-full px-2 py-1.5 text-xs outline-none"
              />
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Toolbar */}
        <div className="print:hidden sticky top-0 z-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
          <button
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="h-5 w-px shrink-0 bg-slate-200" />

          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "edit" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              {isUk ? "Редактор" : "Editor"}
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "preview" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {isUk ? "Перегляд" : "Preview"}
            </button>
          </div>

          <div className="flex-1" />

          {savedAt && (
            <span className="hidden text-[10px] text-slate-400 sm:block">
              {isUk ? "Збережено" : "Saved"} {savedAt.toLocaleTimeString(isUk ? "uk-UA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? (isUk ? "Збережен..." : "Saving...") : (isUk ? "Зберегти" : "Save")}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isUk ? "Експорт" : "Export"}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    onClick={async () => { await exportManuscriptToDocx(currentManuscript); setShowExportMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <FileText className="h-3.5 w-3.5" /> Word (.docx)
                  </button>
                  <button
                    onClick={() => { window.print(); setShowExportMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Printer className="h-3.5 w-3.5" /> PDF (.pdf)
                  </button>
                  <button
                    onClick={() => { exportManuscriptToMd(currentManuscript); setShowExportMenu(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <FileJson className="h-3.5 w-3.5" /> Markdown (.md)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Editor canvas */}
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          {viewMode === "edit" ? (
            <div className="space-y-1">
              {/* Title */}
              <AutoResizeTextarea
                value={title}
                onChange={setTitle}
                minRows={1}
                placeholder={isUk ? "Заголовок рукопису..." : "Manuscript title..."}
                className="w-full border-none bg-transparent font-serif text-4xl font-bold text-slate-900 outline-none placeholder:text-slate-200"
              />

              {/* Authors preview */}
              {authors.length > 0 && (
                <p className="text-sm text-slate-400">
                  {authors.map((a) => a.name).join(", ")}
                </p>
              )}

              {/* Abstract preview */}
              {abstract && (
                <div className="my-6 rounded-xl bg-slate-50 px-6 py-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {isUk ? "Анотація" : "Abstract"}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">{abstract}</p>
                </div>
              )}

              <div className="mt-8 space-y-1">
                {blocks.map((block, index) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    index={index}
                    total={blocks.length}
                    locale={locale}
                    onUpdate={updateBlock}
                    onUpdateMeta={updateBlockMeta}
                    onRemove={removeBlock}
                    onMove={moveBlock}
                    onInsert={addBlock}
                  />
                ))}
              </div>

              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <button
                    onClick={() => addBlock("paragraph")}
                    className="group flex flex-col items-center gap-3 text-slate-300 transition hover:text-blue-400"
                  >
                    <Plus className="h-12 w-12 rounded-full border-2 border-dashed border-current p-2" />
                    <span className="text-sm font-semibold">
                      {isUk ? "Додати перший блок" : "Add first block"}
                    </span>
                  </button>
                </div>
              )}

              {/* Bottom insert bar */}
              {blocks.length > 0 && (
                <div className="flex justify-center pt-6">
                  <div className="flex gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
                    {INSERT_BLOCKS.map((b) => (
                      <button
                        key={b.type}
                        onClick={() => addBlock(b.type)}
                        title={b.title}
                        className="flex h-7 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-slate-400 transition hover:bg-white hover:text-blue-600"
                      >
                        {b.icon ?? b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview */
            <PreviewMode manuscript={currentManuscript} locale={locale} records={records.filter((r) => attachedRecordIds.includes(r._id))} />
          )}
        </div>

        {/* Attachments manager (edit mode) */}
        {viewMode === "edit" && records.length > 0 && (
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {isUk ? "Прикріплені матеріали" : "Attached Materials"}
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {records.map((record) => {
                const isAttached = attachedRecordIds.includes(record._id);
                return (
                  <button
                    key={record._id}
                    onClick={() => setAttachedRecordIds(
                      isAttached
                        ? attachedRecordIds.filter((id) => id !== record._id)
                        : [...attachedRecordIds, record._id],
                    )}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                      isAttached ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400">{record.kind}</span>
                    <span className="mt-1 line-clamp-1 text-sm font-semibold text-slate-800">{record.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Block row ─────────────────────────────────────────────────────────────────

function BlockRow({
  block,
  index,
  total,
  locale,
  onUpdate,
  onUpdateMeta,
  onRemove,
  onMove,
  onInsert,
}: {
  block: ManuscriptBlock;
  index: number;
  total: number;
  locale: string;
  onUpdate: (id: string, content: string) => void;
  onUpdateMeta: (id: string, key: string, value: string) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onInsert: (type: ManuscriptBlockType, afterIndex: number) => void;
}) {
  const isUk = locale === "uk";

  return (
    <div id={`block-${block.id}`} className="group relative">
      {/* Inline controls */}
      <div className="absolute -left-10 top-1 flex flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
        {index > 0 && (
          <button onClick={() => onMove(index, "up")} className="rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600">
            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          </button>
        )}
        {index < total - 1 && (
          <button onClick={() => onMove(index, "down")} className="rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => onRemove(block.id)} className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block content */}
      <BlockContent block={block} locale={locale} onUpdate={onUpdate} onUpdateMeta={onUpdateMeta} />

      {/* Insert bar between blocks */}
      <div className="mt-1 flex h-6 items-center justify-center opacity-0 transition group-hover:opacity-100">
        <div className="flex gap-0.5 rounded-full border border-slate-200 bg-white px-0.5 py-0.5 shadow-sm">
          {INSERT_BLOCKS.map((b) => (
            <button
              key={b.type}
              onClick={() => onInsert(b.type, index)}
              title={b.title}
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
            >
              {b.icon ?? b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Block content renderer ────────────────────────────────────────────────────

function BlockContent({
  block,
  locale,
  onUpdate,
  onUpdateMeta,
}: {
  block: ManuscriptBlock;
  locale: string;
  onUpdate: (id: string, content: string) => void;
  onUpdateMeta: (id: string, key: string, value: string) => void;
}) {
  const isUk = locale === "uk";

  if (block.type === "divider") {
    return <hr className="my-4 border-slate-200" />;
  }

  if (block.type.startsWith("h")) {
    const sizes = { h1: "text-2xl", h2: "text-xl", h3: "text-lg" } as Record<string, string>;
    return (
      <AutoResizeTextarea
        value={block.content}
        onChange={(v) => onUpdate(block.id, v)}
        placeholder={isUk ? "Заголовок..." : "Heading..."}
        className={`w-full border-none bg-transparent font-bold text-slate-900 outline-none placeholder:text-slate-200 ${sizes[block.type] ?? "text-xl"}`}
      />
    );
  }

  if (block.type === "quote") {
    return (
      <div className="border-l-4 border-blue-200 pl-4">
        <AutoResizeTextarea
          value={block.content}
          onChange={(v) => onUpdate(block.id, v)}
          placeholder={isUk ? "Цитата..." : "Quote..."}
          minRows={2}
          className="w-full border-none bg-transparent italic text-slate-600 outline-none placeholder:text-slate-300"
        />
      </div>
    );
  }

  if (block.type === "figure") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <ImageIcon className="h-3 w-3" />
          {isUk ? "Рисунок" : "Figure"}
        </div>
        <input
          type="text"
          value={block.content}
          onChange={(e) => onUpdate(block.id, e.target.value)}
          placeholder="https://..."
          className="w-full border-none bg-transparent text-sm text-blue-600 outline-none placeholder:text-slate-300"
        />
        {block.content && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={block.content} alt={block.meta?.caption ?? ""} className="mx-auto max-h-64 object-contain" />
          </div>
        )}
        <input
          type="text"
          value={block.meta?.caption ?? ""}
          onChange={(e) => onUpdateMeta(block.id, "caption", e.target.value)}
          placeholder={isUk ? "Підпис до рисунку..." : "Figure caption..."}
          className="mt-2 w-full border-none bg-transparent text-center text-xs italic text-slate-500 outline-none placeholder:text-slate-300"
        />
      </div>
    );
  }

  if (block.type === "table" || block.type === "code" || block.type === "math") {
    const icons = {
      table: <TableIcon className="h-3 w-3" />,
      code: <Terminal className="h-3 w-3" />,
      math: <Sigma className="h-3 w-3" />,
    };
    const placeholders = {
      table: "| Col 1 | Col 2 |\n|-------|-------|\n| val   | val   |",
      code: "function example() {\n  return 42;\n}",
      math: "E = mc^2",
    };
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
        <div className="mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {icons[block.type as keyof typeof icons]}
          {block.type.toUpperCase()}
        </div>
        <AutoResizeTextarea
          value={block.content}
          onChange={(v) => onUpdate(block.id, v)}
          placeholder={placeholders[block.type as keyof typeof placeholders]}
          minRows={3}
          className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-300"
        />
      </div>
    );
  }

  // Paragraph
  return (
    <AutoResizeTextarea
      value={block.content}
      onChange={(v) => onUpdate(block.id, v)}
      placeholder={isUk ? "Напишіть текст... (Markdown підтримується)" : "Start writing... (Markdown supported)"}
      minRows={2}
      className="w-full border-none bg-transparent leading-7 text-slate-700 outline-none placeholder:text-slate-200"
    />
  );
}

// ── Preview ───────────────────────────────────────────────────────────────────

function PreviewMode({
  manuscript,
  locale,
  records,
}: {
  manuscript: Manuscript;
  locale: string;
  records: any[];
}) {
  const isUk = locale === "uk";
  let figureCount = 0;

  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-serif text-4xl font-bold text-slate-900">{manuscript.title}</h1>

      {/* Authors */}
      {manuscript.authors.length > 0 && (
        <p className="mt-2 text-sm text-slate-500">
          {manuscript.authors.map((a) => a.name).join(", ")}
          {manuscript.journal && ` · ${manuscript.journal}`}
        </p>
      )}

      {/* Abstract */}
      {manuscript.abstract && (
        <div className="my-6 rounded-xl bg-slate-50 px-6 py-4 not-prose">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isUk ? "Анотація" : "Abstract"}
          </p>
          <p className="text-sm leading-6 text-slate-700">{manuscript.abstract}</p>
        </div>
      )}

      {/* Keywords */}
      {manuscript.keywords.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5 not-prose">
          {manuscript.keywords.map((kw) => (
            <span key={kw} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {kw}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {manuscript.blocks.map((block) => {
          if (block.type === "divider") return <hr key={block.id} className="border-slate-200" />;
          if (block.type === "h1") return <h2 key={block.id} className="text-2xl font-bold">{block.content}</h2>;
          if (block.type === "h2") return <h3 key={block.id} className="text-xl font-bold">{block.content}</h3>;
          if (block.type === "h3") return <h4 key={block.id} className="text-lg font-bold">{block.content}</h4>;
          if (block.type === "paragraph") return (
            <div key={block.id} className="leading-7 text-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
            </div>
          );
          if (block.type === "quote") return (
            <blockquote key={block.id} className="border-l-4 border-blue-400 pl-4 italic text-slate-600">
              {block.content}
            </blockquote>
          );
          if (block.type === "code") return (
            <pre key={block.id} className="overflow-x-auto rounded-xl bg-slate-900 p-5 text-sm text-slate-100">
              <code>{block.content}</code>
            </pre>
          );
          if (block.type === "table") return (
            <div key={block.id} className="overflow-x-auto rounded-xl border border-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
            </div>
          );
          if (block.type === "math") return (
            <div key={block.id} className="flex justify-center rounded-xl bg-blue-50 p-5 font-serif italic text-lg">
              {block.content}
            </div>
          );
          if (block.type === "figure" && block.content) {
            figureCount++;
            const fc = figureCount;
            return (
              <figure key={block.id} className="my-6 not-prose">
                <img src={block.content} alt={block.meta?.caption ?? ""} className="mx-auto max-h-80 rounded-xl object-contain shadow-sm" />
                {block.meta?.caption && (
                  <figcaption className="mt-2 text-center text-sm italic text-slate-500">
                    {isUk ? "Рис." : "Fig."} {fc}. {block.meta.caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          return null;
        })}
      </div>

      {/* Attachments */}
      {records.length > 0 && (
        <div className="mt-16 border-t border-slate-200 pt-10 not-prose">
          <h2 className="text-xl font-bold text-slate-900">{isUk ? "Додатки та матеріали" : "Attachments"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {records.map((record) => (
              <div key={record._id} className="rounded-xl border border-slate-200 p-4">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">{record.kind}</span>
                <h4 className="mt-2 font-semibold text-slate-900">{record.title}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{record.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOI */}
      {manuscript.doi && (
        <p className="mt-10 text-xs text-slate-400 not-prose">DOI: {manuscript.doi}</p>
      )}
    </div>
  );
}
