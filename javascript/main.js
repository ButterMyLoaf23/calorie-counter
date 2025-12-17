import { searchFoods, getNutrientValue } from "./api.js";
import { initCharts, updateCharts } from "./charts.js";
import { loadMeals, saveMeals, buildWeeklyCalories } from "./storage.js";

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const pieCht = document.getElementById("macroChart").getContext("2d");
const weeklyCht = document.getElementById("weeklyChart").getContext("2d");

let meals = loadMeals();
let weeklyCalories = buildWeeklyCalories(meals);

initCharts(pieCht, weeklyCht);
updateCharts(meals, weeklyCalories);

async function handleSearch() {
    const query = searchInput.value.trim();
    searchResults.innerHTML = "";
    if (!query) return;

    const foods = await searchFoods(query);

    foods.forEach(food => {
        const div = document.createElement("div");
        div.textContent = food.description;
        searchResults.appendChild(div);
    });
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

searchInput.addEventListener("input", debounce(handleSearch, 400));