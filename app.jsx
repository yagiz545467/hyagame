const { useState, useEffect } = React;

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const App = () => {
  const [screen, setScreen] = useState('start');
  const [mode, setMode] = useState('single');
  const [players, setPlayers] = useState({ p1: 'Oyuncu 1', p2: 'Oyuncu 2' });
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [currentTurn, setCurrentTurn] = useState('p1');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showCorrect, setShowCorrect] = useState(false);

  useEffect(() => {
    if (window.sorular) {
      setQuestions(shuffleArray([...window.sorular]).slice(0, 10)); // Toplam 10 soru
    }
  }, []);

  useEffect(() => {
    let timer;
    if (screen === 'game' && !selectedAnswer && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (screen === 'game' && timeLeft === 0 && !selectedAnswer) {
      handleTimeOut();
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft, selectedAnswer]);

  const handleTimeOut = () => {
    setSelectedAnswer('timeout');
    setShowCorrect(true);
    setTimeout(nextQuestion, 2000);
  };

  const startGameMulti = (e) => {
    e.preventDefault();
    setMode('multi');
    setScores({p1: 0, p2: 0});
    setCurrentTurn('p1');
    setCurrentQIndex(0);
    setTimeLeft(15);
    setScreen('game');
  };

  const startGameSingle = () => {
    setMode('single');
    setScores({p1: 0, p2: 0});
    setCurrentTurn('p1');
    setCurrentQIndex(0);
    setTimeLeft(15);
    setScreen('game');
  };

  const handleAnswer = (key) => {
    if(selectedAnswer) return;
    setSelectedAnswer(key);
    setShowCorrect(true);

    const question = questions[currentQIndex];
    if (key === question.cevap) {
      const points = timeLeft * 10;
      setScores(prev => ({
        ...prev,
        [currentTurn]: prev[currentTurn] + points
      }));
    }

    setTimeout(nextQuestion, 2000);
  };

  const nextQuestion = () => {
    setShowCorrect(false);
    setSelectedAnswer(null);
    setTimeLeft(15);

    if (currentQIndex + 1 >= questions.length) {
      setScreen('result');
    } else {
      setCurrentQIndex(prev => prev + 1);
      if (mode === 'multi') {
        setCurrentTurn(prev => prev === 'p1' ? 'p2' : 'p1');
      }
    }
  };

  if (screen === 'start') {
    return (
      <div className="app-container">
        <h1>HYA GAME</h1>
        <button className="btn" onClick={startGameSingle}>Tek Oyuncu</button>
        <button className="btn" style={{background: 'linear-gradient(135deg, #db2777, #e11d48)'}} onClick={() => setScreen('names')}>İki Oyuncu (Kapışma)</button>
      </div>
    );
  }

  if (screen === 'names') {
    return (
      <div className="app-container">
        <h2>Oyuncular</h2>
        <form onSubmit={startGameMulti} style={{marginTop: '2rem'}}>
          <div className="input-group">
            <label>1. Oyuncu Adı</label>
            <input required value={players.p1} onChange={e=>setPlayers({...players, p1: e.target.value})} maxLength={15} />
          </div>
          <div className="input-group">
            <label>2. Oyuncu Adı</label>
            <input required value={players.p2} onChange={e=>setPlayers({...players, p2: e.target.value})} maxLength={15} />
          </div>
          <button className="btn" type="submit">Savaşı Başlat! 🚀</button>
          <button type="button" className="btn" style={{background:'transparent', border:'1px solid #334155'}} onClick={()=>setScreen('start')}>Geri Dön</button>
        </form>
      </div>
    );
  }

  if (screen === 'game') {
    const q = questions[currentQIndex];
    const currentPlayerName = mode === 'multi' ? (currentTurn === 'p1' ? players.p1 : players.p2) : 'Senin Sıran';
    const isPlayer1Turn = currentTurn === 'p1';

    return (
      <div className="app-container">
        <div className="game-header">
          <div className="turn-badge" style={mode === 'multi' && !isPlayer1Turn ? {background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444'} : {}}>
            Sıra: {currentPlayerName}
          </div>
          <div className="timer">⏱ {timeLeft}s</div>
        </div>
        
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem', fontSize:'0.9rem', color:'#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600}}>
          <span>Soru {currentQIndex + 1}/{questions.length}</span>
          <span>{q.kategori} - {q.zorluk}</span>
        </div>

        <div className="question">{q.soru}</div>

        <div className="options">
          {Object.entries(q.siklar).map(([key, value]) => {
            let className = "option-btn";
            if (showCorrect) {
              if (key === q.cevap) className += " correct";
              else if (key === selectedAnswer) className += " wrong";
            }
            return (
              <button 
                key={key} 
                className={className}
                onClick={() => handleAnswer(key)}
                disabled={selectedAnswer !== null}
              >
                <strong style={{marginRight: '0.5rem', color: '#94a3b8'}}>{key})</strong> {value}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    let winner = null;
    if (mode === 'multi') {
      if (scores.p1 > scores.p2) winner = players.p1;
      else if (scores.p2 > scores.p1) winner = players.p2;
      else winner = "Berabere";
    }

    return (
      <div className="app-container">
        <h1 style={{fontSize:'2.5rem', marginBottom:'1.5rem', animation: 'none'}}>Oyun Bitti!</h1>
        
        {mode === 'multi' && (
          <div className="winner-text">
            {winner === 'Berabere' ? 'Berabere Kaldınız! 🤝' : `🏆 Kazanan: ${winner} 🏆`}
          </div>
        )}

        {mode === 'single' && (
          <div className="winner-text" style={{color: '#38bdf8'}}>
            Tebrikler! 🎉
          </div>
        )}

        <div className="result-card">
          <h3 style={{marginBottom:'0.5rem', color: '#94a3b8'}}>{mode === 'multi' ? players.p1 : 'Toplam Puanın'}</h3>
          <div style={{fontSize:'2.5rem', fontWeight:900, color:'#38bdf8'}}>{scores.p1}</div>
        </div>

        {mode === 'multi' && (
          <div className="result-card">
            <h3 style={{marginBottom:'0.5rem', color: '#94a3b8'}}>{players.p2}</h3>
            <div style={{fontSize:'2.5rem', fontWeight:900, color:'#f43f5e'}}>{scores.p2}</div>
          </div>
        )}

        <button className="btn" style={{marginTop:'2rem'}} onClick={() => {
          setQuestions(shuffleArray([...window.sorular]).slice(0, 10));
          setScreen('start');
        }}>Ana Menüye Dön</button>
      </div>
    );
  }

  return null;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
