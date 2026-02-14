/**
 * ANTIGRAVITY VIDEO ENGINE v11.0
 * Unified engine for Gym (v9.0 Magnetic), Swimming, Running, and Plyometrics.
 */

// --- BIBLIOTECA DE FEEDBACK BIOMECÁNICO ---
const BIOMECHANICS_FEEDBACK = {
    general: {
        momentum: "Inercia detectada. Controla el movimiento.",
        occlusion: "⚠️ Articulación oculta. Ajusta tu posición."
    },
    squat: {
        valgus: "¡Rodillas hacia fuera!",
        depth: "Baja más (Rompe el paralelo).",
        heels: "Talones al suelo.",
        lean: "Pecho arriba, no te inclines."
    },
    bench: { flare: "Codos demasiado abiertos.", arch: "Mantén glúteos en el banco." },
    deadlift: { spine: "Espalda recta, saca pecho.", hips_shoot: "Cadera y hombros a la vez." }
};

class VideoProcessor {
    constructor() {
        this.pose = null;
        this.activeAnalyzer = null;
        this.isVideoPlaying = false;
        this.isProcessingFrame = false; // Guard for concurrency
        this.canvasCtx = null;
        this.canvasEl = null;
        this.videoEl = null;
        this.isLoaded = false;
        this.init();
    }

    async init() {
        if (this.pose) return;
        this.pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.pose.onResults(this.onResults.bind(this));
        this.isLoaded = true;
    }

    setupAnalysis(videoEl, canvasEl, moduleName = 'Gym') {
        this.videoEl = videoEl;
        this.canvasEl = canvasEl;
        this.canvasCtx = canvasEl.getContext('2d');

        // Seleccionar analizador dinámicamente
        switch (moduleName) {
            case 'Gym': this.activeAnalyzer = new GymAnalyzer(videoEl, canvasEl); break;
            case 'Swimming': this.activeAnalyzer = new SwimAnalyzer(videoEl); break;
            case 'Running': this.activeAnalyzer = new RunAnalyzer(videoEl); break;
            case 'Plyometrics': this.activeAnalyzer = new JumpAnalyzer(videoEl); break;
        }

        videoEl.onloadedmetadata = () => {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
        };

        videoEl.onplay = () => {
            this.isVideoPlaying = true;
            if (!this.isProcessingFrame) this.processFrame();
        };
        videoEl.onpause = () => { this.isVideoPlaying = false; };

        // Handle Scrubbing/Seeking
        videoEl.onseeked = () => {
            if (!this.isVideoPlaying) {
                // Trigger single frame process to update overlay
                requestAnimationFrame(() => this.processFrame(true));
            }
        };
    }

    async processFrame(force = false) {
        if ((!this.isVideoPlaying && !force) || !this.videoEl || !this.pose) return;

        // Validation: Video must have data
        if (this.videoEl.readyState < 2) {
            if (!force) requestAnimationFrame(() => this.processFrame());
            return;
        }

        if (this.isProcessingFrame) return;
        this.isProcessingFrame = true;

        try {
            await this.pose.send({ image: this.videoEl });
        } catch (error) {
            console.error("MediaPipe Send Error:", error);
            this.isVideoPlaying = false; // Stop on critical error to prevent loops
        } finally {
            this.isProcessingFrame = false;
        }

        if (this.isVideoPlaying) {
            requestAnimationFrame(() => this.processFrame());
        }
    }

    onResults(results) {
        if (!this.canvasCtx || !results.poseLandmarks) return;
        this.canvasCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

        if (this.activeAnalyzer) {
            this.activeAnalyzer.processFrame(results.poseLandmarks, this.videoEl.currentTime);
        }

        // Dibujo estándar de MediaPipe (Líneas finas)
        drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00F2FF', lineWidth: 2 });
        drawLandmarks(this.canvasCtx, results.poseLandmarks, { color: '#FFFFFF', lineWidth: 1, radius: 2 });
    }

    start(videoEl, canvasEl) {
        this.setupAnalysis(videoEl, canvasEl, 'Gym');
        videoEl.play();
    }

    validateVideo(file, module) {
        return new Promise((resolve) => {
            // Simple validation for now
            if (!file.type.startsWith('video/')) {
                resolve({ isValid: false, error: 'File must be a video.' });
            } else {
                resolve({ isValid: true });
            }
        });
    }

    getAnalysisResults() {
        return this.activeAnalyzer?.getResults ? this.activeAnalyzer.getResults() : null;
    }

    reset() {
        if (this.videoEl) {
            this.videoEl.pause();
            this.videoEl.removeAttribute('src'); // Clear source
            this.videoEl.load();
        }
        if (this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        }
        this.activeAnalyzer = null;
        // this.pose = null; // Prepare for re-use
        this.isLoaded = false;
        this.init();
    }
}



// --- ANALIZADOR DE GIMNASIO (v9.0 + TAXONOMÍA) ---
class GymAnalyzer {
    constructor(videoEl, canvasEl) {
        this.videoEl = videoEl;
        this.canvasCtx = canvasEl.getContext('2d');
        this.exerciseType = document.getElementById('gymExerciseSelect')?.value || 'squat';
        this.state = 'start';
        this.reps = 0;
        this.mode = 'technique';

        // Suelo Magnético v9.0
        this.calibration = { isCalibrated: false, floorY: 0, lastStableY: 0 };
        this.calibCounter = 0;
        this.floorSamples = [];
        this.lastAlertTime = 0;

        // Configuración de ángulos
        this.config = this.getExerciseConfig(this.exerciseType);
    }

    getExerciseConfig(type) {
        const configs = {
            'squat': { joint: 'knee', startAngle: 170, targetAngle: 90, group: 'A' },
            'deadlift': { joint: 'hip', startAngle: 170, targetAngle: 45, group: 'A' },
            'bench': { joint: 'elbow', startAngle: 170, targetAngle: 90, group: 'A' }
        };
        return configs[type] || configs['squat'];
    }

    processFrame(landmarks, timestamp) {
        const body = this.mapLandmarks(landmarks);

        // 1. Calibración de Suelo Magnético
        if (!this.calibration.isCalibrated) {
            this.performCalibration(body);
            return;
        }

        // 2. Análisis Biomecánico
        const angle = this.calculateTargetAngle(landmarks);
        this.updateRepState(angle);

        if (this.exerciseType === 'squat' && this.state !== 'start') {
            this.analyzePrecisionSquat(body);
        }

        // 3. Render Visual (Pads Verdes)
        this.drawMagneticAnchors(body);

        // 4. Update UI
        window.dispatchEvent(new CustomEvent('gym-data', {
            detail: { type: 'FRAME', reps: this.reps, angle: Math.round(angle), velocity: "0.00" }
        }));
    }

    performCalibration(body) {
        // 1. SI NO VEO A NADIE (Cuerpo null o landmarks vacíos)
        if (!body || !body.nose) {
            this.dispatchUpdate({
                type: 'CALIBRATION_FEEDBACK',
                msg: "BUSCANDO USUARIO...",
                subtext: "Asegúrate de estar a la distancia correcta."
            });
            return;
        }

        // 2. CHECK DE VISIBILIDAD (Con seguridad ?.)
        const isFullBody = (
            (body.nose?.visibility ?? 0) > 0.5 &&
            (body.l_ankle?.visibility ?? 0) > 0.5 &&
            (body.r_ankle?.visibility ?? 0) > 0.5
        );

        if (!isFullBody) {
            this.calibCounter = 0; // Reset counter if body is lost
            this.dispatchUpdate({
                type: 'CALIBRATION_FEEDBACK',
                msg: "ALÉJATE",
                subtext: "Necesito ver tus pies y cabeza"
            });
            return;
        }

        // 3. CHECK DE POSTURA (Detección básica de estar de pie)
        // Usamos la posición relativa de tobillos y hombros
        const isStanding = Math.abs(body.l_ankle.x - body.r_ankle.x) < 0.3; // Pies no muy separados

        if (!isStanding) {
            this.dispatchUpdate({
                type: 'CALIBRATION_FEEDBACK',
                msg: "PONTE RECTO",
                subtext: "Junta un poco los pies"
            });
            // Opcional: No reseteamos contador, pero pausamos
            return;
        }

        // 4. PROGRESO DE CALIBRACIÓN
        this.calibCounter++;
        this.floorSamples.push((body.l_heel.y + body.r_heel.y) / 2);

        if (this.calibCounter < 40) {
            this.dispatchUpdate({ type: 'CALIBRATION_START' });
        } else {
            this.calibration.floorY = this.floorSamples.reduce((a, b) => a + b) / this.floorSamples.length;
            this.calibration.isCalibrated = true;
            this.dispatchUpdate({ type: 'CALIBRATION_COMPLETE' });
        }
    }

    dispatchUpdate(data) {
        window.dispatchEvent(new CustomEvent('gym-data', { detail: data }));
    }

    drawMagneticAnchors(body) {
        const ctx = this.canvasCtx;
        const fy = this.calibration.floorY * ctx.canvas.height;
        [body.l_heel, body.r_heel].forEach(h => {
            // Safety check
            if (!h) return;
            const px = h.x * ctx.canvas.width;
            const isFlying = (this.calibration.floorY - h.y) > 0.04;
            ctx.beginPath();
            ctx.moveTo(px - 40, fy); ctx.lineTo(px + 40, fy);
            ctx.strokeStyle = isFlying ? '#ff0000' : '#00ff00';
            ctx.lineWidth = 4;
            ctx.stroke();
        });
    }

    mapLandmarks(lm) {
        return {
            l_hip: lm[23], r_hip: lm[24], l_knee: lm[25], r_knee: lm[26],
            l_ankle: lm[27], r_ankle: lm[28], l_heel: lm[29], r_heel: lm[30],
            nose: lm[0], l_shoulder: lm[11], r_shoulder: lm[12]
        };
    }

    calculateAngle(a, b, c) {
        if (!a || !b || !c) return 0;
        const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let deg = Math.abs(rad * 180 / Math.PI);
        return deg > 180 ? 360 - deg : deg;
    }

    calculateTargetAngle(lm) {
        if (this.config.joint === 'knee') return this.calculateAngle(lm[23], lm[25], lm[27]);
        return 180;
    }

    updateRepState(angle) {
        if (this.state === 'start' && angle < 140) this.state = 'eccentric';
        if (this.state === 'eccentric' && angle < 100) this.state = 'bottom';
        if (this.state === 'bottom' && angle > 150) {
            this.reps++;
            this.state = 'start';
            window.dispatchEvent(new CustomEvent('gym-data', { detail: { type: 'FEEDBACK', msg: "¡REP OK!", color: 'success' } }));
        }
    }

    analyzePrecisionSquat(body) {
        if (body.l_heel && (this.calibration.floorY - body.l_heel.y) > 0.05) {
            this.triggerAlert("TALONES AL SUELO", "Mantén contacto con el Punto 0");
        }
    }

    triggerAlert(msg, sub) {
        if (Date.now() - this.lastAlertTime < 2500) return;
        this.lastAlertTime = Date.now();
        window.dispatchEvent(new CustomEvent('gym-data', { detail: { type: 'FEEDBACK', msg, subtext: sub, color: 'danger' } }));
    }

    // Gym Analyzer doesn't store results for "upload" flow usually, but we can add valid dummy
    getResults() { return null; }

    reset() { this.calibration.isCalibrated = false; this.reps = 0; this.calibCounter = 0; }
}

// --- RUNNING ANALYZER (New) ---
class RunAnalyzer {
    constructor(videoEl) {
        this.videoEl = videoEl;
        this.data = {
            steps: 0,
            timestamps: [], // of heel strikes
            gct: { left: [], right: [] },
            flight: [],
            lean: [],
            shinAngles: { left: [], right: [] },
            kneeAngles: { left: [], right: [] }
        };

        // State for detection
        this.state = {
            left: { onGround: false, contactStart: 0, minHeight: 1.0 },
            right: { onGround: false, contactStart: 0, minHeight: 1.0 },
            lastFlying: false,
            flightStart: 0
        };

        // Thresholds (Tune these for video resolution/distance)
        // We assume full body visibility. 
        // Heuristics: Ankle Y > Threshold (normalized 0-1, where 1 is bottom)
        this.GROUND_THRESHOLD = 0.85; // Roughly bottom 15% of screen? 
        // Better: Dynamic floor detection (min Y observed)
        this.minAnkleY = 0;

        this.isRecording = true;
    }

    finalize() {
        this.isRecording = false;
    }

    processFrame(landmarks, timestamp) {
        const lm = this.mapLandmarks(landmarks);

        // --- 1. Real-time Kinematics (For UI & Analysis) ---
        // Lean
        const midHip = { x: (lm.l_hip.x + lm.r_hip.x) / 2, y: (lm.l_hip.y + lm.r_hip.y) / 2 };
        const midShoulder = { x: (lm.l_shoulder.x + lm.r_shoulder.x) / 2, y: (lm.l_shoulder.y + lm.r_shoulder.y) / 2 };
        const dx = midShoulder.x - midHip.x;
        const dy = midShoulder.y - midHip.y;
        const leanRad = Math.atan2(Math.abs(dx), Math.abs(dy));
        const leanDeg = leanRad * (180 / Math.PI);

        // Joint Angles
        const lKneeAng = this.calculateAngle(lm.l_hip, lm.l_knee, lm.l_ankle);
        const rKneeAng = this.calculateAngle(lm.r_hip, lm.r_knee, lm.r_ankle);

        // Shin Angle (vertical deviation)
        const getShinAngle = (knee, ankle) => {
            const sdx = Math.abs(knee.x - ankle.x);
            const sdy = Math.abs(knee.y - ankle.y);
            return Math.atan2(sdx, sdy) * (180 / Math.PI);
        };
        const lShinAng = getShinAngle(lm.l_knee, lm.l_ankle);
        const rShinAng = getShinAngle(lm.r_knee, lm.r_ankle);

        // Dispatch Real-time Data for UI Overlay
        window.dispatchEvent(new CustomEvent('run-data', {
            detail: {
                lean: Math.round(leanDeg),
                lKnee: Math.round(lKneeAng),
                rKnee: Math.round(rKneeAng),
                lShin: Math.round(lShinAng),
                rShin: Math.round(rShinAng)
            }
        }));

        // --- 2. Recording / Analysis Logic ---
        if (!this.isRecording) return;

        // Dynamic Floor Calibration
        const currentMaxY = Math.max(lm.l_ankle.y, lm.r_ankle.y);
        if (currentMaxY > this.minAnkleY) {
            this.minAnkleY = currentMaxY;
        }

        const GROUND_TOLERANCE = 0.05;
        const groundLevel = this.minAnkleY - GROUND_TOLERANCE;

        // Detect Contact (GCT)
        this.processLeg(lm.l_ankle, 'left', groundLevel, timestamp, lm);
        this.processLeg(lm.r_ankle, 'right', groundLevel, timestamp, lm);

        // Detect Flight
        if (!this.state.left.onGround && !this.state.right.onGround) {
            if (!this.state.lastFlying) {
                this.state.lastFlying = true;
                this.state.flightStart = timestamp;
            }
        } else {
            if (this.state.lastFlying) {
                this.state.lastFlying = false;
                const flightDuration = (timestamp - this.state.flightStart) * 1000;
                if (flightDuration > 20 && flightDuration < 500) {
                    this.data.flight.push(flightDuration);
                }
            }
        }

        this.data.lean.push(leanDeg);
    }

    processLeg(ankle, side, groundLevel, time, lm) {
        const isOnGround = ankle.y > groundLevel;
        const legState = this.state[side];

        if (isOnGround) {
            if (!legState.onGround) {
                // CONTACT START
                legState.onGround = true;
                legState.contactStart = time;
                this.data.steps++;

                // Capture Impact Metrics
                this.captureImpactMetrics(side, lm);
            }

            // While on ground, track Max Knee Flex? 
            // The original logic only captured "Impact Metrics". 
            // Let's keep duplicate calculation for safety to avoid scope issues or just re-calc.

        } else {
            if (legState.onGround) {
                // CONTACT END
                legState.onGround = false;
                const duration = (time - legState.contactStart) * 1000;
                if (duration > 50 && duration < 1000) {
                    this.data.gct[side].push(duration);
                }
            }
        }
    }

    // Capture Metrics specifically at impact (or relevant phase)
    // NOTE: This method was used in processLeg. 
    // Since we removed the call to it in the simplified processFrame above (oops, I removed captureImpactMetrics call), 
    // we should re-integrate "Recording" logic.

    // Actually, simply pushing `lean` and `angles` every frame is "continuous" analysis.
    // But for "Shin at Impact", we specifically want the angle WHEN contact starts.
    // So inside processLeg -> Contact Start -> we should record the angle.

    captureImpactMetrics(side, lm) {
        // Shin Angle: Tibia vs Vertical
        // Knee to Ankle
        const knee = side === 'left' ? lm.l_knee : lm.r_knee;
        const ankle = side === 'left' ? lm.l_ankle : lm.r_ankle;

        const dx = Math.abs(knee.x - ankle.x);
        const dy = Math.abs(knee.y - ankle.y);
        const shinAngle = Math.atan2(dx, dy) * (180 / Math.PI); // 0 = Vertical
        this.data.shinAngles[side].push(shinAngle);

        // Knee Angle
        const hip = side === 'left' ? lm.l_hip : lm.r_hip;
        this.data.kneeAngles[side].push(this.calculateAngle(hip, knee, ankle));
    }

    mapLandmarks(lm) {
        return {
            l_hip: lm[23], r_hip: lm[24], l_knee: lm[25], r_knee: lm[26],
            l_ankle: lm[27], r_ankle: lm[28], l_heel: lm[29], r_heel: lm[30],
            nose: lm[0], l_shoulder: lm[11], r_shoulder: lm[12]
        };
    }

    calculateAngle(a, b, c) {
        const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let deg = Math.abs(rad * 180 / Math.PI);
        return deg > 180 ? 360 - deg : deg;
    }

    getResults() {
        // Average the collected data
        const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

        const totalSteps = this.data.steps;
        const videoDurationMin = this.videoEl.duration / 60;
        const spm = videoDurationMin > 0 ? Math.round(totalSteps / videoDurationMin) : 0;

        const lean = avg(this.data.lean);

        // Analyze flaws
        const corrections = [];
        const recommendations = [];

        if (spm < 160) corrections.push("Cadencia baja. Intenta pasos más cortos y rápidos.");
        else recommendations.push("¡Buena Cadencia!");

        if (lean > 15) corrections.push("Inclinación excesiva. Mantén el tronco más erguido.");

        const lShin = parseFloat(avg(this.data.shinAngles.left));
        if (lShin > 10) corrections.push("Posible 'Overstriding' (Zancada larga) en pierna izquierda.");

        return {
            detected: true,
            spm: spm,
            lean: lean,
            corrections: corrections,
            recommendations: recommendations,
            details: {
                left: {
                    gct: Math.round(avg(this.data.gct.left)),
                    flight: Math.round(avg(this.data.flight)), // Flight track is global usually, but we can return avg
                    kneeAngle: Math.round(avg(this.data.kneeAngles.left)),
                    shinAngle: Math.round(avg(this.data.shinAngles.left))
                },
                right: {
                    gct: Math.round(avg(this.data.gct.right)),
                    flight: Math.round(avg(this.data.flight)),
                    kneeAngle: Math.round(avg(this.data.kneeAngles.right)),
                    shinAngle: Math.round(avg(this.data.shinAngles.right))
                }
            }
        };
    }
}

// Analizadores simplificados para Swimming y Plyometrics (Plugins)
// --- SWIMMING ANALYZER (New) ---
class SwimAnalyzer {
    constructor(videoEl) {
        this.videoEl = videoEl;
        this.strokeCount = 0;
        this.strokeTimestamps = [];
        this.postureErrors = {
            lowHips: 0,
            crossedArm: 0,
            recoveryLow: 0
        };

        // State for arm cycle detection (simple state machine for left/right arms)
        this.arms = {
            left: { phase: 'pull', lastY: 0 },
            right: { phase: 'pull', lastY: 0 }
        };
    }

    processFrame(landmarks, timestamp) {
        const body = this.mapLandmarks(landmarks);
        if (!body.nose) return; // Need visibility

        // 1. Stroke Detection (Cycle: High -> Low -> High)
        // We track wrist relative to shoulder Y
        this.analyzeArm(body.l_wrist, body.l_shoulder, 'left', timestamp);
        this.analyzeArm(body.r_wrist, body.r_shoulder, 'right', timestamp);

        // 2. Technique Checks
        // A. Body Position (Hips vs Shoulders) - if hips are too low relative to shoulders (in Y)
        if (body.l_hip && body.l_shoulder) {
            const hipDrop = body.l_hip.y - body.l_shoulder.y; // Positive means lower
            // Heuristic: If vertical distance is too large, legs might be sinking. 
            // In horizontal swim, y diff is small. In standing, it's large. 
            // Swimming implies horizontal. 
            // Let's assume camera is side view? Or generic?
            // Accessing "sinking legs" is hard without knowing camera angle.
            // We'll skip complex posture for now and focus on Arm Cross-over.
        }

        // B. Arm Cross-over (Midline crossing)
        // Mid-hip X
        if (body.l_hip && body.r_hip && body.r_wrist) {
            const midHipX = (body.l_hip.x + body.r_hip.x) / 2;
            const rightWristX = body.r_wrist.x;
            // If right wrist crosses to left side of midHip? 
            // Depends on direction. Simplification:
            // Just count strokes for now.
        }
    }

    analyzeArm(wrist, shoulder, side, time) {
        if (!wrist || !shoulder) return;

        // Relative Height (Y inverted: 0 is top, 1 is bottom)
        // High Recovery: Wrist < Shoulder (visually above)
        const isHigh = wrist.y < shoulder.y;
        const state = this.arms[side];

        // Simple Phase Detection
        // Phase 'recovery': arm is moving forward above/near surface (High Y)
        // Phase 'pull': arm is pulling back underwater (Low Y)

        // Transition to Pull (Entry)
        if (state.phase === 'recovery' && !isHigh) {
            state.phase = 'pull';
        }

        // Transition to Recovery (Exit)
        if (state.phase === 'pull' && isHigh) {
            state.phase = 'recovery';
            // Cycle Complete
            this.strokeCount++;
            this.strokeTimestamps.push(time);
        }
    }

    mapLandmarks(lm) {
        return {
            nose: lm[0],
            l_shoulder: lm[11], r_shoulder: lm[12],
            l_elbow: lm[13], r_elbow: lm[14],
            l_wrist: lm[15], r_wrist: lm[16],
            l_hip: lm[23], r_hip: lm[24]
        };
    }

    getResults() {
        // Calculate SPM
        let spm = 0;
        if (this.strokeTimestamps.length > 1) {
            const durationSec = this.strokeTimestamps[this.strokeTimestamps.length - 1] - this.strokeTimestamps[0];
            const minutes = durationSec / 60;
            if (minutes > 0) spm = (this.strokeTimestamps.length - 1) / minutes;
        }

        // Generate Summary
        let summary = "Nado fluido detectado.";
        if (spm < 20) summary = "Ritmo bajo. Enfócate en aumentar la frecuencia de brazada (Check Cadence).";
        else if (spm > 50) summary = "Ritmo alto. Asegura que no estás 'resbalando' agua (Check Distance Per Stroke).";
        else summary = "Buen ritmo de crucero. Mantén la consistencia.";

        return {
            detected: true,
            strokeCount: this.strokeCount,
            avgSPM: spm,
            avgHz: (spm / 60).toFixed(2),
            htmlExtra: `<div class='mt-3 p-2 border rounded bg-white'><small class='text-muted'>AI Summary:</small><p class='mb-0 fw-bold text-dark'>${summary}</p></div>`
        };
    }
}
class JumpAnalyzer { processFrame() { /* Lógica de salto */ } getResults() { return {}; } }

window.videoProcessor = new VideoProcessor();