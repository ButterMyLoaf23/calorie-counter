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
}