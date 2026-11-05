export const tabIconStyle = { width: 32, height: 32, alignSelf: "center" } as const;

export function tabInsets(bottom: number, width: number) {
  return {
    height: 48 + bottom,
    paddingTop: 7,
    paddingBottom: bottom + 3,
    paddingHorizontal: width * 0.105,
  };
}
