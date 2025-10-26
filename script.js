
        // Game elements
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const resetBtn = document.getElementById('resetBtn');
        const hintBtn = document.getElementById('hintBtn');
        const skipBtn = document.getElementById('skipBtn');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        const successMessage = document.getElementById('successMessage');
        const soundToggle = document.getElementById('soundToggle');
        const edgesValue = document.getElementById('edgesValue');
        const movesValue = document.getElementById('movesValue');
        const levelValue = document.getElementById('levelValue');
        const levelDots = [
            document.getElementById('levelDot1'),
            document.getElementById('levelDot2'),
            document.getElementById('levelDot3')
        ];
        
        // Audio setup
        let audioContext, soundEnabled = true;        
        function initAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                soundEnabled = false;
                soundToggle.style.display = 'none';
            }
        }        
        function playConnectSound() {
            if (!soundEnabled || !audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 600 + Math.random() * 100;
            gainNode.gain.value = 0.2;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
            
            setTimeout(() => oscillator.stop(), 150);
        }        
        soundToggle.addEventListener('click', function() {
            soundEnabled = !soundEnabled;
            this.textContent = soundEnabled ? '🔊' : '🔇';
            this.style.background = soundEnabled ? '#F7FAFC' : '#FF6B6B';
        });
        
        // Game levels
        const levels = [
            { 
    vertices: [
        { x: 0.3, y: 0.2 },  // 0 top
        { x: 0.7, y: 0.4 },  // 1 right
        { x: 0.4, y: 0.7 },  // 2 bottom
        { x: 0.1, y: 0.5 }   // 3 tail node
    ],
    edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 0 },  // triangle
        { from: 0, to: 3 }   // tail
    ]
},
            { // Level 2 - House
                vertices: [
                    { x: 0.5, y: 0.25 }, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 },
                    { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }
                ],
                edges: [
                    { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 2 },
                    { from: 1, to: 3 }, { from: 2, to: 4 }, { from: 3, to: 4 }
                ]
            },
            { // Level 3 - Complex
                vertices: [
                    { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }, { x: 0.85, y: 0.5 },
                    { x: 0.7, y: 0.7 }, { x: 0.3, y: 0.7 }, { x: 0.15, y: 0.5 },
                    { x: 0.5, y: 0.5 }
                ],
                edges: [
                    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
                    { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 0 },
                    { from: 0, to: 6 }, { from: 3, to: 6 }
                ]
            },
            {
    vertices: [
        { x: 0.3, y: 0.7 },  // 0 bottom-left
        { x: 0.7, y: 0.7 },  // 1 bottom-right
        { x: 0.7, y: 0.4 },  // 2 top-right
        { x: 0.3, y: 0.4 },  // 3 top-left
        { x: 0.5, y: 0.2 }   // 4 roof peak
    ],
    edges: [
        { from: 0, to: 1 },  // base
        { from: 1, to: 2 },  // right wall
        { from: 2, to: 3 },  // ceiling
        { from: 3, to: 0 },  // left wall
        { from: 3, to: 4 },  // roof left
        { from: 2, to: 4 },  // roof right
        { from: 0, to: 2 }   // diagonal inside
    ]
}



        ];
        
        let currentLevel = 0;
        let gameState = {
            vertices: [], edges: [], tracedEdges: [], currentPath: [], moves: 0, isDrawing: false
        };
        
        // Initialize game
        function initGame() {
            const level = levels[currentLevel];
            gameState.vertices = level.vertices.map(v => ({
                x: v.x * canvas.width, y: v.y * canvas.height
            }));
            gameState.edges = [...level.edges];
            gameState.tracedEdges = [];
            gameState.currentPath = [];
            gameState.moves = 0;
            gameState.isDrawing = false;
            
            updateUI();
            drawGraph();
        }

        function updateUI() {
            edgesValue.textContent = `${gameState.tracedEdges.length}/${gameState.edges.length}`;
            movesValue.textContent = gameState.moves;
            levelValue.textContent = currentLevel + 1;
            
            levelDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentLevel);
            });
        }
        
        // Draw the graph
        function drawGraph() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw edges
            ctx.strokeStyle = '#CBD5E0';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            gameState.edges.forEach(edge => {
                const from = gameState.vertices[edge.from];
                const to = gameState.vertices[edge.to];
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            });
            
            // Draw traced edges
            ctx.strokeStyle = '#4ECDC4';
            ctx.lineWidth = 6;
            gameState.tracedEdges.forEach(edgeIndex => {
                const edge = gameState.edges[edgeIndex];
                const from = gameState.vertices[edge.from];
                const to = gameState.vertices[edge.to];
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            });
            
            // Draw current path
            if (gameState.currentPath.length > 1) {
                ctx.strokeStyle = '#45B7D1';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(gameState.currentPath[0].x, gameState.currentPath[0].y);
                for (let i = 1; i < gameState.currentPath.length; i++) {
                    ctx.lineTo(gameState.currentPath[i].x, gameState.currentPath[i].y);
                }
                ctx.stroke();
            }
            
            // Draw vertices
            gameState.vertices.forEach(vertex => {
                // Outer glow
                ctx.fillStyle = 'rgba(78, 205, 196, 0.2)';
                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Main dot
                ctx.fillStyle = '#4ECDC4';
                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(vertex.x - 3, vertex.y - 3, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Find closest vertex
        function findClosestVertex(x, y) {
            for (let i = 0; i < gameState.vertices.length; i++) {
                const vertex = gameState.vertices[i];
                const dist = Math.sqrt((x - vertex.x) ** 2 + (y - vertex.y) ** 2);
                if (dist < 35) return i;
            }
            return -1;
        }
        
        // Find edge between vertices
        function findEdge(from, to) {
            for (let i = 0; i < gameState.edges.length; i++) {
                const edge = gameState.edges[i];
                if ((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)) {
                    return i;
                }
            }
            return -1;
        }
        
        // Handle user input
        function handleStart(x, y) {
            const vertexIndex = findClosestVertex(x, y);
            if (vertexIndex !== -1) {
                gameState.isDrawing = true;
                gameState.currentPath = [gameState.vertices[vertexIndex]];
            }
        }
        
        function handleMove(x, y) {
            if (!gameState.isDrawing) return;
            
            const vertexIndex = findClosestVertex(x, y);
            if (vertexIndex !== -1) {
                const lastVertex = gameState.currentPath[gameState.currentPath.length - 1];
                const currentVertex = gameState.vertices[vertexIndex];
                
                if (lastVertex !== currentVertex) {
                    const fromIndex = gameState.vertices.indexOf(lastVertex);
                    const toIndex = vertexIndex;
                    const edgeIndex = findEdge(fromIndex, toIndex);
                    
                    if (edgeIndex !== -1 && !gameState.tracedEdges.includes(edgeIndex)) {
                        gameState.currentPath.push(currentVertex);
                        gameState.tracedEdges.push(edgeIndex);
                        gameState.moves++;
                        
                        playConnectSound();
                        updateUI();
                        drawGraph();
                        
                        // Check for win
                        if (gameState.tracedEdges.length === gameState.edges.length) {
                            setTimeout(() => successMessage.style.display = 'flex', 600);
                        }
                    }
                }
            }
        }        
        function handleEnd() {
            gameState.isDrawing = false;
        }        
        // Event listeners
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            handleStart(e.clientX - rect.left, e.clientY - rect.top);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            handleMove(e.clientX - rect.left, e.clientY - rect.top);
        });
        
        canvas.addEventListener('mouseup', handleEnd);
        canvas.addEventListener('mouseleave', handleEnd);
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            handleStart(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            handleMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        });
        
        canvas.addEventListener('touchend', handleEnd);
        
        // Button handlers
        resetBtn.addEventListener('click', initGame);
        
        hintBtn.addEventListener('click', () => {
            const hints = [
                "Try starting from any corner dot",
                "Begin at the bottom and work upward",
                "The center dot connects to multiple paths"
            ];
            alert(hints[currentLevel]);
        });
        
        skipBtn.addEventListener('click', () => {
            if (currentLevel < levels.length - 1) {
                currentLevel++;
                initGame();
            } else {
                alert("You've finished all the puzzles! 🎉");
            }
        });
        
        nextLevelBtn.addEventListener('click', () => {
            successMessage.style.display = 'none';
            if (currentLevel < levels.length - 1) {
                currentLevel++;
                initGame();
            } else {
                alert("Amazing! You completed all levels! 🏆");
                currentLevel = 0;
                initGame();
            }
        });        
        // Initialize
        // function resizeCanvas() {
        //     const board = canvas.parentElement;
        //     canvas.width = board.clientWidth;
        //     canvas.height = board.clientHeight;
        //     initGame();
        // }        

        function resizeCanvas() {
  const board = canvas.parentElement;

  // CSS display size in pixels
  const displayWidth  = board.clientWidth;
  const displayHeight = board.clientHeight;

  // If you want to handle high DPI:
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(displayWidth  * dpr);
  canvas.height = Math.round(displayHeight * dpr);

  // Optionally scale the context so that your drawing logic uses CSS‐pixel coordinates
  ctx.scale(dpr, dpr);

  initGame();
}

        window.addEventListener('resize', resizeCanvas);
        initAudio();
        resizeCanvas();
    