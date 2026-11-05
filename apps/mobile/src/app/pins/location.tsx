import { useRouter } from "expo-router";
import { LocationPicker } from "../../components/LocationPicker";
import { updateDraft, usePinDraft } from "../../lib/pinDraft";
export default function Location() {
  const router = useRouter();
  const draft = usePinDraft();
  return (
    <LocationPicker
      pinCreation
      initial={draft.location}
      onCancel={() => router.back()}
      onConfirm={(point) => {
        updateDraft({ location: point });
        router.back();
      }}
    />
  );
}
