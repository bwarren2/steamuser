var express = require('express');
var http = require('http');
var getenv = require('getenv');
var client = require('./redis_client').redis_client();
var date = require('./helpers/date').getDateTime;

var app = express();
var PORT = getenv('PORT');

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('port', getenv('PORT'));
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  client.zrangebyscore(
    ['botapi:checkouts', -100, 100, 'WITHSCORES'], function(err, checks)
  {
    client.hgetall('botapi:passwords', function(err, pws){


      var checkouts = {}
      for (var i = 0; i < checks.length - 1; i+=2) {
        checkouts[checks[i]] = {};
        checkouts[checks[i]]['checkouts'] = checks[i+1];
        checkouts[checks[i]]['username'] = checks[i];
        checkouts[checks[i]]['password'] = pws[checks[i]];
      }
      res.render('index',  {checkouts: checkouts});
    })
   })
});

var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log(`Express server listening on port ${app.get('port')}`);
});
