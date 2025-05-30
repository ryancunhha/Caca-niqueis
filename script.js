// Define tempo limite para resetar saldo (3 minutos em ms)
const RESET_INTERVAL = 3 * 60 * 1000;
let musicStarted = false;

function startBackgroundMusic() {
  if (musicStarted) return;

  const bgMusic = document.getElementById('bgMusic');
  bgMusic.volume = 0.15;

  const playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      musicStarted = true;
      console.log('Música de fundo iniciada!');
    }).catch(err => {
      console.warn('Falha ao iniciar música. Provavelmente o navegador bloqueou o autoplay.', err);
    });
  }
}


const symbols = [
  '💎', '7️⃣', '7️⃣', '💰', '💰', '💰',
  '🪙', '🪙', '🪙', '🪙', '🔶', '🔶', '🔶', '🔶', '🔶'
];

const payoutMultipliers = {
  '💎': 10,
  '7️⃣': 8,
  '💰': 5,
  '🪙': 4,
  '🔶': 3
};

let balance;
let bet = 50;
let isSpinning = false;
let resetTimeout = null;

// Sons
const spinSounds = [
  document.getElementById('spinSound1'),
  document.getElementById('spinSound2')
];
const winSound = document.getElementById('winSound');
const bgMusic = document.getElementById('bgMusic');

bgMusic.volume = 0.15;
bgMusic.play().catch(() => { });

function saveBalance() {
  localStorage.setItem('dm_balance', balance);
  localStorage.setItem('dm_lastTime', Date.now());
}

function loadBalance() {
  const savedBalance = localStorage.getItem('dm_balance');
  const lastTime = localStorage.getItem('dm_lastTime');

  if (savedBalance && lastTime) {
    const now = Date.now();
    if (now - parseInt(lastTime, 10) > RESET_INTERVAL) {
      balance = 1000;
      saveBalance();
      alert('Você recebeu um bônus de 1000 fichas por tempo ocioso!');
    } else {
      balance = parseInt(savedBalance, 10);
    }
  } else {
    balance = 1000;
    saveBalance();
  }

  document.getElementById('coins').textContent = balance;
}

function createReelContent(reelId) {
  const reel = document.getElementById(reelId);
  reel.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'symbols';

  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.style.height = '140px';
    s.style.display = 'flex';
    s.style.justifyContent = 'center';
    s.style.alignItems = 'center';
    s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    container.appendChild(s);
  }

  reel.appendChild(container);
}

function pullLeverAndSpin() {
  if (isSpinning) return;
  isSpinning = true;

  // Toca a música no primeiro clique
  startBackgroundMusic();

  const lever = document.querySelector('.lever');
  lever.classList.add('active');
  setTimeout(() => lever.classList.remove('active'), 500);

  spin();
}

function spin() {
  if (balance < bet) {
    document.getElementById('result').textContent = 'Saldo insuficiente!';
    isSpinning = false;
    return;
  }

  balance -= bet;
  document.getElementById('coins').textContent = balance;
  document.getElementById('result').textContent = 'Girando...';
  saveBalance();

  // Toca som aleatório do spin
  const chosenSpinSound = spinSounds[Math.floor(Math.random() * spinSounds.length)];
  try {
    chosenSpinSound.pause();
    chosenSpinSound.currentTime = 0;
    chosenSpinSound.play().catch(e => console.warn('Erro ao tocar som:', e));
  } catch (err) {
    console.error('Erro ao iniciar som:', err);
  }

  const reels = ['reel1', 'reel2', 'reel3'];
  reels.forEach((id) => {
    createReelContent(id);
    const container = document.querySelector(`#${id} .symbols`);
    if (container) {
      container.style.animation = `scroll-down 1.5s linear infinite`;
      container.style.top = '0';
    }
  });

  setTimeout(() => stopReel('reel1'), 2425);
  setTimeout(() => stopReel('reel2'), 3200);
  setTimeout(() => stopReel('reel3'), 3800);
}

function stopReel(id) {
  const container = document.querySelector(`#${id} .symbols`);
  if (!container) return;

  container.style.animation = 'none';
  const finalIndex = Math.floor(Math.random() * 20);
  const clampedIndex = Math.min(container.children.length - 1, finalIndex);
  container.style.top = `-${clampedIndex * 140}px`;

  if (id === 'reel3') {
    setTimeout(() => {
      checkWin();
      setTimeout(() => {
        isSpinning = false;
      }, 200);
    }, 300);
  }
}

function checkWin() {
  const reelCenters = [1, 2, 3].map(i => {
    const container = document.querySelector(`#reel${i} .symbols`);
    if (!container) return null;
    let topPx = parseFloat(container.style.top) || 0;
    let idx = Math.round(-topPx / 140);
    const safeIdx = Math.min(container.children.length - 1, Math.max(0, idx));
    return container.children[safeIdx]?.textContent || null;
  });

  if (reelCenters.some(s => s === null)) return;

  const allEqual = reelCenters[0] === reelCenters[1] && reelCenters[1] === reelCenters[2];
  const symbol = reelCenters[0];

  let winChance = balance <= 200 ? 0.95 : balance <= 500 ? 0.7 : balance <= 1000 ? 0.5 : 0.3;
  if (allEqual && symbol === '💎' && bet === 200) winChance = 1.0;

  if (allEqual && Math.random() < winChance) {
    const multiplier = payoutMultipliers[symbol] || 5;
    const winAmount = bet * multiplier + Math.floor(Math.random() * bet);
    balance += winAmount;
    document.getElementById('coins').textContent = balance;
    document.getElementById('result').innerHTML = `<span style="color: gold; font-weight: bold;">🎉 ${symbol}${symbol}${symbol} Você ganhou ${winAmount} fichas!</span>`;
    winSound.play();
    launchConfetti();
  } else {
    document.getElementById('result').textContent = 'Tente novamente...';
  }

  saveBalance();
}

function betLow() {
  if (isSpinning) return;
  bet = 50;
  document.getElementById('result').textContent = 'Aposta baixa selecionada (50 fichas)';
}

function betMax() {
  if (isSpinning) return;
  bet = 200;
  document.getElementById('result').textContent = 'Aposta máxima selecionada (200 fichas)';
}

function resetBalance() {
  if (isSpinning) return;
  balance = 1000;
  saveBalance();
  document.getElementById('coins').textContent = balance;
  document.getElementById('result').textContent = 'Saldo reiniciado!';
  document.getElementById('resetBtn').style.display = 'none';
  clearTimeout(resetTimeout);
  resetTimeout = null;
}

function toggleMute() {
  const sounds = [...spinSounds, winSound, bgMusic];
  const anyMuted = sounds.some(sound => !sound.muted);
  sounds.forEach(sound => sound.muted = anyMuted);

  const btn = document.getElementById('muteBtn');
  btn.textContent = anyMuted ? '🔇 Mutado' : '🔈 Som ligado';
}

const myConfetti = confetti.create(document.getElementById('confetti-canvas'), {
  resize: true,
  useWorker: true
});

function launchConfetti() {
  myConfetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.4 }
  });
}

['reel1', 'reel2', 'reel3'].forEach(createReelContent);
loadBalance();
document.getElementById('result').textContent = 'Aposta baixa selecionada (50 fichas)';
