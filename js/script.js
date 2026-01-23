document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const modules = document.querySelectorAll('.module-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Hide all modules
            modules.forEach(m => m.classList.add('d-none'));

            // Show target module
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('d-none');
        });
    });

    // --- Running Module Logic ---

    // Zone Configuration Modal Logic
    const zoneConfigModal = new bootstrap.Modal(document.getElementById('zoneConfigModal'));
    const btnOpenZoneConfig = document.getElementById('btnOpenZoneConfig');
    const btnSaveZones = document.getElementById('btnSaveZones');

    // Default Zones
    const defaultZones = {
        z1: { min: 50, max: 60 },
        z2: { min: 60, max: 70 },
        z3: { min: 70, max: 80 },
        z4: { min: 80, max: 90 },
        z5: { min: 90, max: 100 }
    };

    // Load Zones from Storage
    function loadZones() {
        const saved = JSON.parse(localStorage.getItem('runningZones')) || defaultZones;
        document.getElementById('z1_min').value = saved.z1.min; document.getElementById('z1_max').value = saved.z1.max;
        document.getElementById('z2_min').value = saved.z2.min; document.getElementById('z2_max').value = saved.z2.max;
        document.getElementById('z3_min').value = saved.z3.min; document.getElementById('z3_max').value = saved.z3.max;
        document.getElementById('z4_min').value = saved.z4.min; document.getElementById('z4_max').value = saved.z4.max;
        document.getElementById('z5_min').value = saved.z5.min; document.getElementById('z5_max').value = saved.z5.max;
        return saved;
    }

    if (btnOpenZoneConfig) {
        btnOpenZoneConfig.addEventListener('click', (e) => {
            e.preventDefault();
            loadZones();
            zoneConfigModal.show();
        });
    }

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
            if (document.getElementById('inputVam').value) {
                document.getElementById('btnCalcZones').click();
            }
        });
    }

    // VAM Calculator Logic
    const btnCalcZones = document.getElementById('btnCalcZones');
    if (btnCalcZones) {
        btnCalcZones.addEventListener('click', () => {
            const vamStr = document.getElementById('inputVam').value;
            if (!vamStr.includes(':')) {
                // Use current language for alert
                const currentLang = localStorage.getItem('adminLang') || 'es';
                const t = translations[currentLang] || translations.es;
                alert(t.alert_vam_format || 'Please enter VAM in MM:SS format');
                return;
            }

            const vamSeconds = parseTime(vamStr);
            if (!vamSeconds) return;

            // Speed in m/s (1000m / seconds)
            // Actually, usually users input Pace (min/km). Let's assume input is PACE (Time per 1km).
            // So VAM Pace = X min/km. Higher % means FASTER, so LOWER pace time.
            // Wait, standard Zone calculation: 
            // VAM Speed (km/h) = 3600 / SecondsPerKm
            // Zone Speed = VAM Speed * (Percentage / 100)
            // Zone Pace (sec/km) = 3600 / Zone Speed

            const speedVamKmh = 3600 / vamSeconds;
            const zones = loadZones();

            let html = '';

            const zonesList = ['z1', 'z2', 'z3', 'z4', 'z5'];
            const colors = ['info', 'success', 'warning', 'orange', 'danger'];
            const currentLang = localStorage.getItem('adminLang') || 'es';
            const t = translations[currentLang] || translations.es;
            const labels = [t.zone_1_label, t.zone_2_label, t.zone_3_label, t.zone_4_label, t.zone_5_label];

            zonesList.forEach((z, index) => {
                const minPct = zones[z].min;
                const maxPct = zones[z].max;

                // Calc Speed for Range
                const speedMin = speedVamKmh * (minPct / 100);
                const speedMax = speedVamKmh * (maxPct / 100);

                // Calc Pace (sec/km) - Note: Higher speed = Lower Pace time, so swap min/max for pace display
                const paceMaxSeconds = 3600 / speedMin; // Slower end (lower %), higher pace number
                const paceMinSeconds = 3600 / speedMax; // Faster end (higher %), lower pace number

                const paceStr = `${formatTime(paceMinSeconds).slice(0, 5)} - ${formatTime(paceMaxSeconds).slice(0, 5)}`;

                html += `
                    <div class="p-3 border rounded border-${colors[index]} bg-${colors[index]}-subtle mb-1" style="--bs-bg-opacity: .1;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0 text-${colors[index] === 'orange' ? 'body' : colors[index]} fw-bold" style="${colors[index] === 'orange' ? 'color:#fd7e14' : ''}">${labels[index]}</h6>
                                <small class="text-secondary">${minPct}% - ${maxPct}% VAM</small>
                            </div>
                            <h4 class="mb-0 font-monospace">${paceStr} <small class="fs-6 text-secondary">/km</small></h4>
                        </div>
                    </div>
                `;
            });

            document.getElementById('zonesResult').innerHTML = html;
        });
    }

    // Swimming Calculator Logic
    const calcForm = document.getElementById('swimCalcForm');

    if (calcForm) {
        // Direct Calculation: Distance + Time -> Pace
        const btnCalculatePace = document.getElementById('btnCalculatePace');

        if (btnCalculatePace) {
            btnCalculatePace.addEventListener('click', () => {
                const distance = parseFloat(document.getElementById('calcDist').value);
                const timeStr = document.getElementById('calcTime').value; // MM:SS.ms

                if (!distance || !timeStr) {
                    // Use current language for alert
                    const currentLang = localStorage.getItem('adminLang') || 'es';
                    const t = translations[currentLang] || translations.es;
                    alert(t.alert_enter_values || 'Please enter distance and time');
                    return;
                }

                const totalSeconds = parseTime(timeStr);
                const pacePer100 = (totalSeconds / distance) * 100;

                document.getElementById('resultPace').textContent = formatTime(pacePer100) + '/100m';
            });
        }

        // Project Time: Pace + New Distance -> New Time
        const btnPredict = document.getElementById('btnPredict');

        if (btnPredict) {
            btnPredict.addEventListener('click', () => {
                const targetDist = parseFloat(document.getElementById('targetDist').value);
                // Get pace from previous Calc or input (mocking simple flow here)
                // For simplicity, re-calculating from inputs
                const baseDist = parseFloat(document.getElementById('calcDist').value);
                const baseTime = document.getElementById('calcTime').value;

                if (!targetDist || !baseDist || !baseTime) {
                    alert('Please fill out base distance, time and target distance');
                    // Use current language for alert
                    const currentLang = localStorage.getItem('adminLang') || 'es';
                    const t = translations[currentLang] || translations.es;
                    alert(t.alert_fill_fields || 'Please fill out base distance, time and target distance');
                    return;
                }

                const totalSeconds = parseTime(baseTime);
                const pacePerMeter = totalSeconds / baseDist;
                const predictedSeconds = pacePerMeter * targetDist;

                document.getElementById('resultTime').textContent = formatTime(predictedSeconds);
            });
        }
    }

    // --- Internationalization (i18n) ---
    const translations = {
        es: {
            nav_swimming: "Natación",
            nav_running: "Running",
            nav_plyometrics: "Pliometría",
            nav_settings: "Ajustes",
            language: "Idioma",
            swim_title: "Análisis de Natación",
            swim_subtitle: "Cálculos de rendimiento y análisis técnico con IA",
            tab_calculator: "Calculadora de Tiempo",
            tab_ai: "Analizador IA",
            data_input: "Entrada de Datos",
            distance_label: "Distancia (metros)",
            time_label: "Tiempo (MM:SS.ms)",
            btn_calc_pace: "Calcular Ritmo",
            projection_title: "Proyección",
            target_dist_label: "Distancia Objetivo (metros)",
            btn_predict: "Predecir Tiempo",
            result_pace_label: "Ritmo Calculado (por 100m)",
            result_proj_time_label: "Tiempo Proyectado",
            video_upload_title: "Subir Vídeo",
            drop_video_text: "Arrastra tu vídeo aquí",
            video_formats: "Soporta MP4, MOV, WEBM (Máx 50MB)",
            btn_select_file: "Seleccionar Archivo",
            ai_result_title: "Resultado Análisis IA",
            ai_waiting_text: "Sube un vídeo para ver el análisis...",
            context_title: "Contexto",
            stroke_label: "Estilo a Analizar",
            stroke_free: "Crol (Estilo Libre)",
            stroke_breast: "Braza",
            stroke_back: "Espalda",
            stroke_fly: "Mariposa",
            level_label: "Nivel del Nadador",
            level_beginner: "Principiante",
            level_inter: "Intermedio",
            level_pro: "Avanzado/Pro",
            angle_label: "Ángulo de Cámara",
            angle_side: "Lateral (Sobre agua)",
            angle_under: "Lateral (Subacuático)",
            angle_front: "Frontal",
            angle_drone: "Dron/Aéreo",
            btn_analyze: "Analizar con IA",
            run_title: "Análisis de Running",
            run_subtitle: "Mecánica de carrera y ritmo",
            run_feature_text: "Este módulo contará con cálculos de cadencia y análisis de marcha.",
            plyo_title: "Pliometría",
            plyo_subtitle: "Potencia explosiva y entrenamiento de salto",
            plyo_feature_text: "Este módulo contará con cálculo de altura de salto y tiempo de contacto.",
            under_construction: "Módulo en Construcción",
            strengths: "Puntos Fuertes",
            improvements: "Áreas de Mejora",
            alert_fill_fields: "Por favor, rellena la distancia base, el tiempo y la distancia objetivo.",
            alert_enter_values: "Por favor, introduce la distancia y el tiempo.",
            mock_strength_1: "Buena rotación corporal y ritmo de patada constante.",
            mock_improvement_1: "El codo cae durante la fase de agarre.",
            mock_improvement_2: "La posición de la cabeza es ligeramente alta, causando resistencia.",
            metrics_title: "Métricas Clave",
            metric_rate: "Frecuencia",
            metric_dps: "DPS",
            metric_index: "Índice Efist.",
            drills_title: "Ejercicios Recomendados",
            drill_1: "Ejercicio de Puños (Codo Alto)",
            drill_2: "Nado con Tubo (Posición Cabeza)",
            gender_label: "Género",
            gender_male: "Masculino",
            gender_female: "Femenino",
            pool_length_label: "Largo Piscina",
            pool_25m: "25m (Corta)",
            pool_50m: "50m (Larga)",
            pools_open: "Aguas Abiertas",
            run_mock_str: "El patrón de pisada de medio pie es sólido.",
            run_mock_imp: "Se identifica un ligero overstriding (zancada excesiva)."
        },
        ca: {
            nav_zone_config: "Config. Zonas",
            tab_zones: "Calculadora Zonas",
            run_calc_title: "Calculadora VAM",
            vam_label: "VAM (MM:SS / km)",
            vam_help: "Introduce tu Velocidad Aeróbica Máxima.",
            btn_calc_zones: "Calcular Zonas",
            zones_result_title: "Zonas de Entrenamiento",
            zones_waiting: "Introduce VAM para ver zonas.",
            surface_label: "Superficie",
            surface_track: "Pista",
            surface_road: "Asfalto",
            surface_trail: "Montaña",
            surface_treadmill: "Cinta",
            footwear_label: "Calzado",
            shoe_daily: "Entrenamiento",
            shoe_racing: "Competición/Carbono",
            shoe_minimal: "Minimalista",
            shoe_spikes: "Clavos",
            zone_config_title: "Configuración de Zonas",
            zone_config_desc: "Define Zonas como % del ritmo VAM.",
            btn_cancel: "Cancelar",
            btn_save: "Guardar Cambios",
            zone_1_label: "Zona 1 (Recuperación)",
            zone_2_label: "Zona 2 (Aeróbico)",
            zone_3_label: "Zona 3 (Ritmo)",
            zone_4_label: "Zona 4 (Umbral)",
            zone_5_label: "Zona 5 (VO2 Máx)",
            alert_vam_format: "Por favor, introduce la VAM en formato MM:SS"
        },
        ca: {
            nav_swimming: "Natació",
            nav_running: "Running",
            nav_plyometrics: "Pliometria",
            nav_settings: "Configuració",
            language: "Idioma",
            swim_title: "Anàlisi de Natació",
            swim_subtitle: "Càlculs de rendiment i anàlisi tècnic amb IA",
            tab_calculator: "Calculadora de Temps",
            tab_ai: "Analitzador IA",
            data_input: "Entrada de Dades",
            distance_label: "Distància (metres)",
            time_label: "Temps (MM:SS.ms)",
            btn_calc_pace: "Calcular Ritme",
            projection_title: "Projecció",
            target_dist_label: "Distància Objectiu (metres)",
            btn_predict: "Predir Temps",
            result_pace_label: "Ritme Calculat (per 100m)",
            result_proj_time_label: "Temps Projectat",
            video_upload_title: "Pujar Vídeo",
            drop_video_text: "Arrossega el teu vídeo aquí",
            video_formats: "Suporta MP4, MOV, WEBM (Màx 50MB)",
            btn_select_file: "Seleccionar Arxiu",
            ai_result_title: "Resultat Anàlisi IA",
            ai_waiting_text: "Puja un vídeo per veure l'anàlisi...",
            context_title: "Context",
            stroke_label: "Estil a Analitzar",
            stroke_free: "Crol (Estil Lliure)",
            stroke_breast: "Braça",
            stroke_back: "Esquena",
            stroke_fly: "Papallona",
            level_label: "Nivell del Nedaror",
            level_beginner: "Principiant",
            level_inter: "Intermedi",
            level_pro: "Avançat/Pro",
            angle_label: "Angle de Càmera",
            angle_side: "Lateral (Sobre aigua)",
            angle_under: "Lateral (Subaquàtic)",
            angle_front: "Frontal",
            angle_drone: "Dron/Aeri",
            btn_analyze: "Analitzar amb IA",
            run_title: "Anàlisi de Running",
            run_subtitle: "Mecànica de carrera i ritme",
            run_feature_text: "Aquest mòdul comptarà amb càlculs de cadència i anàlisi de marxa.",
            plyo_title: "Pliometria",
            plyo_subtitle: "Potència explosiva i entrenament de salt",
            plyo_feature_text: "Aquest mòdul comptarà amb càlcul d'altura de salt i temps de contacte.",
            under_construction: "Mòdul en Construcció",
            strengths: "Puntos Forts",
            improvements: "Àrees de Millora",
            alert_fill_fields: "Si us plau, omple la distància base, el temps i la distància objectiu.",
            alert_enter_values: "Si us plau, introdueix la distància i el temps.",
            mock_strength_1: "Bona rotació corporal i ritme de cames constant.",
            mock_improvement_1: "El colze cau durant la fase d'agafada.",
            mock_improvement_2: "La posició del cap és lleugerament alta, causant resistència.",
            metrics_title: "Mètriques Clau",
            metric_rate: "Freqüència",
            metric_dps: "DPS",
            metric_index: "Índex Efic.",
            drills_title: "Exercicis Recomanats",
            drill_1: "Exercici de Punys (Colze Alt)",
            drill_2: "Nedad amb Tub (Posició Cap)",
            gender_label: "Gènere",
            gender_male: "Masculí",
            gender_female: "Femení",
            pool_length_label: "Llarg Piscina",
            pool_25m: "25m (Curta)",
            pool_50m: "50m (Llarga)",
            pool_open: "Aigües Obertes",
            run_mock_str: "El patró de petjada de mig peu és sòlid.",
            run_mock_imp: "S'identifica una lleugera gambada excessiva."
        },
        en: {
            nav_zone_config: "Config. Zones",
            tab_zones: "Calculadora Zones",
            run_calc_title: "Calculadora VAM",
            vam_label: "VAM (MM:SS / km)",
            vam_help: "Introdueix la teva Velocitat Aeròbica Màxima.",
            btn_calc_zones: "Calcular Zones",
            zones_result_title: "Zones d'Entrenament",
            zones_waiting: "Introdueix VAM per veure zones.",
            surface_label: "Superfície",
            surface_track: "Pista",
            surface_road: "Asfalt",
            surface_trail: "Muntanya",
            surface_treadmill: "Cinta",
            footwear_label: "Calçat",
            shoe_daily: "Entrenament",
            shoe_racing: "Competició/Carboni",
            shoe_minimal: "Minimalista",
            shoe_spikes: "Claus",
            zone_config_title: "Configuració de Zones",
            zone_config_desc: "Defineix Zones com % del ritme VAM.",
            btn_cancel: "Cancel·lar",
            btn_save: "Guardar Canvis",
            zone_1_label: "Zona 1 (Recuperació)",
            zone_2_label: "Zona 2 (Aeròbic)",
            zone_3_label: "Zona 3 (Ritme)",
            zone_4_label: "Zona 4 (Llindar)",
            zone_5_label: "Zona 5 (VO2 Màx)",
            alert_vam_format: "Si us plau, introdueix la VAM en format MM:SS"
        },
        en: {
            nav_swimming: "Swimming",
            nav_running: "Running",
            nav_plyometrics: "Plyometrics",
            nav_settings: "Settings",
            language: "Language",
            swim_title: "Swimming Analysis",
            swim_subtitle: "Performance calculations and AI technique analysis",
            tab_calculator: "Time Calculator",
            tab_ai: "AI Analyzer",
            data_input: "Data Input",
            distance_label: "Distance (meters)",
            time_label: "Time (MM:SS.ms)",
            btn_calc_pace: "Calculate Pace",
            projection_title: "Projection",
            target_dist_label: "Target Distance (meters)",
            btn_predict: "Predict Time",
            result_pace_label: "Calculated Pace (per 100m)",
            result_proj_time_label: "Projected Time",
            video_upload_title: "Video Upload",
            drop_video_text: "Drop your video here",
            video_formats: "Supports MP4, MOV, WEBM (Max 50MB)",
            btn_select_file: "Select File",
            ai_result_title: "AI Analysis Result",
            ai_waiting_text: "Upload a video to see the analysis...",
            context_title: "Context",
            stroke_label: "Stroke to Analyze",
            stroke_free: "Front Crawl (Freestyle)",
            stroke_breast: "Breaststroke",
            stroke_back: "Backstroke",
            stroke_fly: "Butterfly",
            level_label: "Swimmer Level",
            level_beginner: "Beginner",
            level_inter: "Intermediate",
            level_pro: "Advanced/Pro",
            angle_label: "Camera Angle",
            angle_side: "Side View (Above Water)",
            angle_under: "Side View (Underwater)",
            angle_front: "Front View",
            angle_drone: "Drone/Overhead",
            btn_analyze: "Analyze with AI",
            run_title: "Running Analysis",
            run_subtitle: "Track mechanics and pace",
            run_feature_text: "This module will feature cadence calculations and gait analysis.",
            plyo_title: "Plyometrics",
            plyo_subtitle: "Explosive power and jump training",
            plyo_feature_text: "This module will feature jump height calculation and contact time analysis.",
            under_construction: "Module Under Construction",
            strengths: "Strengths",
            improvements: "Areas for Improvement",
            alert_fill_fields: "Please fill out base distance, time and target distance.",
            alert_enter_values: "Please enter distance and time.",
            mock_strength_1: "Good body rotation and consistent kick rhythm.",
            mock_improvement_1: "Elbow drop during the catch phase.",
            mock_improvement_2: "Head position is slightly too high, causing drag.",
            metrics_title: "Key Metrics",
            metric_rate: "Stroke Rate",
            metric_dps: "DPS",
            metric_index: "Eff. Index",
            drills_title: "Recommended Drills",
            drill_1: "Fist Drill (High Elbow)",
            drill_2: "Snorkel Swims (Head Position)",
            gender_label: "Gender",
            gender_male: "Male",
            gender_female: "Female",
            pool_length_label: "Pool Length",
            pool_25m: "25m (Short Course)",
            pool_50m: "50m (Long Course)",
            pool_open: "Open Water",
            run_mock_str: "Midfoot strike pattern is solid.",
            run_mock_imp: "Slight overstriding identified.",
            nav_tools: "Tools",
            nav_zone_config: "Zone Config.",
            tab_zones: "Zone Calculator",
            run_calc_title: "VAM Calculator",
            vam_label: "VAM (MM:SS / km)",
            vam_help: "Enter your Maximum Aerobic Speed pace.",
            btn_calc_zones: "Calculate Zones",
            zones_result_title: "Training Zones",
            zones_waiting: "Enter VAM to see zones.",
            surface_label: "Surface",
            surface_track: "Track",
            surface_road: "Road",
            surface_trail: "Trail",
            surface_treadmill: "Treadmill",
            footwear_label: "Footwear",
            shoe_daily: "Daily Trainer",
            shoe_racing: "Racing/Carbon",
            shoe_minimal: "Minimalist",
            shoe_spikes: "Track Spikes",
            zone_config_title: "Zone Configuration",
            zone_config_desc: "Define Training Zones as % of VAM Pace.",
            btn_cancel: "Cancel",
            btn_save: "Save Changes",
            zone_1_label: "Zone 1 (Recovery)",
            zone_2_label: "Zone 2 (Aerobic)",
            zone_3_label: "Zone 3 (Tempo)",
            zone_4_label: "Zone 4 (Threshold)",
            zone_5_label: "Zone 5 (VO2 Max)",
            alert_vam_format: "Please enter VAM in MM:SS format"
        }
    };

    const langSelect = document.getElementById('langSelect');

    function setLanguage(lang) {
        // Fallback to Spanish if key doesn't exist
        const t = translations[lang] || translations.es;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.innerText = t[key];
            }
        });

        // Update Selector Value
        if (langSelect) langSelect.value = lang;

        // Save to LocalStorage (optional)
        localStorage.setItem('adminLang', lang);
    }

    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }

    // Initialize Language (Default: Spanish)
    const savedLang = localStorage.getItem('adminLang') || 'es';
    setLanguage(savedLang);

});

// Helper: Parse MM:SS.ms or SS.ms to total seconds
function parseTime(timeStr) {
    let parts = timeStr.split(':');
    let seconds = 0;

    if (parts.length === 2) {
        // MM:SS
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else {
        // SS only
        seconds = parseFloat(parts[0]);
    }
    return seconds;
}

// Helper: Format seconds to MM:SS.ms
function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = (totalSeconds % 60).toFixed(2);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// File Upload Logic Factory
function setupFileUpload(config) {
    const dropZone = document.getElementById(config.zoneId);
    const fileInput = document.getElementById(config.inputId);
    const selectButton = document.getElementById(config.btnId);
    const resultBox = document.getElementById(config.resultBoxId);
    const mockOutputId = config.mockId;

    if (dropZone && fileInput && selectButton) {
        selectButton.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files, dropZone, resultBox, mockOutputId);
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#4361ee';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255,255,255,0.1)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255,255,255,0.1)';
            handleFiles(e.dataTransfer.files, dropZone, resultBox, mockOutputId);
        });
    }
}

function handleFiles(files, dropZone, resultBox, mockOutputId) {
    if (files.length > 0) {
        const file = files[0];
        // Visual feedback
        const dropZoneH4 = dropZone.querySelector('h4');
        const dropZoneP = dropZone.querySelector('p');

        if (dropZoneH4) dropZoneH4.textContent = `Selected: ${file.name}`;
        if (dropZoneP) dropZoneP.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        // Show mock analysis result
        const mockResult = document.getElementById(mockOutputId);
        const mockPrompt = resultBox ? resultBox.querySelector('.text-secondary.fst-italic') : null;

        if (mockResult) mockResult.classList.remove('d-none');
        if (mockPrompt) mockPrompt.classList.add('d-none');
    }
}

// Setup Uploads
setupFileUpload({
    zoneId: 'swimUploadArea',
    inputId: 'swimVideoInput',
    btnId: 'btnSwimSelectFile',
    resultBoxId: 'swimResultBox',
    mockId: 'aiOutputMock'
});

setupFileUpload({
    zoneId: 'runUploadArea',
    inputId: 'runVideoInput',
    btnId: 'btnRunSelectFile',
    resultBoxId: 'runResultBox',
    mockId: 'runAiOutputMock'
});
