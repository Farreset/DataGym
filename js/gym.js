
// Gym Module Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Gym File Upload
    setupFileUpload({
        zoneId: 'gymUploadArea',
        inputId: 'gymVideoInput',
        btnId: 'btnGymSelectFile',
        resultBoxId: 'gymResultBox',
        mockId: 'gymAiOutputMock',
        // New Workflow Fields
        videoId: 'gymVideoPlayer',
        canvasId: 'gymCanvas',
        analyzeBtnId: 'btnAnalyzeGym',
        module: 'Gym',
        onAnalysisComplete: () => {
            const results = videoProcessor.getAnalysisResults();
            if (results && results.detected) {
                const resultBox = document.getElementById('gymResultBox');
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
                        <div class="col-12">
                            <h1 class="display-3 fw-bold text-primary">${results.reps}</h1>
                            <span class="text-white bg-primary px-3 py-1 rounded-pill text-uppercase small">Reps Detectadas</span>
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

                const mockOutput = document.getElementById('gymAiOutputMock');
                if (mockOutput) {
                    mockOutput.innerHTML = html;
                    mockOutput.classList.remove('d-none');
                }
            }
        }
    });

    initGymCalculators();
});

function initGymCalculators() {
    // 1. RM Calculator (Epley)
    const btnCalcRm = document.getElementById('btnCalcRm');
    if (btnCalcRm) {
        btnCalcRm.addEventListener('click', () => {
            const w = parseFloat(document.getElementById('inputRmWeight').value);
            const r = parseFloat(document.getElementById('inputRmReps').value);

            if (!w || !r) return;

            // 1RM = w * (1 + r/30)
            const oneRm = w * (1 + r / 30);
            const threeRm = oneRm * 0.93;
            const fiveRm = oneRm * 0.87;

            document.getElementById('res1rm').textContent = oneRm.toFixed(1);
            document.getElementById('res3rm').textContent = threeRm.toFixed(1);
            document.getElementById('res5rm').textContent = fiveRm.toFixed(1);
        });
    }
    // 2. Power Calculator (Section 1)
    const btnCalcPower = document.getElementById('btnCalcPower');
    let calculatedPotenciaP = 0; // Store for second step

    if (btnCalcPower) {
        btnCalcPower.addEventListener('click', () => {
            const w = parseFloat(document.getElementById('inputWWeight').value);
            const r = parseFloat(document.getElementById('inputWReps').value);
            const d = parseFloat(document.getElementById('inputCM').value); // cm
            const P = parseFloat(document.getElementById('inputPercentage').value) / 100;

            if (!w || !r || !d || !P) return;

            // Formula: Power = 5 * Weight * Reps * Distance (m)
            const potencia = (w * r * d * 2 * 9.81) / 5;
            const potenciap = potencia * P;

            calculatedPotenciaP = potenciap;

            document.getElementById('potencia').textContent = potencia.toFixed(1);
            document.getElementById('potenciap').textContent = potenciap.toFixed(1);

            // Enable next step
            const btnCalcTime = document.getElementById('btnCalcTime');
            if (btnCalcTime) btnCalcTime.disabled = false;
        });
    }

    // 2b. Time Estimation (Section 2)
    const btnCalcTime = document.getElementById('btnCalcTime');
    if (btnCalcTime) {
        btnCalcTime.addEventListener('click', () => {
            const wp = parseFloat(document.getElementById('inputWPWeight').value);
            const rp = parseFloat(document.getElementById('inputWPReps').value);
            const d = parseFloat(document.getElementById('inputCM').value); // reuse distance

            if (!wp || !rp || !d || !calculatedPotenciaP) return;

            // Time = Work / Adjusted Power
            const tiempo = (wp * rp * d * 2 * 9.81) / calculatedPotenciaP;

            document.getElementById('tiempo').textContent = tiempo.toFixed(2);
        });
    }

    // 3. BMI Calculator
    const btnCalcBmi = document.getElementById('btnCalcBmi');
    if (btnCalcBmi) {
        btnCalcBmi.addEventListener('click', () => {
            const h = parseFloat(document.getElementById('inputBmiHeight').value); // cm
            const w = parseFloat(document.getElementById('inputBmiWeight').value); // kg

            if (!h || !w) return;

            const hM = h / 100;
            const bmi = w / (hM * hM);
            let cat = 'Normal';
            if (bmi < 18.5) cat = 'Underweight';
            else if (bmi >= 25 && bmi < 29.9) cat = 'Overweight';
            else if (bmi >= 30) cat = 'Obese';

            document.getElementById('resBmiVal').textContent = bmi.toFixed(1);
            document.getElementById('resBmiCat').textContent = cat;
        });
    }

    // 4. Total Load
    const btnCalcCT = document.getElementById('btnCalcCT');
    if (btnCalcCT) {
        btnCalcCT.addEventListener('click', () => {
            const reps = parseFloat(document.getElementById('inputCTReps').value);
            const series = parseFloat(document.getElementById('inputCTSer').value);
            const weight = parseFloat(document.getElementById('inputCTWeight').value);

            if (!reps || !weight || !series) return;

            const load = reps * weight * series; // Total volume
            document.getElementById('resCTLoad').textContent = load.toFixed(0);
        });
    }
}
