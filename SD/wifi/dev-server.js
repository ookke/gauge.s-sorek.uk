var express = require('express.io');
var app = express()
app.http().io();

app.use("/wifi", express.static(__dirname));
app.use("/", express.static(__dirname));

app.get('/api/params/:paramHeader', function(req, res) {
	console.log('got param get for: '+req.params.paramHeader);
	res.json(Math.random());
});

app.get('/data', function(req, res) {
	res.send('STimestamp (ms),FPS (),Free Heap (),Max Heap Alloc (),Oil temperature (),Oil pressure (),Economy (),Econ avg 1 (),Econ avg 2 (),Trip 1 (),Trip 2 (),Fuel usage (),Engine Speed (),Engine Load (),Calculated load (),Mass Airflow (),MAF Voltage (),Knock Current (),Vanos (),TPS (),TPS Volt (),Ignition Angle (),Fuel Inj (),Intake Air Temp (),Coolant Temp (),Speed (),IACV (),Lambda Int 1 (),Lambda Int 2 (),Lambda 1 (),Lambda 2 (),Battery (),WBO (),Analog 1 (),Analog 2 (),Analog 3 (),Analog 4 (),GPS Speed (),GPS North (),GPS Altitude (),GPS Latitude (),GPS Longitude (),Accel X (),Accel Y (),Accel Z (),Analog speed (),Log speed (),RPS (),\n'+
'V0,21.28,150.23,95.99,44.5,219.0,7.09,13.84,12.71,263.73,263.72,2.91,1773,50.4,50.66,16.3,1.11,0.00,21.3,12.9,0.64,-1.2,1.86,19.2,85.0,43,38.25,0.0,0.0,4.88,1.70,13.03,13.21,1.38,0.00,4.11,0.53,43.8,242.2,169.5,53.549885,-1.511687,-0.000,-0.000,0.000,8.77,14.93,8.33,\n'+
'V2,21.28,150.23,95.99,44.5,219.0,7.09,13.84,12.71,263.73,263.72,2.91,1773,50.4,50.66,16.3,1.11,0.00,21.3,12.9,0.64,-1.2,1.86,19.2,85.0,43,38.25,0.0,0.0,4.88,1.70,13.03,13.21,1.38,0.00,4.11,0.53,43.8,242.2,169.5,53.549885,-1.511687,-0.000,-0.000,0.000,8.77,6.02,8.33,\n'+
'V69,20.83,146.29,95.99,44.5,219.6,6.75,13.84,12.71,263.73,263.72,2.82,1775,48.1,50.91,15.5,1.09,0.00,18.0,12.9,0.64,-1.6,1.80,19.2,85.0,43,0.00,0.0,0.0,4.88,1.78,13.03,12.90,1.35,0.00,4.10,0.61,43.8,242.2,169.5,53.549885,-1.511687,-0.000,-0.000,0.000,8.26,249.99,8.33,\n'+
'V136,21.28,146.70,95.99,44.5,220.1,6.53,13.84,12.71,263.73,263.72,2.72,1775,48.1,50.91,15.5,1.09,0.00,18.0,12.9,0.64,-1.6,1.80,19.2,85.0,43,0.00,0.0,0.0,4.88,1.78,13.03,12.90,1.35,0.00,4.10,0.61,43.9,242.6,169.4,53.549873,-1.511717,-0.000,-0.000,0.000,8.26,15.15,8.33,\n'
)
});


app.get('/list',  function(req, res) {
	res.json([{name: 'index.htm', type: 'file'},{name: 'Gauge.S-9_08-30.csv', type: 'file'}]);
});

app.listen(1337);

