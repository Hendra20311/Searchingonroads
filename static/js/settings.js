document.addEventListener('DOMContentLoaded', () => {
    // Elemen-elemen DOM
    const cityList = document.getElementById('city-list');
    const cityNameInput = document.getElementById('city-name');
    const cityPositionInput = document.getElementById('city-position');
    const connectionsContainer = document.getElementById('connections-container');
    const heuristicsContainer = document.getElementById('heuristics-container');
    const addConnectionBtn = document.getElementById('add-connection-btn');
    const saveCityBtn = document.getElementById('save-city-btn');
    const deleteCityBtn = document.getElementById('delete-city-btn');
    const addCityBtn = document.getElementById('add-city-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalElement = document.getElementById('cityModal');
    const modalInstance = new bootstrap.Modal(modalElement);
    const heuristicScaleInput = document.getElementById('heuristic-scale'); // Dapatkan input skala

    // Variabel internal
    let currentCities = {};
    let currentHeuristics = {};
    let currentPositions = {};
    let currentCity = null;
    let isEditMode = false;
    let currentHeuristicScale = 0;
    let currentScaledHeuristics = {}; // Tambahkan untuk menyimpan heuristik yang diskalakan

    // Variabel pan pratinjau
    let previewIsDragging = false;
    let previewDragStart = { x: 0, y: 0 };
    let previewPanOffset = { x: 0, y: 0 };

    // Fungsi utama memuat data
    async function loadCities() {
        const fullDataResponse = await fetch('/get-full-graph-data'); // Muat data lengkap
        const fullData = await fullDataResponse.json();

        currentCities = fullData.cities || {};
        currentPositions = fullData.positions || {};
        currentHeuristics = fullData.heuristics || {};
        currentHeuristicScale = fullData.heuristic_scale || 0;
        currentScaledHeuristics = fullData.scaled_heuristics || {}; // Dapatkan nilai diskalakan
        heuristicScaleInput.value = currentHeuristicScale;

        renderCityList();
        drawGraphPreview();
    }

    function renderCityList() {
        cityList.innerHTML = '';
        for (const city in currentCities) {
            const connections = Object.keys(currentCities[city]).length;
            // Hitung rata-rata nilai heuristik yang diskalakan
            let totalHeuristic = 0;
            let numHeuristics = 0;
            if (currentScaledHeuristics[city]) { // Pastikan kota memiliki data heuristik
                for (const dest in currentScaledHeuristics[city]) {
                    if (city !== dest) {
                        totalHeuristic += currentScaledHeuristics[city][dest];
                        numHeuristics++;
                    }
                }
            }
            const avgHeuristic = numHeuristics > 0 ? (totalHeuristic / numHeuristics).toFixed(2) : 0;

            const cityItem = document.createElement('div');
            cityItem.className = 'city-item';
            cityItem.dataset.city = city;
            cityItem.innerHTML = `
                <div>
                    <div class="name">Kota ${city}</div>
                    <div class="connections">${connections} koneksi (Rata-rata Heuristik: ${avgHeuristic})</div>
                </div>
                <div>✏️</div>
            `;
            cityItem.addEventListener('click', () => openEditForm(city));
            cityList.appendChild(cityItem);
        }
    }

    function openEditForm(cityName) {
        currentCity = cityName;
        isEditMode = true;
        modalTitle.textContent = `Edit Kota ${cityName}`;
        cityNameInput.value = cityName;
        cityNameInput.disabled = true;

        const pos = currentPositions[cityName];
        cityPositionInput.value = pos ? pos.join(',') : '';

        connectionsContainer.innerHTML = '';
        for (const target in currentCities[cityName]) {
            addConnectionField(target, currentCities[cityName][target]);
        }

        heuristicsContainer.innerHTML = '';
        const heuristics = currentHeuristics[cityName] || {};
        for (const target in heuristics) {
            if (target !== cityName) {
                addHeuristicField(target, heuristics[target]);
            }
        }

        deleteCityBtn.style.display = 'block';
        modalInstance.show();
    }

    function openAddForm() {
        currentCity = null;
        isEditMode = false;
        modalTitle.textContent = 'Tambah Kota Baru';
        cityNameInput.value = '';
        cityNameInput.disabled = false;
        cityPositionInput.value = '';
        connectionsContainer.innerHTML = '';
        heuristicsContainer.innerHTML = '';
        deleteCityBtn.style.display = 'none';
        modalInstance.show();
    }

    function addConnectionField(target = '', distance = '') {
        const div = document.createElement('div');
        div.className = 'connection-item d-flex align-items-center mb-2 gap-2';

        const select = document.createElement('select');
        select.className = 'form-select';
        select.innerHTML = '<option value="">Pilih Kota</option>';
        for (const city in currentCities) {
            if (city !== currentCity) {
                const selected = city === target ? 'selected' : '';
                select.innerHTML += `<option value="${city}" ${selected}>Kota ${city}</option>`;
            }
        }

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.className = 'form-control';
        input.value = distance;
        input.placeholder = 'Jarak';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => div.remove());

        div.appendChild(select);
        div.appendChild(input);
        connectionsContainer.appendChild(div);
    }

    function addHeuristicField(target = '', value = '') {
        const div = document.createElement('div');
        div.className = 'heuristic-item d-flex align-items-center mb-2 gap-2';

        const label = document.createElement('span');
        label.textContent = `Ke Kota ${target}:`;
        label.style.flex = '1';

        const originalInput = document.createElement('input');
        originalInput.type = 'number';
        originalInput.value = value;
        originalInput.min = 0;
        originalInput.className = 'form-control form-control-sm';
        originalInput.placeholder = 'Nilai Asli';
        originalInput.readOnly = true;

        const scaledValue = currentHeuristicScale !== 0 ? (value / currentHeuristicScale).toFixed(2) : value;
        const scaledInput = document.createElement('input');
        scaledInput.type = 'number';
        scaledInput.value = scaledValue;
        scaledInput.min = 0;
        scaledInput.className = 'form-control form-control-sm';
        scaledInput.placeholder = 'Nilai Skala';
        scaledInput.readOnly = true;

        div.appendChild(label);
        div.appendChild(originalInput);
        div.appendChild(scaledInput);
        heuristicsContainer.appendChild(div);
    }

    async function saveCity() {
        const cityName = cityNameInput.value.trim();
        const position = cityPositionInput.value.split(',').map(Number);
        if (!cityName || position.length !== 2 || isNaN(position[0]) || isNaN(position[1])) {
            alert('Nama kota dan posisi wajib diisi.');
            return;
        }

        const connections = [];
        connectionsContainer.querySelectorAll('.connection-item').forEach(item => {
            const select = item.querySelector('select');
            const input = item.querySelector('input');
            if (select.value && input.value) {
                connections.push({ city: select.value, distance: parseInt(input.value) });
            }
        });

        const heuristics = {};
        heuristicsContainer.querySelectorAll('.heuristic-item').forEach(item => {
            const label = item.querySelector('span');
            const input = item.querySelector('input');
            const city = label.textContent.replace('Ke Kota ', '').replace(':', '');
            heuristics[city] = parseInt(input.value);
        });

        const cityData = { name: cityName, position, connections, heuristics };
        const endpoint = isEditMode ? '/edit-city' : '/add-city';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cityData)
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert(`Kota ${cityName} berhasil disimpan.`);
                modalInstance.hide();
                loadCities();
            } else {
                alert(`Gagal menyimpan kota: ${result.message}`); // Tampilkan pesan kesalahan dari backend
            }
        } catch (error) {
            alert('Terjadi kesalahan jaringan atau server.');
        }
    }

    async function deleteCity() {
        if (!currentCity || !confirm(`Hapus kota ${currentCity}?`)) return;

        const response = await fetch('/delete-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentCity })
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert(`Kota ${currentCity} berhasil dihapus.`);
            modalInstance.hide();
            loadCities();
        } else {
            alert('Gagal menghapus kota.');
        }
    }

    function drawGraphPreview() {
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const radius = 20;
        const edgeColor = '#999';
        const nodeColor = '#f39c12';
        const textColor = 'black';

        for (const from in currentCities) {
            for (const to in currentCities[from]) {
                const posFrom = currentPositions[from];
                const posTo = currentPositions[to];
                if (!posFrom || !posTo || from >= to) continue;

                ctx.beginPath();
                ctx.moveTo(posFrom[0] + previewPanOffset.x, posFrom[1] + previewPanOffset.y);
                ctx.lineTo(posTo[0] + previewPanOffset.x, posTo[1] + previewPanOffset.y);
                ctx.strokeStyle = edgeColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                const midX = (posFrom[0] + posTo[0]) / 2 + previewPanOffset.x;
                const midY = (posFrom[1] + posTo[1]) / 2 + previewPanOffset.y;
                ctx.fillStyle = textColor;
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(currentCities[from][to], midX, midY);
            }
        }

        for (const node in currentPositions) {
            const [x, y] = currentPositions[node];

            ctx.beginPath();
            ctx.arc(x + previewPanOffset.x, y + previewPanOffset.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = nodeColor;
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node, x + previewPanOffset.x, y + previewPanOffset.y);
        }
    }

    function addConnectionField(target = '', distance = '') {
        const div = document.createElement('div');
        div.className = 'connection-item d-flex align-items-center mb-2 gap-2';

        const select = document.createElement('select');
        select.className = 'form-select';
        select.innerHTML = '<option value="">Pilih Kota</option>';
        for (const city in currentCities) {
            if (city !== currentCity) {
                const selected = city === target ? 'selected' : '';
                select.innerHTML += `<option value="${city}" ${selected}>Kota ${city}</option>`;
            }
        }

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.className = 'form-control';
        input.value = distance;
        input.placeholder = 'Jarak';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => div.remove());

        div.appendChild(select);
        div.appendChild(input);
        connectionsContainer.appendChild(div);
    }

    // Pendengar perubahan skala heuristik
    heuristicScaleInput.addEventListener('change', async () => {
        const scale = heuristicScaleInput.value;
        const response = await fetch('/save-heuristic-scale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scale: scale })
        });
        const result = await response.json();
        if (result.status === 'success') {
            currentHeuristicScale = parseInt(scale);
            loadCities(); // Muat ulang kota setelah skala diubah
            alert('Skala heuristik berhasil disimpan.');
        } else {
            alert('Gagal menyimpan skala heuristik.');
        }
    });

    // Penanganan kejadian mouse pratinjau
    function handlePreviewMouseDown(e) {
        previewIsDragging = true;
        previewDragStart = { x: e.clientX - previewPanOffset.x, y: e.clientY - previewPanOffset.y };
        previewCanvas.style.cursor = 'grabbing';
    }

    function handlePreviewMouseUp() {
        previewIsDragging = false;
        previewCanvas.style.cursor = 'grab';
    }

    function handlePreviewMouseOut() {
        previewIsDragging = false;
        previewCanvas.style.cursor = 'grab';
    }

    function handlePreviewMouseMove(e) {
        if (!previewIsDragging) return;
        previewPanOffset.x = e.clientX - previewDragStart.x;
        previewPanOffset.y = e.clientY - previewDragStart.y;
        drawGraphPreview(); // Gambar ulang grafik dengan offset yang baru
    }

    // Elemen canvas pratinjau dan konteks
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

    // Bind event untuk canvas pratinjau
    if (previewCanvas) {
        previewCanvas.addEventListener('mousedown', handlePreviewMouseDown);
        previewCanvas.addEventListener('mouseup', handlePreviewMouseUp);
        previewCanvas.addEventListener('mouseout', handlePreviewMouseOut);
        previewCanvas.addEventListener('mousemove', handlePreviewMouseMove);
        previewCanvas.style.cursor = 'grab'; // Atur kursor default
    }

    // Load data awal
    loadCities();
});