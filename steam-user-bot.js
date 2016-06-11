var SteamUser = require('steam-user');
var generatePassword = require("password-generator");
var client = require('./redis_client').redis_client();
var dota2 = require("dota2");
var date = require('./helpers/date');

var gc_response_timeout = 20000;
var max_hits = 90;

var setup = function(){

  var steamuser = new SteamUser();
  steamuser.match_deferreds = {}; // Pevents F5DoS.

  var cleanup = require('./helpers/cleanup.js').Cleanup(markLogoff)

  function markLogoff() {
    console.log('Closing up shop');
    steamuser.ready = false;
    // Tell valve we are gone.
    steamuser.logOff();

    // No more checkout claim.
    if (
        steamuser.botnet_name!=='undefined'&&steamuser.botnet_name!==undefined
    ) {

        client.zadd(
        ['botapi:checkouts', 0, steamuser.botnet_name],
        function(err, resp){});
    }
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
    var dt = date.today();

    console.log('in reauth');
    client.zrangebyscore(
      ['botapi:checkouts', 0, 0], function(err, unames)
    {
      client.zrangebyscore(
        [`botapi:${dt}-api-hits`, 0, max_hits*10, 'WITHSCORES'], function(err, hits){
          api_hit_bad = [];
          for (var i = 0; i < hits.length - 1; i+=2) {
            if (hits[i+1]>=max_hits) {
              api_hit_bad.push(hits[i]);
            }
          }

          // Only use a name that has api hits left.
          var uname = undefined;
          unames.map(function(d){
            if(api_hit_bad.indexOf(d)==-1){
                uname = d;
            }
          });

          if(typeof uname=='undefined'){
            var redo = function(){
                steamuser.emit('reauth')
            }
            setTimeout(redo, 1000 * 60 * 60 * 24); // One day;
            console.log('Thought there were no names to use.')
            return;
          }

          console.log("Got "+uname+' to increment');
          if(uname===''){
            console.log('No spare accounts available!')
            return;
          } else if (typeof uname == 'undefined'){
            console.log('Got bogus uname.')
            return;
          }
          else{
            console.log('Checking out.')
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
                  })
                } else {
                  // Lost the race condition, try again.
                  steamuser.emit('reauth');
                }
            });
          }
      });
    });
  });

  steamuser.getMatchDetails = function getMatchDetails (matchId, callback) {
    if (!steamuser.ready) {
      console.log("Not ready");
      callback("GC not ready");
      return;
    }
    console.log(`Pinging for ${matchId} with ${steamuser.botnet_name}`);
    steamuser.Dota2.requestMatchDetails(matchId, function (err, data) {
      var dt = date.today();
      console.log(`Incrementing botapi:${dt}-api-hits for ${steamuser.botnet_name}`)
      client.zincrby([`botapi:${dt}-api-hits`, 1, steamuser.botnet_name], function(err, ct){

        if (data.result !== 1) {
          callback("invalid");
        }
        else {
            console.log("Should have incrd.")
            if(ct>=max_hits){
                markLogoff()
                var fn = function(){
                    console.log(`Max hits reached on ${steamuser.botnet_name}, reauthing.`)
                    steamuser.emit('reauth');
                }
                setTimeout(fn, 1000);

            }
            data['id'] = matchId;
            callback(
                null,
                data // To match return format of other api
            );
        }
      });
    });

    // Time out request after so long - GC doesn"t tell us match ids when it returns bad status",
    // so this is the best way to weed out invalid match ids.
    setTimeout(function () {
    callback("timeout");
    }, gc_response_timeout);
  };

  return steamuser;
}

exports.setup = setup;
