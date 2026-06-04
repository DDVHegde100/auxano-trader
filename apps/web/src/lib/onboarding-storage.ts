/** Browser-local draft for onboarding preferences (survives refresh on same device). */

export const ONBOARDING_STORAGE_KEY = "auxano_onboarding_draft_v1";
export const ONBOARDING_SIGNUP_COOKIE = "auxano_from_signup";

export type OnboardingDraft = {
  investingExperience: string;
  riskTolerance: string;
  financialGoal: string;
  updatedAt: string;
};

export function readOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function writeOnboardingDraft(draft: Omit<OnboardingDraft, "updatedAt">) {
  if (typeof window === "undefined") return;
  const payload: OnboardingDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

export function setSignupOnboardingCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${ONBOARDING_SIGNUP_COOKIE}=1; path=/; max-age=7200; SameSite=Lax`;
}

export function clearSignupOnboardingCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${ONBOARDING_SIGNUP_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasSignupOnboardingCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${ONBOARDING_SIGNUP_COOKIE}=1`));
}
