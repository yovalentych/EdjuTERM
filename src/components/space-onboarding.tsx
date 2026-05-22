"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowRight, X, Sparkles } from "lucide-react";

const STORAGE_KEY = "edjuterm.space_onboarding.v1";

const SLIDES = [
  {
    emoji: "🗂",
    title: "Простір — це контейнер",
    body: "Кожен Простір організовує проєкти за контекстом: бакалаврат, магістратура, робота, особисте — створюйте окремі.",
    accent: "#0f766e",
  },
  {
    emoji: "📚",
    title: "Проєкти живуть у Просторах",
    body: "Лабораторії, дипломні роботи, курси, гранти. Один проєкт може бути одночасно у кількох Просторах — наприклад, курс, який ви ведете і де навчаєтесь.",
    accent: "#7c3aed",
  },
  {
    emoji: "👆",
    title: "Перемикайтесь зверху",
    body: "Натисніть на назву Простору вгорі — побачите усі ваші. Кнопка «Новий проєкт» додає проєкт у поточний Простір.",
    accent: "#0369a1",
  },
];

export function SpaceOnboarding() {
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  function complete() {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function goNext() {
    if (page < SLIDES.length - 1) {
      const next = page + 1;
      scrollRef.current?.scrollTo({ left: next * (scrollRef.current.clientWidth ?? 0), behavior: "smooth" });
      setPage(next);
    } else {
      complete();
    }
  }

  function handleScroll() {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth || 1;
    const idx = Math.round(scrollRef.current.scrollLeft / w);
    if (idx !== page) setPage(idx);
  }

  if (!visible) return null;

  const slide = SLIDES[page];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-gradient-to-br from-slate-50/90 via-white/95 to-slate-50/90 backdrop-blur-xl"
      style={{
        background: `radial-gradient(ellipse at 70% 0%, ${slide.accent}1f 0%, transparent 50%), radial-gradient(ellipse at 30% 100%, ${slide.accent}1a 0%, transparent 50%), rgba(255,255,255,0.95)`,
      }}
    >
      {/* Skip */}
      <button
        type="button"
        onClick={complete}
        className="absolute right-5 top-5 rounded-full bg-slate-200/70 px-3 py-1.5 text-xs font-bold text-slate-600 backdrop-blur transition hover:bg-slate-300/70"
      >
        Пропустити
      </button>

      <div className="flex h-full w-full max-w-2xl flex-col items-center justify-between px-6 py-12">
        {/* Slides */}
        <div className="flex flex-1 items-center justify-center">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex w-screen max-w-2xl snap-x snap-mandatory overflow-x-auto scroll-smooth no-scrollbar"
          >
            {SLIDES.map((s, idx) => (
              <div
                key={idx}
                className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-8 text-center"
              >
                <div
                  className="mb-8 flex h-36 w-36 items-center justify-center rounded-full border-2 shadow-2xl"
                  style={{
                    background: `${s.accent}18`,
                    borderColor: `${s.accent}40`,
                  }}
                >
                  <span className="text-7xl">{s.emoji}</span>
                </div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight" style={{ color: s.accent }}>
                  {s.title}
                </h2>
                <p className="max-w-md text-base leading-relaxed text-slate-700">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="my-6 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="block h-2 rounded-full transition-all"
              style={{
                width: i === page ? 28 : 8,
                background: i === page ? slide.accent : "#cbd5e1",
              }}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={goNext}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white shadow-xl transition hover:-translate-y-0.5"
          style={{
            background: slide.accent,
            boxShadow: `0 12px 28px -8px ${slide.accent}80`,
          }}
        >
          <span>{page === SLIDES.length - 1 ? "Розпочати" : "Далі"}</span>
          {page === SLIDES.length - 1 ? <Sparkles className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* Hide scrollbar для slides */
