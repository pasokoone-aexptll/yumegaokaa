/** Close only this successful presentation, never cancel a newer entry attempt. */
export function scheduleEntrySuccessDismissal(
  isStillSuccessful: () => boolean,
  close: () => void,
) {
  const timer = setTimeout(() => {
    if (isStillSuccessful()) close();
  }, 3000);
  return () => clearTimeout(timer);
}
