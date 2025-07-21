class PanelGame {
    constructor() {
        this.panels = [];
        this.touchedNumbers = {};
        this.neighbors = {
            0: [7, 9],
            1: [4, 5],
            2: [3, 5, 6],
            3: [2, 5, 6],
            4: [1, 5, 7, 8],
            5: [1, 2, 3, 4, 6, 7, 8, 9],
            6: [2, 3, 5, 8],
            7: [0, 4, 5, 8],
            8: [4, 5, 6, 7, 9],
            9: [0, 5, 8]
        };
        this.init();
    }

    init() {
        const grid = document.getElementById('panelGrid');
        // Clear panels but keep SVG
        const svg = document.getElementById('connections');
        const panels = grid.querySelectorAll('.panel');
        panels.forEach(p => p.remove());
        
        for (let i = 1; i <= 9; i++) {
            this.createPanel(i, grid);
        }
        this.createPanel(0, grid);
        
        // Draw connections after DOM layout is complete
        requestAnimationFrame(() => {
            this.drawConnections();
        });
        
        this.reset();
    }

    createPanel(number, container) {
        const panel = document.createElement('div');
        panel.className = `panel panel-${number}`;
        panel.dataset.number = number;
        
        // Add both click and touch event listeners
        panel.addEventListener('click', () => this.touchPanel(number));
        
        // Touch events for mobile
        panel.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double-firing with click
            this.addPressedEffect(panel);
        });
        
        panel.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.removePressedEffect(panel);
            this.touchPanel(number);
        });
        
        panel.addEventListener('touchcancel', () => {
            this.removePressedEffect(panel);
        });
        
        container.appendChild(panel);
        this.panels[number] = panel;
    }

    reset() {
        for (let i = 0; i <= 9; i++) {
            this.panels[i].className = `panel panel-${i} white`;
            this.panels[i].textContent = '';
        }
        this.touchedNumbers = {};
    }

    randomize() {
        this.reset();
        for (let i = 0; i <= 9; i++) {
            if (Math.random() > 0.5) {
                this.panels[i].classList.remove('white');
                this.panels[i].classList.add('yellow');
            }
        }
    }

    countYellowPanels() {
        let count = 0;
        for (let i = 0; i <= 9; i++) {
            if (this.panels[i].classList.contains('yellow')) {
                count++;
            }
        }
        return count;
    }

    togglePanel(panelNumber) {
        const panel = this.panels[panelNumber];
        if (panel.classList.contains('white')) {
            panel.classList.remove('white');
            panel.classList.add('yellow');
        } else {
            panel.classList.remove('yellow');
            panel.classList.add('white');
        }
    }

    addPressedEffect(panel) {
        panel.classList.add('pressed');
    }
    
    removePressedEffect(panel) {
        panel.classList.remove('pressed');
    }

    touchPanel(panelNumber) {
        const yellowCount = this.countYellowPanels();
        const wasGameWon = this.isGameWon();
        
        // Add pressed visual feedback for desktop clicks
        const panel = this.panels[panelNumber];
        this.addPressedEffect(panel);
        
        // Remove pressed effect after short delay for desktop
        setTimeout(() => {
            this.removePressedEffect(panel);
        }, 150);
        
        this.togglePanel(panelNumber);
        
        const neighbors = this.neighbors[panelNumber];
        neighbors.forEach(neighbor => {
            this.togglePanel(neighbor);
        });
        
        this.displayNumber(panelNumber, yellowCount);
        
        // Check win condition after move (only if game wasn't already won)
        if (!wasGameWon && this.checkWinCondition()) {
            this.showVictory();
        }
        
        // Show connection lines again if game was already won (restore on tap after victory)
        if (wasGameWon) {
            const svg = document.getElementById('connections');
            if (svg && svg.style) {
                svg.style.display = 'block';
            }
        }
    }

    displayNumber(panelNumber, number) {
        const panel = this.panels[panelNumber];
        
        const existingDisplay = panel.querySelector('.number-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'number-display';
        numberDisplay.textContent = number;
        panel.appendChild(numberDisplay);
        
        this.touchedNumbers[panelNumber] = number;
    }

    getState() {
        const state = {
            panels: {},
            touchedNumbers: this.touchedNumbers
        };
        
        for (let i = 0; i <= 9; i++) {
            state.panels[i] = this.panels[i].classList.contains('yellow') ? 'yellow' : 'white';
        }
        
        return state;
    }

    setState(state) {
        for (let i = 0; i <= 9; i++) {
            this.panels[i].className = `panel panel-${i} ${state.panels[i]}`;
            
            const existingDisplay = this.panels[i].querySelector('.number-display');
            if (existingDisplay) {
                existingDisplay.remove();
            }
        }
        
        this.touchedNumbers = { ...state.touchedNumbers };
        
        for (const [panelNumber, number] of Object.entries(this.touchedNumbers)) {
            const numberDisplay = document.createElement('div');
            numberDisplay.className = 'number-display';
            numberDisplay.textContent = number;
            this.panels[panelNumber].appendChild(numberDisplay);
        }
    }

    getPanelPosition(number) {
        const positions = {
            1: { x: 0, y: 0 },
            2: { x: 1, y: 0 },
            3: { x: 2, y: 0 },
            4: { x: 0, y: 1 },
            5: { x: 1, y: 1 },
            6: { x: 2, y: 1 },
            7: { x: 0, y: 2 },
            8: { x: 1, y: 2 },
            9: { x: 2, y: 2 },
            0: { x: 1, y: 3 }
        };
        
        const cellSize = 84;  // 80px + 2px border × 2
        const gap = 10;
        // The center of a panel is at half the cell size
        // Each cell is positioned at column * (cellSize + gap)
        
        return {
            x: positions[number].x * (cellSize + gap) + cellSize / 2,
            y: positions[number].y * (cellSize + gap) + cellSize / 2
        };
    }

    drawConnections() {
        const svg = document.getElementById('connections');
        svg.innerHTML = '';
        
        // Set SVG size to match grid
        // Width: 3 panels * 84px + 2 gaps * 10px = 272px
        // Height: 4 rows * 84px + 3 gaps * 10px = 366px
        svg.setAttribute('viewBox', '0 0 272 366');
        svg.style.width = '272px';
        svg.style.height = '366px';
        
        // Draw lines for each panel's connections
        for (let panel = 0; panel <= 9; panel++) {
            const from = this.getPanelPosition(panel);
            const neighbors = this.neighbors[panel];
            
            neighbors.forEach(neighbor => {
                // Only draw lines from lower to higher number to avoid duplicates
                if (panel < neighbor) {
                    const to = this.getPanelPosition(neighbor);
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', from.x);
                    line.setAttribute('y1', from.y);
                    line.setAttribute('x2', to.x);
                    line.setAttribute('y2', to.y);
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
                    line.setAttribute('stroke-width', '2');
                    
                    svg.appendChild(line);
                }
            });
        }
    }

    checkWinCondition() {
        // Win condition: all panels have correct numbers (panel number matches displayed number)
        if (Object.keys(this.touchedNumbers).length !== 10) {
            return false;
        }
        
        // Check if each panel has the correct number
        for (let panelNumber = 0; panelNumber <= 9; panelNumber++) {
            const displayedNumber = this.touchedNumbers[panelNumber];
            if (displayedNumber !== panelNumber) {
                return false;
            }
        }
        
        return true;
    }

    isGameWon() {
        return document.querySelector('.victory-screen') !== null;
    }

    showVictory() {
        // Only run in browser environment
        if (typeof window === 'undefined') {
            return;
        }
        
        // Keep panels enabled after victory
        for (let i = 0; i <= 9; i++) {
            if (this.panels[i] && this.panels[i].style) {
                this.panels[i].style.pointerEvents = 'auto';
            }
        }

        // Hide connection lines
        const svg = document.getElementById('connections');
        if (svg && svg.style) {
            svg.style.display = 'none';
        }

        // Change title to "You did it!" with fixed style
        const titleElement = document.querySelector('.game-title');
        if (titleElement) {
            titleElement.textContent = 'You did it!';
            titleElement.className = 'game-title victory-title';
        }

        // Add share button to existing controls
        const controlsDiv = document.querySelector('.controls');
        if (controlsDiv) {
            controlsDiv.innerHTML = `
                <div class="victory-screen">
                    <button onclick="game.reset()">リセット</button>
                    <button onclick="window.open('https://x.com/intent/post?text=%23repair_from_zero+%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%9F%EF%BC%81+%23%E3%82%AB%E3%82%BA%E3%83%AA%E3%83%83%E3%83%88%E5%AE%87%E5%AE%99%E8%AC%8E&url=https://kazushi0114.github.io/repair_from_zero/', '_blank')" class="reset-button">Xでシェア</button>
                </div>
            `;
        }
    }

    enableGame() {
        // Re-enable all panels
        for (let i = 0; i <= 9; i++) {
            this.panels[i].style.pointerEvents = 'auto';
        }

        // Show connection lines again
        const svg = document.getElementById('connections');
        if (svg) {
            svg.style.display = 'block';
        }

        // Restore normal controls
        const controlsDiv = document.querySelector('.controls');
        controlsDiv.innerHTML = `<button onclick="game.reset()">リセット</button>`;
    }

    reset() {
        for (let i = 0; i <= 9; i++) {
            // Set initial state: panels 1, 5, 9 are white, others are yellow
            const isWhite = (i === 1 || i === 5 || i === 9);
            this.panels[i].className = `panel panel-${i} ${isWhite ? 'white' : 'yellow'}`;
            this.panels[i].textContent = '';
            // Only set style properties if in browser environment
            if (typeof window !== 'undefined') {
                this.panels[i].style.pointerEvents = 'auto';
            }
        }
        this.touchedNumbers = {};

        // Show connection lines again (browser only)
        if (typeof document !== 'undefined') {
            const svg = document.getElementById('connections');
            if (svg && svg.style) {
                svg.style.display = 'block';
            }

            // Restore title to "Repair From Zero" with broken style
            const titleElement = document.querySelector('.game-title');
            if (titleElement) {
                titleElement.textContent = 'Repair From Zero';
                titleElement.className = 'game-title';
            }

            // Keep share button if victory screen exists (game was won)
            const victoryScreen = document.querySelector('.victory-screen');
            if (victoryScreen) {
                const controlsDiv = document.querySelector('.controls');
                if (controlsDiv) {
                    controlsDiv.innerHTML = `
                        <div class="victory-screen">
                            <button onclick="game.reset()">リセット</button>
                            <button onclick="window.open('https://x.com/intent/post?text=%23repair_from_zero+%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%9F%EF%BC%81+%23%E3%82%AB%E3%82%BA%E3%83%AA%E3%83%83%E3%83%88%E5%AE%87%E5%AE%99%E8%AC%8E&url=https://kazushi0114.github.io/repair_from_zero/', '_blank')" class="reset-button">Xでシェア</button>
                        </div>
                    `;
                }
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.game = new PanelGame();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelGame;
}