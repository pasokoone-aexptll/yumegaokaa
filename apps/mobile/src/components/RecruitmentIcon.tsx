import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import type { Recruitment } from "../lib/recruitments";

export function RecruitmentIcon({ pin }: { pin: Recruitment }) {
  const until = Date.parse(pin.icon_until);
  const [now, refresh] = useState(Date.now);
  useEffect(() => {
    const remaining = until - Date.now();
    if (!Number.isFinite(remaining)) return;
    const timer = setTimeout(() => refresh(Date.now()), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [until]);
  return <Avatar bucket="street-icons" name="" path={now < until ? pin.icon_path ?? undefined : undefined} />;
}
