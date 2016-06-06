var SteamUser = require('steam-user');
var generatePassword = require("password-generator");
var client = require('./redis_client').redis_client();
var dota2 = require("dota2");
var deferred = require("deferred");

var setup = function(){

    var steamuser = new SteamUser();
    steamuser.match_deferreds = {}; // Prevents F5DoS.

    var cleanup = require('./helpers/cleanup.js').Cleanup(markLogoff)

    function markLogoff() {
      console.log('Closing up shop');

      // Tell valve we are gone.
      steamuser.logOff();

      // No more checkout claim.
      client.zadd(
        ['botapi:checkouts', 0, steamuser.botnet_name],
        function(err, resp){}
      );
      console.log('Logged off.');
    };

    steamuser.on('error', function(e) {
        console.log(e);
    });


    // Persist auth to redis
    steamuser.storage.on('save', function(filename, contents, callback) {
        // https://github.com/DoctorMcKay/node-steam-user#custom-storage-engine

        client.set(filename, contents, function(err) {
            console.log(filename + ' as storage filename')
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

        var Dota2 = new dota2.Dota2Client(steamuser.client, true);
        Dota2.launch();
        steamuser.Dota2 = Dota2;
        Dota2.on("ready", function () {
            console.log("Dota 2 ready");
            steamuser.ready = true;
        });
        Dota2.on("unhandled", function (kMsg) {
            console.log(`Unhandled message: ${kMsg}`);
        });

    });



    // Need to figure out who to log in as
    steamuser.on('reauth', function(){

        console.log('in reauth');
        client.zrangebyscore(
            ['botapi:checkouts', 0, 0, 'LIMIT', 0, 1],
            function(err, uname)
        {
            uname = uname[0];
            console.log("Got "+uname+' to increment');
            if(uname===''){
                console.log('No spare accounts available!')
                return;
            }
            else{
                client.zincrby(
                    ['botapi:checkouts', 1, uname],
                    function(err, ct){

                        console.log('Incrby resp: '+ct)
                        var checkouts = parseInt(ct)
                        if (checkouts==1) {
                            // We wanted creds, only we got em. (RC)
                            // Login time.
                            client.hget(
                                ['botapi:passwords', uname],
                                function(err, pw){
                                    var creds = {
                                        "accountName": uname,
                                        "password": pw
                                    };
                                    console.log(creds);
                                    steamuser.botnet_name = uname;
                                    steamuser.logOn(creds);
                                }
                            )
                        } else {
                            // Lost the race condition, try again.
                            steamuser.emit('reauth');
                        }
                });
            }
        })
    });

steamuser.getMatchDetails = function getMatchDetails (matchId, callback) {
  if (!steamuser.ready) {
    console.log("Not ready");
    callback("GC not ready");
    return;
  }
  console.log(`Pinging for ${matchId}`);
  var self = this;

  // F5DoS protection; if we're waiting for a response for this Match ID then don't send a new request.
  if (!this.match_deferreds[matchId]) {
    this.match_deferreds[matchId] = new deferred();
    this.match_deferreds[matchId].pms = this.match_deferreds[matchId].promise();
    this.Dota2.requestMatchDetails(matchId, function (err, body) {
      if (!self.match_deferreds[matchId]) {
        return;
      }
      self.match_deferreds[matchId].resolve(body);
    });
  }

  this.match_deferreds[matchId].pms.then(function (data) {
    // console.log(data);
    console.log('resolving')
    delete self.match_deferreds[matchId];
    if (data.result !== 1) {
        console.log('fail')
      callback("invalid");
    }
    else {
      data['id'] = matchId;
      console.log(data);
      callback(
        null,
        data // To match return format of other api
      );
    }
  });

  // Time out request after so long - GC doesn"t tell us match ids when it returns bad status",
  // so this is the best way to weed out invalid match ids.
  setTimeout(function () {
    delete self.match_deferreds[matchId];
  }, steamuser.steam_response_timeout);
};

    return steamuser;
}

exports.setup = setup;
