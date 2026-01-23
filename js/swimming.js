
// Swimming Module Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Swimming File Upload
    // Initialize Swimming File Upload
    setupFileUpload({
        zoneId: 'swimUploadArea',
        inputId: 'swimVideoInput',
        btnId: 'btnSwimSelectFile',
        resultBoxId: 'swimResultBox',
        mockId: 'aiOutputMock',
        // New Workflow Fields
        videoId: 'swimVideoPlayer',
        canvasId: 'swimCanvas',
        analyzeBtnId: 'btnAnalyzeSwim',
        module: 'Swimming',
        onAnalysisComplete: () => {
            const results = videoProcessor.getAnalysisResults();
            if (results && results.detected) {
                const resultBox = document.getElementById('swimResultBox');
                // Hide mock/waiting text
                const waitingText = resultBox.querySelector('.text-secondary.fst-italic');
                if (waitingText) waitingText.classList.add('d-none');

                // Build Result HTML
                const html = `
                    <div class="alert alert-success border-0 bg-success-subtle text-success mb-3">
                        <ion-icon name="checkmark-circle" class="me-2"></ion-icon>
                        <strong>Analysis Complete</strong>
                    </div>
                    <div class="row text-center mb-4">
                        <div class="col-6">
                            <h3 class="display-6 fw-bold text-primary">${results.strokeCount}</h3>
                            <small class="text-secondary text-uppercase">Total Strokes</small>
                        </div>
                        <div class="col-6">
                            <h3 class="display-6 fw-bold text-info">${results.avgSPM.toFixed(1)}</h3>
                            <small class="text-secondary text-uppercase">Avg SPM</small>
                        </div>
                    </div>
                    <div class="p-3 bg-light rounded border">
                        <h6 class="mb-2"><ion-icon name="information-circle" class="me-2"></ion-icon>Technique Insights</h6>
                        <ul class="list-unstyled mb-0 small text-secondary">
                            <li class="mb-1">• Consistent rhythm detected.</li>
                            <li class="mb-1">• Stroke rate suggests ${results.avgSPM < 20 ? 'gliding/drill focus' : results.avgSPM > 50 ? 'sprinting/high turnover' : 'steady endurance pace'}.</li>
                        </ul>
                    </div>
                `;

                const mockOutput = document.getElementById('aiOutputMock');
                if (mockOutput) {
                    mockOutput.innerHTML = html;
                    mockOutput.classList.remove('d-none');
                }
            }
        }
    });

    initSwimmingCalculator();
    initSwimmingZones();
});


function initSwimmingZones() {
    const btnCalc = document.getElementById('btnCalcSwimZones');
    if (btnCalc) {
        btnCalc.addEventListener('click', () => {
            const cssStr = document.getElementById('inputCssPace').value;
            // Expected format MM:SS
            if (!cssStr || !cssStr.includes(':')) {
                alert('Please enter CSS Pace in MM:SS format.');
                return;
            }

            const cssSeconds = parseTime(cssStr);
            if (!cssSeconds) return;

            // Improved CSS-based zones (per 100m)
            // Zone 1 (Recovery): CSS + 15-20s
            // Zone 2 (Endurance): CSS + 8-15s  
            // Zone 3 (Tempo): CSS + 3-8s
            // Zone 4 (Threshold): CSS ± 3s
            // Zone 5 (VO2/Sprint): CSS - 3-8s

            const currentLang = localStorage.getItem('adminLang') || 'es';
            const t = translations[currentLang] || translations.es;
            const labels = [t.zone_1_label, t.zone_2_label, t.zone_3_label, t.zone_4_label, t.zone_5_label];

            const zones = [
                { min: cssSeconds + 15, max: cssSeconds + 20 },  // Z1
                { min: cssSeconds + 8, max: cssSeconds + 15 },   // Z2
                { min: cssSeconds + 3, max: cssSeconds + 8 },    // Z3
                { min: cssSeconds - 3, max: cssSeconds + 3 },    // Z4
                { min: cssSeconds - 8, max: cssSeconds - 3 }     // Z5
            ];

            let html = '';
            const colors = ['info', 'success', 'warning', 'orange', 'danger'];

            zones.forEach((z, i) => {
                const paceMin = formatTime(z.min).slice(0, 5);
                const paceMax = formatTime(z.max).slice(0, 5);
                const paceStr = `${paceMax} - ${paceMin}`;

                html += `
                    <div class="p-3 border rounded mb-1 ${colors[i] === 'orange' ? '' : 'border-' + colors[i] + ' bg-' + colors[i]}" style="${colors[i] === 'orange' ? 'border-color:#fd7e14 !important; background-color:rgba(253, 126, 20, 0.1);' : '--bs-bg-opacity: .05;'}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0 ${colors[i] === 'orange' ? '' : 'text-' + colors[i]} fw-bold" style="${colors[i] === 'orange' ? 'color:#fd7e14' : ''}">${labels[i]}</h6>
                                <small class="text-secondary">CSS ${i === 0 ? '+15-20s' : i === 1 ? '+8-15s' : i === 2 ? '+3-8s' : i === 3 ? '±3s' : '-3-8s'}</small>
                            </div>
                            <h4 class="mb-0 font-monospace ${colors[i] === 'orange' ? '' : 'text-' + colors[i]}" style="${colors[i] === 'orange' ? 'color:#fd7e14' : ''}">${paceStr} <small class="fs-6 text-secondary">/100m</small></h4>
                        </div>
                    </div>
                `;
            });

            document.getElementById('swimZonesResult').innerHTML = html;
        });
    }
}

function initSwimmingCalculator() {
    // Direct Calculation: Distance + Time -> Pace
    const btnCalculatePace = document.getElementById('btnCalculatePace');

    if (btnCalculatePace) {
        btnCalculatePace.addEventListener('click', () => {
            const distInput = document.getElementById('calcDist');
            const timeInput = document.getElementById('calcTime');

            const distance = parseFloat(distInput.value.replace(',', '.'));
            const timeStr = timeInput.value.trim();

            if (!distance || !timeStr) {
                const currentLang = localStorage.getItem('adminLang') || 'es';
                const t = translations[currentLang] || translations.es;
                alert(t.alert_enter_values || 'Please enter distance and time');
                return;
            }

            const totalSeconds = parseTime(timeStr);
            const pacePer100 = (totalSeconds / distance) * 100;
            const pacePer50 = (totalSeconds / distance) * 50;
            const speedKmh = (distance / totalSeconds) * 3.6; // m/s to km/h

            // Update main result
            document.getElementById('resultPace').textContent = formatTime(pacePer100).slice(0, 5);

            // Show additional metrics
            const metricsHtml = `
                <div class="mt-3 p-2 border rounded border-primary" style="--bs-bg-opacity: .05; background-color: var(--bs-primary-bg-subtle);">
                    <div class="row text-center">
                        <div class="col-4">
                            <small class="text-secondary d-block">Per 50m</small>
                            <strong class="text-primary">${formatTime(pacePer50).slice(0, 5)}</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-secondary d-block">Per 100m</small>
                            <strong class="text-primary">${formatTime(pacePer100).slice(0, 5)}</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-secondary d-block">Speed</small>
                            <strong class="text-primary">${speedKmh.toFixed(2)} km/h</strong>
                        </div>
                    </div>
                </div>
            `;

            // Insert metrics after the result display
            const resultContainer = document.getElementById('resultPace').parentElement;
            let metricsDiv = resultContainer.querySelector('.swim-metrics');
            if (!metricsDiv) {
                metricsDiv = document.createElement('div');
                metricsDiv.className = 'swim-metrics';
                resultContainer.appendChild(metricsDiv);
            }
            metricsDiv.innerHTML = metricsHtml;
        });
    }

    // Project Time: Pace + New Distance -> New Time
    const btnPredict = document.getElementById('btnPredict');

    if (btnPredict) {
        btnPredict.addEventListener('click', () => {
            const targetDist = parseFloat(document.getElementById('targetDist').value);
            // Get pace from previous Calc or input (mocking simple flow here)
            // For simplicity, re-calculating from inputs
            const baseDist = parseFloat(document.getElementById('calcDist').value);
            const baseTime = document.getElementById('calcTime').value;

            if (!targetDist || !baseDist || !baseTime) {
                const currentLang = localStorage.getItem('adminLang') || 'es';
                const t = translations[currentLang] || translations.es;
                alert(t.alert_fill_fields || 'Please fill out base distance, time and target distance');
                return;
            }

            const totalSeconds = parseTime(baseTime);
            const pacePerMeter = totalSeconds / baseDist;
            const predictedSeconds = pacePerMeter * targetDist;

            document.getElementById('resultTime').textContent = formatTime(predictedSeconds);
        });
    }
}
