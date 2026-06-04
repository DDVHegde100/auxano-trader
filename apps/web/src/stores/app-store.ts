import { create } from "zustand";
import type { DashboardData, MarketplaceStrategy } from "@auxano/shared";

interface AppState {
  dashboard: DashboardData | null;
  strategies: MarketplaceStrategy[];
  loading: boolean;
  setDashboard: (d: DashboardData | null) => void;
  setStrategies: (s: MarketplaceStrategy[]) => void;
  setLoading: (l: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  dashboard: null,
  strategies: [],
  loading: false,
  setDashboard: (dashboard) => set({ dashboard }),
  setStrategies: (strategies) => set({ strategies }),
  setLoading: (loading) => set({ loading }),
}));
