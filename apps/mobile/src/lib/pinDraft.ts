import { useSyncExternalStore } from 'react';
export type PinDraft = { kind: 'event' | 'recruitment'; title: string; description: string; starts: string; ends: string; capacity: string; location?: [number, number] };
const empty: PinDraft = { kind: 'recruitment', title: '', description: '', starts: '', ends: '', capacity: '20' };
let draft: PinDraft = { ...empty }; const listeners = new Set<() => void>();
export function updateDraft(p: Partial<PinDraft>) { draft = { ...draft, ...p }; listeners.forEach(f => f()); }
export function clearDraft() { draft = { ...empty }; listeners.forEach(f => f()); }
export function usePinDraft() { return useSyncExternalStore(f => { listeners.add(f); return () => { listeners.delete(f); }; }, () => draft); }
