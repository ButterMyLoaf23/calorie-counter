import { searchFoods, getNutrientValue } from "./api.js";
import { initCharts, updateCharts } from "./charts.js";
import { loadMeals, saveMeals, buildWeeklyCalories } from "./storage.js";


const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const mealForm = document.getElementById("mealForm");
const mealList = document.getElementById("mealList");

const mealName = document.getElementById("mealName");
const mealCalories = document.getElementById("mealCalories");
const mealProtein = document.getElementById("mealProtein");
const mealCarbs = document.getElementById("mealCarbs");
const mealFats = document.getElementById("mealFats");

const pieCtx = document.getElementById("macroChart").getContext("2d");
const weeklyCtx = document.getElementById("weeklyChart").getContext("2d");


let meals = loadMeals();
let weeklyCalories = buildWeeklyCalories(meals);


initCharts(pieCtx, weeklyCtx);
renderMeals();
updateCharts(meals, weeklyCalories);


async function handleSearch() {
  const query = searchInput.value.trim();
  searchResults.innerHTML = "";
  if (!query) return;

  try {
    const foods = await searchFoods(query);

    foods.forEach(food => {
      const calories = getNutrientValue(food.foodNutrients, 1008) || 0;
      const protein  = getNutrientValue(food.foodNutrients, 1003) || 0;
      const carbs    = getNutrientValue(food.foodNutrients, 1005) || 0;
      const fats     = getNutrientValue(food.foodNutrients, 1004) || 0;

      const div = document.createElement("div");
      div.className = "search-item";
      div.innerHTML = `
        <div class="search-title">${food.description}</div>
        <div class="search-results">
        ${Math.round(calories)} kcal * Protein: ${Math.round(protein)}g Carbs: ${Math.round(carbs)}g Fats: ${Math.round(fats)}g</div>
      `;

      div.onclick = () => {
        mealName.value = food.description;
        mealCalories.value = Math.round(calories);
        mealProtein.value = Math.round(protein);
        mealCarbs.value = Math.round(carbs);
        mealFats.value = Math.round(fats);
        searchResults.innerHTML = "";
      };

      searchResults.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    searchResults.textContent = "Error fetching food data.";
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

searchInput.addEventListener("input", debounce(handleSearch, 400));


mealForm.addEventListener("submit", e => {
  e.preventDefault();

  const meal = {
    name: mealName.value,
    calories: Number(mealCalories.value),
    protein: Number(mealProtein.value),
    carbs: Number(mealCarbs.value),
    fats: Number(mealFats.value),
    date: new Date().toISOString().slice(0, 10)
  };

  meals.push(meal);
  saveMeals(meals);

  weeklyCalories = buildWeeklyCalories(meals);

  renderMeals();
  updateCharts(meals, weeklyCalories);

  mealForm.reset();
});


function renderMeals() {
  mealList.innerHTML = "";

  meals.forEach((meal, index) => {
    const div = document.createElement("div");
    div.className = "meal-item";

    div.innerHTML = `
      <div>
        <strong>${meal.name}</strong>
        <div>${meal.calories} kcal</div>
        <div>
          Protein: ${meal.protein}g |
          Carbs: ${meal.carbs}g |
          Fats: ${meal.fats}g
        </div>
      </div>
      
      <div class="meal-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
        </div>
    `;

    div.querySelector(".edit-btn").onclick = () => editMeal(index);

    div.querySelector(".delete-btn").onclick = () => deleteMeal(index);
    mealList.appendChild(div);
  });
}

function editMeal(index) {
    const meal = meals[index];

    mealName.value = meal.name;
    mealCalories.value = meal.calories;
    mealProtein.value = meal.protein;
    mealCarbs.value = meal.carbs;
    mealFats.value = meal.fats;

    meals.splice(index, 1);
    saveMeals(meals);
    weeklyCalories = buildWeeklyCalories(meals);

    renderMeals();
    updateCharts(meals, weeklyCalories);
}


function deleteMeal(index) {
  meals.splice(index, 1);
  saveMeals(meals);
  weeklyCalories = buildWeeklyCalories(meals);
  renderMeals();
  updateCharts(meals, weeklyCalories);
}

const calorieGoalInput = document.getElementById("calorieGoal");
const goalStatus = document.getElementById("goalStatus");

calorieGoalInput.value = localStorage.getItem("goal") || "";

calorieGoalInput.addEventListener("change", () => {
    localStorage.setItem("goal", calorieGoalInput.value);
    updateGoal();
});

function updateGoal() {
    const goal = Number(calorieGoalInput.value);
    if (!goal) return;

    const today = new Date().toISOString().slice(0, 10);
    const consumed = weeklyCalories[today] || 0;

    goalStatus.textContent = 
    consumed > goal
        ? `Over goal by ${consumed - goals} kcal`
        : `${goal - consumed} kcal remaining`;
}
