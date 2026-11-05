export const tabIconStyle = { width: 32, height: 32, alignSelf: "center" } as const;

export function tabInsets(bottom: number, width: number) {
  return { height: 48 + bottom, paddingTop: 4, paddingBottom: bottom + 5, paddingHorizontal: width * 0.085 };
}
