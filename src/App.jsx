
import React from 'react';

export default function App() {
  const whatsappNumber = "233504877566";
  const message = "Hello BetX Ghana, I want to place a bet";

  return (
    <div style={{fontFamily:'Arial', background:'#0a0a0a', color:'white', minHeight:'100vh'}}>
      <header style={{padding:'20px', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{color:'#22c55e', margin:0}}>BetX Ghana 🇬🇭</h1>
        <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`} target="_blank" style={{background:'#22c55e', color:'black', padding:'10px 20px', borderRadius:'20px', textDecoration:'none', fontWeight:'bold'}}>Chat Us</a>
      </header>

      <main style={{padding:'40px 20px', textAlign:'center'}}>
        <h2 style={{fontSize:'32px'}}>Win Big with BetX Ghana</h2>
        <p style={{color:'#aaa', maxWidth:'600px', margin:'20px auto'}}>Best odds in Ghana. Instant payout via Mobile Money. Contact us on WhatsApp to place your bet now!</p>
        
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', maxWidth:'900px', margin:'40px auto'}}>
          <div style={{background:'#1a1a1a', padding:'20px', borderRadius:'12px'}}><h3>⚽ Football</h3><p>High odds on all leagues</p></div>
          <div style={{background:'#1a1a1a', padding:'20px', borderRadius:'12px'}}><h3>🏀 Basketball</h3><p>Live betting available</p></div>
          <div style={{background:'#1a1a1a', padding:'20px', borderRadius:'12px'}}><h3>🎰 Virtuals</h3><p>24/7 instant games</p></div>
        </div>

        <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`} target="_blank" style={{display:'inline-block', marginTop:'30px', background:'#25D366', color:'white', padding:'15px 30px', borderRadius:'30px', textDecoration:'none', fontWeight:'bold', fontSize:'18px'}}>Place Bet on WhatsApp - 0504877566</a>
      </main>

      {/* Floating WhatsApp Button */}
      <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`} target="_blank" style={{position:'fixed', bottom:'20px', right:'20px', background:'#25D366', width:'60px', height:'60px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px', textDecoration:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.3)'}}>💬</a>
    </div>
  );
}
