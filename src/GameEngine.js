const fs = require('fs');
const path = require('path');

/**
 * Lead Game Engine Class for 3D Vietnamese Monopoly (Advanced House Rules - 56 Tiles Board)
 * Quản lý Server Authoritative với trọn bộ House Rules Việt Nam:
 * - Bàn cờ 56 ô chuẩn Việt Nam (Wrap around % 56)
 * - Khởi hành "Hello Việt Nam" (+2.000 VNĐ khi đi qua)
 * - Vào Tù / Ra Tù / Thăm Tù chia 50/50 phí thăm nuôi (100 VNĐ: 50 Ngân hàng, 50 Người ở tù)
 * - Giới hạn nâng cấp tối đa 1 cấp/lượt dừng chân (không cần đủ bộ màu, không mua và nâng cấp cùng lượt)
 * - Cầm cố (Mortgage) & Siết nợ tự động sau 3 vòng cờ (Foreclosure after 3 laps)
 * - Thuế Siêu Sang lựa chọn giữa 1.000 VNĐ hoặc 10% tổng tài sản
 * - 4 Điểm Cực (Extreme Points: x10, x20, x35, x50 xúc xắc) + 4 Sân Bay (70, 150, 350, 500)
 */
class GameEngine {
  constructor(boardJsonPath = null, cardsJsonPath = null) {
    const defaultBoardPath = path.join(__dirname, '../data/board.json');
    const defaultCardsPath = path.join(__dirname, '../data/cards.json');

    const rawBoard = JSON.parse(fs.readFileSync(boardJsonPath || defaultBoardPath, 'utf8'));

    // Xây dựng hoặc chuẩn hóa bàn cờ 56 ô
    this.board = this._build56TileBoard(rawBoard);

    try {
      this.cards = JSON.parse(fs.readFileSync(cardsJsonPath || defaultCardsPath, 'utf8'));
    } catch (e) {
      this.cards = { chance: [], chest: [] };
    }

    this.players = [];
    this.properties = {};
    this.logs = [];
    this._initializeProperties();
  }

  /**
   * Reset toàn bộ trạng thái ván chơi về ban đầu
   */
  resetGame() {
    this.players = [];
    this.properties = {};
    this.logs = [];
    this._initializeProperties();
    this.log('Đã reset toàn bộ ván chơi về ban đầu.');
  }

  /**
   * Ghi log ván cờ bằng tiếng Việt
   */
  log(message) {
    const timestamp = new Date().toISOString();
    this.logs.push({ timestamp, message });
    console.log(`[GameEngine] ${message}`);
  }

  /**
   * Chuẩn hóa & xây dựng bàn cờ đủ 56 ô chuẩn Việt Nam
   */
  _build56TileBoard(inputTiles) {
    // Nếu dữ liệu đầu vào đã đủ 56 ô chuẩn (id từ 0 tới 55), trả về trực tiếp có chuẩn hóa tên thuế
    if (Array.isArray(inputTiles) && inputTiles.length === 56 && inputTiles[0].type === 'go') {
      return inputTiles.map((tile, idx) => {
        if (idx === 4 || idx === 16 || (tile.type === 'tax' && tile.amount === 200) || tile.name === 'Thuế Thu Nhập' || tile.name === 'Thuế') {
          return { ...tile, name: "Tổng cục thuế" };
        }
        if (idx === 38 || idx === 54 || tile.type === 'tax_luxury' || tile.name === 'Thuế Siêu Sang') {
          return { ...tile, name: "Ngân hàng nhà nước" };
        }
        return tile;
      });
    }

    // Định nghĩa 14 ô đặc biệt cố định trên bàn cờ 56 ô
    const specialMap = {
      0:  { id: 0,  name: "Hello Việt Nam (Khởi Hành)", type: "go", salary: 2000 },
      4:  { id: 4,  name: "Tổng cục thuế", type: "tax", amount: 200 },
      7:  { id: 7,  name: "Cơ Hội", type: "chance" },
      11: { id: 11, name: "Khí Vận", type: "chest" },
      14: { id: 14, name: "Thăm Tù (Just Visiting)", type: "visit_jail", visitingFee: 100 },
      18: { id: 18, name: "Cơ Hội", type: "chance" },
      23: { id: 23, name: "Khí Vận", type: "chest" },
      28: { id: 28, name: "Trạm Dừng Chân (Bãi Đỗ Xe)", type: "parking" },
      33: { id: 33, name: "Cơ Hội", type: "chance" },
      38: { id: 38, name: "Ngân hàng nhà nước", type: "tax_luxury", flatAmount: 1000, rate: 0.1 },
      42: { id: 42, name: "Ở Tù / Vào Tù (Go To Jail)", type: "go_to_jail" },
      46: { id: 46, name: "Khí Vận", type: "chest" },
      50: { id: 50, name: "Cơ Hội", type: "chance" },
      53: { id: 53, name: "Khí Vận", type: "chest" }
    };

    // Lọc danh sách 42 ô mua được (property, airport, utility, extreme_point)
    const purchasableTiles = inputTiles.filter(tile =>
      ['property', 'airport', 'utility', 'extreme_point'].includes(tile.type)
    );

    const fullBoard = [];
    let purchasableIdx = 0;

    for (let pos = 0; pos < 56; pos++) {
      if (specialMap[pos]) {
        fullBoard.push({ ...specialMap[pos], id: pos });
      } else {
        const tile = purchasableTiles[purchasableIdx] || {
          name: `Ô đất #${pos}`,
          type: 'property',
          price: 200,
          baseRent: 20,
          upgrades: []
        };
        fullBoard.push({
          ...tile,
          id: pos
        });
        purchasableIdx++;
      }
    }

    return fullBoard;
  }

  /**
   * Khởi tạo trạng thái sở hữu cho tất cả các ô mua được trên bàn cờ 56 ô
   */
  _initializeProperties() {
    this.board.forEach((tile) => {
      if (['property', 'airport', 'utility', 'extreme_point'].includes(tile.type)) {
        this.properties[tile.id] = {
          ownerId: null,
          level: 0,
          currentName: tile.name,
          isMortgaged: false,
          mortgagedAtLap: null
        };
      }
    });
  }

  /**
   * Thêm người chơi vào ván cờ
   */
  addPlayer(id, name, initialMoney = 15000, isBot = false) {
    const player = {
      id,
      name,
      position: 0,
      money: initialMoney,
      inJail: false,
      jailTurns: 0,
      doublesCount: 0,
      getOutOfJailCards: 0,
      completedLaps: 0,
      upgradedTilesThisVisit: new Set(),
      boughtTilesThisTurn: new Set(),
      isBot: Boolean(isBot)
    };
    this.players.push(player);
    this.log(`Người chơi mới tham gia: ${name} (ID: ${id}) ${isBot ? '[BOT AI] ' : ''}với vốn ban đầu ${initialMoney.toLocaleString('vi-VN')} VNĐ.`);
    return player;
  }

  /**
   * Thêm tự động số lượng Bot AI vào ván chơi
   */
  addBot(count = 1) {
    const botsAdded = [];
    for (let i = 0; i < count; i++) {
      const botIndex = this.players.filter(p => p.isBot).length + 1;
      const botId = `bot_${Date.now()}_${botIndex}_${Math.random().toString(36).substring(2, 6)}`;
      const botName = `Bot AI ${botIndex}`;
      const botPlayer = this.addPlayer(botId, botName, 15000, true);
      botsAdded.push(botPlayer);
    }
    return botsAdded;
  }

  getPlayer(playerId) {
    return this.players.find((p) => p.id === playerId) || null;
  }

  /**
   * Xóa người chơi khỏi bàn
   */
  removePlayer(playerId) {
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index === -1) return null;
    const [removed] = this.players.splice(index, 1);
    this.log(`Người chơi rời bàn: ${removed.name} (ID: ${playerId})`);
    return removed;
  }

  /**
   * Đổ 2 viên xúc xắc 6 mặt
   */
  rollDice() {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    return {
      die1,
      die2,
      total: die1 + die2,
      isDouble: die1 === die2
    };
  }

  /**
   * Tính TỔNG TÀI SẢN (Total Asset Value) gồm:
   * Tiền mặt + Giá gốc bất động sản đang sở hữu + Chi phí nâng cấp đã bỏ ra
   */
  calculateTotalAssetValue(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return { totalAssets: 0, cash: 0, propertiesValue: 0, upgradesValue: 0, tenPercentTax: 0 };

    let propertiesValue = 0;
    let upgradesValue = 0;

    Object.keys(this.properties).forEach((tileIdStr) => {
      const tileId = parseInt(tileIdStr, 10);
      const state = this.properties[tileId];
      if (state.ownerId === playerId) {
        const tile = this.board[tileId];
        propertiesValue += (tile.price || 0);

        if (state.level > 0 && tile.upgrades && Array.isArray(tile.upgrades)) {
          for (let l = 0; l < state.level; l++) {
            if (tile.upgrades[l]) {
              upgradesValue += (tile.upgrades[l].cost || 0);
            }
          }
        }
      }
    });

    const totalAssets = player.money + propertiesValue + upgradesValue;
    const tenPercentTax = Math.round(totalAssets * 0.1);

    return {
      totalAssets,
      cash: player.money,
      propertiesValue,
      upgradesValue,
      tenPercentTax
    };
  }

  /**
   * Nộp Thuế Siêu Sang theo lựa chọn: 'flat' (1000 VNĐ) hoặc 'percentage' (10% tổng tài sản)
   */
  payLuxuryTax(playerId, choice = 'flat') {
    const player = this.getPlayer(playerId);
    if (!player) throw new Error("Người chơi không tồn tại.");

    const assetInfo = this.calculateTotalAssetValue(playerId);
    const amount = choice === 'percentage' ? assetInfo.tenPercentTax : 1000;

    player.money -= amount;
    this.log(`[THUẾ SIÊU SANG] ${player.name} chọn nộp theo phương thức '${choice === 'percentage' ? '10% Tổng tài sản' : '1.000 VNĐ cố định'}'. Số tiền nộp: ${amount.toLocaleString('vi-VN')} VNĐ.`);
    return { success: true, amount, choice, assetInfo };
  }

  /**
   * Kiểm tra và siết nợ (Foreclosure) các bất động sản đã cầm cố quá 3 vòng cờ
   */
  checkForeclosures(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return;

    Object.keys(this.properties).forEach((tileIdStr) => {
      const tileId = parseInt(tileIdStr, 10);
      const propState = this.properties[tileId];
      if (propState.ownerId === playerId && propState.isMortgaged) {
        const lapsElapsed = player.completedLaps - propState.mortgagedAtLap;
        if (lapsElapsed >= 3) {
          const tile = this.board[tileId];
          propState.ownerId = null;
          propState.isMortgaged = false;
          propState.mortgagedAtLap = null;
          propState.level = 0;
          propState.currentName = tile.name;
          this.log(`[FORECLOSURE / SIẾT NỢ] Bất động sản '${tile.name}' (Ô ${tileId}) của ${player.name} đã bị SIẾT NỢ do cầm cố quá 3 vòng cờ! (Đã trở về trạng thái vô chủ)`);
        }
      }
    });
  }

  /**
   * Cầm cố tài sản (Mortgage)
   */
  mortgageProperty(playerId, tileId) {
    const player = this.getPlayer(playerId);
    const tile = this.board[tileId];
    const propState = this.properties[tileId];

    if (!player || !tile || !propState) throw new Error("Dữ liệu không hợp lệ.");
    if (propState.ownerId !== playerId) throw new Error("Bạn không phải chủ sở hữu bất động sản này.");
    if (propState.isMortgaged) throw new Error("Bất động sản này đã được cầm cố trước đó.");

    const mortgageValue = tile.mortgageValue || Math.floor(tile.price / 2);
    propState.isMortgaged = true;
    propState.mortgagedAtLap = player.completedLaps;
    player.money += mortgageValue;

    this.log(`[CẦM CỐ] ${player.name} đã cầm cố '${tile.name}' nhận về ${mortgageValue.toLocaleString('vi-VN')} VNĐ (vòng cờ thứ ${player.completedLaps}).`);
    return { success: true, mortgageValue };
  }

  /**
   * Chuộc tài sản cầm cố (Unmortgage)
   */
  unmortgageProperty(playerId, tileId) {
    const player = this.getPlayer(playerId);
    const tile = this.board[tileId];
    const propState = this.properties[tileId];

    if (!player || !tile || !propState) throw new Error("Dữ liệu không hợp lệ.");
    if (propState.ownerId !== playerId) throw new Error("Bạn không phải chủ sở hữu.");
    if (!propState.isMortgaged) throw new Error("Bất động sản này không trong trạng thái cầm cố.");

    const mortgageValue = tile.mortgageValue || Math.floor(tile.price / 2);
    if (player.money < mortgageValue) throw new Error("Không đủ tiền để chuộc lại tài sản.");

    player.money -= mortgageValue;
    propState.isMortgaged = false;
    propState.mortgagedAtLap = null;

    this.log(`[CHUỘC TÀI SẢN] ${player.name} đã chuộc lại '${tile.name}' với giá ${mortgageValue.toLocaleString('vi-VN')} VNĐ.`);
    return { success: true };
  }

  /**
   * Gửi người chơi vào tù
   */
  sendToJail(playerId, reason = "Vi phạm luật cờ") {
    const player = this.getPlayer(playerId);
    if (!player) return;

    player.inJail = true;
    player.jailTurns = 0;
    player.doublesCount = 0;
    player.position = 14; // Ô Thăm Tù (Vị trí tạm giam)

    this.log(`[VÀO TÙ] ${player.name} bị đưa vào Tù (Ô 14) do: ${reason}.`);
  }

  /**
   * Nộp tiền bảo lãnh 500 VNĐ để ra tù
   */
  payJailFee(playerId) {
    const player = this.getPlayer(playerId);
    if (!player || !player.inJail) throw new Error("Người chơi không ở trong tù.");
    if (player.money < 500) throw new Error("Không đủ 500 VNĐ để nộp phí bảo lãnh.");

    player.money -= 500;
    player.inJail = false;
    player.jailTurns = 0;
    this.log(`[RA TÙ] ${player.name} đã nộp 500 VNĐ bảo lãnh để ra tù.`);
    return { success: true };
  }

  /**
   * Sử dụng thẻ Thoát Tù Miễn Phí
   */
  useGetOutOfJailCard(playerId) {
    const player = this.getPlayer(playerId);
    if (!player || !player.inJail) throw new Error("Người chơi không ở trong tù.");
    if (player.getOutOfJailCards <= 0) throw new Error("Bạn không có thẻ Thoát Tù Miễn Phí.");

    player.getOutOfJailCards -= 1;
    player.inJail = false;
    player.jailTurns = 0;
    this.log(`[RA TÙ] ${player.name} đã dùng thẻ 'Thoát Tù Miễn Phí' để ra tù.`);
    return { success: true };
  }

  /**
   * Rút thẻ Khí Vận / Cơ Hội
   */
  drawCard(playerId, type = 'chance') {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    const deck = this.cards[type] || [];
    if (deck.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    this.log(`[THẺ BÀI] ${player.name} rút thẻ [${type.toUpperCase()}]: "${card.title || 'Sự kiện'}" - ${card.description || card.text}`);

    if (card.action === 'money' || (typeof card.amount === 'number' && card.amount > 0 && card.action !== 'pay')) {
      const amount = card.amount || 0;
      player.money += amount;
      this.log(` -> Nhận tiền từ thẻ: +${amount.toLocaleString('vi-VN')} VNĐ.`);
    } else if (card.action === 'pay') {
      const amount = card.amount || 0;
      player.money -= amount;
      this.log(` -> Nộp tiền theo thẻ: -${amount.toLocaleString('vi-VN')} VNĐ.`);
    } else if (card.action === 'go_to_jail') {
      this.sendToJail(playerId, "Rút trúng thẻ Vào Tù");
    } else if (card.action === 'move_to') {
      let targetIdx = -1;
      if (typeof card.destination === 'number') {
        targetIdx = card.destination;
      } else if (card.targetName) {
        targetIdx = this.board.findIndex(t => t.name.toLowerCase().includes(card.targetName.toLowerCase()));
      }
      if (targetIdx !== -1) {
        const oldPos = player.position;
        player.position = targetIdx;
        if (targetIdx < oldPos || targetIdx === 0) {
          player.money += 2000;
          player.completedLaps += 1;
          this.log(` -> Đi qua ô KHỞI HÀNH khi di chuyển thẻ bài: Nhận lương +2.000 VNĐ.`);
          this.checkForeclosures(playerId);
        }
        this.handleTileLanded(playerId, { total: 0 });
      }
    } else if (card.action === 'move_relative' && typeof card.amount === 'number') {
      const oldPos = player.position;
      const newPos = ((oldPos + card.amount) % 56 + 56) % 56;
      player.position = newPos;
      this.handleTileLanded(playerId, { total: 0 });
    } else if (card.action === 'out_of_jail' || card.action === 'get_out_of_jail_card') {
      player.getOutOfJailCards += 1;
      this.log(` -> Nhận 1 thẻ Thoát Tù Miễn Phí.`);
    }

    return card;
  }

  /**
   * Tính tiền thuê động theo quy tắc House Rules
   */
  calculateRent(tileId, diceTotal = 0) {
    const tile = this.board[tileId];
    const state = this.properties[tileId];
    if (!tile || !state || !state.ownerId || state.isMortgaged) return 0;

    const ownerId = state.ownerId;

    // 1. Nhóm Sân bay (Airport): 70, 150, 350, 500 VNĐ theo số lượng sở hữu
    if (tile.type === 'airport') {
      const airportsCount = Object.keys(this.properties).filter(idStr => {
        const t = this.board[parseInt(idStr, 10)];
        const s = this.properties[parseInt(idStr, 10)];
        return t && t.type === 'airport' && s.ownerId === ownerId;
      }).length;

      const airportRents = [0, 70, 150, 350, 500];
      return airportRents[Math.min(airportsCount, 4)] || 70;
    }

    // 2. Nhóm Tiện ích / Điểm Cực (Utility / Extreme Point): x10, x20, x35, x50 xúc xắc
    if (tile.type === 'utility' || tile.type === 'extreme_point') {
      const utilitiesCount = Object.keys(this.properties).filter(idStr => {
        const t = this.board[parseInt(idStr, 10)];
        const s = this.properties[parseInt(idStr, 10)];
        return t && (t.type === 'utility' || t.type === 'extreme_point') && s.ownerId === ownerId;
      }).length;

      const multipliers = [0, 10, 20, 35, 50];
      const mult = multipliers[Math.min(utilitiesCount, 4)] || 10;
      const roll = diceTotal > 0 ? diceTotal : 7;
      return mult * roll;
    }

    // 3. Đất nền thông thường (Property)
    if (state.level === 0) {
      return tile.baseRent || 40;
    } else {
      const upgradeIdx = state.level - 1;
      if (tile.upgrades && tile.upgrades[upgradeIdx]) {
        return tile.upgrades[upgradeIdx].rent || 0;
      }
      return tile.baseRent || 40;
    }
  }

  /**
   * Xử lý lượt đi chính của người chơi
   */
  playTurn(playerId, forcedDice = null) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: "Người chơi không tồn tại." };

    player.upgradedTilesThisVisit.clear();
    player.boughtTilesThisTurn.clear();

    const dice = forcedDice || this.rollDice();
    this.log(`--- Lượt đi của ${player.name} | Gieo xúc xắc: (${dice.die1}, ${dice.die2}) -> Tổng ${dice.total} ---`);

    // Xử lý khi đang ở trong tù
    if (player.inJail) {
      player.jailTurns += 1;
      if (dice.isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        this.log(`${player.name} gieo được xúc xắc đôi (${dice.die1}=${dice.die2}) -> ĐƯỢC THẢ TỰ DO!`);
      } else {
        if (player.jailTurns >= 3) {
          player.money -= 500;
          player.inJail = false;
          player.jailTurns = 0;
          this.log(`${player.name} đã ở tù 3 lượt -> Bắt buộc nộp 500 VNĐ ra tù.`);
        } else {
          this.log(`${player.name} không gieo được đôi -> Tiếp tục ở tù (Lượt thứ ${player.jailTurns}/3).`);
          return {
            success: true,
            player,
            dice,
            oldPosition: player.position,
            newPosition: player.position,
            passedGo: false,
            tileLanded: this.board[player.position],
            turnEvent: { actionType: 'in_jail' },
            actionResult: { type: 'in_jail' }
          };
        }
      }
    }

    // Luật 3 lần xúc xắc đôi liên tiếp vào tù
    if (dice.isDouble) {
      player.doublesCount += 1;
      if (player.doublesCount === 3) {
        this.sendToJail(playerId, "Gieo xúc xắc đôi 3 lần liên tiếp");
        return {
          success: true,
          player,
          dice,
          oldPosition: player.position,
          newPosition: 14,
          passedGo: false,
          tileLanded: this.board[14],
          turnEvent: { actionType: 'go_to_jail' },
          actionResult: { type: 'sent_to_jail_speeding' }
        };
      }
    } else {
      player.doublesCount = 0;
    }

    // Di chuyển trên bàn cờ 56 ô
    const boardSize = 56;
    const oldPosition = player.position;
    const newPosition = (oldPosition + dice.total) % boardSize;

    let passedGo = false;
    if (newPosition < oldPosition || newPosition === 0) {
      passedGo = true;
      player.money += 2000;
      player.completedLaps += 1;
      this.log(`[KHỞI HÀNH] ${player.name} đi qua hoặc đến ô KHỞI HÀNH (Vòng thứ ${player.completedLaps}) -> Nhận lương +2.000 VNĐ.`);
      this.checkForeclosures(playerId);
    }

    player.position = newPosition;
    const tileLanded = this.board[newPosition];

    const actionResult = this.handleTileLanded(playerId, dice);

    let actionType = actionResult.type;
    if (actionResult.type === 'unowned') actionType = 'can_buy';
    if (actionResult.type === 'rent_paid') actionType = 'paid_rent';
    if (actionResult.type === 'tax') actionType = 'pay_tax';

    const turnEvent = {
      ...actionResult,
      actionType,
      taxPaid: actionResult.amount,
      rentPaid: actionResult.rent ? {
        ownerName: (this.getPlayer(actionResult.ownerId) || {}).name || 'Chủ đất',
        tileName: tileLanded.name,
        rentAmount: actionResult.rent,
        payerRemainingMoney: player.money,
        ownerNewMoney: (this.getPlayer(actionResult.ownerId) || {}).money || 0
      } : null
    };

    return {
      success: true,
      player,
      dice,
      oldPosition,
      newPosition,
      passedGo,
      tileLanded,
      turnEvent,
      actionResult
    };
  }

  /**
   * Xử lý khi người chơi đáp xuống một ô
   */
  handleTileLanded(playerId, dice = { total: 0 }) {
    const player = this.getPlayer(playerId);
    const tile = this.board[player.position];
    this.log(`${player.name} dừng chân tại Ô ${tile.id}: [${tile.type.toUpperCase()}] "${tile.name}"`);

    // 1. Ô Vào Tù (Go To Jail)
    if (tile.type === 'go_to_jail' || tile.id === 42) {
      this.sendToJail(playerId, "Đáp trúng ô Ở Tù / Vào Tù");
      return { type: 'go_to_jail' };
    }

    // 2. Ô Thăm Tù (Jail / Just Visiting) -> Custom Rule 50/50 phí thăm tù
    if (tile.type === 'visit_jail' || tile.id === 14) {
      const prisoners = this.players.filter(p => p.inJail && p.id !== playerId);
      if (prisoners.length > 0) {
        prisoners.forEach(prisoner => {
          const visitingFee = 100;
          const halfBank = 50;
          const halfPrisoner = 50;
          player.money -= visitingFee;
          prisoner.money += halfPrisoner;
          this.log(`[THĂM TÙ 50/50] ${player.name} vào thăm tù nhân ${prisoner.name}: Nộp phí 100 VNĐ (50 VNĐ vào Ngân Hàng, 50 VNĐ cho ${prisoner.name}).`);
        });
        return { type: 'visit_jail_fee_paid', prisoners: prisoners.map(p => p.name) };
      }
      this.log(`${player.name} ghé thăm khu vực Thăm Tù (không có tù nhân nào bên trong).`);
      return { type: 'visit_jail_safe' };
    }

    // 3. Ô Thuế Thông Thường (Normal Tax)
    if (tile.type === 'tax') {
      const amount = tile.amount || 200;
      player.money -= amount;
      this.log(`[THUẾ] ${player.name} nộp thuế thông thường: ${amount.toLocaleString('vi-VN')} VNĐ.`);
      return { type: 'tax', amount };
    }

    // 4. Ô Thuế Siêu Sang (Luxury Tax)
    if (tile.type === 'tax_luxury') {
      const assetInfo = this.calculateTotalAssetValue(playerId);
      this.log(`[THUẾ SIÊU SANG] ${player.name} đáp trúng Thuế Siêu Sang. Tổng tài sản hiện có: ${assetInfo.totalAssets.toLocaleString('vi-VN')} VNĐ (10% = ${assetInfo.tenPercentTax.toLocaleString('vi-VN')} VNĐ).`);
      return {
        type: 'tax_luxury_pending',
        flatChoice: 1000,
        percentageChoice: assetInfo.tenPercentTax,
        assetInfo
      };
    }

    // 5. Thẻ Khí Vận / Cơ Hội
    if (tile.type === 'chance' || tile.type === 'chest') {
      const card = this.drawCard(playerId, tile.type);
      return { type: 'card_drawn', card };
    }

    // 6. Ô Khởi Hành hoặc Bãi Đỗ Xe
    if (tile.type === 'go' || tile.type === 'parking') {
      return { type: 'safe_tile' };
    }

    // 7. Ô có thể mua được (property, airport, utility, extreme_point)
    const propState = this.properties[tile.id];
    if (!propState) return { type: 'safe_tile' };

    if (!propState.ownerId) {
      this.log(` -> Bất động sản này chưa có chủ. Giá mua: ${tile.price.toLocaleString('vi-VN')} VNĐ.`);
      return { type: 'unowned', price: tile.price };
    }

    if (propState.ownerId === playerId) {
      this.log(` -> Bạn chính là chủ sở hữu ô đất này.`);
      return { type: 'self_owned', level: propState.level };
    }

    if (propState.isMortgaged) {
      this.log(` -> Bất động sản này đang bị cầm cố. Miễn phí tiền thuê!`);
      return { type: 'mortgaged_safe' };
    }

    // 8. Trả tiền thuê cho người chơi khác
    const owner = this.getPlayer(propState.ownerId);
    const rent = this.calculateRent(tile.id, dice.total);

    player.money -= rent;
    if (owner) owner.money += rent;

    this.log(`[TIỀN THUÊ] ${player.name} trả ${rent.toLocaleString('vi-VN')} VNĐ tiền thuê cho ${owner ? owner.name : 'Chủ đất'} tại '${tile.name}'.`);
    return {
      type: 'rent_paid',
      ownerId: propState.ownerId,
      rent,
      tile
    };
  }

  /**
   * Mua bất động sản
   */
  buyProperty(playerId, tileId) {
    const player = this.getPlayer(playerId);
    const tile = this.board[tileId];
    const state = this.properties[tileId];

    if (!player || !tile || !state) {
      return { success: false, message: "Dữ liệu người chơi hoặc ô đất không hợp lệ." };
    }

    if (state.ownerId) {
      return { success: false, message: "Bất động sản này đã thuộc về người chơi khác." };
    }

    if (player.money < tile.price) {
      return { success: false, message: "Tài chính không đủ để mua bất động sản này." };
    }

    player.money -= tile.price;
    state.ownerId = playerId;
    state.level = 0;
    player.boughtTilesThisTurn.add(tileId);

    this.log(`[MUA TÀI SẢN] ${player.name} đã mua '${tile.name}' (Ô ${tile.id}) với giá ${tile.price.toLocaleString('vi-VN')} VNĐ.`);
    return {
      success: true,
      tile,
      tileName: tile.name,
      pricePaid: tile.price,
      remainingMoney: player.money
    };
  }

  /**
   * Nâng cấp bất động sản (Tối đa 1 cấp/lượt dừng chân, không mua & nâng cấp cùng lượt)
   */
  upgradeProperty(playerId, tileId) {
    const player = this.getPlayer(playerId);
    const tile = this.board[tileId];
    const state = this.properties[tileId];

    if (!player || !tile || !state) {
      return { success: false, message: "Dữ liệu không hợp lệ." };
    }

    if (state.ownerId !== playerId) {
      return { success: false, message: "Bạn không phải chủ sở hữu bất động sản này." };
    }

    if (state.isMortgaged) {
      return { success: false, message: "Không thể nâng cấp bất động sản đang bị cầm cố." };
    }

    if (player.boughtTilesThisTurn.has(tileId)) {
      return { success: false, message: "Không thể vừa mua và vừa nâng cấp trong cùng một lượt. Hãy quay lại vào lượt sau!" };
    }

    if (player.upgradedTilesThisVisit.has(tileId)) {
      return { success: false, message: "Mỗi lần dừng chân chỉ được nâng cấp tối đa 1 cấp." };
    }

    if (!tile.upgrades || state.level >= tile.upgrades.length) {
      return { success: false, message: "Bất động sản đã đạt cấp độ tối đa." };
    }

    const nextUpgrade = tile.upgrades[state.level];
    if (player.money < nextUpgrade.cost) {
      return { success: false, message: "Không đủ tài chính để nâng cấp." };
    }

    player.money -= nextUpgrade.cost;
    state.level += 1;
    state.currentName = nextUpgrade.name;
    player.upgradedTilesThisVisit.add(tileId);

    this.log(`[NÂNG CẤP] ${player.name} nâng cấp '${tile.name}' lên Cấp ${state.level}: [${nextUpgrade.name}] chi phí ${nextUpgrade.cost.toLocaleString('vi-VN')} VNĐ.`);
    return {
      success: true,
      level: state.level,
      newLevel: state.level,
      upgradeName: nextUpgrade.name,
      newLandmarkName: nextUpgrade.name,
      costPaid: nextUpgrade.cost,
      newRent: nextUpgrade.rent
    };
  }

  /**
   * Thanh toán tiền thuê thủ công
   */
  payRent(payerId, ownerId, amount, tileName = "Bất động sản") {
    const payer = this.getPlayer(payerId);
    const owner = this.getPlayer(ownerId);

    if (!payer || !owner) return false;

    payer.money -= amount;
    owner.money += amount;

    this.log(`[THANH TOÁN THUÊ] ${payer.name} thanh toán ${amount.toLocaleString('vi-VN')} VNĐ cho ${owner.name} tại ${tileName}.`);
    return true;
  }

  /**
   * Trả về toàn bộ trạng thái ván cờ (Server State Snapshot)
   */
  getGameState() {
    return {
      boardSize: this.board.length,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        money: p.money,
        inJail: p.inJail,
        jailTurns: p.jailTurns,
        completedLaps: p.completedLaps,
        getOutOfJailCards: p.getOutOfJailCards,
        isBot: Boolean(p.isBot)
      })),
      properties: this.properties
    };
  }
}

module.exports = GameEngine;
