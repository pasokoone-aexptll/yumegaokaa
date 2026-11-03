export function shouldShowTabs(
  ready: boolean,
  signedIn: boolean,
  access: string,
  placing: boolean,
) {
  return ready && signedIn && access === "active" && !placing;
}
