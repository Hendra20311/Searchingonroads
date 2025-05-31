document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const resultDiv = document.getElementById('result');
    const startCitySelect = document.getElementById('start-city');
    const endCitySelect = document.getElementById('end-city');
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    
    // Variabel global untuk status pencarian
    let startCity = 'A';
    let endCity = 'F';
    let animationInterval = null;
    
    // Konfigurasi visual graf
    const graphConfig = {
        nodeRadius: 25,
        nodeColors: {
            default: '#FF4136',    // Merah (belum dieksplorasi)
            start: '#FF69B4',      // Pink (kota awal)
            end: '#9400D3',        // Ungu (kota tujuan)
            exploring: '#FFDC00',  // Kuning (sedang dieksplorasi)
            finalPath: '#2ECC40'   // Hijau (rute terpendek)
        },
        edgeColors: {
            default: '#FF4136',    // Merah (belum dieksplorasi)
            exploring: '#FFDC00',  // Kuning (sedang dieksplorasi)
            finalPath: '#2ECC40'   // Hijau (rute terpendek)
        }
    };
    
    // Posisi node di canvas (disesuaikan dengan graf)
    const nodePositions = {
        'A': { x: 100, y: 250 },
        'B': { x: 250, y: 150 },
        'C': { x: 250, y: 350 },
        'D': { x: 400, y: 250 },
        'E': { x: 550, y: 350 },
        'F': { x: 700, y: 250 }
    };
    
    // Struktur graf (harus sama dengan backend)
    const cities = {
        'A': {'B': 10, 'C': 15},
        'B': {'A': 10, 'D': 12},
        'C': {'A': 15, 'D': 10, 'E': 8},
        'D': {'B': 12, 'C': 10, 'F': 5},
        'E': {'C': 8, 'F': 7},
        'F': {'D': 5, 'E': 7}
    };
    
    // Fungsi untuk menggambar graf
    function drawGraph(highlightedNodes = [], highlightedEdges = [], finalPath = []) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Gambar semua edge terlebih dahulu
        for (const [from, neighbors] of Object.entries(cities)) {
            for (const [to, distance] of Object.entries(neighbors)) {
                // Cegah menggambar edge dua kali
                if (from < to) {
                    let isFinalEdge = false;
                    if (finalPath.length > 0) {
                        for (let i = 0; i < finalPath.length - 1; i++) {
                            if ((finalPath[i] === from && finalPath[i+1] === to) ||
                                (finalPath[i] === to && finalPath[i+1] === from)) {
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
                    
                    // Gambar jarak di tengah edge
                    drawEdgeLabel(from, to, distance);
                }
            }
        }
        
        // Gambar semua node
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
    
    // Fungsi untuk menggambar node
    function drawNode(label, x, y, color) {
        // Lingkaran node
        ctx.beginPath();
        ctx.arc(x, y, graphConfig.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label node
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Kota ' + label, x, y);
    }
    
    // Fungsi untuk menggambar edge
    function drawEdge(from, to, color) {
        const fromPos = nodePositions[from];
        const toPos = nodePositions[to];
        
        if (!fromPos || !toPos) return;
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // Fungsi untuk menggambar label edge
    function drawEdgeLabel(from, to, distance) {
        const fromPos = nodePositions[from];
        const toPos = nodePositions[to];
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        
        // Background label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(midX, midY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Text label
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(distance, midX, midY);
    }
    
    // Fungsi untuk menginisialisasi graf
    function initializeGraph() {
        startCity = startCitySelect.value;
        endCity = endCitySelect.value;
        
        // Hentikan animasi yang sedang berjalan
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        
        // Gambar graf awal
        drawGraph();
    }
    
    // Fungsi untuk animasi proses pencarian
    function animateSearchProcess(steps, finalPath) {
        let stepIndex = 0;
        
        // Hentikan animasi sebelumnya jika ada
        if (animationInterval) {
            clearInterval(animationInterval);
        }
        
        animationInterval = setInterval(() => {
            if (stepIndex >= steps.length) {
                clearInterval(animationInterval);
                // Tampilkan jalur akhir
                drawGraph([], [], finalPath);
                
                // Tampilkan hasil
                showResult(finalPath);
                return;
            }
            
            const step = steps[stepIndex];
            drawGraph(step.exploredNodes, step.exploredEdges, []);
            stepIndex++;
        }, 1000); // Update setiap 1 detik
    }
    
    // Fungsi untuk menampilkan hasil
    function showResult(finalPath) {
        // Hitung jarak total
        let totalDistance = 0;
        for (let i = 0; i < finalPath.length - 1; i++) {
            const from = finalPath[i];
            const to = finalPath[i+1];
            totalDistance += cities[from][to];
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
    
    // Event listener untuk perubahan seleksi kota
    startCitySelect.addEventListener('change', initializeGraph);
    endCitySelect.addEventListener('change', initializeGraph);
    
    // Event tombol main
    playBtn.addEventListener('click', () => {
        startCity = startCitySelect.value;
        endCity = endCitySelect.value;
        
        // Reset visualisasi
        resultDiv.style.display = 'none';
        initializeGraph();
        
        // Kirim request ke backend
        fetch('/find-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start: startCity,
                end: endCity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Animasi proses pencarian
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
    
    // Event tombol setting
    settingsBtn.addEventListener('click', () => {
        // Hentikan animasi yang sedang berjalan
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        
        resultDiv.innerHTML = `
            <h2>Pengaturan Permainan</h2>
            <div class="settings-form">
                <label for="difficulty">Tingkat Kesulitan:</label>
                <select id="difficulty">
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                </select>
                
                <label for="animation-speed">Kecepatan Animasi:</label>
                <select id="animation-speed">
                    <option value="slow">Lambat</option>
                    <option value="medium" selected>Sedang</option>
                    <option value="fast">Cepat</option>
                </select>
                
                <button id="save-settings" class="btn primary">Simpan Pengaturan</button>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Event simpan pengaturan
        document.getElementById('save-settings').addEventListener('click', () => {
            alert('Pengaturan berhasil disimpan!');
            resultDiv.style.display = 'none';
        });
    });
    
    // Inisialisasi graf saat pertama kali dimuat
    initializeGraph();
});