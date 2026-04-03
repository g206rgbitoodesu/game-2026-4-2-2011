// rebirth.js - 転生・強化ツリー・通知システム

let activeNotifications = 0;

const NODE_CONFIG = [
    {
        title: "青セル解放",
        description: "永久倍率 +0.5x / ブルーセルが出現開始",
        onUnlock: () => showEPNotification("🔓 ブルーセルが解放されました！")
    },
    {
        title: "星の記憶増幅",
        description: "永久倍率 +0.5x"
    },
    {
        title: "EP共鳴",
        description: "永久倍率 +0.5x / EP獲得量 1.5倍"
    },
    {
        title: "設備拡張 I",
        description: "永久倍率 +0.5x / 自動インキュベーター解放",
        onUnlock: () => showEPNotification("🔓 自動インキュベーターがショップに追加されました！")
    },
    {
        title: "自動進化機構",
        description: "永久倍率 +0.5x / 自動生産2倍 & 自動転生"
    },
    {
        title: "設備拡張 II",
        description: "永久倍率 +0.5x / 大型バイオリアクター解放",
        onUnlock: () => showEPNotification("🔓 大型バイオリアクターがショップに追加されました！")
    },
    {
        title: "星の記憶増幅 II",
        description: "永久倍率 +0.5x"
    },
    {
        title: "EP超共鳴",
        description: "永久倍率 +0.5x / EP獲得量 さらに2倍"
    },
    {
        title: "設備拡張 III",
        description: "永久倍率 +0.5x / CRISPR-Cas9解放",
        onUnlock: () => showEPNotification("🔓 CRISPR-Cas9がショップに追加されました！")
    },
    {
        title: "永続フィーバー研究",
        description: "永久倍率 +0.5x / フィーバー時間 2倍"
    },
    {
        title: "星核圧縮",
        description: "永久倍率 +0.5x"
    },
    {
        title: "次元安定化",
        description: "永久倍率 +0.5x"
    },
    {
        title: "宇宙記録",
        description: "永久倍率 +0.5x"
    },
    {
        title: "創世前夜",
        description: "永久倍率 +0.5x"
    },
    {
        title: "究極の進化",
        description: "永久倍率 +0.5x / ???"
    }
];

const ITEM_UNLOCK_NODES = {
    incubator: 4,
    bioreac: 6,
    crispr: 9
};

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

function getNodeInfo(index) {
    return NODE_CONFIG[index] || {
        title: `星の記憶 [${index + 1}]`,
        description: "永久倍率 +0.5x"
    };
}

function isBlueCellUnlocked() {
    return boughtNodes >= 1;
}

function getItemUnlockNode(itemKey) {
    return ITEM_UNLOCK_NODES[itemKey] || null;
}

function isItemUnlocked(itemKey) {
    const requiredNode = getItemUnlockNode(itemKey);
    if (!requiredNode) return true;
    return boughtNodes >= requiredNode;
}

window.isBlueCellUnlocked = isBlueCellUnlocked;
window.getItemUnlockNode = getItemUnlockNode;
window.isItemUnlocked = isItemUnlocked;

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
    toast.textContent = typeof message === "number"
        ? `+${message.toLocaleString()} EP 獲得しました`
        : message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
        activeNotifications--;
    }, 2000);
}

function triggerBigBang(isAuto = false) {
    let epGain = 16;
    bigBangCount++;
    if (boughtNodes >= 3) epGain = Math.floor(epGain * 1.5);
    if (boughtNodes >= 8) epGain = Math.floor(epGain * 2);

    ep += epGain;
    showEPNotification(epGain);

    const flash = document.getElementById("flash-overlay");
    if (flash) {
        flash.style.background = "white";
        flash.style.opacity = "1";
        setTimeout(() => { flash.style.opacity = "0"; }, 500);
    }

    totalCells = 0;
    cells = [];
    goldenCell = null;
    blueCell = null;
    sparkles = [];
    nextEvoIdx = 0;
    currentMultiplier = 1;
    feverTime = 0;
    clickFeverTime = 0;
    window.clickFeverTime = 0;
    autoAccumulator = 0;
    for (let k in items) items[k].count = 0;

    const bbBtn = document.getElementById("bigbang-btn");
    if (bbBtn) bbBtn.style.display = "none";

    const feverUi = document.getElementById("fever-ui");
    if (feverUi) feverUi.style.display = "none";
    const clickFeverUi = document.getElementById("click-fever-ui");
    if (clickFeverUi) clickFeverUi.style.display = "none";

    renderShop();
    renderEtc();
    updateCounter();
    if (typeof updateStats === "function") updateStats();

    if (!isAuto) {
        showEPNotification("🌌 ビッグバン発生！新たな星の記憶が刻まれました");
    }
}

function unlockNode(nodeIndex) {
    const cost = getNextNodeCost(nodeIndex);
    if (ep < cost) {
        alert("EPが足りません");
        return;
    }

    ep -= cost;
    boughtNodes++;
    permanentMult += 0.5;

    const nodeInfo = getNodeInfo(nodeIndex);
    if (typeof nodeInfo.onUnlock === "function") {
        nodeInfo.onUnlock();
    }

    renderEtc();
    renderShop();
    updateCounter();
    if (typeof updateStats === "function") updateStats();
}

function renderEtc() {
    const container = document.getElementById("etc-container");
    if (!container) return;

    container.innerHTML = `
        <h2>星の記憶 (転生)</h2>
        <div id="ep-display" style="font-size:24px; color:#00ffcc; margin-bottom:20px; font-weight:bold;">${Math.floor(ep).toLocaleString()} EP</div>
        <div style="font-size:12px; color:#bbb; margin-bottom:14px; line-height:1.7;">
            ブルーセルは <span style="color:#00ccff;">星の記憶[1]</span> で解放。<br>
            自動インキュベーター / 大型バイオリアクター / CRISPR-Cas9 は
            対応ノード解放後にショップへ追加されます。
        </div>
        <div class="tree-container" id="tree-root"></div>
    `;

    const root = document.getElementById("tree-root");
    if (ep === 0 && boughtNodes === 0) {
        root.innerHTML = "<p style='color:#555; margin-top:50px;'>EPを獲得すると星の記憶を解放できます。</p>";
        return;
    }

    const maxNodes = NODE_CONFIG.length;
    const showLimit = Math.min(boughtNodes + 1, maxNodes);

    for (let i = 0; i < showLimit; i++) {
        const isBought = i < boughtNodes;
        const cost = getNextNodeCost(i);
        const info = getNodeInfo(i);

        if (i > 0) {
            const line = document.createElement("div");
            line.className = "tree-line";
            if (!isBought) line.style.opacity = "0.3";
            root.appendChild(line);
        }

        const node = document.createElement("div");
        node.className = "tree-node";
        if (i === maxNodes - 1) node.classList.add("node-final");

        if (isBought) {
            node.style.background = "rgba(0, 255, 204, 0.4)";
            node.style.boxShadow = (i === maxNodes - 1) ? "none" : "0 0 15px #00ffcc";
            node.style.cursor = "default";
            node.innerHTML = `${info.title}<br><span style="font-size:10px;">${info.description}</span>`;
        } else {
            node.innerHTML = `${info.title}<br><span style="font-size:10px; color:#ffcc00;">${info.description}</span><br>必要: ${cost.toLocaleString()} EP`;
            node.onclick = () => unlockNode(i);
        }

        root.appendChild(node);
    }
}
