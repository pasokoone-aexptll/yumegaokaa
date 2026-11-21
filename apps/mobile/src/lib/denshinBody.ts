/** Count Unicode code points, rather than UTF-16 units, after trimming. */
export function canSaveDenshinBody(body: string, editing = false) {
  return Array.from(body.trim()).length >= (editing ? 1 : 3);
}
