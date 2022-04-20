////////////////////////////////////////////////////////////////////////
// Required modules
////////////////////////////////////////////////////////////////////////

var async       = require('async');
var googl       = require('goo.gl');
var md5         = require('md5');
var request     = require('request');
var moment      = require('moment');
var FB          = require('fb');
var Promise     = require('bluebird');
var pg = require('pg');

var restaurant  = require('./restaurant');

const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const bcryptjs = require('bcryptjs');
const salt=10;

const connUrl = "postgres://fahad:siawa488@fahad-db.cazo0bez0lzq.us-east-1.rds.amazonaws.com:5432/fahad_db";
var client = new pg.Client(connUrl);
client.connect();

////////////////////////////////////////////////////////////////////////
// API handlers for the module
////////////////////////////////////////////////////////////////////////


// API to login user
exports.getTables    = getTables;
exports.addTable    = addTable;
exports.deleteTable    = deleteTable;

async function getTables(req, res){
    console.log("Getting tables");

	// Capture the input fields
    var body_access_token  = req.body.access_token;

	// Ensure the input fields exists and are not empty
	if (body_access_token) {
        let role = await restaurant.isLoggedIn(body_access_token);
        if (role==0) {
            var response = {
                message    : "Please login to use service",
            };
            res.send(response);
            return;  
        }
        else if (role==2) {
            var response = {
                message    : "You must be an Admin to view tables",
            };
            res.send(response);
            return;  
        }
        //isAdmin
        else {
            try {
                var query = client.query(`SELECT table_no, no_of_seats FROM db_tables where is_active=1`, (err, result) => {
                    if (err) {
                        var response = {
                            message    : err.message,
                        };
                        res.send(response);
                        return;
                    }
                    else if (!result.rows[0]){
                        var response = {
                            message    : "No tables found",
                        };
                        res.send(response);
                        return;
                    }
                    else {
                        var response = {
                            message    : result.rows
                        };
                        res.send(response);
                        return;
                    }
                });
            } catch (error) {
                return new Error (err.message);
            } 
        }
    }
    else {
        var response = {
            message    : "Missing fields",
        };
        res.send(response);
        return; 
    }
};


async function addTable(req, res){
    console.log("Adding table");

	// Capture the input fields
    var body_access_token  = req.body.access_token;
    var body_table_no  = req.body.table_no;
    var body_no_seats  = req.body.no_seats;
    var isDuplicate = 0;

	// Ensure the input fields exists and are not empty
	if (body_access_token && body_table_no && body_no_seats) {
        let role = await restaurant.isLoggedIn(body_access_token);
        if (role==0) {
            var response = {
                message    : "Please login to use service",
            };
            res.send(response);
            return;  
        }
        else if (role==2) {
            var response = {
                message    : "You must be an Admin to add a table",
            };
            res.send(response);
            return;  
        }
        //isAdmin
        else {
            try {
                var query = client.query(`SELECT table_no FROM db_tables where is_active=1`, (err, result) => {
                    if (err) {
                        var response = {
                            message    : err.message,
                        };
                        res.send(response);
                        return;
                    }
                    else if (!Number.isInteger(body_table_no) || !Number.isInteger(body_no_seats)) {
                        var response = {
                            message    : "Table No. and No. of Seats must be a valid number",
                        };
                        res.send(response);
                        return;
                    }
                    else if (body_no_seats<1 || body_no_seats>12) {
                        var response = {
                            message    : "No. of Seats must be between 1-12 ",
                        };
                        res.send(response);
                        return;
                    }
                    else {
                        if (result.rows[0]) {
                            result.rows.forEach( (row) =>  {
                                if (row.table_no==body_table_no) {
                                    isDuplicate = 1;
                                    var response = {
                                        message    : "Table No. already exists",
                                    };
                                    res.send(response);
                                    return;
                                }
                            });
                        }

                    //Insert
                    if (isDuplicate==0) {
                        try {
                            var query = client.query(`INSERT INTO db_tables (table_no, no_of_seats,is_active) VALUES (${body_table_no},${body_no_seats},1)`, (err, result) => {
                                if (err) {
                                    var response = {
                                        message    : err.message,
                                    };
                                    res.send(response);
                                    return;
                                }
                                else {
                                    var response = {
                                        message    : "Table added successfully",
                                    };
                                    res.send(response);
                                    return;
                                }
                            });
                        } catch(error) {
                            return new Error (error.message)
                        }
                    }  

                    }
                });
                } catch (error) {
                    return new Error (error.message);
                } 

        }
    }
    else {
        var response = {
            message    : "Missing fields",
        };
        res.send(response);
        return; 
    }
}

async function deleteTable(req, res){
    console.log("Deleting table");

	// Capture the input fields
    var body_access_token  = req.body.access_token;
    var body_table_no  = req.body.table_no;
    var isDuplicate = 0;

	// Ensure the input fields exists and are not empty
	if (body_access_token && body_table_no) {
        let role = await restaurant.isLoggedIn(body_access_token);
        if (role==0) {
            var response = {
                message    : "Please login to use service",
            };
            res.send(response);
            return;  
        }
        else if (role==2) {
            var response = {
                message    : "You must be an Admin to delete a table",
            };
            res.send(response);
            return;  
        }
        //isAdmin
        else {
            try {
                var query = client.query(`SELECT table_no FROM db_tables where table_no=${body_table_no} AND is_active=1`, (err, result) => {
                    if (err) {
                        var response = {
                            message    : err.message,
                        };
                        res.send(response);
                        return;
                    }
                    else {
                        if (!result.rows[0]) {
                                isDuplicate = 1;
                                var response = {
                                    message    : "Table No. doesn't exist",
                                };
                                res.send(response);
                                return;
                        }

                    //Delete
                    else if (true) {
                        try {
                            var query = client.query(`UPDATE db_tables SET is_active=0 WHERE table_no=${body_table_no}`, (err, result) => {
                                if (err) {
                                    var response = {
                                        message    : err.message,
                                    };
                                    res.send(response);
                                    return;
                                }
                                else {
                                    var response = {
                                        message    : "Table deleted successfully",
                                    };
                                    res.send(response);
                                    return;
                                }
                            });
                        } catch(error) {
                            return new Error (error.message)
                        }
                    }  

                    }
                });
                } catch (error) {
                    return new Error (error.message);
                } 

        }
    }
    else {
        var response = {
            message    : "Missing fields",
        };
        res.send(response);
        return; 
    }
}

