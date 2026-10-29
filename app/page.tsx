'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteTrack, RemoteTrackPublication, Track, type RemoteParticipant } from 'livekit-client';
const languages = [{code:'FLOOR',name:'Original / FLOOR'},{code:'FR',name:'Français'},{code:'EN',name:'English'},{code:'DE',name:'Deutsch'}];
type Role='listener'|'interpreter'|'floor';
export default function Home(){
 const [role,setRole]=useState<Role>('listener'),[lang,setLang]=useState('FR'),[roomName,setRoomName]=useState('meeting-001'),[adminKey,setAdminKey]=useState('');
 const [connected,setConnected]=useState(false),[status,setStatus]=useState('Non connecté'),[muted,setMuted]=useState(false),[available,setAvailable]=useState<string[]>([]);
 const roomRef=useRef<Room|null>(null),audioRef=useRef<HTMLAudioElement|null>(null),tracksRef=useRef(new Map<string,{track:RemoteTrack,participant:RemoteParticipant}>());
 const selectedRef=useRef(lang); selectedRef.current=lang;
 const sync=()=>{
   const map=tracksRef.current;
   const availableChannels=new Set<string>();
   for(const {participant} of map.values()){try{const m=JSON.parse(participant.metadata||'{}');if(m.language)availableChannels.add(m.language);}catch{}}
   setAvailable([...availableChannels]);
   const audio=audioRef.current;if(!audio)return;
   let selected:RemoteTrack|undefined;
   for(const {track,participant} of map.values()){try{const m=JSON.parse(participant.metadata||'{}');if(m.language===selectedRef.current){selected=track;break;}}catch{}}
   audio.srcObject=selected?.mediaStreamTrack?new MediaStream([selected.mediaStreamTrack]):null;
   if(selected){audio.play().catch(()=>setStatus('Touchez « Activer le son » pour écouter'));}
 };
 const disconnect=async()=>{await roomRef.current?.disconnect();roomRef.current=null;tracksRef.current.clear();if(audioRef.current)audioRef.current.srcObject=null;setAvailable([]);setConnected(false);setStatus('Déconnecté');};
 useEffect(()=>{sync();},[lang]);
 useEffect(()=>()=>{roomRef.current?.disconnect();},[]);
 const connect=async()=>{
  try{
   setStatus('Connexion…');
   const res=await fetch('/api/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:roomName,role,language:role==='floor'?'FLOOR':lang,adminKey})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Token error');
   const r=new Room({adaptiveStream:true,dynacast:true});roomRef.current=r;
   r.on(RoomEvent.TrackSubscribed,(track,pub,participant)=>{if(track.kind===Track.Kind.Audio){tracksRef.current.set(`${participant.identity}:${pub.trackSid}`,{track,participant});sync();}});
   r.on(RoomEvent.TrackUnsubscribed,(_track,pub,participant)=>{tracksRef.current.delete(`${participant.identity}:${pub.trackSid}`);sync();});
   r.on(RoomEvent.ParticipantMetadataChanged,()=>sync());
   r.on(RoomEvent.ParticipantDisconnected,p=>{for(const key of tracksRef.current.keys())if(key.startsWith(`${p.identity}:`))tracksRef.current.delete(key);sync();});
   r.on(RoomEvent.Disconnected,()=>{setConnected(false);setStatus('Connexion interrompue');});
   await r.connect(data.url,data.token);
   if(role!=='listener')await r.localParticipant.setMicrophoneEnabled(true);
   setConnected(true);setStatus('Connecté');sync();
  }catch(e){setStatus(e instanceof Error?e.message:'Erreur de connexion');await disconnect();setStatus(e instanceof Error?e.message:'Erreur de connexion');}
 };
 const toggleMute=async()=>{const r=roomRef.current;if(!r)return;await r.localParticipant.setMicrophoneEnabled(muted);setMuted(!muted);};
 return <main><header><div className="brand">◉ <span>EU Interpreting</span></div><span className="tag">Prototype V1 · Human only</span></header><section className="hero"><p className="eyebrow">INTERPRETATION DISTRIBUTION</p><h1>Chaque langue.<br/><em>Une seule réunion.</em></h1><p>Écoutez le FLOOR ou l’interprétation humaine de votre choix, directement depuis votre navigateur.</p></section><section className="panel"><h2>Rejoindre une réunion</h2><label>Identifiant de réunion<input value={roomName} disabled={connected} onChange={e=>setRoomName(e.target.value)}/></label><label>Votre rôle<select value={role} disabled={connected} onChange={e=>{const v=e.target.value as Role;setRole(v);if(v==='floor')setLang('FLOOR');else if(lang==='FLOOR')setLang('FR');}}><option value="listener">Participant</option><option value="interpreter">Interprète</option><option value="floor">Source FLOOR / passerelle</option></select></label>{role!=='listener'&&<label>Clé opérateur (démo)<input type="password" value={adminKey} disabled={connected} onChange={e=>setAdminKey(e.target.value)} placeholder="Clé de publication"/></label>}<h3>{role==='listener'?'Langue d’écoute':role==='floor'?'Canal publié':'Langue interprétée (sortie micro)'}</h3><div className="languages">{languages.filter(l=>role==='floor'?l.code==='FLOOR':role==='interpreter'?l.code!=='FLOOR':true).map(l=><button key={l.code} disabled={connected&&role!=='listener'} className={lang===l.code?'selected':''} onClick={()=>setLang(l.code)}><small>{l.code}</small><strong>{l.name}</strong>{connected&&role==='listener'&&available.includes(l.code)&&<span className="live">● LIVE</span>}</button>)}</div><div className="actions">{connected?<button className="primary" onClick={disconnect}>Quitter la réunion</button>:<button className="primary" onClick={connect}>Rejoindre la réunion</button>}{connected&&role!=='listener'&&<button onClick={toggleMute}>{muted?'Activer le micro':'Couper le micro'}</button>}{connected&&role==='listener'&&<button onClick={()=>audioRef.current?.play().catch(()=>setStatus('Lecture bloquée par le navigateur'))}>Activer le son</button>}</div><p className="status"><span className={connected?'dot online':'dot'}/>{status}</p>{connected&&role==='listener'&&!available.includes(lang)&&<p className="notice">Aucun interprète ou signal actif sur ce canal. Choisissez un canal LIVE ou attendez sa disponibilité.</p>}{connected&&role==='interpreter'&&<p className="notice">Votre microphone publie sur {lang}. L’écoute du FLOOR sera ajoutée dans l’étape suivante (retour audio séparé).</p>}{connected&&role==='floor'&&<p className="notice">Votre microphone est publié comme FLOOR. Pour une console audio physique, sélectionnez cette entrée comme microphone système.</p>}<audio ref={audioRef} autoPlay playsInline controls className="audio"/></section><footer>Prototype de validation technique · Pas encore adapté à un usage institutionnel en production.</footer></main>
}
