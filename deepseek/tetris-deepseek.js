
const { fromEvent, interval, merge } = rxjs;
const { map, scan, startWith, takeWhile, tap } = rxjs.operators;

// Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const TICK_RATE = 500; // Milliseconds



// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [
        [1, 1],
        [1, 1],
    ], // O
    [
        [0, 1, 0],
        [1, 1, 1],
    ], // T
    [
        [1, 0, 0],
        [1, 1, 1],
    ], // L
    [
        [0, 0, 1],
        [1, 1, 1],
    ], // J
    [
        [0, 1, 1],
        [1, 1, 0],
    ], // S
    [
        [1, 1, 0],
        [0, 1, 1],
    ], // Z
];

// Helper functions
const createPiece = () => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return { shape, width: shape[0].length, height: shape.length };
};

// Game state
const initialState = {
    grid: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    piece: createPiece(),
    position: { x: COLS / 2 - 1, y: 0 },
    score: 0,
    isGameOver: false,
};

const isValidMove = (grid, piece, position) => {
    for (let y = 0; y < piece.height; y++) {
        for (let x = 0; x < piece.width; x++) {
            if (
                piece.shape[y][x] &&
                (position.x + x < 0 ||
                    position.x + x >= COLS ||
                    position.y + y >= ROWS ||
                    grid[position.y + y][position.x + x])
            ) {
                return false;
            }
        }
    }
    return true;
};

const mergePiece = (grid, piece, position) => {
    const newGrid = grid.map((row) => [...row]);
    for (let y = 0; y < piece.height; y++) {
        for (let x = 0; x < piece.width; x++) {
            if (piece.shape[y][x]) {
                newGrid[position.y + y][position.x + x] = 1;
            }
        }
    }
    return newGrid;
};

const clearLines = (grid) => {
    const newGrid = grid.filter((row) => row.some((cell) => !cell));
    const linesCleared = ROWS - newGrid.length;
    return {
        grid: [...Array(linesCleared).fill(Array(COLS).fill(0)), ...newGrid],
        score: linesCleared * 100,
    };
};

// Game logic
const game$ = merge(
    interval(TICK_RATE).pipe(map(() => ({ type: 'TICK' }))),
    fromEvent(document, 'keydown').pipe(
        map((e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    return { type: 'MOVE', x: -1 };
                case 'ArrowRight':
                    return { type: 'MOVE', x: 1 };
                case 'ArrowDown':
                    return { type: 'MOVE', y: 1 };
                case 'ArrowUp':
                    return { type: 'ROTATE' };
                default:
                    return { type: 'NOOP' };
            }
        })
    )
).pipe(
    scan((state, action) => {
        if (state.isGameOver) return state;

        let { grid, piece, position, score } = state;

        switch (action.type) {
            case 'TICK':
                const newPosition = { x: position.x, y: position.y + 1 };
                if (isValidMove(grid, piece, newPosition)) {
                    return { ...state, position: newPosition };
                } else {
                    const newGrid = mergePiece(grid, piece, position);
                    const { grid: clearedGrid, score: newScore } = clearLines(newGrid);
                    const newPiece = createPiece();
                    const newPiecePosition = { x: COLS / 2 - 1, y: 0 };

                    if (!isValidMove(clearedGrid, newPiece, newPiecePosition)) {
                        return { ...state, isGameOver: true };
                    }

                    return {
                        ...state,
                        grid: clearedGrid,
                        piece: newPiece,
                        position: newPiecePosition,
                        score: score + newScore,
                    };
                }

            case 'MOVE':
                const movePosition = {
                    x: position.x + (action.x || 0),
                    y: position.y + (action.y || 0),
                };
                if (isValidMove(grid, piece, movePosition)) {
                    return { ...state, position: movePosition };
                }
                return state;

            case 'ROTATE':
                const rotatedPiece = {
                    ...piece,
                    shape: piece.shape[0].map((_, i) =>
                        piece.shape.map((row) => row[i]).reverse()
                    ),
                };
                if (isValidMove(grid, rotatedPiece, position)) {
                    return { ...state, piece: rotatedPiece };
                }
                return state;

            default:
                return state;
        }
    }, initialState),
    takeWhile((state) => !state.isGameOver),
    tap((state) => {
        console.clear();
        console.log(`Score: ${state.score}`);
        console.log(
            state.grid
                .map((row) => row.map((cell) => (cell ? 'X' : '.')).join(' '))
                .join('\n')
        );
    })
);

// Start the game
game$.subscribe({
    complete: () => console.log('Game Over!'),
});