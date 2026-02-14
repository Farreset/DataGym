document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const DB_URL = "/exercises";
    const IMG_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

    // --- State ---
    let allExercises = [];
    let currentRoutine = [];
    let sortableInstance = null;

    // --- DOM Elements ---
    const exerciseListEl = document.getElementById('exerciseList');
    const routineListEl = document.getElementById('routineList');
    const searchInput = document.getElementById('searchExercise');
    const muscleFilter = document.getElementById('filterMuscle');
    const equipmentFilter = document.getElementById('filterEquipment');
    const routineCountEl = document.getElementById('routineCount');
    const routineEstTimeEl = document.getElementById('routineEstTime');
    const btnSave = document.getElementById('btnSaveRoutine');
    const btnClear = document.getElementById('btnClearRoutine');
    const btnAddRest = document.getElementById('btnAddRest');

    // --- Initialization ---
    init();

    async function init() {
        await fetchExercises();
        loadRoutine();
        setupEventListeners();
        setupDragAndDrop();
    }

    // --- Data Fetching ---
    async function fetchExercises() {
        try {
            let response;
            try {
                response = await fetch(DB_URL);
                if (!response.ok) throw new Error("API Route failed");
            } catch (e) {
                console.warn("API /exercises failed, trying local fallback...");
                // Fallback for VSCode Live Server or static hosting
                response = await fetch('../server/data/exercises.json');
                if (!response.ok) throw new Error("Local fallback failed");
            }

            allExercises = await response.json();

            populateFilters();
            renderExercises(allExercises);
        } catch (error) {
            console.error(error);
            exerciseListEl.innerHTML = `
                <div class="text-center text-danger mt-5">
                    <ion-icon name="alert-circle-outline" class="display-4"></ion-icon>
                    <p>Error al cargar ejercicios.</p>
                    <small class="text-secondary">Asegúrate de ejecutar "node server.js" o usar Live Server desde la raíz.</small>
                </div>
            `;
        }
    }

    function populateFilters() {
        // Extract unique muscles and equipment
        const muscles = new Set();
        const equipment = new Set();

        allExercises.forEach(ex => {
            if (ex.primaryMuscles) ex.primaryMuscles.forEach(m => muscles.add(m));
            if (ex.equipment) equipment.add(ex.equipment);
        });

        // Sort and populate select options
        // Translate common muscle names if possible, but for now just Capitalize
        Array.from(muscles).sort().forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
            muscleFilter.appendChild(opt);
        });

        Array.from(equipment).sort().forEach(e => {
            const opt = document.createElement('option');
            opt.value = e;
            opt.textContent = e.charAt(0).toUpperCase() + e.slice(1);
            equipmentFilter.appendChild(opt);
        });
    }

    // --- Rendering Exercises ---
    function renderExercises(exercises) {
        exerciseListEl.innerHTML = '';
        const limit = 50;
        const visibleExercises = exercises.slice(0, limit);

        if (visibleExercises.length === 0) {
            exerciseListEl.innerHTML = '<div class="text-center text-secondary mt-5">No se encontraron ejercicios.</div>';
            return;
        }

        visibleExercises.forEach((ex, index) => {
            const card = document.createElement('div');
            card.className = 'glass-panel p-2 mb-2 d-flex align-items-center exercise-card-item gap-3';
            // Stagger animation
            card.style.animationDelay = `${index * 30}ms`;

            // Image Thumbnail
            let imgHTML = '<div class="bg-dark rounded d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;"><ion-icon name="image-outline" class="text-secondary"></ion-icon></div>';
            if (ex.images && ex.images.length > 0) {
                imgHTML = `<img src="${IMG_BASE_URL}${ex.images[0]}" class="rounded object-fit-cover" style="width: 60px; height: 60px;" alt="${ex.name}" loading="lazy">`;
            }

            const muscleBadge = ex.primaryMuscles && ex.primaryMuscles.length > 0
                ? `<span class="muscle-tag">${ex.primaryMuscles[0]}</span>`
                : '';

            card.innerHTML = `
                ${imgHTML}
                <div class="flex-grow-1">
                    <h6 class="mb-0 text-white" style="font-size: 0.95rem;">${ex.name}</h6>
                    <div class="small text-secondary">
                        ${muscleBadge}
                        <span class="text-white-50 small"><ion-icon name="construct-outline"></ion-icon> ${ex.equipment || 'Ninguno'}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary btn-add-exercise" data-id="${ex.id}">
                    <ion-icon name="add"></ion-icon>
                </button>
            `;

            card.querySelector('.btn-add-exercise').addEventListener('click', () => addToRoutine(ex));

            exerciseListEl.appendChild(card);
        });

        if (exercises.length > limit) {
            const more = document.createElement('div');
            more.className = "text-center text-secondary small py-2";
            more.textContent = `Mostrando ${limit} de ${exercises.length} resultados... Filtra para ver más.`;
            exerciseListEl.appendChild(more);
        }
    }

    // --- Filtering ---
    function filterExercises() {
        const term = searchInput.value.toLowerCase();
        const mFilter = muscleFilter.value;
        const eFilter = equipmentFilter.value;

        const filtered = allExercises.filter(ex => {
            const matchesName = ex.name.toLowerCase().includes(term);
            const matchesMuscle = mFilter ? (ex.primaryMuscles && ex.primaryMuscles.includes(mFilter)) : true;
            const matchesEquip = eFilter ? (ex.equipment === eFilter) : true;
            return matchesName && matchesMuscle && matchesEquip;
        });

        renderExercises(filtered);
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', filterExercises);
        muscleFilter.addEventListener('change', filterExercises);
        equipmentFilter.addEventListener('change', filterExercises);

        btnClear.addEventListener('click', () => {
            if (confirm('¿Borrar toda la rutina?')) {
                currentRoutine = [];
                renderRoutine();
                saveRoutine();
            }
        });

        btnSave.addEventListener('click', exportPDF); // Changed to PDF Export
        if (btnAddRest) btnAddRest.addEventListener('click', addRestItem);
    }

    function setupDragAndDrop() {
        if (sortableInstance) sortableInstance.destroy();

        sortableInstance = new Sortable(routineListEl, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                // Reorder array based on DOM
                const newRoutine = [];
                routineListEl.querySelectorAll('.routine-item').forEach(el => {
                    const uid = parseInt(el.dataset.uid);
                    const item = currentRoutine.find(i => i.uid === uid);
                    if (item) newRoutine.push(item);
                });
                currentRoutine = newRoutine;
                saveRoutine();
            }
        });
    }

    // --- Routine Management ---
    function addToRoutine(exercise) {
        // Default: 3 sets
        const defaultSets = [
            { weight: 0, reps: 10 },
            { weight: 0, reps: 10 },
            { weight: 0, reps: 10 }
        ];

        const item = {
            id: exercise.id,
            name: exercise.name,
            sets: defaultSets,
            images: exercise.images || [],
            muscles: exercise.primaryMuscles || [],
            equipment: exercise.equipment || '',
            uid: Date.now(),
            weightMode: 'standard', // Default to Fixed Weight
            restBetweenSets: 60,      // Default Rest Between Sets
            restBetweenExercises: 120 // Default Rest Between Exercises
        };

        currentRoutine.push(item);
        renderRoutine();
        saveRoutine();
    }

    function removeFromRoutine(uid) {
        currentRoutine = currentRoutine.filter(item => item.uid !== uid);
        renderRoutine();
        saveRoutine();
    }

    function addRestItem() {
        const item = {
            type: 'rest',
            name: 'Descanso',
            duration: 90, // seconds
            uid: Date.now()
        };
        currentRoutine.push(item);
        renderRoutine();
        saveRoutine();
    }

    function updateRestItemDuration(uid, val) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item) {
            item.duration = parseInt(val) || 0;
            saveRoutine();
        }
    }

    // Toggle Weight Mode
    function toggleWeightMode(uid, mode) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item) {
            item.weightMode = mode;
            // If switching TO standard, synchronize all weights to the first set's weight
            if (mode === 'standard' && item.sets.length > 0) {
                const firstWeight = item.sets[0].weight;
                item.sets.forEach(s => s.weight = firstWeight);
            }
            renderRoutine();
            saveRoutine();
        }
    }

    function updateSet(uid, setIndex, field, value) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item && item.sets[setIndex]) {
            const val = parseFloat(value) || 0;
            item.sets[setIndex][field] = val;

            // Weight Mode Logic
            if (field === 'weight' && item.weightMode === 'standard') {
                // Sync all other sets
                item.sets.forEach(s => s.weight = val);
                // Re-render to show updated values in other inputs
                // (Optimization: could manually update DOM, but render is safer)
                renderRoutine();
            }

            saveRoutine(); // Auto-save
        }
    }

    function updateRestTime(uid, type, value) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item) {
            if (type === 'sets') {
                item.restBetweenSets = parseInt(value) || 0;
            } else if (type === 'exercise') {
                item.restBetweenExercises = parseInt(value) || 0;
            }
            saveRoutine();
        }
    }

    function addSet(uid) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item) {
            // Copy last set or default
            const lastSet = item.sets[item.sets.length - 1] || { weight: 0, reps: 10 };

            // If standard mode, ensure new set has same weight as others (should already be case if copying last, but explicit is good)
            let newWeight = lastSet.weight;
            if (item.weightMode === 'standard' && item.sets.length > 0) {
                newWeight = item.sets[0].weight;
            }

            item.sets.push({ weight: newWeight, reps: lastSet.reps });
            renderRoutine();
            saveRoutine();
        }
    }

    function toggleSetCompletion(uid, setIndex) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item && item.sets[setIndex]) {
            item.sets[setIndex].completed = !item.sets[setIndex].completed;
            renderRoutine();
            saveRoutine();
        }
    }

    function removeSet(uid, setIndex) {
        const item = currentRoutine.find(i => i.uid === uid);
        if (item) {
            item.sets.splice(setIndex, 1);
            renderRoutine();
            saveRoutine();
        }
    }

    function renderRoutine() {
        routineListEl.innerHTML = '';

        if (currentRoutine.length === 0) {
            routineListEl.innerHTML = `
                <div class="text-center text-secondary mt-5 empty-state">
                    <ion-icon name="barbell-outline" class="display-1 opacity-25"></ion-icon>
                    <p class="mt-2" data-i18n="empty_routine_title">Tu rutina está vacía.</p>
                    <p class="small opacity-75" data-i18n="empty_routine_text">Haz clic en "+" para añadir ejercicios.</p>
                </div>
            `;
            updateSummary();
            return;
        }

        currentRoutine.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'routine-item mb-3 rounded overflow-hidden shadow-sm';
            card.dataset.uid = item.uid;

            // --- REST ITEM RENDERING ---
            if (item.type === 'rest') {
                card.classList.add('border', 'border-info', 'border-opacity-25');
                card.style.background = 'rgba(6, 182, 212, 0.1)'; // Cyan tint

                card.innerHTML = `
                    <div class="d-flex align-items-center p-3">
                        <div class="drag-handle text-secondary me-3" style="cursor: grab;"><ion-icon name="reorder-two-outline" size="large"></ion-icon></div>
                        
                        <div class="bg-info bg-opacity-25 rounded d-flex align-items-center justify-content-center text-info" style="width: 40px; height: 40px;">
                            <ion-icon name="cafe"></ion-icon>
                        </div>

                        <div class="flex-grow-1 ms-3">
                            <h6 class="mb-0 text-white fw-bold"><span data-i18n="rest_period">Descanso / Pausa</span></h6>
                            <small class="text-info-emphasis">Recuperación</small>
                        </div>

                        <div class="d-flex align-items-center bg-dark border border-info border-opacity-25 rounded px-2" style="height: 30px;">
                            <ion-icon name="timer-outline" class="text-info opacity-75"></ion-icon>
                            <input type="number" class="form-control bg-transparent border-0 text-white text-center p-0 shadow-none mx-1" 
                                style="width: 50px; font-size: 1rem;"
                                value="${item.duration}" 
                                onchange="window.updateRestItemDuration(${item.uid}, this.value)">
                            <span class="text-info small" style="font-size: 1rem;">s</span>
                        </div>

                         <button class="btn btn-sm btn-icon btn-outline-danger border-0 p-1 ms-3 hover-opacity-100 btn-remove" data-uid="${item.uid}"><ion-icon name="close-circle-outline" size="large"></ion-icon></button>
                    </div>
                `;
                card.querySelector('.btn-remove').addEventListener('click', () => removeFromRoutine(item.uid));
                routineListEl.appendChild(card);
                return; // Stop here for rest items
            }

            // --- EXERCISE ITEM RENDERING ---
            // Image
            let imgHTML = '';
            if (item.images && item.images.length > 0) {
                imgHTML = `<img src="${IMG_BASE_URL}${item.images[0]}" class="rounded me-3 object-fit-cover shadow-sm bg-dark" style="width: 60px; height: 60px; border: 1px solid rgba(255,255,255,0.1);" loading="lazy">`;
            }

            // Muscle Badges
            const muscleBadges = item.muscles.map(m => `<span class="muscle-tag">${m}</span>`).join('');

            // Weight Mode Selector Logic
            const isStandard = item.weightMode === 'standard' || !item.weightMode;
            // Visual cue for inputs if linked
            const inputClass = isStandard ? "border-accent" : "";

            // Sets Table HTML
            let setsHtml = '';
            item.sets.forEach((set, sIdx) => {
                setsHtml += `
                    <tr class="${set.completed ? 'completed-set' : ''}" id="set-row-${item.uid}-${sIdx}">
                        <td class="align-middle">
                            <div class="d-flex align-items-center gap-3">
                                <span>${sIdx < 9 ? '0' + (sIdx + 1) : sIdx + 1}</span>
                            </div>
                        </td>
                        <td class="py-1">
                             <input type="number" 
                                value="${set.weight > 0 ? set.weight : ''}" placeholder="0" 
                                onchange="window.updateRoutineSet(${item.uid}, ${sIdx}, 'weight', this.value)">
                        </td>
                        <td class="py-1">
                             <input type="number" 
                                value="${set.reps}" placeholder="0" 
                                onchange="window.updateRoutineSet(${item.uid}, ${sIdx}, 'reps', this.value)">
                        </td>
                         <td class="text-end py-1 align-middle" style="width: 30px;">
                            <button class="btn btn-link link-danger p-0 text-decoration-none hover-opacity-100" onclick="window.removeRoutineSet(${item.uid}, ${sIdx})">
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Header Section
            // Added Rest Time Inputs: Series vs Exercise
            const header = `
                <div class="d-flex align-items-center p-3" style="background: rgba(15, 23, 42, 0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div class="drag-handle text-secondary me-3" style="cursor: grab; transition: color 0.2s;"><ion-icon name="reorder-two-outline" size="large"></ion-icon></div>
                    ${imgHTML}
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="mb-1 text-white fw-semibold">${item.name}</h6>
                             <button class="btn btn-sm btn-icon btn-outline-danger border-0 p-1 hover-opacity-100 btn-remove" data-uid="${item.uid}"><ion-icon name="trash-outline" size="small"></ion-icon></button>
                        </div>
                        <div class="mb-1">${muscleBadges}</div>
                        <div class="d-flex align-items-center justify-content-between text-secondary small">
                            <span class="d-flex align-items-center gap-2"><ion-icon name="layers-outline"></ion-icon> ${item.sets.length} Series</span>
                            
                            <div class="d-flex gap-2 align-items-center">
                                <!-- Rest Between Sets -->
                                <div class="d-flex align-items-center bg-dark border border-secondary border-opacity-25 rounded px-2" style="height: 30px;" title="Descanso entre series (segundos)">
                                    <ion-icon name="timer-outline" class="text-secondary opacity-75"></ion-icon>
                                    <input type="number" class="form-control bg-transparent border-0 text-white text-center p-0 shadow-none mx-1" 
                                        style="width: 35px; font-size: 0.85rem;"
                                        value="${item.restBetweenSets || 60}" 
                                        onchange="window.updateRoutineRestTime(${item.uid}, 'sets', this.value)">
                                    <span class="text-white-50 small" style="font-size: 0.7rem;">s</span>
                                </div>

                                <select class="form-select form-select-sm bg-dark border-secondary text-secondary py-0 custom-select-arrow" 
                                    style="width: auto; height: 24px; font-size: 0.75rem;"
                                    onchange="window.toggleWeightMode(${item.uid}, this.value)">
                                    <option value="standard" ${isStandard ? 'selected' : ''}>Peso Fijo</option>
                                    <option value="variable" ${item.weightMode === 'variable' ? 'selected' : ''}>Variable</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Body Section (Sets)
            card.innerHTML = `
                ${header}
                <div class="p-2">
                    <table class="table-borderless">
                        <thead>
                            <tr>
                                <th style="width: 80px;">Set</th>
                                <th style="${isStandard ? 'color: var(--accent-primary);' : ''}">Peso ${isStandard ? '<ion-icon name="link-outline"></ion-icon>' : ''}</th>
                                <th>Reps</th>
                                <th style="width: 30px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${setsHtml}
                        </tbody>
                    </table>
                    <div class="text-center mt-2">
                         <button class="btn btn-add-set w-100" onclick="window.addRoutineSet(${item.uid})" data-i18n="add_set">+ Añadir Serie</button>
                    </div>
                </div>
            `;

            card.querySelector('.btn-remove').addEventListener('click', () => removeFromRoutine(item.uid));
            routineListEl.appendChild(card);
        });

        // Expose global helpers for inline events
        window.updateRoutineSet = (uid, sIdx, field, val) => updateSet(uid, sIdx, field, val);
        window.addRoutineSet = (uid) => addSet(uid);
        window.removeRoutineSet = (uid, sIdx) => removeSet(uid, sIdx);
        window.toggleWeightMode = (uid, mode) => toggleWeightMode(uid, mode);
        window.toggleSetCompletion = (uid, sIdx) => toggleSetCompletion(uid, sIdx);
        // Expose Rest Time Helper
        window.updateRoutineRestTime = (uid, type, val) => updateRestTime(uid, type, val);
        window.updateRestItemDuration = (uid, val) => updateRestItemDuration(uid, val);

        updateSummary();
    }

    function updateSummary() {
        routineCountEl.textContent = `${currentRoutine.length} Ejercicios`;
        // Removed estimated time
    }

    function saveRoutine() {
        localStorage.setItem('my_gym_routine', JSON.stringify(currentRoutine));
    }

    function loadRoutine() {
        const saved = localStorage.getItem('my_gym_routine');
        if (saved) {
            try {
                currentRoutine = JSON.parse(saved);
                // Fix legacy format if needed
                currentRoutine.forEach(item => {
                    if (typeof item.sets === 'number') {
                        item.sets = Array(item.sets).fill({ weight: 0, reps: item.reps || 10 });
                    }
                    if (!item.muscles) item.muscles = []; // Ensure muscles exist

                    // Migration: If old 'restTime' exists but new ones don't, map it
                    if (item.restTime && !item.restBetweenSets) {
                        item.restBetweenSets = item.restTime;
                    }
                    if (!item.restBetweenSets) item.restBetweenSets = 60;
                    if (!item.restBetweenExercises) item.restBetweenExercises = 120;
                });
                renderRoutine();
            } catch (e) {
                console.error("Failed to load routine", e);
            }
        }
    }

    // Helper to fetch image as data URI
    const getDataUri = (url) => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                canvas.getContext('2d').drawImage(image, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            image.onerror = () => resolve(null); // Resolve null if fail to not break PDF
            image.src = url;
        });
    }

    async function exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const btn = document.getElementById('btnSaveRoutine');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Generating...';
        btn.disabled = true;

        try {
            // Get Client Name
            const clientNameInput = document.getElementById('clientName');
            const clientName = clientNameInput ? clientNameInput.value.trim() : '';
            const displayClientName = clientName || "Rutina Personalizada";

            // --- Premium Header Design ---
            // Dark Background
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 50, 'F');

            // Accent Line
            doc.setDrawColor(6, 182, 212); // cyan-500
            doc.setLineWidth(1.5);
            doc.line(0, 50, 210, 50);

            // Brand / Title
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.text("DATAGYM", 14, 20);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text("ANALYTICS", 14, 26);

            // Client Name & Date
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(displayClientName.toUpperCase(), 14, 42);

            // Date Box (Right)
            doc.setFillColor(30, 41, 59); // slate-800
            doc.roundedRect(140, 12, 60, 26, 2, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("FECHA DE CREACIÓN", 145, 20);

            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text(new Date().toLocaleDateString(), 145, 30);

            let yPos = 65;

            // --- Helper for adding Page ---
            const checkPageBreak = (heightNeeded) => {
                if (yPos + heightNeeded > 270) {
                    doc.addPage();
                    yPos = 30; // Margin top on new page
                }
            };

            for (let i = 0; i < currentRoutine.length; i++) {
                const item = currentRoutine[i];

                if (item.type === 'rest') {
                    checkPageBreak(30);

                    // Styled Divider
                    doc.setDrawColor(6, 182, 212); // cyan-500
                    doc.setLineWidth(0.5);
                    doc.setFillColor(236, 254, 255); // cyan-50
                    doc.roundedRect(10, yPos, 190, 18, 2, 2, 'FD');

                    doc.setTextColor(8, 145, 178); // cyan-600
                    doc.setFontSize(11);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Descanso entre Ejercicios: ${item.duration}s`, 105, yPos + 12, { align: 'center' });

                    yPos += 28;
                } else {
                    const cardHeight = 55;

                    checkPageBreak(60);
                    const cardY = yPos;

                    // Card Container
                    doc.setDrawColor(226, 232, 240); // slate-200
                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(10, cardY, 190, cardHeight, 3, 3, 'FD');

                    // Image
                    let imageX = 15;
                    let imageY = cardY + 7;
                    let imageSize = 40;

                    doc.setFillColor(241, 245, 249); // slate-100 placeholder
                    doc.roundedRect(imageX, imageY, imageSize, imageSize, 2, 2, 'F');

                    if (item.images && item.images.length > 0) {
                        try {
                            const imgUrl = `${IMG_BASE_URL}${item.images[0]}`;
                            const imgData = await getDataUri(imgUrl);
                            if (imgData) {
                                doc.addImage(imgData, 'JPEG', imageX, imageY, imageSize, imageSize);
                                doc.setDrawColor(203, 213, 225);
                                doc.setLineWidth(0.2);
                                doc.roundedRect(imageX, imageY, imageSize, imageSize, 2, 2, 'S');
                            }
                        } catch (e) { console.warn('Image fail', e); }
                    }

                    // Info
                    const infoX = 65;
                    doc.setTextColor(15, 23, 42); // slate-900
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    const name = item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
                    doc.text(name.toUpperCase(), infoX, imageY + 8);

                    // Muscle Badge Look
                    doc.setFontSize(8);
                    doc.setTextColor(79, 70, 229); // indigo-600
                    const muscles = (item.muscles || []).slice(0, 2).join(', ').toUpperCase();
                    doc.text(muscles, infoX, imageY + 16);

                    // Rest Info Row
                    doc.setTextColor(100, 116, 139); // slate-500
                    doc.setFontSize(8);
                    doc.text(`Descanso Series: ${item.restBetweenSets || 60}s`, infoX, imageY + 26);


                    // Sets Table (Right Side)
                    const tableData = item.sets.map((s, idx) => [`${idx + 1}`, `${s.weight || '-'}`, `${s.reps}`]);

                    doc.autoTable({
                        startY: imageY,
                        margin: { left: 130 },
                        head: [['SET', 'KG', 'REPS']],
                        body: tableData,
                        theme: 'grid',
                        styles: {
                            font: 'helvetica',
                            fontSize: 8,
                            cellPadding: 3,
                            halign: 'center',
                            lineColor: [226, 232, 240],
                            lineWidth: 0.1,
                            textColor: [51, 65, 85]
                        },
                        headStyles: {
                            fillColor: [241, 245, 249],
                            textColor: [71, 85, 105],
                            fontStyle: 'bold',
                            lineWidth: 0
                        },
                        columnStyles: {
                            0: { cellWidth: 12, fontStyle: 'bold' },
                            1: { cellWidth: 18 },
                            2: { cellWidth: 18 }
                        },
                        tableWidth: 60
                    });

                    yPos += cardHeight + 8;
                }
            }

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`DataGym • Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            // Filename
            const safeName = displayClientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`Rutina_${safeName}.pdf`);

        } catch (err) {
            console.error(err);
            alert("Error generando PDF: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
});
