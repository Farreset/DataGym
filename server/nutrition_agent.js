/**
 * Antigravity Nutrition Engine (Mock / Simulation Mode)
 * Version 3.0 - Ruthless Auditor
 */

// Mock Response 3: "Forensic Entrecot" (High Precision - v2.0)
const MOCK_ENTRECOT = {
    // ... (Keep existing structure or minimized version for fallback if needed)
    "status": "SUCCESS",
    "detection_method": "FORENSIC_SCAN",
    "item_name": "Entrecot de Ternera con Patatas",
    "confidence": 0.98,
    "visual_evidence": {
        "portion_size": "Large (approx. 350g total)",
        "cooking_fat_detected": true,
        "warning": "High Sodium likely due to sauce sheen"
    },
    "nutritional_panel": {
        "calories": { "total": 850, "breakdown": "Meat: 450, Oil: 120, Potatoes: 280" },
        "macros": {
            "protein_g": 45,
            "carbs_g": 35,
            "fat_g": 52,
            "fiber_g": 4
        },
        "micros_detailed": [
            { "name": "Zinc", "amount": "6.5mg", "dv_percentage": 60, "function": "Hormonal Health & Immunity" },
            { "name": "Magnesium", "amount": "45mg", "dv_percentage": 12, "function": "Muscle Relaxation" },
            { "name": "Iron (Heme)", "amount": "3.2mg", "dv_percentage": 18, "function": "Oxygen Transport" },
            { "name": "Vitamin B12", "amount": "2.1µg", "dv_percentage": 90, "function": "Energy & Brain Health" }
        ]
    },
    "market_analysis": {
        "product_quality": "Premium (High Marbling detected)",
        "est_price_supermarket": "8.50 € / unidad",
        "est_price_restaurant": "24.00 € / plato",
        "price_per_kg_raw": "22.00 €/kg"
    },
    "health_verdict": {
        "score": 75,
        "tag": "ANABOLIC_DENSE",
        "advice": "Alta densidad nutricional (Zinc/Proteína). Cuidado con la grasa saturada si no entrenas hoy."
    },
    "shopping_list_match": [
        { "item": "Ternera (Lomo Alto)", "est_cost": "6.00€" },
        { "item": "Patatas Agria", "est_cost": "0.40€" }
    ]
};

// Mock Response 4: "Ruthless Rice" (v3.0 Audit)
const MOCK_RUTHLESS_AUDIT = {
    "status": "AUDIT_COMPLETE",
    "reset_previous_data": true,
    "dish_name": "Arroz blanco con brillo lipídico",
    "forensic_analysis": {
        "detected_mass_g": 350,
        "hidden_calories_detected": true,
        "evidence": "REFLEJO EXCESIVO en los granos indica >15ml de aceite añadido. La cohesión del grano sugiere ALTA carga glucémica."
    },
    "nutritional_fact_sheet": {
        "real_calories": 520,
        "macros": { "pro": "8g", "carb": "85g", "fat": "18g" },
        "micros_focus": [
            { "name": "Manganeso", "amount": "Alto", "function": "Metabolismo" },
            { "name": "Sodio", "amount": "Sospecha Alta", "function": "Retención de Líquidos" }
        ]
    },
    "market_valuation": {
        "est_cost_home": "0.80 €",
        "est_price_restaurant": "12.00 €",
        "ripoff_index": "HIGH (Ingredientes baratos, precio alto)"
    },
    "verdict_badge": "GLYCEMIC_BOMB",
    "ui_show_save_button": true
};

async function analyzeFoodImage(imageBuffer, portionSize = 'normal') {
    // Simulate AI processing delay
    const delay = Math.floor(Math.random() * 1000) + 1500;

    return new Promise((resolve) => {
        setTimeout(() => {
            // For v3 demo, we toggle between Entrecot (v2) and Ruthless Rice (v3)
            // or just prioritize Ruthless for this step verification.
            // Let's use a simple toggle based on seconds or just default to Ruthless for now.

            const useRuthless = true;

            if (useRuthless) {
                // Return v3 structure
                resolve(MOCK_RUTHLESS_AUDIT);
            } else {
                // Return v2 structure
                // (Simulating v2 logic scaling)
                const result = JSON.parse(JSON.stringify(MOCK_ENTRECOT));
                if (portionSize === 'snack') {
                    result.visual_evidence.portion_size = "Snack / Tapa (approx. 150g)";
                    result.nutritional_panel.calories.total = Math.round(850 * 0.4);
                }
                resolve(result);
            }
        }, delay);
    });
}

module.exports = { analyzeFoodImage };
