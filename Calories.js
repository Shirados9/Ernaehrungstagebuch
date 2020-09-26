var Calories = {};

Calories.add = function (currentCalories, addedCalories)
{
    //Falls noch keine Kalorien vorhanden sind auf null setzten damit addiert werden kann
    if(currentCalories.consumedCalories == null) currentCalories.consumedCalories = 0;
    
    return currentCalories.consumedCalories + addedCalories;
};

Calories.get = function (currentCalories)
{
    if(currentCalories.consumedCalories == null)
      return "Du hast heute noch keine Kalorien eingetragen.";
    else 
      return "Du hast heute " + currentCalories.consumedCalories + " Kalorien gegessen.";
};

Calories.recommendAmount = function (weight, size, age, gender)
{
    var dailyRequiredCalories;
    
    if (gender == "weiblich")
      dailyRequiredCalories = Math.round(622.3 + (9.6 * weight + (1.8 * size) - (4.7 * age)));
    
    else
        dailyRequiredCalories = Math.round(955.1 + (9.6 * weight + (1.8 * size) - (4.7 * age)));
    
    return dailyRequiredCalories;
};

Calories.getIndexOfRequestedFood = function (requestedFood)
{
    const foodList = Calories.getFoodObject();
    
    var sizeOfFoodList = Object.keys(foodList.food).length;
    
    for (var i = 0; i <= sizeOfFoodList - 1; i++) {
        if (foodList.food[i].Name.toLowerCase() == requestedFood){
            return i;
        }
        else
            continue;
    }
    return -1;

};

Calories.getFoodObject = function ()
{
    const object = require("./food.json");

    return object;
};

Calories.calculateBMI = function (weight, size)
{
    var resultBMI;
    
    resultBMI = (weight / ((size / 100) * (size / 100))).toFixed(1);
    
    return resultBMI;
};

Calories.calculateFFMI = function (weight, size, bodyfat)
{
    var resultFFMI;
    var ffm =  weight * (100 - bodyfat) / 100;
    resultFFMI = (ffm / ((size / 100) * (size / 100)) + 6.3 * (1.8 - size / 100)).toFixed(1);
    
    return resultFFMI;
};

exports.data = Calories;