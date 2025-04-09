/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require("express");
var router = express.Router();
var config = require('config');
var mongoose = require('mongoose');
// var Base = require('../libs/Base');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var config = require('config');
var moment = require('moment');
// var mongojs = require('mongojs');
//const formidable = require('express-formidable');
//var formidable1 = require('formidable');
var path = require('path');
var fs = require('fs');
var appRoot = path.dirname(path.dirname(require.main.filename));
// var myDb = mongojs(config.db.connection + ':27017/' + config.db.name);
// mongoose.connect(config.db.connection + ':27017/' + config.db.name, {useMongoClient: true});
var login = require('../models/logins');


    //app.use(formidable);
    router.post('/logins/login', async function (req, res, next) {
        req.body = JSON.parse(JSON.stringify(req.body));
        var objRequest = req.body;
        var Session_Id = objRequest["Session_Id"];
        
        try {
            var login_time = new Date();
            var arg = {
                session_id: objRequest["session_id"],
                ip_address: objRequest["ip_address"],
                user_agent: objRequest["user_agent"],
                header: objRequest["header"],
                referral: objRequest["referral"],
                ss_id: objRequest["ss_id"],
                fba_id: objRequest["fba_id"],
                login_response: objRequest["login_response"],
                login_type: objRequest["login_type"],
                login_time: login_time,
                logout_time: null
            };
    
            var login_data = new login(arg);
    
            // ✅ Save using async/await
            await login_data.save();
    
            res.json({
                'Status': "Success",
                'Msg': "Session Data inserted successfully."
            });
    
        } catch (err) {
            console.error(err);
            res.json({ 'msg': 'error' });
        }
    });
    
    router.post('/logins/logout', function (req, res) {
        try {
            var objRequest = req.body;
            var Session_Id = objRequest["session_id"];            
			login.findOne({'session_id': Session_Id}, function (err, dbLogin) {
				try{
					if(dbLogin){
						dbLogin = dbLogin._doc;
						var login_time = moment(dbLogin.login_time).utcOffset("+05:30");
						var logout_time = moment().utcOffset("+05:30");
						var duration = moment.duration(logout_time.diff(login_time));
						var duration_minutes = duration.asMinutes();
						var objUserData = {
							'logout_time': new Date(),
							'duration' : duration_minutes -0				
						};
						login.update({'session_id': Session_Id}, {$set: objUserData}, function (err, numAffected) {
							if (err)
								throw err;
							res.json({'Status': "Success", 'Msg': "Session Data Updated successfully."});
						});
					}
					else{
						res.json({'Status': "Fail", 'Msg': "Session does not exist"});
					}
				}
				catch(e){
					res.send(e.stack);
				}
			});

        } catch (err) {
            console.log(err);
            res.json({'msg': 'error'});
        }
    });
	router.post('/logins/continue_session', async function (req, res) {
        try {
            const objRequest = req.body;
            const Session_Id = objRequest["session_id"];
    
            let dbLogin = await login.findOne({ session_id: Session_Id }).sort({ login_time: -1 });
    
            if (dbLogin) {
                if (dbLogin.logout_time) {
                    return res.json({ 'Fail': "Success", 'Msg': "User already Logout" });
                }
    
                const login_id = dbLogin._id;
                const login_time = moment(dbLogin.login_time).utcOffset("+05:30");
                const logout_time = moment().utcOffset("+05:30");
    
                const duration = moment.duration(logout_time.diff(login_time));
                const duration_minutes = duration.asMinutes();
    
                const objUserData = {
                    last_activity_on: new Date(),
                    duration: duration_minutes
                };
    
                await login.updateOne(
                    { _id: login_id, session_id: Session_Id },
                    { $set: objUserData }
                );
    
                res.json({ 'Status': "Success", 'Msg': "Session Data Updated successfully." });
            } else {
                res.json({ 'Status': "Fail", 'Msg': "Session does not exist" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Internal server error', error: err.message });
        }
    });
    
	router.get('/logins/updateduration', function (req, res) {
        try {
			let limit = req.query['limit'] -0;
			login.find({'logout_time':{"$ne":null},'duration': {"$exists":false}}).limit(limit).exec(function (err, dbLogins) {
				try{
					if(dbLogins && dbLogins.length > 0){
						let arr_summary = [];
						let complete = 0;
						for(let k in  dbLogins){
							dbLogin = dbLogins[k]._doc;
							
							let login_time = moment(dbLogin.login_time).utcOffset("+05:30");
							let logout_time = moment(dbLogin.logout_time).utcOffset("+05:30");
							let duration = moment.duration(logout_time.diff(login_time));
							let duration_minutes = duration.asMinutes();
							let objUserData = {
								'duration' : duration_minutes -0				
							};
							arr_summary.push(dbLogin.session_id);	
							login.updateOne({'session_id': dbLogin.session_id}, {$set: objUserData}, function (err, numAffected) {
								if (err)
									throw err;
								
								complete++;
								if(complete == dbLogins.length){
									res.json({'Status': "Success", 'Found':dbLogins.length ,'Completed':complete});
								}
							});
						}
					}
					else{
						res.json({'Status': "Fail", 'Msg': "Session does not exist"});
					}
				}
				catch(e){
					res.send(e.stack);
				}
			});

        } catch (err) {
            console.log(err);
            res.json({'msg': 'error'});
        }
    });

    router.post('/logins/uploadFile', function (req, res) {
        try {
            var objRequest = req.body;
            var file = "";
            var file_ext = "";
            var path = appRoot + "/tmp/ticketing/";
            file = decodeURIComponent(objRequest["file"]);
            file_ext = objRequest["file_ext"];

            if (fs.existsSync(path + "NewTicket_Id")) {
                //console.log(NewTicket_Id + ' - Folder Already Exist');
                //for (var i in file_obj) {
                var data = file.replace(/^data:image\/\w+;base64,/, "");
                if (data === "") {
                    //res1.json({'msg': 'Something Went Wrong'});
                } else {
                    var buf = new Buffer(data, 'base64');
                    fs.writeFile(path + "NewTicket_Id" + '/file.' + file_ext, buf);
                }
                //}
            } else {
                fs.mkdirSync(path + "NewTicket_Id");
                //console.log(NewTicket_Id + ' - Folder Created');
                //for (var i in file_obj) {
                var data = file.replace(/^data:image\/\w+;base64,/, ""); 
                if (data === "") {
                    //res1.json({'msg': 'Something Went Wrong'});
                } else {
                    var buf = new Buffer(data, 'base64');
                    fs.writeFile(path + "NewTicket_Id" + '/file.' + file_ext, buf);
                }
                //}
            }


        } catch (ex)
        {
            console.log(ex);
        }
        res.status(200);
    });
    router.get('/logins/get_emp_details', function (req, res) {
        var emp_datas = require('../models/emp_data');
        emp_datas.find({}, function (err, emp_data) {
            try {
                if (err)
                    throw err;
                res.json(emp_data);
            } catch (e) {
                res.json(e);
            }
        });
    });
    
    
    router.get('/logins/get_session_details' , function(req,res){
       let objSummary = {
           'Status' : 'FAIL'
       };
       try{
           let session = require('../models/session.js');
           let session_id = req.query &&  req.query.session_id || "";
           let find_query = {};
           if(session_id){
               find_query['_id'] = session_id;
               session.find(find_query).sort({'_id': -1}).exec(function (session_err, session_data) {
                    if (session_err) {
                        objSummary['Msg'] = 'NO RECORD FOUND';
                    } else {
                        if (session_data.length > 0) {
                            let session_detail = session_data[0]._doc && session_data[0]._doc.session || "";    
                            let session = JSON.parse(session_detail);                        
                            let user_detail = session && session.user || "";
                            if(user_detail){
                                let user_name = user_detail.fullname && user_detail.fullname.split(' ')[0] || '';
                                objSummary['User_Name'] = user_name;
                                objSummary['Status'] = 'SUCCESS';
                                objSummary['Msg'] = 'SESSION DATA FOUND';
                            }else{
                                objSummary['Msg'] = 'USER SESSION NOT FOUND';
                            }                        
                            objSummary['Data'] = session;                        
                        } else {
                            objSummary['Msg'] = 'NO RECORD FOUND';
                        }
                    }
                    return res.json(objSummary);
                });
           }else{
               objSummary['Msg'] = 'SESSION ID IS MANDATORY';
               return res.json(objSummary);
           }
       } catch(ex){
           objSummary['Msg'] = ex.stack;
           return res.json(objSummary);
       }
    });
    
    router.post('/logins/set_session', function (req, res) {
        try {
            let session = require('../models/session');
            let Client = require('node-rest-client').Client;
            let client = new Client();
            let session_id = req.body.session_id || ''; 
            let ref_login = req.body.ref_login || '';            
            if(session_id){
                let find_query = {'_id': session_id};
                session.find(find_query, function (session_err, session_data) {
                    try {
                        if (session_err) {
                            return res.json({'Status':'FAIL','Msg':'NO RECORD FOUND'});
                        } else {
                            if (session_data && session_data[0] && session_data[0]._doc && session_data[0]._doc.session) {
                                let session_record = JSON.parse(session_data[0]._doc.session);
                                if(session_record.user && session_record.user.ss_id){
                                    let login_obj = {
                                        data: {
                                            "login_ss_id": session_record.user.ss_id,
                                            "ref_login": ref_login,
                                            "login_type":"LOGIN-TOKEN"
                                        },
                                        headers: {
                                            "Content-Type": "application/json"
                                        }
                                    };
                                    client.post('https://www.policyboss.com/login-in-user', login_obj, function (login_data, response) {
                                        if(login_data.status === "SUCCESS"){
                                            return res.json(login_data);
                                        } else{
                                            return res.json({'Status':'FAIL','Msg':'NO RECORD FOUND'});
                                        }
                                     });
                                }else{
                                    return res.json({'Status':'FAIL','Msg':"SSID NOT FOUND"});
                                }
                            }
                        }
                    } catch (ex) {
                       return res.json({'Status':'FAIL','Msg':ex.stack});
                    }
                });
            }else{
                 return res.json({'Status':'FAIL','Msg':'SESSION ID IS MANDATORY'});
            }
            
        } catch (ex) {
            return res.json({'Status':'FAIL','Msg':ex.stack});
        }
    });

    module.exports = router;