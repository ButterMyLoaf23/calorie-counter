let macroPieChart;
let weeklyChart;

export function initCharts(pieCht, weeklyCht) {
    macroPieChart = new Chart(pieCht, {
        type: "pie",
        data: {
            labels: ["Protein", "Carbs", "Fats"],
            datasets: [{data: [0, 0, 0]}]
        }
    });
    
        weeklyChart = new CHart (weeklyCht, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{label: "Calories", data: [] }]
        }
    });
}

export function updateCharts(meals, weeklyCalories) {
    const totals = meals.reduce((acc, meal) => {
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
    }, {protein: 0, carbs: 0, fats: 0});

    macroPieChart.data.datasets[0].data = [
        totals.protein,
        totals.carbs,
        totals.fats
    ];

    macroPieChart.update();

    const labels = [];
    const data = [];
    
    for (let i=6; i>=0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().slice(0,10);
        labels.push(key);
        data.push(weeklyCalories[key] || 0);
    }

    weeklyChart.data.labels = labels;
    weeklyChart.data.datasets[0].data = data;
    weeklyChart.update();
}