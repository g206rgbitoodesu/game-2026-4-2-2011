// save.js - セーブ・ロードシステム

function saveGame() {
    const data = { 
        totalCells, 
        ep, 
        permanentMult, 
        boughtNodes,     // 【修正】boughtNodes を保存に追加（元は保存されていなかった）
        nextEvoIdx,      // 【追加】進化段階も保存
        itemCounts: {} 
    };
    for (let k in items) data.itemCounts[k] = items[k].count;
    localStorage.setItem("cellEvolutionSave", JSON.stringify(data));
}

function loadGame() {
    const json = localStorage.getItem("cellEvolutionSave");
    if (!json) return;
    
    let data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        console.error("セーブデータの読み込みに失敗:", e);
        return;
    }
    
    totalCells = data.totalCells || 0;
    ep = data.ep || 0;
    permanentMult = data.permanentMult || 1;
    boughtNodes = data.boughtNodes || 0;  // 【修正】boughtNodes を復元

    // アイテム数を復元
    if (data.itemCounts) {
        for (let k in data.itemCounts) {
            if (items[k]) items[k].count = data.itemCounts[k];
        }
    }

    // 進化段階を復元
    if (data.nextEvoIdx !== undefined) {
        nextEvoIdx = data.nextEvoIdx;
    } else {
        // 旧セーブデータ互換：閾値から再計算
        nextEvoIdx = 0;
        while (nextEvoIdx < evoList.length && totalCells >= evoList[nextEvoIdx].threshold) nextEvoIdx++;
    }
    
    // 【修正】倍率を Math.pow(2, nextEvoIdx) で計算（元は nextEvoIdx + 1 で不整合だった）
    currentMultiplier = Math.pow(2, nextEvoIdx);
}

setInterval(saveGame, 30000);

window.onload = () => {
    // loadGame(); // ロードを有効にする場合はここを解除
    renderShop();
    updateCounter();
};

// save.js の saveGame 関数
function saveGame() {
    const data = { 
        totalCells, 
        ep, 
        permanentMult, 
        boughtNodes,
        nextEvoIdx,
        bigBangCount, // ★追加
        itemCounts: {} 
    };
    // ...
}

// save.js の loadGame 関数
function loadGame() {
    // ...
    totalCells = data.totalCells || 0;
    bigBangCount = data.bigBangCount || 0; // ★追加
    // ...
}
