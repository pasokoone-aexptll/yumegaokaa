import { usePinDraft, updateDraft } from "../../lib/pinDraft";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Action, Page, ui } from "../../components/Page";
export default function CreatePin(){
 const {kind,title,description,starts,ends,location}=usePinDraft();
 const setKind=(kind:"recruitment"|"event")=>updateDraft({kind});
 const setTitle=(title:string)=>updateDraft({title});
 return <Page title="ピンを追加します"><View style={{flexDirection:"row",gap:12}}><Action title="募集ピンを作る" onPress={()=>setKind("recruitment")}/><Action title="オフ会通知" onPress={()=>setKind("event")}/></View><TextInput style={ui.input} placeholder={kind==="event"?"オフ会名を入力":"募集ピン名を入力"} maxLength={50} value={title} onChangeText={setTitle}/>{kind==="event"?<><TextInput style={ui.input} placeholder="開始日時" value={starts} onChangeText={starts=>updateDraft({starts})}/><TextInput style={ui.input} placeholder="終了日時" value={ends} onChangeText={ends=>updateDraft({ends})}/><TextInput style={ui.input} multiline value={description} onChangeText={description=>updateDraft({description})} placeholder="説明を追加" maxLength={1000}/>{location&&<Text>選択した場所: {location[1].toFixed(5)}, {location[0].toFixed(5)}</Text>}<Action title="場所を選択" onPress={()=>router.push("/pins/location")}/></>:<Text style={ui.muted}>現在地を公開します。募集は20分または退出で終了します。</Text>}<Text style={ui.muted}>作成APIを接続中です。まだ公開されません。</Text><Action title="閉じる" onPress={()=>router.back()}/></Page>;
}
