import {useCallback,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {Alert,Text,View} from 'react-native';
import {Action,Empty,Page,ui} from '../components/Page';
import {native} from '../lib/native';
type Report={id:string;target_kind:string;reason:string;description:string;evidence:{body?:string;title?:string;description?:string};created_at:string;review_due:boolean};
export default function Moderation(){
 const [items,setItems]=useState<Report[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const r=await native.rpc<{items:Report[]}>('operator_reports',{});setItems(r.items);setError('');}catch{setItems([]);setError('運営資格・追加認証または通信を確認してください。');}},[]);
 useFocusEffect(useCallback(()=>{void load();return()=>setItems([]);},[load]));
 async function act(op:string,id:string,resolution?:string){setBusy(true);try{await native.rpc(op,{id,resolution});await load();}catch{setError('操作できませんでした。状態を確認して再試行してください。');}finally{setBusy(false);}}
 return <Page title="通報対応">{!!error&&<Text style={ui.error}>{error}</Text>}<Action title="最新の通報を取得" disabled={busy} onPress={()=>void load()}/>{!items.length&&!error&&<Empty>未対応の通報はありません。</Empty>}
 {items.map(r=><View key={r.id} style={ui.card}><Text>{r.target_kind} / {r.reason}{r.review_due?' · 整理対象':''}</Text><Text>{r.description}</Text><Text>{r.evidence.title}</Text><Text>{r.evidence.body??r.evidence.description}</Text><Text style={ui.muted}>証拠は運営だけが閲覧できます。</Text>
 {r.target_kind==='message'&&<Action title="元の投稿を削除" disabled={busy} onPress={()=>Alert.alert('投稿を削除しますか？','通常の本文は削除されます。通報証拠は保持期限まで残ります。',[{text:'戻る',style:'cancel'},{text:'削除',style:'destructive',onPress:()=>void act('operator_message_delete',r.id)}])}/>}
 <Action title="対応完了" disabled={busy} onPress={()=>void act('operator_report_resolve',r.id,'handled')}/>
 <Action title="対応不要として完了" disabled={busy} onPress={()=>void act('operator_report_resolve',r.id,'no_action')}/>
 </View>)}</Page>;
}
