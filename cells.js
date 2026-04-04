class Sparkle {
    constructor(x, y, colorStr) {
        this.x = x; this.y = y; this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 2; this.vy = (Math.random() - 0.5) * 2; this.life = 1.0;
        this.colorStr = colorStr || "255, 204, 0";
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.02; }
    draw() { 
        ctx.fillStyle = `rgba(${this.colorStr}, ${this.life})`; 
        ctx.fillRect(this.x, this.y, this.size, this.size); 
    }
}

class Cell {
    constructor(x, y, specialType = null) {
        this.x = x; 
        this.y = y; 
        this.specialType = specialType; 
        this.r = specialType ? 40 : 20; 

        const speedMult = specialType ? 2 : 8;
        this.vx = (Math.random() - 0.5) * speedMult;
        this.vy = (Math.random() - 0.5) * speedMult;
        
        if (specialType === "golden") this.color = "#ffcc00";
        else if (specialType === "blue") this.color = "#00ccff";
        else this.color = `hsl(${Math.random() * 360}, 75%, 65%)`;
    }

    update() {
        if (!this.specialType) {
            // 1. 通常セルの減衰
            this.vx *= 0.96; 
            this.vy *= 0.96;

            // 2. 細胞同士の反発
            for (let other of cells) {
                if (this === other || other.specialType) continue; 
                let dx = other.x - this.x;
                let dy = other.y - this.y;
                let distSq = dx * dx + dy * dy;
                let minDist = this.r + other.r; 

                if (distSq < minDist * minDist) {
                    let angle = Math.atan2(dy, dx);
                    let push = (minDist - Math.sqrt(distSq)) * 0.15;
                    this.vx -= Math.cos(angle) * push;
                    this.vy -= Math.sin(angle) * push;
                }
            }
        }
if (this.specialtype) {
    const bounceAccel = 1.0;
    
        // 3. 座標の更新
        this.x += this.vx;
        this.y += this.vy;


            // 横壁の判定
            if (this.x - this.r < 0) {
                this.x = this.r;
                this.vx *= -bounceAccel;
                this.vy *= bounceAccel; // 斜めに鋭く加速させるため両方の軸を増幅
            } else if (this.x + this.r > canvas.width) {
                this.x = canvas.width - this.r;
                this.vx *= -bounceAccel;
                this.vy *= bounceAccel;
            }

            // 縦壁の判定
            if (this.y - this.r < 0) {
                this.y = this.r;
                this.vy *= -bounceAccel;
                this.vx *= bounceAccel;
            } else if (this.y + this.r > canvas.height) {
                this.y = canvas.height - this.r;
                this.vy *= -bounceAccel;
                this.vx *= bounceAccel;
            }

            // 速度制限
            let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }
        }

        // 5. 特殊セルのエフェクト
        if (this.specialType) {
            let pColor = this.specialType === "blue" ? "0, 204, 255" : "255, 204, 0";
            if (Math.random() > 0.5) {
                sparkles.push(new Sparkle(this.x, this.y, pColor));
            }
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        if (this.specialType) {
            ctx.shadowBlur = 35; 
            ctx.shadowColor = this.color;
            ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 200) * 0.2;
        }
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function createCell(x, y, specialType = null, isClick = false) {
    if (specialType === "blue" && typeof isBlueCellUnlocked === "function" && !isBlueCellUnlocked()) {
        return;
    }

    if (!specialType) {
        let clickPower = currentMultiplier; 
        if (isClick && items.dmem && items.dmem.count >= 75) {
            clickPower += 150000 + (items.dmem.count - 75) * 2000;
        }
        if (items.fbs && items.fbs.count >= 115 && feverTime > 0) {
            let currentSps = 0;
            for (let k in items) currentSps += items[k].count * items[k].sps;
            if (boughtNodes >= 5) currentSps *= 2;
            clickPower = currentSps * 10;
        }
        let feverMult = (feverTime > 0 ? 7 : 1);
        let clickFeverMult = (isClick && clickFeverTime > 0 ? 5 : 1);
        let gain = feverMult * clickFeverMult * clickPower * permanentMult;

        totalCells += gain;

        if (x !== undefined && y !== undefined) {
            const popup = document.createElement("div");
            popup.className = "click-popup";
            popup.textContent = `+${Math.floor(gain).toLocaleString()}`;
            popup.style.left = `${x}px`;
            popup.style.top = `${y}px`;
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 800);
        }
        if (typeof updateCounter === 'function') updateCounter();
    }

    cells = cells.filter(cell => {
        if (cell.specialType) return true; 
        return (
            cell.x > -100 && 
            cell.x < canvas.width + 100 && 
            cell.y > -100 && 
            cell.y < canvas.height + 100
        );
    });
        
    const posX = x !== undefined ? x : Math.random() * (canvas.width - 40) + 20;
    const posY = y !== undefined ? y : Math.random() * (canvas.height - 40) + 20;
    const newCell = new Cell(posX, posY, specialType);

    if (specialType === "golden") {
        goldenCell = newCell;
    } else if (specialType === "blue") {
        blueCell = newCell;
    } else {
        cells.push(newCell);
        if (cells.length > MAX_CELLS) cells.shift(); 
    }
}
