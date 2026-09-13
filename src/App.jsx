
import React, { useState } from 'react';

const WHATSAPP = "233504877566";

const matches = [
  { id: 1, time: "15:00", league: "Ghana Premier League", home: "Hearts of Oak", away: "Asante Kotoko", odds: [2.10, 3.20, 2.90] },
  { id: 2, time: "15:00", league: "Premier League", home: "Arsenal", away: "Everton", odds: [1.55, 4.10, 5.20] },
  { id: 3, time: "17:30", league: "Premier League", home: "Man Utd", away: "Tottenham", odds: [2.05, 3.40, 3.60] },
  { id: 4, time: "18:00", league: "La Liga", home: "Barcelona", away: "Real Madrid", odds: [2.30, 3.45, 2.80] },
  { id: 5, time: "20:00", league: "Serie A", home: "Napoli", away: "AC Milan", odds: [2.15, 3.30, 3.25] },
];

export default function App(){
  const [bets, setBets] = useState([]);
  const [stake, setStake] = useState(2);
  const totalOdds = bets.reduce((a,b)=>a*b.odd,1);
  
  const addBet = (m, type, odd) => {
    const id = m.id+"-"+type;
    if(!bets.find(x=>x.id===id)) setBets([...bets, {id, game: m.home+" vs "+m.away, type, odd}]);
  };

  return(
    <div style={{background:'#1e1e1e', color:'white', minHeight:'100vh', fontFamily:'Arial', paddingBottom:'90px'}}>
      {/* Header like SportyBet - RED */}
      <div style={{background:'#d70000', padding:'10px 15px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{fontWeight:'900', fontSize:'20px', fontStyle:'italic'}}>BetXBet</div>
          <div style={{fontSize:'10px', background:'white', color:'#d70000', padding:'2px 5px', borderRadius:'3px'}}>GHANA</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{background:'rgba(0,0,0,0.3)', padding:'5px 10px', borderRadius:'15px', fontSize:'13px'}}>GHS 0.95</div>
          <div style={{fontSize:'18px'}}>☰</div>
        </div>
      </div>

      {/* Top Nav */}
      <div style={{background:'#111', display:'flex', gap:'15px', padding:'10px 15px', overflowX:'auto', fontSize:'13px', whiteSpace:'nowrap'}}>
        <span style={{color:'#d70000', borderBottom:'2px solid #d70000', paddingBottom:'5px', fontWeight:'bold'}}>Sports</span>
        <span>Football</span><span style={{color:'#888'}}>vFootball</span><span>Basketball</span><span>Tennis</span>
      </div>

      {/* Second Nav */}
      <div style={{background:'#222', display:'flex', gap:'0', fontSize:'12px'}}>
        <div style={{padding:'10px 15px', background:'white', color:'black', fontWeight:'bold'}}>Highlights</div>
        <div style={{padding:'10px 15px', color:'#aaa'}}>Today</div>
        <div style={{padding:'10px 15px', color:'#aaa'}}>Countries</div>
      </div>

      {/* Market Tabs */}
      <div style={{background:'#2a2a2a', display:'flex', fontSize:'11px', borderBottom:'1px solid #333'}}>
        {['1X2','DC','OU','1st Half','Handicap'].map(t=><div key={t} style={{padding:'10px 12px', borderRight:'1px solid #333', color: t==='1X2'?'white':'#888', background: t==='1X2'?'#333':''}}>{t}</div>)}
      </div>

      {/* Header 1 X 2 */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 60px 60px 60px', background:'#000', padding:'8px 10px', fontSize:'11px', color:'#888', textAlign:'center'}}>
        <div style={{textAlign:'left'}}>Football</div><div>1</div><div>X</div><div>2</div>
      </div>

      {/* Matches List */}
      {matches.map(m=>(
        <div key={m.id} style={{background:'#2d2d2d', borderBottom:'1px solid #1e1e1e'}}>
          <div style={{padding:'6px 10px', fontSize:'10px', color:'#aaa', display:'flex', justifyContent:'space-between'}}>
            <span>{m.time} • {m.league}</span><span>⚡</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 60px 60px 60px', alignItems:'center', padding:'0 10px 10px 10px'}}>
            <div style={{fontSize:'13px', lineHeight:'1.3'}}><div style={{fontWeight:'bold'}}>{m.home}</div><div>{m.away}</div></div>
            {m.odds.map((odd,i)=>(
              <button key={i} onClick={()=>addBet(m, i===0?'1':i===1?'X':'2', odd)} style={{background:'#3a3a3a', border:'1px solid #444', color: bets.find(b=>b.id===m.id+"-"+(i===0?'1':i===1?'X':'2'))? '#22c55e' : '#ffcc00', padding:'10px 2px', fontWeight:'bold', fontSize:'13px', borderRadius:'3px'}}>{odd.toFixed(2)}</button>
            ))}
          </div>
        </div>
      ))}

      {/* Bet Slip Bar - Bottom */}
      <div style={{position:'fixed', bottom:60, left:0, right:0, background:'#111', borderTop:'1px solid #333', padding:'10px'}}>
        {bets.length>0 && (
          <div style={{marginBottom:'10px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'8px'}}><span>{bets.length} Selections</span><span onClick={()=>setBets([])} style={{color:'#d70000'}}>Clear</span></div>
            <div style={{display:'flex', gap:'10px', overflowX:'auto'}}>
              {bets.map(b=><div key={b.id} style={{background:'#222', padding:'5px 8px', borderRadius:'15px', fontSize:'11px', whiteSpace:'nowrap'}}>{b.game} {b.type} @{b.odd} ✕</div>)}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px', alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                <span style={{fontSize:'12px'}}>Stake GHS</span>
                <input type="number" value={stake} onChange={e=>setStake(e.target.value)} style={{width:'60px', background:'#000', border:'1px solid #333', color:'white', padding:'5px', borderRadius:'4px'}}/>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'11px', color:'#aaa'}}>Total Odds: {totalOdds.toFixed(2)}</div>
                <div style={{fontSize:'13px', color:'#ffcc00', fontWeight:'bold'}}>To Win: GHS {(totalOdds*stake).toFixed(2)}</div>
              </div>
            </div>
            <button onClick={()=>{ let msg=`Hello BetX! I want to bet:%0A`; bets.forEach(b=>msg+=`${b.game} ${b.type} @${b.odd}%0A`); msg+=`Stake: ${stake} GHS - Total: ${(totalOdds*stake).toFixed(2)} GHS`; window.open(`https://wa.me/${WHATSAPP}?text=${msg}`,'_blank'); }} style={{width:'100%', marginTop:'10px', background:'#d70000', color:'white', border:'none', padding:'12px', borderRadius:'4px', fontWeight:'bold'}}>Place Bet on WhatsApp</button>
          </div>
        )}
        {!bets.length && <div style={{textAlign:'center', fontSize:'12px', color:'#666'}}>Tap odds to add to betslip - WhatsApp 0504877566</div>}
      </div>

      {/* Bottom Menu */}
      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#111', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', padding:'8px 0', borderTop:'1px solid #333', fontSize:'10px', textAlign:'center'}}>
        <div>🏠<br/>Home</div><div>⚽<br/>A-Z Menu</div><div>🎮<br/>Games</div><div style={{color:'#ffcc00'}}>📄<br/>Open Bets ({bets.length})</div><div>👤<br/>Me</div>
      </div>
    </div>
  );
}
