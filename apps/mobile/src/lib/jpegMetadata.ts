/** Remove EXIF/XMP, Photoshop metadata and comments without recompressing pixels. */
export function stripJpegMetadata(input: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(input);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw Error("image_conversion_failed");
  const chunks: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset < bytes.length) {
    const start = offset;
    if (bytes[offset++] !== 0xff) throw Error("image_conversion_failed");
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(bytes.subarray(start));
      const result = new Uint8Array(
        chunks.reduce((n, chunk) => n + chunk.length, 0),
      );
      let position = 0;
      for (const chunk of chunks) {
        result.set(chunk, position);
        position += chunk.length;
      }
      return result.buffer;
    }
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (
      offset + 2 > bytes.length ||
      length < 2 ||
      offset + length > bytes.length
    )
      throw Error("image_conversion_failed");
    offset += length;
    if (marker !== 0xe1 && marker !== 0xed && marker !== 0xfe)
      chunks.push(bytes.subarray(start, offset));
  }
  throw Error("image_conversion_failed");
}
