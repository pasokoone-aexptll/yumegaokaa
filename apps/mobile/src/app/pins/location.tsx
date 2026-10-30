import { router } from "expo-router";
import { LocationPicker } from "../../components/LocationPicker";
import { updateDraft, usePinDraft } from "../../lib/pinDraft";
export default function Location() {
  const draft = usePinDraft();
  return (
    <LocationPicker
      initial={draft.location}
      onCancel={() => router.back()}
      onConfirm={(point) => {
        updateDraft({ location: point });
        router.back();
      }}
    />
  );
}
