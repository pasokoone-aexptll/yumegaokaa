import { useEffect, useRef } from "react";

export function useAutoVerifyCode({
  address,
  code,
  enabled,
  busy,
  verify,
}: {
  address: string;
  code: string;
  enabled: boolean;
  busy: boolean;
  verify: (address: string, code: string) => Promise<void>;
}) {
  const attempted = useRef("");
  useEffect(() => {
    if (code.length !== 6) {
      attempted.current = "";
      return;
    }
    if (!enabled || busy || !/^\d{6}$/.test(code)) return;
    const key = JSON.stringify([address, code]);
    if (attempted.current === key) return;
    attempted.current = key;
    void verify(address, code);
  }, [address, code, enabled, busy, verify]);
}
