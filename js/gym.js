document.addEventListener('DOMContentLoaded', () => {
    const videoEl = document.getElementById('gymVideoPlayer');
    const canvasEl = document.getElementById('gymCanvas');
    const btnCamera = document.getElementById('btnGymCamera');
    const calibrationOverlay = document.getElementById('gymCalibrationOverlay');

    // --- 1. LOGICA DE CÁMARA Y ARCHIVO ---
    const btnSelectFile = document.getElementById('btnGymSelectFile');
    const fileInput = document.getElementById('gymVideoInput');
    const btnAnalyze = document.getElementById('btnAnalyzeGym');

    // Camera
    if (btnCamera) {
        btnCamera.addEventListener('click', async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
            videoEl.srcObject = stream;
            startAnalysis();
        });
    }

    // File Upload
    if (btnSelectFile && fileInput) {
        btnSelectFile.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                videoEl.src = url;
                btnAnalyze.disabled = false;
                // Optional: Preview functionality could be added here
            }
        });
    }

    // Start Analysis Button
    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
            startAnalysis();
        });
    }

    // Dynamic Exercise Switching
    const exerciseSelect = document.getElementById('gymExerciseSelect');
    if (exerciseSelect) {
        exerciseSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (videoProcessor && videoProcessor.activeAnalyzer && typeof videoProcessor.activeAnalyzer.setExerciseType === 'function') {
                videoProcessor.activeAnalyzer.setExerciseType(val);
            }
        });
    }

    async function startAnalysis() {
        document.getElementById('gymUploadArea').classList.add('d-none');
        document.getElementById('gymOverlay').classList.remove('d-none');
        if (powerChart) powerChart.resize();

        try {
            await videoProcessor.start(videoEl, canvasEl);
        } catch (err) {
            console.error("Error starting analysis:", err);
            alert("Error starting video analysis. Please check the console for details.");
            // Reset UI if failed
            document.getElementById('gymUploadArea').classList.remove('d-none');
            document.getElementById('gymOverlay').classList.add('d-none');
        }
    }

    // --- 1.2 CHART INITIALIZATION ---
    let powerChart = null;
    const ctxPower = document.getElementById('gymPowerChart')?.getContext('2d');
    if (ctxPower) {
        powerChart = new Chart(ctxPower, {
            type: 'line',
            data: {
                labels: Array(50).fill(''),
                datasets: [{
                    label: 'Power (W)',
                    data: Array(50).fill(0),
                    borderColor: '#ffc107',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true,
                    backgroundColor: 'rgba(255, 193, 7, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0 }
                },
                animation: false
            }
        });
    }

    // --- 2. ESCUCHAR EVENTOS DEL MOTOR ---
    window.addEventListener('gym-data', (e) => {
        const data = e.detail;
        if (data.type === 'FRAME') {
            // REPS
            const repEl = document.getElementById('hudRepCounter');
            repEl.innerText = data.reps;
            // Adjust font if bilateral
            if (data.bilateral) {
                repEl.classList.remove('display-4');
                repEl.classList.add('fs-2', 'lh-sm');
            } else {
                repEl.classList.add('display-4');
                repEl.classList.remove('fs-2', 'lh-sm');
            }

            // EXERCISE NAME
            const nameEl = document.getElementById('hudExerciseName');
            if (nameEl && data.exerciseName) {
                nameEl.innerText = data.exerciseName;
            }

            // ANGLE
            // Note: The previous code overwrote the entire hudMetricAngle div, removing the label. 
            // We should try to target 'hudAngleMain' if it exists, otherwise fallback.
            const angleValEl = document.getElementById('hudAngleMain');
            if (angleValEl) {
                if (data.bilateral) {
                    angleValEl.classList.replace('display-6', 'fs-4');
                    // Apply colors for bilateral display: Left(Green), Right(Red)
                    angleValEl.innerHTML = `<span class="text-success">${data.angle.split('|')[0]}</span> | <span class="text-danger">${data.angle.split('|')[1]}</span>`;
                } else {
                    angleValEl.classList.replace('fs-4', 'display-6');
                    angleValEl.innerText = data.angle; // data.angle now includes "°"
                }
            } else {
                document.getElementById('hudMetricAngle').innerText = data.angle + (data.bilateral ? "" : "°");
            }


            // Update Power Chart
            if (powerChart && data.power !== undefined) {
                const chartData = powerChart.data.datasets[0].data;
                chartData.shift();
                chartData.push(data.power);
                powerChart.update();
            }

            // --- RECORDING BUFFER & REP CHECK ---
            if (isRecording) {
                if (data.trackingPoint) {
                    recordingBuffer.push(data.trackingPoint);
                }

                // Check Rep Goal
                if (goalType === 'reps' && goalValue > 0) {
                    // Parse current reps
                    const currentRepsObj = parseReps(data.reps.toString());
                    const currentTotal = currentRepsObj.isBilateral ? (currentRepsObj.left + currentRepsObj.right) : currentRepsObj.count;

                    // Update Text to show progress? e.g. "3/10"
                    if (recTimerDisplay) recTimerDisplay.innerText = `${currentTotal} / ${goalValue} Re`;

                    if (currentTotal >= goalValue) {
                        stopRecording();
                    }
                }
            }
        }

        if (data.type === 'CALIBRATION_START') {
            calibrationOverlay.classList.replace('d-none', 'd-flex');
        }

        if (data.type === 'CALIBRATION_FEEDBACK') {
            const overlay = document.getElementById('gymCalibrationOverlay');
            if (overlay) {
                overlay.classList.replace('d-none', 'd-flex');
                const h3 = overlay.querySelector('h3');
                const p = overlay.querySelector('p');
                const icon = overlay.querySelector('ion-icon');

                if (h3) h3.innerText = data.msg;

                // Update Color/Icon based on state
                if (data.color === 'success') {
                    if (icon) icon.className = `display-1 text-success mb-3`;
                    if (icon) icon.name = 'checkmark-circle-outline';
                } else {
                    if (icon) icon.className = `display-1 text-danger mb-3 spin-slow`;
                    if (icon) icon.name = 'scan-circle-outline';
                }
            }
        }

        if (data.type === 'CALIBRATION_COMPLETE') {
            calibrationOverlay.classList.replace('d-flex', 'd-none');
        }

        if (data.type === 'FEEDBACK') {
            const area = document.getElementById('hudFeedbackArea');
            const toast = document.createElement('div');
            toast.className = `badge bg-${data.color} p-2 animate-slide-in`;
            toast.innerText = data.msg;
            area.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    });

    // --- 3. RECORDING & SUMMARY LOGIC ---
    let isRecording = false;
    let recordingBuffer = []; // Stores {x, y} for trajectory
    let sessionStartReps = 0; // Keeping this for manual check, but we use hard reset now.

    // Goal Variables
    let goalType = 'manual'; // manual, time, reps
    let goalValue = 0;

    let sessionTimerInterval = null;
    let sessionStartTime = 0;

    // UI Elements
    const btnRec = document.getElementById('btnGymRec');
    const btnStop = document.getElementById('btnGymStop');
    const recIndicator = document.getElementById('gymRecIndicator');
    const recTimerDisplay = document.getElementById('gymRecTimer');

    // New Goal Elements
    const goalTypeSelect = document.getElementById('gymGoalType');
    const goalValueInput = document.getElementById('gymGoalValue');
    const goalUnitLabel = document.getElementById('gymGoalUnitLabel');

    const countdownOverlay = document.getElementById('gymCountdown');
    const countdownText = document.getElementById('gymCountdownText');
    const summaryModal = document.getElementById('gymSummaryModal');
    const btnSumDiscard = document.getElementById('btnSumDiscard');
    const btnSumSave = document.getElementById('btnSumSave');

    // UI Logic for Goal Input
    if (goalTypeSelect && goalValueInput) {
        goalTypeSelect.addEventListener('change', () => {
            const val = goalTypeSelect.value;
            // Update Label
            if (goalUnitLabel) {
                if (val === 'time') goalUnitLabel.innerText = 'SEGUNDOS';
                else if (val === 'reps') goalUnitLabel.innerText = 'REPETICIONES';
                else goalUnitLabel.innerText = 'META';
            }

            if (val === 'manual') {
                goalValueInput.disabled = true;
                goalValueInput.value = '';
                goalValueInput.placeholder = '-';
            } else {
                goalValueInput.disabled = false;
                // Default Values per Request: Time=5, Reps=3
                const defaultVal = val === 'time' ? 5 : 3;
                goalValueInput.placeholder = defaultVal.toString();
                // Always set default if switching types or empty
                goalValueInput.value = defaultVal;
            }
        });

        // Trigger on load to set defaults
        goalTypeSelect.dispatchEvent(new Event('change'));
    }

    if (btnRec) {
        btnRec.addEventListener('click', () => {
            // Capture Goal
            if (goalTypeSelect) goalType = goalTypeSelect.value;
            if (goalValueInput) goalValue = parseInt(goalValueInput.value) || 0;

            startCountdown();
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            stopRecording();
        });
    }

    function startCountdown() {
        countdownOverlay.classList.remove('d-none');
        countdownOverlay.classList.add('d-flex');

        // Get Countdown Duration from UI
        const durationSelect = document.getElementById('gymCountdownSelect');
        let count = durationSelect ? (parseInt(durationSelect.value) || 3) : 3;

        countdownText.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.innerText = count;
            } else {
                clearInterval(interval);
                countdownText.innerText = "GO!";
                setTimeout(() => {
                    countdownOverlay.classList.add('d-none');
                    countdownOverlay.classList.remove('d-flex');
                    startRecordingSession();
                }, 500);
            }
        }, 1000);
    }

    function startRecordingSession() {
        isRecording = true;
        recordingBuffer = [];

        // Hard Reset & Start Session in Processor (Strict Mode)
        if (videoProcessor && videoProcessor.activeAnalyzer) {
            if (typeof videoProcessor.activeAnalyzer.startSession === 'function') {
                // Pass goalValue (Target Reps) if in Reps mode, otherwise 0 or null
                const targetReps = goalType === 'reps' ? goalValue : 0;
                videoProcessor.activeAnalyzer.startSession(targetReps);
            } else if (typeof videoProcessor.activeAnalyzer.resetCounters === 'function') {
                videoProcessor.activeAnalyzer.resetCounters();
            }
        }

        // Update UI
        btnRec.classList.add('d-none');
        btnRec.classList.remove('d-flex');
        btnStop.classList.remove('d-none');
        btnStop.classList.add('d-flex');
        recIndicator.classList.remove('d-none');
        recIndicator.classList.add('d-flex');

        // Start Timer / Monitor
        sessionStartTime = Date.now();
        updateRecordingDisplay(0, 0); // Initial

        sessionTimerInterval = setInterval(() => {
            const elapsed = (Date.now() - sessionStartTime) / 1000;

            if (goalType === 'time' && goalValue > 0) {
                const remaining = goalValue - elapsed;
                updateRecordingDisplay(Math.ceil(remaining), 0);

                if (remaining <= 0) {
                    stopRecording();
                }
            } else {
                // Manual or Reps Mode: Show elapsed time
                updateRecordingDisplay(Math.floor(elapsed), 0);
            }
        }, 100);
    }
    function updateRecordingDisplay(seconds, currentReps) {
        // We can update text based on mode
        let text = "";

        if (goalType === 'reps') {
            // Show Reps Progress if available (passed from gym-data)
            // But this function is called by timer... 
            // We should rely on the gym-data event to update rep progress text if needed.
            // For now, let's just show time as "00:05" for legacy or mixed?
            // Actually, in Reps mode, let's show Elapsed Time unless we have rep count passed
            // If currentReps is 0, maybe just show time? No, let's show time.
            // Goal Logic: "Show Time" always? 
            // The previous logic was:
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = Math.floor(seconds % 60).toString().padStart(2, '0');
            if (recTimerDisplay) recTimerDisplay.innerText = `${m}:${s}`;
        } else {
            // Time Mode
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = Math.floor(seconds % 60).toString().padStart(2, '0');
            if (recTimerDisplay) recTimerDisplay.innerText = `${m}:${s}`;
        }
    }

    function stopRecording() {
        isRecording = false;
        clearInterval(sessionTimerInterval);

        // Strict Stop Session
        if (videoProcessor && videoProcessor.activeAnalyzer && typeof videoProcessor.activeAnalyzer.stopSession === 'function') {
            videoProcessor.activeAnalyzer.stopSession();
        }

        // Pause Video (Freezes frame)
        videoEl.pause();

        // Get Final Reps (Since we did hard reset, hudRepCounter is the session total)
        // Parse again just in case
        const endRepsObj = parseReps(document.getElementById('hudRepCounter').innerText);
        const totalReps = endRepsObj.isBilateral ? (endRepsObj.left + endRepsObj.right) : endRepsObj.count;

        // Show Summary
        showSummary(totalReps);

        // Reset UI Buttons
        btnStop.classList.add('d-none');
        btnStop.classList.remove('d-flex');
        btnRec.classList.remove('d-none');
        btnRec.classList.add('d-flex'); // Restore flex
        recIndicator.classList.add('d-none');
        recIndicator.classList.remove('d-flex');
    }

    function parseReps(text) {
        // Handle "10" or "5 | 5"
        if (text.includes('|')) {
            const parts = text.split('|');
            return {
                left: parseInt(parts[0]) || 0,
                right: parseInt(parts[1]) || 0,
                isBilateral: true
            };
        }
        return { count: parseInt(text) || 0, isBilateral: false };
    }

    function calculateRepDelta(start, end) {
        if (start.isBilateral) {
            const l = (end.left - start.left);
            const r = (end.right - start.right);
            // Return total or split? Let's return total for simple summary
            return l + r;
        }
        return end.count - start.count;
    }

    function showSummary(totalReps) {
        summaryModal.classList.remove('d-none');
        summaryModal.classList.add('d-flex');

        document.getElementById('sumReps').innerText = totalReps;

        // Generate Trajectory
        drawSummaryCanvas();
    }

    function drawSummaryCanvas() {
        const sumCanvas = document.getElementById('gymSummaryCanvas');
        const ctx = sumCanvas.getContext('2d');

        // 1. Set Dimensions to match video
        sumCanvas.width = videoEl.videoWidth;
        sumCanvas.height = videoEl.videoHeight;

        // 2. Draw Frozen Frame (Video is paused)
        ctx.drawImage(videoEl, 0, 0, sumCanvas.width, sumCanvas.height);

        // 3. Overlay Darken
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, sumCanvas.width, sumCanvas.height);

        // 4. Draw Trajectory from Buffer
        if (recordingBuffer.length > 1) {
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Create Gradient (Green Start -> Red End)
            // or based on phase (Up/Down)? 
            // Simple Gradient based on time (index)

            for (let i = 0; i < recordingBuffer.length - 1; i++) {
                const p1 = recordingBuffer[i];
                const p2 = recordingBuffer[i + 1];

                ctx.beginPath();
                ctx.moveTo(p1.x * sumCanvas.width, p1.y * sumCanvas.height);
                ctx.lineTo(p2.x * sumCanvas.width, p2.y * sumCanvas.height);

                // Color mapping: 0% -> Green, 50% -> Yellow, 100% -> Red
                const progress = i / recordingBuffer.length;
                const r = Math.floor(progress * 255);
                const g = Math.floor((1 - progress) * 255);

                ctx.strokeStyle = `rgb(${r}, ${g}, 0)`; // Green to Red
                // Or use defined Gym Colors: Green (Start) -> Red (End) to see Fatigue?

                ctx.stroke();
            }

            // Draw Start and End Points
            const start = recordingBuffer[0];
            const end = recordingBuffer[recordingBuffer.length - 1];

            // Start Dot (Green)
            ctx.beginPath();
            ctx.arc(start.x * sumCanvas.width, start.y * sumCanvas.height, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();

            // End Dot (Red)
            ctx.beginPath();
            ctx.arc(end.x * sumCanvas.width, end.y * sumCanvas.height, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
            ctx.stroke();
        }
    }

    // Modal Actions
    if (btnSumDiscard) {
        btnSumDiscard.addEventListener('click', closeSummary);
    }
    if (btnSumSave) {
        btnSumSave.addEventListener('click', () => {
            alert("Sesión Guardada (Simulado)");
            closeSummary();
        });
    }

    function closeSummary() {
        summaryModal.classList.add('d-none');
        summaryModal.classList.remove('d-flex');
        // Resume Camera
        videoEl.play();
    }

    // --- 3. CALCULADORAS (RM, BMI) ---
    initCalculators();
});

function initCalculators() {
    document.getElementById('btnCalcRm')?.addEventListener('click', () => {
        const w = parseFloat(document.getElementById('inputRmWeight').value);
        const r = parseFloat(document.getElementById('inputRmReps').value);
        if (w && r) {
            // Brzycki Formula: RM = W * (36 / (37 - R))
            // Epley Formula (used before): RM = W * (1 + R/30) -> let's stick to Epley as it's simple
            const rm = w * (1 + r / 30);

            document.getElementById('res1rm').innerText = rm.toFixed(1);

            // Calculate percentages/other RMs
            // 3RM is approx 93% of 1RM
            document.getElementById('res3rm').innerText = (rm * 0.93).toFixed(1);
            // 5RM is approx 87% of 1RM
            document.getElementById('res5rm').innerText = (rm * 0.87).toFixed(1);
            // 10RM is approx 75% of 1RM
            const el10rm = document.getElementById('res10rm');
            if (el10rm) el10rm.innerText = (rm * 0.75).toFixed(1);

            // Training Zones
            const zoneStrength = document.getElementById('zoneStrength');
            if (zoneStrength) zoneStrength.innerText = `${(rm * 0.90).toFixed(0)} - ${rm.toFixed(0)} kg`;

            const zoneHyper = document.getElementById('zoneHyper');
            if (zoneHyper) zoneHyper.innerText = `${(rm * 0.70).toFixed(0)} - ${(rm * 0.85).toFixed(0)} kg`;

            const zoneEndurance = document.getElementById('zoneEndurance');
            if (zoneEndurance) zoneEndurance.innerText = `${(rm * 0.50).toFixed(0)} - ${(rm * 0.65).toFixed(0)} kg`;
        }
    });

    document.getElementById('btnCalcBmi')?.addEventListener('click', () => {
        const h = parseFloat(document.getElementById('inputBmiHeight').value) / 100;
        const w = parseFloat(document.getElementById('inputBmiWeight').value);
        if (h && w) {
            const bmi = w / (h * h);
            document.getElementById('resBmiVal').innerText = bmi.toFixed(1);

            // BMI Category
            let cat = 'Normal';
            if (bmi < 18.5) cat = 'Bajo peso';
            else if (bmi >= 25 && bmi < 30) cat = 'Sobrepeso';
            else if (bmi >= 30) cat = 'Obesidad';
            document.getElementById('resBmiCat').innerText = cat;
        }
    });

    // Zone Calculator (Average)
    document.getElementById('btnCalcZone')?.addEventListener('click', () => {
        const v1 = parseFloat(document.getElementById('inputZone1').value) || 0;
        const v2 = parseFloat(document.getElementById('inputZone2').value) || 0;

        const avg = (v1 + v2) / 2;

        const resEl = document.getElementById('resZone');
        if (resEl) resEl.innerText = avg.toFixed(1);
    });

    // W5 Load (Carga Total)
    document.getElementById('btnCalcCT')?.addEventListener('click', () => {
        const r = parseFloat(document.getElementById('inputCTReps').value) || 0;
        const s = parseFloat(document.getElementById('inputCTSer').value) || 0;
        const w = parseFloat(document.getElementById('inputCTWeight').value) || 0;

        const load = r * s * w;
        const loadEl = document.getElementById('resCTLoad');
        const unitEl = document.getElementById('resCTUnit'); // New element for unit

        loadEl.innerText = load.toFixed(0);
        if (unitEl) unitEl.innerText = 'kg';
    });

    // W5 Power Calculation
    document.getElementById('btnCalcPower')?.addEventListener('click', () => {
        const w = parseFloat(document.getElementById('inputWWeight').value) || 0;
        const reps = parseFloat(document.getElementById('inputWReps').value) || 0;
        const distCm = parseFloat(document.getElementById('inputCM').value) || 0;
        const pct = parseFloat(document.getElementById('inputPercentage').value) || 100;

        // Power = (Force * Distance) / Time
        // Force = Mass * g (9.8)
        // Distance = (distCm / 100) * reps
        // Time = 5 seconds (fixed per UI text)

        const force = w * 9.8;
        const totalDist = (distCm / 100) * reps;
        const work = force * totalDist;
        const power = work / 5; // Watts

        document.getElementById('potencia').innerText = power.toFixed(0);

        // Adjusted Power (Percentage)
        const adjPower = power * (pct / 100);
        document.getElementById('potenciap').innerText = adjPower.toFixed(0);

        // Store Power for Time Calc
        document.getElementById('gym-power-pane').dataset.lastPower = adjPower || power;
    });

    // Time Estimation
    document.getElementById('btnCalcTime')?.addEventListener('click', () => {
        const w = parseFloat(document.getElementById('inputWPWeight').value) || 0;
        const reps = parseFloat(document.getElementById('inputWPReps').value) || 0;
        const distCm = parseFloat(document.getElementById('inputCM').value) || 0; // Use same distance

        // Retrieve stored power
        const targetPower = parseFloat(document.getElementById('gym-power-pane').dataset.lastPower) || 0;

        if (targetPower > 0) {
            // Time = Work / Power
            const force = w * 9.8;
            const totalDist = (distCm / 100) * reps;
            const work = force * totalDist;
            const time = work / targetPower;

            document.getElementById('tiempo').innerText = time.toFixed(2);
        } else {
            alert("Please calculate Power first to establish a baseline.");
        }
    });
}