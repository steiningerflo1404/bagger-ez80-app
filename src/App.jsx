
import React,{useMemo,useState}from"react";
const MACHINE_NAME="Bagger EZ80";
const SHEET_WEBAPP_URL=import.meta.env.VITE_GOOGLE_SCRIPT_URL||"";
const members=["Steininger","Zorn","Stockhammer","Kerschbaumer","Mayr","Passenbrunner","Zwicklhuber","Kremshuber","Staudinger","WARTUNG"];

function parseDecimal(value){
  if(value===null||value===undefined)return NaN;
  const cleaned=String(value).trim().replace(/\s/g,"").replace(",",".");
  if(cleaned==="")return NaN;
  return Number(cleaned);
}
function formatHours(value){
  if(value===""||Number.isNaN(value))return "—";
  return value.toLocaleString("de-AT",{minimumFractionDigits:1,maximumFractionDigits:2})+" h";
}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>;}

export default function App(){
 const today=new Date().toISOString().slice(0,10);
 const[form,setForm]=useState({datumVon:today,datumBis:today,mitglied:"",stundenStart:"",stundenEnde:"",diesel:"",einsatzart:"innerbetrieblich",bemerkung:"",getankt:false,abgeschmiert:false});
 const[message,setMessage]=useState(""); const[sending,setSending]=useState(false); const[loadingLast,setLoadingLast]=useState(false);

 const startNumber=parseDecimal(form.stundenStart);
 const endNumber=parseDecimal(form.stundenEnde);
 const dieselNumber=parseDecimal(form.diesel);

 const gefahreneStunden=useMemo(()=>{
   const start=parseDecimal(form.stundenStart);
   const ende=parseDecimal(form.stundenEnde);
   if(Number.isNaN(start)||Number.isNaN(ende))return "";
   return Math.round((ende-start)*100)/100;
 },[form.stundenStart,form.stundenEnde]);

 const hasValidHours=gefahreneStunden!==""&&gefahreneStunden>=0;
 const canSave=form.datumVon&&form.datumBis&&form.mitglied&&!Number.isNaN(startNumber)&&!Number.isNaN(endNumber)&&hasValidHours&&form.getankt&&form.abgeschmiert&&!sending;

 async function takeLastValue(){
   setMessage("");
   if(!SHEET_WEBAPP_URL){setMessage("Google-Script-Link fehlt noch.");return}
   setLoadingLast(true);
   try{
     const r=await fetch(`${SHEET_WEBAPP_URL}?action=last&ts=${Date.now()}`);
     const d=await r.json();
     if(!d.ok||d.lastEnde===""||d.lastEnde==null){setMessage("Es wurde noch kein letzter Stundenzähler gefunden.");return}
     const last=String(d.lastEnde).replace(".",",");
     setForm(c=>({...c,stundenStart:last}));
     setMessage(`Letzter Stundenzähler übernommen: ${last}`);
   }catch{
     setMessage("Letzter Wert konnte nicht geladen werden. Bitte Google-Script neu bereitstellen.");
   }finally{setLoadingLast(false)}
 }

 async function saveEntry(event){
   event.preventDefault();setMessage("");
   if(!SHEET_WEBAPP_URL){setMessage("Google-Script-Link fehlt noch.");return}
   if(!canSave){alert("Bitte alle Pflichtfelder richtig ausfüllen und beide Häkchen setzen.");return}
   setSending(true);
   const payload={
     maschine:MACHINE_NAME,
     datumVon:form.datumVon,
     datumBis:form.datumBis,
     mitglied:form.mitglied,
     stundenStart:startNumber,
     stundenEnde:endNumber,
     betriebsstunden:Number(gefahreneStunden),
     diesel:Number.isNaN(dieselNumber)?0:dieselNumber,
     einsatzart:form.einsatzart,
     getankt:form.getankt,
     abgeschmiert:form.abgeschmiert,
     bemerkung:form.bemerkung.trim(),
     erfasstAm:new Date().toISOString()
   };
   try{
     await fetch(SHEET_WEBAPP_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
     setMessage("Eintrag wurde gespeichert.");
     setForm({datumVon:today,datumBis:today,mitglied:"",stundenStart:"",stundenEnde:"",diesel:"",einsatzart:"innerbetrieblich",bemerkung:"",getankt:false,abgeschmiert:false});
   }catch{setMessage("Speichern fehlgeschlagen. Bitte Internetverbindung prüfen.")}
   finally{setSending(false)}
 }

 return <div className="page"><main className="app-card"><header className="top"><div className="logo">🚜</div><div><h1>{MACHINE_NAME}</h1><p>Stundenerfassung</p></div></header>{message&&<div className="message">{message}</div>}<form onSubmit={saveEntry} className="form">
 <section className="section"><h2>Zeitraum</h2><div className="grid two"><Field label="Von"><input type="date" value={form.datumVon} onChange={e=>setForm({...form,datumVon:e.target.value})}/></Field><Field label="Bis"><input type="date" value={form.datumBis} onChange={e=>setForm({...form,datumBis:e.target.value})}/></Field></div></section>
 <section className="section"><h2>Einsatz</h2><Field label="Mitglied / Fahrer"><select value={form.mitglied} onChange={e=>setForm({...form,mitglied:e.target.value})}><option value="">Bitte Mitglied auswählen</option>{members.map(m=><option key={m} value={m}>{m}</option>)}</select></Field><Field label="Einsatzart"><select value={form.einsatzart} onChange={e=>setForm({...form,einsatzart:e.target.value})}><option value="innerbetrieblich">Innerbetrieblich — € 15/h</option><option value="ueberbetrieblich">Überbetrieblich — € 50/h</option></select></Field></section>
 <section className="section"><h2>Betriebsstunden</h2><button type="button" className="secondary" onClick={takeLastValue} disabled={loadingLast}>{loadingLast?"Lade letzten Wert...":"Letzten Wert übernehmen"}</button><div className="grid two"><Field label="Stundenzähler Beginn"><input type="text" inputMode="decimal" placeholder="z. B. 1250,5" value={form.stundenStart} onChange={e=>setForm({...form,stundenStart:e.target.value})}/></Field><Field label="Stundenzähler Ende"><input type="text" inputMode="decimal" placeholder="z. B. 1253,0" value={form.stundenEnde} onChange={e=>setForm({...form,stundenEnde:e.target.value})}/></Field></div><div className={!hasValidHours&&form.stundenStart&&form.stundenEnde?"result error":"result"}><span>Gefahrene Stunden</span><strong>{formatHours(gefahreneStunden)}</strong></div></section>
 <section className="section"><h2>Kontrolle</h2><Field label="Getankte Dieselmenge in Liter"><input type="text" inputMode="decimal" placeholder="z. B. 18,5" value={form.diesel} onChange={e=>setForm({...form,diesel:e.target.value})}/></Field><label className="check"><input type="checkbox" checked={form.getankt} onChange={e=>setForm({...form,getankt:e.target.checked})}/><span>Getankt</span></label><label className="check"><input type="checkbox" checked={form.abgeschmiert} onChange={e=>setForm({...form,abgeschmiert:e.target.checked})}/><span>Abgeschmiert</span></label></section>
 <section className="section"><Field label="Bemerkung / Schäden"><textarea placeholder="z. B. Schaden, Wartung, Besonderheiten" value={form.bemerkung} onChange={e=>setForm({...form,bemerkung:e.target.value})}/></Field></section>
 <button className="primary" type="submit" disabled={!canSave}>{sending?"Speichert...":"Eintrag speichern"}</button></form><footer>© by Steininger Flo</footer></main></div>
}
