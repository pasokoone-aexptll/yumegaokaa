import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Action, Empty, Page } from "../../components/Page";
export default function Home(){
 const [tab,setTab]=useState("参加予定のピン");
 return <Page title="ピン一覧"><Action title="ピンを作成" onPress={()=>router.push("/pins/create")}/><View style={{flexDirection:"row",gap:20}}>{["参加予定のピン","募集中のピン"].map(x=><Pressable key={x} onPress={()=>setTab(x)}><Text style={{color:tab===x?"#008cff":"#87929b",fontSize:18,fontWeight:"700"}}>{x}</Text></Pressable>)}</View><Empty>一覧の接続を準備しています。保存されたピンはまだ読み込んでいません。</Empty></Page>;
}
