import { useEffect } from "react";
import { router } from "expo-router";

// Legacy route. Старий екран селекції проєктів замінений вкладкою "Простір".
// Лишаємо файл як перенаправлення, щоб deep-link `/projects` і код,
// що ще не оновлений, продовжували працювати.
export default function ProjectsLegacyRedirect() {
  useEffect(() => {
    router.replace("/space");
  }, []);
  return null;
}
