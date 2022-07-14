var express = require('express.io');
var fs = require('fs');
var app = express()
app.http().io();

app.use("/wifi", express.static(__dirname));
app.use("/", express.static(__dirname));

app.get('/api/params/:paramHeader', function(req, res) {
	console.log('got param get for: '+req.params.paramHeader);
	res.json(Math.random());
});

app.get('/parameters', function(req, res) {
	res.json({ ecuparam: [{ h:"asd", v: Math.sin(Date.now()) }] } );
});

//very half assed directory listing, only works for the root dir atm
app.get('/list',  function(req, res) {
	let contents = fs.readdirSync(__dirname);
	var listing = contents.map(itm => ({name: itm, type: itm.indexOf('.') != -1  ? 'file' : 'directory'}));
	res.json(listing);
});

app.listen(1337);

