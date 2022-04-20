
process.env.NODE_CONFIG_DIR = __dirname + '/config/';
//config = require('config');
console.log("STARTING RESTAURANT API SERVICE")

var express         = require('express');
var http            = require('http');
var https           = require('https');
var path            = require('path');
var morgan          = require('morgan');
var fs              = require('fs');
var bodyParser      = require('body-parser');
var Promise         = require('bluebird');

var app     = express();

app.set('view engine', 'jade');

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(morgan('dev'));
//////////////////////////////////

// set up the port number
app.listen(8080, () => {
    console.log(`Restaurant app listening on port 8080...`)
  })

////////////////////////////////////////////////////////////////////////
// API Handler Modules
////////////////////////////////////////////////////////////////////////
var restaurant  = require('./routes/restaurant');
var table  = require('./routes/table');
var reservation  = require('./routes/reservation');

////////////////////////////////////////////////////////////////////////
// All APIs
////////////////////////////////////////////////////////////////////////
app.post('/login_user', restaurant.loginUser);
app.post('/register_user', restaurant.registerUser);

app.post('/get_tables', table.getTables);
app.post('/add_table', table.addTable);
app.post('/delete_table', table.deleteTable);

app.post('/check_time_slots', reservation.checkSlots);



