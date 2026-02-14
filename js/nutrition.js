/**
 * Antigravity Nutrition Engine Client Logic
 * Version 3.1 - Robust Auditor
 */

// Global State
let macroChart = null;
let selectedPortion = 'normal';

function setPortion(size, btn) {
    selectedPortion = size;
    // Update UI highlights
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => {
        b.classList.remove('btn-outline-primary', 'active');
        b.classList.add('btn-outline-secondary');
    });
    btn.classList.remove('btn-outline-secondary');
    btn.classList.add('btn-outline-primary', 'active');
}

// Expose to window
window.setPortion = setPortion;

function triggerUpload() {
    document.getElementById('fileInput').click();
}

/**
 * Safe DOM Update Helper
 */
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
    } else {
        console.warn(`[NutritionEngine] Missing DOM Element: #${id}`);
    }
}

function safeSetClass(id, className) {
    const el = document.getElementById(id);
    if (el) {
        el.className = className;
    }
}

async function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // 1. Show Preview
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('foodPreview');
            if (preview) preview.src = e.target.result;
        }
        reader.readAsDataURL(file);

        // 2. Show Loading UI
        const uploadPrompt = document.getElementById('uploadPrompt');
        const resultsDashboard = document.getElementById('resultsDashboard');
        const loadingState = document.getElementById('loadingState');

        if (uploadPrompt) uploadPrompt.classList.add('d-none');
        if (resultsDashboard) resultsDashboard.classList.add('d-none');
        if (loadingState) loadingState.classList.remove('d-none');

        // Simulate Ruthless Loading States
        const loadingTexts = [
            "Iniciando Auditoría Forense...",
            "Buscando calorías ocultas...",
            "Calculando Índice de Estafa...",
            "Detectando picos de insulina..."
        ];
        let textIdx = 0;
        const textInterval = setInterval(() => {
            safeSetText('loadingText', loadingTexts[textIdx % loadingTexts.length]);
            textIdx++;
        }, 800);

        try {
            // 3. Send to API
            const formData = new FormData();
            formData.append('image', file);
            formData.append('portion_size', selectedPortion);

            const response = await fetch('/api/analyze-food', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            clearInterval(textInterval);

            // Check version/structure
            if (data.status === "AUDIT_COMPLETE") {
                renderRuthlessAudit(data);
            } else {
                renderForensicAnalysis(data); // Legacy v2/v1 fallback
            }

        } catch (error) {
            clearInterval(textInterval);
            console.error(error);
            alert("Error en la auditoría. Inténtalo de nuevo.");
            if (loadingState) loadingState.classList.add('d-none');
            if (uploadPrompt) uploadPrompt.classList.remove('d-none');
        }
    }
}

function renderRuthlessAudit(data) {
    // Hide loading
    const loadingState = document.getElementById('loadingState');
    const resultsDashboard = document.getElementById('resultsDashboard');
    if (loadingState) loadingState.classList.add('d-none');
    if (resultsDashboard) resultsDashboard.classList.remove('d-none');

    // --- Header Data ---
    safeSetText('resCategory', "FORENSIC_AUDIT");
    safeSetClass('resCategory', "badge bg-danger border border-danger text-white mb-2 w-auto align-self-start");

    safeSetText('resItemName', data.dish_name);
    safeSetText('resVerdict', data.verdict_badge.replace('_', ' '));
    safeSetClass('resVerdict', "lead text-danger fw-bold mb-3");

    safeSetText('resWeight', data.forensic_analysis.detected_mass_g + "g");

    // Price / Ripoff Index
    const priceText = `${data.market_valuation.est_price_restaurant} (Rest)`;
    safeSetText('resPrice', priceText);

    // Health Score
    safeSetText('resHealthScore', "⚠️");
    safeSetClass('resHealthScore', "display-3 fw-bold text-danger");

    // --- Macros Chart ---
    safeSetText('resCalories', data.nutritional_fact_sheet.real_calories);

    // Update Text Values
    const p = data.nutritional_fact_sheet.macros.pro.replace('g', '');
    const c = data.nutritional_fact_sheet.macros.carb.replace('g', '');
    const f = data.nutritional_fact_sheet.macros.fat.replace('g', '');

    safeSetText('valProtein', p + 'g');
    safeSetText('valCarbs', c + 'g');
    safeSetText('valFats', f + 'g');

    renderMacroChart({ protein_g: p, carbs_g: c, fat_g: f });

    // --- Deep Details ---
    safeSetText('detProteinTotal', p + 'g');
    safeSetText('detProteinQuality', "Revise Source");

    safeSetText('detCarbsTotal', c + 'g');
    safeSetText('detFiber', "?");
    safeSetText('detSugar', "HIGH");

    safeSetText('detFatsTotal', f + 'g');
    safeSetText('detSatFat', "Check Oil");
    safeSetText('detOmega3', "-");

    // --- Micros List ---
    const microsList = document.getElementById('microsList');
    if (microsList) {
        microsList.innerHTML = '<h6 class="text-danger mb-2">Audit Focus Areas:</h6>';
        data.nutritional_fact_sheet.micros_focus.forEach(micro => {
            microsList.innerHTML += `
                <div class="list-group-item bg-transparent text-white border-danger border-opacity-25 d-flex justify-content-between align-items-center px-0">
                    <div>
                        <strong class="text-white">${micro.name}</strong>
                        <div class="small text-danger">${micro.function}</div>
                    </div>
                    <span class="badge bg-danger bg-opacity-25 border border-danger">${micro.amount}</span>
                </div>
            `;
        });
    }

    // --- Evidence & Warning ---
    safeSetText('resChefFeedback', data.forensic_analysis.evidence);

    const feedbackEl = document.getElementById('resChefFeedback');
    if (feedbackEl && feedbackEl.parentElement) {
        feedbackEl.parentElement.className = "alert alert-danger border-danger d-flex gap-3 align-items-start";
    }

    const flagsContainer = document.getElementById('warningFlags');
    if (flagsContainer) {
        flagsContainer.innerHTML = '';

        // Ripoff Flag
        if (data.market_valuation.ripoff_index) {
            flagsContainer.innerHTML += `
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 p-2">
                    <ion-icon name="wallet"></ion-icon> RIPOFF: ${data.market_valuation.ripoff_index}
                </span>
            `;
        }

        // Hidden Calories Flag
        if (data.forensic_analysis.hidden_calories_detected) {
            flagsContainer.innerHTML += `
                <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 p-2">
                    <ion-icon name="eye-off"></ion-icon> CALORÍAS OCULTAS
                </span>
            `;
        }
    }
}

// Fallback to v2 render (also safe-guarded)
function renderForensicAnalysis(data) {
    const loadingState = document.getElementById('loadingState');
    const resultsDashboard = document.getElementById('resultsDashboard');
    if (loadingState) loadingState.classList.add('d-none');
    if (resultsDashboard) resultsDashboard.classList.remove('d-none');

    // Header
    const cat = data.detection_method || data.category || "SCAN";
    const name = data.item_name || data.item_detected;

    safeSetText('resCategory', cat);
    safeSetClass('resCategory', "badge bg-dark border border-secondary text-secondary mb-2 w-auto align-self-start");
    safeSetText('resItemName', name);

    const verdict = (data.health_verdict && data.health_verdict.tag) ? data.health_verdict.tag : (data.economics ? data.economics.verdict : "ANALYZED");
    safeSetText('resVerdict', verdict.replace('_', ' '));
    safeSetClass('resVerdict', "lead text-primary mb-3");

    // Weight/Price
    let weight = "0g";
    if (data.visual_evidence && data.visual_evidence.portion_size) weight = data.visual_evidence.portion_size.split('(')[0];
    else if (data.physical_data) weight = data.physical_data.total_weight_est;
    safeSetText('resWeight', weight);

    let price = "0.00";
    if (data.market_analysis) price = data.market_analysis.est_price_restaurant;
    else if (data.economics) price = data.economics.estimated_price_restaurant;
    safeSetText('resPrice', price);

    // Score
    let score = 0;
    if (data.health_verdict && data.health_verdict.score) score = data.health_verdict.score;
    else if (data.health_score) score = data.health_score;
    if (score <= 10) score *= 10;

    safeSetText('resHealthScore', score);
    // Styling...
    if (score >= 80) safeSetClass('resHealthScore', "display-3 fw-bold text-success");
    else if (score >= 50) safeSetClass('resHealthScore', "display-3 fw-bold text-warning");
    else safeSetClass('resHealthScore', "display-3 fw-bold text-danger");

    // Macros
    let calories = 0, p = 0, c = 0, f = 0;
    if (data.nutritional_panel) {
        calories = data.nutritional_panel.calories.total;
        p = data.nutritional_panel.macros.protein_g;
        c = data.nutritional_panel.macros.carbs_g;
        f = data.nutritional_panel.macros.fat_g;
    } else if (data.macros) {
        calories = data.macros.calories;
        p = parseFloat(data.macros.protein.total);
        c = parseFloat(data.macros.carbs.total);
        f = parseFloat(data.macros.fats.total);
    }
    safeSetText('resCalories', calories);
    safeSetText('valProtein', p + 'g');
    safeSetText('valCarbs', c + 'g');
    safeSetText('valFats', f + 'g');

    renderMacroChart({ protein_g: p, carbs_g: c, fat_g: f });

    // Details... 
    safeSetText('detProteinTotal', p + 'g');
    safeSetText('detCarbsTotal', c + 'g');
    safeSetText('detFatsTotal', f + 'g');

    // Micros
    const microsList = document.getElementById('microsList');
    if (microsList) {
        microsList.innerHTML = '';
        let micros = [];
        if (data.nutritional_panel && data.nutritional_panel.micros_detailed) micros = data.nutritional_panel.micros_detailed;
        else if (data.micros_highlight) micros = data.micros_highlight;

        micros.forEach(micro => {
            microsList.innerHTML += `
                <div class="list-group-item bg-transparent text-white border-secondary border-opacity-25 d-flex justify-content-between align-items-center px-0">
                    <div>
                        <strong class="text-info">${micro.name}</strong>
                        <div class="small text-secondary">${micro.function || micro.benefit}</div>
                    </div>
                    <span class="badge bg-dark border border-secondary">${micro.amount}</span>
                </div>
            `;
        });
    }

    // Feedback
    const feedback = (data.health_verdict && data.health_verdict.advice) ? data.health_verdict.advice : (data.chef_feedback || "");
    safeSetText('resChefFeedback', feedback);

    const feedbackEl = document.getElementById('resChefFeedback');
    if (feedbackEl && feedbackEl.parentElement) {
        feedbackEl.parentElement.className = "alert alert-dark border-secondary d-flex gap-3 align-items-start";
    }

    const flagsContainer = document.getElementById('warningFlags');
    if (flagsContainer) flagsContainer.innerHTML = '';
}

function renderMacroChart(macros) {
    const canvas = document.getElementById('macrosChart');
    if (!canvas) return; // Safety check

    const ctx = canvas.getContext('2d');

    // Parse numeric values (remove 'g')
    const p = parseFloat(macros.protein_g || macros.pro);
    const c = parseFloat(macros.carbs_g || macros.carb);
    const f = parseFloat(macros.fat_g || macros.fat);

    if (macroChart) macroChart.destroy();

    macroChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Proteína', 'Carbos', 'Grasas'],
            datasets: [{
                data: [p, c, f],
                backgroundColor: [
                    '#ef4444', // Red (Protein)
                    '#f59e0b', // Amber (Carbs)
                    '#10b981'  // Emerald (Fats)
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '75%',
            plugins: {
                legend: { display: false }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
