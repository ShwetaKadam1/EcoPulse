// utils/adviceRules.js
function generateAdviceFromLog(log) {
  const advice = [];

  if (log.totals && log.totals.total > 20) {
    advice.push("Your total footprint today is high. Try reducing car travel and prefer public transport or carpooling.");
  }

  if ((log.totals && log.totals.electricity > 5) || (log.electricity && log.electricity.kwh && log.electricity.kwh > 5)) {
    advice.push("Reduce AC and unused appliance hours. Set AC temperature a bit higher and switch off lights.");
  }

  if (log.food && log.food.length) {
    const nonVegCount = log.food.filter(f => f.category === "nonVegetarian").length;
    if (nonVegCount > 1) advice.push("Consider replacing some non-vegetarian meals with vegetarian alternatives.");
  }

  if (log.travel && log.travel.some(t => t.mode === "flight")) {
    advice.push("Flights increase your footprint significantly. Consider alternatives or offsetting.");
  }

  if (advice.length === 0) advice.push("Good job! Keep logging and try a few small changes — e.g., reduce shower minutes by 2–3 minutes.");

  return advice;
}

module.exports = { generateAdviceFromLog };
