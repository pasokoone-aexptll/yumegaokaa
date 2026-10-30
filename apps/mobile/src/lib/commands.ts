import * as SecureStore from 'expo-secure-store';
import { native, url } from './native';
type Pending = { id: string; count: number };
const running = new Set<string>();
async function storageKey(kind: string) { const session = await native.session(); if (!session.signed_in) throw Error('login_required'); return 'command_' + Array.from(url + '|' + session.email + '|' + kind).map(c => c.charCodeAt(0).toString(16)).join('_'); }
async function read(key: string) { const saved = await SecureStore.getItemAsync(key); if (!saved) return null; const p = JSON.parse(saved) as Pending; let body = ''; for (let i = 0; i < p.count; i++) { const part = await SecureStore.getItemAsync(key + '_' + i); if (part === null) throw Error('pending_storage_incomplete'); body += JSON.parse(part); } return { ...p, body: JSON.parse(body) as Record<string, unknown> }; }
async function remove(key: string, p: Pending) { await SecureStore.deleteItemAsync(key); for (let i = 0; i < p.count; i++)await SecureStore.deleteItemAsync(key + '_' + i); }
export async function pendingCommand(kind: string) { return read(await storageKey(kind)); }
export async function submitCommand<T>(kind: string, body: Record<string, unknown>): Promise<T> {
  const key = await storageKey(kind); if (running.has(key)) throw Error('operation_in_progress'); running.add(key);
  try {
    let pending = await read(key);
    if (pending && JSON.stringify(pending.body) !== JSON.stringify(body)) throw Error('pending_command_exists');
    if (pending) {
      const status = await native.rpc<{ completed: boolean; result: T; accept_until: string; expired: boolean; canceled: boolean }>('command_status', { id: pending.id });
      if (status.completed) { await remove(key, pending); return status.result; }
      // An expired, explicitly uncommitted request can safely get a new receipt.
      if (status.expired || status.canceled) { await remove(key, pending); pending = null; }
    }
    if (!pending) {
      const ticket = await native.rpc<{ id: string }>('command_prepare', { kind }); const text = JSON.stringify(body); const count = Math.ceil(text.length / 400);
      for (let i = 0; i < count; i++)await SecureStore.setItemAsync(key + '_' + i, JSON.stringify(text.slice(i * 400, (i + 1) * 400)));
      pending = { id: ticket.id, count, body }; await SecureStore.setItemAsync(key, JSON.stringify({ id: ticket.id, count }));
    }
    const result = await native.rpc<T>('command_execute', { id: pending.id, body: pending.body }); await remove(key, pending); return result;
  } finally { running.delete(key); }
}

// Cancel is serialized with execution on the server. Never forget an uncertain
// request locally until its outcome or cancellation has been acknowledged.
export async function cancelPendingCommand<T>(kind: string): Promise<T | null> {
 const key=await storageKey(kind);if(running.has(key))throw Error('operation_in_progress');running.add(key);
 try{
  const pending=await read(key);if(!pending)return null;
  const result=await native.rpc<{completed:boolean;result:T}>('command_cancel',{id:pending.id});
  await remove(key,pending);return result.completed?result.result:null;
 }finally{running.delete(key);}
}
