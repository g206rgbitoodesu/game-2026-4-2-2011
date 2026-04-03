// save.js - 完成版：セーブ・ロード・完全リセットシステム

const SAVE_KEY = "cellEvolutionSave";

/**
 * ゲームの状態をローカルストレージに保存する
 */
function saveGame() {
    if (typeof items === "undefined") return;

    const data = {
        version: 2,
        totalCells: typeof totalCells !== 'undefined' ? totalCells : 0,
        ep: typeof ep !== 'undefined' ? ep : 0,
        permanentMult: typeof permanentMult !== 'undefined' ? permanentMult : 1,
        boughtNodes: typeof boughtNodes !== 'undefined' ? boughtNodes : 0,
        nextEvoIdx: typeof nextEvoIdx !== 'undefined' ? nextEvoIdx : 0,
        bigBangCount: typeof bigBangCount !== 'undefined' ? bigBangCount : 0,
        totalClicks: typeof totalClicks !== 'undefined' ? totalClicks : 0,
        specialClicks: typeof specialClicks !== 'undefined' ? specialClicks : 0,
        totalSacrifices: typeof totalSacrifices !== 'undefined' ? totalSacrifices : 0,
        itemCounts: {}
    };

    // 各ショップアイテムの所持数を保存
    for (let k in items) {
        data.itemCounts[k] = items[k].count;
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    console.log("Game Saved");
}

/**
 * ローカルストレージからデータを読み込む
 */
function loadGame() {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return false;

    let data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        console.error("セーブデータの読み込みに失敗:", e);
        return false;
    }

    // 基本変数の復元（存在しない場合は初期値）
    totalCells = data.totalCells || 0;
    ep = data.ep || 0;
    permanentMult = data.permanentMult || 1;
    boughtNodes = data.boughtNodes || 0;
    nextEvoIdx = data.nextEvoIdx || 0;
    bigBangCount = data.bigBangCount || 0;
    totalClicks = data.totalClicks || 0;
    specialClicks = data.specialClicks || 0;
    totalSacrifices = data.totalSacrifices || 0;

    // アイテム数の復元
    if (data.itemCounts) {
        for (let k in data.itemCounts) {
            if (items[k]) items[k].count = data.itemCounts[k] || 0;
        }
    }

    // 進化倍率の再計算
    if (typeof currentMultiplier !== 'undefined') {
        currentMultiplier = Math.pow(2, nextEvoIdx);
    }

    console.log("Game Loaded");
    return true;
}

/**
 * 【重要】ユーザーに確認後、すべてを0にして初期化する
 */
function resetGameWithConfirmation() {
    const firstCheck = confirm("【最終警告】セーブデータを完全に削除しますか？\n(獲得したEPや星の記憶もすべて消去されます)");
    if (!firstCheck) return;

    const secondCheck = confirm("本当の本当にいいですか？\nこの操作を実行すると、二度と元に戻せません。");
    if (!secondCheck) return;

    executeCompleteReset();
}

/**
 * 物理的にデータを抹消する内部処理
 */
function executeCompleteReset() {
    console.log("完全リセットを開始します...");

    // 1. すべてのタイマー（自動保存等）を物理的に停止
    for (let i = 1; i < 9999; i++) {
        window.clearInterval(i);
    }

    // 2. セーブ関数を破壊して上書きを封印
    window.saveGame = function() { 
        console.log("Save blocked during reset."); 
        return false; 
    };

    // 3. ローカルストレージを徹底的に消去
    localStorage.removeItem(SAVE_KEY);
    localStorage.clear();

    // 4. メモリ上の変数をすべて0/初期値にする
    totalCells = 0;
    ep = 0;
    permanentMult = 1;
    boughtNodes = 0;
    nextEvoIdx = 0;
    bigBangCount = 0;
    totalClicks = 0;
    specialClicks = 0;
    totalSacrifices = 0;
    if (typeof clickFeverTime !== 'undefined') clickFeverTime = 0;
    if (typeof feverTime !== 'undefined') feverTime = 0;

    // アイテムLvをすべて0に
    if (typeof items !== 'undefined') {
        for (let k in items) items[k].count = 0;
    }

    // 5. キャッシュを回避してページを強制リロード
    setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
    }, 200);
}

/**
 * 統計情報をUIに反映する（おまけ：その他画面用）
 */
function updateStatsUI() {
    const safeSet = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val.toLocaleString();
    };

    safeSet("stat-current-cells", Math.floor(totalCells));
    safeSet("stat-ep", ep);
    safeSet("stat-total-clicks", totalClicks);
    safeSet("stat-special-clicks", specialClicks);
    safeSet("stat-total-sacrifices", totalSacrifices);
    safeSet("stat-bigbang-count", bigBangCount);
}

// 10秒ごとに自動セーブ
setInterval(saveGame, 10000);

// ロード実行
window.onload = function() {
    loadGame();
    if (typeof updateCounter === 'function') updateCounter();
};
