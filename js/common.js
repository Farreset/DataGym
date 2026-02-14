
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
             <a href="/DataGym/index.html" class="nav-link ${(path === '/DataGym/' || path === '/DataGym/index.html' || path.endsWith('/DataGym')) ? 'active' : ''}">
                <ion-icon name="home-outline"></ion-icon>
                <span data-i18n="nav_dashboard">Dashboard</span>
            </a>
            
            <a href="/DataGym/html/running.html" class="nav-link ${path.includes('running') ? 'active' : ''}">
                <ion-icon name="walk-outline"></ion-icon>
                <span data-i18n="nav_running">Running</span>
            </a>
            <a href="/DataGym/html/swimming.html" class="nav-link ${path.includes('swimming') ? 'active' : ''}">
                <ion-icon name="water-outline"></ion-icon>
                <span data-i18n="nav_swimming">Swimming</span>
            </a>
            <a href="/DataGym/html/plyometrics.html" class="nav-link ${path.includes('plyometrics') ? 'active' : ''}">
                <ion-icon name="fitness-outline"></ion-icon>
                <span data-i18n="nav_plyometrics">Plyometrics</span>
            </a>
             <a href="/DataGym/html/gym.html" class="nav-link ${path.includes('gym') ? 'active' : ''}">
                <ion-icon name="barbell-outline"></ion-icon>
                <span data-i18n="nav_gym">Gym</span>
            </a>
            <a href="/DataGym/html/routines.html" class="nav-link ${path.includes('routines') ? 'active' : ''}">
                <ion-icon name="list-outline"></ion-icon>
                <span data-i18n="nav_routines">Routines</span>
            </a>
             <a href="/DataGym/html/nutrition.html" class="nav-link ${path.includes('nutrition') ? 'active' : ''}">
                <ion-icon name="nutrition-outline"></ion-icon>
                <span data-i18n="nav_nutrition">Nutrition</span>
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
        label_power: "Potencia",
        label_adjusted: "Ajustada",
        btn_calc_power: "Calcular Potencia",
        label_time: "Tiempo",
        btn_calc_time: "Calcular Tiempo",
        label_weight2: "Peso Objetivo (kg)",
        label_reps2: "Repeticiones Objetivo",
        info_tab: "Test realizado en 5 segundos",
        info2_tab: "Calcular tiempo estimado para el objetivo",
        tab_power: "Potencia",
        tab_time: "Tiempo",

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

        // Routines
        routines_title: "Constructor de Rutinas",
        routines_subtitle: "Crea tu plan de entrenamiento personalizado",
        search_placeholder: "Buscar ejercicios...",
        filter_muscle_all: "Todos los Músculos",
        filter_equip_all: "Todo el Equipo",
        my_routine: "Mi Rutina",
        btn_save: "Guardar PDF",
        empty_routine_title: "Tu rutina está vacía",
        empty_routine_text: "Haz clic en '+' para añadir ejercicios.",
        est_time: "Tiempo Est.",
        sets_label: "Series",
        reps_label: "Reps",
        weight_label: "Peso",
        add_set: "+ Añadir Serie",
        loading_exercises: "Cargando ejercicios...",
        no_exercises_found: "No se encontraron ejercicios.",
        clear_confirm: "¿Borrar toda la rutina?",
        pdf_title: "Mi Rutina de Gimnasio",
        pdf_generated: "Generado el",
        pdf_duration: "Duración Estimada",
        nav_nutrition: "Nutrición",
        nav_routines: "Rutinas",
        // Nutrition
        nutrition_title: "Nutrición",
        nutrition_subtitle: "Nutrición para la mejor preparación y resultados.",
        nutrition_feature_text: "Este módulo es caracterizado por una biblioteca de ejercicios y un constructor de rutinas.",
        nutrition_upload_prompt: "Sube una foto de tu comida",
        nutrition_upload_prompt_description: "El motor Antigravity analizará la composición molecular, macros, micros y coste de mercado.",
        nutrition_loading: "Analizando composición molecular...",
        nutrition_loading_text: "Calibrando sensores...",
        nutrition_category: "GASTRONOMIC_PLATE",
        nutrition_item_name: "Nombre del Plato",
        nutrition_verdict: "Verdict",
        nutrition_health_score: "Health Score",
        nutrition_macros: "Matriz Energética",
        nutrition_deep_details: "Desglose Detallado",
        video_upload_text: "Sube tu video corriendo y recibe un análisis biomecánico avanzado impulsado por inteligencia artificial. El sistema evaluará automáticamente tu cadencia, longitud de zancada, oscilación vertical, tiempo de contacto con el suelo y otras métricas clave de rendimiento para ayudarte a entender y mejorar tu técnica de carrera.",
        video_upload_text_description: "Sube un vídeo para obtener análisis detallados...",
        cadence: "Cadencia",
        tilt: "Inclinación",
        forward_lean: "Inclinación hacia adelante",
        gct_angles: "Angulos",
        left: "I",
        right: "D",
        contact: "Contacto",
        knee_flex: "Flexión de rodillas",
        shin: "Espinilla",
        btn_analyzing: "Analizando...",
        btn_calc_freq: "Calcular Frecuencia",
        btn_calc_amp: "Calcular Amplitud",
        freq_calc_title: "Calculadora de Frecuencia",
        freq_calc_desc: "Calcular la frecuencia de brazada (Hz) y SPM.",
        amp_calc_title: "Calculadora de Amplitud (DPS)",
        amp_calc_desc: "Distancia por brazada (DPS).",
        dist_m_label: "Distancia (m)",
        strokes_label: "Número de brazadas",
        cycles_label: "Número de ciclos (brazadas)",
        cycles_per_second: "Ciclos/segundo",
        strokes_per_minute: "Brazadas/minuto",





        // Swimming - New Logic
        swim_tab_css: "Perfil CSS",
        swim_tab_zones: "Zonas y Estilos",
        swim_tab_builder: "Diseñador Series",
        swim_tab_tech: "Eficiencia",
        swim_tab_health: "Salud (ACWR)",
        swim_tab_ai: "Analizador IA",

        // CSS Profile
        css_title: "Perfil de Velocidad Crítica (CSS)",
        css_desc: "Introduce tus tiempos máximos. Este parámetro fisiológico establece tus zonas de entrenamiento.",
        css_label_400: "Tiempo 400m",
        css_label_200: "Tiempo 200m",
        css_placeholder: "MM:SS (ej. 06:00)",
        css_btn_calc: "Calcular Perfil CSS",
        css_res_placeholder: "Introduce tiempos para ver perfil",
        css_res_title: "Perfil Fisiológico",
        css_res_speed: "Velocidad Umbral",
        css_res_pace: "Ritmo Base (100m)",
        css_res_info_pre: "Este ritmo representa tu",
        css_res_info_bold: "techo aeróbico",
        css_res_info_post: ". Nadar más rápido que",
        css_res_info_post2: "acumulará lactato rápidamente. Ritmos más lentos pueden sostenerse por mucho tiempo.",

        // Zones & Styles
        zones_title: "Zonas de Entrenamiento",
        zones_warn_calc: "Calcula tu perfil CSS primero.",
        zones_note: "* Nota: Los tiempos se ajustan automáticamente al estilo seleccionado usando coeficientes de arrastre biomecánico. No necesitas nuevos tests.",

        // Workout Builder
        wb_title: "Diseñador de Series",
        wb_style: "Estilo",
        wb_dist: "Distancia",
        wb_zone: "Zona Intensidad",
        wb_target: "Tiempo Objetivo",
        wb_rest: "Protocolo Descanso:",
        wb_start_time: "Cada:",
        wb_rest_placeholder: "Selecciona parámetros para ver consejos.",
        wb_alert: "⚠️ Alerta Metodológica: Si reduces el descanso en series de Sprint, dejas de entrenar velocidad pura y pasas a resistencia anaeróbica. ¡Respeta la pausa larga!",

        // ACWR
        acwr_title: "Control de Carga (ACWR)",
        acwr_desc: "Compara Carga Aguda (7 días) vs Crónica (28 días) para prevenir lesiones.",
        acwr_label_acute: "Carga Aguda (Últimos 7 días)",
        acwr_doc_acute: "Distancia total o unidades de carga esta semana.",
        acwr_label_chronic: "Carga Crónica (Media 4 semanas)",
        acwr_doc_chronic: "Media semanal del último mes.",
        acwr_btn_calc: "Calcular Riesgo",
        acwr_res_placeholder: "Introduce datos de carga",

        // SWOLF
        swolf_title: "Eficiencia (SWOLF)",
        swolf_desc: "SWOLF = Tiempo + Brazadas. Menor puntuación es mejor eficiencia.",
        swolf_label_time: "Tiempo",
        swolf_label_strokes: "Brazadas (Ciclos)",
        swolf_placeholder_time: "Segundos o MM:SS (ej. 30)",
        swolf_placeholder_strokes: "Conteo (ej. 15)",
        swolf_label_pool: "Largo Piscina",
        swolf_btn_analyze: "Analizar Eficiencia",
        swolf_res_placeholder: "Introduce métricas para analizar",
        swolf_res_score: "Puntuación SWOLF",

        // AI Extras
        meta_label_dist: "Distancia Total (m)",
        meta_label_time: "Tiempo Total (s) o Ritmo",
        meta_doc_time: "Usa segundos (ej. 45.5) para mejor resultado.",
        meta_optional: "Metadatos Video (Opcional)",
        meta_desc: "Introduce datos manualmente para mejor precisión IA.",
        // JS Dynamic Strings
        alert_invalid_css: "Tiempos inválidos. Usa formato MM:SS (ej. 05:30) y asegura 400m > 200m.",
        alert_invalid_swolf: "Por favor introduce tiempo y brazadas válidos.",

        // Tech Check
        freq_label: "Frecuencia",
        freq_unit: "Ciclos/Min",
        amp_label: "Amplitud",
        amp_desc: "Metros/Brazada",
        tech_why_title: "¿Por qué es importante?",
        freq_info: "Ritmo de nado. Muy bajo indica puntos muertos; muy alto puede indicar 'resbale'.",
        amp_info: "Distancia por brazada. Mayor amplitud indica mejor eficiencia (DPS).",

        mode_manual: "Entrada Manual",
        mode_ai: "Estimador IA",
        btn_ai_sim: "Simular Análisis Pro",
        ai_est_desc: "La IA estima métricas de rendimiento detalladas usando solo Tiempo y Longitud de Piscina.",
        ai_avg_speed: "Velocidad Media",

        // Workout Advice
        advice_rec: "Continuo o descanso muy corto (10s). Objetivo: Limpiar lactato.",
        advice_en1: "Descanso 10s-15s. Mantén frecuencia cardíaca estable.",
        advice_en2: "Trabajo:Descanso 1:0.25 a 1:0.5 (20s-40s). Ritmo repetible.",
        advice_en3: "Trabajo:Descanso 1:1 a 1:3. Recuperación necesaria acidosis.",
        advice_sp: "Trabajo:Descanso 1:12 a 1:20 (Descanso total > 2m). Fosfágenos puros.",

        // SWOLF Feedback
        swolf_fb_good: "Buena eficiencia.",
        swolf_fb_slip: "Diagnóstico: 'Resbale'. Frecuencia alta (>50) pero bajo DPS. Enfócate en deslizar.",
        swolf_fb_elite: "Diagnóstico: Eficiencia Élited. Excelente balance deslizamiento/frecuencia.",
        swolf_fb_goal: "Objetivo: Intenta bajar 1-2 puntos manteniendo el mismo tiempo con una brazada menos.",

        // ACWR Status
        acwr_risk_under: "Riesgo Desentrenamiento",
        acwr_risk_optimal: "Sweet Spot (Óptimo)",
        acwr_risk_high: "CRÍTICO: Alto Riesgo Lesión",
        acwr_risk_over: "Precaución (Sobrecarga)",
        acwr_msg_high: "Rec Entrenador: Tu carga aguda es 50% mayor que la histórica. Reduce volumen un 20% el próximo microciclo.",

        // AI Results
        ai_complete: "Análisis Completo",
        ai_strokes: "Total Brazadas",
    },
    ca: {
        // Swimming - New Logic
        swim_tab_css: "Perfil CSS",
        swim_tab_zones: "Zones i Estils",
        swim_tab_builder: "Dissenyador Sèries",
        swim_tab_tech: "Eficiència",
        swim_tab_health: "Salut (ACWR)",
        swim_tab_ai: "Analitzador IA",

        // CSS Profile
        css_title: "Perfil de Velocitat Crítica (CSS)",
        css_desc: "Introdueix els teus temps màxims. Aquest paràmetre fisiològic estableix les teves zones d'entrenament.",
        css_label_400: "Temps 400m",
        css_label_200: "Temps 200m",
        css_placeholder: "MM:SS (ex. 06:00)",
        css_btn_calc: "Calcular Perfil CSS",
        css_res_placeholder: "Introdueix temps per veure perfil",
        css_res_title: "Perfil Fisiològic",
        css_res_speed: "Velocitat Llindar",
        css_res_pace: "Ritme Base (100m)",
        css_res_info_pre: "Aquest ritme representa el teu",
        css_res_info_bold: "sostre aeròbic",
        css_res_info_post: ". Nedar més ràpid que",
        css_res_info_post2: "acumularà lactat ràpidament. Ritmes més lents poden sostenir-se per molt temps.",

        // Zones & Styles
        zones_title: "Zones d'Entrenament",
        zones_warn_calc: "Calcula el teu perfil CSS primer.",
        zones_note: "* Nota: Els temps s'ajusten automàticament a l'estil seleccionat utilitzant coeficients d'arrossegament biomecànic. No necessites nous tests.",

        // Workout Builder
        wb_title: "Dissenyador de Sèries",
        wb_style: "Estil",
        wb_dist: "Distància",
        wb_zone: "Zona Intensitat",
        wb_target: "Temps Objectiu",
        wb_rest: "Protocol Descans:",
        wb_start_time: "Cada:",
        wb_rest_placeholder: "Selecciona paràmetres per veure consells.",
        wb_alert: "⚠️ Alerta Metodològica: Si redueixes el descans en sèries de Sprint, deixes d'entrenar velocitat pura i passes a resistència anaeròbica. Respecta la pausa llarga!",

        // ACWR
        acwr_title: "Control de Càrrega (ACWR)",
        acwr_desc: "Compara Càrrega Aguda (7 dies) vs Crònica (28 dies) per prevenir lesions.",
        acwr_label_acute: "Càrrega Aguda (Últims 7 dies)",
        acwr_doc_acute: "Distància total o unitats de càrrega aquesta setmana.",
        acwr_label_chronic: "Càrrega Crònica (Mitjana 4 setmanes)",
        acwr_doc_chronic: "Mitjana setmanal de l'últim mes.",
        acwr_btn_calc: "Calcular Risc",
        acwr_res_placeholder: "Introdueix dades de càrrega",

        // SWOLF
        swolf_title: "Eficiència (SWOLF)",
        swolf_desc: "SWOLF = Temps + Braçades. Menor puntuació és millor eficiència.",
        swolf_label_time: "Temps",
        swolf_label_strokes: "Braçades (Cicles)",
        swolf_placeholder_time: "Segons o MM:SS (ex. 30)",
        swolf_placeholder_strokes: "Compte (ex. 15)",
        swolf_label_pool: "Llarg Piscina",
        swolf_btn_analyze: "Analitzar Eficiència",
        swolf_res_placeholder: "Introdueix mètriques per analitzar",
        swolf_res_score: "Puntuació SWOLF",

        // AI Extras
        meta_label_dist: "Distància Total (m)",
        meta_label_time: "Temps Total (s) o Ritme",
        meta_doc_time: "Usa segons (ex. 45.5) per millor resultat.",
        meta_optional: "Metadades Vídeo (Opcional)",
        meta_desc: "Introdueix dades manualment per millor precisió IA.",

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
        label_power: "Potència",
        label_adjusted: "Ajustada",
        btn_calc_power: "Calcular Potència",
        label_time: "Temps",
        btn_calc_time: "Calcular Temps",
        label_weight2: "Pes Objetiu (kg)",
        label_reps2: "Repeticions Objetivo",
        info_tab: "Test realitzat en 5 segons",
        info2_tab: "Calcular temps estimat per l'objectiu",
        tab_power: "Potència",
        tab_time: "Temps",

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
        nav_routines: "Rutines",
        nav_nutrition: "Nutrició",
        nutrition_title: "Nutrició",
        nutrition_subtitle: "Nutrició per a la millor preparació i resultats.",
        nutrition_feature_text: "Aquest mòdul es caracteritza per una llibreria d'exercicis i un constructor de rutines.",
        nutrition_category: "GASTRONOMIC_PLATE",
        nutrition_item_name: "Nombre del Plato",
        nutrition_verdict: "Verdict",
        nutrition_health_score: "Health Score",
        nutrition_macros: "Matriz Energética",
        nutrition_deep_details: "Desglose Detallado",
        nutrition_upload_prompt: "Sube una foto de tu comida",
        nutrition_upload_prompt_description: "El motor Antigravity analizará la composición molecular, macros, micros y coste de mercado.",
        nutrition_loading: "Analizando composición molecular...",
        nutrition_loading_text: "Calibrando sensores...",
        btn_analyzing: "Analitzant...",
        btn_calc_freq: "Calcula Freqüencia",
        btn_calc_amp: "Calcula Amplitud",
        freq_calc_title: "Calculadora de Freqüencia",
        freq_calc_desc: "Calcula la freqüencia de palada (Hz) y SPM.",
        amp_calc_title: "Calculadora de Amplitud (DPS)",
        amp_calc_desc: "Distancia por palada (DPS).",
        dist_m_label: "Distancia (m)",
        strokes_label: "Número de paladas",
        cycles_label: "Número de ciclos (paladas)",
        cycles_per_second: "Cicles / Segon",
        strokes_per_minute: "Brazadas / Minut",


        // JS Dynamic Strings
        alert_invalid_css: "Temps invàlids. Ua format MM:SS (ex. 05:30) i assegura 400m > 200m.",
        alert_invalid_swolf: "Si us plau introdueix temps i braçades vàlids.",

        // Tech Check
        freq_label: "Freqüència",
        freq_unit: "Cicles/Min",
        amp_label: "Amplitud",
        amp_desc: "Metres/Braçada",
        tech_why_title: "Per què és important?",
        freq_info: "Ritme de nedar. Massa baix indica punts morts; massa alt pot indicar 'relliscada'.",
        amp_info: "Distància per braçada. Major amplitud indica millor eficiència (DPS).",

        mode_manual: "Entrada Manual",
        mode_ai: "Estimador IA",
        btn_ai_sim: "Simular Anàlisi Pro",
        ai_est_desc: "La IA estima mètriques de rendiment detallades usant només Temps i Longitud de Piscina.",
        ai_avg_speed: "Velocitat Mitjana",

        // Zones
        zone_name_rec: "Recuperació (Rec)",
        zone_desc_rec: "Eliminació de lactat, recuperació activa.",
        zone_name_en1: "Resistència Base (En-1)",
        zone_desc_en1: "Capacitat aeròbica, crema de greixos.",
        zone_name_en2: "Llindar (En-2)",
        zone_desc_en2: "Estat estacionari de lactat. Ritme de creuer.",
        zone_name_en3: "VO2 Màx (En-3)",
        zone_desc_en3: "Màxim consum d'oxigen. Intervals curts.",
        zone_name_sp: "Sprint (Sp)",
        zone_desc_sp: "Velocitat pura, alta tolerància al lactat.",

        // Workout Advice
        advice_rec: "Continu o descans molt curt (10s). Objectiu: Netejar lactat.",
        advice_en1: "Descans 10s-15s. Manté freqüència cardíaca estable.",
        advice_en2: "Treball:Descans 1:0.25 a 1:0.5 (20s-40s). Ritme repetible.",
        advice_en3: "Treball:Descans 1:1 a 1:3. Recuperació necessària acidosi.",
        advice_sp: "Treball:Descans 1:12 a 1:20 (Descans total > 2m). Fosfàgens purs.",

        // SWOLF Feedback
        swolf_fb_good: "Bona eficiència.",
        swolf_fb_slip: "Diagnòstic: 'Rellisca'. Freqüència alta (>50) però baix DPS. Enfoca't en lliscar.",
        swolf_fb_elite: "Diagnòstic: Eficiència Èlit. Excel·lent balanç lliscament/freqüència.",
        swolf_fb_goal: "Objectiu: Intenta baixar 1-2 punts mantenint el mateix temps amb una braçada menys.",

        // ACWR Status
        acwr_risk_under: "Risc Desentrenament",
        acwr_risk_optimal: "Sweet Spot (Òptim)",
        acwr_risk_high: "CRÍTIC: Alt Risc Lesió",
        acwr_risk_over: "Precaució (Sobrecàrrega)",
        acwr_msg_high: "Rec Entrenador: La teva càrrega aguda és 50% major que la històrica. Redueix volum un 20% el pròxim microcicle.",

        // AI Results
        ai_complete: "Anàlisi Complet",
        ai_strokes: "Total Braçades",
        ai_spm: "SPM Mitjà",
        ai_tech: "Insights Tècnica",
        ai_rhythm: "• Ritme constant detectat.",
        ai_focus_glide: "focus en lliscament/tècnica",
        ai_focus_sprint: "sprint/alta freqüència",
        ai_focus_endurance: "ritme resistència estable",
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
        label_power: "Power",
        label_adjusted: "Adjusted",
        btn_calc_power: "Calculate Power",
        label_time: "Time",
        btn_calc_time: "Calculate Time",
        label_weight2: "Weight Objective (kg)",
        label_reps2: "Reps Objective",
        info_tab: "Test performed in 5 seconds",
        info2_tab: "Calculate estimated time for target",
        tab_power: "Power",
        tab_time: "Time",

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
        w5_power: "Power",
        w5_time: "Time",
        w5_intensity: "Intensity",
        nav_nutrition: "Nutrition",
        nutrition_title: "Nutrition",
        nutrition_subtitle: "Nutrition for better preparation and results.",
        nutrition_upload_prompt: "Upload a photo of your meal",
        nutrition_upload_prompt_description: "The Antigravity engine will analyze the molecular composition, macros, micros and market cost.",
        nutrition_loading: "Analyzing molecular composition...",
        nutrition_loading_text: "Calibrating sensors...",
        nutrition_category: "GASTRONOMIC_PLATE",
        nutrition_item_name: "Dish Name",
        nutrition_verdict: "Verdict",
        nutrition_health_score: "Health Score",
        nutrition_macros: "Energy Matrix",
        nutrition_deep_details: "Detailed Breakdown",
        btn_analyzing: "Analyzing...",


        // JS Dynamic Strings
        alert_invalid_css: "Invalid times. Use MM:SS format (e.g. 05:30) and ensure 400m > 200m.",
        alert_invalid_swolf: "Please enter valid time and strokes.",

        // Tech Check
        freq_label: "Frequency",
        freq_unit: "Cycles/Min",
        amp_label: "Amplitude",
        amp_desc: "Meters/Stroke",
        tech_why_title: "Why is this important?",
        freq_info: "Stroke rhythm. Too low means dead spots; too high might indicate slipping.",
        amp_info: "Distance per stroke. Higher amplitude generally indicates better efficiency.",

        mode_manual: "Manual Input",
        mode_ai: "AI Estimator",
        btn_ai_sim: "Simulate Pro Analysis",
        ai_est_desc: "AI estimates detailed performance metrics using only Time & Pool Length.",
        ai_avg_speed: "Avg Speed",

        // Zones
        zone_name_rec: "Recovery (Rec)",
        zone_desc_rec: "Lactate clearance, active recovery.",
        zone_name_en1: "Base Endurance (En-1)",
        zone_desc_en1: "Aerobic capacity, fat burning.",
        zone_name_en2: "Threshold (En-2)",
        zone_desc_en2: "Lactate steady state. Cruise pace.",
        zone_name_en3: "VO2 Max (En-3)",
        zone_desc_en3: "Max oxygen uptake. Short intervals.",
        zone_name_sp: "Sprint (Sp)",
        zone_desc_sp: "Pure speed, high lactate tolerance.",

        // Workout Advice
        advice_rec: "Continuous or very short rest (10s). Goal: Flush lactate.",
        advice_en1: "Rest 10s-15s. Keep heart rate stable.",
        advice_en2: "Work:Rest 1:0.25 to 1:0.5 (20s-40s). Repeatable pace.",
        advice_en3: "Work:Rest 1:1 to 1:3. High acidosis recovery needed.",
        advice_sp: "Work:Rest 1:12 to 1:20 (Total rest > 2m). Pure phosphagens.",

        // SWOLF Feedback
        swolf_fb_good: "Good efficiency.",
        swolf_fb_slip: "Diagnosis: 'Slipping'. High stroke rate (>50) but low DPS. Focus on glide.",
        swolf_fb_elite: "Diagnosis: Elite Efficiency. Excellent glide/rate balance.",
        swolf_fb_goal: "Goal: Try to drop 1-2 points next session by holding the same time with one less stroke.",

        // ACWR Status
        acwr_risk_under: "Undertraining Risk",
        acwr_risk_optimal: "Sweet Spot (Optimal)",
        acwr_risk_high: "CRITICAL: High Injury Risk",
        acwr_risk_over: "Caution (Overreaching)",
        acwr_msg_high: "Coach Rec: Your acute load is 50% higher than historical. Reduce volume by 20% next microcycle.",

        // AI Results
        ai_complete: "Analysis Complete",
        ai_strokes: "Total Strokes",
        ai_spm: "Avg SPM",
        ai_tech: "Technique Insights",
        ai_rhythm: "• Consistent rhythm detected.",
        ai_focus_glide: "gliding/drill focus",
        ai_focus_sprint: "sprinting/high turnover",
        ai_focus_endurance: "steady endurance pace",

    }
};

function initializeLanguage() {
    const savedLang = localStorage.getItem('adminLang') || 'es';
    setLanguage(savedLang);
}

function setLanguage(lang) {
    // Fallback to Spanish if key doesn't exist
    const t = translations[lang] || translations.es;

    // specific handling for innerText
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerText = t[key];
        }
    });

    // specific handling for placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // Update Selector Value
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    // Save to LocalStorage
    localStorage.setItem('adminLang', lang);
}

// Helper for JS dynamic strings
function getTranslation(key) {
    const lang = localStorage.getItem('adminLang') || 'es';
    const t = translations[lang] || translations.es;
    return t[key] || key;
}

// --- Shared Utilities ---

// Helper: Parse MM:SS.ms or SS.ms to total seconds
// Helper: Parse HH:MM:SS, MM:SS.ms or SS.ms to total seconds
function parseTime(timeStr) {
    if (!timeStr) return 0;
    // Normalized: replace comma with dot, trim
    const str = timeStr.toString().replace(',', '.').trim();
    const parts = str.split(':');
    let seconds = 0;

    if (parts.length === 3) {
        // HH:MM:SS
        seconds = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        // MM:SS
        seconds = (parseInt(parts[0]) * 60) + parseFloat(parts[1]);
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

        // Remove Overlay if exists
        const oldOverlay = videoEl.parentNode.querySelector('.ai-status-overlay');
        if (oldOverlay) oldOverlay.remove();

        if (resultBox) {
            // resultBox.classList.remove('d-none'); // Don't show box on reset, wait for upload
            // Actually, on reset we go back to "Upload" state usually, or "Ready to Analyze"
            // Let's hide the result box to be clean
            resultBox.classList.add('d-none');

            const mockPrompt = resultBox.querySelector('.text-secondary.fst-italic');
            if (mockPrompt) mockPrompt.classList.remove('d-none');

            const mockResult = document.getElementById(mockOutputId);
            if (mockResult) mockResult.classList.add('d-none');
        }

        // Show Upload Area again? Or just clear inputs?
        const uploadArea = document.getElementById(config.zoneId);
        // If we want to allow re-upload, we might need to show it.
        // Current flow seems to keep upload area visible but maybe we should reset it?

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

        // Re-enable input if needed or just let user pick file again
        return;
    }

    // 2. ANALYZE Logic (Start)

    // Hide the ENTIRE result box initially
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

    // --- INSERT AI OVERLAY ---
    const parent = videoEl.parentNode;
    // Ensure parent is relative
    parent.classList.add('position-relative');

    // Remove existing
    const existingOverlay = parent.querySelector('.ai-status-overlay');
    if (existingOverlay) existingOverlay.remove();

    // Create new Overlay
    const overlay = document.createElement('div');
    overlay.className = 'ai-status-overlay';
    overlay.innerHTML = `
        <div class="ai-scanner-line"></div>
        <div class="text-center z-3">
             <div class="spinner-border text-info mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
             <h4 class="text-white tracking-wide ai-pulse-text fw-bold" data-i18n="btn_analyzing">Analizando...</h4>
             <small class="text-info font-monospace">BIOMECHANICS ENGINE v11.0</small>
        </div>
    `;
    parent.appendChild(overlay);
    // -------------------------

    // Switch Button to "Loading" state
    analyzeBtn.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div><span data-i18n="btn_analyzing">Analizando...</span>';
    analyzeBtn.classList.remove('btn-primary');
    analyzeBtn.classList.add('btn-outline-light');
    analyzeBtn.disabled = true; // Prevent clicking while analyzing

    // Hide Header Initially
    const gymTitle = document.getElementById('gymResultTitle');
    if (gymTitle) gymTitle.classList.add('d-none');
    const runTitle = document.getElementById('runResultTitle');
    if (runTitle) runTitle.classList.add('d-none');

    // Setup MediaPipe
    videoProcessor.setupAnalysis(videoEl, canvasEl, config.module);

    // RESTRICT CONTROLS
    videoEl.removeAttribute('controls');

    // Muted strict
    videoEl.muted = true;

    // Custom Play/Pause (Toggle)
    videoEl.onclick = () => {
        if (videoEl.paused) videoEl.play();
        else videoEl.pause();
    };

    // Listen for video end
    videoEl.onended = () => {
        videoEl.onclick = null; // Disable interactions

        // UPDATE OVERLAY TEXT
        const title = overlay.querySelector('h4');
        const spinner = overlay.querySelector('.spinner-border');
        const small = overlay.querySelector('small');

        if (title) title.innerText = "GENERATING REPORT...";
        if (small) small.innerText = "COMPILING DATA POINTS";
        if (spinner) {
            spinner.classList.remove('text-info');
            spinner.classList.add('text-success');
        }

        if (config.onAnalysisComplete && typeof config.onAnalysisComplete === 'function') {
            setTimeout(() => {
                // Fade out overlay
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove(); // Remove from DOM

                    // Show Header
                    if (gymTitle) gymTitle.classList.remove('d-none');
                    if (runTitle) runTitle.classList.remove('d-none');

                    // Show Result Box Container
                    if (resultBox) resultBox.classList.remove('d-none');

                    // Show Results
                    config.onAnalysisComplete();

                    // RESET BUTTON & CONTROLS FOR REPLAY
                    analyzeBtn.innerHTML = '<ion-icon name="sparkles" class="me-2"></ion-icon><span data-i18n="btn_analyze">Re-Analyze</span>';
                    analyzeBtn.classList.remove('btn-outline-light');
                    analyzeBtn.classList.add('btn-primary');
                    analyzeBtn.disabled = false;

                    videoEl.controls = true;
                    videoEl.onclick = null;

                }, 500); // Wait for fade out

            }, 1000); // 1s processing delay
        }
    };

    // Auto-play
    videoEl.play();
}
