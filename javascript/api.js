const API_BASE = "/api/usda";

export async function searchFoods(query, options = {}) {
    const params = new URLSearchParams({ query, pageSize: String(options.pageSize || 25), pageNumber: String(options.pageNumber || 1) });
    if (options.dataType) params.set("dataType", options.dataType);
    const response = await fetch(`${API_BASE}/search?${params}`);
    if (!response.ok) throw new Error("Food search failed");
    const data = await response.json();
    return data.foods || [];
}

export async function getFoodDetails(fdcId) {
    const response = await fetch(`${API_BASE}/food/${encodeURIComponent(fdcId)}`);
    if (!response.ok) throw new Error("Food details request failed");
    return response.json();
}

export function getNutrientValueById(nutrients, id) {
    if (!Array.isArray(nutrients)) return 0;
    const found = nutrients.find(item => item.nutrientId === id || item.nutrient?.id === id || item.nutrient?.number === String(id));
    return Number(found?.value ?? found?.amount ?? 0) || 0;
}
