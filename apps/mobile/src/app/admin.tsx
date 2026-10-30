import { router } from "expo-router";
import { Action, Empty, Page } from "../components/Page";
export default function Screen(){return <Page title="運営"><Empty>運営資格の確認・招待監督・通報対応・ステッカー管理を接続中です。</Empty><Action title="戻る" onPress={()=>router.back()}/></Page>;}
