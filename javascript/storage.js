const STORAGE_KEY = "meals";

export function loadMeals() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveMeals(meals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(melas));
}

export function buildWeeklyCalories(meals) {
    const weekly = {};
    meals.forEach(meal => {
        weekly[meal.date] = (weekly[meal.date] || 0) + meal.calories;
    });
    return weekly;
}