const { fromEvent, interval, merge } = rxjs;
const { map, filter, scan, startWith, distinctUntilChanged } = rxjs.operators;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 300;
canvas.height = 600;
document.body.appendChild(canvas);

const COLS = 10, ROWS = 20, SIZE = 30;
const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
];

const COLORS = ['cyan', 'yellow', 'purple', 'blue', 'orange', 'green', 'red'];

const createPiece = () => {
    const index = Math.floor(Math.random() * SHAPES.length);
    return { shape: SHAPES[index], color: COLORS[index], x: 4, y: 0 };
};

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const mergeBoard = (board, piece) => {
    const newBoard = board.map(row => [...row]);
    piece.shape.forEach((row, dy) => row.forEach((val, dx) => {
        if (val) newBoard[piece.y + dy][piece.x + dx] = piece.color;
    }));
    return newBoard;
};

const drawBoard = (board) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => row.forEach((color, x) => {
        if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
            ctx.strokeRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
    }));
};

const key$ = fromEvent(document, 'keydown').pipe(
    map(event => ({ 37: -1, 39: 1, 40: 0 })[event.keyCode] || 0),
    distinctUntilChanged()
);

const tick$ = interval(500).pipe(map(() => ({ x: 0, y: 1 })));

const game$ = merge(key$, tick$).pipe(
    startWith({ board: emptyBoard(), piece: createPiece() }),
    scan((state, move) => {
        let { board, piece } = state;
        const newPiece = { ...piece, x: piece.x + (move.x || 0), y: piece.y + (move.y || 0) };

        if (!collides(board, newPiece)) {
            return { board, piece: newPiece };
        }

        const merged = mergeBoard(board, piece);
        return { board: merged, piece: createPiece() };
    })
);

game$.subscribe(({ board }) => drawBoard(board));

function collides(board, piece) {
    return piece.shape.some((row, dy) =>
        row.some((val, dx) =>
            val && (board[piece.y + dy]?.[piece.x + dx] !== 0 || piece.y + dy >= ROWS)
        )
    );
}
