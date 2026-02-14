const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'exercises.json');

// Dictionaries
const bodyPartMap = {
    "waist": "cintura",
    "upper legs": "piernas superiores",
    "back": "espalda",
    "lower legs": "piernas inferiores",
    "chest": "pecho",
    "upper arms": "brazos superiores",
    "cardio": "cardio",
    "shoulders": "hombros",
    "lower arms": "brazos inferiores",
    "neck": "cuello"
};

const equipmentMap = {
    "body weight": "peso corporal",
    "cable": "cable",
    "leverage machine": "máquina de palanca",
    "assisted": "asistido",
    "medicine ball": "balón medicinal",
    "stability ball": "balón de estabilidad",
    "band": "banda elástica",
    "barbell": "barra",
    "rope": "cuerda",
    "dumbbell": "mancuernas",
    "ez curl bar": "barra z",
    "sled machine": "trineo",
    "kettlebell": "pesa rusa",
    "olympic barbell": "barra olímpica",
    "weighted": "lastrado",
    "bosu ball": "bosu",
    "resistance band": "banda de resistencia",
    "roller": "rodillo",
    "skierg machine": "máquina de esquí",
    "hammer": "martillo",
    "smith machine": "máquina smith",
    "wheel roller": "rueda abdominal",
    "stationary bike": "bicicleta estática",
    "tire": "neumático",
    "trap bar": "barra hexagonal",
    "elliptical machine": "elíptica",
    "stepmill machine": "máquina escaladora"
};

const muscleMap = {
    "abs": "abdominales",
    "abdominals": "abdominales",
    "adductors": "aductores",
    "biceps": "bíceps",
    "calves": "gemelos",
    "chest": "pecho",
    "forearms": "antebrazos",
    "glutes": "glúteos",
    "hamstrings": "isquiotibiales",
    "lats": "dorsales",
    "lower back": "lumbares",
    "middle back": "espalda media",
    "neck": "cuello",
    "quadriceps": "cuádriceps",
    "traps": "trapecios",
    "triceps": "tríceps",
    "shoulders": "hombros"
};

const commonTerms = {
    "Hold": "Sostén",
    "Lie down": "Recuéstate",
    "Stand": "Párate",
    "Lift": "Levanta",
    "Lower": "Baja",
    "Repeat": "Repite",
    "position": "posición",
    "starting position": "posición inicial",
    "legs": "piernas",
    "arms": "brazos",
    "hands": "manos",
    "knees": "rodillas",
    "floor": "suelo",
    "ground": "suelo",
    "weight": "peso",
    "dumbbells": "mancuernas",
    "barbell": "barra",
    "body": "cuerpo",
    "Keep": "Mantén",
    "Push": "Empuja",
    "Pull": "Tira",
    "Select": "Selecciona",
    "Sit": "Siéntate",
    "Return": "Regresa",
    "Switch": "Cambia",
    "Slowly": "Lentamente",
    "Breathe": "Respira",
    "Inhale": "Inhala",
    "Exhale": "Exhala",
    "Extension": "Extensión",
    "Flexion": "Flexión",
    "Press": "Press",
    "Curl": "Curl",
    "Squat": "Sentadilla",
    "Lunge": "Zancada",
    "Row": "Remo",
    "Deadlift": "Peso Muerto",
    "Bench": "Banco",
    "Fly": "Aperturas"
};

function translateText(text) {
    if (!text) return text;
    let translated = text;
    // Simple replace for known terms
    for (const [eng, esp] of Object.entries(commonTerms)) {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translated = translated.replace(regex, esp);
    }
    return translated;
}

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    let exercises = JSON.parse(rawData);

    exercises = exercises.map(ex => {
        // Translate Metadata
        if (ex.bodyPart && bodyPartMap[ex.bodyPart.toLowerCase()]) {
            ex.bodyPart = bodyPartMap[ex.bodyPart.toLowerCase()];
        }
        if (ex.equipment && equipmentMap[ex.equipment.toLowerCase()]) {
            ex.equipment = equipmentMap[ex.equipment.toLowerCase()];
        }
        if (ex.target && muscleMap[ex.target.toLowerCase()]) {
            ex.target = muscleMap[ex.target.toLowerCase()];
        }
        if (ex.primaryMuscles) {
            ex.primaryMuscles = ex.primaryMuscles.map(m => muscleMap[m.toLowerCase()] || m);
        }
        if (ex.secondaryMuscles) {
            ex.secondaryMuscles = ex.secondaryMuscles.map(m => muscleMap[m.toLowerCase()] || m);
        }

        // Translate Instructions
        if (ex.instructions) {
            ex.instructions = ex.instructions.map(instr => translateText(instr));
        }

        // Translate Name (Partial)
        // ex.name = translateText(ex.name); // Maybe risky to fully translate names? Let's try partial.
        // Example: "Dumbbell Curl" -> "Mancuernas Curl" (a bit weird). 
        // Let's stick to translating instructions and metadata for now, and maybe key terms in names.

        // Manual name fix for common patterns
        let name = ex.name;
        name = name.replace(/Dumbbell/gi, "con Mancuerna");
        name = name.replace(/Barbell/gi, "con Barra");
        name = name.replace(/Cable/gi, "en Cable");
        name = name.replace(/Band/gi, "con Banda");
        name = name.replace(/Kettlebell/gi, "con Pesa Rusa");
        name = name.replace(/Bodyweight/gi, "Peso Corporal");

        ex.name = name;

        return ex;
    });

    fs.writeFileSync(dataPath, JSON.stringify(exercises, null, 2));
    console.log(`Translated ${exercises.length} exercises.`);

} catch (err) {
    console.error("Error translating data:", err);
}
