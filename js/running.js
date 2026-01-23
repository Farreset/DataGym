
// Running Module Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Running File Upload
    setupFileUpload({
        zoneId: 'runUploadArea',
        inputId: 'runVideoInput',
        btnId: 'btnRunSelectFile',
        resultBoxId: 'runResultBox',
        mockId: 'runAiOutputMock',
        // New Workflow Fields
        videoId: 'runVideoPlayer',
        canvasId: 'runCanvas',
        analyzeBtnId: 'btnAnalyzeRun',
        module: 'Running',
        onAnalysisComplete: () => {
            const results = videoProcessor.getAnalysisResults();
            if (results && results.detected) {
                const resultBox = document.getElementById('runResultBox');
                const waitingText = resultBox.querySelector('.text-secondary.fst-italic');
                if (waitingText) waitingText.classList.add('d-none');

                // Build Corrections List
                let correctionsHtml = '';
                if (results.corrections.length > 0) {
                    correctionsHtml = '<ul class="list-unstyled mb-0 text-start">';
                    results.corrections.forEach(c => {
                        correctionsHtml += `<li class="text-danger small"><ion-icon name="alert-circle" class="me-1"></ion-icon>${c}</li>`;
                    });
                    correctionsHtml += '</ul>';
                } else {
                    correctionsHtml = '<p class="text-success small mb-0"><ion-icon name="checkmark-circle" class="me-1"></ion-icon>¡Buena Técnica!</p>';
                }

                // Build Recommendations List
                let recHtml = '';
                results.recommendations.forEach(r => {
                    recHtml += `<span class="badge bg-info text-dark me-1">${r}</span>`;
                });

                const html = `
                     <div class="row text-center mb-3">
                        <div class="col-6">
                            <h1 class="display-4 fw-bold text-primary">${results.spm}</h1>
                            <span class="text-muted small text-uppercase">Cadencia (SPM)</span>
                        </div>
                        <div class="col-6">
                            <h1 class="display-4 fw-bold text-success">${results.lean}°</h1>
                            <span class="text-muted small text-uppercase">Inclinación</span>
                        </div>
                    </div>
                    <div class="row g-2">
                        <div class="col-6">
                            <div class="p-2 border rounded bg-white bg-opacity-10 h-100">
                                <h6 class="small text-uppercase text-secondary mb-2">Correcciones</h6>
                                ${correctionsHtml}
                            </div>
                        </div>
                         <div class="col-6">
                            <div class="p-2 border rounded bg-white bg-opacity-10 h-100">
                                <h6 class="small text-uppercase text-secondary mb-2">Recomendado</h6>
                                <div>${recHtml}</div>
                            </div>
                        </div>
                    </div>
                `;

                const mockOutput = document.getElementById('runAiOutputMock');
                if (mockOutput) {
                    mockOutput.innerHTML = html;
                    mockOutput.classList.remove('d-none');
                }
            }
        }
    });

    initZoneConfig();
    initRunZoneCalculator();
    initRunningCalculators();
});

// Default Zones
const defaultZones = {
    z1: { min: 50, max: 60 },
    z2: { min: 60, max: 70 },
    z3: { min: 70, max: 80 },
    z4: { min: 80, max: 90 },
    z5: { min: 90, max: 100 }
};

function loadZones() {
    const saved = JSON.parse(localStorage.getItem('runningZones')) || defaultZones;
    if (document.getElementById('z1_min')) {
        document.getElementById('z1_min').value = saved.z1.min; document.getElementById('z1_max').value = saved.z1.max;
        document.getElementById('z2_min').value = saved.z2.min; document.getElementById('z2_max').value = saved.z2.max;
        document.getElementById('z3_min').value = saved.z3.min; document.getElementById('z3_max').value = saved.z3.max;
        document.getElementById('z4_min').value = saved.z4.min; document.getElementById('z4_max').value = saved.z4.max;
        document.getElementById('z5_min').value = saved.z5.min; document.getElementById('z5_max').value = saved.z5.max;
    }
    return saved;
}

function initZoneConfig() {
    const modalEl = document.getElementById('zoneConfigModal');
    if (!modalEl) return;

    const zoneConfigModal = new bootstrap.Modal(modalEl);

    // We need to wait for sidebar injection to find the button, but sidebar is injected in common.js which runs first.
    // However, common.js injects HTML, so we can try to find the button now.
    // But since the button is in the sidebar which is technically dynamic, we might need event delegation or a slight delay if it wasn't synchronous.
    // Ideally common.js runs, injects sync, then this runs.

    // Actually, the button ID 'btnOpenZoneConfig' needs to be in the DOM. 
    // Since we are moving to MPA, the sidebar is injected on load. 
    // We can attach a listener to document body using delegation for the sidebar button to be safe, or just query it.

    // NOTE: In the Sidebar HTML in common.js, we need to ensure the ID is correct.

    // Since sidebar is injected via common.js on DOMContentLoaded, and this also runs on DOMContentLoaded, order matters.
    // To be safe, we'll use a delegation or timeout. Or rely on common.js being included BEFORE this file.

    // We will assume common.js functions have run.

    // Delegation for Sidebar Link
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btnOpenZoneConfig');
        if (btn) {
            e.preventDefault();
            loadZones();
            zoneConfigModal.show();
        }
    });

    const btnSaveZones = document.getElementById('btnSaveZones');
    if (btnSaveZones) {
        btnSaveZones.addEventListener('click', () => {
            const newZones = {
                z1: { min: document.getElementById('z1_min').value, max: document.getElementById('z1_max').value },
                z2: { min: document.getElementById('z2_min').value, max: document.getElementById('z2_max').value },
                z3: { min: document.getElementById('z3_min').value, max: document.getElementById('z3_max').value },
                z4: { min: document.getElementById('z4_min').value, max: document.getElementById('z4_max').value },
                z5: { min: document.getElementById('z5_min').value, max: document.getElementById('z5_max').value }
            };
            localStorage.setItem('runningZones', JSON.stringify(newZones));
            zoneConfigModal.hide();
            // Re-calculate if VAM is present
            if (document.getElementById('inputVam') && document.getElementById('inputVam').value) {
                document.getElementById('btnCalcZones').click();
            }
        });
    }
}

function initRunZoneCalculator() {
    const btnCalcZones = document.getElementById('btnCalcZones');
    if (btnCalcZones) {
        btnCalcZones.addEventListener('click', () => {
            const vamStr = document.getElementById('inputVam').value;
            if (!vamStr.includes(':')) {
                const currentLang = localStorage.getItem('adminLang') || 'es';
                const t = translations[currentLang] || translations.es;
                alert(t.alert_vam_format || 'Please enter VAM in MM:SS format');
                return;
            }

            const vamSeconds = parseTime(vamStr);
            if (!vamSeconds) return;

            // Convert VAM to decimal minutes (MM.mm format)
            const vamMinutes = Math.floor(vamSeconds / 60);
            const vamSecondsRemainder = vamSeconds % 60;
            const vamDecimalMinutes = vamMinutes + (vamSecondsRemainder / 60);

            const zones = loadZones();

            let html = '';

            const zonesList = ['z1', 'z2', 'z3', 'z4', 'z5'];
            const colors = ['info', 'success', 'warning', 'orange', 'danger'];
            const currentLang = localStorage.getItem('adminLang') || 'es';
            const t = translations[currentLang] || translations.es;
            const labels = [t.zone_1_label, t.zone_2_label, t.zone_3_label, t.zone_4_label, t.zone_5_label];

            zonesList.forEach((z, index) => {
                const minPct = parseFloat(zones[z].min);
                const maxPct = parseFloat(zones[z].max);

                // Apply the formula: ABS((VAM_decimal_minutes) * ((zone_pct/100) * 0.99 - 1.9905))
                const paceMinDecimal = Math.abs(vamDecimalMinutes * ((maxPct / 100) * 0.99 - 1.9905));
                const paceMaxDecimal = Math.abs(vamDecimalMinutes * ((minPct / 100) * 0.99 - 1.9905));

                // Convert decimal minutes back to seconds for formatTime
                const paceMinSeconds = paceMinDecimal * 60;
                const paceMaxSeconds = paceMaxDecimal * 60;

                const paceStr = `${formatTime(paceMaxSeconds).slice(0, 5)} - ${formatTime(paceMinSeconds).slice(0, 5)}`;

                html += `
                    <div class="p-3 border rounded mb-1 ${colors[index] === 'orange' ? '' : 'border-' + colors[index] + ' bg-' + colors[index]}" style="${colors[index] === 'orange' ? 'border-color:#fd7e14 !important; background-color:rgba(253, 126, 20, 0.1);' : '--bs-bg-opacity: .05;'}"> 
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0 ${colors[index] === 'orange' ? '' : 'text-' + colors[index]} fw-bold" style="${colors[index] === 'orange' ? 'color:#fd7e14' : ''}">${labels[index]}</h6>
                                <small class="text-secondary">${minPct}% - ${maxPct}% VAM</small>
                            </div>
                            <h4 class="mb-0 font-monospace ${colors[index] === 'orange' ? '' : 'text-' + colors[index]}" style="${colors[index] === 'orange' ? 'color:#fd7e14' : ''}">${paceStr} <small class="fs-6 text-secondary">/km</small></h4>
                        </div>
                    </div>
                `;
            });

            document.getElementById('zonesResult').innerHTML = html;
        });
    }
}

function initRunningCalculators() {
    // Pace Converter
    const btnConvertPace = document.getElementById('btnConvertPace');
    if (btnConvertPace) {
        btnConvertPace.addEventListener('click', () => {
            const paceKmStr = document.getElementById('inputPaceKm').value;
            if (!paceKmStr.includes(':')) return;

            const paceSeconds = parseTime(paceKmStr);
            const speedKmh = 3600 / paceSeconds;
            const paceMileSeconds = paceSeconds * 1.60934;

            document.getElementById('resSpeedKmh').textContent = speedKmh.toFixed(2) + ' km/h';
            document.getElementById('resPaceMile').textContent = formatTime(paceMileSeconds).slice(0, 5);
        });
    }

    // Cadence Speed Calculator
    const btnCalcSpeed = document.getElementById('btnCalcSpeedFromCadence');
    if (btnCalcSpeed) {
        btnCalcSpeed.addEventListener('click', () => {
            const cadence = parseFloat(document.getElementById('inputCadence').value);
            const strideLen = parseFloat(document.getElementById('inputStrideLen').value);

            if (!cadence || !strideLen) return;

            // Speed (km/h) = (Cadence * Stride Length * 60) / 1000
            const speedKmh = (cadence * strideLen * 60) / 1000;

            document.getElementById('resCadenceSpeed').textContent = speedKmh.toFixed(2) + ' km/h';
        });
    }
}
