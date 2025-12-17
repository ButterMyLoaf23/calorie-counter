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

const macroCanvas = document.getElementById("macroChart");
const weeklyCanvas = document.getElementById("weeklyChart");

const pieCht = macroCanvas ? macroCanvas.getContext("2d") : null;
const weeklyCht = weeklyCanvas ? weeklyCanvas.getContext("2d") : null;

const calorieGoalInput = document.getElementById("calorieGoal");
const goalStatus = document.getElementById("goalStatus");

let meals = loadMeals();
let weeklyCalories = buildWeeklyCalories(meals);

if (document.getElementById("calorieGoal")) {
  document.getElementById("calorieGoal").value =
    localStorage.getItem("goal") || "";
}
updateGoal();

if (pieCht && weeklyCht) {
initCharts(pieCht, weeklyCht);
updateCharts(meals, weeklyCalories);
}
renderMeals();


const foodTypeFilter = document.getElementById("foodTypeFilter");

async function handleSearch() {
  const query = searchInput.value.trim();
  searchResults.innerHTML = "";
  if (!query) return;

  const qLower = query.toLowerCase();
  const typeChoice = foodTypeFilter ? foodTypeFilter.value : "all";

  try {
    const foods = await searchFoods(query);

    let filtered = foods.filter(f => {
      const desc = (f.description || "").toLowerCase();
      if (qLower.includes("sandwich") && desc.includes("ice cream")) return false;
      return true;
    });

    filtered = filtered.filter(f => {
      const dt = (f.dataType || "").toLowerCase();

      if (typeChoice === "packaged") {
        return dt.includes("branded");
      }

      if (typeChoice === "restaurant") {
        return dt.includes("survey");
      }

      return true;
    });

    for (const food of filtered) {
      const card = document.createElement("div");
      card.className = "search-result-item";

      const title = food.description || "Unknown food";
      const brand = food.brandOwner || food.brandName || "";
      const type = food.dataType || "";

      card.innerHTML = `
        <div class="sr-top">
          <div class="sr-title">${title}</div>
          <div class="sr-badge">${type}</div>
        </div>
        <div class="sr-meta">${brand ? brand : "USDA FoodData Central"}</div>
        <div class="sr-nutrition loading">Loading nutrition…</div>
      `;

      searchResults.appendChild(card);

      getFoodDetails(food.fdcId)
        .then(details => {
          const n = details.foodNutrients || [];
          const protein = getNutrientValueById(n, 1003);
          const carbs = getNutrientValueById(n, 1005);
          const fats = getNutrientValueById(n, 1004);
          const energy = getNutrientValueById(n, 1008);
          const calories = energy || (protein * 4 + carbs * 4 + fats * 9);

          const nutLine = card.querySelector(".sr-nutrition");
          nutLine.classList.remove("loading");
          nutLine.textContent =
            `${Math.round(calories)} kcal • Protein:${Math.round(protein)}g Carbs:${Math.round(carbs)}g Fats:${Math.round(fats)}g`;

          card.onclick = () => {
            mealName.value = details.description || title;
            mealCalories.value = Math.round(calories);
            mealProtein.value = Math.round(protein);
            mealCarbs.value = Math.round(carbs);
            mealFats.value = Math.round(fats);
          };
        })
        .catch(err => {
          console.error(err);
          const nutLine = card.querySelector(".sr-nutrition");
          nutLine.classList.remove("loading");
          nutLine.textContent = "Nutrition unavailable for this item.";
        });
    }
  } catch (err) {
    console.error(err);
    searchResults.textContent = "Search failed (check API key).";
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
  updateGoal();

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
    updateGoal();
}


function deleteMeal(index) {
    meals.splice(index, 1);
    saveMeals(meals);
    weeklyCalories = buildWeeklyCalories(meals);
    renderMeals();
    updateCharts(meals, weeklyCalories);
    updateGoal();
}

function updateGoal() {
  if (!calorieGoalInput || !goalStatus) return;

  const goal = Number(calorieGoalInput.value);
  if (!goal) {
    goalStatus.textContent = "";
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const consumed = weeklyCalories[today] || 0;

  goalStatus.textContent =
    consumed > goal
      ? `Over goal by ${consumed - goal} kcal`
      : `${goal - consumed} kcal remaining`;
}

if (calorieGoalInput) {
  calorieGoalInput.addEventListener("change", () => {
    localStorage.setItem("goal", calorieGoalInput.value);
    updateGoal();
  });
}
