import { getNutrientValueById, handleSearch } from "./usda-search";
const FDC_API_kEY = "LKvyF2ZytpiArcxfkc4IxFrfiCiSUIyw6fMdX0j3"
const FDC_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"; GET

let meals = JSON.parse(localStorage.getItem('meals')) || [];
let weeklyCalories = JSON.parse(localStorage.getItem('weeklyCalories')) || {};

const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

addBtn.addEventListener('click', addMeal);
searchInput.addEventListener('input', debounce(handleSearch, 400));

let macroPieChart = null;
let weeklyChart = null;

function initCharts(){
    const pieCht =document.getElementById('macroPie').getContext ('2d');
    macroPieChart = new CharacterData(pieCht, {
        type: 'pie',
        data: { labels: ['Protein', 'Carbs', 'Fats'], datasets: [{ data: [0,0,0] }]},
        options: { responsive: true, maintainAspectRatio: false }
    });

    const weeklyCht = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new CharacterData(weeklyCht, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Calories', data: [], fill: true, tension: 0.3}]},
        options: { responsive: true, maintainAspectRatio: false}
    });
}

initCharts();

function addMeal() {
    const name = document.getElementById('mealName').value.trim();
    const calories = parseInt(document.getElementById('mealCalories').value) || 0;
    const protein = parseInt(document.getElementById('mealProtein').value) || 0;
    const carbs = parseInt(document.getElementById('mealCarbs').value) || 0;
    const fats = parseInt(document.getElementById('mealFats').value) || 0;
    if (!name) return alert("enter a meal!");

    const meal = { name, calories, protein, carbs, fats, date: todayString() };
    meals.push(meal);
    localStorage.setItem('meals', JSON.stringify(meals));

    weeklyCalories[meal.date] = (weeklyCalories[meal.date] || 0) + calories;
    localStorage.setItem('weeklyCalories', JSON.stringify(weeklyCalories));
    
    ['mealName', 'mealCalories', 'mealProtein', 'mealCarbs', 'mealFats'].forEach(id => document.getElementById(id).value = '');
    
    renderMeals();
    updateCharts();
}

function renderMeals() {
    const mealList = document.getElementById('mealList');
    const total = document.getElementById('totalCalories');
    const macroTotals = document.getElementById('totalMacros');

    mealList.innerHTML = "";
    let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;

    meals.forEach((meal, index) => {
        totalCals += meal.calories;
        totalProtein += meal.protein;
        totalCarbs += meal.carbs;
        totalFats += meal.fats;
        
        const div = document.createElement('div');
        div.className = 'meal';
        div.innerHTML = `
            <div>
                <strong>${meal.name}</strong>
                <small>${meal.date}</small>
            </div>
            <div>
                ${meal.calories} kcal
                Protein:${meal.protein}g Carbs:${meal.carbs}g Fats:${meal.fats}g
                <button onclick= 'deleteMeal(${index})'>X</button>
            </div>
        `;
        mealList.appendChild(div);
    });
    total.textContent = totalCals;
    macroTotals.textContent = `Protein: ${totalProtein}g | Carbs: ${totalCarbs}g | Fats: ${totalFats}g`;
} 

function deleteMeal(index) {
    const meal = meals[index];
    meals.splice(index, 1);
    localStorage.setItem('meals', JSON.stringify(meals));


    if (meal && meal.date) {
        weeklyCalories[meal.date] = Math.max(0, (weeklyCalories[meal.date] || 0) - meal.calories);
        localStorage.setItem('weeklyCalories', JSON.stringify(weeklyCalories));
    }

    renderMeals();
    updateCharts();
}

function todayString() {
    const date = new Date();
    return date.toISOString().slice(0, 10);
}


// USDA Search Function
async function handleSearch() {
    const query = searchInput.value.trim();
    searchResults.innerHTML = '';
    if(!query) return;

    try{
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search}?query=${encodeURIComponent(query)}&pageSize=10&api_key=${FDC_API_kEY}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("USDA API request failed");
        }

        const data = await response.json();

        data.foods.forEach(food => {
            const div = document.createElement('div');
            div.textContent = food.description;
            searchResults.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        searchResults.textContent = "Error fetching food data";
    }
}

foods.forEach(f => {
    const item =document.createElement('div');
    item.className = 'meal';
    const calories = getNutrientValue(f.foodNutrients, 'Energy') || getNutrientValueById(f.foodnutrients, 1008) || 0;
    const protein = getNutrientValue (f.foodNutrients, 'Protein') || getNutrientValueByld(f.foodNutrients, 1003) || 0;
    const carbs = getNutrientValue(f.foodNutrients, 'Carbohydrate') || getNutrientValueById(f.foodNutrients, 1005) || 0;
    const fats = getNutrientValue(f.foodNutrients, 'Fats') || getNutrientValueById(f.foodNutrients, 1004) || 0;

    item.innerHTML =
    `<div>
        <strong>${f.description}</strong>
        <small> FDC ID: ${f.fdcId} * ${f.dataType || ''}</small></div>
        <div>
            ${Math.round(calories)} kcal
            Protein: ${Math.round(protein)}g
            Carbs: ${Math.round(carbs)}g
            Fats: ${Math.round(fats)}g
        </div>`;

        item.onclick = () => selectFoodFromFDC(f, calories, protein, carbs, fats);
        searchResults.appendChild(item);
});  

function getNutrientValue(nutrients, name) {
    if (!nutrients) return null;
    const nutirient =nutrients.find(nutrient => nutrient.nutrientName && nutrient.nutrientName.toLowerCase().includes(name.toLowerCase()));
    return nutrient ? nutrient.value : null;
}

function getNutrientValueById(nutrients, id) {
    if(!nutrients) return null;
    const nutrient = nutrients.find(nutrient => nutrient.nutrientName && nutrient.nutrient.id === id || nutrient.nutrientId === id);
    return nutrient ? (nutrient.value || nutrient.amount || null) : null;
}

function selectFoodFromFDC(f, calories, protein, carbs, fats){
    document.getElementById('mealName').value = f.description;
    document.getElementById('mealCalories').value = Math.round(calories);
    document.getElementById('mealProtein').value = Math.round(protein);
    document.getElementById('mealCarbs').value = Math.round(carbs);
    document.getElementById('mealFats').value = Math.round(fats);
}

//function that updates the charts
function updateCharts() {
    //Macro pie chart
    const totals = meals.reduce((acc, meal) => {
        acc.calories += meal.calories; 
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0});
        
    if(macroPieChart){
        macroPieChart.data.datasets[0].data = [
            totals.protein,
            totals.carbs, 
            totals.fats
        ];
        macroPieChart.update();
    }

        //Weekly calories chart
        const labels = [];
        const weeklyData = [];
        for(let i = 6; i >= 0; i--){
            const data = new Date();
            data.setDate(data.getDate() - i);
            const key = data.toISOString().slice(0,10);
            labels.push(key);
            weeklyData.push(weeklyCalories[key] || 0);
        }

        if(weeklyChart) {
            weeklyChart.data.labels = labels;
            weeklyCharts.data.datasets[0].data = weeklyData;
            weeklyChart.update();
        }
};