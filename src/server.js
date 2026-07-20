const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const GameEngine = require('./GameEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Phục vụ giao diện tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, '../public')));

// Khởi tạo Engine logic Authoritative với cả board.json và cards.json
const boardPath = path.join(__dirname, '../data/board.json');
const cardsPath = path.join(__dirname, '../data/cards.json');
const engine = new GameEngine(boardPath, cardsPath);

// Trạng thái phiên chơi máy chủ
let gameStatus = 'waiting'; // 'waiting' | 'started'
let currentTurnIndex = 0;
let hasRolledThisTurn = false;

/**
 * Lấy ID người chơi đang giữ lượt hiện tại
 */
function getCurrentTurnPlayerId() {
  if (gameStatus !== 'started' || !engine.players[currentTurnIndex]) return null;
  return engine.players[currentTurnIndex].id;
}

/**
 * Gửi toàn bộ trạng thái ván chơi mới nhất cho tất cả client
 */
function broadcastState() {
  io.emit('state_update', {
    status: gameStatus,
    players: engine.players,
    properties: engine.properties,
    board: engine.board,
    currentTurnPlayerId: getCurrentTurnPlayerId(),
    hasRolledThisTurn
  });
}

/**
 * Phát sự kiện log/nhật ký ván chơi bằng tiếng Việt đến tất cả client
 */
function broadcastTurnEvent(text, type = 'info', extraData = {}) {
  const payload = {
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    text,
    type,
    ...extraData
  };
  io.emit('turn_event', payload);
}

/**
 * Vòng lặp xử lý lượt đi tự động của Bot AI (Auto-play loop) trên Authoritative Server
 */
let botTurnTimer = null;

function checkAndRunBotTurn() {
  if (gameStatus !== 'started') return;
  const activePlayer = engine.players[currentTurnIndex];
  if (!activePlayer || !activePlayer.isBot) return;

  if (botTurnTimer) clearTimeout(botTurnTimer);

  botTurnTimer = setTimeout(() => {
    if (gameStatus !== 'started') return;
    const botPlayer = engine.players[currentTurnIndex];
    if (!botPlayer || !botPlayer.isBot || botPlayer.id !== activePlayer.id) return;

    // 1. Bot gieo xúc xắc
    const turnResult = engine.playTurn(botPlayer.id);
    if (!turnResult.success) {
      currentTurnIndex = (currentTurnIndex + 1) % engine.players.length;
      hasRolledThisTurn = false;
      broadcastState();
      checkAndRunBotTurn();
      return;
    }

    hasRolledThisTurn = true;
    const { player, dice, oldPosition, newPosition, passedGo, turnEvent } = turnResult;
    const landedTile = engine.board[newPosition];

    let msg = `🤖 [BOT AI] ${player.name} đổ xúc xắc [${dice.die1} + ${dice.die2} = ${dice.total}] ${
      dice.isDouble ? '(Đổ Đôi!)' : ''
    } -> Di chuyển đến ô ${newPosition}: "${landedTile.name}".`;

    if (passedGo) msg += ` 🎉 Đi qua Khởi Hành nhận lương +2.000 VNĐ.`;
    if (turnEvent.actionType === 'pay_tax') msg += ` 💸 Nộp thuế ${turnEvent.taxPaid?.toLocaleString('vi-VN')} VNĐ.`;
    if (turnEvent.actionType === 'paid_rent' && turnEvent.rentPaid) {
      msg += ` 🏠 Đã trả ${turnEvent.rentPaid.rentAmount?.toLocaleString('vi-VN')} VNĐ tiền thuê cho ${turnEvent.rentPaid.ownerName}.`;
    }

    broadcastTurnEvent(msg, 'roll', {
      playerId: player.id,
      dice,
      oldPosition,
      newPosition,
      turnEvent
    });
    broadcastState();

    // 2. Kiểm tra mua đất nếu ô vô chủ và Bot đủ tiền
    setTimeout(() => {
      if (gameStatus !== 'started') return;
      const currentBot = engine.players[currentTurnIndex];
      if (!currentBot || currentBot.id !== botPlayer.id) return;

      const isUnowned = turnEvent && (turnEvent.actionType === 'can_buy' || turnEvent.type === 'unowned');
      if (isUnowned && botPlayer.money >= (landedTile.price || 0)) {
        const buyResult = engine.buyProperty(botPlayer.id, newPosition);
        if (buyResult.success) {
          broadcastTurnEvent(
            `🤖 [BOT AI] ${botPlayer.name} tự động mua "${buyResult.tileName}" (Ô ${buyResult.tile.id}) với giá ${buyResult.pricePaid.toLocaleString('vi-VN')} VNĐ!`,
            'buy'
          );
          broadcastState();
        }
      }

      // 3. Kết thúc lượt sau khi xử lý xong (hoặc tiếp tục đổ nếu gieo xúc xắc đôi)
      setTimeout(() => {
        if (gameStatus !== 'started') return;
        const currentBotCheck = engine.players[currentTurnIndex];
        if (!currentBotCheck || currentBotCheck.id !== botPlayer.id) return;

        if (dice.isDouble && !botPlayer.inJail) {
          hasRolledThisTurn = false;
          broadcastTurnEvent(`🤖 [BOT AI] ${botPlayer.name} đổ đôi nên tiếp tục gieo xúc xắc lượt tiếp!`, 'info');
          checkAndRunBotTurn();
        } else {
          currentTurnIndex = (currentTurnIndex + 1) % engine.players.length;
          hasRolledThisTurn = false;
          const nextPlayer = engine.players[currentTurnIndex];
          broadcastTurnEvent(`⏭️ [BOT AI] ${botPlayer.name} kết thúc lượt. Đến lượt đi của: ${nextPlayer.name}.`, 'turn_change');
          broadcastState();
          checkAndRunBotTurn();
        }
      }, 1000);
    }, 1000);
  }, 2000);
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] Client socket ID: ${socket.id}`);

  // Gửi ngay trạng thái hiện tại cho người chơi mới kết nối
  socket.emit('state_update', {
    status: gameStatus,
    players: engine.players,
    properties: engine.properties,
    board: engine.board,
    currentTurnPlayerId: getCurrentTurnPlayerId(),
    hasRolledThisTurn
  });

  // Sự kiện: Người chơi tham gia phòng
  socket.on('join_game', ({ name }) => {
    if (!name || typeof name !== 'string') return;
    const cleanName = name.trim();
    if (!cleanName) return;

    const existing = engine.players.find((p) => p.id === socket.id);
    if (!existing) {
      engine.addPlayer(socket.id, cleanName, 15000);
      console.log(`[Player Joined] ${cleanName} (${socket.id})`);
      broadcastTurnEvent(`🎉 Người chơi "${cleanName}" đã gia nhập ván cờ!`, 'join');
      broadcastState();
    }
  });

  // Sự kiện: Bắt đầu ván chơi
  socket.on('start_game', (payload = {}) => {
    if (engine.players.length === 0) {
      socket.emit('action_error', { message: 'Cần ít nhất 1 người chơi để bắt đầu ván cờ.' });
      return;
    }

    const targetPlayerCount = Number(payload.targetPlayerCount) || 2;
    if (engine.players.length < targetPlayerCount) {
      const botsNeeded = Math.min(4, targetPlayerCount) - engine.players.length;
      if (botsNeeded > 0) {
        engine.addBot(botsNeeded);
        broadcastTurnEvent(`🤖 Hệ thống tự động thêm ${botsNeeded} Bot AI vào phòng cờ để đạt số lượng ${engine.players.length} người chơi!`, 'join');
      }
    }

    gameStatus = 'started';
    currentTurnIndex = 0;
    hasRolledThisTurn = false;
    console.log(`[Game Started] First turn: ${engine.players[currentTurnIndex].name}`);
    broadcastTurnEvent(
      `🚀 Ván cờ chính thức bắt đầu! Lượt đi đầu tiên thuộc về: ${engine.players[currentTurnIndex].name}.`,
      'start'
    );
    broadcastState();
    checkAndRunBotTurn();
  });

  // Sự kiện: Thiết lập ván chơi chi tiết (Lobby động cho Host Local Multiplayer + Bot)
  socket.on('setup_game', ({ playersSetup }) => {
    if (!Array.isArray(playersSetup) || playersSetup.length < 2) {
      socket.emit('action_error', { message: 'Cần thiết lập ít nhất 2 người chơi để bắt đầu ván cờ.' });
      return;
    }

    if (botTurnTimer) clearTimeout(botTurnTimer);
    engine.resetGame();

    playersSetup.forEach((setupItem, idx) => {
      const name = (setupItem.name || `Người chơi ${idx + 1}`).trim();
      const isBot = Boolean(setupItem.isBot);
      const id = isBot
        ? `bot_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`
        : (idx === 0 ? socket.id : `local_${socket.id}_${idx}_${Math.random().toString(36).substring(2, 6)}`);
      engine.addPlayer(id, name, 15000, isBot);
    });

    gameStatus = 'started';
    currentTurnIndex = 0;
    hasRolledThisTurn = false;
    console.log(`[Game Setup & Started] First turn: ${engine.players[currentTurnIndex]?.name}`);
    broadcastTurnEvent(
      `🚀 Ván cờ chính thức bắt đầu với ${engine.players.length} người chơi! Lượt đi đầu tiên thuộc về: ${engine.players[currentTurnIndex]?.name}.`,
      'start'
    );
    broadcastState();
    checkAndRunBotTurn();
  });

  // Sự kiện: Làm mới toàn bộ ván cờ (Reset Game)
  socket.on('reset_game', () => {
    if (botTurnTimer) clearTimeout(botTurnTimer);
    engine.resetGame();
    gameStatus = 'waiting';
    currentTurnIndex = 0;
    hasRolledThisTurn = false;
    console.log('[Game Reset] Ván cờ đã được reset theo yêu cầu từ client.');
    broadcastTurnEvent('🔄 Ván cờ đã được làm mới về trạng thái chờ tại Lobby.', 'info');
    broadcastState();
  });

  // Sự kiện: Đổ xúc xắc
  socket.on('roll_dice', () => {
    if (gameStatus !== 'started') {
      socket.emit('action_error', { message: 'Ván cờ chưa bắt đầu.' });
      return;
    }

    const activePlayer = engine.players[currentTurnIndex];
    if (!activePlayer) {
      socket.emit('action_error', { message: 'Không tìm thấy người chơi hiện tại!' });
      return;
    }
    const isOwnerOrLocal = activePlayer.id === socket.id || activePlayer.id.startsWith(`local_${socket.id}`) || !activePlayer.isBot;
    if (!isOwnerOrLocal) {
      socket.emit('action_error', { message: 'Chưa đến lượt đi của bạn!' });
      return;
    }

    if (hasRolledThisTurn && !activePlayer.inJail) {
      socket.emit('action_error', { message: 'Bạn đã gieo xúc xắc trong lượt này. Hãy thực hiện hành động hoặc kết thúc lượt.' });
      return;
    }

    const turnResult = engine.playTurn(activePlayer.id);
    if (!turnResult.success) {
      socket.emit('action_error', { message: turnResult.message });
      return;
    }

    hasRolledThisTurn = true;
    const { player, dice, oldPosition, newPosition, passedGo, turnEvent } = turnResult;
    const landedTile = engine.board[newPosition];

    // Tạo thông báo tường thuật chi tiết
    let msg = `🎲 ${player.name} đổ xúc xắc [${dice.die1} + ${dice.die2} = ${dice.total}] ${
      dice.isDouble ? '(Đổ Đôi!)' : ''
    } -> Di chuyển đến ô ${newPosition}: "${landedTile.name}".`;

    if (passedGo) {
      msg += ` 🎉 Đi qua Khởi Hành nhận lương +2.000 VNĐ.`;
    }

    if (turnEvent.actionType === 'pay_tax') {
      msg += ` 💸 Nộp thuế ${turnEvent.taxPaid.toLocaleString('vi-VN')} VNĐ.`;
    } else if (turnEvent.actionType === 'paid_rent' && turnEvent.rentPaid) {
      const r = turnEvent.rentPaid;
      msg += ` 🏠 Đã trả ${r.rentAmount.toLocaleString('vi-VN')} VNĐ tiền thuê cho ${r.ownerName}.`;
    } else if (turnEvent.actionType === 'go_to_jail') {
      msg += ` 🚨 Bị đưa vào tù!`;
    } else if (turnEvent.actionType === 'visit_jail_fee_paid') {
      msg += ` 👮 Thăm tù và chia đôi phí 100 VNĐ (50 Ngân hàng, 50 cho tù nhân).`;
    } else if (turnEvent.actionType === 'card_drawn' && turnEvent.card) {
      msg += ` 🎴 Rút thẻ: "${turnEvent.card.title || 'Sự kiện'}" - ${turnEvent.card.description || turnEvent.card.text}`;
    }

    broadcastTurnEvent(msg, 'roll', {
      playerId: player.id,
      dice,
      oldPosition,
      newPosition,
      turnEvent
    });

    // Nếu đổ xúc xắc đôi, cho phép đổ tiếp trong lượt
    if (dice.isDouble && !player.inJail) {
      hasRolledThisTurn = false;
      broadcastTurnEvent(`🔄 ${player.name} đổ xúc xắc đôi nên được quyền đổ tiếp tục!`, 'info');
    }

    broadcastState();
  });

  // Sự kiện: Kết thúc lượt
  socket.on('end_turn', () => {
    if (gameStatus !== 'started') return;
    const activePlayer = engine.players[currentTurnIndex];
    const isOwnerOrLocal = activePlayer && (activePlayer.id === socket.id || activePlayer.id.startsWith(`local_${socket.id}`) || !activePlayer.isBot);
    if (!isOwnerOrLocal) {
      socket.emit('action_error', { message: 'Chưa đến lượt đi của bạn!' });
      return;
    }
    if (!hasRolledThisTurn) {
      socket.emit('action_error', { message: 'Bạn phải đổ xúc xắc trước khi kết thúc lượt!' });
      return;
    }

    currentTurnIndex = (currentTurnIndex + 1) % engine.players.length;
    hasRolledThisTurn = false;
    const nextPlayer = engine.players[currentTurnIndex];

    broadcastTurnEvent(`⏭️ ${activePlayer.name} kết thúc lượt. Đến lượt đi của: ${nextPlayer.name}.`, 'turn_change');
    broadcastState();
    checkAndRunBotTurn();
  });

  // Sự kiện: Mua đất tại ô đang đứng
  socket.on('buy_property', ({ tileId, playerId }) => {
    if (gameStatus !== 'started') return;
    const activePlayer = engine.players[currentTurnIndex];
    if (!activePlayer) return;
    const targetPlayerId = playerId || activePlayer.id;
    if (targetPlayerId !== activePlayer.id) {
      socket.emit('action_error', { message: 'Chỉ được mua đất cho người chơi đang trong lượt đi.' });
      return;
    }
    const isOwnerOrLocal = activePlayer && (activePlayer.id === socket.id || activePlayer.id.startsWith(`local_${socket.id}`) || !activePlayer.isBot);
    if (!isOwnerOrLocal) {
      socket.emit('action_error', { message: 'Chỉ được mua đất trong lượt của bạn.' });
      return;
    }

    const targetTileId = typeof tileId === 'number' ? tileId : activePlayer.position;
    const result = engine.buyProperty(activePlayer.id, targetTileId);
    if (result.success) {
      broadcastTurnEvent(
        `🏷️ ${activePlayer.name} đã mua thành công "${result.tileName}" (Ô ${result.tile.id}) với giá ${result.pricePaid.toLocaleString(
          'vi-VN'
        )} VNĐ!`,
        'buy'
      );
      broadcastState();
    } else {
      socket.emit('action_error', { message: result.message });
    }
  });

  // Sự kiện: Nâng cấp Landmark
  socket.on('upgrade_property', ({ tileId, playerId }) => {
    if (gameStatus !== 'started') return;
    const activePlayer = engine.players[currentTurnIndex];
    if (!activePlayer) return;
    const targetPlayerId = playerId || activePlayer.id;
    if (targetPlayerId !== activePlayer.id) {
      socket.emit('action_error', { message: 'Chỉ được nâng cấp cho người chơi đang trong lượt đi.' });
      return;
    }
    const isOwnerOrLocal = activePlayer && (activePlayer.id === socket.id || activePlayer.id.startsWith(`local_${socket.id}`) || !activePlayer.isBot);
    if (!isOwnerOrLocal) {
      socket.emit('action_error', { message: 'Chỉ được nâng cấp trong lượt của bạn.' });
      return;
    }

    const targetTileId = typeof tileId === 'number' ? tileId : activePlayer.position;
    const result = engine.upgradeProperty(activePlayer.id, targetTileId);
    if (result.success) {
      const tile = engine.board[targetTileId];
      broadcastTurnEvent(
        `🏗️ ${activePlayer.name} đã nâng cấp landmark tại "${tile.name}" lên Cấp ${result.newLevel}: "${
          result.newLandmarkName
        }" (Chi phí: ${result.costPaid.toLocaleString('vi-VN')} VNĐ). Giá thuê mới: ${result.newRent.toLocaleString(
          'vi-VN'
        )} VNĐ!`,
        'upgrade'
      );
      broadcastState();
    } else {
      socket.emit('action_error', { message: result.message });
    }
  });

  // Sự kiện: Cầm cố tài sản
  socket.on('mortgage_property', ({ tileId, playerId }) => {
    if (gameStatus !== 'started') return;
    const activePlayer = engine.players[currentTurnIndex];
    if (!activePlayer) return;
    const targetPlayerId = playerId || activePlayer.id;
    if (targetPlayerId !== activePlayer.id) {
      socket.emit('action_error', { message: 'Chỉ được cầm cố cho người chơi đang trong lượt đi.' });
      return;
    }
    const isOwnerOrLocal = activePlayer && (activePlayer.id === socket.id || activePlayer.id.startsWith(`local_${socket.id}`) || !activePlayer.isBot);
    if (!isOwnerOrLocal) {
      socket.emit('action_error', { message: 'Chỉ được cầm cố trong lượt của bạn.' });
      return;
    }

    try {
      const result = engine.mortgageProperty(activePlayer.id, tileId);
      const tile = engine.board[tileId];
      broadcastTurnEvent(
        `🏦 ${activePlayer.name} đã cầm cố "${tile.name}" và nhận về ${result.mortgageValue.toLocaleString('vi-VN')} VNĐ.`,
        'mortgage'
      );
      broadcastState();
    } catch (err) {
      socket.emit('action_error', { message: err.message });
    }
  });

  // Sự kiện: Nộp phí bảo lãnh ra tù (500 VNĐ)
  socket.on('pay_jail_fee', () => {
    if (gameStatus !== 'started') return;
    const activePlayer = engine.players[currentTurnIndex];
    const isOwnerOrLocal = activePlayer && (activePlayer.id === socket.id || activePlayer.id.startsWith(`local_${socket.id}`) || !activePlayer.isBot);
    if (!isOwnerOrLocal) return;

    try {
      engine.payJailFee(activePlayer.id);
      broadcastTurnEvent(`🔓 ${activePlayer.name} đã nộp 500 VNĐ bảo lãnh để ra tù!`, 'info');
      broadcastState();
    } catch (err) {
      socket.emit('action_error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ${socket.id}`);
    const player = engine.getPlayer(socket.id);
    if (player) {
      engine.removePlayer(socket.id);
      broadcastTurnEvent(`🚪 Người chơi "${player.name}" đã rời phòng cờ.`, 'info');
      broadcastState();
    }

    // Nếu không còn người chơi thật nào trên bàn, tự động reset game và xóa Bot AI
    const hasHuman = engine.players.some(p => !p.isBot);
    if (!hasHuman && engine.players.length > 0) {
      if (botTurnTimer) clearTimeout(botTurnTimer);
      engine.resetGame();
      gameStatus = 'waiting';
      currentTurnIndex = 0;
      hasRolledThisTurn = false;
      console.log('[Game Reset] Tất cả người chơi thật đã rời bàn. Ván cờ được reset về trạng thái chờ.');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Authoritative Monopoly Socket.io Server running on port ${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your browser tabs!`);
  console.log(`======================================================\n`);
});

module.exports = { server, io };
