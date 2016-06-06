# BotAPI


## Redis Schema

botapi:passwords = {uname:pw}
botapi:<uname>:api-requests:<dt> = <int>

botapi:checkouts = <uname> <score=int> // Scored set



Adding an account:


    Add to botapi:passwords
    ```
    var client = require('./redis_client').redis_client();
    var args2 = [ 'botapi:passwords', 'uname', 'pass'];
    client.hset(args2, function (err, response) {
        if (err) throw err;
        console.log('Contents', response);
    });
    ```

    Add to botapi:checkouts with score 0
    ```
    var client = require('./redis_client').redis_client();
    var args = ['botapi:checkouts', 0, 'fakeuname']
    client.zadd(args, function (err, response) {});
    ```

    Persist uname + pass somewhere safe



var args2 = ['botapi:passwords', -10, 10, 'WITHSCORES'];
client.ZRANGEBYSCORE(args2, function (err, response) {
    if (err) throw err;
    console.log('Contents', response);
});
client.hset(["botapi:passwords", "jupasehudi", "gemecalite"], redis.print);
client.hset(["botapi:passwords", "wozawiwapo", "kabizanoke"], redis.print);
