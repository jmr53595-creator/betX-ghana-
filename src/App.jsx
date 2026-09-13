import React, { useState } from 'react';
import { Wallet, Trophy, Settings, Users, MessageCircle, Share2 } from 'lucide-react';

const App = () => {
  const [balance, setBalance] = useState(250);
  const [bets, setBets] = useState([]);
  const [stake, setStake] = useState(10);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [depositAmount, setDepositAmount] = useState(50);

  // YOUR WHATSAPP NUMBER - 0504877566
  const YOUR_WHATSAPP = "233504877566";

  const [matches] = useState([
    { id: 1, league: 'Premier League', home: 'Man City', away: 'Arsenal', odds: { home: 2.10, draw: 3.40, away: 3.20 }, time: 'Live 67\'' },
    { id: 2, league: 'Ghana PL', home: 'Hearts of Oak', away: 'Kotoko', odds: { home: 2.20, draw: 3.10, away: 3.00 }, time: '15:00' },
  ]);

  const placeBet = (match, choice) => {
    if(balance < stake) { setShowDeposit(true); return; }
    const odd = choice === 'home'? match.odds.home : choice === 'draw'? match.odds.draw : match.odds.away;
    const newBet = { id: Date.now(), match: `${match.home} vs ${match.away}`, choice, odd, stake, potential: (stake*odd).toFixed(2), status: 'pending' };
    setBets([newBet,...bets]);
    setBalance(b => b - stake);
  };

  const shareBetToWhatsApp = (bet) => {
    const text = `*BetX Ghana* 🎯\nMatch: ${bet.match}\nPick: ${bet.choice} @ ${bet.odd}\nStake: GH₵${bet.stake}\nTo Win: GH₵${bet.potential}\n\nBet on https://betx-ghana.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const contactSupport = () => {
    window.open(`https://wa.me/${YOUR_WHATSAPP}?text=Hello BetX, I need help with my account. Balance GH₵${balance}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 sticky top-0 z-40">
        <h1 className="font-bold text-green-400">BetX Ghana</h1>
        <div className="flex gap-2 items-center">
          <button onClick={() => setIsAdmin(!isAdmin)} className="text-xs bg-slate-800 px-2 py-1 rounded-full">Admin</button>
          <div className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold">GH₵ {balance.toFixed(2)}</div>
          <button onClick={() => setShowDeposit(true)} className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">Deposit</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white p-3 rounded-xl flex justify-between items-center">
            <span className="text-sm">Stake GH₵ <input type="number" value={stake} onChange={e=>setStake(Number(e.target.value))} className="w-16 border rounded ml-2 p-1" /></span>
            <button onClick={contactSupport} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full flex items-center gap-1"><MessageCircle size={14}/> Support</button>
          </div>
          {matches.map(m => (
            <div key={m.id} className="bg-white p-4 rounded-xl border">
              <p className="font-bold mb-3">{m.home} vs {m.away} - {m.time}</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={()=>placeBet(m,'home')} className="border-2 p-2.5 rounded-lg hover:border-green-600 font-bold">1 - {m.odds.home}</button>
                <button onClick={()=>placeBet(m,'draw')} className="border-2 p-2.5 rounded-lg hover:border-green-600 font-bold">X - {m.odds.draw}</button>
                <button onClick={()=>placeBet(m,'away')} className="border-2 p-2.5 rounded-lg hover:border-green-600 font-bold">2 - {m.odds.away}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl h-fit">
          <h3 className="font-bold flex gap-2"><Trophy size={18}/> My Bets</h3>
          {bets.length===0? <p className="text-sm text-slate-400 py-6 text-center">No bets yet</p> :
            bets.map(b=>(
              <div key={b.id} className="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
                <p className="font-medium">{b.match}</p>
                <p className="text-xs">GH₵{b.stake} @ {b.odd} → GH₵{b.potential}</p>
                <button onClick={()=>shareBetToWhatsApp(b)} className="mt-2 w-full bg-green-500 text-white py-1.5 rounded-full text-xs flex justify-center items-center gap-1"><Share2 size={12}/> Share to WhatsApp</button>
              </div>
            ))
          }
          <button onClick={contactSupport} className="w-full mt-4 border-2 border-green-500 text-green-600 py-2 rounded-lg font-bold flex justify-center gap-2"><MessageCircle size={18}/> Chat on WhatsApp</button>
        </div>
      </div>

      {/* FLOATING WHATSAPP BUTTON - 0504877566 */}
      <a href={`https://wa.me/${YOUR_WHATSAPP}?text=Hi BetX Ghana, I want to bet`} target="_blank" className="fixed bottom-6 right-6 bg-green-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 z-50">
        <MessageCircle size={28} fill="white" />
      </a>

      {showDeposit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h3 className="font-bold mb-4">Deposit MoMo</h3>
            <form onSubmit
