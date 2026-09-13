import React, { useState, useEffect } from 'react';
const WA = "233504877566";

const MATCHES = [
  { id:101, league:"ENG Premier League", home:"Coventry City", away:"QPR", time:"12:00", live:true, score:"0-0 HT", badge:"LIVE BOOST", m:{ "1X2":{"1":1.32,"X":4.80,"2":12.00}, "Double Chance":{"1X":1.05,"12":1.18,"X2":3.20}, "Over/Under":{"Over 1.5":1.25,"Under 1.5":3.80,"Over 2.5":1.85,"Under 2.5":1.90,"BTTS Yes":1.75}, "1st Half":{"Over 0.5 HT":1.40,"Under 0.5 HT":2.70}, "Handicap":{"Home -1":2.10,"Away +1":1.70}, "Next Goal":{"Home":1.5,"No Goal":8.0,"Away":4.5} } },
  { id:102, league:"ENG Premier League", home:"Man Utd", away:"Man City", time:"15:00", live:false, score:"", badge:"", m:{ "1X2":{"1":2.40,"X":3.87,"2":2.27}, "Double Chance":{"1X":1.45,"12":1.20,"X2":1.35}, "Over/Under":{"Over 1.5":1.16,"Under 1.5":4.50,"Over 2.5":1.55,"Under 2.5":2.30}, "1st Half":{"Over 0.5 HT":1.35,"Under 0.5 HT":3.0}, "Handicap":{"Home 0":1.9,"Away 0":1.9} } },
  { id:103, league:"Spain LaLiga", home:"Levante", away:"Barcelona", time:"20:00", live:false, score:"", badge:"", m:{ "1X2":{"1":13.55,"X":9.05,"2":1.20}, "Over/Under":{"Over 2.5":1.32,"Under 2.5":3.10} } },
  { id:104, league:"Ghana Premier", home:"Hearts of Oak", away:"Kotoko", time:"15:00", live:false, score:"", badge:"HOT", m:{ "1X2":{"1":2.10,"X":3.10,"2":2.90}, "Over/Under":{"Over 1.5":1.35,"Under 1.5":3.0} } },
];

export default function App(){
  const [tab,setTab]=useState("home");
  const [detail,setDetail]=useState(null);
  const [mtab,setMtab]=useState("1X2");
  const [bets,setBets]=useState([]);
  const [stake,setStake]=useState(0.20);
  const [btype,setBtype]=useState("Multiple");
  const [tickets,setTickets]=useState(()=>JSON.parse(localStorage.getItem('tix')||'[]'));
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('user')||'{"name":"popki","bal":0.95}'));
  const [viewTicket,setViewTicket]=useState(null);

  useEffect(()=>localStorage.setItem('tix',JSON.stringify(tickets)),[tickets]);
  useEffect(()=>localStorage.setItem('user',JSON.stringify(user)),[user]);

  const total=bets.reduce((a,b)=>a*b.odd,1);
  const add=(match, market, sel, odd)=>{
    const id=`${match.id}-${market}-${sel}`;
    if(bets.find(b=>b.id===id)) setBets(bets.filter(b=>b.id!==id));
    else setBets([...bets,{id, game:`${match.home} vs ${match.away}`, sel:`${sel} (${market})`, odd, match}]);
  };
  const place=()=>{
    if(!bets.length) return;
    if(stake>user.bal) return alert("Low balance");
    const t={id:"SB"+Date.now().toString().slice(-6), date:new Date().toLocaleTimeString(), stake, odds:total.toFixed(2), win:(total*stake).toFixed(2), status:"Open", cashout:(stake*0.85).toFixed(2), picks:bets};
    setTickets([t,...tickets]); setUser({...user, bal:+(user.bal-stake).toFixed(2)}); setBets([]); setTab("open"); setDetail(null);
    window.open(`https://wa.me/${WA}?text=${t.id} GHS ${stake} WIN ${t.win}`,'_blank');
  };

  if(viewTicket){
    return(
      <div style={{background:'#fff', color:'#000', minHeight:'100vh'}}>
        <div style={{background:'#e00000', color:'#fff', padding:'12px', display:'flex', justifyContent:'space-between'}}><span onClick={()=>setViewTicket(null)}>← Back</span><b>Ticket Details</b><span></span></div>
        <div style={{padding:'15px', fontSize:'13px'}}>
          <div>Total Stake: GHS {viewTicket.stake}</div><div>Total Return: GHS {viewTicket.win}</div><div>Status: {viewTicket.status}</div><hr style={{margin:'10px 0'}}/>
          {viewTicket.picks.map((p,i)=><div key={i} style={{padding:'8px 0', borderBottom:'1px solid #eee'}}>{p.game}<br/>Market: {p.sel}<br/>Odd: {p.odd}</div>)}
          <button style={{width:'100%', marginTop:'15px', background:'#e00000', color:'#fff', padding:'12px', border:'none', borderRadius:'6px'}}>Remix Bet</button>
          <button onClick={()=>{setTickets(tickets.filter(x=>x.id!==viewTicket.id)); setViewTicket(null);}} style={{width:'100%', marginTop:'8px', background:'#000', color:'#fff', padding:'12px', border:'none', borderRadius:'6px'}}>Delete Ticket</button>
        </div>
      </div>
    )
  }

  if(detail){
    const m=detail;
    return(
      <div style={{background:'#0f0f0f', color:'#fff', minHeight:'100vh', paddingBottom:'100px'}}>
        <div style={{background:'#e00000', padding:'12px', display:'flex', justifyContent:'space-between', position:'sticky', top:0}}><span onClick={()=>setDetail(null)}>←</span><b>{m.home} vs {m.away}</b><span>⋯</span></div>
        <div style={{background:'#1a1a1a', padding:'15px', textAlign:'center'}}><div style={{fontSize:'11px', color:'#aaa'}}>{m.league} • {m.time} {m.live && <span style={{color:'#0f0'}}>● LIVE {m.score}</span>}</div><div style={{fontSize:'18px', fontWeight:'bold', marginTop:'6px'}}>{m.home} <span style={{color:'#666'}}>vs</span> {m.away}</div></div>
        <div style={{display:'flex', overflowX:'auto', background:'#000', borderBottom:'1px solid #222', fontSize:'11px'}}>{Object.keys(m.m).map(k=><div key={k} onClick={()=>setMtab(k)} style={{padding:'12px 14px', whiteSpace:'nowrap', color:mtab===k?'#fff':'#888', borderBottom:mtab===k?'2px solid #e00000':'none', cursor:'pointer'}}>{k}</div>)}</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'10px'}}>{Object.entries(m.m[mtab]||{}).map(([s,o])=>{ const id=`${m.id}-${mtab}-${s}`; const sel=bets.find(b=>b.id===id); return <button key={s} onClick={()=>add(m,mtab,s,o)} style={{background:sel?'#e00000':'#2a2a2a', color:sel?'#fff':'#ffeb3b', border:'1px solid #333', padding:'14px', borderRadius:'6px', display:'flex', justifyContent:'space-between'}}><span>{s}</span><b>{o}</b></button>})}</div>
        {bets.length>0 && <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#1e1e1e', padding:'12px', borderTop:'2px solid #e00000'}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}><span>{bets.length} picks • {total.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:'#e00000'}}>Clear</span></div><div style={{display:'flex', gap:'8px', marginTop:'8px'}}><input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{width:'80px', background:'#000', border:'1px solid #333', color:'#fff', padding:'8px'}}/><button onClick={place} style={{flex:1, background:'#e00000', border:'none', color:'#fff', padding:'10px', fontWeight:'bold'}}>Place Bet GH₵ {(total*stake).toFixed(2)}</button></div></div>}
      </div>
    )
  }

  return(
    <div style={{background:'#0f0f0f', color:'#fff', minHeight:'100vh', paddingBottom:'130px', fontFamily:'Arial'}}>
      <div style={{background:'#e00000', padding:'12px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:20}}><div style={{fontWeight:'900', fontStyle:'italic', fontSize:'20px'}}>SportyBet</div><div style={{fontSize:'12px', background:'rgba(0,0,0,0.3)', padding:'5px 10px', borderRadius:'15px'}}>GH₵ {user.bal.toFixed(2)}</div></div>

      {tab==="home" && <>
        <div style={{background:'#1a1a1a', padding:'10px', display:'flex', gap:'10px', overflowX:'auto', fontSize:'12px'}}><span style={{color:'#e00000', fontWeight:'bold'}}>Football</span><span style={{color:'#666'}}>Live</span><span style={{color:'#666'}}>Basketball</span><span style={{color:'#666'}}>Tennis</span></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 50px 50px 50px', background:'#000', padding:'6px 10px', fontSize:'10px', color:'#777', textAlign:'center'}}><div style={{textAlign:'left'}}>Tap row for markets ›</div><div>1</div><div>X</div><div>2</div></div>
        {MATCHES.map(m=>(
          <div key={m.id} onClick={()=>{setDetail(m); setMtab("1X2");}} style={{background:'#2a2a2a', borderBottom:'4px solid #0f0f0f', cursor:'pointer'}}>
            <div style={{padding:'6px 10px', fontSize:'10px', color:'#aaa', display:'flex', justifyContent:'space-between'}}><span>{m.badge && <span style={{background:'#e00000', color:'#fff', padding:'1px 4px', borderRadius:'2px', marginRight:'4px'}}>{m.badge}</span>}{m.time} • {m.league}</span><span style={{color:m.live?'#0f0':'#666'}}>{m.score||''} ›</span></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 50px 50px 50px', padding:'0 10px 10px', alignItems:'center'}}>
              <div style={{fontSize:'13px'}}><div>{m.home}</div><div style={{color:'#bbb'}}>{m.away}</div></div>
              {Object.values(m.m["1X2"]).slice(0,3).map((o,i)=>{ const k=Object.keys(m.m["1X2"])[i]; const id=`${m.id}-1X2-${k}`; const sel=bets.find(b=>b.id===id); return <button key={i} onClick={(e)=>{e.stopPropagation(); add(m,"1X2",k,o);}} style={{background:sel?'#e00000':'#3a3a3a', color:sel?'#fff':'#ffeb3b', border:'none', padding:'10px 0', margin:'2px', borderRadius:'3px', fontWeight:'bold'}}>{o}</button>})}
            </div>
          </div>
        ))}
      </>}

      {tab==="az" && <div style={{background:'#fff', color:'#000', minHeight:'70vh', padding:'10px'}}><div style={{background:'#e00000', padding:'8px', borderRadius:'20px', display:'flex'}}><input placeholder="Teams, Players, Leagues, ID" style={{flex:1, border:'none', background:'transparent', color:'#fff', outline:'none'}}/></div><div style={{display:'flex', marginTop:'10px'}}><div style={{width:'120px', background:'#f5f5f5'}}>{["Football","vFootball","Basketball"].map(x=><div key={x} style={{padding:'12px', borderLeft:x==="Football"?'3px solid #e00000':'', background:x==="Football"?'#fff':''}}>{x}</div>)}</div><div style={{flex:1, padding:'10px', fontSize:'13px'}}>{["Premier League","LaLiga","Bundesliga","Ghana Premier"].map(l=><div key={l} style={{padding:'10px 0', borderBottom:'1px solid #eee'}}>{l} ›</div>)}</div></div></div>}

      {tab==="open" && <div style={{padding:'10px', background:'#f5f5f5', minHeight:'70vh', color:'#000'}}><div style={{display:'flex', background:'#fff', borderRadius:'20px', padding:'3px', fontSize:'12px'}}><div style={{flex:1, background:'#000', color:'#fff', padding:'8px', borderRadius:'20px', textAlign:'center'}}>Open Bets ({tickets.filter(t=>t.status==="Open").length})</div><div style={{flex:1, padding:'8px', textAlign:'center', color:'#888'}}>History</div></div>{tickets.map(t=><div key={t.id} onClick={()=>setViewTicket(t)} style={{background:'#fff', padding:'12px', borderRadius:'8px', marginTop:'10px'}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>{t.id} • {t.date}</span><span style={{background:'#ff9800', color:'#fff', padding:'2px 8px', borderRadius:'10px'}}>{t.status}</span></div><div style={{fontSize:'12px', marginTop:'6px'}}>{t.picks[0]?.game} +{t.picks.length-1}</div><div style={{fontSize:'11px', marginTop:'4px'}}>Stake {t.stake} • Win {t.win} • Details ›</div></div>)}</div>}

      {tab==="me" && <div style={{padding:'15px'}}><div style={{background:'#222', padding:'20px', borderRadius:'12px', textAlign:'center'}}><div style={{width:'50px', height:'50px', background:'#e00000', borderRadius:'50%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center'}}>P</div><div style={{marginTop:'8px'}}>{user.name}</div><div style={{fontSize:'28px', fontWeight:'bold', color:'#ffeb3b'}}>GH₵ {user.bal.toFixed(2)}</div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'15px'}}><a href={`https://wa.me/${WA}`} style={{background:'#00c853', color:'#fff', padding:'12px', borderRadius:'6px', textDecoration:'none'}}>Deposit</a><a href={`https://wa.me/${WA}`} style={{background:'#333', color:'#fff', padding:'12px', borderRadius:'6px', textDecoration:'none'}}>Withdraw</a></div></div></div>}

      {bets.length>0 && <div style={{position:'fixed', bottom:'56px', left:0, right:0, background:'#1e1e1e', padding:'10px', borderTop:'2px solid #e00000', zIndex:20}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>{bets.length} selections • {total.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:'#e00000'}}>Clear</span></div><button onClick={place} style={{width:'100%', marginTop:'8px', background:'#e00000', border:'none', color:'#fff', padding:'12px', fontWeight:'bold', borderRadius:'4px'}}>Place Bet • Win GH₵ {(total*stake).toFixed(2)}</button></div>}

      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#111', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', textAlign:'center', padding:'8px 0', borderTop:'1px solid #222', zIndex:30}}>
        <div onClick={()=>setTab("home")} style={{color:tab==="home"?'#e00000':'#777', fontSize:'10px'}}><div>🏠</div>Home</div>
        <div onClick={()=>setTab("az")} style={{color:tab==="az"?'#e00000':'#777', fontSize:'10px'}}><div>📊</div>A-Z</div>
        <div onClick={()=>setTab("open")} style={{color:tab==="open"?'#e00000':'#777', fontSize:'10px'}}><div>🧾</div>Open Bets</div>
        <div onClick={()=>setTab("me")} style={{color:tab==="me"?'#e00000':'#777', fontSize:'10px'}}><div>👤</div>Me</div>
      </div>
    </div>
  )
}
