

import React, { useState, useEffect } from 'react';
const WA = "233504877566";

const DATA = [
  { id:101, league:"England - Premier League", home:"Coventry City", away:"QPR", time:"12:00", live:true, score:"0-0 HT", minute:"HT", boost:"LIVE BOOST", stats:{poss:"55%-45%", shots:"5-2"}, markets:{
    "1X2": { "1":1.32, "X":4.80, "2":12.00 },
    "Double Chance": { "1X":1.05, "12":1.18, "X2":3.20 },
    "Over/Under": { "Over 1.5":1.25, "Under 1.5":3.80, "Over 2.5":1.85, "Under 2.5":1.90 },
    "1st Half O/U": { "Over 0.5 HT":1.40, "Under 0.5 HT":2.70 },
    "Handicap": { "Home -1":2.10, "Away +1":1.70 },
    "Next Goal": { "Home":1.50, "No Goal":8.00, "Away":4.50 }
  }},
  { id:102, league:"England - Premier League", home:"Man Utd", away:"Man City", time:"15:00", live:false, markets:{
    "1X2": { "1":2.40, "X":3.87, "2":2.27 },
    "Double Chance": { "1X":1.45, "12":1.20, "X2":1.35 },
    "Over/Under": { "Over 1.5":1.16, "Under 1.5":4.50, "Over 2.5":1.55, "Under 2.5":2.30 },
    "1st Half O/U": { "Over 0.5 HT":1.35, "Under 0.5 HT":3.00 },
    "Handicap": { "Home 0":1.90, "Away 0":1.90 },
    "Next Goal": { "Home":2.00, "No Goal":9.00, "Away":2.10 }
  }},
  { id:103, league:"Spain - LaLiga", home:"Levante", away:"Barcelona", time:"20:00", live:false, markets:{
    "1X2": { "1":13.55, "X":9.05, "2":1.20 },
    "Double Chance": { "1X":5.00, "12":1.10, "X2":1.05 },
    "Over/Under": { "Over 1.5":1.11, "Under 1.5":5.50, "Over 2.5":1.32, "Under 2.5":3.10 },
    "Handicap": { "Home +2":1.80, "Away -2":1.95 }
  }},
  { id:104, league:"Ghana - Premier League", home:"Hearts of Oak", away:"Asante Kotoko", time:"15:00", live:false, markets:{
    "1X2": { "1":2.10, "X":3.10, "2":3.33 },
    "Double Chance": { "1X":1.25, "12":1.22, "X2":1.50 },
    "Over/Under": { "Over 1.5":1.35, "Under 1.5":3.00 }
  }},
];

export default function App(){
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null); // match detail page
  const [marketTab, setMarketTab] = useState("1X2");
  const [bets, setBets] = useState([]);
  const [stake, setStake] = useState(0.20);
  const [betType, setBetType] = useState("Multiple");
  const [user, setUser] = useState(()=>{ const s=localStorage.getItem('sb_user'); return s? JSON.parse(s): {name:"popki", bal:0.95, phone:"0504877566"} });
  const [tickets, setTickets] = useState(()=>{ const s=localStorage.getItem('sb_tix'); return s? JSON.parse(s): [] });

  useEffect(()=>{ localStorage.setItem('sb_user', JSON.stringify(user)); }, [user]);
  useEffect(()=>{ localStorage.setItem('sb_tix', JSON.stringify(tickets)); }, [tickets]);

  const totalOdds = bets.reduce((a,b)=>a*b.odd,1);
  const addBet = (game, type, odd, market) => {
    const id = game.id+"-"+market+"-"+type;
    if(bets.find(b=>b.id===id)) setBets(bets.filter(b=>b.id!==id));
    else setBets([...bets, {id, game:`${game.home} vs ${game.away}`, type:`${type} (${market})`, odd, market, match:game}]);
  };
  const place = () => {
    if(bets.length===0) return;
    if(stake>user.bal) return alert("Low balance - Deposit via MoMo 0504877566");
    const t = {id:"SB"+Date.now().toString().slice(-6), date:new Date().toLocaleString(), stake, odds:totalOdds.toFixed(2), win:(totalOdds*stake).toFixed(2), status:"Open", cashout:(stake*0.88).toFixed(2), picks:[...bets]};
    setTickets([t,...tickets]); setUser({...user, bal:+(user.bal-stake).toFixed(2)}); setBets([]);
    let msg=`BET ${user.phone} GHS ${stake} WIN GHS ${(totalOdds*stake).toFixed(2)}%0A`; t.picks.forEach(p=>msg+=`${p.game} ${p.type} @${p.odd}%0A`);
    window.open(`https://wa.me/${WA}?text=${msg}`,'_blank'); setTab("open"); setSelected(null);
  };

  // MATCH DETAIL PAGE - like video when you click a match
  if(selected){
    const m = selected;
    const markets = Object.keys(m.markets);
    return(
      <div style={{background:'#0f0f0f', color:'white', minHeight:'100vh', fontFamily:'Arial'}}>
        <div style={{background:'#e00000', padding:'10px', display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:20}}>
          <span onClick={()=>setSelected(null)}>← Back</span><span style={{fontWeight:'bold'}}>{m.home} vs {m.away}</span><span>⋯</span>
        </div>
        <div style={{background:'#1a1a1a', padding:'12px', textAlign:'center', borderBottom:'1px solid #222'}}>
          <div style={{fontSize:'11px', color:'#888'}}>{m.league} • {m.time} {m.live && <span style={{color:'#00ff00'}}>LIVE {m.score}</span>}</div>
          <div style={{display:'flex', justifyContent:'center', gap:'20px', marginTop:'8px', fontSize:'18px', fontWeight:'bold'}}><span>{m.home}</span><span style={{color:'#888'}}>vs</span><span>{m.away}</span></div>
          <div style={{display:'flex', justifyContent:'center', gap:'15px', marginTop:'8px', fontSize:'10px', color:'#aaa'}}><span>Poss {m.stats?.poss || "50%-50%"}</span><span>Shots {m.stats?.shots || "0-0"}</span><span>📊 Stats</span><span>📺 Live</span></div>
        </div>
        <div style={{display:'flex', overflowX:'auto', background:'#111', borderBottom:'1px solid #222', fontSize:'11px'}}>
          {markets.map(k=><div key={k} onClick={()=>setMarketTab(k)} style={{padding:'10px 12px', whiteSpace:'nowrap', color: marketTab===k?'white':'#888', borderBottom: marketTab===k?'2px solid #e00000':'none', background: marketTab===k?'#222':''}}>{k}</div>)}
        </div>
        <div style={{padding:'10px'}}>
          <div style={{fontSize:'12px', color:'#aaa', marginBottom:'8px'}}>{marketTab}</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
            {Object.entries(m.markets[marketTab] || {}).map(([k,v])=>{
              const id=m.id+"-"+marketTab+"-"+k; const sel=bets.find(b=>b.id===id);
              return <button key={k} onClick={()=>addBet(m,k,v,marketTab)} style={{background: sel?'#e00000':'#2a2a2a', border:'1px solid #333', color: sel?'white':'#ffeb3b', padding:'14px', borderRadius:'6px', display:'flex', justifyContent:'space-between'}}><span>{k}</span><b>{v}</b></button>
            })}
          </div>
          <div style={{marginTop:'20px', background:'#1a1a1a', padding:'10px', borderRadius:'8px', fontSize:'11px', color:'#888'}}>
            <div>All markets: 1X2 is Home/Draw/Away. Double Chance covers 2 outcomes. Over/Under is total goals. Handicap gives advantage. Next Goal is who scores next. Cashout available for Open bets. 18+ Play Responsibly.</div>
          </div>
        </div>
        {bets.length>0 && <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#1e1e1e', padding:'10px', borderTop:'2px solid #e00000'}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>{bets.length} picks • {totalOdds.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:'#e00000'}}>Clear</span></div><div style={{display:'flex', gap:'8px', marginTop:'8px'}}><input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{width:'80px', background:'black', border:'1px solid #333', color:'white', padding:'8px', borderRadius:'4px'}}/><button onClick={place} style={{flex:1, background:'#e00000', border:'none', color:'white', padding:'10px', borderRadius:'4px', fontWeight:'bold'}}>Place Bet GHS {(totalOdds*stake).toFixed(2)}</button></div></div>}
      </div>
    )
  }

  return(
    <div style={{background:'#0f0f0f', color:'white', minHeight:'100vh', fontFamily:'Arial', paddingBottom:'120px'}}>
      <div style={{background:'#e00000', padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:20}}><b style={{fontStyle:'italic', fontSize:'20px'}}>SportyBet</b><div style={{display:'flex', gap:'8px', alignItems:'center'}}><span>🔍</span><span style={{background:'rgba(0,0,0,0.3)', padding:'4px 10px', borderRadius:'15px', fontSize:'12px'}}>GHS {user.bal.toFixed(2)}</span></div></div>

      {tab==="home" && (
        <>
          <div style={{background:'#1a1a1a', display:'flex', gap:'12px', padding:'10px', overflowX:'auto', fontSize:'11px'}}><span style={{color:'#e00000', fontWeight:'bold'}}>Football</span><span style={{color:'#666'}}>Live</span><span style={{color:'#666'}}>vFootball</span><span style={{color:'#666'}}>Basketball</span></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 50px 50px 50px', background:'black', padding:'6px 10px', fontSize:'10px', color:'#777', textAlign:'center'}}><div style={{textAlign:'left'}}>Tap match for details &gt;&gt;</div><div>1</div><div>X</div><div>2</div></div>
          {DATA.map(g=>(
            <div key={g.id} style={{background:'#2a2a2a', borderBottom:'4px solid #0f0f0f'}}>
              <div onClick={()=>{setSelected(g); setMarketTab("1X2");}} style={{padding:'8px 10px', cursor:'pointer'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#aaa'}}><span>{g.boost && <span style={{background:'#e00000', color:'white', padding:'1px 4px', borderRadius:'2px', marginRight:'4px'}}>{g.boost}</span>}{g.time} • {g.league}</span><span>{g.live && <span style={{color:'#0f0'}}>● {g.score}</span>} ›</span></div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 50px 50px 50px', alignItems:'center', marginTop:'4px'}}>
                  <div style={{fontSize:'13px'}}><div>{g.home}</div><div style={{color:'#bbb'}}>{g.away}</div></div>
                  {Object.values(g.markets["1X2"]).map((o,i)=>{ const id=g.id+"-1X2-"+Object.keys(g.markets["1X2"])[i]; const sel=bets.find(b=>b.id===id); return <button key={i} onClick={(e)=>{e.stopPropagation(); addBet(g,Object.keys(g.markets["1X2"])[i],o,"1X2");}} style={{background:sel?'#e00000':'#3a3a3a', color:sel?'white':'#ffeb3b', border:'none', padding:'10px 0', margin:'2px', borderRadius:'3px', fontWeight:'bold'}}>{o}</button> })}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab==="open" && <div style={{padding:'10px'}}>{tickets.length===0? <div style={{textAlign:'center', marginTop:'50px', color:'#666'}}>No bets</div> : tickets.map(t=><div key={t.id} style={{background:'#222', padding:'12px', borderRadius:'8px', marginBottom:'10px'}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>{t.id} • {t.date}</span><span style={{background:t.status==="Won"?'#00c853':t.status==="Lost"?'#e00000':'#ff9800', padding:'2px 8px', borderRadius:'10px', fontSize:'10px'}}>{t.status}</span></div>{t.picks.map((p,i)=><div key={i} style={{fontSize:'11px', marginTop:'6px', borderBottom:'1px solid #333', paddingBottom:'4px'}}>{p.game} - {p.type} @{p.odd}</div>)}<div style={{display:'flex', justifyContent:'space-between', marginTop:'8px', fontSize:'12px'}}><span>Stake {t.stake} • Odds {t.odds}</span><b style={{color:'#ffeb3b'}}>Win {t.win}</b></div></div>)}</div>}

      {tab==="me" && <div style={{padding:'15px'}}><div style={{background:'#222', padding:'20px', borderRadius:'10px', textAlign:'center'}}><div>Hi {user.name}</div><div style={{fontSize:'28px', fontWeight:'bold', color:'#ffeb3b', marginTop:'10px'}}>GHS {user.bal.toFixed(2)}</div><a href={`https://wa.me/${WA}`} style={{display:'block', background:'#00c853', color:'white', padding:'12px', borderRadius:'6px', marginTop:'12px', textDecoration:'none'}}>Deposit via MoMo</a><div style={{fontSize:'10px', color:'#888', marginTop:'10px'}}>Paybill *711*222# • 18+ • License GCSB24P3065A</div></div></div>}

      {bets.length>0 &&!selected && <div style={{position:'fixed', bottom:'56px', left:0, right:0, background:'#1e1e1e', padding:'10px', borderTop:'2px solid #e00000'}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>{bets.length} selections • {totalOdds.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:'#e00000'}}>Clear</span></div><button onClick={place} style={{width:'100%', marginTop:'8px', background:'#e00000', border:'none', color:'white', padding:'12px', borderRadius:'4px', fontWeight:'bold'}}>Place Bet • Win GHS {(totalOdds*stake).toFixed(2)}</button></div>}

      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#111', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', textAlign:'center', padding:'6px 0', borderTop:'1px solid #222'}}>
        <div onClick={()=>{setTab("home"); setSelected(null);}} style={{color:tab==="home"?'#e00000':'#777', fontSize:'9px'}}><div>🏠</div>Home</div>
        <div style={{color:'#777', fontSize:'9px'}}><div>📊</div>A-Z</div>
        <div onClick={()=>setTab("open")} style={{color:tab==="open"?'#e00000':'#777', fontSize:'9px'}}><div>🧾</div>Open Bets {tickets.filter(t=>t.status==="Open").length>0 && <span style={{background:'#e00000', color:'white', borderRadius:'8px', padding:'0 4px'}}>{tickets.filter(t=>t.status==="Open").length}</span>}</div>
        <div onClick={()=>setTab("me")} style={{color:tab==="me"?'#e00000':'#777', fontSize:'9px'}}><div>👤</div>Me</div>
      </div>
    </div>
  )
}
