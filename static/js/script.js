document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-btn');
    const resultDiv = document.getElementById('result');
    const startCitySelect = document.getElementById('start-city');
    const endCitySelect = document.getElementById('end-city');
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    let nodePositions = {};
    let cities = {};
    let heuristics = {};
    let startCity = 'A';
    let endCity = 'F';
    let animationInterval = null;
    let currentHeuristicScale = 0;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let panOffset = { x: 0, y: 0 };

    const graphConfig = {
        nodeRadius: 25,
        nodeColors: {
            default: '#FF4136',
            start: '#FF69B4',
            end: '#9400D3',
            exploring: '#FFDC00',
            finalPath: '#2ECC40'
        },
        edgeColors: {
            default: '#FF4136',
            exploring: '#FFDC00',
            finalPath: '#2ECC40'
        }
    };

    function drawNode(label, x, y, color) {
        ctx.beginPath();
        ctx.arc(x + panOffset.x, y + panOffset.y, graphConfig.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Kota ' + label, x + panOffset.x, y + panOffset.y);
    }

    function drawEdge(from, to, color) {
        const fromPos = nodePositions[from];
        const toPos = nodePositions[to];
        if (!fromPos || !toPos) return;

        ctx.beginPath();
        ctx.moveTo(fromPos.x + panOffset.x, fromPos.y + panOffset.y);
        ctx.lineTo(toPos.x + panOffset.x, toPos.y + panOffset.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function drawEdgeLabel(from, to, distance) {
        const fromPos = nodePositions[from];
        const toPos = nodePositions[to];
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(midX + panOffset.x, midY + panOffset.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(distance, midX + panOffset.x, midY + panOffset.y);
    }

    function drawGraph(highlightedNodes = [], highlightedEdges = [], finalPath = []) {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const [from, neighbors] of Object.entries(cities)) {
            for (const [to, distance] of Object.entries(neighbors)) {
                if (from < to) {
                    let isFinalEdge = false;
                    if (finalPath.length > 0) {
                        for (let i = 0; i < finalPath.length - 1; i++) {
                            if ((finalPath[i] === from && finalPath[i + 1] === to) ||
                                (finalPath[i] === to && finalPath[i + 1] === from)) {
                                isFinalEdge = true;
                                break;
                            }
                        }
                    }

                    const isHighlighted = highlightedEdges.includes(`${from}-${to}`) ||
                                          highlightedEdges.includes(`${to}-${from}`);
                    const color = isFinalEdge ? graphConfig.edgeColors.finalPath :
                                  isHighlighted ? graphConfig.edgeColors.exploring :
                                  graphConfig.edgeColors.default;
                    drawEdge(from, to, color);
                    drawEdgeLabel(from, to, distance);
                }
            }
        }

        for (const [node, pos] of Object.entries(nodePositions)) {
            const isStart = node === startCity;
            const isEnd = node === endCity;
            const isHighlighted = highlightedNodes.includes(node);
            const isFinal = finalPath.includes(node);

            const color = isStart ? graphConfig.nodeColors.start :
                          isEnd ? graphConfig.nodeColors.end :
                          isFinal ? graphConfig.nodeColors.finalPath :
                          isHighlighted ? graphConfig.nodeColors.exploring :
                          graphConfig.nodeColors.default;
            drawNode(node, pos.x, pos.y, color);
        }
    }

    function animateSearchProcess(steps, finalPath) {
        let stepIndex = 0;
        if (animationInterval) clearInterval(animationInterval);
        animationInterval = setInterval(() => {
            if (stepIndex >= steps.length) {
                clearInterval(animationInterval);
                drawGraph([], [], finalPath);
                showResult(finalPath);
                return;
            }
            const step = steps[stepIndex];
            drawGraph(step.exploredNodes, step.exploredEdges, []);
            stepIndex++;
        }, 1000);
    }

    function showResult(finalPath) {
        if (!resultDiv) return;
        let totalDistance = 0;
        for (let i = 0; i < finalPath.length - 1; i++) {
            totalDistance += cities[finalPath[i]][finalPath[i + 1]];
        }

        resultDiv.innerHTML = `
            <h2>Rute Ditemukan!</h2>
            <p><strong>Dari:</strong> Kota ${startCity}</p>
            <p><strong>Ke:</strong> Kota ${endCity}</p>
            <div class="path-result">
                <strong>Rute Terpendek:</strong> 
                ${finalPath.map(city => `Kota ${city}`).join(' → ')}
            </div>
            <p><strong>Total Jarak:</strong> ${totalDistance} km</p>
        `;
        resultDiv.style.display = 'block';
        resultDiv.style.animation = 'fadeIn 0.5s ease';
    }

    function initializeGraph() {
        startCity = startCitySelect?.value || 'A';
        endCity = endCitySelect?.value || 'F';
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        drawGraph();
    }

    function updateCityOptions(selectElement, cities) {
        selectElement.innerHTML = '';
        for (const city in cities) {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = `Kota ${city}`;
            selectElement.appendChild(option);
        }
    }

    function handleMouseDown(e) {
        isDragging = true;
        dragStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        canvas.style.cursor = 'grabbing';
    }

    function handleMouseUp() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }

    function handleMouseOut() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        panOffset.x = e.clientX - dragStart.x;
        panOffset.y = e.clientY - dragStart.y;
        drawGraph();
    }

    // Bind event
    if (startCitySelect) startCitySelect.addEventListener('change', initializeGraph);
    if (endCitySelect) endCitySelect.addEventListener('change', initializeGraph);

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            startCity = startCitySelect.value;
            endCity = endCitySelect.value;
            resultDiv.style.display = 'none';
            initializeGraph();
            fetch('/find-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start: startCity, end: endCity, heuristicScale: currentHeuristicScale })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    animateSearchProcess(data.steps, data.path);
                } else {
                    resultDiv.innerHTML = `<p class="error">${data.message}</p>`;
                    resultDiv.style.display = 'block';
                }
            })
            .catch(error => {
                resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
                resultDiv.style.display = 'block';
            });
        });
    }

    function fetchGraphData() {
        fetch('/get-full-graph-data')
            .then(res => res.json())
            .then(data => {
                nodePositions = {};
                for (const [key, val] of Object.entries(data.positions)) {
                    nodePositions[key] = { x: val[0], y: val[1] };
                }
                cities = data.cities;
                heuristics = data.heuristics;
                currentHeuristicScale = data.heuristic_scale || 0;
            
                // Perbarui opsi di select start-city dan end-city
                updateCityOptions(startCitySelect, cities);
                updateCityOptions(endCitySelect, cities);

                initializeGraph();
            });
    }

    if (canvas) {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseout', handleMouseOut);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.style.cursor = 'grab'; // Set cursor default
    }

    fetchGraphData();
});