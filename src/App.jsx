
import React, { useState, useEffect } from 'react';
const WHATSAPP = "233504877566";

// All leagues from video
const LEAGUES = [
  { id:1, name:"Premier League", country:"England", matches:[
    {id:1001, home:"Coventry City", away:"QPR", time:"12:00", odds:[1.32,4.8,12.0], live:true, score:"0-0 HT", boost:true},
    {id:1002, home:"Man Utd", away:"Man City", time:"15:00", odds:[2.40,3.87,2.27], live:false},
    {id:1003, home:"Leeds", away:"Brighton", time:"12:00", odds:[2.15,3.4,3.6], live:true, score:"1-0"},
  ]},
  { id:2, name:"La Liga", country:"Spain", matches:[
    {id:2001, home:"Levante", away:"Barcelona", time:"20:00", odds:[13.55,9.05,1.20], live:false},
    {id:2002, home:"Real Madrid", away:"Atletico", time:"18:00", odds:[2.1,3.4,3.2], live:false},
  ]},
  { id:3, name:"Ghana Premier", country:"Ghana", matches:[
    {id:3001, home:"Hearts of Oak", away:"Kotoko", time:"15:00", odds:[2.1,3.1,2.9], live:false},
  ]},
];

export default function App(){
  const [tab, setTab] = useState("home"); // home | az | open | me
  const [subTab, setSubTab] = useState("football");
  const [bets, setBets] = useState([]);
  const [betType, setBetType] = useState("Multiple"); // Single Multiple System
  const [stake, setStake] = useState(0.20);
  const [user, setUser] = useState(()=>{ const s=localStorage.getItem('sb_user'); return s? JSON.parse(s): {name:"popki", phone:"0504877566", balance:0.95, logged:true} });
  const [tickets, setTickets] = useState(()=>{ const s=localStorage.getItem('sb_tickets'); return s? JSON.parse(s): [
    {id:"SB1001", date:"12 Sep", stake:0.20, total:2.40, win:0.68, status:"Won", selections:[{game:"AD Berazategui vs CA Atlas", pick:"Over 1.5", odd:1.38}]},
    {id:"SB1002", date:"12 Sep", stake:0.20, total:2.40, win:0, status:"Lost", selections:[{game:"Brachina FC vs AD Sao Caetano", pick:"Over 3.5", odd:1.53}]},
  ]});
  const [showSlip, setShowSlip] = useState(false);
  const [ticketView, setTicketView] = useState(null);

  useEffect(()=>{ localStorage.setItem('sb_user', JSON.stringify(user)); }, [user]);
  useEffect(()=>{ localStorage.setItem('sb_tickets', JSON.stringify(tickets)); }, [tickets]);

  const totalOdds = bets.reduce((a,b)=>a*b.odd,1);
  const potentialWin = (totalOdds*stake).toFixed(2);

  const addBet = (m, type) => {
    const types={0:'1',1:'X',2:'2'}; const id=m.id+"-"+type;
    if(bets.find(b=>b.id===id)) setBets(bets.filter(b=>b.id!==id));
    else { setBets([...bets, {id, matchId:m.id, game:`${m.home} vs ${m.away}`, type:types[type], odd:m.odds[type], league:m.league || "Football"}]); setShowSlip(true); }
  };

  const placeBet = () => {
    if(bets.length===0) return;
    if(stake>user.balance) return alert("Insufficient balance - Deposit via MoMo");
    const newTicket = { id:"SB"+Date.now().toString().slice(-6), date:new Date().toLocaleDateString(), stake, total:totalOdds.toFixed(2), win:potentialWin, status:"Open", selections:[...bets], cashout:(stake*0.85).toFixed(2)};
    setTickets([newTicket,...tickets]);
    setUser({...user, balance: +(user.balance-stake).toFixed(2)});
    setBets([]); setShowSlip(false);
    let msg=`NEW BET ${user.phone}%0AStake GHS ${stake} To Win GHS ${potentialWin}%0A`;
    newTicket.selections.forEach(s=>msg+=`${s.game} ${s.type}@${s.odd}%0A`);
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`,'_blank');
    setTab("open");
  };

  const allMatches = LEAGUES.flatMap(l=> l.matches.map(m=>({...m, league:l.name})));

  return(
    <div style={{background:'#0f0f0f', color:'white', minHeight:'100vh', fontFamily:'Arial', paddingBottom:'130px', fontSize:'13px'}}>
      {/* HEADER RED LIKE VIDEO */}
      <div style={{background:'#e00000', padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:30}}>
        <div style={{fontWeight:'900', fontStyle:'italic', fontSize:'20px', letterSpacing:'-0.5px'}}>SportyBet</div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}><span>🔍</span><span>🔔</span><span style={{background:'rgba(0,0,0,0.2)', padding:'4px 8px', borderRadius:'12px', fontSize:'12px'}}>GHS {user.balance.toFixed(2)}</span></div>
      </div>

      {/* TABS LIKE VIDEO */}
      {tab==="home" && (
        <>
          <div style={{background:'#111', padding:'6px', display:'flex', gap:'6px', overflowX:'auto'}}>
            {['Premier League','LaLiga','News','Bundesliga'].map(t=><div key={t} style={{background:'#222', padding:'12px 16px', borderRadius:'8px', minWidth:'90px', textAlign:'center', fontSize:'11px', border:'1px solid #333'}}>{t}</div>)}
          </div>
          <div style={{background:'#1a1a1a', display:'flex', gap:'15px', padding:'10px 12px', overflowX:'auto', fontSize:'12px', whiteSpace:'nowrap', borderBottom:'1px solid #222'}}>
            {['All Sports','Load Code','Aviator','Virtuals','More'].map(x=><span key={x} style={{color:x==="All Sports"?'#e00000':'#888'}}>{x}</span>)}
          </div>
          <div style={{background:'#222', display:'flex', gap:'8px', padding:'10px', overflowX:'auto'}}>
            {['TODAY\'S FOOTBALL','FOOTBALL IN NEXT 3 HOURS','ENGLAND PREMIER LEAGUE','SPAIN LALIGA'].map(x=><div key={x} style={{background:'#2a2a2a', padding:'8px 12px', borderRadius:'20px', fontSize:'10px', whiteSpace:'nowrap', border:'1px solid #333'}}>{x}</div>)}
          </div>

          {/* FEATURED VIRTUALS */}
          <div style={{background:'#1a1a1a', padding:'10px', margin:'8px', borderRadius:'8px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'8px'}}><span>Featured • Virtuals</span><span style={{color:'#888'}}>Lucky Number</span></div>
            <div style={{background:'#000', padding:'10px', borderRadius:'6px', border:'1px solid #333'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><span>NFO vs LEE • England</span><span style={{color:'#ffeb3b'}}>2.75</span></div>
              <div style={{fontSize:'11px', color:'#888'}}>Both teams to score, Home/Draw, Double Chance</div>
              <div style={{display:'flex', gap:'8px', marginTop:'8px'}}><input type="number" placeholder="GHS 0.2" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{background:'#222', border:'1px solid #333', color:'white', padding:'6px', borderRadius:'4px', width:'100px'}}/><button style={{flex:1, background:'#00c853', border:'none', color:'white', padding:'6px', borderRadius:'4px'}}>Bet Virtual</button></div>
            </div>
          </div>

          {/* LIVE */}
          <div style={{background:'#000', display:'flex', gap:'0', padding:'0', fontSize:'11px', overflowX:'auto'}}>
            {['LIVE','Football','vFootball','Basketball','Tennis'].map((x,i)=><div key={x} style={{padding:'10px 12px', color:i===0?'white':'#777', background:i===0?'#e00000':'transparent', fontWeight:i===0?'bold':'normal'}}>{x}</div>)}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 50px 50px 50px', background:'#111', padding:'6px 10px', fontSize:'10px', color:'#888', textAlign:'center'}}><div style={{textAlign:'left'}}>1X2 • O/U • DC</div><div>1</div><div>X</div><div>2</div></div>
          {allMatches.map(m=>(
            <div key={m.id} style={{background:'#2a2a2a', borderBottom:'3px solid #0f0f0f'}}>
              <div style={{padding:'5px 10px', fontSize:'10px', color:'#aaa', display:'flex', justifyContent:'space-between'}}><span>{m.boost && <span style={{background:'#e00000', color:'white', padding:'1px 4px', borderRadius:'3px', marginRight:'4px'}}>LIVE BOOST</span>}{m.time} {m.league}</span><span style={{color: m.live?'#00ff00':'#888'}}>{m.score || ""}</span></div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 50px 50px 50px', padding:'0 8px 8px 10px', alignItems:'center'}}>
                <div style={{lineHeight:'1.3'}}><div style={{fontSize:'12px'}}>{m.home}</div><div style={{fontSize:'12px', color:'#bbb'}}>{m.away}</div></div>
                {m.odds.map((o,i)=>{ const sel=bets.find(b=>b.id===m.id+"-"+i); return <button key={i} onClick={()=>addBet(m,i)} style={{background: sel?'#e00000':'#3a3a3a', color: sel?'white':'#ffeb3b', border:'none', padding:'10px 0', margin:'2px', borderRadius:'3px', fontWeight:'bold', fontSize:'12px'}}>{o}</button>})}
              </div>
            </div>
          ))}

          <div style={{padding:'15px', textAlign:'center', background:'#111', marginTop:'10px'}}>
            <div style={{fontSize:'12px', fontWeight:'bold', marginBottom:'10px'}}>Grand Prize Winners</div>
            <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
              {['GHS 10,608','GHS 10,300','GHS 10,300'].map(w=><div key={w} style={{background:'#222', padding:'8px', borderRadius:'6px', fontSize:'10px', flex:1}}>{w}<br/>won<br/>In Sports</div>)}
            </div>
          </div>
          <div style={{background:'black', padding:'15px', textAlign:'center', fontSize:'10px', color:'#777'}}>
            <div>SportyBet Official Betting Partner LALIGA</div><div>M-PESA Paybill *711*222#</div><div style={{marginTop:'8px'}}>VISA | MTN | Tigo | Airtel</div>
          </div>
        </>
      )}

      {tab==="az" && (
        <div style={{background:'#fff', color:'black', minHeight:'80vh'}}>
          <div style={{background:'#e00000', color:'white', padding:'10px', display:'flex', gap:'10px'}}><input placeholder="Teams, Players, Leagues, ID" style={{flex:1, padding:'8px', borderRadius:'20px', border:'none'}}/></div>
          <div style={{display:'flex', fontSize:'11px'}}><div style={{flex:1, padding:'10px', fontWeight:'bold', borderBottom:'2px solid #e00000'}}>Sports (255)</div><div style={{flex:1, padding:'10px', color:'#888'}}>Live (255)</div></div>
          <div style={{display:'grid', gridTemplateColumns:'120px 1fr'}}>
            <div style={{background:'#f5f5f5'}}>{['Football','vFootball','Basketball','Tennis','eFootball'].map(x=><div key={x} style={{padding:'12px 10px', fontSize:'12px', borderBottom:'1px solid #eee', background:x==="Football"?'white':'', borderLeft:x==="Football"?'3px solid #e00000':''}}>{x}</div>)}</div>
            <div style={{padding:'10px', fontSize:'12px'}}>{LEAGUES.map(l=><div key={l.id} style={{padding:'8px 0', borderBottom:'1px solid #eee'}}>{l.name}</div>)}</div>
          </div>
        </div>
      )}

      {tab==="open" && (
        <div style={{background:'#f5f5f5', color:'black', minHeight:'80vh', padding:'10px'}}>
          <div style={{display:'flex', background:'white', borderRadius:'20px', padding:'3px'}}><div style={{flex:1, background:'black', color:'white', padding:'8px', borderRadius:'20px', textAlign:'center', fontSize:'12px'}}>Open Bets ({tickets.filter(t=>t.status==="Open").length})</div><div style={{flex:1, padding:'8px', textAlign:'center', fontSize:'12px', color:'#888'}}>Bet History</div></div>
          {ticketView? (
            <div style={{background:'white', marginTop:'10px', borderRadius:'8px', padding:'12px'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><span onClick={()=>setTicketView(null)}>← Back</span><span>Ticket Details</span><span></span></div>
              <div style={{marginTop:'10px', fontSize:'12px'}}>
                <div>Total Stake: GHS {ticketView.stake}</div><div>Total Return: GHS {ticketView.win}</div><div>Status: <b style={{color:ticketView.status==="Won"?'green':'red'}}>{ticketView.status}</b></div>
                <hr style={{margin:'10px 0'}}/>
                {ticketView.selections.map((s,i)=><div key={i} style={{padding:'8px 0', borderBottom:'1px solid #eee'}}>{s.game}<br/>Pick: {s.type} @ {s.odd}</div>)}
                <button style={{width:'100%', marginTop:'10px', background:'#e00000', color:'white', border:'none', padding:'10px', borderRadius:'6px'}} onClick={()=>{ setTickets(tickets.filter(t=>t.id!==ticketView.id)); setTicketView(null); }}>Delete Ticket</button>
              </div>
            </div>
          ) : tickets.map(t=>(
            <div key={t.id} onClick={()=>setTicketView(t)} style={{background:'white', borderRadius:'8px', padding:'12px', marginTop:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div><div style={{fontWeight:'bold', fontSize:'12px'}}>Multiple</div><div style={{fontSize:'11px', color:'#888'}}>Total Stake: {t.stake} GHS • {t.date}</div><div style={{fontSize:'11px'}}>{t.selections[0]?.game}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'11px', background: t.status==="Won"?'#00c853': t.status==="Lost"?'#e00000':'#ff9800', color:'white', padding:'2px 8px', borderRadius:'10px'}}>{t.status}</div><div style={{fontSize:'12px', marginTop:'4px'}}>{t.win} GHS</div><div style={{fontSize:'10px', color:'#e00000'}}>Details &gt;</div></div>
            </div>
          ))}
        </div>
      )}

      {tab==="me" && (
        <div style={{background:'#f0f0f0', color:'black', minHeight:'80vh'}}>
          <div style={{background:'#111', color:'white', padding:'15px', display:'flex', justifyContent:'space-between'}}><div><div style={{display:'flex', gap:'10px', alignItems:'center'}}><div style={{width:'40px', height:'40px', background:'#e00000', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>P</div><div><div>{user.name} ›</div><div style={{fontSize:'10px', color:'#888'}}>Loyalty Tier</div></div></div><div style={{marginTop:'10px'}}><div style={{fontSize:'11px', color:'#888'}}>Total Balance</div><div style={{fontSize:'20px', fontWeight:'bold'}}>GHS {user.balance.toFixed(2)}</div></div><div style={{display:'flex', gap:'10px', marginTop:'12px'}}><button style={{flex:1, background:'#00c853', border:'none', color:'white', padding:'10px', borderRadius:'6px'}}>Deposit</button><button style={{flex:1, background:'#333', border:'none', color:'white', padding:'10px', borderRadius:'6px'}}>Withdraw</button></div></div></div>
          <div style={{background:'white', margin:'10px', borderRadius:'8px', padding:'10px', fontSize:'12px'}}><div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #eee'}}><span>⚽ Sports Bet History</span><span>›</span></div><div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #eee'}}><span>📄 Transaction Records</span><span>›</span></div><div style={{display:'flex', justifyContent:'space-between', padding:'12px 0'}}><span>🎁 Gifts (2) Lucky Wheel (0)</span><span>›</span></div></div>
          <div style={{background:'white', margin:'10px', borderRadius:'8px', padding:'10px', fontSize:'12px'}}>
            {['My Social','Daily Streak 16','Customer Service Online 24/7','Notification Center','Rate Our App','How to play','Share an Idea','Update App'].map(x=><div key={x} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #eee'}}><span>{x}</span><span>›</span></div>)}
            <div onClick={()=>{ localStorage.removeItem('sb_user'); setUser({name:"Guest", phone:"", balance:0, logged:false}); setTab("home"); }} style={{padding:'12px 0', textAlign:'center', color:'#e00000'}}>Log Out</div>
          </div>
          <div style={{textAlign:'center', fontSize:'10px', color:'#888', padding:'10px'}}>M-PESA Paybill *711*222# • VISA MTN etc<br/>18+ Play Responsibly • License 0000237</div>
        </div>
      )}

      {/* BETSLIP LIKE VIDEO - FLOATING */}
      {(showSlip || bets.length>0) && tab==="home" && (
        <div style={{position:'fixed', bottom:'56px', left:0, right:0, background:'#1a1a1a', borderTop:'2px solid #222', zIndex:40, maxHeight:'70vh', overflowY:'auto'}}>
          <div style={{background:'#222', display:'flex', padding:'8px', gap:'10px', fontSize:'12px'}}>
            <span style={{background:betType==="Single"?'white':'transparent', color:betType==="Single"?'black':'#aaa', padding:'4px 12px', borderRadius:'12px'}} onClick={()=>setBetType("Single")}>Single</span>
            <span style={{background:betType==="Multiple"?'white':'transparent', color:betType==="Multiple"?'black':'#aaa', padding:'4px 12px', borderRadius:'12px'}} onClick={()=>setBetType("Multiple")}>Multiple</span>
            <span style={{background:betType==="System"?'white':'transparent', color:betType==="System"?'black':'#aaa', padding:'4px 12px', borderRadius:'12px'}} onClick={()=>setBetType("System")}>System</span>
            <span style={{marginLeft:'auto'}} onClick={()=>setBets([])}>Clear</span>
          </div>
          {bets.map(b=>(
            <div key={b.id} style={{background:'#2a2a2a', padding:'8px 12px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between'}}>
              <div><div style={{fontSize:'11px'}}>{b.game}</div><div style={{fontSize:'11px', color:'#ffeb3b'}}>{b.type} @ {b.odd}</div></div><div onClick={()=>setBets(bets.filter(x=>x.id!==b.id))}>✕</div>
            </div>
          ))}
          <div style={{padding:'12px', background:'#111'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}><span>Total Stake (GHS)</span><input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{width:'80px', background:'#000', border:'1px solid #333', color:'white', padding:'4px', borderRadius:'4px'}}/></div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'8px', fontSize:'12px'}}><span>Total Odds: {totalOdds.toFixed(2)}</span><span>Potential Win: <b style={{color:'#ffeb3b'}}>GHS {potentialWin}</b></span></div>
            <button onClick={placeBet} style={{width:'100%', marginTop:'10px', background:'#e00000', color:'white', border:'none', padding:'12px', borderRadius:'4px', fontWeight:'bold', fontSize:'14px'}}>Place Bet • Pay GHS {stake}</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV LIKE VIDEO */}
      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#111', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', textAlign:'center', padding:'6px 0', borderTop:'1px solid #222', zIndex:50}}>
        <div onClick={()=>setTab("home")} style={{color:tab==="home"?'#e00000':'#777', fontSize:'9px'}}><div style={{fontSize:'18px'}}>🏠</div>Home</div>
        <div onClick={()=>setTab("az")} style={{color:tab==="az"?'#e00000':'#777', fontSize:'9px'}}><div style={{fontSize:'18px'}}>📊</div>A-Z Menu</div>
        <div style={{color:'#777', fontSize:'9px'}}><div style={{fontSize:'18px'}}>🎮</div>Gamers</div>
        <div onClick={()=>setTab("open")} style={{color:tab==="open"?'#e00000':'#777', fontSize:'9px'}}><div style={{fontSize:'18px'}}>🧾</div>Open Bets<br/>{tickets.filter(t=>t.status==="Open").length>0 && <span style={{background:'#e00000', color:'white', borderRadius:'8px', padding:'0 4px', fontSize:'8px'}}>{tickets.filter(t=>t.status==="Open").length}</span>}</div>
        <div onClick={()=>setTab("me")} style={{color:tab==="me"?'#e00000':'#777', fontSize:'9px'}}><div style={{fontSize:'18px'}}>👤</div>Me</div>
      </div>

      {/* FLOATING BET COUNT */}
      {bets.length>0 &&!showSlip && tab==="home" && <div onClick={()=>setShowSlip(true)} style={{position:'fixed', bottom:'70px', right:'15px', background:'#e00000', width:'50px', height:'50px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', zIndex:45}}>{bets.length}</div>}
    </div>
  )
}
