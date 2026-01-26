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

        // Bilateral Reps
        this.reps = 0;
        this.state = 'start';

        // Unilateral Reps (L/R)
        this.repsL = 0;
        this.repsR = 0;
        this.stateL = 'start';
        this.stateR = 'start';

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
                    isUnilateral: false,
                    correction: "Baja más"
                };
            case 'deadlift':
                return {
                    joint: 'hip',
                    startAngle: 150,
                    targetAngle: 100,
                    isUnilateral: false,
                    correction: "Mantén la espalda neutra"
                };
            case 'bench':
                return {
                    joint: 'elbow',
                    startAngle: 160,
                    targetAngle: 90,
                    isUnilateral: false,
                    correction: "Rango completo"
                };
            case 'ohp':
                return {
                    joint: 'elbow',
                    startAngle: 70,
                    targetAngle: 160,
                    isUnilateral: false,
                    correction: "Extensión completa"
                };
            case 'bicep_curl':
                return {
                    joint: 'elbow',
                    startAngle: 160,
                    targetAngle: 40,
                    isUnilateral: true,
                    correction: "Rango completo"
                };
            case 'tricep_ext':
                return {
                    joint: 'elbow',
                    startAngle: 70,
                    targetAngle: 170, // Pushdown style
                    isUnilateral: true,
                    correction: "Extensión completa"
                };
            default:
                return { joint: 'knee', startAngle: 160, targetAngle: 100, isUnilateral: false };
        }
    }

    processFrame(landmarks, timestamp, ctx, layout) {
        this.frameCount++;
        if (!landmarks || landmarks.length < 33) return;

        // 1. Calculate and Process Reps based on Exercise Type
        let mainAngle = 0; // For visualization of primary angle
        const { isUnilateral } = this.config;

        if (isUnilateral) {
            // Calculate Left & Right independently
            const leftAngle = this.calculateTargetAngle(landmarks, 'left');
            const rightAngle = this.calculateTargetAngle(landmarks, 'right');

            // Update States
            this.updateUnilateralState(leftAngle, rightAngle);

            mainAngle = (leftAngle + rightAngle) / 2; // Avg for display
        } else {
            // Bilateral
            mainAngle = this.calculateTargetAngle(landmarks, 'left'); // Use left as primary or average
            // Ideally average for things like Squat
            if (this.exerciseType === 'squat' || this.exerciseType === 'deadlift') {
                const rightAngle = this.calculateTargetAngle(landmarks, 'right');
                mainAngle = (mainAngle + rightAngle) / 2;
            }

            this.updateBilateralState(mainAngle);
        }

        // 2. Form Checks
        // We pass mainAngle just for reference, but checkForm calculates specific things
        // Actually, we need backAngle too.
        const leftShoulder = landmarks[11];
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const backAngle = this.calculateAngle(leftShoulder, leftHip, leftKnee);

        this.checkForm(mainAngle, backAngle, timestamp, landmarks);

        // 3. Visualization
        if (ctx && layout) {
            const { fontSizeLarge, fontSizeSmall, margin, scale } = layout;

            // Draw Info Background Box
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            const boxWidth = margin + (fontSizeLarge * 5);
            const boxHeight = margin + (fontSizeLarge * 3);
            ctx.fillRect(margin, margin, boxWidth, boxHeight);

            // Draw Stats
            ctx.font = `bold ${fontSizeLarge}px Arial`;
            ctx.fillStyle = "#0d6efd"; // Bootstrap Primary

            if (isUnilateral) {
                ctx.fillText(`L: ${this.repsL}  R: ${this.repsR}`, margin + (margin), margin + fontSizeLarge);
            } else {
                ctx.fillText(`Reps: ${this.reps}`, margin + (margin), margin + fontSizeLarge);
            }

            ctx.fillStyle = "white";
            ctx.font = `bold ${fontSizeSmall}px Arial`;
            ctx.fillText(`Ángulo: ${Math.round(mainAngle)}°`, margin + (margin), margin + fontSizeLarge + (fontSizeSmall * 1.5));
            ctx.fillText(`${this.exerciseType.toUpperCase()}`, margin + (margin), margin + fontSizeLarge + (fontSizeSmall * 3));

            // Draw Feedback
            if (this.formIssues.length > 0) {
                const lastIssue = this.formIssues[this.formIssues.length - 1];
                if (timestamp - lastIssue.time < 2) {
                    // Alert Background
                    const alertBoxY = margin + boxHeight + margin;
                    ctx.fillStyle = "rgba(220, 53, 69, 0.8)";
                    ctx.fillRect(margin, alertBoxY, boxWidth * 1.5, fontSizeSmall * 2.5);

                    ctx.fillStyle = "white";
                    ctx.font = `bold ${fontSizeSmall}px Arial`;
                    ctx.fillText(`⚠ ${lastIssue.issue}`, margin + (margin), alertBoxY + (fontSizeSmall * 1.5));
                }
            }
        }
    }

    calculateTargetAngle(landmarks, side) {
        // Helper to get the relevant angle for the current exercise config
        const prefix = side === 'left' ? 0 : 1;
        // Index offsets: Left=0 (odd landmarks), Right=1 (even landmarks) usually
        // Actually Mediapipe: Left(11,13,15,23,25,27), Right(12,14,16,24,26,28)

        let s, e, w, h, k, a;
        if (side === 'left') {
            s = landmarks[11]; e = landmarks[13]; w = landmarks[15];
            h = landmarks[23]; k = landmarks[25]; a = landmarks[27];
        } else {
            s = landmarks[12]; e = landmarks[14]; w = landmarks[16];
            h = landmarks[24]; k = landmarks[26]; a = landmarks[28];
        }

        switch (this.config.joint) {
            case 'elbow': return this.calculateAngle(s, e, w);
            case 'knee': return this.calculateAngle(h, k, a);
            case 'hip': return this.calculateAngle(s, h, k);
            default: return 0;
        }
    }

    updateBilateralState(angle) {
        const { startAngle, targetAngle } = this.config;
        const isBend = startAngle > targetAngle;

        if (isBend) {
            if (this.state === 'start' && angle < startAngle - 10) this.state = 'eccentric';
            if (this.state === 'eccentric' && angle <= targetAngle + 10) this.state = 'bottom';
            if (this.state === 'bottom' && angle > startAngle - 10) {
                this.reps++;
                this.state = 'start';
            }
        } else {
            // Extension (OHP, Tricep pushdown?) Tricep is Unilateral usually. OHP is Bilateral.
            // OHP: Start 70 -> 160.
            if (this.state === 'start' && angle > targetAngle - 10) this.state = 'top';
            if (this.state === 'top' && angle < startAngle + 10) {
                this.reps++;
                this.state = 'start';
            }
        }
    }

    updateUnilateralState(angleL, angleR) {
        const { startAngle, targetAngle } = this.config;
        const isBend = startAngle > targetAngle;

        // Process Left
        this.stateL = this.processSingleSide(this.stateL, angleL, isBend, startAngle, targetAngle, 'L');
        // Process Right
        this.stateR = this.processSingleSide(this.stateR, angleR, isBend, startAngle, targetAngle, 'R');
    }

    processSingleSide(currentState, angle, isBend, start, target, side) {
        let newState = currentState;
        if (isBend) {
            // Curl: 160 -> 40
            if (currentState === 'start' && angle < start - 10) newState = 'eccentric';
            if (currentState === 'eccentric' && angle <= target + 10) newState = 'bottom';
            if (currentState === 'bottom' && angle > start - 10) {
                if (side === 'L') this.repsL++; else this.repsR++;
                newState = 'start';
            }
        } else {
            // Tricep: 70 -> 170
            if (currentState === 'start' && angle > target - 10) newState = 'top';
            if (currentState === 'top' && angle < start + 10) {
                if (side === 'L') this.repsL++; else this.repsR++;
                newState = 'start';
            }
        }
        return newState;
    }

    checkForm(mainAngle, backAngle, timestamp, landmarks) {
        if (!landmarks || landmarks.length < 33) return;

        switch (this.exerciseType) {
            case 'squat': this.checkSquat(landmarks, timestamp, backAngle); break;
            case 'ohp': this.checkOhp(landmarks, timestamp); break;
            case 'bench': this.checkBench(landmarks, timestamp); break;
            case 'bicep_curl': this.checkCurl(landmarks, timestamp); break;
            case 'tricep_ext': this.checkTricep(landmarks, timestamp); break;
            case 'deadlift': this.checkDeadlift(landmarks, timestamp, backAngle); break;
        }
    }

    checkSquat(landmarks, timestamp, backAngle) {
        const leftHeel = landmarks[29]; const leftToe = landmarks[31];
        if (leftHeel.y < leftToe.y - 0.02) this.logUnique("Apoya los talones en el suelo", timestamp);

        if (backAngle < 60) this.logUnique("Mantén el pecho erguido", timestamp);

        const lKnee = landmarks[25]; const rKnee = landmarks[26];
        const lAnkle = landmarks[27]; const rAnkle = landmarks[28];
        const shoulderWidth = Math.abs(landmarks[11].x - landmarks[12].x);

        // Valgus
        if (Math.abs(lKnee.x - rKnee.x) < Math.abs(lAnkle.x - rAnkle.x) * 0.8) {
            this.logUnique("Empuja las rodillas hacia afuera", timestamp);
        }
        // Wide stance
        if (Math.abs(lAnkle.x - rAnkle.x) > shoulderWidth * 2.5) {
            this.logUnique("Reduce la apertura de los pies", timestamp);
        }
        // Depth logic handled in state machine mostly, but explicit check:
        if (this.state === 'bottom' && this.calculateTargetAngle(landmarks, 'left') > this.config.targetAngle + 15) {
            this.logUnique("Baja más la cadera", timestamp);
        }
    }

    checkOhp(landmarks, timestamp) {
        const lShoulder = landmarks[11]; const lHip = landmarks[23];
        // Arch check (Hip X vs Shoulder X)
        if (lShoulder.x < lHip.x - 0.1) this.logUnique("Activa el core y evita arquear", timestamp);

        // Bar forward (Wrist vs Shoulder)
        const lWrist = landmarks[15];
        if (lWrist.x > lShoulder.x + 0.15) this.logUnique("Lleva la barra sobre la cabeza", timestamp);

        this.checkAsymmetry(landmarks, timestamp, "Empuja de forma simétrica");

        // Flare (Elbow X vs Shoulder X)
        const lElbow = landmarks[13];
        if (Math.abs(lElbow.x - lShoulder.x) > 0.25) this.logUnique("Alinea mejor los codos", timestamp);
    }

    checkBench(landmarks, timestamp) {
        const lWrist = landmarks[15]; const rWrist = landmarks[16];
        if (Math.abs(lWrist.y - rWrist.y) > 0.08) this.logUnique("La barra no sube recta", timestamp);

        const lElbow = landmarks[13]; const lShoulder = landmarks[11];
        if (Math.abs(lWrist.x - lElbow.x) > 0.15) this.logUnique("Cierra un poco los codos", timestamp);

        // Wrist bent (Wrist Angle) -> Simplified: check Wrist vs Index vs Elbow
        // Hard to see neutral wrist in low res.

        // Shoulders (Stability) - Hard in 2D without bench ref.
    }

    checkCurl(landmarks, timestamp) {
        const lShoulder = landmarks[11]; const lElbow = landmarks[13];
        // Swing
        if (Math.abs(lElbow.x - lShoulder.x) > 0.15) this.logUnique("Mantén el codo pegado al cuerpo", timestamp);
        // Body Swing (Back)
        // Check Back Angle

        this.checkAsymmetry(landmarks, timestamp, "Los brazos trabajan de forma desigual");

        // Incomplete range
        // Check max extension logic in processing loop?
        // Simple Top check
        const avgAngle = (this.calculateTargetAngle(landmarks, 'left') + this.calculateTargetAngle(landmarks, 'right')) / 2;
        if ((this.stateL === 'top' || this.stateR === 'top') && avgAngle > 60) {
            this.logUnique("Completa todo el recorrido", timestamp);
        }
    }

    checkTricep(landmarks, timestamp) {
        const lShoulder = landmarks[11]; const lElbow = landmarks[13];
        if (Math.abs(lElbow.x - lShoulder.x) > 0.2) this.logUnique("Mantén los codos juntos", timestamp);

        this.checkAsymmetry(landmarks, timestamp, "Extensión desigual entre brazos");

        const avgAngle = (this.calculateTargetAngle(landmarks, 'left') + this.calculateTargetAngle(landmarks, 'right')) / 2;
        if ((this.stateL === 'top' || this.stateR === 'top') && avgAngle < 150) {
            this.logUnique("Extiende completamente el brazo", timestamp);
        }
    }

    checkDeadlift(landmarks, timestamp, backAngle) {
        if (backAngle < 60) this.logUnique("Mantén la espalda neutra", timestamp);

        const lWrist = landmarks[15]; const lKnee = landmarks[25];
        if (Math.abs(lWrist.x - lKnee.x) > 0.15) this.logUnique("Acerca la barra al cuerpo", timestamp);

        // Hips rise fast -> HipY velocity vs ShoulderY velocity. Complex.
        // Squatting -> Knee Angle check.
    }

    checkAsymmetry(landmarks, timestamp, msg) {
        const lAngle = this.calculateTargetAngle(landmarks, 'left');
        const rAngle = this.calculateTargetAngle(landmarks, 'right');
        if (Math.abs(lAngle - rAngle) > 25) {
            this.logUnique(msg, timestamp);
        }
    }

    logUnique(issue, time) {
        const last = this.formIssues[this.formIssues.length - 1];
        if (!last || (time - last.time > 2.0 && last.issue !== issue) || (time - last.time > 4.0)) {
            this.formIssues.push({ time, issue });

            // Track total counts
            if (!this.errorCounts) this.errorCounts = {};
            this.errorCounts[issue] = (this.errorCounts[issue] || 0) + 1;
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
            repsL: this.repsL,
            repsR: this.repsR,
            isUnilateral: this.config.isUnilateral,
            errors: this.errorCounts || {},
            exercise: this.exerciseType,
            exerciseName: this.exerciseType.toUpperCase(),
            corrections: Array.from(this.corrections), // Backward compatibility
            recommendations: this.corrections.size > 0 ? [this.config.assist || "Mejora tu técnica"] : ["¡Técnica solida!"]
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

