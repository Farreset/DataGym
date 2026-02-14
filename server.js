const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static assets from root (css, js)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
// Serve assets if they are in root (like icons if any, though likely in css) - generic static for root files
app.use(express.static(path.join(__dirname, 'public'))); // If public exists, otherwise just specific folders is safer to avoid exposing server.js if strictly mapped, but simpler:

// Explicit Routes for Clean URLs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.get('/swimming', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'swimming.html'));
});

app.get('/running', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'running.html'));
});

app.get('/plyometrics', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'plyometrics.html'));
});

app.get('/gym', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'gym.html'));
});

app.get('/routines', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'routines.html'));
});


// --- ExerciseDB API V2 Implementation ---
const fs = require('fs');

// Load Exercises Data
let exercisesData = [];
try {
    const dataPath = path.join(__dirname, 'server', 'data', 'exercises.json');
    if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        exercisesData = JSON.parse(rawData);
        console.log(`Loaded ${exercisesData.length} exercises from local DB.`);
    } else {
        console.warn("Warning: server/data/exercises.json not found. API will return empty results.");
    }
} catch (err) {
    console.error("Error loading exercises data:", err);
}

// 1. Get All Exercises
app.get('/exercises', (req, res) => {
    const limit = parseInt(req.query.limit) || 10000;
    const offset = parseInt(req.query.offset) || 0;

    const paginated = exercisesData.slice(offset, offset + limit);
    res.json(paginated);
});

// 2. Get Exercise by ID
app.get('/exercises/exercise/:id', (req, res) => {
    const id = req.params.id;
    const exercise = exercisesData.find(ex => ex.id === id);
    if (exercise) {
        res.json(exercise);
    } else {
        res.status(404).json({ error: 'Exercise not found' });
    }
});

// 3. Get Exercises by Name
app.get('/exercises/name/:name', (req, res) => {
    const name = req.params.name.toLowerCase();
    const filtered = exercisesData.filter(ex =>
        ex.name.toLowerCase().includes(name)
    );
    res.json(filtered);
});

// 4. Get Exercises by Target Muscle
app.get('/exercises/target/:target', (req, res) => {
    const target = req.params.target.toLowerCase();
    const filtered = exercisesData.filter(ex =>
        ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(target))
    );
    res.json(filtered);
});

// 5. Get Exercises by Body Part
app.get('/exercises/bodyPart/:bodyPart', (req, res) => {
    const bodyPart = req.params.bodyPart.toLowerCase();
    const filtered = exercisesData.filter(ex => {
        if (ex.bodyPart && ex.bodyPart.toLowerCase() === bodyPart) return true;
        // Fallback to searching in muscles if bodyPart specific field isn't reliable in our dataset
        if (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(bodyPart))) return true;
        return false;
    });
    res.json(filtered);
});

// 6. Get Exercises by Equipment
app.get('/exercises/equipment/:equipment', (req, res) => {
    const equipment = req.params.equipment.toLowerCase();
    const filtered = exercisesData.filter(ex =>
        ex.equipment && ex.equipment.toLowerCase() === equipment
    );
    res.json(filtered);
});


// --- Nutrition Engine Implementation ---
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory for processing
const { analyzeFoodImage } = require('./server/nutrition_agent');

app.post('/api/analyze-food', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Process image (In real app, send req.file.buffer to OpenAI)
        const analysis = await analyzeFoodImage(req.file.buffer);

        res.json(analysis);
    } catch (error) {
        console.error("Nutrition Analysis Error:", error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.get('/nutrition', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'nutrition.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});
