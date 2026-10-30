import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { native, streetID } from '../lib/native';
import { pendingCommand, submitCommand } from '../lib/commands';
import { ui } from './Page';
type Message = { id: string; author_id: string; display_name: string; body: string | null; created_at: string; deleted: boolean; kind: 'text' | 'arrival'; mine: boolean };
export function StreetChat() {
  const [items, setItems] = useState<Message[]>([]), [text, setText] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [expanded, setExpanded] = useState(false), [loading, setLoading] = useState(true);
  const fetching = useRef(false), generation = useRef(0), older = useRef(false);
  const load = useCallback(async (more = false) => {
    if (fetching.current) return; fetching.current = true; const gen = generation.current;
    try {
      const last = items[items.length - 1]; const r = await native.rpc<{ items: Message[] }>('chat_list', { street_id: streetID, ...(more && last ? { before_at: last.created_at, before_id: last.id } : {}) });
      if (gen !== generation.current) return;
      setItems(previous => more ? [...previous, ...r.items.filter(x => !previous.some(p => p.id === x.id))] : r.items); setError('');
    } catch { if (gen === generation.current) setError('チャットを取得できません。再読み込みしてください。'); } finally { fetching.current = false; setLoading(false); }
  }, [items]);
  const loadRef = useRef(load); useEffect(()=>{loadRef.current=load;},[load]);
  useEffect(() => { void loadRef.current(); void pendingCommand('chat_send').then(p => { if (p) setText(String(p.body.body ?? '')); }).catch(() => { }); const timer = setInterval(() => { if (AppState.currentState === 'active' && !older.current) void loadRef.current(); }, 5000); return () => { generation.current++; clearInterval(timer); }; }, []);
  async function send() { if (busy || !text.trim()) return; setBusy(true); try { await submitCommand('chat_send', { street_id: streetID, body: text.trim() }); setText(''); older.current = false; await loadRef.current(); } catch (e) { setError(String(e).includes('pending_command_exists') ? '前回の送信結果が未確認です。前回の内容で再試行してください。' : '送信できませんでした。名前の設定・通信を確認し、同じ内容で再試行してください。'); } finally { setBusy(false); } }
  async function action(op: string, p: Record<string, unknown>) { generation.current++; try { await native.rpc(op, p); older.current = false; await loadRef.current(); } catch { setError('操作できませんでした。再試行してください。'); } }
  function menu(m: Message) { Alert.alert(m.display_name, '操作を選択', [...(m.mine && m.kind === 'text' && !m.deleted ? [{ text: '削除', style: 'destructive' as const, onPress: () => void action('chat_delete', { id: m.id }) }] : []), ...(!m.mine ? [{ text: 'ブロック', onPress: () => void action('block_set', { account_id: m.author_id, blocked: true }) }] : []), ...(m.kind === 'text' && !m.deleted ? [{ text: '通報', onPress: () => router.push({pathname:'/report',params:{kind:'message',id:m.id}}) }] : []), { text: '閉じる', style: 'cancel' }]); }
  return <View style={{ backgroundColor: expanded ? '#fff' : '#ffffffed', borderRadius: 24, padding: 12, height: expanded ? 460 : 260, gap: 8 }}><Pressable onPress={() => { setExpanded(!expanded); older.current = false; void loadRef.current(); }}><Text style={{ color: '#008cff', fontWeight: '700' }}>街のチャット {expanded ? '⌄ 地図へ' : '⌃ 広げる'}</Text></Pressable><ScrollView onScrollBeginDrag={() => { setExpanded(true); older.current = true; }} keyboardShouldPersistTaps="handled"><Pressable onPress={() => { older.current = true; void loadRef.current(true); }}><Text style={ui.muted}>過去の会話を読む</Text></Pressable>{loading && <Text>読み込み中…</Text>}{!loading && !error && !items.length && <Text style={ui.muted}>まだ会話はありません。話さず眺めていても大丈夫。</Text>}{[...items].reverse().map(m => <Pressable key={m.id} onLongPress={() => menu(m)} style={{ paddingVertical: 7 }}><Text style={{ color: '#80909b', fontSize: 12 }}>{m.display_name} · {new Date(m.created_at).toLocaleTimeString()}</Text><Text style={{ color: '#34434b' }}>{m.deleted ? '削除されたメッセージ' : m.kind === 'arrival' ? '街に参加しました' : m.body}</Text></Pressable>)}</ScrollView>{!!error && <Pressable onPress={() => void loadRef.current()}><Text style={ui.error}>{error}</Text></Pressable>}<View style={{ flexDirection: 'row', gap: 8 }}><TextInput style={[ui.input, { flex: 1, padding: 10 }]} placeholder="入力…" maxLength={500} value={text} onChangeText={setText} /><Pressable disabled={busy || !text.trim()} onPress={() => void send()} style={{ padding: 10 }}><Text style={{ color: '#008cff' }}>{busy ? '送信中' : '送信'}</Text></Pressable></View></View>;
}
