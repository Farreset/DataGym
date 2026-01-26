
// --- Lógica del Módulo de Gimnasio ---
// Este archivo controla las calculadoras de peso y el análisis de técnica con IA.

document.addEventListener('DOMContentLoaded', () => {
    // Configuramos la subida de vídeos para el análisis de ejercicios (Sentadilla, Banca, etc.)
    // ... (previous code) ...

    setupFileUpload({
        zoneId: 'gymUploadArea',      // Dónde arrastras el vídeo
        inputId: 'gymVideoInput',     // El selector de archivos invisible
        btnId: 'btnGymSelectFile',    // El botón de "Elegir Archivo"
        resultBoxId: 'gymResultBox',  // Dónde escribimos el estado
        mockId: 'gymAiOutputMock',    // Dónde pintaremos los resultados de la IA
        videoId: 'gymVideoPlayer',    // El reproductor de vídeo
        canvasId: 'gymCanvas',        // El lienzo para dibujar el esqueleto IA
        analyzeBtnId: 'btnAnalyzeGym',// El botón de "Analizar con IA"
        module: 'Gym',                // Le decimos a la IA que busque repeticiones de gym
        onAnalysisComplete: () => {
            const results = videoProcessor.getAnalysisResults();
            displayGymResults(results);
        }
    });

    // Encendemos las calculadoras de peso (1RM, Potencia, IMC)
    initGymCalculators();
});

// Helper to display results
function displayGymResults(results) {
    if (results && results.detected) {
        const resultBox = document.getElementById('gymResultBox');
        const waitingText = resultBox.querySelector('.text-secondary.fst-italic');
        if (waitingText) waitingText.classList.add('d-none');

        // 1. Reps Display (Unilateral vs Bilateral)
        let repsHtml = '';
        if (results.isUnilateral) {
            repsHtml = `<div class="d-flex justify-content-center gap-4">
                            <div><h1 class="display-3 fw-bold text-primary">${results.repsL}</h1><small class="text-uppercase">Izq</small></div>
                            <div><h1 class="display-3 fw-bold text-primary">${results.repsR}</h1><small class="text-uppercase">Der</small></div>
                         </div>`;
        } else {
            repsHtml = `<h1 class="display-3 fw-bold text-primary">${results.reps}</h1>`;
        }

        // 2. Errors & Suggestions Table
        let errorListHtml = '';
        let suggestionHtml = '';
        const errors = results.errors || {};
        const errorKeys = Object.keys(errors);

        if (errorKeys.length > 0) {
            // Sort by frequency
            errorKeys.sort((a, b) => errors[b] - errors[a]);

            let listItems = '';
            errorKeys.forEach(err => {
                listItems += `<li class="d-flex justify-content-between text-danger small">
                                <span><ion-icon name="alert-circle" class="me-1"></ion-icon>${err}</span>
                                <span class="badge bg-danger rounded-pill">${errors[err]}</span>
                              </li>`;
            });
            errorListHtml = `<ul class="list-group list-group-flush bg-transparent">${listItems}</ul>`;

            // Generate smart suggestion based on top error
            const topError = errorKeys[0];
            let advice = "Mejora tu técnica general.";
            // Simple mapping logic (could be more advanced)
            if (topError.includes("talones")) advice = "Trabaja en la movilidad de tobillo y mantén los talones pegados.";
            else if (topError.includes("rodillas")) advice = "Activa los glúteos y empuja rodillas afuera.";
            else if (topError.includes("arquear")) advice = "Fortalece el core y mantén la columna neutra.";
            else if (topError.includes("balancearte")) advice = "Baja el peso y controla la fase excéntrica.";
            else if (topError.includes("codos")) advice = "Ajusta la posición de tus codos para mayor estabilidad.";
            else if (topError.includes("asimétrico")) advice = "Realiza ejercicios unilaterales para corregir el desbalance.";

            suggestionHtml = `<div class="alert alert-info small mt-2"><ion-icon name="bulb" class="me-1"></ion-icon><strong>Consejo:</strong> ${advice}</div>`;

        } else {
            errorListHtml = '<p class="text-success small mb-0"><ion-icon name="checkmark-circle" class="me-1"></ion-icon>¡Técnica Excelente!</p>';
            suggestionHtml = '<div class="alert alert-success small mt-2">¡Sigue así! Sube de peso progresivamente.</div>';
        }

        const html = `
             <div class="row text-center mb-3">
                <div class="col-12">
                    ${repsHtml}
                    <span class="text-white bg-primary px-3 py-1 rounded-pill text-uppercase small">Reps Totales</span>
                </div>
            </div>
            <div class="row g-2">
                <div class="col-12">
                    <div class="p-3 border rounded bg-white bg-opacity-10">
                        <h6 class="small text-uppercase text-secondary mb-2">Resumen de Técnica</h6>
                        ${errorListHtml}
                        ${suggestionHtml}
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

// ... (Rest of existing initGymCalculators) ...


function initGymCalculators() {
    // --- 1. Calculadora de RM (Fuerza Máxima) ---
    // Estima cuánto peso podrías levantar una sola vez basado en tus repeticiones.
    const btnCalcRm = document.getElementById('btnCalcRm');
    if (btnCalcRm) {
        btnCalcRm.addEventListener('click', () => {
            const w = parseFloat(document.getElementById('inputRmWeight').value); // Peso usado
            const r = parseFloat(document.getElementById('inputRmReps').value);   // Repes hechas

            if (!w || !r) return;

            // Fórmula de Epley: RM = Peso * (1 + Repes/30)
            const oneRm = w * (1 + r / 30);
            const threeRm = oneRm * 0.93; // 93% del RM
            const fiveRm = oneRm * 0.87;  // 87% del RM

            document.getElementById('res1rm').textContent = oneRm.toFixed(1);
            document.getElementById('res3rm').textContent = threeRm.toFixed(1);
            document.getElementById('res5rm').textContent = fiveRm.toFixed(1);
        });
    }

    // --- 2. Calculadora de Potencia (Fase 1: Trabajo y Vatios) ---
    const btnCalcPower = document.getElementById('btnCalcPower');
    let calculatedPotenciaP = 0; // Guardamos este dato para el paso 2

    if (btnCalcPower) {
        btnCalcPower.addEventListener('click', () => {
            const w = parseFloat(document.getElementById('inputWWeight').value); // Peso
            const r = parseFloat(document.getElementById('inputWReps').value);   // Repes
            const d = parseFloat(document.getElementById('inputCM').value);     // Recorrido en cm
            const P = parseFloat(document.getElementById('inputPercentage').value) / 100; // Eficacia

            if (!w || !r || !d || !P) return;

            // Calculamos la potencia total generada (Vatios)
            const potencia = (w * r * d * 2 * 9.81) / 5;
            const potenciap = potencia * P;

            calculatedPotenciaP = potenciap; // Lo guardamos

            document.getElementById('potencia').textContent = potencia.toFixed(1);
            document.getElementById('potenciap').textContent = potenciap.toFixed(1);

            // Activamos el siguiente botón para estimar tiempos
            const btnCalcTime = document.getElementById('btnCalcTime');
            if (btnCalcTime) btnCalcTime.disabled = false;
        });
    }

    // --- 2b. Estimación de Tiempo (Fase 2) ---
    const btnCalcTime = document.getElementById('btnCalcTime');
    if (btnCalcTime) {
        btnCalcTime.addEventListener('click', () => {
            const wp = parseFloat(document.getElementById('inputWPWeight').value);
            const rp = parseFloat(document.getElementById('inputWPReps').value);
            const d = parseFloat(document.getElementById('inputCM').value);

            if (!wp || !rp || !d || !calculatedPotenciaP) return;

            // ¿Cuánto tardarías en hacer este trabajo con esa potencia?
            const tiempo = (wp * rp * d * 2 * 9.81) / calculatedPotenciaP;

            document.getElementById('tiempo').textContent = tiempo.toFixed(2);
        });
    }

    // --- 3. Calculadora de IMC (Índice de Masa Corporal) ---
    // Nos dice si tu peso es saludable para tu altura.
    const btnCalcBmi = document.getElementById('btnCalcBmi');
    if (btnCalcBmi) {
        btnCalcBmi.addEventListener('click', () => {
            const h = parseFloat(document.getElementById('inputBmiHeight').value); // Altura en cm
            const w = parseFloat(document.getElementById('inputBmiWeight').value); // Peso en kg

            if (!h || !w) return;

            const hM = h / 100; // Altura a metros para la fórmula
            const bmi = w / (hM * hM); // Peso / Altura al cuadrado

            let cat = 'Normal';
            if (bmi < 18.5) cat = 'Bajo peso';
            else if (bmi >= 25 && bmi < 29.9) cat = 'Sobrepeso';
            else if (bmi >= 30) cat = 'Obesidad';

            document.getElementById('resBmiVal').textContent = bmi.toFixed(1);
            document.getElementById('resBmiCat').textContent = cat;
        });
    }

    // --- 4. Calculadora de Volumen Total ---
    // Cuántos kilos totales has movido en todo el entrenamiento.
    const btnCalcCT = document.getElementById('btnCalcCT');
    if (btnCalcCT) {
        btnCalcCT.addEventListener('click', () => {
            const reps = parseFloat(document.getElementById('inputCTReps').value);
            const series = parseFloat(document.getElementById('inputCTSer').value);
            const weight = parseFloat(document.getElementById('inputCTWeight').value);

            if (!reps || !weight || !series) return;

            const load = reps * weight * series; // Repes x Peso x Series
            document.getElementById('resCTLoad').textContent = load.toFixed(0);
        });
    }

    // --- 5. Webcam Logic ---
    setupWebcam();
}

function setupWebcam() {
    const btnCamera = document.getElementById('btnGymCamera');
    const btnStop = document.getElementById('btnGymStopCamera');
    const videoElement = document.getElementById('gymVideoPlayer');
    const canvasElement = document.getElementById('gymCanvas');
    const uploadArea = document.getElementById('gymUploadArea'); // Hide this when camera is on? Optional.
    const analyzeBtn = document.getElementById('btnAnalyzeGym');

    let stream = null;
    let cameraActive = false;

    if (btnCamera) {
        btnCamera.addEventListener('click', async () => {
            try {
                // Determine module (assuming we are in Gym module here as this file is gym.js)
                const module = 'Gym';

                // 1. Initialize AI Processor FIRST to attach its event listeners (which might overwrite)
                // We do this matching the element, but we'll manually handle the play/dimensions for webcam to be safe.
                videoProcessor.setupAnalysis(videoElement, canvasElement, module);

                // 2. Request Camera Access
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 }
                });

                // 3. Set Video Source & Handle Playback
                videoElement.srcObject = stream;
                videoElement.classList.remove('d-none');

                // Manually handle metadata since setupAnalysis might have its own ideas.
                // We want to ensure we Play and Resize canvas.
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    canvasElement.classList.remove('d-none');
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;

                    // Update processor dimensions just in case
                    if (videoProcessor.getLayout) {
                        // videoProcessor internally uses canvas dimensions, so we are good if we set them above.
                    }
                };

                // 4. Update UI
                btnCamera.classList.add('d-none');
                btnStop.classList.remove('d-none');
                document.getElementById('btnGymSelectFile').disabled = true;

                // 5. Start Processing Loop
                cameraActive = true;
                videoProcessor.isVideoPlaying = true;
                videoProcessor.processFrame();

                analyzeBtn.disabled = false;

                if (videoProcessor.gymAnalyzer && exerciseSelect) {
                    videoProcessor.gymAnalyzer.exerciseType = exerciseSelect.value;
                    videoProcessor.gymAnalyzer.config = videoProcessor.gymAnalyzer.getExerciseConfig(exerciseSelect.value);
                    videoProcessor.gymAnalyzer.state = 'start'; // Reset state
                    videoProcessor.gymAnalyzer.reps = 0;
                    videoProcessor.gymAnalyzer.corrections = new Set(); // Clear old corrections
                    videoProcessor.gymAnalyzer.formIssues = [];
                }

            } catch (err) {
                console.error("Error accessing webcam:", err);
                alert("No se pudo acceder a la cámara. Revisa los permisos.");
            }
        });
    }

    // --- 6. Dynamic Exercise Switching ---
    const exerciseSelect = document.getElementById('gymExerciseSelect');
    if (exerciseSelect) {
        exerciseSelect.addEventListener('change', () => {
            // Update analyzer if it's running (camera on)
            if (videoProcessor.gymAnalyzer) {
                const newType = exerciseSelect.value;
                videoProcessor.gymAnalyzer.exerciseType = newType;
                videoProcessor.gymAnalyzer.config = videoProcessor.gymAnalyzer.getExerciseConfig(newType);

                // Reset counters/state for new exercise
                videoProcessor.gymAnalyzer.state = 'start';
                videoProcessor.gymAnalyzer.reps = 0;
                videoProcessor.gymAnalyzer.corrections = new Set();
                videoProcessor.gymAnalyzer.formIssues = [{ time: Date.now() / 1000, issue: "Ejercicio Cambiado: " + newType }];
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            cameraActive = false;
            videoProcessor.isVideoPlaying = false; // Stop AI loop

            // Reset UI
            videoElement.classList.add('d-none');
            canvasElement.classList.add('d-none');

            btnStop.classList.add('d-none');
            btnCamera.classList.remove('d-none');
            document.getElementById('btnGymSelectFile').disabled = false;
        });
    }
}
