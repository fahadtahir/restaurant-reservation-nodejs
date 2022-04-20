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
exports.checkSlots    = checkSlots;

async function checkSlots(req, res){
    console.log("Checking slots");

	// Capture the input fields
    var body_access_token  = req.body.access_token;
    var body_no_seats  = req.body.no_seats;
    var prom = null;

	// Ensure the input fields exists and are not empty
	if (body_access_token && body_no_seats) {
        let role = await restaurant.isLoggedIn(body_access_token);
        if (role==0) {
            var response = {
                message    : "Please login to use service",
            };
            res.send(response);
            return;  
        }
        else {
            try {
                //Get closest no. of seats available
                var closest_no_seats;
                var query = client.query(`SELECT MIN(no_of_seats) AS minimum FROM db_tables where is_active=1 AND no_of_seats>=${body_no_seats}`, (err, result) => {
                    if (err) {
                        var response = {
                            message    : err.message,
                        };
                        res.send(response);
                        return;
                    }
                    else {
                        if (!result.rows[0]){
                            var response = {
                                message    : "No tables found with required no. of seats",
                            };
                            res.send(response);
                            return;
                        }
                        else {
                            closest_no_seats = result.rows[0].minimum;
                            try {
                                var query = client.query(`SELECT table_no FROM db_tables where db_tables.is_active=1 AND no_of_seats=${closest_no_seats}`, async (err, result) => {
                                if (err) {
                                    var response = {
                                        message    : err.message,
                                    };
                                    res.send(response);
                                    return;
                                }
                                else {
                                    if (!result.rows[0]){
                                        var response = {
                                            message    : "No slots available",
                                        };
                                        res.send(response);
                                        return;
                                    }
                                    else {
                                        var slots = [];
                                        getSlotsInternal(result.rows).then((val) => {
                                            slots = val;
                                            var response = {
                                                message    : slots,
                                            };
                                            res.send(response);
                                            return;
                                        });

                                    }
                                }

                            });
                            } catch (error) {
                                return new Error (error.message);
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
};





async function getSlotsInternal(param) {
        return new Promise((resolve, reject) => {
            var slots_master=[];
            param.forEach((value, index, array) => {
                getSlotsInternal2(value).then(val =>{
                    slots_master.push(val);
                    if (index === array.length -1) resolve(slots_master);
                });
            });
        });
        
}


async function getSlotsInternal2(row) {
    return new Promise((resolve, reject)=>{
        var slots = [];
            try {
                var query = client.query(`SELECT *,now() AT TIME ZONE 'Asia/Riyadh' FROM  db_reservations where is_active=1 AND (time_start>=now() AT TIME ZONE 'Asia/Riyadh' OR time_end>=now() AT TIME ZONE 'Asia/Riyadh')  AND table_no=${row.table_no} ORDER BY time_start ASC`, (err, result2) => {
                    if (err) {
                        throw new Error(err.message);
                    }
                    else {
                        if (!result2.rows[0]){
                            slots.push({"table_no":row.table_no,"time_start":moment().format("HH:mm"),"time_end": "23:59"});
                        }
                        else {
                            result2.rows.forEach( (row2, idx)=> { 
                                let temp_start_time = moment(row2.time_start);
                                let temp_end_time = moment(row2.time_end);
        
                                if (idx==0) {
                                    //First booking is after current time
                                    if (temp_start_time > moment()) {
                                            slots.push({"table_no":row.table_no,"time_start":moment().format("HH:mm"),"time_end": temp_start_time.format("HH:mm")});
                                    }
                                    else {
                                        //Currently booked - Check gap betwwen end of this and start of next/end of day
                                        let temp_start_time_next = result2.rows[idx+1] ? moment(result2.rows[idx+1].time_start) : moment().endOf('day');
                                        if (temp_start_time_next>temp_end_time) {
                                            slots.push({"table_no":row.table_no,"time_start":temp_end_time.format("HH:mm"),"time_end": temp_start_time_next.format("HH:mm")});
                                        }
                                    }
                                }
                                else {
                                    //Simpler case now - Just check gap betwwen end of this and start of next/end of day
                                    let temp_start_time_next = result2.rows[idx+1] ? moment(result2.rows[idx+1].time_start) : moment().endOf('day');
                                    if (temp_start_time_next>temp_end_time) {
                                        slots.push({"table_no":row.table_no,"time_start":temp_end_time.format("HH:mm"),"time_end": temp_start_time_next.format("HH:mm")});
                                    }
                                }
                            });
                        }
                        return resolve(slots);
                    }

                });

            } catch (error) {
                return new Error (error.message);
            }
    });
}