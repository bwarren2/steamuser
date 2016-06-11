var express = require('express');
var http = require('http');
var getenv = require('getenv');
var config = require("./config");

var SteamUser = require('steam-user');
var steambot = require('./steam-user-bot').setup();
var dota2 = require("dota2");

var app = express();

// all environments
app.set('port', getenv('PORT'));

steambot.emit('reauth');

app.get('/match-details', function (req, res) {
  var matchId = req.query.match_id;
  if (!matchId) {
      res.json({ error: 'match-id-required' });
  } else {
    if (!isNaN(matchId) && parseInt(matchId, 10) < 1024000000000) {
        matchId = parseInt(matchId, 10);
        if (steambot.ready) {
          steambot.getMatchDetails(matchId, function (err, data) {
            if (err) {
                // Because of the GC timeout crashing on headers-sent
                if (!res.headersSent){
                    console.log(`Errored for ${matchId} ${err}`);
                    res.json({error: err});
                }
            } else {
                console.log(`Success for ${matchId}!`);
                res.json(data);
            }
          });

          // If Dota hasn't responded by 'request_timeout' then send a timeout
          setTimeout(
            function () {
                if (!res.headersSent){
                  console.log('Running timeout')
                  res.json({ error: 'timeout' });
                }
            },
            config.request_timeout
          );
        } else {
          // Dota is not ready.
          res.json({ error: 'notready' });
        }
    } else {

      // Match ID failed validation.
      res.json({ error: 'invalid' });

    }
  }
});

app.get('/', function (req, res) {
  res.json({msg:'ypu, still here'})
})

http.createServer(app).listen(app.get('port'), function () {
  console.log(`Express server listening on port ${app.get('port')}`);
});
