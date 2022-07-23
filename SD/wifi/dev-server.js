var express = require('express.io');
var fs = require('fs');
var msgpack = require('@ygoe/msgpack');

var app = express();
app.http().io();

app.use("/wifi", express.static(__dirname));
app.use("/", express.static(__dirname));

//very half assed directory listing, only works for the root dir atm
app.get('/list',  function(req, res) {
	let contents = fs.readdirSync(__dirname);
	var listing = contents.map(itm => ({name: itm, type: itm.indexOf('.') != -1  ? 'file' : 'directory'}));
	res.json(listing);
});


let randomValueGenerator = (min, max) => {
	return Math.round (Math.max(min, Math.random() * max) * 100) / 100;
}

app.get('/parameters', function(req, res) {
	res.set('Content-Type', 'application/x-msgpack');
	res.end(msgpack.serialize({ ecuparam: [{ h:"Engine Speed", v: randomValueGenerator(0, 7000) },
	{ h:"Coolant Temp", v: randomValueGenerator(0, 100) },
	{ h:"Oil Temp", v: randomValueGenerator(0, 100) }] }));
});



app.listen(1337);

