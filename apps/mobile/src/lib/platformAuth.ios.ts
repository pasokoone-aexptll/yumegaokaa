// Other platforms use the existing native authentication module.
export const platformAuth: typeof import("./platformAuth.android").platformAuth | undefined = undefined;
