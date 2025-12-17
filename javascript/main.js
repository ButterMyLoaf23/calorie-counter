import { searchFoods, getFoodDetails, getNutrientValueById } from "./api.js";
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
      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
        <div class="search-result-title">${food.description}</div>
        <div class="search-result-sub">Click to load calories + macros</div>
      `;

      div.onclick = async () => {
        try {
          const details = await getFoodDetails(food.fdcId);
          const n = details.foodNutrients || [];

          const protein = getNutrientValueById(n, 1003);
          const carbs   = getNutrientValueById(n, 1005);
          const fats    = getNutrientValueById(n, 1004);
          const energy  = getNutrientValueById(n, 1008);

          // If energy missing, estimate from macros
          const calories = energy || (protein * 4 + carbs * 4 + fats * 9);

          mealName.value = details.description || food.description;
          mealCalories.value = Math.round(calories);
          mealProtein.value = Math.round(protein);
          mealCarbs.value = Math.round(carbs);
          mealFats.value = Math.round(fats);

          searchResults.innerHTML = "";
        } catch (err) {
          console.error(err);
          alert("Could not load nutrition details for that item.");
        }
      };

      searchResults.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    searchResults.textContent = "Error searching foods (check your API key).";
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
        ? `Over goal by ${consumed - goal} kcal`
        : `${goal - consumed} kcal remaining`;
}
