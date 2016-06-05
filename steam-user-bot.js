var SteamUser = require('steam-user');
var generatePassword = require("password-generator");
var client = require('./redis_client').redis_client();


var steamuser = new SteamUser();

var cleanup = require('./helpers/cleanup.js').Cleanup(markLogoff)

function markLogoff() {
  console.log('Closing up shop');
  steamuser.logOff();

  ) // No more checkout claim.
  client.zadd(['botapi:checkouts', 0, steamuser.botnet_name]
  console.log('Logged off.');
};

steamuser.on('error', function(e) {
    console.log(e);
});


// Persist auth to redis
steamuser.storage.on('save', function(filename, contents, callback) {
    // https://github.com/DoctorMcKay/node-steam-user#custom-storage-engine

    client.set(filename, contents, function(err) {
        console.log(filename + ' as sentry? filename')
        callback(err);
    });
});
steamuser.storage.on('read', function(filename, callback) {

    client.get(filename, function(err, file) {
        if(err) {
            callback(err);
            return;
        }

        callback(null, file);
    });
});

steamuser.on('loggedOn', function(details) {
    console.log("Logged into Steam as " + steamuser.steamID.getSteam3RenderedID());
    steamuser.setPersona(SteamUser.EPersonaState.Online);
    steamuser.gamesPlayed(570);

});

// Need to figure out who to log in as
steamuser.on('reauth', function(){

    zrangebyscore(['botapi:checkouts', 0, 0], function(err, uname){
        console.log("Got "+uname+' to increment');
        if(uname===''){
            console.log('No spare accounts available!')
            return;
        }
        else{
            client.zincrby(
                ['botapi:checkouts', 1, resp],
                function(err, ct){

                    console.log('Incrby resp: '+ct)
                    var checkouts = parseInt(ct)
                    if (checkouts==1) {
                        // We wanted creds, only we got em. (RC)
                        // Login time.
                        client.hget(
                            ['botapi:passwords', 1, pw],
                            function(err, resp){
                                var creds = {
                                    "accountName": uname,
                                    "password": pw
                                }
                                steamuser.botnet_name = uname;
                                steamuser.logOn(creds);
                            }
                        )
                    } else {
                        // Lost the race condition, try again.
                        steamuser.emit('reauth')
                    }
            });
        }
    })
});

steamuser.emit('reauth');
