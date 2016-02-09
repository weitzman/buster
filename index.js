#!/usr/bin/env node
//var express = require('express');
//var port = process.env.PORT || 3000;
//var express = require('express');
//var app = express();
//
//app.get('/', function(request, response) {
//  response.sendfile(__dirname + '/index.html');
//}).configure(function() {
//  app.use('/images', express.static(__dirname + '/images'));
//}).listen(port);

var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT || 3000);
