export function shouldShowTabs(
  ready: boolean,
  signedIn: boolean,
  access: string,
  placing: boolean,
  unavailable = false,
) {
  return (
    ready &&
    signedIn &&
    (access === "active" || (access === "unknown" && unavailable)) &&
    !placing
  );
}
