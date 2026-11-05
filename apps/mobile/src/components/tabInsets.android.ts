export const tabIconStyle = { width: 32, height: 32, alignSelf: "center" } as const;

export function tabInsets(bottom: number, width: number) {
  return { height: 54 + bottom, paddingTop: 10, paddingBottom: bottom + 5, paddingHorizontal: width * 0.085 };
}
