var express = require('express');
var http = require('http');
var getenv = require('getenv');
var client = require('./redis_client').redis_client();
var date = require('./helpers/date');
var fs = require('fs');

var app = express();
var PORT = getenv('PORT');
var MAX_SCORE = 300;
var MIN_SCORE = -10;
var MIN_CHECKOUTS = -10;
var MAX_CHECKOUTS = 300;

// Only used to make new accounts.
var generatePassword = require("password-generator");
var SteamUser = require('steam-user');
var client = require('./redis_client').redis_client();
var steamuser = new SteamUser();

steamuser.storage.on('save', function(filename, contents, callback) {
    client.set(filename, contents, function(err) {
        callback(err);
    });
});
steamuser.storage.on('read', function(filename, callback) {
    client.get(filename, function(err, file) {
        if(err) {callback(err); return;}
        callback(null, file);
    });
});
// End special account-makingses



// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('port', getenv('PORT'));
app.use('/public', express.static(__dirname + '/public'));

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function (req, res) {
  var yeday = date.yesterday();
  var today = date.today();
  // Callback hell.  Could maybe also be a multi() statement.
  client.zrangebyscore(
    ['botapi:checkouts', MIN_CHECKOUTS, MAX_CHECKOUTS, 'WITHSCORES'], function(err, checks)
  {
    client.hgetall('botapi:passwords', function(err, pws){

      client.zrangebyscore(
        [`botapi:${yeday}-api-hits`, MIN_CHECKOUTS, MAX_CHECKOUTS, 'WITHSCORES'], function(err, y_api)
      {
        client.zrangebyscore(
          [`botapi:${today}-api-hits`, MIN_CHECKOUTS, MAX_CHECKOUTS, 'WITHSCORES'], function(err, t_api)
        {

          var checkouts = {}
          if (pws) {
            Object.keys(pws).map(function(uname){
              checkouts[uname] = {};
              checkouts[uname]['username'] = uname;
              checkouts[uname]['password'] = pws[uname];
              checkouts[uname]['today'] = today;
              checkouts[uname]['yesterday'] = yeday;
              checkouts[uname]['checkouts'] = 0;
              checkouts[uname]['yesterday_hits'] = 0;
              checkouts[uname]['today_hits'] = 0;
            })
            for (var i = 0; i < checks.length - 1; i+=2) {
              checkouts[checks[i]]['checkouts'] = checks[i+1] || 0;
            }
            for (var i = 0; i < y_api.length - 1; i+=2) {
              checkouts[y_api[i]]['yesterday_hits'] = y_api[i+1] || 0;
            }
            for (var i = 0; i < t_api.length - 1; i+=2) {
              checkouts[t_api[i]]['today_hits'] = t_api[i+1] || 0;
            }
          }
          var context = {
            checkouts: checkouts,
            yesterday: yeday,
            today: today,
          };
          res.render('index', context);

        })
      })
    })
   })
});

app.post('/reset', function (req, res) {
  var type = req.body.datatype;
  var username = req.body.username;
  var today = date.today();
  var yeday = date.yesterday();

  switch (type){
    case `${today}-api-hits`:
      client.zadd(
        [`botapi:${today}-api-hits`, 0, username], function(err, resp)
      {
        res.json(
          {
            'message': `Reset ${username} to 0 in botapi:${today}-api-hits`,
            'type': 'warning'
          }
        );
      });
      break;
    case `${yeday}-api-hits`:
      client.zadd(
        [`botapi:${yeday}-api-hits`, 0, username], function(err, resp)
      {
        res.json(
          {
            'message': `Reset ${username} to 0 in botapi:${yeday}-api-hits`,
            'type':'warning'
          }
        );
      });
      break;
    case `checkouts`:
      client.zadd(
        [`botapi:checkouts`, 0, username], function(err, resp)
      {
        res.json(
          {
            'message': `Reset ${username} to 0 in botapi:checkouts`,
            'type':'warning'
          }
        );
      });
      break;
    default:
      res.json({'message': `Wat? ${username}, ${type}`, type:'failure'});
  }
});

app.post('/create-user', function (req, res) {

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
              console.log(`created account: ${account_name} with pw ${password}  and [steamID] ${steamid}`);
          }
          var creds_file = 'creds.json';
          fs.readFile(creds_file, 'utf8', function (err,data) {
            if (err) {
              return console.log(err);
            }
            var creds = JSON.parse(data);
            creds[account_name] = password;
            var write_data = JSON.stringify(creds, null, 2);
            fs.writeFile(creds_file, write_data, 'utf8', function (err) {
               if (err) return console.log(err);
            });
          });
          var logout = function(){
            console.log("Logging off");
            steamuser.logOff();
          }
          setTimeout(logout, 1000);
      });
  });
  steamuser.logOn();
  res.json({'message': `Made account`, type:'success'});

});
app.post('/import-users', function (req, res) {

  fs.readFile('creds.json', 'utf-8', function(err, body){
    var creds = JSON.parse(body);
    Object.keys(creds).map(function(uname){
      client.hset('botapi:passwords', uname, creds[uname])
      client.zadd([`botapi:checkouts`, 0, uname], function(err, resp){});
    })

    res.json({'message': `Users Created`, type:'success'});
  })
});
app.post('/reset-redis', function (req, res) {
    client.keys('botapi*', function(err, resp){
      resp.map(function(d){
        client.expireat(d, 10);
      })
    });
    res.json({'message': `Expired Everything`, type:'success'});

});


app.get('/get-old-keys', function (req, res) {
  var today = date.today();
  var yeday = date.yesterday();
  client.keys('botapi:*-api-hits', function(err, resp){
    var resp = resp.filter(function(d){
      return !(d === `botapi:${yeday}-api-hits` || d === `botapi:${today}-api-hits`)
    })
    res.json(resp);
  })
});


app.post('/expire-old-keys', function (req, res) {
  var old_keys = req.body.keys;
  old_keys.map(function(d){
    client.expireat(d, 10);
  })
  res.json({'message': `Keys Expired`, type:'success'});
});

var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log(`Express server listening on port ${app.get('port')}`);
});
