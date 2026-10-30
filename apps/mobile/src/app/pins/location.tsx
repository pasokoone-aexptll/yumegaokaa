import {useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Camera,Map,Marker} from '@maplibre/maplibre-react-native';
import {router} from 'expo-router';
import {Action} from '../../components/Page';
import {updateDraft,usePinDraft} from '../../lib/pinDraft';
export default function Location(){const draft=usePinDraft();const [point,setPoint]=useState<[number,number]|undefined>(draft.location);
 return <View style={{flex:1}}><Map style={StyleSheet.absoluteFill} mapStyle="https://demotiles.maplibre.org/style.json" onPress={e=>setPoint(e.nativeEvent.lngLat)}><Camera initialViewState={{center:point??[139.7109,35.7295],zoom:15}}/>{point&&<Marker lngLat={point}><Text style={{fontSize:40,color:'#ff4c81'}}>●</Text></Marker>}</Map><SafeAreaView pointerEvents="box-none" style={{flex:1,padding:24,justifyContent:'space-between'}}><Action title="戻る" onPress={()=>router.back()}/><View style={{gap:12}}><Text style={{backgroundColor:'white',padding:12}}>地図をタップして開催場所を選択（背景は開発用）</Text><Action title="この場所にする" disabled={!point} onPress={()=>{updateDraft({location:point});router.back();}}/></View></SafeAreaView></View>;
}
