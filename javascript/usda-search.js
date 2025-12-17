import { searchFoods } from "./api.js";

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

export async function handleSearch() {
    const query = searchInput.value.trim();
    searchResults.innerHTML = "";
    if(!query) return;

    try{
        const foods = await searchFoods(query);

        foods.forEach(f => {
            const calories = getNutrientValue(f.foodNutrients, 'Energy') || getNutrientValueById(f.foodNutrients, 1008) || 0;
            const protein = getNutrientValue(f.foodNutrients, 'Protein') || getNutrientValueById(f.foodNutrients, 1003) || 0;
            const carbs = getNutrientValue(f.foodNutrients, 'Carbohydrate') || getNutrientValueById(f.foodNutrients, 1005) || 0;
            const fats = getNutrientValue(f.foodNutrients, 'Fats') || getNutrientValueById(f.foodNutrients, 1004) || 0;

            const item = document.createElement("div");
            item.className = "meal"

            item.innerHTML = 
            `<div>
                <strong>${f.description}</strong>
                <small> FDC ID: ${f.fdcId}</small>
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
        searchResults.textContent = "Error fetching food data."
    }
}

export function selectFoodFromFDC(f, calories, protein, carbs, fats){
    document.getElementById('mealName').value = f.description;
    document.getElementById('mealCalories').value = Math.round(calories);
    document.getElementById('MealProtein').value = Math.round(protein);
    document.getElementById('mealCCarbs').value = Math.round(carbs);
    document.getElementById('mealFats').value = Math.round(fats);
}