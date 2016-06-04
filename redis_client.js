'use strict';
var redis = require('redis');
var getenv = require('getenv');
var url = require('url');

var redis_client = function(){
    var uri = getenv('REDISTOGO_URL')
    var rtg = url.parse(uri);
    var client = redis.createClient(rtg.port, rtg.hostname, {detect_buffers: true});
    if(rtg.auth !== null){
        client.auth(rtg.auth.split(':')[1]);
    }
    return client;
}

exports.redis_client = redis_client;
