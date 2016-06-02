var SteamUser = require('steam-user');
var generatePassword = require("password-generator");

var steamuser = new SteamUser();


var cleanup = require('./helpers/cleanup.js').Cleanup(myCleanup)

function myCleanup() {
  console.log('Closing up shop');
  steamuser.logOff();
  console.log('Logged off.');
};

steamuser.logOn({
    "accountName": "jupasehudi",
    "password": "gemecalite"
});

steamuser.on('error', function(e) {
    console.log(e);
});

var password = generatePassword();
var account_name = generatePassword();
var email = "dotashidduch+" + account_name + "@gmail.com";


steamuser.on('loggedOn', function(details) {
    console.log("Logged into Steam as " + steamuser.steamID.getSteam3RenderedID());
    steamuser.setPersona(SteamUser.EPersonaState.Online);
    steamuser.gamesPlayed(570);

    steamuser.createAccount(
        account_name, password, email, function(result, steamid){
        if (steamid){
            console.log("created account : " + account_name + ":" + password + " [steamID]" + steamid);
        }
        console.log(result);
    });
});
console.log('EOF');
