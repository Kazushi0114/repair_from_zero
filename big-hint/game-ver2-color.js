class PanelGame {
    constructor() {
        this.panels = [];
        this.touchedNumbers = {};
        this.wasEverWon = false;
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
        const buttons = grid.querySelectorAll('button');
        buttons.forEach(b => b.remove());
        
        for (let i = 1; i <= 9; i++) {
            this.createPanel(i, grid);
        }
        this.createPanel(0, grid);
        
        // Create reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.onclick = () => this.reset();
        resetBtn.textContent = '↩';
        grid.appendChild(resetBtn);
        
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
        const wasGameWon = this.isGameWon();
        
        for (let i = 0; i <= 9; i++) {
            // Set initial state: only panel 8 is yellow, others are white
            const isWhite = (i !== 8);
            this.panels[i].className = `panel panel-${i} ${isWhite ? 'white' : 'yellow'}`;
            this.panels[i].textContent = '';
            // Only set style properties if in browser environment
            if (typeof window !== 'undefined') {
                this.panels[i].style.pointerEvents = 'auto';
                // Always show actual colors (no hiding)
                this.panels[i].style.background = '';
            }
        }
        this.touchedNumbers = {};

        // Show connection lines again (browser only)
        if (typeof document !== 'undefined') {
            const svg = document.getElementById('connections');
            if (svg && svg.style) {
                svg.style.display = 'block';
            }

            // Restore title to "Repair From Zero - Color Visible" with broken style
            const titleElement = document.querySelector('.game-title');
            if (titleElement) {
                titleElement.textContent = 'Repair From Zero';
                titleElement.className = 'game-title';
            }

            // Keep share button if victory screen exists (game was won)
            const victoryScreen = document.querySelector('.victory-screen');
            const shareBtn = document.querySelector('.share-btn');
            if (victoryScreen && !shareBtn) {
                const grid = document.getElementById('panelGrid');
                const newShareBtn = document.createElement('button');
                newShareBtn.className = 'share-btn reset-button';
                newShareBtn.onclick = () => window.open('https://x.com/intent/post?text=%23repair_from_zero+%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%9F%EF%BC%81+%23%E3%82%AB%E3%82%BA%E3%83%AA%E3%83%83%E3%83%88%E5%AE%87%E5%AE%99%E8%AC%8E&url=https://kazushi0114.github.io/repair_from_zero/', '_blank');
                newShareBtn.textContent = '𝕏';
                grid.appendChild(newShareBtn);
            }
        }
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
        // Store original background
        panel.dataset.originalBg = panel.style.background || '';
        // Always show yellow color on tap
        panel.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)';
    }
    
    removePressedEffect(panel) {
        panel.classList.remove('pressed');
        // Restore original background (always show colors)
        if (panel.dataset.originalBg !== undefined) {
            panel.style.background = panel.dataset.originalBg;
            delete panel.dataset.originalBg;
        } else {
            // Always show actual colors (no hiding)
            panel.style.background = '';
        }
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
        
        // Always show actual colors for all panels
        for (let i = 0; i <= 9; i++) {
            if (!this.panels[i].classList.contains('pressed')) {
                this.panels[i].style.background = '';
            }
        }
        
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
        
        // CSS grid settings
        const gridColumnWidth = 70; // CSS grid-template-columns width
        const gridGap = 15;          // CSS gap
        
        // Panel dimensions (including border due to content-box)
        const panelWidth = 70;       // CSS width
        const panelHeight = 50;      // CSS height
        const borderWidth = 2;       // border width
        
        // Actual panel size with border
        const actualPanelWidth = panelWidth + borderWidth * 2;  // 74px
        const actualPanelHeight = panelHeight + borderWidth * 2; // 54px
        
        // Panel centers are based on grid positions, but panels overflow
        const panelCenterX = positions[number].x * (gridColumnWidth + gridGap) + actualPanelWidth / 2;
        const panelCenterY = positions[number].y * (actualPanelHeight + gridGap) + actualPanelHeight / 2;
        
        return {
            x: panelCenterX,
            y: panelCenterY
        };
    }

    drawConnections() {
        const svg = document.getElementById('connections');
        svg.innerHTML = '';
        
        // Set SVG size to match actual panel layout
        // Actual layout: panels overflow grid due to borders
        // Width: 3 * (70px + 4px) + 2 * 15px = 252px
        // Height: 4 * (50px + 4px) + 3 * 15px = 261px
        const svgWidth = 3 * 74 + 2 * 15;  // 252px
        const svgHeight = 4 * 54 + 3 * 15; // 261px
        
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        svg.style.width = `${svgWidth}px`;
        svg.style.height = `${svgHeight}px`;
        
        // Draw lines for each panel's connections
        for (let panel = 0; panel <= 9; panel++) {
            const neighbors = this.neighbors[panel];
            
            neighbors.forEach(neighbor => {
                // Only draw lines from lower to higher number to avoid duplicates
                if (panel < neighbor) {
                    const fromPos = this.getPanelPosition(panel);
                    const toPos = this.getPanelPosition(neighbor);
                    
                    // Calculate if this is a diagonal connection
                    const isDiagonal = Math.abs(fromPos.x - toPos.x) > 0 && Math.abs(fromPos.y - toPos.y) > 0;
                    
                    let x1 = fromPos.x;
                    let y1 = fromPos.y;
                    let x2 = toPos.x;
                    let y2 = toPos.y;
                    
                    if (isDiagonal) {
                        // For diagonal lines, adjust the endpoints based on ellipse shape
                        // Panel is 70x50 with border-radius: 35% / 50% (ellipse)
                        const dx = toPos.x - fromPos.x;
                        const dy = toPos.y - fromPos.y;
                        const angle = Math.atan2(dy, dx);
                        
                        // Ellipse radii (accounting for actual visual appearance)
                        const rx = 35 * 0.35; // 35% of width (70px / 2)
                        const ry = 25 * 0.50; // 50% of height (50px / 2)
                        
                        // Calculate intersection points with ellipse
                        const t = Math.atan2(ry * Math.sin(angle), rx * Math.cos(angle));
                        x1 += rx * Math.cos(t);
                        y1 += ry * Math.sin(t);
                        
                        const reverseAngle = angle + Math.PI;
                        const t2 = Math.atan2(ry * Math.sin(reverseAngle), rx * Math.cos(reverseAngle));
                        x2 += rx * Math.cos(t2);
                        y2 += ry * Math.sin(t2);
                    }
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
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
        
        // Set flag to remember that game was won
        this.wasEverWon = true;
        
        // Keep panels enabled and show actual colors (already visible)
        for (let i = 0; i <= 9; i++) {
            if (this.panels[i] && this.panels[i].style) {
                this.panels[i].style.pointerEvents = 'auto';
                // Colors are always visible, so no change needed
                this.panels[i].style.background = '';
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
            // Add victory-screen class to enable isGameWon() detection
            titleElement.classList.add('victory-screen');
        }

        // Add share button to grid
        const grid = document.getElementById('panelGrid');
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn reset-button';
        shareBtn.onclick = () => window.open('https://x.com/intent/post?text=%23repair_from_zero+%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%9F%EF%BC%81+%23%E3%82%AB%E3%82%BA%E3%83%AA%E3%83%83%E3%83%88%E5%AE%87%E5%AE%99%E8%AC%8E&url=https://kazushi0114.github.io/repair_from_zero/', '_blank');
        shareBtn.textContent = '𝕏';
        grid.appendChild(shareBtn);
    }

    enableGame() {
        // Re-enable all panels
        for (let i = 0; i <= 9; i++) {
            if (this.panels[i] && this.panels[i].style) {
                this.panels[i].style.pointerEvents = 'auto';
            }
        }

        // Show connection lines again
        const svg = document.getElementById('connections');
        if (svg && svg.style) {
            svg.style.display = 'block';
        }

        // Restore normal controls
        const controlsDiv = document.querySelector('.controls');
        if (controlsDiv) {
            controlsDiv.innerHTML = `
                <button class="empty-button"></button>
                <button onclick="game.reset()">↩</button>
                <button class="empty-button"></button>
            `;
        }
    }
}

if (typeof window !== 'undefined') {
    window.game = new PanelGame();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelGame;
}