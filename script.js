const RESET_INTERVAL = 0.8 * 60 * 1000;
let musicStarted = false;
const BONUS_AMOUNT = 50;
const MAX_BALANCE = 10000;
let balance = 50;
let autoPlay = false;
let autoPlayInterval;
let bet = 50;
let isSpinning = false;
let resetTimeout = null;

const alavanca = document.getElementById("alavanca");
let dragging = false;
let startY = 0;

alavanca.addEventListener("mousedown", (e) => {
  dragging = true;
  startY = e.clientY;
  alavanca.style.cursor = "grabbing";
});
document.addEventListener("mousemove", (e) => {
  if (!dragging) return;

  let moveY = e.clientY - startY;
  if (moveY > 0 && moveY < 120) {
    alavanca.style.top = `${moveY}px`;
  }
});
document.addEventListener("mouseup", (e) => {
  if (!dragging) return;
  dragging = false;
  alavanca.style.cursor = "grab";

  const pulledEnough = parseInt(alavanca.style.top) > 60;

  if (pulledEnough) {
    document.getElementById("lever").click();
  }

  alavanca.style.top = "10px";
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    document.getElementById("lever").click();
  }
});

function toggleAutoPlay() {
  autoPlay = !autoPlay;

  if (autoPlay) {
    document.getElementById("result").textContent = "🎰 AutoPlay ativado!";
    autoPlayInterval = setInterval(() => {
      if (!isSpinning && balance >= bet) {
        const lever = document.querySelector('.lever');
        lever.classList.add('active');
        setTimeout(() => lever.classList.remove('active'), 500);
        spin();
      } else if (balance < bet) {
        clearInterval(autoPlayInterval);
        autoPlay = false;
        document.getElementById("result").textContent = "⛔ Saldo insuficiente, desativado.";
      }
    }, 4500);
  } else {
    clearInterval(autoPlayInterval);
    document.getElementById("result").textContent = "🛑 AutoPlay desativado.";
  }
}

function toggleMute() {
  const sounds = [...spinSounds, winSound];
  const anyMuted = sounds.some(sound => !sound.muted);
  sounds.forEach(sound => sound.muted = anyMuted);

  const btn = document.getElementById('muteBtn');
  btn.textContent = anyMuted ? '🔇' : '🔈';
}

const symbols = [
  '💎', '💎', '💎', '7️⃣', '7️⃣', '7️⃣', '💰', '💰', '💰', '🍀', '🍀', '🍀', '🍒', '🍒', '🍒'
];

const spinSounds = [
  document.getElementById('spinSound1'),
  document.getElementById('spinSound2')
];
const winSound = document.getElementById('winSound');

[...spinSounds, winSound].forEach(sound => sound.muted = true);

const mutedBtn = document.getElementById('mutedBtn');
if (mutedBtn) mutedBtn.textContent = '🔇';

function saveBalance() {
  const playerName = localStorage.getItem('dm_playerName') || 'Você';

  const data = {
    name: playerName,
    balance: balance,
    lastSaved: Date.now(),
    totalPoints: parseInt(localStorage.getItem('dm_totalPoints') || '0', 10),
    recoveryTimestamp: localStorage.getItem('dm_recoveryTimestamp') || null
  };

  localStorage.setItem('dm_gameData', JSON.stringify(data));
  localStorage.setItem('dm_balance', balance);
  localStorage.setItem('dm_lastTime', Date.now());
}

function updateUI() {
  document.getElementById('coins').textContent = balance;
}

function loadBalance() {
  const saved = localStorage.getItem('dm_gameData');
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  if (saved) {
    const data = JSON.parse(saved);
    if (now - data.lastSaved <= THIRTY_DAYS) {
      balance = data.balance ?? 100;
      localStorage.setItem('dm_playerName', data.name ?? 'Você');
      localStorage.setItem('dm_totalPoints', data.totalPoints ?? '0');
      localStorage.setItem('dm_recoveryTimestamp', data.recoveryTimestamp ?? '');
    } else {
      balance = 100;
      localStorage.setItem('dm_totalPoints', '0');
    }
  } else {
    balance = 100;
    localStorage.setItem('dm_totalPoints', '0');
  }

  updateUI();

  setInterval(() => {
    const lastTime = parseInt(localStorage.getItem('dm_lastTime') || "0", 10);
    const now = Date.now();

    if (now - lastTime >= RESET_INTERVAL) {
      if (balance < MAX_BALANCE) {
        balance = Math.min(balance + BONUS_AMOUNT, MAX_BALANCE);
        updateUI();
        saveBalance();
        document.getElementById('result').textContent = `🎁 +${BONUS_AMOUNT}R$, Continue estar perto!`;
      }
      localStorage.setItem('dm_lastTime', now.toString());
    }
  }, 10000);
}

function saveBalance() {
  const data = {
    balance,
    name: localStorage.getItem('dm_playerName') || 'Você',
    totalPoints: localStorage.getItem('dm_totalPoints') || '0',
    lastSaved: Date.now(),
    recoveryTimestamp: localStorage.getItem('dm_recoveryTimestamp') || ''
  };
  localStorage.setItem('dm_gameData', JSON.stringify(data));
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

  const [s1, s2, s3] = reelCenters;
  const allEqual = s1 === s2 && s2 === s3;

  const symbolData = {
    "🍒": { multiplier: 2, chanceBoost: 0.9 },
    "💰": { multiplier: 3, chanceBoost: 0.8 },
    "7️⃣": { multiplier: 5, chanceBoost: 0.6 },
    "🍀": { multiplier: 8, chanceBoost: 0.4 },
    "💎": { multiplier: 12, chanceBoost: 0.2 },
  };

  const currentSymbol = s1;
  const symbolInfo = symbolData[currentSymbol] || { multiplier: 2, chanceBoost: 0.5 };

  let winChance = balance <= 200 ? 0.95 : balance <= 500 ? 0.7 : balance <= 1000 ? 0.5 : 0.3;
  winChance *= symbolInfo.chanceBoost;

  if (allEqual && Math.random() < winChance) {
    const bonus = Math.floor(Math.random() * (bet / 2));
    const winAmount = bet * symbolInfo.multiplier + bonus;

    balance += winAmount;
    document.getElementById('coins').textContent = balance;
    document.getElementById('result').innerHTML = `
      <span style="color: gold; font-weight: bold;">
        🎉 ${currentSymbol.repeat(3)} Parabéns! Você ganhou <b>${winAmount}</b>R$!
      </span>
    `;
    winSound.play();
    launchConfetti();

  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    document.getElementById('result').innerHTML = `
      🔄 Quase!. Continue tentando!
    `;
  } else {
    document.getElementById('result').textContent = '💤 Tente novamente...';
  }

  if (balance < 49) {
    balance = 50;
    document.getElementById('coins').textContent = balance;
    document.getElementById('result').textContent = "💰 Vamos, você consegue!. +50R$!";
  }

  saveBalance();
}

function betLow() {
  if (isSpinning) return;
  bet = 50;
  document.getElementById('result').textContent = 'Aposta baixa, selecionada 50R$';
}

function betMax() {
  if (isSpinning) return;
  bet = 100;
  document.getElementById('result').textContent = 'Aposta máxima, selecionada 100R$';
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

function playSlotMachine() {
  function updateBalanceDisplay() {
    document.getElementById("balance").textContent = `Saldo: $${balance}`;
  }

  function checkAutoReset() {
    if (balance < 49) {
      balance = 0;
      updateBalanceDisplay();
      document.getElementById("result").textContent = "Saldo zerado!";
    }
  }
  balance -= 50;
  updateBalanceDisplay();
  checkAutoReset();
}

['reel1', 'reel2', 'reel3'].forEach(createReelContent);
loadBalance();
document.getElementById('result').textContent = 'Aposta baixa, selecionada 50R$';
