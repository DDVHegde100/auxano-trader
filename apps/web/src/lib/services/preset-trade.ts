import { PRESET_ALGORITHMS, getPresetById } from "@auxano/shared";

const STORAGE_KEY = "auxano_selected_preset";

export type SelectedPreset = {
  id: string;
  name: string;
  allowedSymbols: string[];
  symbolScope: "universal" | "symbols";
};

export function getSelectedPresetFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setSelectedPresetInStorage(presetId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, presetId);
}

export function resolveSelectedPreset(presetId: string): SelectedPreset | null {
  const preset = getPresetById(presetId);
  if (!preset) return null;
  const scope = preset.logic.meta?.symbolScope ?? "symbols";
  return {
    id: preset.id,
    name: preset.name,
    symbolScope: scope,
    allowedSymbols:
      scope === "universal" ? [] : preset.suggestedSymbols,
  };
}

export function listPresetsForTradeDropdown() {
  return PRESET_ALGORITHMS.map((p) => ({
    id: `preset:${p.id}`,
    name: `${p.name} (DEFAULT)`,
    allowedSymbols:
      p.logic.meta?.symbolScope === "universal" ? [] : p.suggestedSymbols,
    scope: p.logic.meta?.symbolScope ?? "symbols",
  }));
}
