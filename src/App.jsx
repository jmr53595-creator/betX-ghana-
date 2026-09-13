import React, { useEffect, useMemo, useState } from "react";

const CONFIG = {
  API_BASE: "https://v3.football.api-sports.io",
  API_KEY: "YOUR_API_FOOTBALL_KEY",
  REFRESH_MS: 30000,
};

async function apiFootball(endpoint){
  if(!CONFIG.API_KEY || CONFIG.API_KEY==="YOUR_API_FOOTBALL_KEY") throw new Error("NO_KEY");
  const r = await fetch(`${CONFIG.API_BASE}${endpoint}`, {headers:{"x-apisports-key":CONFIG.API_KEY}});
  const d = await r.json(); return d;
}
function formatTime(s){ if(!s) return "--:--"; return new Date(s).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); }
function isLive(s){ return ["1H","HT","2H","ET","BT","P","LIVE"].includes(s); }

function normalize(item){
  const f=item.fixture,l=item.league,t=item.teams,g=item.goals,st=f.status;
  return{
    id:f.id, league:l?.name||"Football", country:l?.country||"", home:t?.home?.name||"Home", away:t?.away?.name||"Away",
    homeLogo:t?.home?.logo||"", awayLogo:t?.away?.logo||"", date:f.date, time:formatTime(f.date), live:isLive(st?.short),
    status:st?.short||"", minute:st?.elapsed!=null?`${st.elapsed}'`:"", score:g?.home!=null?`${g.home}-${g.away}`:"vs",
    markets:{"1X2":{"1":2.10,"X":3.20,"2":3.40},"Over/Under":{"Over 1.5":1.25,"Under 1.5":3.80,"Over 2.5":1.85,"Under 2.5":1.90},"Double Chance":{"1X":1.20,"12":1.30,"X2":1.50},"1st Half O/U":{"Over 0.5 HT":1.40,"Under 0.5 HT":2.70},"Handicap":{"Home -1":2.10,"Away +1":1.70},"Next Goal":{"Home":1.5,"No Goal":8.0,"Away":4.5}}
  };
}

async function fetchMatchesFromAPI(){
  try{
    const today=new Date().toISOString().split("T")[0];
    const data=await apiFootball(`/fixtures?date=${today}`);
    let list=(data.response||[]).map(normalize).slice(0,20);
    if(list.length===0) throw new Error("NO_KEY");
    return list;
  }catch{
    return[
      {id:101, league:"ENG Premier League", country:"England", home:"Coventry City", away:"QPR", time:"12:00", live:true, minute:"HT", score:"0-0", homeLogo:"", awayLogo:"", markets:{"1X2":{"1":1.32,"X":4.80,"2":12.00},"Over/Under":{"Over 1.5":1.25,"Under 1.5":3.80,"Over 2.5":1.85,"Under 2.5":1.90},"Double Chance":{"1X":1.05,"12":1.18,"X2":3.20},"1st Half O/U":{"Over 0.5 HT":1.40,"Under 0.5 HT":2.70},"Handicap":{"Home -1":2.10,"Away +1":1.70},"Next Goal":{"Home":1.5,"No Goal":8.0,"Away":4.5}}},
      {id:102, league:"Premier League", country:"England", home:"Man Utd", away:"Man City", time:"15:00", live:false, minute:"", score:"vs", homeLogo:"", awayLogo:"", markets:{"1X2":{"1":2.40,"X":3.87,"2":2.27},"Over/Under":{"Over 1.5":1.16,"Under 1.5":4.50,"Over 2.5":1.55,"Under 2.5":2.30},"Double Chance":{"1X":1.45,"12":1.20,"X2":1.35},"1st Half O/U":{"Over 0.5 HT":1.35,"Under 0.5 HT":3.0},"Handicap":{"Home 0":1.9,"Away 0":1.9},"Next Goal":{"Home":1.8,"Away":2.1}}},
      {id:103, league:"LaLiga", country:"Spain", home:"Levante", away:"Barcelona", time:"20:00", live:false, minute:"", score:"vs", homeLogo:"", awayLogo:"", markets:{"1X2":{"1":13.55,"X":9.05,"2":1.20},"Over/Under":{"Over 2.5":1.32,"Under 2.5":3.10},"Double Chance":{"1X":5.0,"X2":1.10}}},
      {id:104, league:"Ghana Premier", country:"Ghana", home:"Hearts of Oak", away:"Kotoko", time:"15:00", live:false, minute:"", score:"vs", homeLogo:"", awayLogo:"", markets:{"1X2":{"1":2.10,"X":3.10,"2":2.90},"Over/Under":{"Over 1.5":1.35,"Under 1.5":3.0}}},
      {id:105, league:"Bundesliga", country:"Germany", home:"Bayern Munich", away:"Dortmund", time:"17:30", live:true, minute:"67'", score:"1-1", homeLogo:"", awayLogo:"", markets:{"1X2":{"1":1.85,"X":3.60,"2":3.90},"Over/Under":{"Over 2.5":1.65,"Under 2.5":2.15}}},
    ];
  }
}

export default function App(){
  const [matches,setMatches]=useState([]);
  const [selected,setSelected]=useState(null);
  const [mtab,setMtab]=useState("1X2");
  const [bets,setBets]=useState([]);
  const [stake,setStake]=useState(10);
  const [btype,setBtype]=useState("Multiple");
  const [tab,setTab]=useState("home");
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [viewTicket,setViewTicket]=useState(null);
  const [tickets,setTickets]=useState(()=>{try{return JSON.parse(localStorage.getItem("betx_tickets")||"[]")}catch{return []}});
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("betx_user")||`{"name":"popki","bal":50}`)}catch{return {name:"popki",bal:50}}});

  useEffect(()=>{fetchMatchesFromAPI().then(m=>{setMatches(m); setLoading(false)});},[]);
  useEffect(()=>localStorage.setItem("betx_tickets",JSON.stringify(tickets)),[tickets]);
  useEffect(()=>localStorage.setItem("betx_user",JSON.stringify(user)),[user]);

  const totalOdds = useMemo(()=> bets.length? bets.reduce((a,b)=>a*b.odd,1):0, [bets]);
  const win = totalOdds*stake;

  const filtered = useMemo(()=>{
    let list=[...matches];
    if(filter==="live") list=list.filter(m=>m.live);
    if(filter==="upcoming") list=list.filter(m=>!m.live);
    if(search) { const q=search.toLowerCase(); list=list.filter(m=>m.home.toLowerCase().includes(q)||m.away.toLowerCase().includes(q)||m.league.toLowerCase().includes(q)); }
    return list;
  },[matches,filter,search]);

  const addBet=(match, market, sel, odd)=>{
    if(!odd) return;
    const id=`${match.id}-${market}-${sel}`;
    setBets(cur=>{
      if(cur.find(b=>b.id===id)) return cur.filter(b=>b.id!==id);
      const withoutSame=cur.filter(b=>b.matchId!==match.id);
      return [...withoutSame,{id, matchId:match.id, game:`${match.home} vs ${match.away}`, league:match.league, market, sel, odd}];
    });
  };

  const place=()=>{
    if(!bets.length) return alert("Add selections");
    if(stake<=0) return alert("Enter stake");
    if(stake>user.bal) return alert(`Low balance GH₵ ${user.bal}`);
    const t={id:"BX"+Date.now().toString().slice(-6), date:new Date().toLocaleString(), stake, odds:totalOdds.toFixed(2), win:win.toFixed(2), status:"Open", cashout:(stake*0.85).toFixed(2), picks:[...bets]};
    setTickets([t,...tickets]); setUser({...user, bal:+(user.bal-stake).toFixed(2)}); setBets([]); setTab("open"); setSelected(null);
  };

  if(viewTicket){
    return(<div style={{background:"#fff",color:"#000",minHeight:"100vh"}}><div style={{background:"#e00000",color:"#fff",padding:"12px",display:"flex",justifyContent:"space-between"}}><span onClick={()=>setViewTicket(null)}>← Back</span><b>Ticket Details</b><span></span></div><div style={{padding:"15px",fontSize:"13px"}}><div>Stake: GHS {viewTicket.stake} • Odds: {viewTicket.odds} • Win: GHS {viewTicket.win}</div><hr style={{margin:"10px 0"}}/>{viewTicket.picks.map((p,i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid #eee"}}>{p.game}<br/>Market: {p.market} - {p.sel} @ {p.odd}</div>)}<button onClick={()=>setViewTicket(null)} style={{width:"100%",marginTop:"15px",background:"#e00000",color:"#fff",padding:"12px",border:"none",borderRadius:"6px"}}>Remix Bet</button><button onClick={()=>{setTickets(tickets.filter(x=>x.id!==viewTicket.id)); setViewTicket(null)}} style={{width:"100%",marginTop:"8px",background:"#000",color:"#fff",padding:"12px",border:"none",borderRadius:"6px"}}>Delete</button></div></div>);
  }

  if(selected){
    return(
      <div style={{background:"#0f0f0f",color:"#fff",minHeight:"100vh",paddingBottom:"100px",fontFamily:"Arial"}}>
        <div style={{background:"#e00000",padding:"12px",display:"flex",justifyContent:"space-between",position:"sticky",top:0}}><span onClick={()=>setSelected(null)}>←</span><b>{selected.home} vs {selected.away}</b><span>⋯</span></div>
        <div style={{background:"#1a1a1a",padding:"15px",textAlign:"center"}}><div style={{fontSize:"11px",color:"#aaa"}}>{selected.league} • {selected.time} {selected.live && <span style={{color:"#0f0"}}>● LIVE {selected.score} {selected.minute}</span>}</div><div style={{fontSize:"18px",fontWeight:"bold",marginTop:"6px"}}>{selected.home} vs {selected.away}</div></div>
        <div style={{display:"flex",overflowX:"auto",background:"#000",borderBottom:"1px solid #222",fontSize:"11px"}}>{Object.keys(selected.markets).map(k=><div key={k} onClick={()=>setMtab(k)} style={{padding:"12px 14px",whiteSpace:"nowrap",color:mtab===k?"#fff":"#888",borderBottom:mtab===k?"2px solid #e00000":"none",cursor:"pointer"}}>{k}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",padding:"10px"}}>{Object.entries(selected.markets[mtab]||{}).map(([s,o])=>{const id=`${selected.id}-${mtab}-${s}`; const sel=bets.find(b=>b.id===id); return <button key={s} onClick={()=>addBet(selected,mtab,s,o)} style={{background:sel?"#e00000":"#2a2a2a",color:sel?"#fff":"#ffeb3b",border:"1px solid #333",padding:"14px",borderRadius:"6px",display:"flex",justifyContent:"space-between"}}><span>{s}</span><b>{o.toFixed(2)}</b></button>})}</div>
        {bets.length>0 && <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1e1e1e",padding:"12px",borderTop:"2px solid #e00000"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"11px"}}><span>{bets.length} picks • {totalOdds.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:"#e00000"}}>Clear</span></div><div style={{display:"flex",gap:"8px",marginTop:"8px"}}><input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{width:"80px",background:"#000",border:"1px solid #333",color:"#fff",padding:"8px"}}/><button onClick={place} style={{flex:1,background:"#e00000",border:"none",color:"#fff",padding:"10px",fontWeight:"bold"}}>Place Bet GH₵ {win.toFixed(2)}</button></div></div>}
      </div>
    );
  }

  return(
    <div style={{background:"#0f0f0f",color:"#fff",minHeight:"100vh",paddingBottom:"130px",fontFamily:"Arial"}}>
      <div style={{background:"#e00000",padding:"12px",display:"flex",justifyContent:"space-between",position:"sticky",top:0,zIndex:20}}><div style={{fontWeight:"900",fontStyle:"italic",fontSize:"20px"}}>SportyBet</div><div style={{fontSize:"12px",background:"rgba(0,0,0,0.3)",padding:"5px 10px",borderRadius:"15px"}}>GH₵ {user.bal.toFixed(2)}</div></div>

      {tab==="home" && <>
        <div style={{padding:"10px",background:"#121212"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team or league..." style={{width:"100%",background:"#242424",border:"1px solid #363636",color:"#fff",borderRadius:"7px",padding:"11px 13px",outline:"none"}}/></div>
        <div style={{display:"flex",gap:"7px",overflowX:"auto",padding:"3px 10px 10px",background:"#121212"}}>{[["all","All"],["live","🔴 Live"],["upcoming","Upcoming"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{whiteSpace:"nowrap",background:filter===v?"#e00000":"#292929",border:"none",color:"#fff",padding:"8px 13px",borderRadius:"18px",fontSize:"11px",fontWeight:"bold"}}>{l}</button>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 50px 50px 50px",background:"#000",padding:"6px 10px",fontSize:"10px",color:"#777",textAlign:"center"}}><div style={{textAlign:"left"}}>Tap row for markets ›</div><div>1</div><div>X</div><div>2</div></div>
        {loading?<div style={{padding:"60px",textAlign:"center",color:"#777"}}>⚽ Loading...</div>:filtered.map(m=>(
          <div key={m.id} onClick={()=>{setSelected(m); setMtab("1X2")}} style={{background:"#2a2a2a",borderBottom:"4px solid #0f0f0f",cursor:"pointer"}}>
            <div style={{padding:"6px 10px",fontSize:"10px",color:"#aaa",display:"flex",justifyContent:"space-between"}}><span>{m.time} • {m.league} {m.country}</span><span style={{color:m.live?"#0f0":"#666"}}>{m.live?`${m.score} ${m.minute}`:"vs"} ›</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 50px 50px 50px",padding:"0 10px 10px",alignItems:"center"}}>
              <div style={{fontSize:"13px"}}><div>{m.home}</div><div style={{color:"#bbb"}}>{m.away}</div></div>
              {["1","X","2"].map(k=>{const odd=m.markets["1X2"][k]; const id=`${m.id}-1X2-${k}`; const sel=bets.find(b=>b.id===id); return <button key={k} onClick={(e)=>{e.stopPropagation(); addBet(m,"1X2",k,odd)}} style={{background:sel?"#e00000":"#3a3a3a",color:sel?"#fff":"#ffeb3b",border:"none",padding:"10px 0",margin:"2px",borderRadius:"3px",fontWeight:"bold"}}>{odd.toFixed(2)}</button>})}
            </div>
          </div>
        ))}
      </>}

      {tab==="az" && <div style={{background:"#fff",color:"#000",minHeight:"70vh",padding:"10px"}}><div style={{background:"#e00000",padding:"8px",borderRadius:"20px",display:"flex"}}><input placeholder="Teams, Players, Leagues, ID" style={{flex:1,border:"none",background:"transparent",color:"#fff",outline:"none"}}/></div><div style={{display:"flex",marginTop:"10px"}}><div style={{width:"120px",background:"#f5f5f5"}}>{["Football","Basketball","Tennis"].map(x=><div key={x} style={{padding:"12px",borderLeft:x==="Football"?"3px solid #e00000":"",background:x==="Football"?"#fff":""}}>{x}</div>)}</div><div style={{flex:1,padding:"10px",fontSize:"13px"}}>{["Premier League","LaLiga","Bundesliga","Ghana Premier"].map(l=><div key={l} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}>{l} ›</div>)}</div></div></div>}

      {tab==="open" && <div style={{padding:"10px",background:"#f5f5f5",minHeight:"70vh",color:"#000"}}><div style={{display:"flex",background:"#fff",borderRadius:"20px",padding:"3px",fontSize:"12px"}}><div style={{flex:1,background:"#000",color:"#fff",padding:"8px",borderRadius:"20px",textAlign:"center"}}>Open Bets ({tickets.filter(t=>t.status==="Open").length})</div><div style={{flex:1,padding:"8px",textAlign:"center",color:"#888"}}>History</div></div>{tickets.map(t=><div key={t.id} onClick={()=>setViewTicket(t)} style={{background:"#fff",padding:"12px",borderRadius:"8px",marginTop:"10px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"11px"}}><span>{t.id} • {t.date}</span><span style={{background:"#ff9800",color:"#fff",padding:"2px 8px",borderRadius:"10px"}}>{t.status}</span></div><div style={{fontSize:"12px",marginTop:"6px"}}>{t.picks[0]?.game} +{t.picks.length-1} more • Details ›</div><div style={{fontSize:"11px",marginTop:"4px"}}>Stake {t.stake} • Win {t.win} • Cashout {t.cashout}</div></div>)}</div>}

      {tab==="me" && <div style={{padding:"15px"}}><div style={{background:"#222",padding:"20px",borderRadius:"12px",textAlign:"center"}}><div style={{width:"50px",height:"50px",background:"#e00000",borderRadius:"50%",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"}}>P</div><div style={{marginTop:"8px"}}>{user.name}</div><div style={{fontSize:"28px",fontWeight:"bold",color:"#ffeb3b"}}>GH₵ {user.bal.toFixed(2)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"15px"}}><button onClick={()=>setUser({...user,bal:user.bal+50})} style={{background:"#00c853",color:"#fff",padding:"12px",borderRadius:"6px",border:"none"}}>Add Demo GHS 50</button><button onClick={()=>setUser({...user,bal:0})} style={{background:"#333",color:"#fff",padding:"12px",borderRadius:"6px",border:"none"}}>Reset</button></div><div style={{marginTop:"12px",fontSize:"10px",color:"#888"}}>Demo Wallet Only • No Real Money • 18+ Play Responsibly</div></div></div>}

      {bets.length>0 && <div style={{position:"fixed",bottom:"56px",left:0,right:0,background:"#1e1e1e",padding:"10px",borderTop:"2px solid #e00000",zIndex:20}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"11px"}}><span>{bets.length} selections • {totalOdds.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:"#e00000"}}>Clear</span></div><div style={{display:"flex",gap:"8px",marginTop:"8px"}}><div style={{display:"flex",gap:"6px"}}>{["Single","Multiple","System"].map(tp=><button key={tp} onClick={()=>setBtype(tp)} style={{background:btype===tp?"#fff":"#292929",color:btype===tp?"#000":"#aaa",border:"none",padding:"6px 10px",borderRadius:"15px",fontSize:"10px"}}>{tp}</button>)}</div></div><div style={{display:"flex",gap:"8px",marginTop:"8px"}}><input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{width:"80px",background:"#000",border:"1px solid #333",color:"#fff",padding:"8px"}}/><button onClick={place} style={{flex:1,background:"#e00000",border:"none",color:"#fff",padding:"10px",fontWeight:"bold",borderRadius:"4px"}}>Place Bet • Win GH₵ {win.toFixed(2)}</button></div></div>}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#111",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",textAlign:"center",padding:"8px 0",borderTop:"1px solid #222",zIndex:30}}>
        <div onClick={()=>setTab("home")} style={{color:tab==="home"?"#e00000":"#777",fontSize:"10px",cursor:"pointer"}}><div>🏠</div>Home</div>
        <div onClick={()=>setTab("az")} style={{color:tab==="az"?"#e00000":"#777",fontSize:"10px",cursor:"pointer"}}><div>📊</div>A-Z</div>
        <div onClick={()=>setTab("open")} style={{color:tab==="open"?"#e00000":"#777",fontSize:"10px",cursor:"pointer"}}><div>🧾</div>Open Bets {tickets.filter(t=>t.status==="Open").length>0 && <span style={{background:"#e00000",color:"#fff",padding:"1px 4px",borderRadius:"10px",fontSize:"8px"}}>{tickets.filter(t=>t.status==="Open").length}</span>}</div>
        <div onClick={()=>setTab("me")} style={{color:tab==="me"?"#e00000":"#777",fontSize:"10px",cursor:"pointer"}}><div>👤</div>Me</div>
      </div>
    </div>
  );
}
