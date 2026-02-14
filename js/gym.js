document.addEventListener('DOMContentLoaded', () => {
    const videoEl = document.getElementById('gymVideoPlayer');
    const canvasEl = document.getElementById('gymCanvas');
    const btnCamera = document.getElementById('btnGymCamera');
    const calibrationOverlay = document.getElementById('gymCalibrationOverlay');

    // --- 1. LOGICA DE CÁMARA ---
    if (btnCamera) {
        btnCamera.addEventListener('click', async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
            videoEl.srcObject = stream;
            document.getElementById('gymUploadArea').classList.add('d-none');
            document.getElementById('gymOverlay').classList.remove('d-none');
            videoProcessor.start(videoEl, canvasEl);
        });
    }

    // --- 2. ESCUCHAR EVENTOS DEL MOTOR ---
    window.addEventListener('gym-data', (e) => {
        const data = e.detail;
        if (data.type === 'FRAME') {
            document.getElementById('hudRepCounter').innerText = data.reps;
            document.getElementById('hudMetricAngle').innerText = data.angle + "°";
        }

        if (data.type === 'CALIBRATION_START') {
            calibrationOverlay.classList.replace('d-none', 'd-flex');
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

    // --- 3. CALCULADORAS (RM, BMI) ---
    initCalculators();
});

function initCalculators() {
    document.getElementById('btnCalcRm')?.addEventListener('click', () => {
        const w = parseFloat(document.getElementById('inputRmWeight').value);
        const r = parseFloat(document.getElementById('inputRmReps').value);
        if (w && r) {
            const rm = w * (1 + r / 30);
            document.getElementById('res1rm').innerText = rm.toFixed(1);
        }
    });

    document.getElementById('btnCalcBmi')?.addEventListener('click', () => {
        const h = parseFloat(document.getElementById('inputBmiHeight').value) / 100;
        const w = parseFloat(document.getElementById('inputBmiWeight').value);
        if (h && w) {
            const bmi = w / (h * h);
            document.getElementById('resBmiVal').innerText = bmi.toFixed(1);
        }
    });
}