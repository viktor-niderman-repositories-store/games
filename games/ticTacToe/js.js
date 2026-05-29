const { createApp } = Vue;

createApp({
    data() {
        return {
            field: [],
            combinations: [
                [1,2,3], [4,5,6], [7,8,9],
                [1,4,7], [2,5,8], [3,6,9],
                [1,5,9], [3,5,7],
            ],
            symbols: { player: 'X', pc: '◯' },
            canMakeStep: true,
            appIsReload: false,
            banner: '',
            score: { player: 0, pc: 0, draw: 0 },
        };
    },
    computed: {
        status() {
            if (this.banner) return this.banner;
            if (!this.canMakeStep) return 'Computer is thinking…';
            return 'Your turn';
        },
    },
    methods: {
        boardIsFull() {
            return this.field.filter(v => v !== undefined).length >= 9;
        },
        hasWin(symbol, board = this.field) {
            return this.combinations.some(([a, b, c]) =>
                board[a] === symbol && board[b] === symbol && board[c] === symbol
            );
        },
        minimax(board, symbol, depth = 0, alpha = -Infinity, beta = Infinity) {
            if (this.hasWin(this.symbols.pc, board)) return { score: 10 - depth };
            if (this.hasWin(this.symbols.player, board)) return { score: depth - 10 };
            const empty = [];
            for (let i = 1; i <= 9; i++) if (board[i] === undefined) empty.push(i);
            if (empty.length === 0) return { score: 0 };

            const maximizing = symbol === this.symbols.pc;
            const next = maximizing ? this.symbols.player : this.symbols.pc;
            let best = { score: maximizing ? -Infinity : Infinity, index: empty[0] };
            for (const i of empty) {
                board[i] = symbol;
                const { score } = this.minimax(board, next, depth + 1, alpha, beta);
                board[i] = undefined;
                if (maximizing) {
                    if (score > best.score) best = { score, index: i };
                    if (score > alpha) alpha = score;
                } else {
                    if (score < best.score) best = { score, index: i };
                    if (score < beta) beta = score;
                }
                if (beta <= alpha) break;
            }
            return best;
        },
        makeComputerMove() {
            const board = this.field.slice();
            const { index } = this.minimax(board, this.symbols.pc);
            this.field[index] = this.symbols.pc;
        },
        clickTo(n) {
            if (!this.canMakeStep || this.appIsReload || this.field[n]) return;
            this.field[n] = this.symbols.player;
            if (this.hasWin(this.symbols.player)) {
                this.score.player++;
                this.stopGame('You win!');
                return;
            }
            if (this.boardIsFull()) {
                this.score.draw++;
                this.stopGame("It's a draw");
                return;
            }
            this.canMakeStep = false;
            setTimeout(() => {
                this.makeComputerMove();
                setTimeout(() => {
                    if (this.hasWin(this.symbols.pc)) {
                        this.score.pc++;
                        this.stopGame('Computer wins');
                        return;
                    }
                    if (this.boardIsFull()) {
                        this.score.draw++;
                        this.stopGame("It's a draw");
                        return;
                    }
                    this.canMakeStep = true;
                }, 120);
            }, 300);
        },
        stopGame(message) {
            this.appIsReload = true;
            this.banner = message;
            setTimeout(() => {
                this.banner = '';
                this.field = [];
                this.appIsReload = false;
                this.canMakeStep = true;
            }, 1200);
        },
    },
}).mount('#app');
