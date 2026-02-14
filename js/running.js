
// Running Module Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Running File Upload
    setupFileUpload({
        zoneId: 'runUploadArea',
        inputId: 'runVideoInput',
        btnId: 'btnRunSelectFile',
        resultBoxId: 'runResultBox', // Used by common.js to hide/show generic box, but we control it more specifically
        mockId: 'runAiOutputMock', // Not really used in new flow but kept for compatibility
        // New Workflow Fields
        videoId: 'runVideoPlayer',
        canvasId: 'runCanvas',
        analyzeBtnId: 'btnAnalyzeRun',
        module: 'Running',
        onAnalysisComplete: () => {
            const results = videoProcessor.getAnalysisResults();
            if (results && results.detected) {
                // 1. Switch UI to Results Mode
                document.getElementById('runInputSection').classList.add('d-none');
                document.getElementById('runAnalysisSection').classList.remove('d-none');

                // Hide Placeholder / Show Result Box
                document.getElementById('runResultPlaceholder').classList.add('d-none');
                const resultBox = document.getElementById('runResultBox');
                resultBox.classList.remove('d-none');

                // 2. Build Premium UI

                // 3. Restore Video Controls for Scrubbing
                const videoEl = document.getElementById('runVideoPlayer');
                if (videoEl) {
                    videoEl.controls = true;
                    videoEl.onclick = null; // Remove toggle-play click handler
                }

                // --- Corrections & Recommendations ---
                let feedbackHtml = '';
                if (results.corrections.length > 0) {
                    results.corrections.forEach(c => {
                        feedbackHtml += `
                            <div class="d-flex align-items-start mb-2 text-danger bg-danger bg-opacity-10 p-2 rounded">
                                <ion-icon name="alert-circle" class="me-2 mt-1"></ion-icon>
                                <span class="small fw-bold">${c}</span>
                            </div>`;
                    });
                } else {
                    feedbackHtml = `
                        <div class="d-flex align-items-center mb-3 text-success bg-success bg-opacity-10 p-2 rounded">
                            <ion-icon name="checkmark-done-circle" class="me-2 fs-5"></ion-icon>
                            <span class="fw-bold">Excellent Mechanics!</span>
                        </div>`;
                }

                // Helper for gradients
                const getLeanColor = (val) => val > 10 ? '#f72585' : '#4cc9f0';

                const html = `
                    <!-- Header Summary -->
                    <div class="row align-items-center mb-4">
                        <div class="col-6 text-center border-end border-secondary border-opacity-25">
                            <div class="d-inline-flex align-items-baseline position-relative">
                                <h1 class="display-2 fw-bolder text-white mb-0 tracking-tight" style="text-shadow: 0 0 20px rgba(67, 97, 238, 0.5);">${results.spm}</h1>
                                <span class="fs-6 text-secondary ms-2 fw-bold">PPM</span>
                                <ion-icon name="information-circle" class="text-secondary opacity-50 position-absolute top-0 start-100 ms-1" style="font-size: 1rem; cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="Cadencia (Pasos por Minuto): Ideal 170-180+ para reducir el impacto."></ion-icon>
                            </div>
                            <div class="small text-uppercase text-secondary ls-2 mt-1" data-i18n="cadence">Cadencia</div>
                        </div>
                        <div class="col-6 text-center">
                            <div class="d-inline-flex align-items-baseline position-relative">
                                <h1 id="run_val_lean" class="display-2 fw-bolder text-white mb-0 tracking-tight" style="color: ${getLeanColor(results.lean)}; text-shadow: 0 0 20px ${getLeanColor(results.lean)}aa;">${results.lean}°</h1>
                                <span class="fs-6 text-secondary ms-2 fw-bold" data-i18n="tilt">INCL.</span>
                                <ion-icon name="information-circle" class="text-secondary opacity-50 position-absolute top-0 start-100 ms-1" style="font-size: 1rem; cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="Inclinación: 5-10° ayuda a la propulsión. >15° indica falta de control."></ion-icon>
                            </div>
                            <div class="small text-uppercase text-secondary ls-2 mt-1" data-i18n="forward_lean">Inclinación</div>
                        </div>
                    </div>

                    <!-- Leg Symmetry Grid -->
                    <h6 class="text-secondary text-uppercase small ls-2 mb-3"><ion-icon name="git-compare-outline" class="me-1" data-i18n="gct_angles"></ion-icon> Simetría y Ángulos</h6>
                    <div class="row g-3 mb-4">
                        <!-- LEFT -->
                        <div class="col-6">
                            <div class="p-3 rounded-3 position-relative overflow-hidden" style="background: linear-gradient(145deg, rgba(67, 97, 238, 0.1), rgba(15, 23, 42, 0.6)); border: 1px solid rgba(67, 97, 238, 0.2);">
                                <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-10" style="pointer-events: none;">
                                    <span class="display-1 fw-bold text-primary" data-i18n="left">I</span>
                                </div>
                                <div class="position-relative z-1">
                                    <div class="d-flex justify-content-between mb-2 border-bottom border-light border-opacity-10 pb-1 align-items-center">
                                        <span class="text-secondary small d-flex align-items-center" data-i18n="contact">Contacto <ion-icon name="help-circle-outline" class="ms-1 text-muted" style="cursor: help;" data-bs-toggle="tooltip" title="Tiempo de Contacto: Menos de 250ms indica mayor reactividad."></ion-icon></span>
                                        <span class="fw-bold text-white font-monospace">${results.details?.left.gct || '--'} <small class="text-muted">ms</small></span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2 border-bottom border-light border-opacity-10 pb-1 align-items-center">
                                        <span class="text-secondary small d-flex align-items-center" data-i18n="knee_flex">Rodilla <ion-icon name="help-circle-outline" class="ms-1 text-muted" style="cursor: help;" data-bs-toggle="tooltip" title="Flexión Máxima de Rodilla. Absorbe el impacto."></ion-icon></span>
                                        <span id="run_val_knee_l" class="fw-bold text-white font-monospace">${results.details?.left.kneeAngle || '--'}°</span>
                                    </div>
                                     <div class="d-flex justify-content-between align-items-center">
                                        <span class="text-secondary small d-flex align-items-center" data-i18n="shin">Tibia <ion-icon name="help-circle-outline" class="ms-1 text-muted" style="cursor: help;" data-bs-toggle="tooltip" title="Ángulo de Tibia al impacto. >10° sugiere 'Overstriding' (freno)."></ion-icon></span>
                                        <span id="run_val_shin_l" class="${(results.details?.left.shinAngle > 15) ? 'text-danger' : 'text-success'} fw-bold font-monospace">
                                            ${results.details?.left.shinAngle || '--'}°
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT -->
                        <div class="col-6">
                            <div class="p-3 rounded-3 position-relative overflow-hidden" style="background: linear-gradient(145deg, rgba(247, 37, 133, 0.1), rgba(15, 23, 42, 0.6)); border: 1px solid rgba(247, 37, 133, 0.2);">
                                 <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-10" style="pointer-events: none;">
                                    <span class="display-1 fw-bold text-danger" data-i18n="right">D</span>
                                </div>
                                <div class="position-relative z-1">
                                    <div class="d-flex justify-content-between mb-2 border-bottom border-light border-opacity-10 pb-1 align-items-center">
                                        <span class="text-secondary small d-flex align-items-center" data-i18n="contact">Contacto <ion-icon name="help-circle-outline" class="ms-1 text-muted" style="cursor: help;" data-bs-toggle="tooltip" title="Tiempo de Contacto: Menos de 250ms indica mayor reactividad."></ion-icon></span>
                                        <span class="fw-bold text-white font-monospace">${results.details?.right.gct || '--'} <small class="text-muted">ms</small></span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2 border-bottom border-light border-opacity-10 pb-1 align-items-center">
                                        <span class="text-secondary small d-flex align-items-center" data-i18n="knee_flex">Rodilla <ion-icon name="help-circle-outline" class="ms-1 text-muted" style="cursor: help;" data-bs-toggle="tooltip" title="Flexión Máxima de Rodilla. Absorbe el impacto."></ion-icon></span>
                                        <span id="run_val_knee_r" class="fw-bold text-white font-monospace">${results.details?.right.kneeAngle || '--'}°</span>
                                    </div>
                                     <div class="d-flex justify-content-between align-items-center">
                                        <span class="text-secondary small d-flex align-items-center" data-i18n="shin">Tibia <ion-icon name="help-circle-outline" class="ms-1 text-muted" style="cursor: help;" data-bs-toggle="tooltip" title="Ángulo de Tibia al impacto. >10° sugiere 'Overstriding' (freno)."></ion-icon></span>
                                        <span id="run_val_shin_r" class="${(results.details?.right.shinAngle > 15) ? 'text-danger' : 'text-success'} fw-bold font-monospace">
                                            ${results.details?.right.shinAngle || '--'}°
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI Feedback -->
                    <div class="p-4 rounded-3" style="background: rgba(0,0,0,0.3); border: 1px dashed rgba(255,255,255,0.1);">
                        <h6 class="text-secondary text-uppercase small ls-2 mb-3"><ion-icon name="pulse-outline" class="me-1"></ion-icon> Análisis IA</h6>
                        ${feedbackHtml}
                    </div>
                    
                    <!-- Restart Button -->
                    <button class="btn btn-outline-light w-100 mt-4" onclick="resetRunningAnalysis()">
                        <ion-icon name="refresh-outline" class="me-2"></ion-icon> Nuevo Análisis
                    </button>
                `;

                resultBox.innerHTML = html;

                // Stop recording to avoid corrupting averages during scrub
                if (videoProcessor.activeAnalyzer && videoProcessor.activeAnalyzer.finalize) {
                    videoProcessor.activeAnalyzer.finalize();
                }

                // Listen for Real-Time seeking updates
                window.addEventListener('run-data', (e) => {
                    const d = e.detail;

                    const setVal = (id, val) => {
                        const el = document.getElementById(id);
                        if (el) el.innerText = val + '°';
                    };

                    setVal('run_val_lean', d.lean);
                    setVal('run_val_knee_l', d.lKnee);
                    setVal('run_val_knee_r', d.rKnee);

                    const updateShin = (id, val) => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.innerText = val + '°';
                            el.className = (val > 15 ? 'text-danger' : 'text-success') + ' fw-bold font-monospace';
                        }
                    };
                    updateShin('run_val_shin_l', d.lShin);
                    updateShin('run_val_shin_r', d.rShin);
                });

                // Initialize Tooltips
                const tooltipTriggerList = [].slice.call(resultBox.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function (tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
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

                // Apply the formula
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

// Global Reset Function for "New Analysis" button
window.resetRunningAnalysis = function () {
    // 1. Reset Video Processor
    if (window.videoProcessor) {
        window.videoProcessor.reset();
    }

    // 2. Switch UI back to Input
    document.getElementById('runAnalysisSection').classList.add('d-none');
    document.getElementById('runInputSection').classList.remove('d-none');

    // 3. Clear Results
    const resultBox = document.getElementById('runResultBox');
    resultBox.classList.add('d-none');
    resultBox.innerHTML = '';
    document.getElementById('runResultPlaceholder').classList.remove('d-none');

    // 4. Reset Inputs
    const fileInput = document.getElementById('runVideoInput');
    if (fileInput) fileInput.value = '';

    const analyzeBtn = document.getElementById('btnAnalyzeRun');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        // Reset to initial state
        analyzeBtn.innerHTML = '<ion-icon name="sparkles" class="me-2"></ion-icon><span data-i18n="btn_analyze">Analyze with AI</span>';
        analyzeBtn.classList.remove('btn-outline-light');
        analyzeBtn.classList.add('btn-primary');
    }

    // 5. Reset Drop Zone Visuals
    const dropZone = document.getElementById('runUploadArea');
    if (dropZone) {
        const h4 = dropZone.querySelector('h4');
        const p = dropZone.querySelector('p');

        // Restore Spanish defaults (since we are in Spanish mode)
        if (h4) h4.textContent = "Suelte su video aquí";
        dropZone.style.borderColor = '';
    }
};

// --- TRAIL RUNNING CALCULATORS ---

// 1. GAP Calculator (Minetti)
window.calculateGAP = function () {
    const dist = parseFloat(document.getElementById('gapDist').value);
    const elev = parseFloat(document.getElementById('gapElev').value);
    const timeStr = document.getElementById('gapTimeInput').value;

    // Use common parser
    const totalSeconds = parseTime(timeStr);

    if (!dist || !totalSeconds) {
        alert("Por favor introduce distancia y tiempo.");
        return;
    }

    // 1. Calculate basic metrics
    const totalMinutes = totalSeconds / 60;
    const paceDec = totalMinutes / dist; // min/km in decimal

    // 2. Calculate Gradient (Slope)
    // Gradient i = height / distance. (e.g. 1000m / 10000m = 0.1 or 10%)
    let gradient = 0;
    if (elev > 0) {
        gradient = (elev / (dist * 1000));
    }

    // 3. Minetti Cost Factor Approximation
    // Polynomial for Energy Cost (J/kg/m): C = 155.4*i^5 - 30.4*i^4 - 43.3*i^3 + 46.3*i^2 + 19.5*i + 3.6
    const i = gradient;
    const costOfRunning = (155.4 * Math.pow(i, 5)) - (30.4 * Math.pow(i, 4)) - (43.3 * Math.pow(i, 3)) + (46.3 * Math.pow(i, 2)) + (19.5 * i) + 3.6;

    // Cost on flat (i=0) is 3.6
    const flatCost = 3.6;

    // The ratio of effort
    const effortRatio = costOfRunning / flatCost;

    // GAP = Actual Pace / Ratio (Faster pace = lower number)
    const gapPaceDec = paceDec / effortRatio;

    // 4. Update UI
    document.getElementById('resPace').innerText = formatPace(paceDec);
    document.getElementById('resGAP').innerText = formatPace(gapPaceDec);

    const gradePercent = (gradient * 100).toFixed(1);
    document.getElementById('resGrade').innerText = gradePercent + "%";
    document.getElementById('gradeBar').style.width = Math.min(gradePercent * 2, 100) + "%"; // Visual scale

    // Explanation
    const diffSeconds = Math.round((paceDec - gapPaceDec) * 60);
    let explanation = "";
    if (diffSeconds > 10) {
        explanation = `Debido a la pendiente media del ${gradePercent}%, tu esfuerzo metabólico fue <strong>${diffSeconds} segundos/km más rápido</strong> de lo que dice el reloj. ¡Buen trabajo de fuerza!`;
    } else if (diffSeconds < -5) {
        explanation = `Al ser mayormente bajada, la gravedad te ayudó. Tu esfuerzo real fue más lento que tu velocidad.`;
    } else {
        explanation = `El terreno fue bastante llano, por lo que tu ritmo real y esfuerzo fueron similares.`;
    }
    document.getElementById('gapExplanation').innerHTML = explanation;

    document.getElementById('gapResults').classList.remove('d-none');
};

function formatPace(decimalPace) {
    const minutes = Math.floor(decimalPace);
    const seconds = Math.round((decimalPace - minutes) * 60);
    const secondsStr = seconds < 10 ? "0" + seconds : seconds;
    return `${minutes}:${secondsStr}`;
}

// 2. TRIMP Calculator (Banister)
window.calculateTRIMP = function () {
    const duration = parseFloat(document.getElementById('trimpTime').value);
    const hrRest = parseFloat(document.getElementById('hrRest').value);
    const hrMax = parseFloat(document.getElementById('hrMax').value);
    const hrAvg = parseFloat(document.getElementById('hrAvg').value);
    const gender = document.getElementById('trimpGender').value;

    if (!duration || !hrRest || !hrMax || !hrAvg) {
        alert("Por favor completa todos los campos de frecuencia cardíaca.");
        return;
    }

    // Calculate HR Reserve Ratio (Delta HR)
    const hrReserve = (hrAvg - hrRest) / (hrMax - hrRest);

    // Gender Factor (b)
    const b = (gender === 'male') ? 1.92 : 1.67;

    // Banister Formula
    const trimp = duration * hrReserve * 0.64 * Math.exp(b * hrReserve);
    const trimpScore = Math.round(trimp);

    document.getElementById('trimpValue').innerText = trimpScore;

    // Diagnosis
    let diag = "";
    if (trimpScore < 50) {
        diag = "<span class='text-success fw-bold'>Recuperación activa.</span><br>Un estímulo suave. Ideal para soltar piernas.";
    } else if (trimpScore < 100) {
        diag = "<span class='text-info fw-bold'>Mantenimiento aeróbico.</span><br>Buen trabajo de base sin sobrecargar.";
    } else if (trimpScore < 200) {
        diag = "<span class='text-warning fw-bold'>Carga Significativa.</span><br>Has acumulado fatiga real. Asegura buena nutrición.";
    } else {
        diag = "<span class='text-danger fw-bold'>Sobrecarga / Alta Intensidad.</span><br>¡Cuidado! Requiere 24-48h de recuperación.";
    }
    document.getElementById('trimpDiagnosis').innerHTML = diag;

    document.getElementById('trimpResults').classList.remove('d-none');
};

// 3. Calories Calculator (Gravity Adjusted)
window.calculateCalories = function () {
    const weight = parseFloat(document.getElementById('calWeight').value);
    const dist = parseFloat(document.getElementById('calDist').value);
    const elev = parseFloat(document.getElementById('calElev').value);

    if (!weight || !dist) {
        alert("Introduce peso y distancia.");
        return;
    }

    // 1. Horizontal Cost (Approx 0.9 to 1.0 kcal/kg/km on flat)
    const horizontalCost = 0.9 * weight * dist;

    // 2. Vertical Cost (Work = Mass * g * Height / Efficiency)
    // Efficiency ~20%
    let verticalCostKcal = 0;
    if (elev > 0) {
        const gravity = 9.81;
        const efficiency = 0.20;
        const workJoules = weight * gravity * elev;
        const energyJoules = workJoules / efficiency;
        verticalCostKcal = energyJoules / 4184; // J to kcal
    }

    const totalKcal = Math.round(horizontalCost + verticalCostKcal);

    document.getElementById('calValue').innerText = totalKcal;
    document.getElementById('calResultBox').classList.remove('d-none');
};
