import type { ReactNode } from "react";

export type PinSheetFooterProps = { active: boolean; children: ReactNode };

export function PinSheetFooter({ children }: PinSheetFooterProps) {
  return <>{children}</>;
}
