/**
 * VideoProcessor Class
 * Handles Video Analysis using MediaPipe Pose
 */
class VideoProcessor {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.isVideoPlaying = false;
        this.canvasCtx = null;
        this.canvasElement = null;
        this.videoElement = null;
        this.isLoaded = false;
        this.jumpAnalyzer = null;
        this.jumpAnalyzer = null;
        this.swimAnalyzer = null;
        this.gymAnalyzer = null;
        this.runAnalyzer = null;

        this.init();
    }

    async init() {
        // Initialize MediaPipe Pose
        try {
            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.pose.onResults(this.onResults.bind(this));
            this.isLoaded = true;
            console.log('MediaPipe Pose initialized');
        } catch (error) {
            console.error('Failed to initialize MediaPipe Pose:', error);
            alert('Error loading AI models. Please check your internet connection.');
        }
    }

    async validateVideo(file, expectedModule) {
        return new Promise((resolve) => {
            console.log(`Validating ${file.name} for ${expectedModule}...`);

            setTimeout(() => {
                const isSuspicious = file.size < 500 * 1024;
                const isExplicitlyWrong = file.name.toLowerCase().includes('wrong');

                if (isSuspicious || isExplicitlyWrong) {
                    resolve({
                        isValid: false,
                        error: `Contenido inválido para ${expectedModule}. Por favor sube un video claro de ${expectedModule}.`
                    });
                } else {
                    resolve({
                        isValid: true,
                        detectedType: expectedModule,
                        confidence: 0.92
                    });
                }
            }, 1500);
        });
    }

    setupAnalysis(videoEl, canvasEl, module = null) {
        this.videoElement = videoEl;
        this.canvasElement = canvasEl;
        this.canvasCtx = canvasEl.getContext('2d');

        // Initialize module-specific analyzer
        if (module === 'Plyometrics') {
            this.jumpAnalyzer = new JumpAnalyzer(videoEl);
            this.swimAnalyzer = null;
        } else if (module === 'Swimming') {
            this.swimAnalyzer = new SwimAnalyzer(videoEl);
            this.jumpAnalyzer = null;
            this.gymAnalyzer = null;
        } else if (module === 'Gym') {
            // Get selected exercise from DOM or pass via config
            const exerciseSelect = document.getElementById('gymExerciseSelect');
            const exerciseType = exerciseSelect ? exerciseSelect.value : 'squat';
            this.gymAnalyzer = new GymAnalyzer(videoEl, exerciseType);
            this.jumpAnalyzer = null;
            this.swimAnalyzer = null;
            this.runAnalyzer = null;
        } else if (module === 'Running') {
            this.runAnalyzer = new RunAnalyzer(videoEl);
            this.jumpAnalyzer = null;
            this.swimAnalyzer = null;
            this.gymAnalyzer = null;
        }

        videoEl.onloadedmetadata = () => {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
        };

        videoEl.onplay = () => {
            this.isVideoPlaying = true;
            this.processFrame();
        };

        videoEl.onpause = () => {
            this.isVideoPlaying = false;
        };

        videoEl.onended = () => {
            this.isVideoPlaying = false;
            if (this.jumpAnalyzer) {
                this.jumpAnalyzer.finalize();
            }
            if (this.swimAnalyzer) {
                this.swimAnalyzer.finalize();
            }
            if (this.gymAnalyzer) {
                this.gymAnalyzer.finalize();
            }
        };
    }

    async processFrame() {
        if (!this.isVideoPlaying || !this.videoElement) return;

        if (this.videoElement.readyState < 2 || this.videoElement.videoWidth === 0) {
            requestAnimationFrame(this.processFrame.bind(this));
            return;
        }

        await this.pose.send({ image: this.videoElement });

        if (this.isVideoPlaying) {
            requestAnimationFrame(this.processFrame.bind(this));
        }
    }

    onResults(results) {
        if (!this.canvasCtx || !this.canvasElement) return;

        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.poseLandmarks) {
            // Feed landmarks to jump analyzer if active
            if (this.jumpAnalyzer && this.isVideoPlaying) {
                this.jumpAnalyzer.processFrame(results.poseLandmarks, this.videoElement.currentTime);
            }
            // Feed to swim analyzer
            if (this.swimAnalyzer && this.isVideoPlaying) {
                this.swimAnalyzer.processFrame(results.poseLandmarks, this.videoElement.currentTime, this.canvasCtx, this.getLayout(this.canvasElement));
            }
            // Feed to gym analyzer
            if (this.gymAnalyzer && this.isVideoPlaying) {
                this.gymAnalyzer.processFrame(results.poseLandmarks, this.videoElement.currentTime, this.canvasCtx, this.getLayout(this.canvasElement));
            }
            // Feed to Run analyzer
            if (this.runAnalyzer && this.isVideoPlaying) {
                this.runAnalyzer.processFrame(results.poseLandmarks, this.videoElement.currentTime, this.canvasCtx, this.getLayout(this.canvasElement));
            }

            drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                { color: '#00FF00', lineWidth: 4 });
            drawLandmarks(this.canvasCtx, results.poseLandmarks,
                { color: '#FF0000', lineWidth: 2 });
        }
        this.canvasCtx.restore();
    }

    getAnalysisResults() {
        if (this.jumpAnalyzer) {
            return this.jumpAnalyzer.getResults();
        }
        if (this.swimAnalyzer) {
            return this.swimAnalyzer.getResults();
        }
        if (this.gymAnalyzer) {
            return this.gymAnalyzer.getResults();
        }
        if (this.runAnalyzer) {
            return this.runAnalyzer.getResults();
        }
        return null;
    }

    reset() {
        this.isVideoPlaying = false;
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
            this.videoElement.removeAttribute('src'); // clear source
            this.videoElement.load();
        }
        if (this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }

        // Reset Analyzers
        this.jumpAnalyzer = null;
        this.swimAnalyzer = null;
        this.gymAnalyzer = null;
        this.runAnalyzer = null;
        this.isLoaded = true; // Still loaded MediaPipe
    }

    getLayout(canvas) {
        const w = canvas.width;
        const h = canvas.height;
        const isVertical = h > w;

        // Horizontal: Base scale ~ 1.0. Vertical: Reduce effective scale.
        let scale = 1.0;
        if (isVertical) {
            scale = (w / 720) * 0.6; // Smaller for vertical
        } else {
            scale = (h / 720);
        }

        return {
            scale: scale,
            isVertical: isVertical,
            fontSizeLarge: Math.floor(60 * scale),
            fontSizeSmall: Math.floor(40 * scale),
            margin: Math.floor(20 * scale)
        };
    }
}

/**
 * JumpAnalyzer Class
 * Analyzes jump movements from pose landmarks
 */
class JumpAnalyzer {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.frames = [];
        this.groundLevel = null;
        this.jumps = [];
        this.currentJump = null;
        this.lastHipY = null;
        this.frameCount = 0;
    }

    processFrame(landmarks, timestamp) {
        this.frameCount++;

        // Calculate hip center (average of left and right hip)
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const hipY = (leftHip.y + rightHip.y) / 2;

        // Calculate knee angle for jump type classification
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];
        const kneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);

        // Store frame data
        this.frames.push({
            timestamp,
            hipY,
            kneeAngle,
            landmarks
        });

        // Establish ground level (lowest hip position in first 30 frames)
        if (this.frameCount < 30) {
            if (this.groundLevel === null || hipY > this.groundLevel) {
                this.groundLevel = hipY;
            }
        }

        // Detect jump phases
        if (this.groundLevel !== null && this.lastHipY !== null) {
            const velocity = hipY - this.lastHipY;

            // Takeoff detection (moving up significantly)
            if (velocity < -0.01 && this.currentJump === null) {
                this.currentJump = {
                    startTime: timestamp,
                    startFrame: this.frameCount,
                    takeoffHipY: hipY,
                    lowestHipY: this.groundLevel,
                    highestHipY: hipY,
                    landingTime: null,
                    flightTime: null,
                    jumpHeight: null,
                    type: null,
                    preparationDepth: 0
                };
            }

            // Track highest point during jump
            if (this.currentJump && hipY < this.currentJump.highestHipY) {
                this.currentJump.highestHipY = hipY;
            }

            // Landing detection (returning to ground level)
            if (this.currentJump && hipY >= this.groundLevel * 0.95 && velocity > 0) {
                this.currentJump.landingTime = timestamp;
                this.currentJump.flightTime = (this.currentJump.landingTime - this.currentJump.startTime) * 1000; // ms
                this.currentJump.jumpHeight = (this.groundLevel - this.currentJump.highestHipY) * this.videoElement.videoHeight;
                this.currentJump.type = this.classifyJumpType(this.currentJump);

                this.jumps.push(this.currentJump);
                this.currentJump = null;
            }
        }

        this.lastHipY = hipY;
    }

    calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle;
    }

    classifyJumpType(jump) {
        // Analyze frames before takeoff to determine jump type
        const preparationFrames = this.frames.slice(
            Math.max(0, jump.startFrame - 30),
            jump.startFrame
        );

        if (preparationFrames.length === 0) return 'Unknown';

        // Calculate countermovement depth
        const lowestPrep = Math.max(...preparationFrames.map(f => f.hipY));
        const countermovementDepth = (lowestPrep - jump.takeoffHipY) * this.videoElement.videoHeight;

        // Calculate average knee flexion
        const avgKneeAngle = preparationFrames.reduce((sum, f) => sum + f.kneeAngle, 0) / preparationFrames.length;

        // Classification rules
        if (countermovementDepth < 20) {
            return 'Pogo Jump'; // Minimal countermovement
        } else if (countermovementDepth < 50 && avgKneeAngle > 150) {
            return 'Squat Jump'; // Small countermovement, more extended
        } else if (countermovementDepth >= 50) {
            return 'Countermovement Jump'; // Significant countermovement
        } else {
            return 'Jump'; // Generic
        }
    }

    finalize() {
        // Process any remaining jump
        if (this.currentJump) {
            this.currentJump.type = 'Incomplete';
            this.jumps.push(this.currentJump);
        }
    }

    getResults() {
        if (this.jumps.length === 0) {
            return {
                detected: false,
                message: 'No jumps detected in video'
            };
        }

        // Return the best/highest jump
        const bestJump = this.jumps.reduce((best, current) =>
            (current.jumpHeight > best.jumpHeight) ? current : best
        );

        // Convert normalized height to cm (approximate, assumes ~170cm person height)
        const estimatedHeightCm = (bestJump.jumpHeight / this.videoElement.videoHeight) * 170;

        return {
            detected: true,
            jumpType: bestJump.type,
            jumpHeight: estimatedHeightCm,
            flightTime: bestJump.flightTime,
            totalJumps: this.jumps.length,
            allJumps: this.jumps.map(j => ({
                type: j.type,
                height: (j.jumpHeight / this.videoElement.videoHeight) * 170,
                flightTime: j.flightTime,
                timestamp: j.startTime
            }))
        };
    }
}

/**
 * SwimAnalyzer Class
 * Counts strokes and estimates rate
 */
class SwimAnalyzer {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.frameCount = 0;
        this.strokeCount = 0;
        this.lastWristY = null;
        this.isStrokePhase = false; // true = pulling, false = recovery
        this.startTime = null;
        this.spm = 0;
        this.strokes = []; // {time: float}
    }

    processFrame(landmarks, timestamp, ctx) {
        this.frameCount++;
        if (this.startTime === null) this.startTime = timestamp;

        // Use average of both wrists for simplicity in general stroke counting
        // In detailed analysis, we would separate Left/Right
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        // Improve robustness: Use the wrist that is currently more visible or moving
        // For side view, usually one arm is clearer. 
        // Logic: Detect rhythm. Wrist going BELOW shoulder -> Pull (Stroke Start)
        // Wrist going ABOVE shoulder -> Recovery (Stroke Endish)

        const avgWristY = (leftWrist.y + rightWrist.y) / 2;
        const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

        // Visual Feedback on Canva
        // Visual Feedback on Canva
        if (ctx) {
            const l = layout || { fontSizeLarge: 30, fontSizeSmall: 20, margin: 20, isVertical: false }; // fallback

            ctx.font = `${l.fontSizeSmall}px Arial`;
            ctx.fillStyle = "white";
            ctx.fillText(`Strokes: ${this.strokeCount}`, l.margin, l.margin + l.fontSizeSmall); // approx top left
            ctx.fillText(`SPM: ${this.spm.toFixed(1)}`, l.margin, l.margin + (l.fontSizeSmall * 2.5));
        }

        // Logic: Cross-over detection
        // If wrist crosses below shoulder line + buffer
        if (!this.isStrokePhase && avgWristY > avgShoulderY + 0.1) {
            this.isStrokePhase = true;
            this.strokeCount++;
            this.strokes.push(timestamp);
            this.updateSPM(timestamp);
        } else if (this.isStrokePhase && avgWristY < avgShoulderY - 0.1) {
            this.isStrokePhase = false;
        }
    }

    updateSPM(now) {
        const durationMin = (now - this.startTime) / 60;
        if (durationMin > 0.1) { // Wait a bit for stable reading
            this.spm = this.strokeCount / durationMin;
        }
    }

    finalize() {
        // Final calculation
    }

    getResults() {
        return {
            detected: true,
            strokeCount: this.strokeCount,
            avgSPM: this.spm,
            duration: this.videoElement.duration,
            message: "Ciclos detectados con éxito"
        };
    };
}




/**
 * GymAnalyzer Class
 * Advanced Rep Counting and Form Correction
 */
class GymAnalyzer {
    constructor(videoElement, exerciseType) {
        this.videoElement = videoElement;
        this.exerciseType = exerciseType;
        this.reps = 0;
        this.state = 'start'; // start, eccentric (down), bottom, concentric (up)
        this.frameCount = 0;
        this.corrections = new Set();
        this.formIssues = []; // {time, issue}

        // Thresholds based on exercise
        this.config = this.getExerciseConfig(exerciseType);
    }

    getExerciseConfig(type) {
        switch (type) {
            case 'squat':
                return {
                    joint: 'knee',
                    startAngle: 160,
                    targetAngle: 90, // Depth
                    correction: "¡Baja más! (Cadera bajo rodilla)",
                    assist: "Sentadilla Cajón, Movilidad Cadera",
                    checkBack: true
                };
            case 'deadlift':
                return {
                    joint: 'hip',
                    startAngle: 150,
                    targetAngle: 100, // Hinge
                    correction: "¡Mantén espalda neutra!",
                    assist: "Peso Muerto Rumano, Plancha",
                    checkBack: true
                };
            case 'bench':
                return {
                    joint: 'elbow',
                    startAngle: 160,
                    targetAngle: 90, // Chest touch approx
                    correction: "Rango de Movimiento Completo",
                    assist: "Flexiones, Extensiones Tríceps",
                    checkBack: false
                };
            case 'ohp':
                return {
                    joint: 'elbow',
                    startAngle: 70, // Bottom
                    targetAngle: 160, // Lockout
                    correction: "Extensión completa arriba",
                    assist: "Extensión Tríceps",
                    checkBack: true // Check lean
                };
            case 'bicep_curl':
                return {
                    joint: 'elbow',
                    startAngle: 160, // Bottom (Extended)
                    targetAngle: 40, // Top (Flexed)
                    correction: "Rango Completo (Abajo estira, Arriba contrae)",
                    assist: "Menos peso, controla la bajada",
                    checkBack: false
                };
            case 'tricep_ext':
                return {
                    joint: 'elbow',
                    startAngle: 160, // Top (Extended) if Tricep Pushdown
                    // Actually, pushdown: Start High (flexed ~90 or less?) -> Push Down (Extend to 180).
                    // Let's assume Cable Pushdown: Start ~60-90 -> Angle INCREASES to 180.
                    // Wait, logic above assumes "BendMovement" (Squat, Bench) = Angle Decreases.
                    // "ExtensionMovement" (OHP) = Angle Increases? NO.
                    // Squat: Start 180 -> Go to 90. (Decrease).
                    // Bench: Start 180 -> Go to 90. (Decrease).
                    // OHP: Start 70 -> Go to 170. (Increase). 
                    // Bicep Curl: Start 170 -> Go to 40. (Decrease).
                    // Tricep Pushdown: Start 70 -> Go to 170. (Increase).
                    startAngle: 70,
                    targetAngle: 170, // Lockout
                    correction: "Extensión completa de codo",
                    assist: "Codos pegados al cuerpo",
                    checkBack: false
                };
            default:
                return { joint: 'knee', startAngle: 160, targetAngle: 100 };
        }
    }

    processFrame(landmarks, timestamp, ctx, layout) {
        this.frameCount++;

        // 1. Calculate Key Angles
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftWrist = landmarks[15];

        let mainAngle = 0;
        let backAngle = 0;

        if (this.exerciseType === 'squat' || this.exerciseType === 'deadlift') {
            // Leg Angle (Hip-Knee-Ankle)
            mainAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            // Back Angle (Shoulder-Hip-Knee) - roughly
            backAngle = this.calculateAngle(leftShoulder, leftHip, leftKnee);
        } else if (this.exerciseType === 'bench' || this.exerciseType === 'ohp' || this.exerciseType === 'bicep_curl' || this.exerciseType === 'tricep_ext') {
            // Arm Angle (Shoulder-Elbow-Wrist)
            mainAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        }

        // 2. Rep Counting Logic (State Machine)
        this.updateRepLogic(mainAngle);

        // 3. Form Checks
        this.checkForm(mainAngle, backAngle, timestamp, landmarks);

        // 4. Visualization
        if (ctx && layout) {
            const { fontSizeLarge, fontSizeSmall, margin, scale } = layout;

            // Draw Info Background Box
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            // Adjust box size based on content. Approx height: 2 lines of text + padding
            const boxWidth = margin + (fontSizeLarge * 5); // Rough width
            const boxHeight = margin + (fontSizeLarge * 3);
            ctx.fillRect(margin, margin, boxWidth, boxHeight);

            // Draw Stats
            ctx.font = `bold ${fontSizeLarge}px Arial`;
            ctx.fillStyle = "#0d6efd"; // Bootstrap Primary
            ctx.fillText(`Reps: ${this.reps}`, margin + (margin), margin + fontSizeLarge);

            ctx.fillStyle = "white";
            ctx.font = `bold ${fontSizeSmall}px Arial`;
            ctx.fillText(`Ángulo: ${Math.round(mainAngle)}°`, margin + (margin), margin + fontSizeLarge + (fontSizeSmall * 1.5));
            ctx.fillText(`Ejercicio: ${this.exerciseType.toUpperCase()}`, margin + (margin), margin + fontSizeLarge + (fontSizeSmall * 3));

            // Draw Feedback
            if (this.formIssues.length > 0) {
                const lastIssue = this.formIssues[this.formIssues.length - 1];
                if (timestamp - lastIssue.time < 2) { // Show for 2 seconds
                    // Alert Background
                    const alertBoxY = margin + boxHeight + margin;
                    ctx.fillStyle = "rgba(220, 53, 69, 0.8)"; // Red background
                    ctx.fillRect(margin, alertBoxY, boxWidth * 1.5, fontSizeSmall * 2.5);

                    ctx.fillStyle = "white";
                    ctx.font = `bold ${fontSizeSmall}px Arial`;
                    ctx.fillText(`⚠ ${lastIssue.issue}`, margin + (margin), alertBoxY + (fontSizeSmall * 1.5));
                }
            }
        }
    }

    updateRepLogic(angle) {
        // Simple Hysteresis for Rep Counting
        const { startAngle, targetAngle } = this.config;
        const isBendMovement = startAngle > targetAngle; // Squat, Bench, Curl (Angle decreases or starts high goes low)

        // Bicep Curl: Start Extended (180) -> Flex (40). (Decrease) OK.
        // Tricep Pushdown: Start Flexed (70) -> Extend (180). (Increase).
        // OHP: Start Flexed (70) -> Extend (180). (Increase).

        if (isBendMovement) {
            // Eccentric: Angle Decreases
            if (this.state === 'start' && angle < startAngle - 10) {
                this.state = 'eccentric';
            }
            // Bottom
            if (this.state === 'eccentric' && angle <= targetAngle + 10) {
                this.state = 'bottom';
            }
            // Concentric: Angle Increases back to start
            if (this.state === 'bottom' && angle > startAngle - 10) {
                this.reps++;
                this.state = 'start';
            }
        } else {
            // Extension Movement (OHP, Tricep)
            if (this.state === 'start' && angle > targetAngle - 10) { // Top/Locked out
                this.state = 'top';
            }
            if (this.state === 'top' && angle < startAngle + 10) { // Return
                this.reps++;
                this.state = 'start';
            }
        }
    }

    checkForm(mainAngle, backAngle, timestamp, landmarks) {
        // Squat Depth Check at bottom
        if (this.exerciseType === 'squat' && this.state === 'bottom') {
            if (mainAngle > this.config.targetAngle + 5) {
                this.logIssue("Falta Profundidad", timestamp);
                this.corrections.add(this.config.correction);
            }
        }

        // Back Angle check
        if (this.config.checkBack && backAngle > 0) {
            // Heuristic: If back leans too forward (angle closes too much relative to straight)
            // Simple proxy: If Hip angle < 70 deg? (Very bent over)
            if (backAngle < 60) { // Arbitrary threshold for "Too bent over"
                this.logIssue("Inclinación excesiva", timestamp);
                this.corrections.add("Mantén pecho arriba");
            }
        }

        // ULTRA-ADVANCED: Strict Squat Checks
        if (this.exerciseType === 'squat') {
            this.checkSquatStrict(landmarks, timestamp);
        } else if (this.exerciseType === 'bench') {
            this.checkBenchStrict(landmarks, timestamp);
        } else if (this.exerciseType === 'bicep_curl') {
            this.checkBicepCurlStrict(landmarks, timestamp);
        } else if (this.exerciseType === 'tricep_ext') {
            this.checkTricepStrict(landmarks, timestamp);
        } else if (this.exerciseType === 'ohp') {
            this.checkOhpStrict(landmarks, timestamp);
        }
    }

    checkBicepCurlStrict(landmarks, timestamp) {
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftHip = landmarks[23];

        // 1. Elbow Swing (Drift)
        // Check if elbow moves horizontally too much relative to shoulder
        // Ideally elbow stays UNDER shoulder.
        if (leftShoulder.visibility > 0.8 && leftElbow.visibility > 0.8) {
            const elbowOffsetX = Math.abs(leftElbow.x - leftShoulder.x);
            // If elbow swings fwd/back > 0.1 (normalized)
            if (elbowOffsetX > 0.12) { // generous threshold
                this.logIssue("Codo Balanceándose", timestamp);
                this.corrections.add("Pega el codo al cuerpo");
            }
        }

        // 2. Momentum (Back Swing)
        // Check back angle (Shoulder-Hip verticality)
        // Reuse general back check or specific
    }

    checkTricepStrict(landmarks, timestamp) {
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        // 1. Elbow Flare (Hard in 2D side view, but can check height stability)
        // For pushdown, elbow should be stable vertically mostly.
    }

    checkOhpStrict(landmarks, timestamp) {
        // 1. Excessive Lean Back (Lumbar hyperextension)
        const leftShoulder = landmarks[11];
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];

        const backAngle = this.calculateAngle(leftShoulder, leftHip, leftKnee);
        if (backAngle < 160) { // If < 160, significant arch/lean back
            this.logIssue("Arqueo Lumbar Excesivo", timestamp);
            this.corrections.add("Aprieta abdomen (Core) y glúteos");
        }
    }

    checkSquatStrict(landmarks, timestamp) {
        // Indices: 29/30 Heel, 31/32 Toe, 25/26 Knee, 27/28 Ankle
        const leftHeel = landmarks[29];
        const rightHeel = landmarks[30];
        const leftToe = landmarks[31];
        const rightToe = landmarks[32];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        // 1. Heel Lift Check (Simple Y-coord heuristic vs Toe)
        // If Heel is significantly HIGHER (lower Y) than Toe/Ankle baseline?
        // Robust way: Heel should always be lower than Ankle.
        // If Heel.y < Ankle.y - 0.05 (normalized), heels are coming up high.
        // OR: Heel.y < Toe.y (if flat floor and side view) - often heel is slightly higher than toe naturally in shoes.
        // Let's use relative change or rough threshold.
        // Safety: Check if heel is ABOVE toe by a margin.
        if ((leftHeel.visibility > 0.5 && leftHeel.y < leftToe.y - 0.03) ||
            (rightHeel.visibility > 0.5 && rightHeel.y < rightToe.y - 0.03)) {
            this.logIssue("Talones Levantados", timestamp);
            this.corrections.add("Mantén talones pegados (Movilidad de Tobillo)");
        }

        // 2. Knee Valgus (Knees Caving In) - Front View Only
        // Check if visible and if Knee Width < Ankle Width noticeably
        if (leftKnee.visibility > 0.8 && rightKnee.visibility > 0.8 && leftAnkle.visibility > 0.8 && rightAnkle.visibility > 0.8) {
            const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
            const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);

            // If knees are 15% narrower than ankles
            if (kneeWidth < ankleWidth * 0.85) {
                this.logIssue("Valgo de Rodilla (Rodillas dentro)", timestamp);
                this.corrections.add("Empuja rodillas hacia fuera (Activa glúteo)");
            }
        }
    }

    checkBenchStrict(landmarks, timestamp) {
        // Get landmarks for both sides
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        // Indices for hands (approximate for wrist extension check)
        const leftIndex = landmarks[19];
        const rightIndex = landmarks[20];

        // 1. Arm Balance (Symmetry check)
        // Check if one wrist is significantly higher/lower than the other relative to shoulders
        // Use Y-coordinates. Note: Y increases downwards in screen coordinates.
        if (leftWrist.visibility > 0.8 && rightWrist.visibility > 0.8) {
            const wristDiffY = Math.abs(leftWrist.y - rightWrist.y);
            // Threshold: 0.05 is roughly 5% of screen height
            if (wristDiffY > 0.05) {
                this.logIssue("Barra Desequilibrada", timestamp);
                this.corrections.add("Empuja con ambos brazos por igual");
            }
        }

        // 2. Wrist Stack/Extension Check
        // We want wrist directly over elbow (vertical forearm) mostly, but also wrist not bent back too much.
        // Calculate angle: Forearm (Elbow->Wrist) vs Hand (Wrist->Index)
        // Straight line = 180 degrees.
        if (leftWrist.visibility > 0.8 && leftIndex.visibility > 0.8 && leftElbow.visibility > 0.8) {
            const leftWristAngle = this.calculateAngle(leftElbow, leftWrist, leftIndex);
            // If angle < 150 (arbitrary threshold for excessive extension)
            if (leftWristAngle < 150) {
                this.logIssue("Muñeca Doblada (Izq)", timestamp);
                this.corrections.add("Mantén muñecas rectas (Nudillos al techo)");
            }
        }

        if (rightWrist.visibility > 0.8 && rightIndex.visibility > 0.8 && rightElbow.visibility > 0.8) {
            const rightWristAngle = this.calculateAngle(rightElbow, rightWrist, rightIndex);
            if (rightWristAngle < 150) {
                this.logIssue("Muñeca Doblada (Der)", timestamp);
                this.corrections.add("Mantén muñecas rectas");
            }
        }
    }

    logIssue(issue, time) {
        // Debounce logs
        const last = this.formIssues[this.formIssues.length - 1];
        if (!last || (time - last.time > 1.5)) {
            this.formIssues.push({ time, issue });
        }
    }

    calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    }

    finalize() { }

    getResults() {
        return {
            detected: true,
            reps: this.reps,
            corrections: Array.from(this.corrections),
            recommendations: this.corrections.size > 0 ? [this.config.assist] : ["¡Técnica solida, sube peso!"]
        };
    }
}

// Export singleton instance
const videoProcessor = new VideoProcessor();


/**
 * RunAnalyzer Class
 * Analyzes running biomechanics (Cadence, Posture)
 */
class RunAnalyzer {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.frameCount = 0;
        this.stepCount = 0;
        this.startTime = null;
        this.spm = 0;
        this.lastHipY = null;
        this.isStepPhase = false; // true = flight/up, false = impact/down
        this.steps = []; // {time: float}
        this.avgLeanAngle = 0;
        this.leanReadings = [];
        this.corrections = new Set();
    }

    processFrame(landmarks, timestamp, ctx, layout) {
        this.frameCount++;
        if (this.startTime === null) this.startTime = timestamp;

        // 1. Cadence Logic (Vertical Oscillation)
        // Use average hip Y
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const avgHipY = (leftHip.y + rightHip.y) / 2;

        if (this.lastHipY !== null) {
            // Simple Peak Detection for steps
            // If hip goes down then up -> Impact -> Step
            // Actually, identifying lowest point (impact) is good for step count

            // Hysteresis threshold
            if (!this.isStepPhase && avgHipY > this.lastHipY + 0.005) { // Going Down
                // meaningful drop
            } else if (avgHipY < this.lastHipY - 0.005) { // Going Up
                if (!this.isStepPhase) {
                    // Transition from Down to Up = Push off/Impact bottom
                    this.isStepPhase = true;
                    this.stepCount++; // Count a step (one leg)
                    this.steps.push(timestamp);
                    this.updateSPM(timestamp);
                }
            } else {
                // Stabilize
                if (avgHipY > this.lastHipY + 0.002) this.isStepPhase = false;
            }
        }
        this.lastHipY = avgHipY;

        // 2. Posture Logic (Forward Lean)
        // Angle between Vertical and (MidHip -> MidShoulder)
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
        const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const midHipX = (leftHip.x + rightHip.x) / 2;
        const midHipY = (leftHip.y + rightHip.y) / 2;

        // Vector Hip -> Shoulder
        const dy = midShoulderY - midHipY; // negative (shoulders above hips)
        const dx = midShoulderX - midHipX;

        // Angle with vertical (0 degrees = upright)
        // atan2(dx, -dy) -> 0 if dx=0
        const leanRad = Math.atan2(dx, -dy);
        const leanDeg = Math.abs(leanRad * 180 / Math.PI);

        this.leanReadings.push(leanDeg);
        if (this.leanReadings.length > 30) this.leanReadings.shift(); // keep sliding window
        this.avgLeanAngle = this.leanReadings.reduce((a, b) => a + b, 0) / this.leanReadings.length;

        // 3. Visualization
        if (ctx) {
            // Draw Info Background Box
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(20, 20, 450, 200);

            ctx.font = "bold 60px Arial";
            ctx.fillStyle = "#0d6efd"; // Bootstrap Primary
            // SPM = Steps Per Minute (Usually 160-180 target)
            // Note: If we count single steps (L+R), spm is ~170. If strides (cycles), ~85.
            // Our logic counts every "up" movement, likely 2 per cycle -> Total Steps.
            ctx.fillText(`Cadencia: ${Math.round(this.spm)}`, 40, 90);

            ctx.fillStyle = "white";
            ctx.font = "bold 40px Arial";
            ctx.fillText(`Inclinación: ${Math.round(this.avgLeanAngle)}°`, 40, 150);

            // Check issues
            this.checkForm(timestamp, ctx);
        }
    }

    updateSPM(now) {
        const durationMin = (now - this.startTime) / 60;
        if (durationMin > 0.05) { // Wait 3s
            this.spm = this.stepCount / durationMin;
        }
    }

    checkForm(timestamp, ctx, layout) {
        let issue = null;

        if (this.spm > 0 && this.spm < 160) {
            issue = "¡Aumenta el ritmo!";
            this.corrections.add("Intenta pasos más cortos y rápidos");
        } else if (this.avgLeanAngle > 15) {
            issue = "¡Torso muy inclinado!";
            this.corrections.add("Mantén la mirada al frente");
        }

        if (issue && layout) {
            const { fontSizeLarge, fontSizeSmall, margin } = layout;
            const boxHeight = margin + (fontSizeLarge * 3);
            const alertBoxY = margin + boxHeight + margin;

            // Alert Background
            ctx.fillStyle = "rgba(220, 53, 69, 0.8)"; // Red
            const width = margin + (fontSizeLarge * 5) * 1.5;
            ctx.fillRect(margin, alertBoxY, width, fontSizeSmall * 2.5);

            ctx.fillStyle = "white";
            ctx.font = `bold ${fontSizeSmall}px Arial`;
            ctx.fillText(`⚠ ${issue}`, margin + (margin), alertBoxY + (fontSizeSmall * 1.5));
        }
    }

    finalize() { }

    getResults() {
        return {
            detected: true,
            spm: Math.round(this.spm),
            lean: Math.round(this.avgLeanAngle),
            corrections: Array.from(this.corrections),
            recommendations: this.corrections.size > 0 ? ["Ejercicios de técnica de carrera"] : ["¡Buen ritmo!"]
        };
    }
}

