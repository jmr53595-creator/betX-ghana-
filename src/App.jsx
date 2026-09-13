
import React, { useState, useEffect } from 'react';
const WHATSAPP = "233504877566";

export default function App(){
  const [tab, setTab] = useState("sports");
  const [bets, setBets] = useState([]);
  const [stake, setStake] = useState(10);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [user, setUser] = useState(()=>{ const s=localStorage.getItem('betx_user'); return s? JSON.parse(s): null });
  const [usersDB, setUsersDB] = useState(()=>{ const s=localStorage.getItem('betx_usersDB'); return s? JSON.parse(s): [] });
  const [myTickets, setMyTickets] = useState(()=>{ const s=localStorage.getItem('betx_tickets'); return s? JSON.parse(s): [] });
  const [form, setForm] = useState({phone:"", password:"", name:""});

  const liveMatches = [
    { id: 101, time: "14:00", league: "Premier League", home: "Arsenal", away: "Everton", odds: [1.55, 4.1, 5.2], score: "LIVE" },
    { id: 102, time: "16:30", league: "Ghana Premier", home: "Hearts of Oak", away: "Kotoko", odds: [2.1, 3.2, 2.9], score: "vs" },
    { id: 103, time: "18:00", league: "La Liga", home: "Real Madrid", away: "Barcelona", odds: [2.3, 3.45, 2.8], score: "vs" },
    { id: 104, time: "20:45", league: "Serie A", home: "Inter", away: "AC Milan", odds: [2.15, 3.3, 3.25], score: "vs" },
    { id: 105, time: "19:00", league: "Bundesliga", home: "Bayern", away: "Dortmund", odds: [1.85, 3.8, 4.0], score: "vs" },
  ];

  useEffect(()=>{ localStorage.setItem('betx_usersDB', JSON.stringify(usersDB)); }, [usersDB]);
  useEffect(()=>{ localStorage.setItem('betx_tickets', JSON.stringify(myTickets)); }, [myTickets]);
  useEffect(()=>{ if(user) localStorage.setItem('betx_user', JSON.stringify(user)); }, [user]);

  const totalOdds = bets.reduce((a,b)=>a*b.odd,1) || 0;

  const handleAuth = () => {
    if(authMode==="register"){
      if(!form.phone ||!form.password ||!form.name) return alert("Fill all fields");
      if(usersDB.find(u=>u.phone===form.phone)) return alert("Phone already registered, please login");
      const newUser = { phone: form.phone, password: form.password, name: form.name, balance: 0.95 };
      setUsersDB([...usersDB, newUser]);
      setUser(newUser);
      setShowAuth(false);
      setForm({phone:"", password:"", name:""});
    } else {
      const found = usersDB.find(u=>u.phone===form.phone && u.password===form.password);
      if(!found) return alert("Wrong phone or password");
      setUser(found);
      setShowAuth(false);
    }
  };

  const logout = () => { localStorage.removeItem('betx_user'); setUser(null); setTab("sports"); };
  const addBet = (m, idx) => { if(!user) { setShowAuth(true); return; } const types=['1','X','2']; const id=m.id+"-"+idx; if(bets.find(b=>b.id===id)) setBets(bets.filter(b=>b.id!==id)); else setBets([...bets, {id, game: m.home+" vs "+m.away, type: types[idx], odd: parseFloat(m.odds[idx])}]); };
  const placeBet = () => {
    if(!user) { setShowAuth(true); return; }
    if(stake>user.balance) return alert("Insufficient balance. Deposit via MoMo WhatsApp 0504877566");
    const ticket={id:Date.now(), phone: user.phone, date:new Date().toLocaleString(), bets:[...bets], stake, totalOdds:totalOdds.toFixed(2), potentialWin:(totalOdds*stake).toFixed(2), status:"Open"};
    setMyTickets([ticket,...myTickets]);
    const updated = {...user, balance: +(user.balance-stake).toFixed(2)};
    setUser(updated);
    setUsersDB(usersDB.map(u=>u.phone===user.phone? updated: u));
    setBets([]);
    let msg=`NEW BET ${user.phone}%0AStake ${stake} Win ${(totalOdds*stake).toFixed(2)}%0A`;
    ticket.bets.forEach(b=>msg+=`${b.game} ${b.type}@${b.odd}%0A`);
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`,'_blank');
    setTab("openBets");
  };

  const userTickets = myTickets.filter(t=> user? t.phone===user.phone : false);

  return(
    <div style={{background:'#121212', color:'white', minHeight:'100vh', fontFamily:'Arial', paddingBottom:'130px'}}>
      {/* HEADER */}
      <div style={{background:'#e20000', padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:30}}>
        <div style={{fontWeight:'900', fontStyle:'italic', fontSize:'22px'}}>SPORTYBET</div>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          {user? <><span style={{background:'#a80000', padding:'6px 10px', borderRadius:'20px', fontSize:'12px'}}>GHS {user.balance.toFixed(2)}</span><span onClick={logout} style={{fontSize:'12px', background:'#111', padding:'5px 10px', borderRadius:'15px'}}>Logout</span></> : <><button onClick={()=>{setAuthMode("login"); setShowAuth(true);}} style={{background:'transparent', border:'1px solid white', color:'white', padding:'6px 12px', borderRadius:'4px', fontSize:'12px'}}>Login</button><button onClick={()=>{setAuthMode("register"); setShowAuth(true);}} style={{background:'white', color:'#e20000', border:'none', padding:'6px 12px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>Register</button></>}
        </div>
      </div>

      {/* AUTH MODAL - LIKE SPORTYBET */}
      {showAuth && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
          <div style={{background:'#222', width:'100%', maxWidth:'340px', borderRadius:'10px', padding:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3 style={{margin:0}}>{authMode==="login"? "Login" : "Register"}</h3><span onClick={()=>setShowAuth(false)} style={{fontSize:'20px'}}>✕</span></div>
            {authMode==="register" && <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{width:'100%', padding:'12px', marginBottom:'10px', borderRadius:'6px', border:'1px solid #333', background:'#111', color:'white'}}/>}
            <input placeholder="Phone e.g. 0504877566" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} style={{width:'100%', padding:'12px', marginBottom:'10px', borderRadius:'6px', border:'1px solid #333', background:'#111', color:'white'}}/>
            <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} style={{width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'6px', border:'1px solid #333', background:'#111', color:'white'}}/>
            <button onClick={handleAuth} style={{width:'100%', background:'#e20000', color:'white', padding:'12px', border:'none', borderRadius:'6px', fontWeight:'bold'}}>{authMode==="login"? "Login" : "Create Account"}</button>
            <div style={{textAlign:'center', marginTop:'12px', fontSize:'12px', color:'#aaa'}}>{authMode==="login"? "No account? " : "Have account? "}<span onClick={()=>setAuthMode(authMode==="login"? "register":"login")} style={{color:'#e20000', fontWeight:'bold'}}>{authMode==="login"? "Register" : "Login"}</span></div>
          </div>
        </div>
      )}

      {tab==="sports" && <>
        <div style={{background:'#1a1a1a', padding:'10px 12px', display:'flex', gap:'15px', overflowX:'auto', fontSize:'13px'}}><span style={{color:'#e20000', fontWeight:'bold', borderBottom:'2px solid #e20000'}}>Football</span><span style={{color:'#777'}}>Live</span><span style={{color:'#777'}}>Basketball</span><span style={{color:'#777'}}>Jackpot</span></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 56px 56px 56px', background:'black', padding:'8px 10px', fontSize:'11px', color:'#999', textAlign:'center'}}><div style={{textAlign:'left'}}>All Football</div><div>1</div><div>X</div><div>2</div></div>
        {liveMatches.map(m=>(
          <div key={m.id} style={{background:'#2e2e2e', borderBottom:'4px solid #121212'}}>
            <div style={{padding:'6px 10px', fontSize:'10px', color:'#aaa'}}>{m.time} • {m.league}</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 56px 56px 56px', padding:'0 8px 10px 10px', alignItems:'center'}}>
              <div style={{fontSize:'13px'}}><div>{m.home}</div><div style={{color:'#bbb'}}>{m.away}</div></div>
              {m.odds.map((o,i)=>{ const sel=bets.find(b=>b.id===m.id+"-"+i); return <button key={i} onClick={()=>addBet(m,i)} style={{background: sel?'#e20000':'#3e3e3e', color: sel?'white':'#ffeb3b', border:'none', padding:'12px 0', margin:'2px', borderRadius:'3px', fontWeight:'bold'}}>{o}</button>})}
            </div>
          </div>
        ))}
      </>}

      {tab==="openBets" && <div style={{padding:'12px'}}>{!user? <div style={{textAlign:'center', marginTop:'50px'}}><p>Please login to see your bets</p><button onClick={()=>{setAuthMode("login"); setShowAuth(true);}} style={{background:'#e20000', color:'white', padding:'10px 20px', border:'none', borderRadius:'6px'}}>Login</button></div> : userTickets.length===0? <div style={{textAlign:'center', color:'#666', marginTop:'60px'}}>No open bets</div> : userTickets.map(t=><div key={t.id} style={{background:'#2a2a2a', padding:'12px', borderRadius:'8px', marginBottom:'10px'}}><div style={{fontSize:'11px', color:'#aaa'}}>{t.date} • {t.status}</div>{t.bets.map((b,i)=><div key={i} style={{fontSize:'12px', marginTop:'5px'}}>{b.game} <b style={{color:'#ffeb3b'}}>{b.type}@{b.odd}</b></div>)}<div style={{marginTop:'8px', fontSize:'12px'}}>Stake GHS {t.stake} • Win GHS {t.potentialWin}</div></div>)}</div>}

      {tab==="me" && <div style={{padding:'20px'}}>{!user? <div style={{textAlign:'center'}}><h3>Welcome to BetX Ghana</h3><button onClick={()=>{setAuthMode("register"); setShowAuth(true);}} style={{background:'#e20000', color:'white', padding:'12px 30px', border:'none', borderRadius:'6px', marginTop:'10px'}}>Register Now</button></div> : <div style={{background:'#2a2a2a', padding:'20px', borderRadius:'12px', textAlign:'center'}}><div style={{fontSize:'14px', color:'#aaa'}}>Hi, {user.name}</div><div style={{fontSize:'12px', color:'#aaa'}}>{user.phone}</div><div style={{fontSize:'32px', fontWeight:'bold', color:'#ffeb3b', marginTop:'10px'}}>GHS {user.balance.toFixed(2)}</div><a href={`https://wa.me/${WHATSAPP}?text=Deposit ${user.phone}`} style={{display:'block', background:'#00c853', color:'white', padding:'14px', borderRadius:'8px', marginTop:'15px', textDecoration:'none', fontWeight:'bold'}}>Deposit via MoMo</a><button onClick={logout} style={{width:'100%', marginTop:'10px', background:'#333', color:'white', padding:'12px', border:'none', borderRadius:'8px'}}>Logout</button></div>}</div>}

      {bets.length>0 && tab==="sports" && (
        <div style={{position:'fixed', bottom:'56px', left:0, right:0, background:'#1e1e1e', borderTop:'3px solid #e20000', padding:'10px', zIndex:20}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>{bets.length} bets @ {totalOdds.toFixed(2)}</span><span onClick={()=>setBets([])} style={{color:'#e20000'}}>Clear</span></div>
          <div style={{display:'flex', gap:'10px', marginTop:'8px', alignItems:'center'}}><input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} style={{width:'60px', background:'#000', border:'1px solid #333', color:'white', padding:'8px', borderRadius:'4px'}}/><span style={{flex:1, fontSize:'12px'}}>Win <b style={{color:'#ffeb3b'}}>GHS {(totalOdds*stake).toFixed(2)}</b></span><button onClick={placeBet} style={{background:'#e20000', color:'white', border:'none', padding:'10px 18px', borderRadius:'4px', fontWeight:'bold'}}>Place Bet</button></div>
        </div>
      )}

      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#111', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', textAlign:'center', padding:'8px 0', borderTop:'1px solid #222', zIndex:25}}>
        <div onClick={()=>setTab("sports")} style={{color:tab==="sports"?'#e20000':'#777', fontSize:'10px'}}><div style={{fontSize:'18px'}}>⚽</div>Home</div>
        <div onClick={()=>setTab("openBets")} style={{color:tab==="openBets"?'#e20000':'#777', fontSize:'10px'}}><div style={{fontSize:'18px'}}>🧾</div>Open Bets</div>
        <div onClick={()=>setTab("me")} style={{color:tab==="me"?'#e20000':'#777', fontSize:'10px'}}><div style={{fontSize:'18px'}}>👤</div>{user? user.name.split(' ')[0] : "Me"}</div>
      </div>
    </div>
  )
}
