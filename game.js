const MAX_CELLS = 240;
const canvas = document.getElementById("canvas");  
const ctx = canvas.getContext("2d");  

// ★ ここに必要な変数をすべてまとめて定義する
let cells = [], sparkles = [], totalCells = 0;  
let ep = 0, permanentMult = 1, currentMultiplier = 1;  
let feverTime = 0, goldenCell = null, blueCell = null, nextEvoIdx = 0;
let epMultiplier = 1;
let boughtNodes = 0;   
let currentScreen = 1;
let totalClicks = 0;     
let specialClicks = 0;    
let totalSacrifices = 0;
let bigBangCount = 0; 
let clickFeverTime = 0; 
window.clickFeverTime = 0;
if (typeof gameSpeed === 'undefined') {
    window.gameSpeed = 1.0; 
}

window.setSpeed = (s) => { 
    gameSpeed = s; 
    console.log("Current Speed:", gameSpeed);
};

const evoList = [  
    { name: "ダンゴムシ", threshold: 10000 }, { name: "小鳥", threshold: 100000 },  
    { name: "人間", threshold: 1000000 }, { name: "鯨", threshold: 50000000 },  
    { name: "地球", threshold: 1000000000 }, { name: "太陽系", threshold: 100000000000 },  
    { name: "銀河団", threshold: 10000000000000 }, { name: "宇宙", threshold: 1000000000000000 }  
];  

function resize() {  
    canvas.width = window.innerWidth;  
    canvas.height = window.innerHeight;  
}  
window.addEventListener("resize", resize);  
resize();  

// 【追加】進化演出フラッシュ関数（元は未定義だった）
function showEvolutionFlash() {
    const flash = document.getElementById("flash-overlay");
    if (flash) {
        flash.style.background = "#ffea00";
        flash.style.opacity = "0.7";
        setTimeout(() => { 
            flash.style.opacity = "0"; 
            // フラッシュ終了後に白に戻す
            setTimeout(() => { flash.style.background = "white"; }, 500);
        }, 300);
    }
}

function updateCounter() {  
    const cellCountElem = document.getElementById("cellCount");  
    if (cellCountElem) {
        cellCountElem.textContent = Math.floor(totalCells).toLocaleString();  
    }

    // --- 1. 進化判定と倍率の更新 ---
    while (nextEvoIdx < evoList.length && totalCells >= evoList[nextEvoIdx].threshold) {
        nextEvoIdx++; 
        currentMultiplier = Math.pow(2, nextEvoIdx); 
        if (typeof showEvolutionFlash === "function") showEvolutionFlash();
    }																																																																														

    // プログレスバーの更新（【修正】範囲外アクセスを防止）
    if (nextEvoIdx < evoList.length) {
        const threshold = evoList[nextEvoIdx].threshold;  
        const prevThreshold = nextEvoIdx > 0 ? evoList[nextEvoIdx - 1].threshold : 0;  
        let progress = ((totalCells - prevThreshold) / (threshold - prevThreshold)) * 100;  
        const progressBar = document.getElementById("evo-progress-bar");  
        if (progressBar) {
            progressBar.style.height = Math.min(100, Math.max(0, progress)) + "%";  
        }
    } else {			
        // 全進化終了
        const progressBar = document.getElementById("evo-progress-bar");
        if (progressBar) progressBar.style.height = "100%";
    }

    // --- 2. 画面表示（形態名・合計倍率）の更新 ---
    const statusElem = document.getElementById("evo-status");  
    if (statusElem) {  
        const currentName = nextEvoIdx > 0 ? evoList[nextEvoIdx - 1].name : "単細胞生物";  
        statusElem.textContent = `形態: ${currentName} (x${(currentMultiplier * permanentMult).toLocaleString()})`;  
    }  

    // --- 3. メニュー（強化ツリー）の表示切り替え ---
    const menuEtc = document.getElementById("menu-etc");  
    if (menuEtc && (ep > 0 || boughtNodes > 0)) {  
        if (menuEtc.textContent !== "強化ツリー") {
            menuEtc.textContent = "強化ツリー";  
        }
    }  

    // --- 4. BIG BANG（転生）ボタンの表示判定 ---
    const bbBtn = document.getElementById("bigbang-btn");  
    if (bbBtn) {
        if (nextEvoIdx >= evoList.length && totalCells >= 1000000000000000) {
            if (boughtNodes >= 5) {
                if (typeof triggerBigBang === "function") triggerBigBang(true); 
            } else {
                bbBtn.style.display = "block";
            }
        } else {
            bbBtn.style.display = "none";
        }
    }
}

function animate() {  
    ctx.clearRect(0, 0, canvas.width, canvas.height);  
    sparkles = sparkles.filter(s => s.life > 0);  
    sparkles.forEach(s => { s.update(); s.draw(); });  
    cells = cells.filter(c => c.x > -50 && c.x < canvas.width + 50 && c.y > -50 && c.y < canvas.height + 50);  
    cells.forEach(c => { c.update(); c.draw(); });  

    if (goldenCell) {  
        goldenCell.update();  
        goldenCell.draw();  
    }
    // 【追加】青セルの描画
    if (blueCell) {
        blueCell.update();
        blueCell.draw();
    }
    requestAnimationFrame(animate);  
}  
animate();  

function handleMainClick(x, y) {
    // クリックで数値を加算（isClick = true で呼び出す）
    createCell(x, y, null, true);
}

function handleAction(x, y) {  
    // 1. 黄金セルの処理
totalClicks++;
    if (goldenCell) {
        const dx = x - goldenCell.x;
        const dy = y - goldenCell.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
            // ★追加: 特殊セルクリック数を+1
            specialClicks++; 
            
            feverTime = (boughtNodes >= 10) ? 360 : 180;
            goldenCell = null;
            cells = cells.filter(c => c.specialType !== "golden");
            for (let i = 0; i < 20; i++) sparkles.push(new Sparkle(x, y, "255, 204, 0"));
            updateCounter();
            return;
        }
    }  

  // 2. 青色セルの処理
    if (blueCell) {
        const dx = x - blueCell.x;
        const dy = y - blueCell.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
            // ★追加: 特殊セルクリック数を+1
            specialClicks++; 

            let gain = currentMultiplier * permanentMult * 500;
            totalCells += gain;
            blueCell = null;
            cells = cells.filter(c => c.specialType !== "blue");
            for (let i = 0; i < 20; i++) sparkles.push(new Sparkle(x, y, "0, 204, 255"));
            updateCounter();
            return;
        }
    }





    // 3. 数字を増やす処理
    handleMainClick(x, y); 
	updateCounter();  
}

// 【追加】クリック・タッチイベントリスナー（元は完全に欠落していた）
canvas.addEventListener("click", function(e) {
    e.preventDefault();
    handleAction(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    handleAction(touch.clientX, touch.clientY);
}, { passive: false });

// 画面切り替え機能
// --- 画面切り替え機能 ---
function showScreen(n) {  
    currentScreen = n;

    // 1. 画面をスライドさせる（n-1 × 100vw分動かす）
    document.getElementById("container").style.transform = `translateX(-${(n - 1) * 100}vw)`;  
    
    // 2. メイン画面(n=1)以外ではカウンターを隠す
    document.getElementById("counter").style.opacity = (n === 1) ? "1" : "0";  
    
    // 3. フィーバーUIの表示制御
    const feverUi = document.getElementById("fever-ui");
    if (feverUi) {
        feverUi.style.display = (n === 1 && feverTime > 0) ? "block" : "none";
    }

    const clickFeverUi = document.getElementById("click-fever-ui");
    if (clickFeverUi) {
        clickFeverUi.style.display = (n === 1 && window.clickFeverTime > 0) ? "block" : "none";
    }

    // 4. 各画面を開いた時の更新処理
    if (n === 2 && typeof renderShop === "function") renderShop();  
    if (n === 3 && typeof renderEtc === "function") renderEtc();  
    
    // 5. 【追加】その他画面(n=4)を開いた時に統計数値を更新する
    if (n === 4) {
        updateStats(); // 統計値を最新にする関数（後で作ります）
    }
} // <--- ここで showScreen 関数が確実に終わっていることを確認！

let autoAccumulator = 0;  

// タイマーは1つだけにします
setInterval(() => {  
    if (typeof items === "undefined") return;  
    
    let totalSps = 0;  
    for (let key in items) totalSps += items[key].count * items[key].sps;  
    if (typeof boughtNodes !== "undefined" && boughtNodes >= 5) totalSps *= 2;  
    
    // 0.1秒ごとの加算分
    autoAccumulator += (totalSps / 10);  

    if (autoAccumulator >= 1) {  
        let count = Math.floor(autoAccumulator);  
        
        // --- 視覚用セルの生成 ---
        // 画面上のセルが上限未満のときだけ作る
        for (let i = 0; i < Math.min(count, 3); i++) {
            if (cells.length < MAX_CELLS && typeof Cell === "function") {
                const posX = Math.random() * (canvas.width - 40) + 20;
                const posY = Math.random() * (canvas.height - 40) + 20;
                cells.push(new Cell(posX, posY, null));
            }
        }

        // --- 数値の加算 ---
        let power = (typeof currentMultiplier !== "undefined") ? currentMultiplier : 1;
        let feverMult = (typeof feverTime !== "undefined" && feverTime > 0) ? 7 : 1;
        
        // セルが画面に表示できなくても、数値（totalCells）はしっかり増やす
        totalCells += count * feverMult * power * permanentMult;

        autoAccumulator -= count;  
        if (typeof updateCounter === "function") updateCounter();  
    }  
}, 100);

// フィーバータイマー & セル出現タイマー
setInterval(() => {  
    // ノード解放状況に応じて特殊セルを出現させる
    if (!goldenCell && !blueCell) {
        const blueUnlocked = (typeof isBlueCellUnlocked === "function") ? isBlueCellUnlocked() : false;
        const r = Math.random();

        if (blueUnlocked) {
            if (r < 1 / 600) {
                createCell(undefined, undefined, "blue");
            } else if (r < 1 / 600 + 1 / 400) {
                createCell(undefined, undefined, "golden");
            }
        } else if (r < 1 / 400) {
            createCell(undefined, undefined, "golden");
        }
    }


// 100秒ごとにチェックし、200個を超えていれば1つ消す
setInterval(() => {
    // セルの数が200より多い（201個以上ある）場合のみ実行
    if (cells.length > 230) {
        cells.shift(); // 一番古いセルを削除
           }
}, 1000);

    // フィーバータイマー
    if (feverTime > 0) {  
        feverTime--;  
        const feverUi = document.getElementById("fever-ui");  
        const feverTimer = document.getElementById("fever-timer");  
        if (feverUi && feverTimer) {  
            if (currentScreen === 1) feverUi.style.display = "block";
            else feverUi.style.display = "none";
            feverTimer.textContent = feverTime;  
        }  
    } else {  
        const feverUi = document.getElementById("fever-ui");  
        if (feverUi) feverUi.style.display = "none";  
    }

    // クリックフィーバーのカウントダウン
    if (clickFeverTime > 0) {
        clickFeverTime--;
        window.clickFeverTime = clickFeverTime;
        const clickFeverUi = document.getElementById("click-fever-ui");
        const clickFeverTimer = document.getElementById("click-fever-timer");
        if (clickFeverUi && clickFeverTimer) {
            if (currentScreen === 1) clickFeverUi.style.display = "block";
            else clickFeverUi.style.display = "none";
            clickFeverTimer.textContent = clickFeverTime;
        }
    } else {
        const clickFeverUi = document.getElementById("click-fever-ui");
        if (clickFeverUi) clickFeverUi.style.display = "none";
    }
}, 1000);


// デバッグモード起動プログラム
window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault(); 
        
        const existingDebug = document.getElementById('debug-window');
        if (existingDebug) {
            existingDebug.remove();
            return;
        }

        const div = document.createElement('div');
        div.id = 'debug-window';
        div.style.cssText = 'position:fixed;top:70px;right:10px;z-index:9999;background:rgba(0,0,0,0.9);color:white;padding:15px;border-radius:10px;border:2px solid #00ffcc;font-family:monospace;box-shadow:0 -5px 20px rgba(0,255,204,0.5);width:180px;';
        
        div.innerHTML = `
            <div style="margin-bottom:10px;font-weight:bold;color:#00ffcc;border-bottom:1px solid #00ffcc;text-align:center;">DEBUG MODE</div>
            
            <div style="margin-bottom:12px;">
                <label style="font-size:12px;">細胞数変更:</label><br>
                <input type="number" id="debug-cell-input" style="width:100px;background:#222;color:white;border:1px solid #555;padding:2px;">
                <button id="set-cells-btn" style="cursor:pointer;background:#00ffcc;color:black;border:none;padding:2px 5px;border-radius:3px;">設定</button>
            </div>

            <div style="margin-bottom:12px;">
                <label style="font-size:12px;">EP変更:</label><br>
                <input type="number" id="debug-ep-input" style="width:100px;background:#222;color:white;border:1px solid #555;padding:2px;">
                <button id="set-ep-btn" style="cursor:pointer;background:#00ffcc;color:black;border:none;padding:2px 5px;border-radius:3px;">設定</button>
            </div>

            <div style="margin-bottom:10px;">
                <button id="spawn-golden-btn" style="width:100%;cursor:pointer;background:#ffcc00;color:black;border:none;padding:5px;border-radius:3px;font-weight:bold;">✨ 黄金セルを召喚</button>
            </div>

            <div style="font-size:10px;color:#888;text-align:center;">Ctrl+D で閉じる</div>
        `;
        document.body.appendChild(div);

        document.getElementById('set-cells-btn').onclick = function() {
            const val = parseFloat(document.getElementById('debug-cell-input').value);
            if (!isNaN(val)) {
                totalCells = val;
                // 【修正】進化状態も再計算
                nextEvoIdx = 0;
                while (nextEvoIdx < evoList.length && totalCells >= evoList[nextEvoIdx].threshold) nextEvoIdx++;
                currentMultiplier = Math.pow(2, nextEvoIdx);
                if (typeof updateCounter === 'function') updateCounter();
            }
        };

        document.getElementById('set-ep-btn').onclick = function() {
            const val = parseFloat(document.getElementById('debug-ep-input').value);
            if (!isNaN(val)) {
                ep = val;
                const epDisplay = document.getElementById("ep-display");
                if (epDisplay) epDisplay.textContent = `${Math.floor(ep).toLocaleString()} EP`;
            }
        };

        // 【修正】"golden" 文字列を正しく渡す（元は boolean true だった）
        document.getElementById('spawn-golden-btn').onclick = function() {
            if (typeof createCell === 'function') {
                createCell(window.innerWidth / 2, window.innerHeight / 2, "golden");
            }
        };
    }
});
//ーーーーーーmenuのカウントjs--------------------------------------------------------------
function updateStats() {
    // 1. CPC (1クリック生成数) の計算 (cells.jsのロジックと同期)
    let clickPower = currentMultiplier; 
    if (typeof items !== 'undefined' && items.dmem && items.dmem.count >= 75) {
        clickPower += 150000 + (items.dmem.count - 75) * 2000;
    }
    if (typeof items !== 'undefined' && items.fbs && items.fbs.count >= 115 && feverTime > 0) {
        let currentSps = 0;
        for (let k in items) currentSps += items[k].count * items[k].sps;
        if (typeof boughtNodes !== 'undefined' && boughtNodes >= 5) currentSps *= 2;
        clickPower = currentSps * 10;
    }
    let feverMult = (typeof feverTime !== 'undefined' && feverTime > 0 ? 7 : 1);
    let clickFeverMult = (window.clickFeverTime > 0 ? 5 : 1);
    let finalCpc = feverMult * clickFeverMult * clickPower * permanentMult;
    
    // 2. SPS (毎秒生産量) の計算
    let totalSps = 0;
    let upgCount = 0;
    if (typeof items !== 'undefined') {
        for (let k in items) {
            totalSps += items[k].count * items[k].sps;
            upgCount += items[k].count;
        }
    }
    if (typeof boughtNodes !== 'undefined' && boughtNodes >= 5) totalSps *= 2;

    // 3. 画面への反映
    document.getElementById("stat-current-cells").textContent = Math.floor(totalCells).toLocaleString();
    document.getElementById("stat-cpc").textContent = Math.floor(finalCpc).toLocaleString();
    document.getElementById("stat-sps").textContent = Math.floor(totalSps).toLocaleString();
    document.getElementById("stat-upgrades").textContent = upgCount.toLocaleString();

    // 4. 追加した統計データの反映
    const statClicks = document.getElementById("stat-total-clicks");
    if (statClicks) statClicks.textContent = totalClicks.toLocaleString();

    const statSpecial = document.getElementById("stat-special-clicks");
    if (statSpecial) statSpecial.textContent = specialClicks.toLocaleString();

    const statSacrifices = document.getElementById("stat-total-sacrifices");
    if (statSacrifices) statSacrifices.textContent = totalSacrifices.toLocaleString();

    const statBigBang = document.getElementById("stat-bigbang-count");
    if (statBigBang) statBigBang.textContent = (typeof bigBangCount !== 'undefined' ? bigBangCount : 0).toLocaleString() + " 回";
}

//自動遷移
function selectItem(name) {
    document.getElementById('selected-text').innerText = name;
    document.getElementById('menu-trigger').checked = false;
    // ここに将来、数字の表示形式を変えるロジックを追加します
}
function setupMenuHover() {
    const menuItems = document.querySelectorAll("#menu div");
    
    menuItems.forEach((item, index) => {
        // マウスが乗ったとき
        item.onmouseenter = () => {
            // 現在の画面の次の画面（index + 1）へ移動する準備
            // 既にその画面にいる場合は何もしない
            if (currentScreen === index + 1) return;

            // 1000ms (1秒) 後に実行
            hoverTimer = setTimeout(() => {
                showScreen(index + 1);
            }, 600);
        };

        // マウスが離れたとき
        item.onmouseleave = () => {
            // 1秒経つ前に離れたらタイマーを解除する
            clearTimeout(hoverTimer);
        };
    });
}

// ページ読み込み時に実行
window.addEventListener("DOMContentLoaded", setupMenuHover);


// 画面端ホバー遷移用の設定
(function() {
    let edgeTimer = null;
    let hoverSide = null; // "left" or "right"

    // 判定用の透明なエリアを作成して配置
    function createEdgeDetector(side) {
        const div = document.createElement("div");
        div.style.position = "fixed";
        div.style.top = "0";
        div.style.bottom = "0";
        div.style.width = "40px"; // 判定する幅（40px）
        div.style.zIndex = "9999";
        div.style.cursor = "pointer";
        // 開発中に範囲を確認したい場合は下を "rgba(255,0,0,0.2)" にしてください
        div.style.background = "transparent"; 

        if (side === "left") {
            div.style.left = "0";
        } else {
            div.style.right = "0";
        }

        div.onmouseenter = () => {
            hoverSide = side;
            // 600ms (1秒) 後に実行
            edgeTimer = setTimeout(() => {
                if (hoverSide === "right") {
                    // 右端：現在の画面が4未満なら+1
                    if (currentScreen < 4) showScreen(currentScreen + 1);
                } else {
                    // 左端：現在の画面が1より大きければ-1
                    if (currentScreen > 1) showScreen(currentScreen - 1);
                }
            }, 600);
        };

        div.onmouseleave = () => {
            clearTimeout(edgeTimer);
            hoverSide = null;
        };

        document.body.appendChild(div);
    }

    // 実行
    window.addEventListener("DOMContentLoaded", () => {
        createEdgeDetector("left");
        createEdgeDetector("right");
    });
})();
