var SteamUser = require('steam-user');
var generatePassword = require("password-generator");
var dota2 = require("dota2");
var client = require('./redis_client').redis_client();

var steamuser = new SteamUser();

var cleanup = require('./helpers/cleanup.js').Cleanup(myCleanup)

function myCleanup() {
  console.log('Closing up shop');
  steamuser.logOff();
  console.log('Logged off.');
  client.set(creds['accountName'], 'out', console.log)
};
var creds = {
    "accountName": "wozawiwapo",
    "password": "kabizanoke"
}
steamuser.logOn(creds);

steamuser.on('error', function(e) {
    console.log(e);
});

steamuser.on('loggedOn', function(details) {
    console.log("Logged into Steam as " + steamuser.steamID.getSteam3RenderedID());
    steamuser.setPersona(SteamUser.EPersonaState.Online);
    steamuser.gamesPlayed(570);

    var Dota2 = new dota2.Dota2Client(steamuser.client, true);
    Dota2.launch();
    Dota2.on("ready", function () {
        console.log("Dota 2 ready");
        ready = true;
        Dota2.requestMatchDetails(2408280426, function (err, body) {
          // if (!self.match_deferreds[matchId]) {
          //   return;
          // }
          console.log(body);
          // self.match_deferreds[matchId].resolve(body);
        });
    });

});

steamuser.on('sentry', function(sentryHash) {
  console.log("sentry: " + sentryHash)
});

console.log('EOF');


