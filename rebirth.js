// rebirth.js - 転生・強化ツリー・通知システム

let activeNotifications = 0; // 現在表示されている通知の数

// コスト計算関数
function getNextNodeCost(index) {
    let base = 10; 
    const multipliers = [1.2, 1.4, 2.0, 10.0]; 
    let cost = base;
    for (let i = 0; i < index; i++) {
        if (i < multipliers.length) {
            cost *= multipliers[i];
        } else {
            cost *= 1.5; 
        }
    }
    return Math.ceil(cost);
}

// EP獲得通知を表示（最大2件制限）
// 【修正】引数を文字列にも対応させる
function showEPNotification(message) {
    if (activeNotifications >= 2) return;

    let container = document.getElementById("notification-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "notification-container";
        document.body.appendChild(container);
    }

    activeNotifications++;
    const toast = document.createElement("div");
    toast.className = "toast";
    // 【修正】数値の場合のみtoLocaleString + EP表記、文字列はそのまま表示
    if (typeof message === "number") {
        toast.textContent = `+${message.toLocaleString()} EP 獲得しました`;
    } else {
        toast.textContent = message;
    }
    container.appendChild(toast);

    // 2秒後に消去
    setTimeout(() => {
        toast.remove();
        activeNotifications--;
    }, 2000);
}

// ビッグバン（転生）実行
function triggerBigBang(isAuto = false) {
    let epGain = 16;

    if (boughtNodes >= 3) epGain = Math.floor(epGain * 1.5);
    if (boughtNodes >= 8) epGain = Math.floor(epGain * 2);
    
    ep += epGain;

    showEPNotification(epGain);

    // 演出
    const flash = document.getElementById("flash-overlay");
    if (flash) {
        flash.style.background = "white";
        flash.style.opacity = "1";
        setTimeout(() => { flash.style.opacity = "0"; }, 500);
    }

    // リセット処理
    totalCells = 0;
    cells = [];
    goldenCell = null;   // 【追加】黄金セルもリセット
    blueCell = null;     // 【追加】青セルもリセット
    sparkles = [];       // 【追加】スパークルもリセット
    nextEvoIdx = 0;
    currentMultiplier = 1;
    feverTime = 0;       // 【追加】フィーバーもリセット
    clickFeverTime = 0;  // 【追加】クリックフィーバーもリセット
    window.clickFeverTime = 0;
    autoAccumulator = 0; // 【追加】自動生産アキュムレーターもリセット
    for (let k in items) items[k].count = 0;

    // UI更新
    const bbBtn = document.getElementById("bigbang-btn");
    if (bbBtn) bbBtn.style.display = "none";

    // フィーバーUI非表示
    const feverUi = document.getElementById("fever-ui");
    if (feverUi) feverUi.style.display = "none";
    const clickFeverUi = document.getElementById("click-fever-ui");
    if (clickFeverUi) clickFeverUi.style.display = "none";
    
    renderShop();
    renderEtc(); 
    updateCounter();
}

// 強化ツリー（星の記憶）の描画
function renderEtc() {
    const container = document.getElementById("etc-container");
    if (!container) return;

    container.innerHTML = `
        <h2>星の記憶 (転生)</h2>
        <div id="ep-display" style="font-size:24px; color:#00ffcc; margin-bottom:20px; font-weight:bold;">${ep.toLocaleString()} EP</div>
        <div class="tree-container" id="tree-root"></div>
    `;

    const root = document.getElementById("tree-root");
    if (ep === 0 && boughtNodes === 0) {
        root.innerHTML = "<p style='color:#555; margin-top:50px;'></p>";
        return;
    }

    const maxNodes = 15;
    const showLimit = Math.min(boughtNodes + 1, maxNodes);

    for (let i = 0; i < showLimit; i++) {
        const isBought = i < boughtNodes;
        const cost = getNextNodeCost(i);

        if (i > 0) {
            const line = document.createElement("div");
            line.className = "tree-line";
            if (!isBought) line.style.opacity = "0.3";
            root.appendChild(line);
        }

        const node = document.createElement("div");
        node.className = "tree-node";
        
        if (i === 14) node.classList.add("node-final");

        let bonusText = "永久倍率 +0.5x";
        if (i === 2) bonusText = "EP獲得量 1.5倍";
        if (i === 4) bonusText = "自動生産2倍 & 自動転生";
        if (i === 7) bonusText = "EP獲得量 さらに2倍";
        if (i === 9) bonusText = "フィーバー時間 2倍";
        if (i === 14) bonusText = "??? (究極の進化)";

        if (isBought) {
            node.style.background = "rgba(0, 255, 204, 0.4)";
            node.style.boxShadow = (i === 14) ? "none" : "0 0 15px #00ffcc";
            node.innerHTML = `星の記憶 [${i+1}]<br><span style="font-size:10px;">${bonusText}</span>`;
            node.style.cursor = "default";
        } else {
            node.innerHTML = `星の記憶 [${i+1}]<br><span style="font-size:10px; color:#ffcc00;">${bonusText}</span><br>必要: ${cost} EP`;
            node.onclick = () => {
                if (ep >= cost) {
                    ep -= cost;
                    boughtNodes++;
                    permanentMult += 0.5;
                    renderEtc();
                    updateCounter(); // 【追加】倍率表示を即座に更新
                } else {
                    alert("EPが足りません");
                }
            };
        }
        root.appendChild(node);
    }
}
