export type AgeBand = "under_13" | "13_17" | "18_plus";
export type RegistrationPolicy = {
  available: boolean;
  version?: string;
  terms_url?: string;
  privacy_url?: string;
};
export type RegistrationDeclaration = {
  age_band: "13_17" | "18_plus";
  guardian_declared: boolean;
  policy_version: string;
};
export function registrationDeclaration(
  band: AgeBand | undefined,
  checked: boolean,
  policy: RegistrationPolicy | undefined,
): RegistrationDeclaration | null {
  if (
    !policy?.available ||
    !policy.version ||
    !policy.terms_url?.startsWith("https://") ||
    !policy.privacy_url?.startsWith("https://")
  )
    return null;
  if (band !== "13_17" && band !== "18_plus") return null;
  if (band === "13_17" && !checked) return null;
  return {
    age_band: band,
    guardian_declared: band === "13_17",
    policy_version: policy.version,
  };
}
