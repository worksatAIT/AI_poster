class SudokuGame {
    constructor() {
        this.gridSize = 9;
        this.boxHeight = 3;
        this.boxWidth = 3;
        this.board = [];
        this.originalBoard = [];
        this.selectedCell = null;
        this.errors = 0;
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedSeconds = 0;
        this.gameStarted = false;
        
        this.initializeEventListeners();
        this.showDifficultyModal();
    }

    initializeEventListeners() {
        // Difficulty buttons - using document.addEventListener for event delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.difficulty-btn')) {
                const btn = e.target.closest('.difficulty-btn');
                const difficulty = parseInt(btn.dataset.difficulty);
                console.log('Difficulty button clicked:', difficulty);
                this.selectDifficulty(difficulty);
            }
        });

        // Level buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.level-btn')) {
                const btn = e.target.closest('.level-btn');
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const gridSize = parseInt(btn.dataset.level);
                console.log('Level button clicked:', gridSize);
                this.changeDifficulty(gridSize);
            }
        });

        // Number pad buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.num-btn')) {
                const btn = e.target.closest('.num-btn');
                const num = parseInt(btn.dataset.num);
                this.enterNumber(num);
            }
        });

        // Action buttons
        const newGameBtn = document.getElementById('newGameBtn');
        const resetBtn = document.getElementById('resetBtn');
        const hintBtn = document.getElementById('hintBtn');
        const checkBtn = document.getElementById('checkBtn');
        const solveBtn = document.getElementById('solveBtn');

        if (newGameBtn) newGameBtn.addEventListener('click', () => this.startNewGame());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetBoard());
        if (hintBtn) hintBtn.addEventListener('click', () => this.giveHint());
        if (checkBtn) checkBtn.addEventListener('click', () => this.checkBoard());
        if (solveBtn) solveBtn.addEventListener('click', () => this.solveBoard());

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.selectedCell && e.key >= '1' && e.key <= '9') {
                this.enterNumber(parseInt(e.key));
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.enterNumber(0);
            }
        });
    }

    showDifficultyModal() {
        const modal = document.getElementById('difficultyModal');
        modal.classList.add('active');
    }

    selectDifficulty(difficulty) {
        console.log('selectDifficulty called with:', difficulty);
        
        this.gridSize = difficulty;
        
        // Set box dimensions
        if (this.gridSize === 6) {
            this.boxHeight = 2;
            this.boxWidth = 3;
        } else {
            this.boxHeight = 3;
            this.boxWidth = 3;
        }

        // Hide difficulty modal
        const modal = document.getElementById('difficultyModal');
        if (modal) {
            modal.classList.remove('active');
            console.log('Modal hidden');
        }

        // Update UI
        this.updateLevelButtons();

        // Start game
        this.gameStarted = true;
        console.log('Starting game with gridSize:', this.gridSize);
        this.startNewGame();
    }

    changeDifficulty(gridSize) {
        this.gridSize = gridSize;
        
        if (this.gridSize === 6) {
            this.boxHeight = 2;
            this.boxWidth = 3;
        } else {
            this.boxHeight = 3;
            this.boxWidth = 3;
        }

        this.startNewGame();
    }

    updateLevelButtons() {
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.level) === this.gridSize) {
                btn.classList.add('active');
            }
        });
    }

    startNewGame() {
        this.clearTimer();
        this.errors = 0;
        document.getElementById('errors').textContent = '0';
        this.board = this.generateSudoku();
        this.originalBoard = this.copyBoard(this.board);
        this.renderBoard();
        this.startTimer();
        this.clearMessage();
    }

    generateSudoku() {
        const board = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        
        // Fill diagonal boxes with random numbers
        for (let boxRow = 0; boxRow < this.gridSize; boxRow += this.boxHeight) {
            for (let boxCol = 0; boxCol < this.gridSize; boxCol += this.boxWidth) {
                const nums = this.shuffleArray(Array.from({length: this.gridSize}, (_, i) => i + 1));
                let idx = 0;
                for (let i = boxRow; i < boxRow + this.boxHeight; i++) {
                    for (let j = boxCol; j < boxCol + this.boxWidth; j++) {
                        board[i][j] = nums[idx++];
                    }
                }
            }
        }

        // Solve the rest using backtracking
        this.solveSudoku(board);

        // Remove numbers to create puzzle
        const removals = this.gridSize === 6 ? 10 : 40;
        for (let i = 0; i < removals; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * this.gridSize);
                col = Math.floor(Math.random() * this.gridSize);
            } while (board[row][col] === 0);
            board[row][col] = 0;
        }

        return board;
    }

    solveSudoku(board) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= this.gridSize; num++) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solveSudoku(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(board, row, col, num) {
        // Check row
        for (let i = 0; i < this.gridSize; i++) {
            if (board[row][i] === num) return false;
        }

        // Check column
        for (let i = 0; i < this.gridSize; i++) {
            if (board[i][col] === num) return false;
        }

        // Check box
        const boxRow = Math.floor(row / this.boxHeight) * this.boxHeight;
        const boxCol = Math.floor(col / this.boxWidth) * this.boxWidth;
        for (let i = boxRow; i < boxRow + this.boxHeight; i++) {
            for (let j = boxCol; j < boxCol + this.boxWidth; j++) {
                if (board[i][j] === num) return false;
            }
        }

        return true;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    copyBoard(board) {
        return board.map(row => [...row]);
    }

    renderBoard() {
        const sudokuBoard = document.getElementById('sudokuBoard');
        sudokuBoard.innerHTML = '';
        sudokuBoard.className = `sudoku-board board-${this.gridSize}x${this.gridSize}`;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('input');
                cell.type = 'text';
                cell.maxLength = '1';
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Add box border classes for visual grouping
                const boxRow = Math.floor(row / this.boxHeight);
                const boxCol = Math.floor(col / this.boxWidth);
                cell.dataset.boxRow = boxRow;
                cell.dataset.boxCol = boxCol;

                if (this.originalBoard[row][col] !== 0) {
                    cell.value = this.originalBoard[row][col];
                    cell.classList.add('given');
                    cell.readOnly = true;
                } else {
                    cell.value = this.board[row][col] === 0 ? '' : this.board[row][col];
                }

                cell.addEventListener('click', (e) => this.selectCell(e, row, col));
                cell.addEventListener('input', (e) => this.handleCellInput(e, row, col));
                cell.addEventListener('keydown', (e) => this.handleKeyPress(e, row, col));

                sudokuBoard.appendChild(cell);
            }
        }

        // Apply box borders
        this.applyBoxBorders();
    }

    applyBoxBorders() {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            let borderStyle = '';

            // Top border
            if (row % this.boxHeight === 0) {
                borderStyle += 'border-top: 3px solid #667eea; ';
            }

            // Bottom border
            if ((row + 1) % this.boxHeight === 0) {
                borderStyle += 'border-bottom: 3px solid #667eea; ';
            }

            // Left border
            if (col % this.boxWidth === 0) {
                borderStyle += 'border-left: 3px solid #667eea; ';
            }

            // Right border
            if ((col + 1) % this.boxWidth === 0) {
                borderStyle += 'border-right: 3px solid #667eea; ';
            }

            if (borderStyle) {
                cell.setAttribute('style', borderStyle);
            }
        });
    }

    selectCell(e, row, col) {
        if (e.target.classList.contains('given')) return;

        // Clear previous selection
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected-row', 'selected-col', 'selected-box');
        });

        // Highlight selected cell
        this.selectedCell = e.target;

        // Highlight row and column
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);

            if (cellRow === row) cell.classList.add('selected-row');
            if (cellCol === col) cell.classList.add('selected-col');

            const boxRow = Math.floor(row / this.boxHeight) * this.boxHeight;
            const boxCol = Math.floor(col / this.boxWidth) * this.boxWidth;
            const cellBoxRow = Math.floor(cellRow / this.boxHeight) * this.boxHeight;
            const cellBoxCol = Math.floor(cellCol / this.boxWidth) * this.boxWidth;

            if (cellBoxRow === boxRow && cellBoxCol === boxCol) {
                cell.classList.add('selected-box');
            }
        });

        e.target.focus();
    }

    handleCellInput(e, row, col) {
        const value = e.target.value;
        if (value === '') {
            this.board[row][col] = 0;
        } else if (/^[1-9]$/.test(value)) {
            this.board[row][col] = parseInt(value);
        } else {
            e.target.value = '';
            this.board[row][col] = 0;
        }
    }

    handleKeyPress(e, row, col) {
        if (e.key === 'ArrowUp' && row > 0) {
            e.preventDefault();
            document.querySelector(`[data-row="${row - 1}"][data-col="${col}"]`).focus();
        } else if (e.key === 'ArrowDown' && row < this.gridSize - 1) {
            e.preventDefault();
            document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`).focus();
        } else if (e.key === 'ArrowLeft' && col > 0) {
            e.preventDefault();
            document.querySelector(`[data-row="${row}"][data-col="${col - 1}"]`).focus();
        } else if (e.key === 'ArrowRight' && col < this.gridSize - 1) {
            e.preventDefault();
            document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`).focus();
        }
    }

    enterNumber(num) {
        if (!this.selectedCell || this.selectedCell.classList.contains('given')) {
            this.showMessage('Select an empty cell first!', 'info');
            return;
        }

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        if (num === 0) {
            this.board[row][col] = 0;
            this.selectedCell.value = '';
            this.selectedCell.classList.remove('error', 'correct');
        } else {
            this.board[row][col] = num;
            this.selectedCell.value = num;

            if (!this.isValid(this.board, row, col, num)) {
                this.selectedCell.classList.add('error');
                this.errors++;
                document.getElementById('errors').textContent = this.errors;
            } else {
                this.selectedCell.classList.remove('error');
                this.selectedCell.classList.add('correct');
            }
        }

        this.checkCompletion();
    }

    checkCompletion() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] === 0) return;
            }
        }

        // Board is full, check if valid
        if (this.isValidSolution(this.board)) {
            this.gameComplete();
        }
    }

    isValidSolution(board) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const num = board[row][col];
                board[row][col] = 0;
                if (!this.isValid(board, row, col, num)) {
                    board[row][col] = num;
                    return false;
                }
                board[row][col] = num;
            }
        }
        return true;
    }

    checkBoard() {
        let valid = true;
        let hasEmpty = false;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] === 0) {
                    hasEmpty = true;
                } else {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const num = this.board[row][col];
                    const tempBoard = this.copyBoard(this.board);
                    tempBoard[row][col] = 0;

                    if (this.isValidWithBoard(tempBoard, row, col, num)) {
                        cell.classList.remove('error');
                    } else {
                        cell.classList.add('error');
                        valid = false;
                    }
                }
            }
        }

        if (hasEmpty) {
            this.showMessage('Please fill all cells first!', 'info');
        } else if (valid) {
            this.gameComplete();
        } else {
            this.showMessage('There are conflicts in your solution!', 'error');
        }
    }

    isValidWithBoard(board, row, col, num) {
        // Check row
        for (let i = 0; i < this.gridSize; i++) {
            if (i !== col && board[row][i] === num) return false;
        }

        // Check column
        for (let i = 0; i < this.gridSize; i++) {
            if (i !== row && board[i][col] === num) return false;
        }

        // Check box
        const boxRow = Math.floor(row / this.boxHeight) * this.boxHeight;
        const boxCol = Math.floor(col / this.boxWidth) * this.boxWidth;
        for (let i = boxRow; i < boxRow + this.boxHeight; i++) {
            for (let j = boxCol; j < boxCol + this.boxWidth; j++) {
                if ((i !== row || j !== col) && board[i][j] === num) return false;
            }
        }

        return true;
    }

    giveHint() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push({row, col});
                }
            }
        }

        if (emptyCells.length === 0) {
            this.showMessage('No empty cells!', 'info');
            return;
        }

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const solutionBoard = this.copyBoard(this.originalBoard);
        this.solveSudoku(solutionBoard);

        const row = randomCell.row;
        const col = randomCell.col;
        this.board[row][col] = solutionBoard[row][col];

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.value = solutionBoard[row][col];
        cell.classList.add('highlight');

        setTimeout(() => {
            cell.classList.remove('highlight');
        }, 2000);

        this.showMessage('Hint provided!', 'success');
    }

    solveBoard() {
        const solutionBoard = this.copyBoard(this.originalBoard);
        this.solveSudoku(solutionBoard);

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.board[row][col] = solutionBoard[row][col];
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.value = solutionBoard[row][col];
            }
        }

        this.showMessage('Puzzle solved!', 'success');
    }

    resetBoard() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.originalBoard[row][col] === 0) {
                    this.board[row][col] = 0;
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.value = '';
                    cell.classList.remove('error', 'correct');
                }
            }
        }
        this.showMessage('Board reset!', 'info');
    }

    gameComplete() {
        this.clearTimer();
        const stats = `Time: ${this.formatTime(this.elapsedSeconds)} | Errors: ${this.errors}`;
        document.getElementById('completionStats').textContent = stats;
        document.getElementById('completionModal').classList.add('active');
        this.showMessage('🎉 Congratulations! Puzzle solved!', 'success');
    }

    startTimer() {
        this.startTime = Date.now();
        this.elapsedSeconds = 0;
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            document.getElementById('timer').textContent = this.formatTime(this.elapsedSeconds);
        }, 1000);
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }

    clearMessage() {
        const messageEl = document.getElementById('message');
        messageEl.textContent = '';
        messageEl.className = 'message';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
