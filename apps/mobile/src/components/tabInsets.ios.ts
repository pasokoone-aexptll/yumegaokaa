export const tabIconStyle = { width: 32, height: 32, alignSelf: "center" } as const;

export function tabInsets(bottom: number) {
  return { height: 42 + bottom, paddingTop: 7, paddingBottom: Math.max(0, bottom - 3) };
}
