const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const movesEl = document.querySelector('#moves');

let size = 0;
let map = [];
let moves = 0;
let won = false;

function init() {
    map = [];
    let n = 1;
    for (let i = 0; i < 4; i++) {
        map[i] = [];
        for (let j = 0; j < 4; j++) map[i][j] = n++;
    }
    map[3][3] = null;
    shuffle();
    moves = 0;
    won = false;
    movesEl.textContent = moves;
}

function shuffle() {
    let bi = 3, bj = 3;
    for (let n = 0; n < 200; n++) {
        const dirs = [];
        if (bi > 0) dirs.push([-1, 0]);
        if (bi < 3) dirs.push([1, 0]);
        if (bj > 0) dirs.push([0, -1]);
        if (bj < 3) dirs.push([0, 1]);
        const [di, dj] = dirs[Math.floor(Math.random() * dirs.length)];
        map[bi][bj] = map[bi + di][bj + dj];
        map[bi + di][bj + dj] = null;
        bi += di;
        bj += dj;
    }
}

function resize() {
    const s = Math.min(window.innerWidth - 32, window.innerHeight - 120, 480);
    size = Math.max(s, 240);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function draw() {
    const cell = size / 4;
    const gap = Math.max(4, cell * 0.05);
    const radius = cell * 0.14;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    roundRect(0, 0, size, size, radius * 1.4);
    ctx.fill();

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const v = map[i][j];
            if (v == null) continue;
            const x = j * cell + gap;
            const y = i * cell + gap;
            const w = cell - gap * 2;

            const grad = ctx.createLinearGradient(x, y, x, y + w);
            grad.addColorStop(0, won ? '#3a5a4e' : '#2d323d');
            grad.addColorStop(1, won ? '#1d3a30' : '#1c1f26');
            ctx.fillStyle = grad;
            roundRect(x, y, w, w, radius);
            ctx.fill();

            ctx.fillStyle = won ? '#a7f3d0' : '#8ab4ff';
            ctx.font = `300 ${Math.floor(cell * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(v, j * cell + cell / 2, i * cell + cell / 2 + 1);
        }
    }

    if (won) {
        ctx.fillStyle = 'rgba(15, 17, 22, 0.78)';
        roundRect(0, 0, size, size, radius * 1.4);
        ctx.fill();
        ctx.fillStyle = '#e8eaed';
        ctx.font = `500 ${Math.floor(size * 0.09)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('You win!', size / 2, size / 2 - size * 0.05);
        ctx.fillStyle = '#ffb78a';
        ctx.font = `400 ${Math.floor(size * 0.05)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(`${moves} moves`, size / 2, size / 2 + size * 0.06);
    }
}

function checkWin() {
    let n = 1;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i === 3 && j === 3) return map[3][3] == null;
            if (map[i][j] !== n++) return false;
        }
    }
    return true;
}

function findBlank() {
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            if (map[i][j] == null) return [i, j];
}

function move(ti, tj) {
    if (won) return;
    if (ti < 0 || ti > 3 || tj < 0 || tj > 3) return;
    const [bi, bj] = findBlank();
    if (Math.abs(ti - bi) + Math.abs(tj - bj) !== 1) return;
    map[bi][bj] = map[ti][tj];
    map[ti][tj] = null;
    moves++;
    movesEl.textContent = moves;
    if (checkWin()) won = true;
    draw();
}

function step(dir) {
    const [bi, bj] = findBlank();
    const offsets = { up: [1, 0], down: [-1, 0], left: [0, 1], right: [0, -1] };
    const [di, dj] = offsets[dir];
    move(bi + di, bj + dj);
}

function tap(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const j = Math.floor((clientX - rect.left) / rect.width * 4);
    const i = Math.floor((clientY - rect.top) / rect.height * 4);
    move(i, j);
}

let touchStart = null;
let swiped = false;

canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        swiped = false;
    }
}, { passive: true });

canvas.addEventListener('touchend', e => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    touchStart = null;
    if (Math.max(ax, ay) < 20) return;
    swiped = true;
    if (ax > ay) step(dx > 0 ? 'right' : 'left');
    else step(dy > 0 ? 'down' : 'up');
});

canvas.addEventListener('click', e => {
    if (swiped) { swiped = false; return; }
    tap(e.clientX, e.clientY);
});

const keyMap = {
    w: 'up', s: 'down', a: 'left', d: 'right',
    arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
};
window.addEventListener('keydown', e => {
    const dir = keyMap[e.key.toLowerCase()];
    if (!dir) return;
    e.preventDefault();
    step(dir);
});

document.querySelector('#reset').addEventListener('click', () => { init(); draw(); });
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

init();
resize();
