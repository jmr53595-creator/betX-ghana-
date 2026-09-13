

import React, { useState, useEffect } from 'react';

const WA = "233504877566";
const SPORTS = ["Football","Basketball","Tennis","Volleyball","Hockey","Handball","Esports","Virtuals"];

const MOCK_MATCHES = [
  { id:1, league:"Premier League", comp:"England", home:"Coventry City", away:"QPR", time:"12:00", live:true, minute:"HT", score:"0-0", status:"LIVE", markets:{ main:{ "1":1.32, "X":4.80, "2":12.0 }, goals:{ "Over 1.5":1.25, "Under 1.5":3.8, "Over 2.5":1.85, "Under 2.5":1.9, "BTTS Yes":1.75, "BTTS No":2.05 }, dc:{ "1X":1.05, "12":1.18, "X2":3.2 }, handicap:{ "Home -1":2.1, "Away +1":1.7 }, next:{ "Home Next":1.5, "No Goal":8.0, "Away Next":4.5 } } },
  { id:2, league:"Premier League", comp:"England", home:"Man Utd", away:"Man City", time:"15:00", live:false, minute:"", score:"vs", status:"", markets:{ main:{ "1":2.40, "X":3.87, "2":2.27 }, goals:{ "Over 1.5":1.16, "Under 1.5":4.5, "Over 2.5":1.55, "Under 2.5":2.3 }, dc:{ "1X":1.45, "12":1.20, "X2":1.35 } } },
  { id:3, league:"LaLiga", comp:"Spain", home:"Levante", away:"Barcelona", time:"20:00", live:false, minute:"", score:"vs", status:"", markets:{ main:{ "1":13.55, "X":9.05, "2":1.20 }, goals:{ "Over 2.5":1.32, "Under 2.5":3.1 } } },
  { id:4, league:"Ghana Premier", comp:"Ghana", home:"Hearts of Oak", away:"Kotoko", time:"15:00", live:false, minute:"", score:"vs", status:"", markets:{ main:{ "1":2.10, "X":3.10, "2":2.90 } } },
  { id:5, league:"Serie A", comp:"Italy", home:"Inter", away:"AC Milan", time:"18:30", live:true, minute:"67'", score:"1-1", status:"LIVE", markets:{ main:{ "1":2.15, "X":3.30, "2":3.25 } } },
];

export default function App(){
  const [tab, setTab] = useState("home"); // home, live, bets, promo, profile
  const [sport, setSport] = useState("Football");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [marketTab, setMarketTab] = useState("main");
  const [bets, setBets] = useState([]);
  const [stake, setStake] = useState(10);
  const [betType, setBetType] = useState("Multiple");
  const [betFilter, setBetFilter] = useState("Open");
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(()=>{ const s=localStorage.getItem('sb_user'); return s? JSON.parse(s): {name:"popki", phone:"0504877566", bal:0.95, logged:true} });
  const [tickets, setTickets] = useState(()=>{ const s=localStorage.getItem('sb_tickets'); return s? JSON.parse(s): [] });
  const [search, setSearch] = useState("");

  useEffect(()=>{ localStorage.setItem('sb_user', JSON.stringify(user)); },[user]);
  useEffect(()=>{ localStorage.setItem('sb_tickets', JSON.stringify(tickets)); },[tickets]);

  const totalOdds = bets.reduce((a,b)=>a*b.odd,1) || 0;
  const addBet = (match, market, sel, odd) => {
    const id = `${match.id}-${market}-${sel}`;
    if(bets.find(b=>b.id===id)) setBets(bets.filter(b=>b.id!==id));
    else setBets([...bets, {id, matchId:match.id, game:`${match.home} vs ${match.away}`, league:match.league, market, sel, odd}]);
  };
  const placeBet = () => {
    if(bets.length===0) return;
    if(stake>user.bal) return alert("Insufficient balance. Add Demo Funds in Wallet");
    const t = {id:`SB${Date.now().toString().slice(-6)}`, date:new Date().toLocaleString(), stake, odds:totalOdds.toFixed(2), win:(totalOdds*stake).toFixed(2), status:"Open", picks:[...bets], cashout:(stake*0.85).toFixed(2)};
    setTickets([t,...tickets]); setUser({...user, bal:+(user.bal-stake).toFixed(2)}); setBets([]); setTab("bets
