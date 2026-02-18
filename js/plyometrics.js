
// --- Lógica del Módulo de Pliometría ---
// Aquí es donde sucede la "magia" de los cálculos y el análisis de saltos.

document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, preparamos las calculadoras (los cuadros de texto y botones)
    initPlyoCalculators();

    // Configuramos el sistema de subida de vídeos para el Analizador con IA
    // Esto conecta los botones del HTML con las funciones del sistema.
    setupFileUpload({
        zoneId: 'plyoUploadArea',      // Dónde arrastras el vídeo
        inputId: 'plyoVideoInput',     // El selector de archivos oculto
        btnId: 'btnPlyoSelectFile',    // El botón de "Elegir Archivo"
        resultBoxId: 'plyoResultBox',  // Dónde escribiremos los mensajes de carga
        mockId: 'plyoAiOutputMock',    // Dónde se mostrarán los datos finales
        videoId: 'plyoVideoPlayer',    // El reproductor de vídeo
        canvasId: 'plyoCanvas',        // Donde dibujamos el esqueleto encima del vídeo
        analyzeBtnId: 'btnAnalyzePlyo',// El botón de "Analizar con IA"
        module: 'Plyometrics',         // Indicamos que estamos en el modo Pliometría
        onAnalysisComplete: handlePlyoAnalysisResults // Qué hacer cuando termine el vídeo
    });

    // Inicializamos los tooltips de Bootstrap
    initTooltips();
});

/**
 * Inicializa los tooltips de Bootstrap para mostrar información de ayuda.
 */
function initTooltips() {
    // Primero destruimos tooltips existentes para evitar duplicados si se llama varias veces
    const existingTooltips = document.querySelectorAll('.tooltip');
    existingTooltips.forEach(t => t.remove());

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        // Obtenemos el texto traducido del atributo data-bs-title usando getTranslation
        const titleKey = tooltipTriggerEl.getAttribute('data-bs-title');
        const translatedTitle = getTranslation(titleKey);

        // Inicializamos el tooltip de Bootstrap
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            title: translatedTitle,
            trigger: 'hover'
        });
    });
}

/**
 * Función que se ejecuta cuando la IA termina de analizar el vídeo.
 * Traduce los datos técnicos a algo que el usuario pueda leer fácilmente.
 */
function handlePlyoAnalysisResults() {
    // Obtenemos los resultados del "motor de IA" (videoProcessor)
    const results = videoProcessor.getAnalysisResults();

    // Si no detectamos nada, avisamos al usuario
    if (!results || !results.detected) {
        alert('No se detectaron saltos en el vídeo. Asegúrate de que se vea el cuerpo completo saltando.');
        return;
    }

    // Elegimos un color para la etiqueta según el tipo de salto detectado
    const resultBox = document.getElementById('plyoResultBox');
    if (resultBox) {
        // Colores según el tipo de salto (Azul para SJ, Verde para CMJ, Amarillo para Pogo)
        const jumpTypeBadge = results.jumpType === 'Squat Jump' ? 'primary' :
            results.jumpType === 'Countermovement Jump' ? 'success' :
                results.jumpType === 'Pogo Jump' ? 'warning' : 'info';

        // Construimos el cuadro de resultados con HTML
        resultBox.innerHTML = `
            <div class="glass-card">
                <h5 class="mb-3">
                    <ion-icon name="analytics-outline" class="me-2"></ion-icon>
                    Resultados del Análisis IA
                </h5>
                <div class="mb-3">
                    <span class="badge bg-${jumpTypeBadge} fs-6">${results.jumpType}</span>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 border rounded border-success" style="--bs-bg-opacity: .05; background-color: var(--bs-success-bg-subtle);">
                            <small class="text-secondary d-block">Altura del Salto</small>
                            <h3 class="text-success mb-0">${results.jumpHeight.toFixed(1)} cm</h3>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 border rounded border-info" style="--bs-bg-opacity: .05; background-color: var(--bs-info-bg-subtle);">
                            <small class="text-secondary d-block">Tiempo de Vuelo</small>
                            <h3 class="text-info mb-0">${results.flightTime.toFixed(0)} ms</h3>
                        </div>
                    </div>
                </div>
                <!-- Botón útil para pasar los datos de la IA a las calculadoras básicas -->
                <button class="btn btn-primary w-100 mt-3" onclick="autofillJumpCalculators(${results.jumpHeight}, ${results.flightTime})">
                    <ion-icon name="flash-outline" class="me-2"></ion-icon>
                    Rellenar Calculadoras con estos datos
                </button>
            </div>
        `;
    }
}

/**
 * Función para pasar los datos detectados por la IA directamente a los cuadros de texto.
 * ¡Así el usuario no tiene que escribir los números a mano!
 */
function autofillJumpCalculators(jumpHeight, flightTime) {
    const flightTimeInput = document.getElementById('inputFlightTime');
    if (flightTimeInput) {
        // Convertimos milisegundos a segundos (Ej: 500ms -> 0.500s)
        flightTimeInput.value = (flightTime / 1000).toFixed(3);
        // Hacemos que el botón de calcular se pulse solo
        document.getElementById('btnCalcJump')?.click();
    }

    // Cambiamos a la primera pestaña para ver el resultado aplicado
    const basicTab = document.getElementById('plyo-basic-tab');
    if (basicTab) {
        basicTab.click();
    }

    // Mensaje de éxito en el idioma actual
    const currentLang = localStorage.getItem('adminLang') || 'es';
    const messages = {
        es: '✅ Calculadoras rellenadas automáticamente con datos del análisis',
        ca: '✅ Calculadores omplerts automàticament amb dades de l\'anàlisi',
        en: '✅ Calculators auto-filled with analysis data'
    };
    alert(messages[currentLang] || messages.en);
}

/**
 * Inicializa los botones de las calculadoras manuales.
 * Aquí definimos qué fórmulas matemáticas usar.
 */
function initPlyoCalculators() {

    // --- 1. Calculadora de Altura (Basada en tiempo de vuelo) ---
    const btnCalcJump = document.getElementById('btnCalcJump');
    if (btnCalcJump) {
        btnCalcJump.addEventListener('click', () => {
            const flightTime = parseFloat(document.getElementById('inputFlightTime').value);
            if (!flightTime) {
                alert('Introduce el tiempo de vuelo en segundos.');
                return;
            }
            // Fórmula física: Altura = (Gravedad * Tiempo^2) / 8

            const gravity = 9.81;
            const heightMeters = (gravity * Math.pow(flightTime, 2)) / 8;
            const heightCm = (heightMeters * 100).toFixed(1);
            document.getElementById('resJumpHeight').textContent = `${heightCm} cm`;
        });
    }

    // --- 2. Calculadora de RSI (Reactividad / "Muelle") ---
    const btnCalcRsi = document.getElementById('btnCalcRsi');
    if (btnCalcRsi) {
        btnCalcRsi.addEventListener('click', () => {
            const dropHeight = parseFloat(document.getElementById('inputDropHeight').value); // cm
            const gct = parseFloat(document.getElementById('inputGct').value); // ms

            if (!dropHeight || !gct) {
                alert('Introduce la altura de caída y el tiempo de contacto.');
                return;
            }

            // RSI Simplificado: Altura de caída (m) / Tiempo de contacto (s)
            // Es una forma de medir qué tan rápido reaccionas al caer.
            const rsi = (dropHeight / 100) / (gct / 1000);
            document.getElementById('resRsi').textContent = rsi.toFixed(2);
        });
    }

    // --- 4. Índice de Utilización Elástica (EUI) ---
    // Muestra qué tanta ventaja sacas de usar el estiramiento de tus músculos (CMJ vs SJ).
    const btnCalcEui = document.getElementById('btnCalcEui');
    if (btnCalcEui) {
        btnCalcEui.addEventListener('click', () => {
            const cmj = parseFloat(document.getElementById('inputEuiCmj').value); // Salto con impulso
            const sj = parseFloat(document.getElementById('inputEuiSj').value);   // Salto sin impulso

            if (!cmj || !sj) return;

            // Fórmula: ((Salto con impulso - Salto seco) / Salto seco) * 100
            const eui = ((cmj - sj) / sj) * 100;
            const resEl = document.getElementById('resEui');
            const feedbackEl = document.getElementById('feedbackEui');

            resEl.textContent = `${eui.toFixed(1)} %`;
            feedbackEl.className = "alert mt-2 d-flex align-items-center";

            // El rango ideal suele estar entre 15% y 30%
            if (eui >= 15 && eui <= 30) {
                resEl.className = "text-success fw-bold";
                feedbackEl.className += " alert-success";
                feedbackEl.innerHTML = '<ion-icon name="checkmark-circle" class="me-2 fs-5"></ion-icon> <div><strong>Óptimo</strong><br>Tienes una excelente capacidad elástica.</div>';
            } else {
                resEl.className = "text-warning fw-bold";
                feedbackEl.className += " alert-warning";
                if (eui < 15) {
                    feedbackEl.innerHTML = '<ion-icon name="alert-circle" class="me-2 fs-5"></ion-icon> <div><strong>Bajo (<15%)</strong><br>Necesitas mejorar tu pliometría.</div>';
                } else {
                    feedbackEl.innerHTML = '<ion-icon name="warning" class="me-2 fs-5"></ion-icon> <div><strong>Muy Alto (>30%)</strong><br>Posible fatiga o dependencia excesiva del "rebote".</div>';
                }
            }
        });
    }

    // --- 5. Índice de Coordinación (UCCI) ---
    // Mide cuánto te ayudan tus brazos al saltar (Abalakov vs CMJ).
    const btnCalcUcci = document.getElementById('btnCalcUcci');
    if (btnCalcUcci) {
        btnCalcUcci.addEventListener('click', () => {
            const abk = parseFloat(document.getElementById('inputUcciAbk').value); // Salto con brazos
            const cmj = parseFloat(document.getElementById('inputUcciCmj').value); // Salto sin brazos

            if (!abk || !cmj) return;

            // Fórmula: ((Con brazos - Sin brazos) / Sin brazos) * 100
            const ucci = ((abk - cmj) / cmj) * 100;
            const resEl = document.getElementById('resUcci');
            const feedbackEl = document.getElementById('feedbackUcci');

            resEl.textContent = `${ucci.toFixed(1)} %`;
            feedbackEl.className = "alert mt-2 d-flex align-items-center";

            // El rango ideal suele estar entre 10% y 20%
            if (ucci >= 10 && ucci <= 20) {
                resEl.className = "text-success fw-bold";
                feedbackEl.className += " alert-success";
                feedbackEl.innerHTML = '<ion-icon name="checkmark-circle" class="me-2 fs-5"></ion-icon> <div><strong>Óptimo</strong><br>Buena coordinación con los brazos.</div>';
            } else {
                resEl.className = "text-warning fw-bold";
                feedbackEl.className += " alert-warning";
                if (ucci < 10) {
                    feedbackEl.innerHTML = '<ion-icon name="alert-circle" class="me-2 fs-5"></ion-icon> <div><strong>Bajo (<10%)</strong><br>¡Mueve más fuerte esos brazos hacia arriba!</div>';
                } else {
                    feedbackEl.innerHTML = '<ion-icon name="warning" class="me-2 fs-5"></ion-icon> <div><strong>Muy Alto (>20%)</strong><br>Dependes demasiado de los brazos.</div>';
                }
            }
        });
    }
}
