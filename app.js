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
    // No match ID, display regular index.
    // res.render('index', { title: 'match urls!' });
    // res.end();
  } else {
    if (!isNaN(matchId) && parseInt(matchId, 10) < 1024000000000) {
      matchId = parseInt(matchId, 10);

        if (steambot.ready) {
          // We need new data from Dota.
          steambot.getMatchDetails(matchId, function (err, data) {
            if (err) {
              res.json({error: err});
            } else {
              res.json({ replay_url: url });
            }
            res.end();
          });

          // If Dota hasn't responded by 'request_timeout' then send a timeout page.
          setTimeout(
            function () {
              res.json({ error: 'timeout' });
              res.end();
            },
            config.request_timeout
          );
        } else {
          // We need new data from Dota, and Dota is not ready.
          res.json({ error: 'notready' });
          res.end();
        }
    } else {
      // Match ID failed validation.
      res.render('index', {
        title: 'match urls!',
        error: "invalid"
      });
      res.end();
    }
  }
});

http.createServer(app).listen(app.get('port'), function () {
  console.log(`Express server listening on port ${app.get('port')}`);
});
