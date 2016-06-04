var SteamUser = require('steam-user');
var generatePassword = require("password-generator");
var redis = require('redis');
var client = require('./redis_client').redis_client();

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


// Persist auth to redis
steamuser.storage.on('save', function(filename, contents, callback) {
    // filename is the name of the file, as a string
    // contents is a Buffer containing the file's contents
    // callback is a function which you MUST call on completion or error, with a single error argument

    client.set(filename, contents, function(err) {
        console.log(filename + ' as sentry? filename')
        callback(err);
    });
});
steamuser.storage.on('read', function(filename, callback) {
    // filename is the name of the file, as a string
    // callback is a function which you MUST call on completion or error, with an error argument and a Buffer argument

    client.get(filename, function(err, file) {
        if(err) {
            callback(err);
            return;
        }

        callback(null, file);
    });
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
        client.hset('bot_auth', account_name, password, redis.print);
        stored_creds = client.hgetall('bot_auth', function (err, obj) {
            console.dir(obj);
        });
        console.log(result);
    });
});
console.log('EOF');
