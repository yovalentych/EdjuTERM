export const OPENAI_SYLLABUS_MODELS = [
  {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    description: "Баланс ціни, швидкості й якості для більшості силабусів.",
  },
  {
    id: "gpt-5.4",
    label: "GPT-5.4",
    description: "Кращий аналіз складних таблиць і неоднозначних планів.",
  },
  {
    id: "gpt-5.5",
    label: "GPT-5.5",
    description: "Найсильніший режим для важких PDF, дорожчий і повільніший.",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 mini",
    description: "Швидкий дешевший fallback для простих структурованих файлів.",
  },
] as const;

export type OpenAiSyllabusModel = (typeof OPENAI_SYLLABUS_MODELS)[number]["id"];

export type AiSystemSettings = {
  openAiSyllabusModel: OpenAiSyllabusModel;
};
