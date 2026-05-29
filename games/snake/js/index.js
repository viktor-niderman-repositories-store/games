const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const overlay = document.querySelector('#overlay');

const GRID = 20;
const count_food = 5;
let size = 30;

const img_food = new Image();
img_food.src = './images/food.png';

function resize() {
    const max = Math.min(window.innerWidth - 24, window.innerHeight - 160, 600);
    size = Math.max(12, Math.floor(max / GRID));
    canvas.width = canvas.height = size * GRID;
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function reload() {
    overlay.classList.remove('show');
    snake.restart();
}

let snake = {
    coordinates: { x: [], y: [] },
    route: '',
    canChangeRoute: true,
    isAlive: true,
    timeout: null,
    speed: null,
    create() {
        this.coordinates.x = [0];
        this.coordinates.y = [0];
        this.route = 'right';
        this.isAlive = true;
        this.speed = 130;
        scoreEl.textContent = '0';
        step();
    },
    restart() {
        clearTimeout(this.timeout);
        for (let i = 0; i < food.length; i++) food[i].change();
        snake.create();
    },
    checkCageIsOccupied(x, y) {
        for (let i = 1; i < this.coordinates.x.length; i++) {
            if (x === this.coordinates.x[i] && y === this.coordinates.y[i]) return true;
        }
        return false;
    },
    checkDeath() {
        return this.checkCageIsOccupied(this.coordinates.x[0], this.coordinates.y[0]);
    },
    move() {
        for (let i = this.coordinates.x.length - 1; i > 0; i--) {
            this.coordinates.x[i] = this.coordinates.x[i - 1];
            this.coordinates.y[i] = this.coordinates.y[i - 1];
        }
        if (this.route === 'left')  this.coordinates.x[0]--;
        if (this.route === 'right') this.coordinates.x[0]++;
        if (this.route === 'up')    this.coordinates.y[0]--;
        if (this.route === 'down')  this.coordinates.y[0]++;
    }
};

class FOOD {
    constructor() {
        this.coordinates = { x: 0, y: 0 };
        this.change();
    }
    change() {
        this.coordinates.x = rand(0, GRID - 1);
        this.coordinates.y = rand(0, GRID - 1);
        if (snake.checkCageIsOccupied(this.coordinates.x, this.coordinates.y)) this.change();
    }
}

const food = [];
for (let i = 0; i < count_food; i++) food[i] = new FOOD();

resize();
window.addEventListener('resize', resize);

snake.create();

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
}

function step() {
    //draw map
    for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
            ctx.fillStyle = (i + j) % 2 ? '#1b5e20' : '#256b2a';
            ctx.fillRect(j * size, i * size, size, size);
        }
    }

    //draw tail
    ctx.fillStyle = '#fde047';
    for (let i = 1; i < snake.coordinates.x.length; i++) {
        roundRect(
            snake.coordinates.x[i] * size + 1,
            snake.coordinates.y[i] * size + 1,
            size - 2, size - 2, size * 0.25
        );
    }

    //draw head
    ctx.fillStyle = '#b91c1c';
    roundRect(
        snake.coordinates.x[0] * size + 1,
        snake.coordinates.y[0] * size + 1,
        size - 2, size - 2, size * 0.4
    );

    //draw food
    for (let i = 0; i < food.length; i++) {
        ctx.drawImage(
            img_food,
            food[i].coordinates.x * size + 3,
            food[i].coordinates.y * size + 3,
            size - 6, size - 6
        );
    }

    //eat
    for (let i = 0; i < food.length; i++) {
        if (snake.coordinates.x[0] === food[i].coordinates.x && snake.coordinates.y[0] === food[i].coordinates.y) {
            food[i].change();
            snake.coordinates.x.push(snake.coordinates.x[0]);
            snake.coordinates.y.push(snake.coordinates.y[0]);
            scoreEl.textContent = String(snake.coordinates.x.length - 1);
        }
    }

    snake.move();

    if (snake.checkDeath()) {
        snake.isAlive = false;
        overlay.classList.add('show');
    }

    //wall wrap
    if (snake.coordinates.x[0] >= GRID) snake.coordinates.x[0] = 0;
    if (snake.coordinates.x[0] < 0)     snake.coordinates.x[0] = GRID - 1;
    if (snake.coordinates.y[0] >= GRID) snake.coordinates.y[0] = 0;
    if (snake.coordinates.y[0] < 0)     snake.coordinates.y[0] = GRID - 1;

    snake.canChangeRoute = true;

    if (snake.isAlive) {
        snake.timeout = setTimeout(() => {
            requestAnimationFrame(step);
            if (snake.speed > 60 && rand(0, 60) === 0) snake.speed--;
        }, snake.speed);
    }
}

function turn(dir) {
    if (!snake.canChangeRoute || !snake.isAlive) return;
    if (dir === 'left'  && snake.route !== 'right') snake.route = 'left';
    if (dir === 'right' && snake.route !== 'left')  snake.route = 'right';
    if (dir === 'up'    && snake.route !== 'down')  snake.route = 'up';
    if (dir === 'down'  && snake.route !== 'up')    snake.route = 'down';
    snake.canChangeRoute = false;
}

document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') turn('left');
    if (e.code === 'ArrowRight' || e.code === 'KeyD') turn('right');
    if (e.code === 'ArrowUp'    || e.code === 'KeyW') turn('up');
    if (e.code === 'ArrowDown'  || e.code === 'KeyS') turn('down');
});

//touch swipe
let touchStart = null;
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchmove', e => {
    if (!touchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'right' : 'left');
    else                              turn(dy > 0 ? 'down'  : 'up');
    touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchend', () => { touchStart = null; }, { passive: true });
