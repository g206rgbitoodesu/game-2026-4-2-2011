const items = {  
    dmem: { name: "DMEM (培養液)", count: 0, basePrice: 20, rate: 1.15, sps: 0.1, color: "#6ec1e4", desc: "10秒に1個生成" },  
    fbs:  { name: "FBS (胎児牛血清)", count: 0, basePrice: 150, rate: 1.15, sps: 1.0, color: "#ff99cc", desc: "毎秒1個生成" },  
    high: { name: "高浸透圧プロトコル", count: 0, basePrice: 2000, rate: 1.15, sps: 8.0, color: "#99ff99", desc: "毎秒8個生成" },  
    micro: { name: "マイクロキャリア", count: 0, basePrice: 11000, rate: 1.15, sps: 110.0, color: "#ffcc00", desc: "毎秒110個生成" },  
    growth: { name: "増殖因子", count: 0, basePrice: 120000, rate: 1.15, sps: 1000.0, color: "#ff6666", desc: "毎秒1,000個生成" },  
    gluta: { name: "GlutaMAX添加", count: 0, basePrice: 1700000, rate: 1.15, sps: 10000.0, color: "#9966ff", desc: "毎秒10,000個生成" },
    incubator: { name: "自動インキュベーター", count: 0, basePrice: 25000000, rate: 1.15, sps: 85000.0, color: "#ffaa00", desc: "毎秒85,000個生成" },
    bioreac: { name: "大型バイオリアクター", count: 0, basePrice: 400000000, rate: 1.15, sps: 600000.0, color: "#00ffff", desc: "毎秒600,000個生成" },
    crispr: { name: "CRISPR-Cas9", count: 0, basePrice: 5000000000, rate: 1.15, sps: 5000000.0, color: "#ff33ff", desc: "毎秒5,000,000個生成" }
};

function buyItem(id, amount) {  
    const item = items[id];  
    if (!item) return; // 【追加】存在チェック
    const getP = (num) => {  
        let t = 0;  
        for (let i = 0; i < num; i++) t += Math.floor(item.basePrice * Math.pow(item.rate, item.count + i));  
        return t;  
    };  
    if (amount === 'max') {  
        while (totalCells >= getP(1)) { totalCells -= getP(1); item.count++; }  
    } else {  
        let p = getP(amount);  
        if (totalCells >= p) { totalCells -= p; item.count += amount; }  
    }  
    renderShop();  
    updateCounter();  
}  

function renderShop() {
    const container = document.getElementById("shop-container");
    if (!container) return;
    container.innerHTML = "";

    for (let key in items) {
        const item = items[key];
        const getP = (num) => {
            let t = 0;
            for (let i = 0; i < num; i++) {
                t += Math.floor(item.basePrice * Math.pow(item.rate, item.count + i));
            }
            return t;
        };

        let badgeHtml = "";
        // DMEM 75個ボーナス
        if (key === "dmem" && item.count >= 75) {
            badgeHtml = `<div class="click-bonus-badge">クリックの強さ上昇</div>`;
        }

        // FBS 115個ボーナス：クリックフィーバーボタン
        if (key === "fbs" && item.count >= 115) {
            let currentSps = 0;
            for (let k in items) currentSps += items[k].count * items[k].sps;
            if (typeof boughtNodes !== "undefined" && boughtNodes >= 5) currentSps *= 2; 

            let sacrificeCost = Math.floor(currentSps * 60 * 7);
            
            // 【修正】pointer-eventsをautoに設定してクリック可能に
            badgeHtml = `
                <div class="click-bonus-badge" 
                     style="background:#ff33ff; color:white; cursor:pointer; pointer-events:auto; font-size: 9px;"
                     onclick="event.stopPropagation(); activateSacrificeBoost(${sacrificeCost})">
                    【儀式】${sacrificeCost.toLocaleString()} 消費<br>20秒間 クリック5倍
                </div>`;
        }

        const div = document.createElement("div");
        div.className = "upgrade-item";
        div.style.borderColor = item.color;
        div.style.position = "relative";

        div.innerHTML = `
            ${badgeHtml}
            <div style="font-size:18px; font-weight:bold;">${item.name}</div>
            <div style="font-size:12px; margin:4px 0; color:#bbb;">${item.desc}</div>
            <div style="font-size:14px; margin-bottom:5px;">Lv: ${item.count} | Next: ${getP(1).toLocaleString()}</div>
            <div class="buy-group">
                <button class="buy-btn" onclick="buyItem('${key}', 1)" ${totalCells < getP(1) ? 'disabled' : ''}>×1</button>
                <button class="buy-btn" onclick="buyItem('${key}', 10)" ${totalCells < getP(10) ? 'disabled' : ''}>×10</button>
                <button class="buy-btn max" onclick="buyItem('${key}', 'max')" ${totalCells < getP(1) ? 'disabled' : ''}>MAX</button>
            </div>
        `;
        container.appendChild(div);
    }
}

// 儀式実行関数
function activateSacrificeBoost(cost) {
    if (clickFeverTime > 0) {
        alert("すでにクリックフィーバー中です！");
    } else if (totalCells >= cost) {
        totalCells -= cost;
        clickFeverTime = 20;
        window.clickFeverTime = 20;
        updateCounter();
        renderShop();
    } else {
        alert("細胞が足りません！");
    }
}
