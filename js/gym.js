
// --- Lógica del Módulo de Gimnasio ---
// Este archivo controla las calculadoras de peso y el análisis de técnica con IA.

document.addEventListener('DOMContentLoaded', () => {
    // Configuramos la subida de vídeos para el análisis de ejercicios (Sentadilla, Banca, etc.)
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
            // Cuando la IA termina de procesar el vídeo, mostramos los datos:
            const results = videoProcessor.getAnalysisResults();
            if (results && results.detected) {
                const resultBox = document.getElementById('gymResultBox');
                const waitingText = resultBox.querySelector('.text-secondary.fst-italic');
                if (waitingText) waitingText.classList.add('d-none'); // Escondemos el mensaje de espera

                // 1. Preparamos la lista de fallos técnicos (en rojo)
                let correctionsHtml = '';
                if (results.corrections.length > 0) {
                    correctionsHtml = '<ul class="list-unstyled mb-0 text-start">';
                    results.corrections.forEach(c => {
                        correctionsHtml += `<li class="text-danger small"><ion-icon name="alert-circle" class="me-1"></ion-icon>${c}</li>`;
                    });
                    correctionsHtml += '</ul>';
                } else {
                    // Si no hay fallos, ¡felicitamos al usuario!
                    correctionsHtml = '<p class="text-success small mb-0"><ion-icon name="checkmark-circle" class="me-1"></ion-icon>¡Buena Técnica!</p>';
                }

                // 2. Preparamos las recomendaciones positivas (etiquetas azules)
                let recHtml = '';
                results.recommendations.forEach(r => {
                    recHtml += `<span class="badge bg-info text-dark me-1">${r}</span>`;
                });

                // 3. Montamos el diseño final de los resultados
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
                                <h6 class="small text-uppercase text-secondary mb-2">Fallo Técnico</h6>
                                ${correctionsHtml}
                            </div>
                        </div>
                         <div class="col-6">
                            <div class="p-2 border rounded bg-white bg-opacity-10 h-100">
                                <h6 class="small text-uppercase text-secondary mb-2">Sugerencias</h6>
                                <div>${recHtml}</div>
                            </div>
                        </div>
                    </div>
                `;

                // Inyectamos todo el HTML nuevo en el cuadro de resultados
                const mockOutput = document.getElementById('gymAiOutputMock');
                if (mockOutput) {
                    mockOutput.innerHTML = html;
                    mockOutput.classList.remove('d-none');
                }
            }
        }
    });

    // Encendemos las calculadoras de peso (1RM, Potencia, IMC)
    initGymCalculators();
});

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

                // 1. Request Camera Access
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 }
                });

                // 2. Set Video Source
                videoElement.srcObject = stream;
                videoElement.classList.remove('d-none');
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    canvasElement.classList.remove('d-none');
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                };

                // 3. Update UI
                btnCamera.classList.add('d-none');
                btnStop.classList.remove('d-none');
                // Disable file upload while camera is active
                document.getElementById('btnGymSelectFile').disabled = true;

                // 4. Initialize AI Processor with live stream
                // We need to initialize the analyzer immediately for real-time
                videoProcessor.setupAnalysis(videoElement, canvasElement, module);

                // Start processing loop
                cameraActive = true;

                // We can hook into videoProcessor's play/pause but for webcam we just want it to run
                videoProcessor.isVideoPlaying = true;
                videoProcessor.processFrame();

                analyzeBtn.disabled = false; // Enable "Analyze" button just in case, though it's real-time now

            } catch (err) {
                console.error("Error accessing webcam:", err);
                alert("No se pudo acceder a la cámara. Por favor, revisa los permisos.");
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
