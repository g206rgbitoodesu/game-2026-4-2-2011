// tutorial.js - 初心者救済：開始3分半で「一度だけ」出現
(function() {
    const RESCUE_TIME = 210000; // 210000ms = 3分半
    
    const rescueTimer = setTimeout(() => {
        if (typeof feverTime !== 'undefined' && feverTime <= 0 && !goldenCell) {
            if (typeof createCell === 'function') {
                console.log("最初のゴールデンセルを召喚します");
                
                // 【修正】boolean true ではなく文字列 "golden" を渡す
                createCell(window.innerWidth / 2, window.innerHeight / 2, "golden");
                              
                if (typeof showEPNotification === 'function') {
                            showEPNotification("クリックして");
                }
            }
        }
    }, RESCUE_TIME);

    // 自力でゴールデンセルを出現させた場合は救済を中止
    const cancelCheck = setInterval(() => {
        if ((typeof feverTime !== 'undefined' && feverTime > 0) || goldenCell) {
            console.log("運がいいんだね");
            clearTimeout(rescueTimer);
            clearInterval(cancelCheck);
        }
    }, 2000);
})();
