
// Define tempo limite para resetar saldo (3 minutos em ms)
const RESET_INTERVAL = 3 * 60 * 1000; // 180000 ms

// Função para salvar saldo e timestamp
function saveBalance() {
  localStorage.setItem('dm_balance', balance);
  localStorage.setItem('dm_lastTime', Date.now());
}

// Função para carregar saldo salvo ou resetar se passou mais de 3 minutos
function loadBalance() {
  const savedBalance = localStorage.getItem('dm_balance');
  const lastTime = localStorage.getItem('dm_lastTime');

  if (savedBalance && lastTime) {
    const now = Date.now();
    if (now - lastTime > RESET_INTERVAL) {
      // Passou mais de 3 minutos, resetar saldo para 1000
      balance = 1000;
      saveBalance(); // Atualiza localStorage com novo saldo e timestamp
      alert('Você recebeu um bônus de 1000 fichas por tempo ocioso!');
    } else {
      // Menos que 3 minutos, carrega saldo salvo
      balance = parseInt(savedBalance, 10);
    }
  } else {
    // Sem saldo salvo, define saldo inicial 1000
    balance = 1000;
    saveBalance();
  }

  // Atualiza display do saldo
  document.getElementById('coins').textContent = balance;
}

const bgMusic = document.getElementById('bgMusic');
bgMusic.volume = 0.15;
bgMusic.play().catch(() => { /* autoplay pode ser bloqueado em alguns navegadores */ });

const symbols = ['💎', '💰', '🪙', '🔶', '7️⃣'];
let balance = 1000;
loadBalance();
let bet = 50;
document.getElementById('result').textContent = 'Aposta baixa selecionada (50 fichas)';
let isSpinning = false; // flag para travar rodada

// Cria 20 símbolos aleatórios para rolo
function createReelContent(reelId) {
  const reel = document.getElementById(reelId);
  reel.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'symbols';

  // 20 símbolos
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
  if (isSpinning) return; // bloqueia enquanto roda

  const lever = document.querySelector('.lever');
  lever.classList.add('active');
  setTimeout(() => {
    lever.classList.remove('active');
  }, 500);

  spin();
}

function spin() {
  if (balance < bet) {
    document.getElementById('result').textContent = 'Saldo insuficiente!';
    return;
  }

  isSpinning = true;
  balance -= bet;
  document.getElementById('coins').textContent = balance;
  document.getElementById('result').textContent = 'Girando...';
  saveBalance();

  document.getElementById('spinSound').play();

  const reels = ['reel1', 'reel2', 'reel3'];
  reels.forEach((id) => {
    createReelContent(id);
    const container = document.querySelector(`#${id} .symbols`);
    if (container) {
      container.style.animation = `scroll-down 1.5s linear infinite`;
      container.style.top = '0';
    }
  });

  // Parar rolos com delay para efeito suspense
  setTimeout(() => stopReel('reel1'), 2425);
  setTimeout(() => stopReel('reel2'), 3200);
  setTimeout(() => stopReel('reel3'), 3800);
}

function stopReel(id) {
  const container = document.querySelector(`#${id} .symbols`);
  if (!container) return;

  container.style.animation = 'none';

  // Escolher símbolo final aleatório (index de 0 a 19)
  const finalIndex = Math.floor(Math.random() * 20);
  container.style.top = `-${finalIndex * 140}px`;

  // Só verificar resultado quando último rolo parar
  if (id === 'reel3') {
    setTimeout(() => {
      checkWin();
      isSpinning = false; // libera para próxima rodada
    }, 300);
  }
}

let consecutiveWins = 0;  // contador de vitórias seguidas

function checkWin() {
  // Pega símbolo que está centralizado na linha de pagamento (índice +1 para compensar o container)
  const reelCenters = [1, 2, 3].map(i => {
    const container = document.querySelector(`#reel${i} .symbols`);
    if (!container) return null;

    let topPx = parseFloat(container.style.top) || 0;
    let idx = Math.round(-topPx / 140);
    return container.children[idx + 1]?.textContent || null;
  });

  if (reelCenters.some(s => s === null)) return;

  const jackpotSymbol = '7️⃣';
  const rareSymbol = '💎';

  // Ajustando as chances de vitória com uma aleatoriedade extra para evitar fácil demais

  // Vitória jackpot - 3 símbolos raros iguais + chance extra
  if (
    reelCenters[0] === reelCenters[1] &&
    reelCenters[1] === reelCenters[2] &&
    (reelCenters[0] === jackpotSymbol || reelCenters[0] === rareSymbol) &&
    Math.random() < 0.01  // 10% chance de realmente ganhar jackpot aqui
  ) {
    const winAmount = bet * 15 + Math.floor(Math.random() * bet * 5);
    balance += winAmount;
    consecutiveWins++;  // aumentou sequência de vitórias
    document.getElementById('coins').textContent = balance;
    document.getElementById('result').textContent = `Jackpot! Você ganhou ${winAmount} fichas! 🎉 (${consecutiveWins} vitórias seguidas)`;
    document.getElementById('winSound').play();

    document.getElementById('result').textContent = `Jackpot! Você ganhou ${winAmount} fichas! 🎉 (${consecutiveWins} vitórias seguidas)`;
    launchConfetti();

    if (consecutiveWins >= 3) {
      // Bônus especial para 3 vitórias seguidas
      const bonus = 500;
      balance += bonus;
      document.getElementById('coins').textContent = balance;
      alert(`🎉 Parabéns! 3 vitórias seguidas! Bônus de ${bonus} fichas creditado!`);
      consecutiveWins = 0; // reseta após o bônus
    }
    return;
  }

  // Vitória menor - 2 símbolos raros iguais + chance extra
  const pairs = [
    [reelCenters[0], reelCenters[1]],
    [reelCenters[1], reelCenters[2]],
    [reelCenters[0], reelCenters[2]],
  ];

  const hasPair = pairs.some(
    ([a, b]) =>
      a === b &&
      (a === jackpotSymbol || a === rareSymbol) &&
      Math.random() < 0.6 // 60% chance de ganhar
  );

  if (hasPair) {
    const winAmount = bet * 3 + Math.floor(Math.random() * bet);
    balance += winAmount;
    consecutiveWins++;  // aumenta sequência
    document.getElementById('coins').textContent = balance;
    document.getElementById('result').textContent = `Você ganhou ${winAmount} fichas! ✨ (${consecutiveWins} vitórias seguidas)`;
    document.getElementById('winSound').play();

    if (consecutiveWins >= 3) {
      // Bônus especial para 3 vitórias seguidas
      const bonus = 200;
      balance += bonus;
      document.getElementById('coins').textContent = balance;
      alert(`🎉 Parabéns! 3 vitórias seguidas! Bônus de ${bonus} fichas creditado!`);
      consecutiveWins = 0;
    }
    return;
  }

  // Caso de derrota — resetar contador
  consecutiveWins = 0;
  document.getElementById('result').textContent = 'Tente novamente...';
}

function betLow() {
  bet = 50;
  document.getElementById('result').textContent = 'Aposta baixa selecionada (50 fichas)';
}

function betMax() {
  bet = 200;
  document.getElementById('result').textContent = 'Aposta máxima selecionada (200 fichas)';
}

// Inicializar os rolos
['reel1', 'reel2', 'reel3'].forEach(createReelContent);

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

function resetBalance() {
  balance = 1000;
  saveBalance();
  document.getElementById('coins').textContent = balance;
  document.getElementById('result').textContent = 'Saldo reiniciado para 1000 fichas!';
}

function toggleMute() {
  const sounds = [
    document.getElementById('spinSound'),
    document.getElementById('winSound'),
    document.getElementById('bgMusic')
  ];

  const anyMuted = sounds.some(sound => sound.muted === false); // Verifica se algum está tocando

  sounds.forEach(sound => sound.muted = anyMuted); // Se algum não está mutado, muta todos. Se todos mutados, desmuta todos.

  const btn = document.getElementById('muteBtn');
  btn.textContent = anyMuted ? '🔇 Mutado' : '🔈 Som ligado';
}
