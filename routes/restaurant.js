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
exports.loginUser    = loginUser;
exports.registerUser    = registerUser;
exports.isLoggedIn    = isLoggedIn;

async function loginUser(req, res){
    console.log("Logging in user");

	// Capture the input fields
    var empNo       = req.body.empNo;
    var password    = req.body.password;

	// Ensure the input fields exists and are not empty
	if (empNo && password) {
        var hashpass = md5.digest_s(password);

        try {
            var query = client.query(`SELECT * FROM db_users where empno='${empNo}' AND password='${hashpass}'`, (err, result) => {
                if (err) {
                    var response = {
                        message    : "Error getting user",
                    };
                    res.send(response);
                    return;
                }
                else {
                    if (result.rows[0]) {
                        let access_token = generateToken(password+empNo);
                        try {
                            client.query(`UPDATE db_users SET access_token='${access_token}' where empno='${empNo}'`, (err, result) => {
                                if (!err) {
                                    var response = {
                                        message    : "Successfully logged in",
                                        token : access_token
                                    };
                                    res.send(response);
                                    return;
                                }
                                else{
                                    var response = {
                                        message    : "Error logging in"
                                    };
                                    res.send(response);
                                    return;
                                }
                            });
                        } catch (error) {
                            return new Error (error.message);
                        }
                    }
                    else {
                        var response = {
                            message    : "No such user"
                        };
                        res.send(response);
                        return;
                    }
                };
            });
        } catch (error) {
            throw new Error(error.message);
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


async function registerUser(req, res){
    console.log("Creating user");

	// Capture the input fields
    var empNo       = req.body.empNo;
    var password    = req.body.password;
    var fullname    = req.body.fullname;
    var body_access_token    = req.body.access_token;

	// Ensure the input fields exists and are not empty
	if (empNo && password && fullname && body_access_token) {
        let role = await isLoggedIn(body_access_token);
        if (role==0) {
            var response = {
                message    : "Please login to use service",
            };
            res.send(response);
            return;  
        }
        else if (role==2) {
            var response = {
                message    : "You must be an Admin to register new users.",
            };
            res.send(response);
            return;  
        }
        //isAdmin
        else {
            if (empNo.length!=4 || ! (/^\d+$/.test(empNo))) {
                var response = {
                    message    : "Employee No. must be 4 digits only",
                };
                res.send(response);
                return;
            }
            else if (password.length<6) {
                var response = {
                    message    : "Password must be atleast 6 characters long",
                };
                res.send(response);
                return;
            }
            else {
                try {
                    var query = client.query(`SELECT * FROM db_users where empno='${empNo}'`, (err, result) => {
                        if (err) {
                            var response = {
                                message    : err.message,
                            };
                            res.send(response);
                            return;
                        }
                        else if (result.rows[0]){
                            var response = {
                                message    : "Employee No. already exists",
                            };
                            res.send(response);
                            return;
                        }
                        else {
                            var hashpass = md5.digest_s(password);
        
                            try {
                                client.query(`INSERT INTO db_users (empNo,password,role,fullname) VALUES ('${empNo}','${hashpass}',2,'${fullname}')`, (err, result) => {
                                    if (!err) {
                                        var response = {
                                            message    : "Successfully registered new user"
                                        };
                                        res.send(response);
                                        return;
                                    }
                                    else{
                                        var response = {
                                            message    : err.message
                                        };
                                        res.send(response);
                                        return;
                                    }
                                });
                            } catch (error) {
                                return new Error (error.message);
                            }
                        }
                    }); 
                } catch (error) {
                    return new Error (error.message);
                }   
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

//return 0 if not logged in, 1 if admin, 2 if user
async function isLoggedIn(body_access_token) {
    return new Promise((resolve, reject)=>{
      try {
        client.query(`SELECT role FROM db_users where access_token='${body_access_token}'`, function (err, result) {
          if(err){
            throw new Error(err.message);
          }
          return resolve(result.rows[0] ? result.rows[0].role : 0);
        });
      } catch (error) {
        return reject(error.message);
      }
    })
  }

//Accesstoken using jwt
function generateToken(text){
    var token=jwt.sign(text, 'mysecretkey');
    return token;
}