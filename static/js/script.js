document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const resultDiv = document.getElementById('result');
    const startCitySelect = document.getElementById('start-city');
    const endCitySelect = document.getElementById('end-city');
    
    // Event tombol main
    playBtn.addEventListener('click', () => {
        const startCity = startCitySelect.value;
        const endCity = endCitySelect.value;
        
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
                resultDiv.innerHTML = `
                    <h2>Rute Ditemukan!</h2>
                    <p><strong>Dari:</strong> Kota ${startCity}</p>
                    <p><strong>Ke:</strong> Kota ${endCity}</p>
                    <div class="path-result">
                        <strong>Rute Terpendek:</strong> 
                        ${data.path.map(city => `Kota ${city}`).join(' → ')}
                    </div>
                    <p><strong>Total Jarak:</strong> ${data.distance} km</p>
                `;
                resultDiv.style.display = 'block';
                
                // Animasi
                resultDiv.style.animation = 'fadeIn 0.5s ease';
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
        resultDiv.innerHTML = `
            <h2>Pengaturan Permainan</h2>
            <div class="settings-form">
                <label for="difficulty">Tingkat Kesulitan:</label>
                <select id="difficulty">
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                </select>
                
                <label for="theme">Tema Tampilan:</label>
                <select id="theme">
                    <option value="light">Terang</option>
                    <option value="dark">Gelap</option>
                    <option value="blue">Biru</option>
                </select>
                
                <button id="save-settings" class="btn primary">Simpan Pengaturan</button>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Event simpan pengaturan
        document.getElementById('save-settings')?.addEventListener('click', () => {
            alert('Pengaturan berhasil disimpan!');
            resultDiv.style.display = 'none';
        });
    });
});