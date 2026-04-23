#!/usr/bin/env node
/*
 * CarCrash 2 - procedural asset generator.
 *
 * Re-skins the gameplay sprites (cars, truck, road, 4 level backgrounds,
 * 4 floors, sky spritesheet) in a cohesive synthwave / night-drive
 * palette. Text/UI sprites (title, menu, labels, bitmap font) are left
 * untouched - redrawing pixel typography at 5-15px tall would be worse
 * than keeping the original 2016 art.
 *
 * The script writes a minimal PNG encoder (RGBA, filter 0, zlib) from
 * scratch using only Node built-ins. Every generated asset preserves
 * the original pixel dimensions so the game's geometry constants don't
 * need to change.
 *
 * Usage:  node scripts/gen-assets.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* -------------------------------------------------------------------------- */
/*  Minimal PNG encoder (RGBA8, no interlace, single IDAT)                    */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    // Filter-type byte (0 = None) per scanline, followed by that scanline's RGBA.
    const rowLen = width * 4;
    const filtered = Buffer.alloc(height * (1 + rowLen));
    for (let y = 0; y < height; y++) {
        filtered[y * (1 + rowLen)] = 0;
        rgba.copy(filtered, y * (1 + rowLen) + 1, y * rowLen, (y + 1) * rowLen);
    }

    return Buffer.concat([
        signature,
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(filtered, { level: 9 })),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

/* -------------------------------------------------------------------------- */
/*  Tiny canvas API                                                           */
/* -------------------------------------------------------------------------- */

function canvas(w, h) { return { w: w, h: h, buf: Buffer.alloc(w * h * 4) }; }

function px(c, x, y, rgba) {
    if (x < 0 || x >= c.w || y < 0 || y >= c.h) return;
    const o = (y * c.w + x) * 4;
    c.buf[o] = rgba[0];
    c.buf[o + 1] = rgba[1];
    c.buf[o + 2] = rgba[2];
    c.buf[o + 3] = rgba[3] === undefined ? 255 : rgba[3];
}

function rect(c, x, y, w, h, rgba) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) px(c, x + xx, y + yy, rgba);
}

function save(c, filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, encodePNG(c.w, c.h, c.buf));
}

/* -------------------------------------------------------------------------- */
/*  Synthwave palette                                                         */
/* -------------------------------------------------------------------------- */

const C = {
    clear:      [0, 0, 0, 0],
    black:      [13, 6, 32, 255],        // deep indigo black
    nightRoad:  [20, 14, 38, 255],       // asphalt
    lane:       [80, 255, 238, 255],     // cyan lane marker
    laneDim:    [32, 120, 140, 255],     // cyan dim
    neon:       [255, 51, 170, 255],     // magenta neon
    neonDim:    [160, 30, 110, 255],
    sun:        [255, 170, 68, 255],     // hot sun
    sunDim:     [200, 110, 60, 255],
    white:      [245, 249, 250, 255],
    yellow:     [255, 238, 68, 255],
    orange:     [255, 136, 51, 255],

    // Player car (cyan)
    playerBody:   [80, 255, 238, 255],
    playerAccent: [20, 130, 160, 255],
    playerGlass:  [13, 6, 32, 255],

    // Enemy car (magenta)
    enemyBody:   [255, 80, 170, 255],
    enemyAccent: [140, 25, 90, 255],
    enemyGlass:  [13, 6, 32, 255],

    // Truck (amber / yellow)
    truckBody:   [255, 190, 70, 255],
    truckAccent: [160, 100, 30, 255],
    truckGlass:  [13, 6, 32, 255],

    // Level sky gradients (4 steps: dusk -> deep night)
    skyTop:    [
        [38, 10, 68, 255],   // lv1 - dusk
        [28, 8, 58, 255],    // lv2
        [18, 6, 48, 255],    // lv3
        [8, 4, 32, 255]      // lv4 - deep night
    ],
    skyBot:    [
        [255, 90, 150, 255], // lv1 - hot pink horizon
        [210, 60, 180, 255], // lv2 - magenta
        [120, 40, 190, 255], // lv3 - violet
        [40, 30, 120, 255]   // lv4 - cold night
    ]
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function mixColor(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), 255];
}

function verticalGradient(c, x0, y0, w, h, top, bottom) {
    for (let y = 0; y < h; y++) {
        const col = mixColor(top, bottom, y / Math.max(1, h - 1));
        for (let x = 0; x < w; x++) px(c, x0 + x, y0 + y, col);
    }
}

/* -------------------------------------------------------------------------- */
/*  Sprite: car (5x3)  - idle frame                                           */
/* -------------------------------------------------------------------------- */
/*
 * The car lives in a 5x3 box, which is tiny but recognisable once scaled
 * 10x by the game. Layout:
 *
 *   . B B B .        B = body
 *   A G G G A        A = accent (darker body), G = glass
 *   . B B B .
 *
 * Cars point RIGHT (the player always drives right), so the "front" is
 * the right column.
 */
function drawCarIdle(c, ox, oy, body, accent, glass) {
    px(c, ox + 1, oy + 0, body);
    px(c, ox + 2, oy + 0, body);
    px(c, ox + 3, oy + 0, body);

    px(c, ox + 0, oy + 1, accent);
    px(c, ox + 1, oy + 1, glass);
    px(c, ox + 2, oy + 1, glass);
    px(c, ox + 3, oy + 1, body);   // nose-cone highlight
    px(c, ox + 4, oy + 1, accent);

    px(c, ox + 1, oy + 2, body);
    px(c, ox + 2, oy + 2, body);
    px(c, ox + 3, oy + 2, body);
}

/*
 * Explosion frames - 6 of them, 5x3 each. A plume that grows, peaks, and
 * decays. Inspired by the original flash-to-smoke arc but recoloured for
 * the synthwave palette.
 */
function drawExplosion(c, ox, oy, frame) {
    // frame: 1..6
    const fc = frame - 1;
    const palette = [C.yellow, C.orange, C.neon, C.neon, C.sunDim, C.black];
    const a = palette[fc];

    // growth pattern per frame
    const patterns = [
        // frame 1: tiny spark
        [[2, 1]],
        // frame 2: small plus
        [[1, 1], [2, 1], [3, 1], [2, 0], [2, 2]],
        // frame 3: big plus + corners
        [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [2, 0], [2, 2], [1, 0], [3, 0], [1, 2], [3, 2]],
        // frame 4: full 5x3, second color ring
        [[0, 0], [2, 0], [4, 0], [1, 1], [2, 1], [3, 1], [0, 2], [2, 2], [4, 2]],
        // frame 5: fading embers
        [[0, 1], [2, 0], [4, 1], [2, 2]],
        // frame 6: last ash points
        [[2, 1]]
    ];
    for (const [dx, dy] of patterns[fc]) px(c, ox + dx, oy + dy, a);

    // For the mid frames layer a brighter core on top.
    if (fc === 1 || fc === 2) px(c, ox + 2, oy + 1, C.white);
    if (fc === 3) {
        px(c, ox + 1, oy + 1, C.yellow);
        px(c, ox + 3, oy + 1, C.yellow);
    }
}

function buildCarSheet(bodyColor, accentColor, glassColor, outFile) {
    // 15x9 = 3 cols x 3 rows of 5x3 frames. Phaser reads left-to-right,
    // top-to-bottom, so frame 0 is top-left (idle), 1..6 explosion,
    // 7 blank (grid filler).
    const c = canvas(15, 9);
    // frame 0: idle
    drawCarIdle(c, 0, 0, bodyColor, accentColor, glassColor);
    // frames 1..6: explosion
    const positions = [
        [5, 0],  // f1
        [10, 0], // f2
        [0, 3],  // f3
        [5, 3],  // f4
        [10, 3], // f5
        [0, 6]   // f6
    ];
    positions.forEach(([x, y], i) => drawExplosion(c, x, y, i + 1));
    save(c, outFile);
}

/* -------------------------------------------------------------------------- */
/*  Sprite: truck (9x3)                                                       */
/* -------------------------------------------------------------------------- */
function buildTruck(outFile) {
    // A stubbier, longer vehicle with a cab at the right end.
    const c = canvas(9, 3);
    // cargo box (left 6 cols)
    rect(c, 0, 0, 6, 3, C.truckAccent);
    rect(c, 1, 1, 4, 1, C.truckBody);
    // cab (right 3 cols)
    rect(c, 6, 0, 3, 3, C.truckBody);
    px(c, 7, 1, C.truckGlass);
    px(c, 8, 1, C.truckGlass);
    // wheels (just a dark underline of the extremes)
    px(c, 0, 2, C.black);
    px(c, 5, 2, C.black);
    px(c, 6, 2, C.black);
    px(c, 8, 2, C.black);
    save(c, outFile);
}

/* -------------------------------------------------------------------------- */
/*  Road (32x13)  - tileable dark asphalt with two cyan dashed lane markers   */
/* -------------------------------------------------------------------------- */
function buildRoad(outFile) {
    const c = canvas(32, 13);
    // asphalt base
    rect(c, 0, 0, 32, 13, C.nightRoad);
    // top edge (bright)
    for (let x = 0; x < 32; x++) px(c, x, 0, C.laneDim);
    // bottom edge
    for (let x = 0; x < 32; x++) px(c, x, 12, C.laneDim);
    // centre dashed lane
    for (let x = 0; x < 32; x++) {
        if ((x % 4) < 2) px(c, x, 6, C.lane);
    }
    // offset dashes to sell motion when tiled
    for (let x = 0; x < 32; x++) {
        if (((x + 2) % 8) < 1) {
            px(c, x, 3, C.laneDim);
            px(c, x, 9, C.laneDim);
        }
    }
    save(c, outFile);
}

/* -------------------------------------------------------------------------- */
/*  Backgrounds spritesheet (120x60 = 4 frames of 30x60)                      */
/*  Solid sky colours per level - shown during level-transition fades.        */
/* -------------------------------------------------------------------------- */
function buildBackgrounds(outFile) {
    const c = canvas(120, 60);
    for (let lvl = 0; lvl < 4; lvl++) {
        verticalGradient(c, lvl * 30, 0, 30, 60, C.skyTop[lvl], C.skyBot[lvl]);
    }
    save(c, outFile);
}

/* -------------------------------------------------------------------------- */
/*  Level art lv1..lv4 (30x60 each)                                           */
/*                                                                            */
/*  This sits on top of the flat `backgrounds` layer and scrolls as a         */
/*  tileSprite. It contains the sky, sun, and city/mountain silhouettes       */
/*  (everything above the road). The road band (y=34..47) is left             */
/*  fully transparent so the dedicated `road` sprite shows through.           */
/* -------------------------------------------------------------------------- */

function drawSun(c, cx, cy, r, color) {
    // filled pixel-art disc
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r * r) px(c, cx + dx, cy + dy, color);
        }
    }
}

function drawSunWithStripes(c, cx, cy, r, color, stripe) {
    drawSun(c, cx, cy, r, color);
    // horizontal dark stripes across the lower half -> synthwave sun
    for (let dy = 0; dy <= r; dy += 2) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r * r) px(c, cx + dx, cy + dy, stripe);
        }
    }
}

function drawMountainRange(c, baseline, color, seed) {
    // Deterministic jagged silhouette using a tiny LCG seeded per level.
    let s = seed;
    function rand() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    let y = baseline - 2;
    for (let x = 0; x < 30; x++) {
        if (rand() < 0.5) y += (rand() < 0.5 ? -1 : 1);
        y = Math.max(baseline - 7, Math.min(baseline, y));
        for (let yy = y; yy <= baseline; yy++) px(c, x, yy, color);
    }
}

function drawCitySkyline(c, baseline, color, windows, seed) {
    let s = seed;
    function rand() { s = (s * 48271) % 0x7fffffff; return s / 0x7fffffff; }
    let x = 0;
    while (x < 30) {
        const w = 2 + Math.floor(rand() * 3);   // 2..4 wide
        const h = 3 + Math.floor(rand() * 7);   // 3..9 tall
        const top = baseline - h;
        for (let xx = 0; xx < w && x + xx < 30; xx++) {
            for (let yy = top; yy <= baseline; yy++) px(c, x + xx, yy, color);
        }
        // scatter a few lit windows
        for (let yy = top + 2; yy <= baseline - 1; yy += 2) {
            if (rand() < 0.4) px(c, x + 1, yy, windows);
            if (w >= 3 && rand() < 0.4) px(c, x + w - 2, yy, windows);
        }
        x += w;
    }
}

function drawStars(c, maxY, color, seed, density) {
    let s = seed;
    function rand() { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }
    for (let y = 0; y < maxY; y++) {
        for (let x = 0; x < 30; x++) {
            if (rand() < density) px(c, x, y, color);
        }
    }
}

function drawNeonGrid(c, y0, y1, color) {
    // perspective-ish grid: converging vertical lines to a central vanishing point
    const cx = 15;
    for (let y = y0; y <= y1; y++) {
        const t = (y - y0) / Math.max(1, y1 - y0);
        const spread = Math.floor(t * 14) + 1;
        for (let k = -3; k <= 3; k++) {
            const xx = cx + k * spread;
            if (xx >= 0 && xx < 30) px(c, xx, y, color);
        }
        // horizontal scan lines every 2 rows
        if ((y - y0) % 2 === 0) {
            for (let xx = 0; xx < 30; xx++) {
                const exist = c.buf[(y * c.w + xx) * 4 + 3];
                if (exist === 0) px(c, xx, y, [color[0], color[1], color[2], 120]);
            }
        }
    }
}

function buildLevel(levelIndex, outFile) {
    // 30x60 canvas, transparent road band left alone.
    const c = canvas(30, 60);
    const top = C.skyTop[levelIndex];
    const bot = C.skyBot[levelIndex];

    // Sky: gradient from y=0 to the road's top edge (y=34)
    verticalGradient(c, 0, 0, 30, 34, top, bot);

    // Stars in the upper third - denser on later levels
    const density = [0.02, 0.04, 0.06, 0.10][levelIndex];
    drawStars(c, 18, C.white, 7919 + levelIndex * 97, density);

    // Sun / horizon ornament
    if (levelIndex === 0) {
        drawSunWithStripes(c, 15, 30, 6, C.sun, C.sunDim);
    } else if (levelIndex === 1) {
        drawSunWithStripes(c, 22, 29, 4, C.sun, C.sunDim);
        drawMountainRange(c, 33, [30, 10, 60, 255], 31);
    } else if (levelIndex === 2) {
        drawCitySkyline(c, 33, [18, 8, 40, 255], C.yellow, 1337);
    } else {
        // deep night: no sun, moon + distant skyline
        drawSun(c, 6, 10, 3, C.white);
        drawSun(c, 6, 10, 2, [180, 180, 220, 255]);
        drawCitySkyline(c, 33, [10, 4, 24, 255], C.neon, 4242);
    }

    // Road band (y=34..46) stays transparent so `road` sprite shows through.

    // Foreground floor strip (y=47..59) - NOT left empty here because the
    // floor is its own sprite too, but we tint the borders just above the
    // horizon to marry the sky smoothly. (This strip is covered by the
    // `floor` sprite at runtime, so any pixels here are a safety net.)
    for (let x = 0; x < 30; x++) {
        for (let y = 47; y < 60; y++) px(c, x, y, C.black);
    }

    // Neon grid on the lower horizon for a classic synthwave feel.
    // Drawn across the sky area just above the road.
    drawNeonGrid(c, 31, 33, C.neon);

    save(c, outFile);
}

/* -------------------------------------------------------------------------- */
/*  Floor (30x15) - foreground ground with a neon grid                        */
/* -------------------------------------------------------------------------- */

function buildFloor(levelIndex, outFile) {
    const c = canvas(30, 15);
    // ground base: slightly darker than the sky horizon of that level
    const base = [
        [12, 4, 30, 255],
        [10, 4, 26, 255],
        [8, 3, 22, 255],
        [4, 2, 14, 255]
    ][levelIndex];
    rect(c, 0, 0, 30, 15, base);

    // Perspective grid - spacing widens further down. Horizontal lines.
    const gridColors = [C.neon, C.neon, [80, 30, 160, 255], [40, 20, 120, 255]];
    const lineColor = gridColors[levelIndex];
    let gap = 1;
    let y = 0;
    while (y < 15) {
        for (let x = 0; x < 30; x++) px(c, x, y, lineColor);
        gap += 1;
        y += gap;
    }

    // Vertical converging lines toward the top center (vanishing point off-canvas).
    for (let k = -6; k <= 6; k++) {
        for (let y = 0; y < 15; y++) {
            const spread = Math.max(1, Math.floor((y + 1) * 0.8));
            const x = 15 + k * spread;
            if (x >= 0 && x < 30) px(c, x, y, lineColor);
        }
    }

    save(c, outFile);
}

/* -------------------------------------------------------------------------- */
/*  Build everything                                                          */
/* -------------------------------------------------------------------------- */

const OUT = path.join(__dirname, '..', 'src', 'assets', 'img');
const BACKUP = path.join(OUT, '_v1');

function backupOriginals() {
    if (fs.existsSync(BACKUP)) return; // already backed up
    fs.mkdirSync(BACKUP, { recursive: true });
    const keep = [
        'car.png', 'enemy.png', 'truck.png', 'road.png',
        'lv1.png', 'lv2.png', 'lv3.png', 'lv4.png',
        'floor1.png', 'floor2.png', 'floor3.png', 'floor4.png',
        'backgrounds.png'
    ];
    for (const name of keep) {
        const src = path.join(OUT, name);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(BACKUP, name));
    }
    console.log('  backed up v1 assets ->', path.relative(process.cwd(), BACKUP));
}

function main() {
    const start = Date.now();
    console.log('CarCrash 2 asset generator');
    backupOriginals();

    buildCarSheet(C.playerBody, C.playerAccent, C.playerGlass, path.join(OUT, 'car.png'));
    buildCarSheet(C.enemyBody,  C.enemyAccent,  C.enemyGlass,  path.join(OUT, 'enemy.png'));
    buildTruck(path.join(OUT, 'truck.png'));
    buildRoad(path.join(OUT, 'road.png'));
    buildBackgrounds(path.join(OUT, 'backgrounds.png'));
    for (let i = 0; i < 4; i++) buildLevel(i, path.join(OUT, 'lv' + (i + 1) + '.png'));
    for (let i = 0; i < 4; i++) buildFloor(i, path.join(OUT, 'floor' + (i + 1) + '.png'));

    console.log('  regenerated 14 assets in ' + (Date.now() - start) + 'ms');
}

main();
