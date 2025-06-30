import { useEffect, useState } from "react";

export function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      const body = document.body;
      const isDark =
        body.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };
    updateTheme();
  }, []);

  return theme;
}
