var SteamUser = require('steam-user');
var generatePassword = require("password-generator");
var client = new SteamUser();


var cleanup = require('./helpers/cleanup.js').Cleanup(myCleanup)

function myCleanup() {
  console.log('Closing up shop');
  client.logOff();
  console.log('Logged off.');
};

client.logOn({
    "accountName": "jupasehudi",
    "password": "gemecalite"
});

client.on('error', function(e) {
    console.log(e);
});

var password = generatePassword();
var account_name = generatePassword();
var email = "dotashidduch+" + account_name + "@gmail.com";
client.on('loggedOn', function(details) {
    console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed(570);

    client.createAccount(
        account_name, password, email, function(result, steamid){
        if (steamid){
            console.log("created account : " + account_name + ":" + password + " [steamID]" + steamid);
        }
        console.log(result);
    });
});
console.log('EOF');
