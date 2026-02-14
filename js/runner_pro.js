// RunnerPro Suite Logic v2.1 (Non-AI Version)
document.addEventListener('DOMContentLoaded', () => {

    // --- State Variables ---
    let currentVam = 0;
    let currentVo2 = 0;
    let checklist = {};

    const defaultProZones = [
        { name: "Z1 Recuperación", range: [0.50, 0.60], class: "text-info" },
        { name: "Z2 Rodaje Base", range: [0.60, 0.70], class: "text-success" },
        { name: "Z3 Aeróbico Medio", range: [0.70, 0.80], class: "text-primary" },
        { name: "Z4 Umbral (Tempo)", range: [0.80, 0.90], class: "text-warning" },
        { name: "Z5 VO2max", range: [0.90, 0.98], class: "text-danger" },
        { name: "Z6 Anaeróbico", range: [0.98, 1.20], class: "text-secondary" },
    ];

    let proZones = JSON.parse(localStorage.getItem('runnerProZones')) || defaultProZones;

    // --- DOM Elements ---
    const vamDistInput = document.getElementById('proVamDist');
    const test6mRadio = document.getElementById('test6m');
    const test12mRadio = document.getElementById('test12m');

    const fcMaxInput = document.getElementById('fcMax');
    const fcRestInput = document.getElementById('fcRest');
    const useKarvonenCheck = document.getElementById('useKarvonen');

    const predDistInput = document.getElementById('predDist');
    const predTimeInput = document.getElementById('predTime');
    const predResultsContainer = document.getElementById('predResultsContainer');

    const bioChecklistContainer = document.getElementById('bioChecklistContainer');

    // --- 1. Physiological Logic ---

    function calculatePhysiology() {
        const dist = parseFloat(vamDistInput.value) || 0;
        const testType = test6mRadio.checked ? 6 : 12;

        // VAM Calculation
        if (testType === 6) {
            currentVam = dist / 100;
        } else {
            currentVam = dist / 200;
        }

        // VO2max Estimation
        currentVo2 = (0.0324 * Math.pow(currentVam, 2)) + (2.143 * currentVam) + 14.49;

        // Update UI
        document.getElementById('resProVam').textContent = currentVam.toFixed(1);
        document.getElementById('resProVo2').textContent = currentVo2.toFixed(1);

        renderTrainingZones();
        renderManualPlan();
    }

    function calculateHR(intensity) {
        const max = parseInt(fcMaxInput.value) || 185;
        const rest = parseInt(fcRestInput.value) || 60;
        const karvonen = useKarvonenCheck.checked;

        if (karvonen) {
            return Math.round(((max - rest) * intensity) + rest);
        }
        return Math.round(max * intensity);
    }

    function renderTrainingZones() {
        const tableBody = document.getElementById('proZonesTableBody');
        if (!tableBody) return;

        let html = '';
        proZones.forEach(z => {
            const minSpeed = currentVam * z.range[0];
            const maxSpeed = currentVam * z.range[1];
            const bpmMin = calculateHR(z.range[0]);
            const bpmMax = calculateHR(z.range[1]);

            const paceMin = speedToPace(minSpeed);
            const paceMax = speedToPace(maxSpeed);

            let paceText = `${paceMin} - ${paceMax}`;
            if (z.range[1] > 1.1) paceText = `< ${paceMin}`;

            let bpmText = `${bpmMin} - ${bpmMax}`;
            if (z.range[1] > 1.1) bpmText = "N/A";

            html += `
                <tr class="transition-all hover-bg-white-5">
                    <td class="ps-4 fw-bold text-white border-0">${z.name}</td>
                    <td class="text-white-50 border-0">${Math.round(z.range[0] * 100)}-${Math.round(z.range[1] * 100)}%</td>
                    <td class="font-monospace fw-bold border-0 ${z.class}">${paceText}</td>
                    <td class="font-monospace text-danger fw-bold border-0">${bpmText} bpm</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    // --- 5. Config Logic ---

    function openProZoneConfig() {
        proZones.forEach((z, i) => {
            const minInput = document.getElementById(`pro_z${i + 1}_min`);
            const maxInput = document.getElementById(`pro_z${i + 1}_max`);
            if (minInput) minInput.value = Math.round(z.range[0] * 100);
            if (maxInput) maxInput.value = Math.round(z.range[1] * 100);
        });
        const modal = new bootstrap.Modal(document.getElementById('proZoneConfigModal'));
        modal.show();
    }

    function saveProZones() {
        const newZones = [...proZones];
        newZones.forEach((z, i) => {
            const minVal = parseFloat(document.getElementById(`pro_z${i + 1}_min`).value) / 100;
            const maxVal = parseFloat(document.getElementById(`pro_z${i + 1}_max`).value) / 100;
            z.range = [minVal, maxVal];
        });

        proZones = newZones;
        localStorage.setItem('runnerProZones', JSON.stringify(proZones));

        renderTrainingZones();
        renderManualPlan();

        const modalEl = document.getElementById('proZoneConfigModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    // --- 2. Predictor Logic ---

    function calculatePrediction() {
        const d1 = parseFloat(predDistInput.value);
        const timeStr = predTimeInput.value;
        const t1 = timeStrToSeconds(timeStr);

        if (!t1 || !predResultsContainer) return;

        const targets = [
            { km: 5, label: "5k" },
            { km: 10, label: "10k" },
            { km: 21.097, label: "21k (Media)" },
            { km: 42.195, label: "42k (Maratón)" }
        ];

        predResultsContainer.innerHTML = '';
        targets.forEach(t => {
            if (Math.abs(t.km - d1) < 0.1) return;

            const t2 = t1 * Math.pow((t.km / d1), 1.06);
            const pace = t2 / t.km;

            const div = document.createElement('div');
            div.className = 'col-md-6';
            div.innerHTML = `
                <div class="glass-card p-3 border border-secondary border-opacity-10 hover-scale transition-all h-100">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-white-50 text-uppercase fw-bold small tracking-wider">${t.label}</span>
                        <div class="p-1 bg-warning bg-opacity-10 rounded text-warning small"><ion-icon name="trophy-outline"></ion-icon></div>
                    </div>
                    <h3 class="text-warning fw-bold my-1 tracking-tight">${secondsToTimeStr(t2, true)}</h3>
                    <div class="mt-2 pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                        <span class="text-white-50 small">Ritmo:</span>
                        <span class="font-monospace text-white small">${secondsToTimeStr(pace)} /km</span>
                    </div>
                </div>
            `;
            predResultsContainer.appendChild(div);
        });
    }

    // --- 3. Biomechanics Logic ---

    const bioTests = [
        { id: 'wallTest', label: 'Wall Test (Tobillo)', desc: 'Movilidad dorsiflexión 10cm.', info: 'Ponte frente a una pared y adelanta la rodilla. Si tocas la pared con el talón pegado al suelo a 10cm de distancia, el test es Óptimo.' },
        { id: 'singleLegSquat', label: 'Sentadilla 1 Pierna', desc: 'Estabilidad de rodilla y cadera.', info: 'Baja en una pierna controlando que la rodilla no se hunda hacia adentro (valgo) y la cadera no caiga.' },
        { id: 'singleLegBalance', label: 'Equilibrio (Ojos cerrados)', desc: 'Control propioceptivo 30s.', info: 'Debes mantener el equilibrio sobre una pierna con los ojos cerrados durante al menos 30 segundos sin apoyo.' },
        { id: 'plank', label: 'Plancha Lateral', desc: 'Fuerza core lateral 45s.', info: 'Mantén la alineación hombro-cadera-tobillo. Un tiempo <45s indica debilidad en estabilizadores laterales (glúteo medio).' },
        { id: 'calfRaise', label: 'Elevación Talón', desc: 'Resistencia tríceps sural 20 reps.', info: '20-25 repeticiones completas sin fatiga excesiva. Vital para prevenir fascitis y tendinopatías.' },
        { id: 'pogoHops', label: 'Saltos Reactivos', desc: 'Stiffness del tendón de Aquiles.', info: 'Saltos cortos y rápidos de tobillo. Busca un contacto mínimo con el suelo y sensación de rebote elástico.' }
    ];

    function initBiomechanics() {
        if (!bioChecklistContainer) return;
        bioChecklistContainer.innerHTML = '';
        bioTests.forEach(test => {
            const col = document.createElement('div');
            col.className = "col-md-6";
            col.innerHTML = `
                <div id="bio-${test.id}" class="glass-card p-3 border-start border-4 border-secondary border-opacity-25 cursor-pointer hover-brightness h-100 transition-all position-relative">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div class="d-flex align-items-center gap-2">
                            <h6 class="text-white mb-0 fw-bold">${test.label}</h6>
                            <ion-icon name="information-circle-outline" class="text-white-50 info-hint" 
                                data-bs-toggle="tooltip" data-bs-placement="top" title="${test.info}"></ion-icon>
                        </div>
                        <ion-icon name="ellipse-outline" class="text-secondary check-icon"></ion-icon>
                    </div>
                    <p class="text-secondary small mb-0">${test.desc}</p>
                </div>
            `;
            col.querySelector('.glass-card').addEventListener('click', (e) => {
                // Prevent toggle if clicking the info icon
                if (e.target.closest('.info-hint')) return;
                toggleBioTest(test.id);
            });
            bioChecklistContainer.appendChild(col);
        });

        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    function toggleBioTest(id) {
        checklist[id] = !checklist[id];
        const el = document.getElementById(`bio-${id}`);
        const icon = el.querySelector('.check-icon');

        if (checklist[id]) {
            el.classList.replace('border-secondary', 'border-success');
            el.classList.add('bg-success', 'bg-opacity-10');
            icon.name = "checkmark-circle";
            icon.classList.replace('text-secondary', 'text-success');
        } else {
            el.classList.replace('border-success', 'border-secondary');
            el.classList.remove('bg-success', 'bg-opacity-10');
            icon.name = "ellipse-outline";
            icon.classList.replace('text-success', 'text-secondary');
        }
        updateBioRisk();
    }

    function updateBioRisk() {
        const total = bioTests.length;
        const passed = Object.values(checklist).filter(Boolean).length;
        const pct = Math.round((passed / total) * 100);

        const badge = document.getElementById('bioRiskBadge');
        const bar = document.getElementById('bioProgressBar');
        const pctText = document.getElementById('bioProgressPct');
        if (!badge || !bar) return;

        bar.style.width = `${pct}%`;
        if (pctText) pctText.textContent = `${pct}%`;

        if (pct === 100) {
            badge.textContent = "Óptimo";
            badge.className = "d-inline-block px-4 py-2 rounded-pill fw-bold mb-4 border border-success text-success bg-success bg-opacity-10 transition-all";
            bar.className = "progress-bar bg-success shadow-glow";
        } else if (pct > 50) {
            badge.textContent = "Aceptable";
            badge.className = "d-inline-block px-4 py-2 rounded-pill fw-bold mb-4 border border-warning text-warning bg-warning bg-opacity-10 transition-all";
            bar.className = "progress-bar bg-warning shadow-glow";
        } else {
            badge.textContent = pct > 0 ? "En Progreso" : "Sin Datos";
            badge.className = "d-inline-block px-4 py-2 rounded-pill fw-bold mb-4 border border-danger text-danger bg-danger bg-opacity-10 transition-all";
            bar.className = "progress-bar bg-danger shadow-glow";
        }
    }

    // --- 4. Training Plan Logic (Manual) ---

    function renderManualPlan() {
        const container = document.getElementById('manualPlanContainer');
        const days = parseInt(document.getElementById('proPlanDays')?.value) || 4;
        if (!container) return;

        const v = currentVam || 12; // Base 12 if no VAM
        const r1 = speedToPace(v * 0.70); // Easy
        const r2 = speedToPace(v * 0.85); // Tempo
        const r3 = speedToPace(v * 1.05); // Series

        const planData = [
            { day: "Lunes", task: "Rodaje Regenerativo", desc: `45-60 min @ ${r1} - Z1/Z2`, icon: "leaf-outline", color: "info" },
            { day: "Martes", task: "Series de Potencia", desc: `8x400m @ ${r3} (Rec. 1:1)`, icon: "flash-outline", color: "danger" },
            { day: "Miércoles", task: "Descanso Activo", desc: "Core + Movilidad o 30 min suave", icon: "sunny-outline", color: "success" },
            { day: "Jueves", task: "Rodaje Tempo", desc: `20 min Z2 + 20 min @ ${r2}`, icon: "speedometer-outline", color: "warning" },
            { day: "Viernes", task: "Descanso Total", desc: "Recuperación estructural", icon: "bed-outline", color: "secondary" },
            { day: "Sábado", task: "Tirada Larga", desc: `80-90 min progresivo @ ${r1}`, icon: "infinite-outline", color: "primary" },
            { day: "Domingo", task: "Opcional / Ciclismo", desc: "60 min Z1 o descanso", icon: "bicycle-outline", color: "info" }
        ];

        // Filter based on days per week (simplified selection)
        let selectedDays = planData;
        if (days === 3) selectedDays = [planData[1], planData[3], planData[5]];
        else if (days === 4) selectedDays = [planData[0], planData[1], planData[3], planData[5]];
        else if (days === 5) selectedDays = [planData[0], planData[1], planData[2], planData[3], planData[5]];

        container.innerHTML = '';
        selectedDays.forEach(d => {
            const div = document.createElement('div');
            div.className = "col-md-6 col-xl-4";
            div.innerHTML = `
                <div class="glass-card p-3 border-start border-4 border-${d.color} h-100 hover-scale transition-all">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-${d.color} bg-opacity-10 text-${d.color} small">${d.day}</span>
                        <ion-icon name="${d.icon}" class="text-${d.color} fs-5"></ion-icon>
                    </div>
                    <h6 class="text-white fw-bold mb-1">${d.task}</h6>
                    <p class="text-white-50 small mb-0 font-monospace">${d.desc}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // --- Utility Helpers ---

    function speedToPace(speedKmh) {
        if (speedKmh <= 0.1) return "--:--";
        const minPerKm = 60 / speedKmh;
        const mins = Math.floor(minPerKm);
        const secs = Math.round((minPerKm - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function timeStrToSeconds(str) {
        const parts = str.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    }

    function secondsToTimeStr(totalSec, forceHours = false) {
        if (!isFinite(totalSec)) return "--:--";
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = Math.floor(totalSec % 60);
        const pad = n => n.toString().padStart(2, '0');
        if (h > 0 || forceHours) return `${pad(h)}:${pad(m)}:${pad(s)}`;
        return `${pad(m)}:${pad(s)}`;
    }

    // --- Event Listeners Init ---
    [vamDistInput, test6mRadio, test12mRadio, fcMaxInput, fcRestInput, useKarvonenCheck].forEach(el => {
        if (el) el.addEventListener('input', calculatePhysiology);
        if (el && el.type === 'radio') el.addEventListener('change', calculatePhysiology);
    });

    [predDistInput, predTimeInput].forEach(el => {
        if (el) el.addEventListener('input', calculatePrediction);
    });

    const planDaysSelect = document.getElementById('proPlanDays');
    if (planDaysSelect) {
        planDaysSelect.addEventListener('change', renderManualPlan);
    }

    const btnOpenConfig = document.getElementById('btnOpenProZoneConfig');
    if (btnOpenConfig) btnOpenConfig.addEventListener('click', openProZoneConfig);

    const btnSaveConfig = document.getElementById('btnSaveProZones');
    if (btnSaveConfig) btnSaveConfig.addEventListener('click', saveProZones);

    // Initial Start
    calculatePhysiology();
    calculatePrediction();
    initBiomechanics();
    renderManualPlan();
});
