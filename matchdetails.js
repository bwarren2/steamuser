var SteamUser = require('steam-user');
var steamuser = require('./steam-user-bot').setup();

var dota2 = require("dota2");


steamuser.emit('reauth');

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
          console.log(body);
        });
    });

});

console.log('EOF');


