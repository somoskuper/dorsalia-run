"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MarketplaceSearchCtx = {
  filtersOpen: boolean;
  openFilters: () => void;
  closeFilters: () => void;
  toggleFilters: () => void;
};

const Ctx = createContext<MarketplaceSearchCtx | null>(null);

export function MarketplaceSearchProvider({ children }: { children: ReactNode }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const toggleFilters = useCallback(() => setFiltersOpen((v) => !v), []);
  const value = useMemo(
    () => ({ filtersOpen, openFilters, closeFilters, toggleFilters }),
    [filtersOpen, openFilters, closeFilters, toggleFilters],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketplaceSearch() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      filtersOpen: false,
      openFilters: () => {},
      closeFilters: () => {},
      toggleFilters: () => {},
    };
  }
  return ctx;
}
