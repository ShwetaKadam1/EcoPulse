// utils/carbonCalculator.js
// Returns { travel, food, electricity, water, shopping, total }
// Travel factors: kg CO2 per km (example rough factors)
const travelFactors = {
  electricBicycle: 0.01,
  motorcycle: 0.02,
  car: 0.15,
  bus: 0.08,
  auto: 0.09,
  taxi: 0.18,
  train: 0.04,
  metro: 0.03,
  flight: 0.25
};

// Sample food factors per meal category (kg CO2 per meal)
const foodCategoryFactor = {
  vegan: 1.0,              // fresh, plant-based
  vegetarian: 1.5,         // fresh, dairy/egg optional
  egg: 1.8,                 
  chicken: 2.5,            
  fish: 2.2,               
  mutton: 4.5,             
  beef: 6.0,               
  pork: 5.0,               
  dairy: 1.7,              
  fastFood: 3.0,           
  processedFood: 2.5,      // packaged/ready-to-eat
  cannedFood: 2.8,         // canned or jarred foods
  frozenFood: 2.6,         // frozen meals or ingredients
  rawIngredients: 1.2,     // minimally processed raw foods (vegetables, grains)
  unknown: 2.0
};

// Appliance approx factors per hour
const applianceFactors = {
  ac: 1.2,
  fan: 0.05,
  fridge: 0.08, // usually based on 24h cycle, but here per hour of active cooling
  tv: 0.06,
  light: 0.02,
  laptop: 0.05,
  mobile: 0.03,
  desktop: 0.15,
  geyser: 2.0,    // High consumption
  microwave: 1.2,
  washingMachine: 0.4,
  evCharger: 3.5,
  gamingConsole: 0.2
};

// shopping default co2 per item if not provided
const defaultShoppingCO2 = {
  clothes: 20,
  electronics: 200,
  toiletries: 2,
  furniture: 150,          // Example: CO2 per piece of furniture
  books: 2,                // Example: CO2 per book purchased
  shoes: 30,               // Example: CO2 per pair of shoes
  groceries: 10,           // Example: CO2 for general grocery shopping
  homeAppliances: 50,      // Example: CO2 for home appliances
  cosmetics: 15,           // Example: CO2 for cosmetics
  toys: 10,                // Example: CO2 per toy
  sportingGoods: 25,       // Example: CO2 per sporting equipment
  jewelry: 100,            // Example: CO2 per piece of jewelry
  artSupplies: 5,          // Example: CO2 for art supplies
  petSupplies: 20,         // Example: CO2 per pet supply item
  techAccessories: 30,     // Example: CO2 for phone cases, chargers, etc.
  cleaningProducts: 5,     // Example: CO2 for cleaning products
  alcohol: 50,             // Example: CO2 for alcoholic beverages
  pharmaceuticals: 3       // Example: CO2 for pharmaceuticals (drugs/medications)
};

function calcTravel(travelArray=[]) {
  let total = 0;
  travelArray.forEach(t => {
    const factor = travelFactors[t.mode] ?? 0.05;
    total += (t.distanceKm || 0) * factor;
  });
  return total;
}

function calcFood(foodArray=[]) {
  let total = 0;
  foodArray.forEach(f => {
    const cat = f.category || inferFoodCategory(f.text) || "unknown";
    const quantity = f.quantity || 1;  // default 1 meal/portion
    total += (foodCategoryFactor[cat] || foodCategoryFactor.unknown) * quantity;
  });
  return total;
}

function inferFoodCategory(text="") {
  text = (text||"").toLowerCase();
  if (!text) return null;
  if (text.includes("chicken") || text.includes("mutton") || text.includes("fish") || text.includes("egg")) return "nonVegetarian";
  if (text.includes("tofu") || text.includes("salad") || text.includes("vegan")) return "vegan";
  if (text.includes("paneer") || text.includes("dal") || text.includes("vegetable")) return "vegetarian";
  return null;
}

function calcElectricity(elec = { kwh: 0, breakdown: [] }) {
  let total = 0;
  if (elec.kwh) {
    total += elec.kwh * 0.8;
  } else {
    // Check if electricity is an object of appliance:hours (like your logInput state)
    // or an array of {appliance, hours}
    if (Array.isArray(elec.breakdown)) {
      elec.breakdown.forEach(a => {
        const factor = applianceFactors[a.appliance] ?? 0.1;
        total += (a.hours || 0) * factor;
      });
    } else {
      // Logic for logInput style: { ac: 2, fan: 5 ... }
      Object.keys(elec).forEach(key => {
        if (key === 'kwh') return;
        const factor = applianceFactors[key] ?? 0.1;
        total += (elec[key] || 0) * factor;
      });
    }
  }
  return total;
}

function calcWater(w={showerMinutes:0, washingCycles:0, roWasteLiters:0, tapLiters:0}) {
  // rough factors
  const showerFactor = 0.005; // kgCO2 per minute
  const washingFactor = 0.5; // per cycle
  const roFactor = 0.001; // per liter
  const tapFactor = 0.004; // per minute
  let total = 0;
  total += (w.showerMinutes||0) * showerFactor;
  total += (w.washingCycles||0) * washingFactor;
  total += (w.roWasteLiters||0) * roFactor;
  total += (w.tapLiters||0) * tapFactor;
  return total;
}

function calcShopping(items=[]) {
  let total = 0;
  items.forEach(i => {
    if (i.co2) total += i.co2 * (i.quantity || 1);
    else total += (defaultShoppingCO2[i.category] || 10) * (i.quantity || 1);
  });
  return total;
}

function calcGas(gasArray = []) {
  let total = 0;

  gasArray.forEach(g => {
    const { type, minutes } = g;
    if (type === "cylinder") {
      // LPG Cylinder CO2 Calculation
      const cylinderCO2 = 42.3; // kg CO2 per cylinder
      const averageDailyCookingMinutes = 120; // Assumes 2 hours of cooking per day
      const dailyCO2 = cylinderCO2 / 30; // Average daily CO2 for 30 days
      total += (minutes / averageDailyCookingMinutes) * dailyCO2;
    } else if (type === "pipeline") {
      // Piped Gas CO2 Calculation
      const co2PerBurnerMinute = 0.3 / 60; // 0.3 kg CO2 per hour of burner usage
      total += minutes * co2PerBurnerMinute;
    }
  });

  return total;
}

function calculateFootprint(entry={}) {
  const travel = calcTravel(entry.travel || []);
  const food = calcFood(entry.food || []);
  const electricity = calcElectricity(entry.electricity || {});
  const water = calcWater(entry.water || {});
  const shopping = calcShopping(entry.shopping || []);
  const gas = calcGas(entry.gas || []);
  const total = +(travel + food + electricity + water + shopping + gas).toFixed(3);

  return {
    travel: +travel.toFixed(3),
    food: +food.toFixed(3),
    electricity: +electricity.toFixed(3),
    water: +water.toFixed(3),
    shopping: +shopping.toFixed(3),
    gas: +gas.toFixed(3),
    total
  };
}

module.exports = calculateFootprint;
