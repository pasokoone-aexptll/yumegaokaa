export type ImageKind = "profile_image" | "street_image";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const profile = new RegExp(`^${uuid}/(?:avatar|${uuid})\\.jpg$`, "i");
const street = new RegExp(`^${uuid}\\.jpg$`, "i");

export function imagePaths(kind: string, paths: string) {
  const format = kind === "profile_image" ? profile : street;
  return [...new Set(paths.split(",").filter((path) => format.test(path)))];
}

export function imageReport(kind: ImageKind, paths: string[]) {
  return {
    pathname: "/report",
    params: { kind, images: paths.join(",") },
  } as const;
}
