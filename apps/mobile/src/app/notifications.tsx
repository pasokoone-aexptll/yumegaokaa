import { router } from "expo-router";
import { Action, Empty, Page } from "../components/Page";
export default function Screen(){return <Page title="お知らせ"><Empty>イベントの重要変更をここで確認できます。取得機能を接続中です。</Empty><Action title="戻る" onPress={()=>router.back()}/></Page>;}
