var Activity = {};

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

Activity.addNewActivity = function (newAcitivity, date)
{
    // Definiere die Attribute und ihre Werte
    var params = {
        Item: {
            Datum: date,
            Aktivitaet: newAcitivity
        },
        
        TableName: 'Aktivitaeten'
    };
    
    // Füge Attribute und Werte der Datenbank hinzu
    docClient.put(params, function(err, data){
        if (err){
            //callback(err, null);
        }else{
            //callback(null, data);
        }
    });
};

Activity.getCurrentActivity = function (date)
{
    var params = {
        TableName: 'Aktivitaeten',
        Key: {
            Datum: date
        }
    };
    
    docClient.get(params, function(err, data){
        if (err){
            return "Fehler. Kein Eintrag vorhanden.";
        }else{
            return data;
        }
    });
};

Activity.calculateBurnedCalories = function (duration) 
{
    return duration * 12;
};

exports.data = Activity;