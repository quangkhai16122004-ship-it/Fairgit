import React from "react";
import type { Lang } from "../lib/translations";

type LanguageContextValue = {
  lang: Lang;
  toggle: () => void;
};

const LanguageContext = React.createContext<LanguageContextValue>({
  lang: "vi",
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Lang>(() => {
    const saved = localStorage.getItem("fairgit:lang");
    return saved === "en" ? "en" : "vi";
  });

  function toggle() {
    setLang((prev) => {
      const next = prev === "vi" ? "en" : "vi";
      localStorage.setItem("fairgit:lang", next);
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return React.useContext(LanguageContext);
}
