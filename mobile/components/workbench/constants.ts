export const lab = {
  dark:    "#073d35",
  mid:     "#0f5c50",
  accent:  "#0f766e",
  soft:    "#d0faf5",
  amber:   "#d97706",
  danger:  "#be123c",
  ok:      "#047857",
  bio:     "#7c3aed",
  neutral: "#64748b",
};

export function hazardColor(h: string): string {
  switch (h) {
    case "toxic":     return lab.danger;
    case "flammable": return lab.amber;
    case "corrosive": return "#b45309";
    case "oxidizing": return "#0369a1";
    case "biohazard": return lab.bio;
    case "explosive": return "#991b1b";
    default:          return lab.neutral;
  }
}

export function hazardIcon(h: string): string {
  switch (h) {
    case "toxic":     return "☠";
    case "flammable": return "🔥";
    case "corrosive": return "⚗";
    case "oxidizing": return "🔵";
    case "biohazard": return "☣";
    case "explosive": return "💥";
    default:          return "•";
  }
}

export type Module =
  | "quick_run" | "course_session" | "activity_feed" | "lab_tools"
  | "inventory" | "equipment" | "diary" | "glp_journal" | "experiments"
  | "safety" | "waste" | "analytics" | "reports" | "notifications"
  | "schedule" | "access" | "library" | "team_chat";
