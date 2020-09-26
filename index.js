/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require("ask-sdk");
const AWS = require("aws-sdk");
const calories = require("./Calories.js");
const Activity = require("./Activity.js");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText =
      "Herzlich Willkommen bei deinem Aktivitätstagebuch! Mit diesem Skill kannst du deine Aktivitäten und Tagesbedarf an Kalorien verwalten!" +
      ' Wenn du Hilfe brauchst, sag "Hilfe" oder fange an deine Kalorien einzutragen';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "HelloWorldIntent"
    );
  },
  handle(handlerInput) {
    const speechText = "Hello World!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText = "You can say hello to me!";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("Hello World", speechText)
      .getResponse();
  }
};

const ErhalteAufgenommeneKalorienIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "ErhalteAufgenommeneKalorienIntent"
    );
  },
  async handle(handlerInput) {
    
    // DB-Zugriff
    const currentCalories = await handlerInput.attributesManager.getPersistentAttributes();
    
    var speechText = calories.data.get(currentCalories);

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};

const ErhalteKalorienbedarfIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "ErhalteKalorienbedarfIntent"
    );
  },
  async handle(handlerInput) {
    const currentCalories = await handlerInput.attributesManager.getPersistentAttributes();
    var speechText = "";
    
    if(currentCalories.suggestedCalories == null)
      speechText = 'Ich habe dein Kalorienbedarf noch nicht ausgerechnet. Das kannst du mit dem Befehl: "Rechne mir meinen Kalorienbedarf aus" machen. ';
    else
      speechText = "Der von mir empfohle Kalorienbetrag beträgt " + currentCalories.suggestedCalories + " Kalorien."


    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const HinzufuegenKalorienIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "HinzufuegenKalorienIntent"
    );
  },
  async handle(handlerInput) {
    
    var speechText = "";
    
    // Zugriff auf Variablenwert der DB
    const currentCalories = await handlerInput.attributesManager.getPersistentAttributes();
    
    const addedCalories = parseInt(handlerInput.requestEnvelope.request.intent.slots.kcal.value, 10);

    // Wenn zu hinzufügender Kalorienwert unter 0, dann brich ab, sonst ...
    if (addedCalories < 0)
      speechText = "Negative Kalorien können nicht hinzugefügt werden";
      
    // ... addiere neuen Kalorienwert dem alten Wert hinzu. 
    else
    {
      currentCalories.consumedCalories = calories.data.add(currentCalories, addedCalories);
      
      // Speichere neuen Kalorienwert in DB ab
      handlerInput.attributesManager.setPersistentAttributes(currentCalories);
      await handlerInput.attributesManager.savePersistentAttributes(currentCalories);
      
      speechText = "Es wurden " + addedCalories + " Kalorien hinzugefügt. Du hast heute " + currentCalories.consumedCalories + " Kalorien zu dir genommen.";
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const EmpfehleKalorienbedarfIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "EmpfehleKalorienbedarfIntent"
    );
  },
  async handle(handlerInput) {
    
    // Werte auslesen
    const weight = parseInt(handlerInput.requestEnvelope.request.intent.slots.Gewicht.value, 10);
    const size = parseInt(handlerInput.requestEnvelope.request.intent.slots.Groesse.value, 10);
    const age = parseInt(handlerInput.requestEnvelope.request.intent.slots.Alter.value, 10);
    const gender = handlerInput.requestEnvelope.request.intent.slots.Geschlecht.value;
    
    const currentCalories = await handlerInput.attributesManager.getPersistentAttributes();
    currentCalories.suggestedCalories = calories.data.recommendAmount(weight, size, age, gender);
    
    const speechText = "Dein benötigter Kalorienbedarf entspricht " +  currentCalories.suggestedCalories + " Kalorien.";
    
    // Speichere empfohlene Kalorienanzahl in DB ab
    handlerInput.attributesManager.setPersistentAttributes(currentCalories);
    await handlerInput.attributesManager.savePersistentAttributes(currentCalories);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const WieVieleKalorienHatIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "WieVieleKalorienHatIntent"
    );
  },
  handle(handlerInput) {
    
    const foodList = calories.data.getFoodObject();
    const requestedFood = handlerInput.requestEnvelope.request.intent.slots.Essen.value;
    
    var speechText = "";
    
    if(calories.data.getIndexOfRequestedFood(requestedFood) == -1)
      speechText = "Wir haben " + requestedFood + " leider nicht in unserer Datenbank.";
    
    else
      //requestedFood.charAt(0).toUpperCase() + requestedFood.slice(1) erster Buchstabe groß
      speechText = requestedFood + " hat auf 100g " + foodList.food[calories.data.getIndexOfRequestedFood(requestedFood)].Calories + " Kalorien.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const WieVieleMakrosHatIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "WieVieleMakrosHatIntent"
    );
  },
  handle(handlerInput) {
    
    const foodList = calories.data.getFoodObject();
    const requestedFood = handlerInput.requestEnvelope.request.intent.slots.Essen.value;
    
    var speechText = "";
    
    if(calories.data.getIndexOfRequestedFood(requestedFood) == -1)
      speechText = "Wir haben " + requestedFood + " leider nicht in unserer Datenbank.";
    
    else
      //requestedFood.charAt(0).toUpperCase() + requestedFood.slice(1) erster Buchstabe groß
      speechText = requestedFood + " hat auf 100g " + foodList.food[calories.data.getIndexOfRequestedFood(requestedFood)].Fat + "g Fett, " + 
      foodList.food[calories.data.getIndexOfRequestedFood(requestedFood)].Carbs + "g Kohlenhydrate und " +
      foodList.food[calories.data.getIndexOfRequestedFood(requestedFood)].Protein + "g Protein.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const RechneFFMIAusIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "RechneFFMIAusIntent"
    );
  },
  handle(handlerInput) {
    
    const calories = require("./Calories.js");
    
    const weight = parseInt(handlerInput.requestEnvelope.request.intent.slots.Gewicht.value, 10);
    const size = parseInt(handlerInput.requestEnvelope.request.intent.slots.Groesse.value, 10);
    const bodyfat = parseInt(handlerInput.requestEnvelope.request.intent.slots.Fettanteil.value, 10);

    const speechText = "Dein FFMI beträgt " +  calories.data.calculateFFMI(weight, size, bodyfat) + " Prozent.";
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const RechneBMIAusIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "RechneBMIAusIntent"
    );
  },
  handle(handlerInput) {
    
    const calories = require("./Calories.js");
    
    const weight = parseInt(handlerInput.requestEnvelope.request.intent.slots.Gewicht.value, 10);
    const size = parseInt(handlerInput.requestEnvelope.request.intent.slots.Groesse.value, 10);
    
    const resultBMI = calories.data.calculateBMI(weight, size);
    var speechText;
    
    if (resultBMI >= 30.1)
      speechText = "Dein BMI entspricht einem Wert von " +  resultBMI + ", welcher auf Adipositas hindeutet.";
      
    else if (resultBMI >= 25.1 && resultBMI < 30)
      speechText = "Dein BMI entspricht einem Wert von " +  resultBMI + ", welches auf Übergewicht hindeutet.";
      
    else if (resultBMI >= 18.5 && resultBMI < 25)
      speechText = "Dein BMI entspricht einem Wert von " +  resultBMI + ", das heißt, dass du normales Gewicht hast.";
    
    else if (resultBMI >= 16 && resultBMI < 18.5)
      speechText = "Dein BMI entspricht einem Wert von " +  resultBMI + ", welches auf leichtes bis mittleres Untergewicht hindeutet.";
    
    else
      speechText = "Dein BMI entspricht einem Wert von " +  resultBMI + ", welches auf starkes Untergewicht hindeutet.";

    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const FuegeAktivitaetHinzuIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "FuegeAktivitaetHinzuIntent"
    );
  },
  //async handle(handlerInput) {
  handle(handlerInput) {
    
    const newAcitivity = handlerInput.requestEnvelope.request.intent.slots.Aktivitaet.value;
    const date = handlerInput.requestEnvelope.request.intent.slots.Zeitpunkt.value;
    
    Activity.data.addNewActivity(newAcitivity, date);
    
    var speechText = 'Ich habe die Aktivität ' + newAcitivity + " für den " + date + " eingetragen.";
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const ErhalteGeplanteAktivitaetIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "ErhalteGeplanteAktivitaetIntent"
    );
  },
  handle(handlerInput) {
    
    const date = handlerInput.requestEnvelope.request.intent.slots.Zeitpunkt.value;
    
    const plannedActivity = Activity.data.getCurrentActivity(date);
    
    const speechText = "Du hast für den " + date + " folgende Aktivität geplant: " + plannedActivity;
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const ErhalteVerbrannteKalorienIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "ErhalteVerbrannteKalorienIntent"
    );
  },
  handle(handlerInput) {
    
    const duration = handlerInput.requestEnvelope.request.intent.slots.Dauer.value;
    
    const burnedCalories = Activity.data.calculateBurnedCalories(duration);
    
    var speechText = "Du hast " + burnedCalories + " Kalorien verbrannt.";
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Goodbye!";

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard("Hello World", speechText)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
    );

    return handlerInput.responseBuilder
    .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Tut mir Leid, ich habe dich nicht verstanden. Bitte wiederhole deinen Satz.")
      .reprompt("Tut mir Leid, ich habe dich nicht verstanden. Bitte wiederhole deinen Satz.")
      .getResponse();
  }
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloWorldIntentHandler,
    HelpIntentHandler,
    ErhalteAufgenommeneKalorienIntentHandler,
    ErhalteKalorienbedarfIntentHandler,
    HinzufuegenKalorienIntentHandler,
    EmpfehleKalorienbedarfIntentHandler,
    WieVieleKalorienHatIntentHandler,
    WieVieleMakrosHatIntentHandler,
    RechneFFMIAusIntentHandler,
    RechneBMIAusIntentHandler,
    FuegeAktivitaetHinzuIntentHandler,
    ErhalteGeplanteAktivitaetIntentHandler,
    ErhalteVerbrannteKalorienIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName("Kalorien")
  .withAutoCreateTable(true)
  .lambda();
