import type { DesignSpec } from "./designs";
import type { PrintPlacement } from "./cup-model";
// All decoration is deterministic. The approved logo is drawn separately afterwards.
export function paintDesign(a: CanvasRenderingContext2D, d: DesignSpec, mark: string, p: PrintPlacement, aspect = 1) {
    const ink = d.color, accent = d.accent, strength = d.density;
    a.save();
    a.strokeStyle = ink;
    a.fillStyle = ink;
    a.lineCap = "round";
    a.lineJoin = "round";
    switch (d.pattern) {
        case "holiday":
        case "summer":
        case "valentine":
        case "halloween":
            paintSeason(a, d.pattern, ink, accent, strength);
            break;
        case "pure": break;
        case "heritage":
            a.lineWidth = 3;
            [90, 112, 910, 932].forEach(y => { a.beginPath(); a.moveTo(0, y); a.lineTo(1024, y); a.stroke(); });
            a.globalAlpha = .55;
            a.lineWidth = 1;
            [137, 885].forEach(y => { a.beginPath(); a.moveTo(0, y); a.lineTo(1024, y); a.stroke(); });
            [90, 934].forEach(y => {
                for (let x = 45; x < 1024; x += 85) {
                    a.beginPath();
                    a.moveTo(x, y - 14);
                    a.lineTo(x + 9, y);
                    a.lineTo(x, y + 14);
                    a.lineTo(x - 9, y);
                    a.closePath();
                    a.fill();
                }
            });
            break;
        case "tidal":
            for (let i = 0; i < 7; i++) {
                a.globalAlpha = .2 + i * .08;
                a.strokeStyle = i % 2 ? ink : accent;
                a.lineWidth = 16 + i * 5;
                a.beginPath();
                a.moveTo(-80, 680 + i * 42);
                a.bezierCurveTo(220, 430 + i * 42, 620, 1120 - i * 20, 1120, 640 + i * 28);
                a.stroke();
            }
            break;
        case "contour":
            a.lineWidth = 2 + strength * 2;
            for (let i = 0; i < 18; i++) {
                a.globalAlpha = .18 + (i % 3) * .14;
                a.beginPath();
                a.moveTo(-100, 40 + i * 45);
                a.bezierCurveTo(340, -140 + i * 32, 120, 720 + i * 30, 1140, 300 + i * 40);
                a.stroke();
            }
            break;
        case "botanical": {
            const sprig = (x: number, y: number, rotation: number) => {
                a.save();
                a.translate(x, y);
                a.rotate(rotation);
                a.globalAlpha = .65;
                a.lineWidth = 3;
                a.beginPath();
                a.moveTo(0, 270);
                a.quadraticCurveTo(30, 70, 0, -240);
                a.stroke();
                for (let i = 0; i < 8; i++) {
                    const yy = 190 - i * 54;
                    for (const sign of [-1, 1]) {
                        a.save();
                        a.translate(10, yy);
                        a.scale(sign, 1);
                        a.beginPath();
                        a.moveTo(0, 0);
                        a.bezierCurveTo(90, -8, 108, -74, 89, -81);
                        a.bezierCurveTo(30, -72, 10, -27, 0, 0);
                        a.fillStyle = i % 2 ? ink : accent;
                        a.globalAlpha = i % 2 ? .32 : .85;
                        a.fill();
                        a.restore();
                    }
                }
                a.restore();
            };
            sprig(135, 275, -.58);
            sprig(920, 800, 2.55);
            break;
        }
        case "sunrise":
            a.globalAlpha = .8;
            for (let r = 70; r < 480; r += 34) {
                a.lineWidth = 10;
                a.strokeStyle = r % 68 === 2 ? accent : ink;
                a.beginPath();
                a.arc(820, 1010, r, Math.PI, Math.PI * 2);
                a.stroke();
            }
            a.fillStyle = accent;
            a.beginPath();
            a.arc(820, 1010, 65, 0, Math.PI * 2);
            a.fill();
            break;
        case "confetti":
            for (let i = 0; i < 48 * strength; i++) {
                const x = (i * 193 + 29) % 1024, y = (i * 277 + 57) % 1024;
                a.save();
                a.translate(x, y);
                a.rotate(i * 1.7);
                a.fillStyle = i % 3 ? ink : accent;
                a.globalAlpha = .35 + (i % 3) * .15;
                if (i % 3 === 0) {
                    a.beginPath();
                    a.arc(0, 0, 12 + i % 12, 0, 7);
                    a.fill();
                }
                else if (i % 3 === 1)
                    a.fillRect(-5, -18, 10, 36);
                else {
                    a.beginPath();
                    a.moveTo(-17, 15);
                    a.lineTo(0, -16);
                    a.lineTo(17, 15);
                    a.closePath();
                    a.fill();
                }
                a.restore();
            }
            break;
        case "checker":
            for (let row = 0; row < 4; row++)
                for (let col = 0; col < 16; col++) {
                    a.fillStyle = (row + col) % 2 ? ink : accent;
                    a.globalAlpha = .9;
                    a.fillRect(col * 64, 760 + row * 64, 64, 64);
                }
            a.fillStyle = ink;
            a.fillRect(0, 80, 1024, 18);
            break;
        case "monogram":
            a.font = "italic 78px Georgia";
            a.textAlign = "center";
            a.globalAlpha = .14 + strength * .14;
            for (let y = 70; y < 1100; y += 150)
                for (let x = -40; x < 1100; x += 150)
                    a.fillText((mark || "S").slice(0, 1).toUpperCase(), x + (y % 300 ? 65 : 0), y);
            break;
        case "arch":
            a.fillStyle = accent;
            a.globalAlpha = .85;
            a.beginPath();
            a.roundRect(-130, 220, 480, 1000, 240);
            a.fill();
            a.fillStyle = ink;
            a.globalAlpha = .75;
            a.beginPath();
            a.roundRect(800, -200, 390, 960, 195);
            a.fill();
            a.lineWidth = 5;
            a.strokeStyle = ink;
            a.beginPath();
            a.roundRect(-65, 280, 330, 900, 165);
            a.stroke();
            break;
        case "noir":
            a.fillStyle = "#252722";
            a.fillRect(0, 0, 1024, 1024);
            a.strokeStyle = accent;
            a.lineWidth = 2;
            [80, 110, 914, 944].forEach(y => { a.beginPath(); a.moveTo(0, y); a.lineTo(1024, y); a.stroke(); });
            a.globalAlpha = .4;
            for (let x = 30; x < 1024; x += 42) {
                a.beginPath();
                a.moveTo(x, 140);
                a.lineTo(x, 884);
                a.stroke();
            }
            break;
        case "terrazzo":
            for (let i = 0; i < 65 * strength; i++) {
                const x = (i * 127 + 35) % 1024, y = (i * 239 + 21) % 1024;
                a.save();
                a.translate(x, y);
                a.rotate(i * 2.3);
                a.globalAlpha = .2 + (i % 4) * .16;
                a.fillStyle = i % 3 ? ink : accent;
                a.beginPath();
                a.moveTo(-18, -21);
                a.lineTo(17, -12);
                a.lineTo(27, 12);
                a.lineTo(-7, 26);
                a.lineTo(-25, 7);
                a.closePath();
                a.fill();
                a.restore();
            }
            break;
    }
    a.restore();
    if (d.pattern !== "pure" && d.pattern !== "heritage") {
        // Soft unprinted breathing room keeps any supplied logo legible without a rectangular sticker.
        a.save();
        a.globalCompositeOperation = "destination-out";
        a.translate(512 + p.horizontal * 5, 510 + p.vertical * 5);
        a.scale(1, aspect);
        const r = 300 * p.scale / 100;
        const fade = a.createRadialGradient(0, 0, r * .7, 0, 0, r);
        fade.addColorStop(0, "rgba(0,0,0,1)");
        fade.addColorStop(.7, "rgba(0,0,0,.96)");
        fade.addColorStop(1, "rgba(0,0,0,0)");
        a.fillStyle = fade;
        a.fillRect(-r, -r, r * 2, r * 2);
        a.restore();
    }
}
function paintSeason(a: CanvasRenderingContext2D, season: string, ink: string, accent: string, density: number) {
    // Repeating, full-wrap artwork with distinct silhouettes and layered borders.
    for (let row = 0; row < 5; row++)
        for (let col = 0; col < 8; col++) {
            a.save();
            a.translate(col * 150 + (row % 2 ? 65 : 0), row * 250 + 40);
            a.rotate((col % 3 - 1) * .18);
            a.globalAlpha = .65 + density * .3;
            a.fillStyle = col % 2 ? ink : accent;
            a.strokeStyle = ink;
            a.lineWidth = 3;
            if (season === 'holiday') {
                if ((row + col) % 2) {
                    for (let j = 0; j < 3; j++) {
                        a.beginPath();
                        a.moveTo(0, -38 + j * 23);
                        a.lineTo(30 + j * 8, 12 + j * 23);
                        a.lineTo(-30 - j * 8, 12 + j * 23);
                        a.closePath();
                        a.fill();
                    }
                    a.fillRect(-4, 70, 8, 18);
                }
                else {
                    a.rotate(-.6);
                    a.beginPath();
                    a.moveTo(0, 65);
                    a.lineTo(0, -18);
                    a.bezierCurveTo(0, -60, 46, -60, 46, -18);
                    a.strokeStyle = accent;
                    a.lineWidth = 16;
                    a.stroke();
                    a.strokeStyle = ink;
                    a.lineWidth = 5;
                    for (let y = -5; y < 60; y += 16) {
                        a.beginPath();
                        a.moveTo(-8, y);
                        a.lineTo(8, y - 8);
                        a.stroke();
                    }
                }
            }
            else if (season === 'summer') {
                a.beginPath();
                a.arc(0, 15, 42, 0, Math.PI * 2);
                a.fill();
                a.strokeStyle = accent;
                for (let j = 0; j < 8; j++) {
                    a.beginPath();
                    a.moveTo(0, 15);
                    a.lineTo(Math.cos(j * Math.PI / 4) * 35, 15 + Math.sin(j * Math.PI / 4) * 35);
                    a.stroke();
                }
                a.beginPath();
                a.arc(0, 15, 35, 0, Math.PI * 2);
                a.stroke();
                a.fillStyle = ink;
                a.beginPath();
                a.ellipse(25, -42, 23, 9, -.6, 0, 7);
                a.fill();
            }
            else if (season === 'valentine') {
                a.beginPath();
                a.moveTo(0, 47);
                a.bezierCurveTo(-70, 0, -35, -52, 0, -17);
                a.bezierCurveTo(35, -52, 70, 0, 0, 47);
                a.fill();
                a.globalAlpha = .35;
                a.beginPath();
                a.ellipse(55, 70, 27, 9, -.7, 0, 7);
                a.fill();
            }
            else {
                if ((row + col) % 2) {
                    a.beginPath();
                    a.ellipse(0, 20, 43, 33, 0, 0, 7);
                    a.fill();
                    a.strokeStyle = accent;
                    for (let x = -22; x <= 22; x += 22) {
                        a.beginPath();
                        a.ellipse(x * .4, 20, 14, 32, 0, 0, 7);
                        a.stroke();
                    }
                    a.fillRect(-4, -26, 8, 16);
                }
                else {
                    a.beginPath();
                    a.moveTo(0, 0);
                    a.quadraticCurveTo(-28, -40, -60, -14);
                    a.lineTo(-46, 18);
                    a.lineTo(-25, 12);
                    a.lineTo(-12, 27);
                    a.lineTo(0, 18);
                    a.lineTo(12, 27);
                    a.lineTo(25, 12);
                    a.lineTo(46, 18);
                    a.lineTo(60, -14);
                    a.quadraticCurveTo(28, -40, 0, 0);
                    a.fill();
                }
            }
            a.restore();
        }
    a.fillStyle = ink;
    a.fillRect(0, 0, 1024, 12);
    a.fillRect(0, 1000, 1024, 24);
}
