import { useMemo } from "react";
import { useMediaQuery } from "./useMediaQuery.js";

// Tailwind breakpoints:
// sm 640, md 768, lg 1024, xl 1280
export function useDevice() {
  const isSmUp = useMediaQuery("(min-width: 640px)");
  const isMdUp = useMediaQuery("(min-width: 768px)");
  const isLgUp = useMediaQuery("(min-width: 1024px)");
  const isXlUp = useMediaQuery("(min-width: 1280px)");

  const device = useMemo(() => {
    if (isLgUp) return "desktop";
    if (isMdUp) return "tablet";
    return "mobile";
  }, [isLgUp, isMdUp]);

  return {
    device,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
  };
}

