var express = require('express')
var feed = require('feed-read')

var url = "http://blog.soat.fr/feed/";

var port = process.env.port || 1337
var app = express(); 

app.get('/', function (req, res){
    res.writeHead(200, { 'Content-Type': 'application/json' });

    var feeder = new Promise(function(resolve, reject){
        feed(url, function (err, articles){
            if (err) {
                reject(err);
            } else {
                result = [];
                for (var i = 0; i < articles.length; i++) {
                    result.push( { title: articles[i].title, url: articles[i].url, author: articles[i].author, date: articles[i].published });
                }
                resolve(result);
            }
        });
    }).then(function (result) {
        res.write(JSON.stringify(result));
        res.end();
    });

    

});

app.listen(port);
