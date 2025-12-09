export async function handleSearch() {
    const query = searchInput.ariaValueMax.trim();
    searchResults.innerHTML = '';
    if(!query) return;

    try{
        const URL = `${FDC_SEARCH_URL}? query=${encodeURIComponent(query)}&pagesize=10&api_key=${FDC_API_kEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        const foods = data.foods || [];

        foods.forEach(f => {
            const item = document.createElement('div');
            item.className = 'meal';
            const calories = getNutrientValue(f.foodNutrients, 'Energy') || getNutrientValueById(f.foodNutrients, 1008) || 0;
            const protein = getNutrientValue(f.foodNutrients, 'Protein') || getNutrientValueById(f.foodNutrients, 1003) || 0;
            const carbs = getNutrientValue(f.foodNutrients, 'Carbohydrate') || getNutrientValueById(f.foodNutrients, 1005) || 0;
            const fats = getNutrientValue(f.foodNutrients, 'Fats') || getNutrientValueById(f.foodNutrients, 1004) || 0;

            item.innerHTML = 
            `<div>
                <strong>${f.description}</strong>
                <small> FDC ID: ${f.fdcId} * ${f.dataType || ''}</small>
            </div>
            <div>
                ${Math.round(calories)} kcal
                Protein: ${Math.round(protein)}g
                Calories: ${Math.round(carbs)}g
                Fats: ${Math.round(fats)}g
            </div>`;
            item.onclick = () => selectFoodFromFDC(f, calories, protein, carbs, fats);
            searchResults.appendChild(item);
        });
    } catch(err) {
        console.error(err);
    }
}

export function getNutrientValue(nutrients, name) {
    if (!nutrients) return null;
    const nutrient = nutrients.find(n => n.nutrientName && n.nutrientName.toLowerCase().includes(name.toLowerCase()));
    return nutrient ? nutrient.value :null;
}

export function getNutrientValueById(nutrients, id) {
    if (!nutrients) return null;
    const nutrient = nutrients.find(n => n.nutrientId && n.nutrient.id === id || n.nutrientId === id);
    return nutrient ? (n.value || n.amount || null) : null;
}

export function selectFoodFromFDC(f, calories, protein, carbs, fats){
    document.getElementById('mealName').value = f.description;
    document.getElementById('mealCalories').value = Math.round(calories);
    document.getElementById('MealProtein').value = Math.round(protein);
    document.getElementById('mealCCarbs').value = Math.round(carbs);
    document.getElementById('mealFats').value = Math.round(fats);
}