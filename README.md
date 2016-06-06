# BotAPI

Scalable Dota 2 steambots to enable replay fetching.

## Why this?

We had two problems:

    1. resuming on disconnect
    2. having to run a single worker instance on multiple tasks

1 was annoying because it forced manual restart of the system, and 2 made those restarts painful because we had so many systems to toggle.

Steam-User is a node module that should help our "restarting on disconnect" problem.  To address 2, I wrote a new steambot implementation using Steam-User.  Its major magic is keeping its memory in redis.  Instead of having to deal with steamguard codes, these bots persist all of their auth information to redis for easy access.  But wait, there's more: these bots also pull their credentials from redis, keeping track of what is checked out, and sanely manage state when they go down.

## An example

Container Alice checks out a credential pair.  On logon, she stores the security nonce in redis.  Alice does her job, then retires for the day, cleaning up the state of things in checkout and waving goodbye to Valve per protocol.

Container Bob checks out the same credential pair after Alice is done.  (There are checks in place to prevent duplicate checkouts.)  Bob pulls the same security nonce from redis, bypassing annoying logon problems, and persists the new nonce to redis.  (Such that Carol may use them later.)

## How does cred checkout work?

We use redis to keep track of which accounts are currently not in use, and on startup bots pull unused creds to login with.  (This is managed with the sorted set `botapi:checkouts`; the score of each key (usernames) is the number of checkouts demanded of that uname.)

The process should be race-condition protected, and works like this:

Alice asks the sorted set for the first account without a checkout, say 'abaddon'.

Bob asks the same, and gets the same.

Alice and Bob both issue INCRs against the checkouts.  Redis happily supplies the zscore of `abaddon` in `botapi:checkouts` each time.  One of the two (depending on who INCRd first) gets a return value of 1 and the other gets 2.  The bot that did not get 1 realized he was too slow checking out, and tries again.  Notably, the INCRs remove that username from the 0-checked-out tier of the credential pool, so other bots will be getting other usernames as they spin up.  The bot that did get 1 pulls out a password

On process shutdown, a cleanup function calls logOut() to be polite to Valve, and resets the checkouts value for that username to 0.

### Redis Schema


botapi:checkouts = <uname> <score=int> // Scored set
botapi:passwords = {uname:pw}
botapi:<uname>:api-requests:<dt> = <int>


### Things that need work

Do the sentry files for different accounts not conflict?  Do we need to salt the filename?

We should count the number of API calls per day and deauth/reauth if an account maxes out

There should be a web api that enables making accounts and seeing checkout status/requests.



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


# Setup script

var client = require('./redis_client').redis_client();

var args2 = ['botapi:passwords', -10, 10, 'WITHSCORES'];
client.ZRANGEBYSCORE(args2, function (err, response) {
    if (err) throw err;
    console.log('Contents', response);
});
client.hgetall("botapi:passwords", function(err, resp){
    console.log(resp)
})
client.expire(["botapi:passwords", 1])
client.hset(["botapi:passwords", "jupasehudi", "gemecalite"], function(err, resp){
    console.log(resp)
});
client.hset(["botapi:passwords", "wozawiwapo", "kabizanoke"], function(err, resp){
    console.log(resp)
});

client.expire(["botapi:checkouts", 1])

var args = ['botapi:checkouts', 0, 'wozawiwapo']
client.zadd(args, function (err, response) {});
var args = ['botapi:checkouts', 0, 'jupasehudi']
client.zadd(args, function (err, response) {});

client.zrangebyscore(['botapi:checkouts', 0, 10, 'WITHSCORES'], function(err, resp){
    console.log("Got "+resp);
});
