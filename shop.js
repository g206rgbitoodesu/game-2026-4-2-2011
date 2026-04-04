const items = {
    dmem: { name: "DMEM (培養液)", count: 0, basePrice: 20, rate: 1.15, sps: 0.1, color: "#6ec1e4", desc: "10秒に1個生成" },
    fbs: { name: "FBS (胎児牛血清)", count: 0, basePrice: 150, rate: 1.15, sps: 1.0, color: "#ff99cc", desc: "毎秒1個生成" },
    high: { name: "高浸透圧プロトコル", count: 0, basePrice: 2000, rate: 1.15, sps: 8.0, color: "#99ff99", desc: "毎秒8個生成" },
    micro: { name: "マイクロキャリア", count: 0, basePrice: 11000, rate: 1.15, sps: 110.0, color: "#ffcc00", desc: "毎秒110個生成" },
    growth: { name: "増殖因子", count: 0, basePrice: 120000, rate: 1.15, sps: 1000.0, color: "#ff6666", desc: "毎秒1,000個生成" },
    gluta: { name: "GlutaMAX添加", count: 0, basePrice: 1700000, rate: 1.15, sps: 10000.0, color: "#9966ff", desc: "毎秒10,000個生成" },
    incubator: { name: "自動インキュベーター", count: 0, basePrice: 25000000, rate: 1.15, sps: 85000.0, color: "#ffaa00", desc: "毎秒85,000個生成" },
    bioreac: { name: "大型バイオリアクター", count: 0, basePrice: 400000000, rate: 1.15, sps: 600000.0, color: "#00ffff", desc: "毎秒600,000個生成" },
    crispr: { name: "CRISPR-Cas9", count: 0, basePrice: 5000000000, rate: 1.15, sps: 5000000.0, color: "#ff33ff", desc: "毎秒5,000,000個生成" }
};

function getTotalSpsForBoost() {
    let totalSps = 0;
    for (const key in items) {
        if (Object.hasOwn(items, key)) { // Ensures only items' properties are looped
            totalSps += items[key].count * items[key].sps;
        }
    }
    if (typeof boughtNodes !== "undefined" && boughtNodes >= 5) {
        totalSps *= 2;
    }
    return totalSps;
}

function getItemPrice(item, amount) {
    let total = 0;
    for (let i = 0; i < amount; i++) {
        total += Math.floor(item.basePrice * Math.pow(item.rate, item.count + i));
    }
    return total;
}

function isShopItemUnlocked(id) {
    if (typeof isItemUnlocked === "function") {
        return isItemUnlocked(id);
    }
    return true; // Default condition if the unlock function isn't defined
}

function buyItem(id, amount) {
    const item = items[id];
    if (!item) {
        return;
    }

    if (!isShopItemUnlocked(id)) {
        const needNode = typeof getItemUnlockNode === "function" ? getItemUnlockNode(id) : null;
        alert(needNode ? `この設備は[${needNode}]で解放されます` : "まだ解放されていません");
        return;
    }

    if (amount === "max") {
        while (totalCells >= getItemPrice(item, 1)) {
            const price = getItemPrice(item, 1);
            totalCells -= price;
            item.count++;
        }
    } else {
        const price = getItemPrice(item, amount);
        if (totalCells >= price) {
            totalCells -= price;
            item.count += amount;
        }
    }

    renderShop();
    updateCounter();
    if (typeof updateStats === "function") {
        updateStats();
    }
}

/**
 * 次に解放されるアイテム（シルエット）を表示する関数
 */
function renderLockedItem(container, key, item) {
    const needNode = typeof getItemUnlockNode === "function" ? getItemUnlockNode(key) : "?";
    const div = document.createElement("div");
    div.className = "upgrade-item";

    // シルエット用のスタイル
    div.style.borderColor = "#444";
    div.style.background = "rgba(20, 20, 20, 0.8)";
    div.style.opacity = "0.6";

    div.innerHTML = `
        <div style="font-size:18px; font-weight:bold; color:#666; filter: blur(2px);">🔒 ${item.name}</div>
        <div style="font-size:12px; margin:8px 0; color:#444; filter: blur(3px);">${item.desc}</div>
        <div style="font-size:12px; color:#aa8800; line-height:1.6; font-weight:bold;">
            星の記憶 [${needNode}] を解放してアンロック
        </div>
        <div style="font-size:11px; color:#444; margin-top:8px;">価格: ???</div>
        <div class="buy-group" style="filter: grayscale(1);">
            <button class="buy-btn" disabled>×1</button>
            <button class="buy-btn" disabled>×10</button>
            <button class="buy-btn max" disabled>MAX</button>
        </div>
    `;
    container.appendChild(div);
}

/**
 * ショップ画面の描画（「次の一つ」だけシルエットにする版）
 */
function renderShop() {
    const container = document.getElementById("shop-container");
    if (!container) return;
    container.innerHTML = "";

    let silhouetteShown = false; // シルエットを1つ出したかどうかのフラグ

    for (let key in items) {
        const item = items[key];
        const isUnlocked = isShopItemUnlocked(key);

        if (isUnlocked) {
            // --- 解放済みアイテムの描画 ---
            let badgeHtml = "";

            // 特定アイテムの特殊バッジ（儀式など）
            if (key === "dmem" && item.count >= 75) {
                badgeHtml = `<div class="click-bonus-badge">クリックの強さ上昇</div>`;
            }
            if (key === "fbs" && item.count >= 115) {
                const currentSps = typeof getTotalSpsForBoost === "function" ? getTotalSpsForBoost() : 0;
                const sacrificeCost = Math.floor(currentSps * 60 * 7);
                badgeHtml = `
                    <div class="click-bonus-badge"
                         style="background:#ff33ff; color:white; cursor:pointer; pointer-events:auto; font-size: 9px;"
                         onclick="event.stopPropagation(); activateSacrificeBoost(${sacrificeCost})">
                        【儀式】${sacrificeCost.toLocaleString()} 消費<br>20秒間 クリック5倍
                    </div>`;
            }

            // 価格計算（getItemPrice関数が他で定義されている前提）
            const price1 = getItemPrice(item, 1);
            const price10 = getItemPrice(item, 10);

            const div = document.createElement("div");
            div.className = "upgrade-item";
            div.style.borderColor = item.color;
            div.style.position = "relative";
            div.innerHTML = `
                ${badgeHtml}
                <div style="font-size:18px; font-weight:bold;">${item.name}</div>
                <div style="font-size:12px; margin:4px 0; color:#bbb;">${item.desc}</div>
                <div style="font-size:14px; margin-bottom:5px;">Lv: ${item.count} | 次: ${price1.toLocaleString()}</div>
                <div class="buy-group">
                    <button class="buy-btn" onclick="buyItem('${key}', 1)" ${totalCells < price1 ? "disabled" : ""}>×1</button>
                    <button class="buy-btn" onclick="buyItem('${key}', 10)" ${totalCells < price10 ? "disabled" : ""}>×10</button>
                    <button class="buy-btn max" onclick="buyItem('${key}', 'max')" ${totalCells < price1 ? "disabled" : ""}>MAX</button>
                </div>
            `;
            container.appendChild(div);

        } else if (!silhouetteShown) {
            // --- 未解放だが、「次の1つ目」なのでシルエット表示 ---
            renderLockedItem(container, key, item);
            silhouetteShown = true; // 1つ出したので、これ以降の未解放品は無視される
        } else {
            // --- すでにシルエットを出した後の未解放品は表示しない ---
            continue;
        }
    }
}

/**
 * 儀式（極限ブースト）実行関数
 */
function activateSacrificeBoost(cost) {
    // clickFeverTime が game.js などで定義されている必要があります
    if (typeof clickFeverTime !== "undefined" && clickFeverTime <= 0 && totalCells >= cost) {
        totalCells -= cost;
        clickFeverTime = 20;
        if (typeof totalSacrifices !== "undefined") totalSacrifices++;
        
        updateCounter();
        renderShop();
        if (typeof updateStats === "function") updateStats();
    } else if (totalCells < cost) {
        alert("細胞が足りません！");
    }
}
