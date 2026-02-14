
// Swimming Module Logic

const STYLE_FACTORS = {
    freestyle: 1.00,
    butterfly: 1.10,
    backstroke: 1.12,
    breaststroke: 1.25
};

const ZONES = {
    rec: { nameKey: "Recuperación (Rec)", label: "Rec", factorMin: 1.33, factorMax: 1.53, descKey: "Eliminación de lactato, recuperación activa.", color: "info", lactate: "< 1.5 mM" },
    en1: { nameKey: "Resistencia Base (En-1)", label: "En-1", factorMin: 1.17, factorMax: 1.33, descKey: "Capacidad aeróbica, quema de grasas. Volúmenes largos.", color: "success", lactate: "~ 2.0 mM" },
    en2: { nameKey: "Umbral Anaeróbico (En-2)", label: "En-2", factorMin: 1.11, factorMax: 1.17, descKey: "Estado estable de lactato. Ritmo de crucero fuerte.", color: "warning", lactate: "~ 4.0 mM" },
    en3: { nameKey: "Potencia Aeróbica (VO2max)", label: "En-3", factorMin: 1.00, factorMax: 1.11, descKey: "Máximo consumo de oxígeno. Series cortas (50-200m).", color: "orange", lactate: "~ 6.0 mM" },
    sp: { nameKey: "Sprint / Potencia (Sp)", label: "Sprint", factorMin: 0.85, factorMax: 0.95, descKey: "Velocidad pura y tolerancia láctica extrema.", color: "danger", lactate: "> 8.0 mM" }
};

let swimState = {
    cssSpeed: 0, // m/s
    cssPace: 0, // seconds per 100m
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Swimming File Upload for AI Tab
    setupFileUpload({
        zoneId: 'swimUploadArea',
        inputId: 'swimVideoInput',
        btnId: 'btnSwimSelectFile',
        resultBoxId: 'swimResultBox',
        mockId: 'aiOutputMock',
        videoId: 'swimVideoPlayer',
        canvasId: 'swimCanvas',
        analyzeBtnId: 'btnAnalyzeSwim',
        module: 'Swimming',
        onAnalysisComplete: handleAIAnalysis,
        onUploadStart: () => {
            // Show "Analyzing" overlay when analysis starts
            document.getElementById('swimResultBox').classList.add('d-none');
            document.getElementById('swimVideoContainer').classList.remove('d-none');
            document.getElementById('swimAiOverlay').classList.remove('d-none');
            document.getElementById('swimUploadArea').classList.add('d-none');
        }
    });

    // Demo Button
    const btnDemo = document.getElementById('btnSwimDemo');
    if (btnDemo) {
        btnDemo.addEventListener('click', () => {
            // Simulate Upload & Analysis
            document.getElementById('swimResultEmpty').classList.add('d-none');
            document.getElementById('swimUploadArea').classList.add('d-none');
            document.getElementById('swimVideoContainer').classList.remove('d-none');
            document.getElementById('swimAiOverlay').classList.remove('d-none');

            // Mock Process Time
            setTimeout(() => {
                const results = {
                    detected: true,
                    strokeCount: 22,
                    avgSPM: 38.5,
                    avgHz: 0.64,
                    htmlExtra: "<div class='mt-3 p-2 border rounded bg-white'><small class='text-muted'>AI Summary:</small><p class='mb-0 fw-bold text-dark'>Ritmo constante. Buena técnica general.</p></div>"
                };

                // Inject Mock Results into helper context if needed, or just call renderer
                // For now, we simulate the callback
                handleAIAnalysisWrapper(results);
            }, 2500);
        });
    }

    initCssProfile();
    initZones();
    initWorkoutBuilder();
    initSwolf();
    initAcwr();
});

function handleAIAnalysisWrapper(results) {
    // Hide Overlay (if controlled manually, e.g. Demo Mode)
    const overlay = document.getElementById('swimAiOverlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.classList.add('d-none');
            overlay.classList.remove('fade-out');
        }, 500);
    }

    // Show Results Dashboard
    const resultBox = document.getElementById('swimResultBox');
    resultBox.classList.remove('d-none');
    document.getElementById('swimResultEmpty').classList.add('d-none');

    // Restore Video Controls
    const video = document.getElementById('swimVideoPlayer');
    if (video) {
        video.controls = true;
        video.onclick = null; // Remove custom toggle
    }

    const html = `
        <div class="row g-3 mb-4">
            <!-- Card 1: Strokes -->
            <div class="col-md-4">
                <div class="p-3 rounded-4 border border-primary border-opacity-25 bg-primary bg-opacity-10 h-100 text-center position-relative overflow-hidden">
                    <div class="position-absolute top-0 end-0 p-2 opacity-25">
                        <ion-icon name="hand-left" class="display-4 text-primary"></ion-icon>
                    </div>
                    <h6 class="text-primary text-uppercase small fw-bold mb-2">Total Strokes</h6>
                    <h2 class="display-4 fw-bold mb-0 text-white">${results.strokeCount}</h2>
                    <small class="text-secondary">Cycles detected</small>
                </div>
            </div>
            
            <!-- Card 2: SPM -->
            <div class="col-md-4">
                <div class="p-3 rounded-4 border border-info border-opacity-25 bg-info bg-opacity-10 h-100 text-center position-relative overflow-hidden">
                    <div class="position-absolute top-0 end-0 p-2 opacity-25">
                        <ion-icon name="speedometer" class="display-4 text-info"></ion-icon>
                    </div>
                    <h6 class="text-info text-uppercase small fw-bold mb-2">Frequency</h6>
                    <h2 class="display-4 fw-bold mb-0 text-white">${results.avgSPM.toFixed(1)}</h2>
                    <small class="text-secondary">${results.avgHz} Hz</small>
                </div>
            </div>

            <!-- Card 3: Efficiency Index (Mock) -->
            <div class="col-md-4">
                <div class="p-3 rounded-4 border border-success border-opacity-25 bg-success bg-opacity-10 h-100 text-center position-relative overflow-hidden">
                    <div class="position-absolute top-0 end-0 p-2 opacity-25">
                        <ion-icon name="flash" class="display-4 text-success"></ion-icon>
                    </div>
                    <h6 class="text-success text-uppercase small fw-bold mb-2">Efficiency</h6>
                    <h2 class="display-4 fw-bold mb-0 text-white">88<span class="fs-5">%</span></h2>
                    <small class="text-secondary">AI Score</small>
                </div>
            </div>
        </div>

        <!-- Technique Pulse -->
        <h6 class="text-secondary text-uppercase small fw-bold mb-3 ps-1">Technique Insights</h6>
        <div class="list-group bg-transparent border-0">
             <div class="list-group-item bg-dark bg-opacity-50 border-secondary border-opacity-25 rounded-3 mb-2 d-flex align-items-center">
                <ion-icon name="checkmark-circle" class="text-success fs-4 me-3"></ion-icon>
                <div>
                    <h6 class="mb-0 text-white">Consistent Rhythm</h6>
                    <small class="text-secondary">Variance &lt; 5% between strokes.</small>
                </div>
             </div>
             <div class="list-group-item bg-dark bg-opacity-50 border-secondary border-opacity-25 rounded-3 mb-2 d-flex align-items-center">
                <ion-icon name="bulb" class="text-warning fs-4 me-3"></ion-icon>
                <div>
                    <h6 class="mb-0 text-white">Stroke Rate Optimization</h6>
                    <small class="text-secondary">Current ${results.avgSPM.toFixed(0)} SPM is ideal for ${results.avgSPM > 45 ? 'Sprinting' : 'Endurance'}.</small>
                </div>
             </div>
        </div>
    `;

    const mockOutput = document.getElementById('aiOutputMock');
    if (mockOutput) {
        mockOutput.innerHTML = html;
        mockOutput.classList.remove('d-none');
    }
}

// Handler called by VideoProcessor
function handleAIAnalysis() {
    const results = videoProcessor.getAnalysisResults();
    if (results && results.detected) {
        handleAIAnalysisWrapper(results);
    }
}

initCssProfile();
initZones();
initWorkoutBuilder();
initSwolf();
initAcwr();



// --- 1. CSS Profile ---
function initCssProfile() {
    const btn = document.getElementById('btnCalcCSS');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const t400Str = document.getElementById('cssT400').value;
        const t200Str = document.getElementById('cssT200').value;

        // Use parseTime to convert MM:SS to seconds
        const t400_sec = parseTime(t400Str);
        const t200_sec = parseTime(t200Str);

        if (!t400_sec || !t200_sec || t400_sec <= t200_sec) {
            alert(getTranslation('alert_invalid_css'));
            return;
        }

        // CSS Formula (m/s)
        const speed = (400 - 200) / (t400_sec - t200_sec);
        const pace100 = 100 / speed;

        swimState.cssSpeed = speed;
        swimState.cssPace = pace100;

        // Render Results
        document.getElementById('resCssSpeed').textContent = speed.toFixed(2);
        document.getElementById('resCssPace').textContent = formatMinSec(pace100);
        document.getElementById('resCssPaceInfo').textContent = formatMinSec(pace100);

        document.getElementById('cssPlaceholder').classList.add('d-none');
        document.getElementById('cssResults').classList.remove('d-none');

        // Update Zones Table automatically if visible
        updateZonesTable();
    });
}

// --- 2. Zones & Styles ---
function initZones() {
    const select = document.getElementById('selZoneStyle');
    if (select) {
        select.addEventListener('change', updateZonesTable);
    }
}

function updateZonesTable() {
    const container = document.getElementById('zonesTableContainer');
    if (!swimState.cssPace || swimState.cssPace === 0) return;

    const style = document.getElementById('selZoneStyle').value;
    const factor = STYLE_FACTORS[style];
    const basePace = swimState.cssPace * factor;

    let html = '';

    Object.entries(ZONES).forEach(([key, zone]) => {
        const tMin = basePace * zone.factorMax; // Slower time
        const tMax = basePace * zone.factorMin; // Faster time

        const borderColor = zone.color === 'orange' ? 'border-warning' : `border-${zone.color}`;
        const bgColor = zone.color === 'orange' ? 'bg-warning' : `bg-${zone.color}`;
        const textColor = zone.color === 'orange' ? 'text-warning' : `text-${zone.color}`;

        // Hack for orange bootstrap mapping
        const styleAttrib = zone.color === 'orange' ? 'style="--bs-bg-opacity: .1; border-color: #fd7e14 !important;"' : 'style="--bs-bg-opacity: .1;"';
        const orangeText = zone.color === 'orange' ? 'style="color: #fd7e14 !important;"' : '';

        // Dynamically get text
        const name = getTranslation(zone.nameKey);
        const desc = getTranslation(zone.descKey);

        html += `
            <div class="card border mb-2 ${bgColor} ${borderColor}" ${styleAttrib}>
                <div class="card-body py-3 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <div class="d-flex align-items-center gap-2">
                             <h6 class="mb-0 fw-bold ${textColor}" ${orangeText}>${name}</h6>
                             <span class="badge bg-white text-secondary border">${zone.lactate}</span>
                        </div>
                        <small class="text-secondary">${desc}</small>
                    </div>
                    <div class="text-end">
                        <small class="text-uppercase text-secondary d-block" style="font-size: 0.7rem;">Pace / 100m</small>
                        <h4 class="mb-0 font-monospace fw-bold ${textColor}" ${orangeText}>${formatMinSec(tMax)} - ${formatMinSec(tMin)}</h4>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// --- 3. Workout Builder ---
function initWorkoutBuilder() {
    const inputs = ['wbStyle', 'wbDist', 'wbZone'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', calculateWorkout);
    });
}

function calculateWorkout() {
    if (!swimState.cssPace) {
        // Fallback for demo if no CSS calculated yet
        // document.getElementById('wbTargetTime').textContent = "Calc CSS first";
        // return;
    }

    // If CSS is 0, use a dummy pace (e.g. 1:40/100m = 100s) just to show function
    const currentPace = swimState.cssPace > 0 ? swimState.cssPace : 100;

    const style = document.getElementById('wbStyle').value;
    const dist = parseInt(document.getElementById('wbDist').value);
    const zoneKey = document.getElementById('wbZone').value;

    const basePace100 = currentPace * STYLE_FACTORS[style];
    const zoneData = ZONES[zoneKey];

    // Avg factor for target
    const factor = (zoneData.factorMin + zoneData.factorMax) / 2;
    const targetSeconds = (basePace100 * factor) * (dist / 100);

    document.getElementById('wbTargetTime').textContent = formatMinSec(targetSeconds);

    // Rest Advice
    let advice = "";
    if (zoneKey === 'rec') advice = getTranslation('advice_rec');
    else if (zoneKey === 'en1') advice = getTranslation('advice_en1');
    else if (zoneKey === 'en2') advice = getTranslation('advice_en2');
    else if (zoneKey === 'en3') advice = getTranslation('advice_en3');
    else if (zoneKey === 'sp') advice = getTranslation('advice_sp');

    document.getElementById('wbRestAdvice').textContent = advice;

    // Alert
    const alertBox = document.getElementById('wbAlert');
    if (zoneKey === 'sp') alertBox.classList.remove('d-none');
    else alertBox.classList.add('d-none');
}

// --- 4. SWOLF ---
function initSwolf() {
    const btn = document.getElementById('btnCalcSwolf');
    if (btn) {
        btn.addEventListener('click', () => {
            const timeStr = document.getElementById('swolfTime').value;
            const time = parseTime(timeStr);
            const strokes = parseFloat(document.getElementById('swolfStrokes').value) || 0;
            const pool = parseInt(document.getElementById('swolfPool').value) || 25;

            if (time === 0 || strokes === 0) {
                alert(getTranslation('alert_invalid_swolf'));
                return;
            }

            let score = time + strokes;

            // Calc Frequency (SPM) & Amplitude (DPS)
            // Hz = strokes / time
            const hz = strokes / time;
            // SPM = Hz * 60
            const spm = hz * 60;

            // DPS = Pool_Length / Strokes
            const amp = pool / strokes;

            document.getElementById('resSwolfScore').textContent = score;
            document.getElementById('resSwimFreq').textContent = spm.toFixed(0);
            if (document.getElementById('resSwimHz')) {
                document.getElementById('resSwimHz').textContent = hz.toFixed(2) + " Hz";
            }
            document.getElementById('resSwimAmp').textContent = amp.toFixed(2);

            let feedback = getTranslation('swolf_fb_good');
            if (strokes > 50 && pool === 25) {
                feedback = getTranslation('swolf_fb_slip');
            } else if (score < 30 && pool === 25) {
                feedback = getTranslation('swolf_fb_elite');
            } else {
                feedback = getTranslation('swolf_fb_goal');
            }

            document.getElementById('resSwolfText').textContent = feedback;
            document.getElementById('swolfResultPlaceholder').classList.add('d-none');
            document.getElementById('swolfResult').classList.remove('d-none');
        });
    }
}

// --- 5. ACWR ---
function initAcwr() {
    const btn = document.getElementById('btnCalcAcwr');
    if (btn) {
        btn.addEventListener('click', () => {
            const acute = parseFloat(document.getElementById('acwrAcute').value) || 0;
            const chronic = parseFloat(document.getElementById('acwrChronic').value) || 0;

            if (chronic === 0) return;

            const ratio = acute / chronic;
            document.getElementById('resAcwrRatio').textContent = ratio.toFixed(2);

            const statusEl = document.getElementById('resAcwrStatus');
            const resultDiv = document.getElementById('acwrResult');
            const alertDiv = document.getElementById('acwrAdvice');

            // Classes reset
            resultDiv.className = "d-none w-100 animate-fade-in p-4 rounded-3 border";
            alertDiv.classList.add('d-none');

            if (ratio < 0.8) {
                statusEl.textContent = getTranslation('acwr_risk_under');
                resultDiv.classList.add('bg-success-subtle', 'border-success', 'text-success-emphasis');
            } else if (ratio <= 1.3) {
                statusEl.textContent = getTranslation('acwr_risk_optimal');
                resultDiv.classList.add('bg-success', 'border-success', 'text-white');
            } else if (ratio > 1.5) {
                statusEl.textContent = getTranslation('acwr_risk_high');
                resultDiv.classList.add('bg-danger', 'border-danger', 'text-white');
                alertDiv.textContent = getTranslation('acwr_msg_high');
                alertDiv.classList.remove('d-none');
            } else {
                statusEl.textContent = getTranslation('acwr_risk_over');
                resultDiv.classList.add('bg-warning-subtle', 'border-warning', 'text-warning-emphasis');
            }

            document.getElementById('acwrResultPlaceholder').classList.add('d-none');
            resultDiv.classList.remove('d-none');
        });
    }
}

// --- Helpers ---
function parseTime(timeStr) {
    if (!timeStr) return 0;
    // Normalized: replace comma with dot, trim
    const str = timeStr.toString().replace(',', '.').trim();

    if (str.includes(':')) {
        const parts = str.split(':');
        const min = parseFloat(parts[0]) || 0;
        const sec = parseFloat(parts[1]) || 0;
        return (min * 60) + sec;
    } else {
        // Assume pure seconds if no colon
        return parseFloat(str) || 0;
    }
}

function formatMinSec(totalSeconds) {
    if (!totalSeconds || totalSeconds === Infinity || isNaN(totalSeconds)) return "--:--";
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    // Add leading zero to seconds
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Global Helper for HTML ---
window.toggleSwolfMode = function (mode) {
    const manualGroup = document.getElementById('strokesInputGroup');
    const timeInput = document.getElementById('swolfTime');
    const btnText = document.getElementById('btnSwolfText');
    const badge = document.getElementById('aiLevelBadge');
    const estLabel = document.getElementById('aiEstLabel');
    const speedBox = document.getElementById('aiSpeedBox');
    const desc = document.getElementById('swolfDesc');

    if (mode === 'manual') {
        if (manualGroup) manualGroup.classList.remove('d-none');
        if (timeInput) {
            timeInput.disabled = false;
            timeInput.placeholder = "Seconds or MM:SS";
        }
        if (btnText) btnText.textContent = (typeof getTranslation === 'function' ? getTranslation('swolf_btn_analyze') : "Analyze Efficiency");
        if (badge) badge.classList.add('d-none');
        if (estLabel) estLabel.classList.add('d-none');
        if (speedBox) speedBox.classList.add('d-none');
        if (desc) desc.textContent = (typeof getTranslation === 'function' ? getTranslation('swolf_desc') : "SWOLF = Time + Strokes");
    } else {
        // AI Mode
        if (manualGroup) manualGroup.classList.add('d-none');
        if (timeInput) {
            timeInput.disabled = true;
            timeInput.placeholder = "Auto-detected from Video";
        }
        if (btnText) btnText.textContent = "Import from AI Analyzer";
        if (badge) badge.classList.remove('d-none');
        if (estLabel) estLabel.classList.remove('d-none');
        if (speedBox) speedBox.classList.remove('d-none');
        if (desc) desc.textContent = "Using data from AI Video Analysis";
    }
};


