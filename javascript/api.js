const FDC_API_KEY = "M58DZg98f89I7sid2hxfeXHBgEVNltDkp7gtBl48";

export async function searchFoods(query) {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${M58DZg98f89I7sid2hxfeXHBgEVNltDkp7gtBl48}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error ("API failed");

    const data = await response.json();
    return data.foods || [];
}

export function getNutrientValue(nutrients, id) {
    const nutrient = nutrients.find(nuntrients => nutrients.nutrientId === id);
    return nutrient ? nutrient.value : 0;
}