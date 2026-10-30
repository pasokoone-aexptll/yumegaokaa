import { localEntry } from "./development";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
export type StickerDraft = {
  id: string;
  tag_id: string;
  title: string;
  phase: "draft" | "written" | "verified" | "installed" | "published";
  revision: number;
  longitude: number;
  latitude: number;
};
export const localStickerAdapter = localEntry;
export async function stickerTouch(tagID: string, write: boolean) {
  const payload = { v: 1, tag_id: tagID };
  if (localStickerAdapter) return payload;
  try {
    await NfcManager.start();
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: write
        ? "空のステッカーにタッチ"
        : "設定したステッカーを再読取",
    });
    const tag = await NfcManager.getTag();
    if (write) {
      if (tag?.ndefMessage?.length) {
        const record = tag.ndefMessage.find((r) =>
          Ndef.isType(r, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT),
        );
        if (!record) throw Error("tag_not_empty");
        const existing = JSON.parse(
          Ndef.text.decodePayload(Uint8Array.from(record.payload)),
        );
        if (existing.v === 1 && existing.tag_id === tagID) return payload;
        throw Error("tag_not_empty");
      }
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(JSON.stringify(payload)),
      ]);
      if (!bytes) throw Error("invalid_tag");
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      return payload;
    }
    const record = tag?.ndefMessage?.find((r) =>
      Ndef.isType(r, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT),
    );
    if (!record) throw Error("invalid_tag");
    const found = JSON.parse(
      Ndef.text.decodePayload(Uint8Array.from(record.payload)),
    );
    if (found.v !== 1 || found.tag_id !== tagID) throw Error("tag_mismatch");
    return payload;
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}
