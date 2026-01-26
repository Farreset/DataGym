
// Common Shared Logic (Sidebar, I18n, Utilities)

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
    initializeLanguage();
});

// --- Sidebar Injection ---
function injectSidebar() {
    // Check if sidebar already exists (in case it is hardcoded)
    if (document.querySelector('.sidebar')) return;

    // Get current path for active state
    let path = window.location.pathname;

    const sidebarHtml = `
    <nav class="sidebar">
        <div class="brand">
            <ion-icon name="analytics"></ion-icon>
            <span>DataGym</span>
        </div>

        <div class="nav flex-column">
             <a href="../../" class="nav-link ${(path === '/' || path.includes('index.html')) ? 'active' : ''}">
                <ion-icon name="home-outline"></ion-icon>
                <span data-i18n="nav_dashboard">Dashboard</span>
            </a>
            <a href="../html/swimming" class="nav-link ${path.includes('swimming') ? 'active' : ''}">
                <ion-icon name="water-outline"></ion-icon>
                <span data-i18n="nav_swimming">Swimming</span>
            </a>
            <a href="../html/running" class="nav-link ${path.includes('running') ? 'active' : ''}">
                <ion-icon name="walk-outline"></ion-icon>
                <span data-i18n="nav_running">Running</span>
            </a>
            <a href="../html/plyometrics" class="nav-link ${path.includes('plyometrics') ? 'active' : ''}">
                <ion-icon name="fitness-outline"></ion-icon>
                <span data-i18n="nav_plyometrics">Plyometrics</span>
            </a>
             <a href="../html/gym" class="nav-link ${path.includes('gym') ? 'active' : ''}">
                <ion-icon name="barbell-outline"></ion-icon>
                <span data-i18n="nav_gym">Gym</span>
            </a>
            
            <div class="mt-4 px-3" id="toolsSection">
                <h6 class="text-secondary small text-uppercase" data-i18n="nav_tools">Tools</h6>
                <!-- Dynamic tools injected here based on page -->
            </div>
        </div>

        <div class="mt-auto">
            <div class="mb-3 px-3">
                <label class="form-label text-secondary small" data-i18n="language">Language</label>
                <select class="form-select form-select-sm" id="langSelect">
                    <option value="es">Español</option>
                    <option value="ca">Català</option>
                    <option value="en">English</option>
                </select>
            </div>
            <a href="#" class="nav-link">
                <ion-icon name="settings-outline"></ion-icon>
                <span data-i18n="nav_settings">Settings</span>
            </a>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

    // Re-attach event listeners for language selector since it was just injected
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
        // Set initial value
        const savedLang = localStorage.getItem('adminLang') || 'es';
        langSelect.value = savedLang;
    }
}


// --- Internationalization (i18n) ---
const translations = {
    es: {
        nav_dashboard: "Inicio",
        nav_swimming: "Natación",
        nav_running: "Running",
        nav_plyometrics: "Pliometría",
        nav_gym: "Gimnasio",
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
        run_mock_imp: "Se identifica un ligero overstriding (zancada excesiva).",
        nav_tools: "Herramientas",
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
        alert_vam_format: "Por favor, introduce la VAM en formato MM:SS",
        gym_title: "Ejercicios de Gimnasio",
        gym_subtitle: "Calculadora y herramientas para ejercicios de gimnasio",
        gym_feature_text: "Este módulo contará con una biblioteca de ejercicios y constructor de rutinas.",

        // --- PROPER KEYS FOR NEW MODULES (ES) ---
        // Plyometrics
        // Plyometrics
        tab_plyo_basic: "Métricas Básicas",
        tab_plyo_indices: "Índices Avanzados",
        label_flight_time: "Tiempo de Vuelo (ms)",
        label_drop_height: "Altura Caída (cm)",
        label_gct: "Tiempo Contacto (ms)",
        label_contacts: "Contactos Totales",
        label_intensity: "Nivel Intensidad (1-10)",
        btn_calc_jump: "Calcular Altura y RSI",
        btn_calc_plyo_load: "Calcular Carga",
        res_jump_height: "Altura Salto",
        res_rsi: "RSI (Índice)",
        res_plyo_load: "Carga Sesión",
        res_eui: "Índice Utilización Elástica (EUI)",
        res_ucci: "Índice Coordinación (UCCI)",
        label_cmj: "CMJ (cm)",
        label_sj: "SJ (cm)",
        label_abk: "Abalakov (cm)",
        btn_calc_eui: "Calcular EUI",
        btn_calc_ucci: "Calcular UCCI",
        feedback_optimal: "¡Rango Óptimo!",
        feedback_improve_elastic: "Mejorar Capacidad Elástica (Pliometría)",
        feedback_improve_coord: "Mejorar Coordinación (Brazos)",

        // Gym
        tab_rm: "Calc. RM",
        tab_bmi: "IMC y Métricas",
        tab_w5: "Carga Semanal",
        label_weight: "Peso (kg)",
        label_reps: "Repeticiones",
        label_height: "Altura (cm)",
        label_5rm: "Estimación 5RM",
        btn_calc_rm: "Calcular 1RM",
        btn_calc_bmi: "Calcular IMC",
        btn_calc_w5: "Calcular Carga",
        res_1rm: "1RM Estimado",
        res_bmi: "Tu IMC",
        res_w5: "Carga Total",

        // Running
        tab_pace: "Ritmo y PPM",
        label_pace: "Ritmo (min/km)",
        label_cadence: "Cadencia (ppm)",
        label_stride: "Longitud Zancada (m)",
        btn_convert: "Convertir",
        btn_calc_speed: "Calcular Velocidad",
        res_speed: "Velocidad",
        res_pace_mile: "Ritmo (min/milla)",

        // Swimming
        label_css: "Velocidad Crítica de Natación (MM:SS)",
        btn_calc_zones_swim: "Calcular Zonas CSS",
        exercise_label: "Tipo de Ejercicio",
        squat: "Sentadilla",
        deadlift: "Peso Muerto",
        bench: "Press banca",
        ohp: "Press de hombros",
        total_load: "Carga Total",
        w5_load: "Calculo Potencia",

    },
    ca: {
        nav_dashboard: "Inici",
        nav_swimming: "Natació",
        nav_running: "Running",
        nav_plyometrics: "Pliometria",
        nav_gym: "Gimnàs",
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
        strengths: "Punts Forts",
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
        run_mock_imp: "S'identifica una lleugera gambada excessiva.",
        nav_tools: "Eines",
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
        alert_vam_format: "Si us plau, introdueix la VAM en format MM:SS",
        gym_title: "Exercicis de Gimnàs",
        gym_subtitle: "Calculadora i eines per exercicis de gimnàs",
        gym_feature_text: "Aquest mòdul comptarà amb una biblioteca d'exercicis i constructor de rutines.",

        // --- NEW KEYS (CA) ---
        // Plyometrics
        // Plyometrics
        tab_plyo_basic: "Mètriques Bàsiques",
        tab_plyo_indices: "Índexs Avançats",
        label_flight_time: "Temps de Vol (ms)",
        label_drop_height: "Alçada Caiguda (cm)",
        label_gct: "Temps Contacte (ms)",
        label_contacts: "Contactes Totals",
        label_intensity: "Nivell Intensitat (1-10)",
        btn_calc_jump: "Calcular Alçada i RSI",
        btn_calc_plyo_load: "Calcular Càrrega",
        res_jump_height: "Alçada Salt",
        res_rsi: "RSI (Índex)",
        res_plyo_load: "Càrrega Sessió",

        // Gym
        tab_rm: "Calc. RM",
        tab_bmi: "IMC i Mètriques",
        tab_w5: "Càrrega Setmanal",
        label_weight: "Pes (kg)",
        label_reps: "Repeticions",
        label_height: "Alçada (cm)",
        label_5rm: "Estimació 5RM",
        btn_calc_rm: "Calcular 1RM",
        btn_calc_bmi: "Calcular IMC",
        btn_calc_w5: "Calcular Càrrega",
        res_1rm: "1RM Estimat",
        res_bmi: "El teu IMC",
        res_w5: "Càrrega Total",

        // Running
        tab_pace: "Ritme i PPM",
        label_pace: "Ritme (min/km)",
        label_cadence: "Cadència (ppm)",
        label_stride: "Longitud Gambada (m)",
        btn_convert: "Convertir",
        btn_calc_speed: "Calcular Velocitat",
        res_speed: "Velocitat",
        res_pace_mile: "Ritme (min/milla)",

        // Swimming
        label_css: "Velocitat Crítica de Natació (MM:SS)",
        btn_calc_zones_swim: "Calcular Zones CSS",
        exercise_label: "Tipus d'Exercici",
        squat: "Sentadilla",
        deadlift: "Peso Muerto",
        bench: "Press banca",
        ohp: "Press de hombros",
        total_load: "Càrrega Total",
        w5_load: "Calcul de potencia",


    },
    en: {
        nav_dashboard: "Dashboard",
        nav_swimming: "Swimming",
        nav_running: "Running",
        nav_plyometrics: "Plyometrics",
        nav_gym: "Gym",
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
        alert_vam_format: "Please enter VAM in MM:SS format",
        gym_title: "Gym Exercises",
        gym_subtitle: "Calculator and tools for gym exercises",
        gym_feature_text: "This module will feature an exercise library and routine builder.",

        // --- NEW KEYS (EN) ---
        // Plyometrics
        // Plyometrics
        tab_plyo_basic: "Basic Metrics",
        tab_plyo_indices: "Advanced Indices",
        label_flight_time: "Flight Time (ms)",
        label_drop_height: "Drop Height (cm)",
        label_gct: "Contact Time (ms)",
        label_contacts: "Total Contacts",
        label_intensity: "Intensity Level (1-10)",
        btn_calc_jump: "Calculate Jump & RSI",
        btn_calc_plyo_load: "Calculate Load",
        res_jump_height: "Jump Height",
        res_rsi: "RSI (Index)",
        res_plyo_load: "Session Load",

        // Gym
        tab_rm: "RM Calc",
        tab_bmi: "BMI & Metrics",
        tab_w5: "Weekly Load",
        label_weight: "Weight (kg)",
        label_reps: "Reps",
        label_height: "Height (cm)",
        label_5rm: "5RM Estimate",
        btn_calc_rm: "Calculate 1RM",
        btn_calc_bmi: "Calculate BMI",
        btn_calc_w5: "Calculate Load",
        res_1rm: "Estimated 1RM",
        res_bmi: "Your BMI",
        res_w5: "Total Load",

        // Running
        tab_pace: "Pace & PPM",
        label_pace: "Pace (min/km)",
        label_cadence: "Cadence (spm)",
        label_stride: "Stride Length (m)",
        btn_convert: "Convert",
        btn_calc_speed: "Calculate Speed",
        res_speed: "Speed",
        res_pace_mile: "Pace (min/mile)",

        // Swimming
        label_css: "Critical Swim Speed Pace (MM:SS)",
        btn_calc_zones_swim: "Calculate CSS Zones",
        exercise_label: "Exercise Type",
        squat: "Squat",
        deadlift: "Deadlift",
        bench: "Bench Press",
        ohp: "Overhead Press",
        total_load: "Total Load",
        w5_load: "Power Calc",

    }
};

function initializeLanguage() {
    // Initialize Language (Default: Spanish)
    const savedLang = localStorage.getItem('adminLang') || 'es';
    setLanguage(savedLang);
}

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
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    // Save to LocalStorage
    localStorage.setItem('adminLang', lang);
}

// --- Shared Utilities ---

// Helper: Parse MM:SS.ms or SS.ms to total seconds
function parseTime(timeStr) {
    let parts = timeStr.split(':');
    let seconds = 0;

    if (parts.length === 2) {
        // MM:SS
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1].replace(',', '.'));
    } else {
        // SS only
        seconds = parseFloat(parts[0].replace(',', '.'));
    }
    return seconds;
}

// Helper: Format seconds to MM:SS.ms
function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = (totalSeconds % 60).toFixed(2);
    // Handle Nan
    if (isNaN(m) || isNaN(s)) return "00:00";
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Generic File Upload Logic Factory
function setupFileUpload(config) {
    const dropZone = document.getElementById(config.zoneId);
    const fileInput = document.getElementById(config.inputId);
    const selectButton = document.getElementById(config.btnId);
    const resultBox = document.getElementById(config.resultBoxId);
    const mockOutputId = config.mockId;


    if (dropZone && fileInput && selectButton) {
        selectButton.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files, dropZone, resultBox, mockOutputId, config);
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
            handleFiles(e.dataTransfer.files, dropZone, resultBox, mockOutputId, config);
        });
    }
}

async function handleFiles(files, dropZone, resultBox, mockOutputId, config) {
    if (files.length > 0) {
        const file = files[0];

        // 1. Visual Feedback - Uploaded
        const dropZoneH4 = dropZone.querySelector('h4');
        const dropZoneP = dropZone.querySelector('p');
        if (dropZoneH4) dropZoneH4.textContent = `Seleccionado: ${file.name}`;
        if (dropZoneP) dropZoneP.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        // 2. Validate Video
        if (dropZoneP) dropZoneP.textContent += " - Validando...";

        // Assuming videoProcessor is globally available (loaded in HTML)
        if (typeof videoProcessor !== 'undefined') {
            const expectedModule = config.module || 'unknown';
            const validationResult = await videoProcessor.validateVideo(file, expectedModule);

            if (validationResult.isValid) {
                if (dropZoneP) dropZoneP.innerHTML = `${(file.size / (1024 * 1024)).toFixed(2)} MB <br> <span class="text-success"><ion-icon name="checkmark-circle"></ion-icon> Detección válida de ${expectedModule}</span>`;

                // 3. Prepare Analysis (Unlock "Analyze" button ONLY if valid)
                const analyzeBtn = document.getElementById(config.analyzeBtnId);
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    // Remove old listeners to prevent stacking
                    const newBtn = analyzeBtn.cloneNode(true);
                    analyzeBtn.parentNode.replaceChild(newBtn, analyzeBtn);

                    newBtn.addEventListener('click', () => {
                        startAnalysis(file, resultBox, mockOutputId, config);
                    });
                }
            } else {
                if (dropZoneP) dropZoneP.innerHTML = `${(file.size / (1024 * 1024)).toFixed(2)} MB <br> <span class="text-danger"><ion-icon name="alert-circle"></ion-icon> ${validationResult.error}</span>`;
                // Ensure button remains disabled
                const analyzeBtn = document.getElementById(config.analyzeBtnId);
                if (analyzeBtn) analyzeBtn.disabled = true;
            }
        }
    }
}

const analysisControllers = new Map(); // Store abort controllers or state by config ID

function startAnalysis(file, resultBox, mockOutputId, config) {
    const analyzeBtn = document.getElementById(config.analyzeBtnId);

    // 1. Check if we are in "Reset" mode
    if (analyzeBtn.dataset.state === 'reset') {
        // RESET Logic
        videoProcessor.reset(); // Stop video, clear canvas, reset modules

        // Hide Results
        const videoEl = document.getElementById(config.videoId);
        const canvasEl = document.getElementById(config.canvasId);
        videoEl.classList.add('d-none');
        canvasEl.classList.add('d-none');

        if (resultBox) {
            resultBox.classList.remove('d-none'); // Show box again
            const mockPrompt = resultBox.querySelector('.text-secondary.fst-italic');
            if (mockPrompt) mockPrompt.classList.remove('d-none');

            const mockResult = document.getElementById(mockOutputId);
            if (mockResult) mockResult.classList.add('d-none');
        }

        // Hide Headers
        const gymTitle = document.getElementById('gymResultTitle');
        if (gymTitle) gymTitle.classList.add('d-none');
        const runTitle = document.getElementById('runResultTitle');
        if (runTitle) runTitle.classList.add('d-none');

        // Reset Button to "Analyze" state
        analyzeBtn.innerHTML = '<ion-icon name="sparkles" class="me-2"></ion-icon><span data-i18n="btn_analyze">Analyze with AI</span>';
        analyzeBtn.classList.remove('btn-outline-danger');
        analyzeBtn.classList.add('btn-primary');
        analyzeBtn.dataset.state = 'analyze';

        // Clear file input
        return;
    }

    // 2. ANALYZE Logic (Start)

    // Hide the ENTIRE result box initially (User Request)
    if (resultBox) {
        resultBox.classList.add('d-none');
    }

    // Load Video
    const videoEl = document.getElementById(config.videoId);
    const canvasEl = document.getElementById(config.canvasId);

    const url = URL.createObjectURL(file);
    videoEl.crossOrigin = 'anonymous';
    videoEl.src = url;
    videoEl.classList.remove('d-none');
    canvasEl.classList.remove('d-none');

    // Switch Button to "Reset" state
    analyzeBtn.innerHTML = '<ion-icon name="refresh" class="me-2"></ion-icon><span data-i18n="btn_reset">Reiniciar Parámetros</span>';
    analyzeBtn.classList.remove('btn-primary');
    analyzeBtn.classList.add('btn-outline-danger');
    analyzeBtn.dataset.state = 'reset';

    // Hide Header Initially (Generic check for gym/run headers)
    const gymTitle = document.getElementById('gymResultTitle');
    if (gymTitle) gymTitle.classList.add('d-none');
    const runTitle = document.getElementById('runResultTitle');
    if (runTitle) runTitle.classList.add('d-none');

    // Setup MediaPipe
    videoProcessor.setupAnalysis(videoEl, canvasEl, config.module);

    // RESTRICT CONTROLS: Remove native controls to prevent seeking
    videoEl.removeAttribute('controls');

    // Custom Play/Pause on click
    videoEl.onclick = () => {
        if (videoEl.paused) {
            videoEl.play();
        } else {
            videoEl.pause();
        }
    };

    // Listen for video end
    videoEl.onended = () => {
        // Disable click to prevent replay - User must use Reset button
        videoEl.onclick = null;

        if (config.onAnalysisComplete && typeof config.onAnalysisComplete === 'function') {
            setTimeout(() => {
                // Show Header
                if (gymTitle) gymTitle.classList.remove('d-none');
                if (runTitle) runTitle.classList.remove('d-none');

                // Show Result Box Container
                if (resultBox) resultBox.classList.remove('d-none');

                // Show Results ONLY now
                config.onAnalysisComplete();
            }, 500);
        }
    };

    // Auto-play
    videoEl.play();
}
