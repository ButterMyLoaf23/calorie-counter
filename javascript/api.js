const FDC_API_KEY = "M58DZg98f89I7sid2hxfeXHBgEVNltDkp7gtBl48";

export async function searchFoods(query) {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${FDC_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error ("API failed");

    const data = await response.json();
    return data.foods || [];
}

export async function getFoodDetails(fdcId) {
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${encodeURIComponent(FDC_API_KEY)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API Failed");
    return await response.json();
}

export function getNutrientValueById(nutrients, id) {
    if (!Array.isArray(nutrients)) return 0;

    const found = nutrients.find(nutrients => nutrients.nutrientId === id || nutrients.nutrient?.id === id || nutrients.nutrient?.number === String(id));
    return Number(found?.value ?? found?.amount ?? 0) || 0;
}