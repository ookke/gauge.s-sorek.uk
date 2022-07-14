var express = require('express.io');
var fs = require('fs');
var app = express()
app.http().io();

app.use("/wifi", express.static(__dirname));
app.use("/", express.static(__dirname));

//very half assed directory listing, only works for the root dir atm
app.get('/list',  function(req, res) {
	let contents = fs.readdirSync(__dirname);
	var listing = contents.map(itm => ({name: itm, type: itm.indexOf('.') != -1  ? 'file' : 'directory'}));
	res.json(listing);
});

app.get('/parameters', function(req, res) {
	res.json({ ecuparam: [{ h:"asd", v: Math.sin(Date.now()) }] } );
});



app.listen(1337);

