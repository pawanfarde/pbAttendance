require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const fs = require('fs');

const session = require('express-session');
// const MongoStore = require('connect-mongo')(session);
const MongoStore = require('connect-mongo');

var expressLayouts = require('express-ejs-layouts');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const controllersPath = path.join(__dirname, 'controllers');

fs.readdirSync(controllersPath).forEach((file) => {
  if (file.endsWith('.js')) {
    const route = require(path.join(controllersPath, file));
    app.use('/', route);
  }
});


const indexRoutes = require('./routes');
app.use('/', indexRoutes);

const viewsRoutes = require('./routes/viewRoutes');
app.use('/api', viewsRoutes);

app.use(session({
  key: 'user_sid',
  secret: 'landmark',
  store: MongoStore.create({
    mongoUrl: 'mongodb://horizonqaapp:H%40r!z0nQA2108@65.0.176.149/lm-api-qa', 
    ttl: 14 * 24 * 60 * 60, 
  }),
  resave: true,
  saveUninitialized: false,
  cookie: {
      path: '/',
      expires: 6000000,
//	domain: 'policyboss.com',
      httpOnly: false
  }
}));

// var sessionChecker = (req, res, next) => {
// 	if(req.get('host').indexOf('beta.policyboss.com') > -1 || req.get('host').indexOf('www.policyboss.com') > -1){
// 		next();
// 	}
// 	else{
// 		if (req.session.user && req.cookies.user_sid) {
// 			var user_photo = '/images/user.png';
// 			if (fs.existsSync('/var/www/Production/HorizonAPI/SourceCode/tmp/HR_Photo/' + req.session.user.uid + '/' + req.session.user.uid + '.png')) {
// 				user_photo = 'https://horizon.policyboss.com:5443/HR_Photo/' + req.session.user.uid + '/' + req.session.user.uid + '.png';
// 			}
//                     res.locals = {
//                         session_user: req.session.user,
//                         session_user_txt: JSON.stringify(req.session.user),
//                         'user_photo': user_photo,
//                         title: 'Horizon',
//                         'page_action': ''
//                     };
// 			next();
// 		} else {
// 			var ref_login = (typeof req.originalUrl !== 'undefined') ? req.originalUrl : '';
// 			if (ref_login == '/' || ref_login == '') {
// 				if(req.get('host').indexOf('pro.policyboss.com') > -1){
// 					ref_login = 'https://pro.policyboss.com';
// 				}
// 				else{
// 					ref_login = 'product';
// 				}
// 			}
			
// 	//ref_login = ref_login.replace(config.environment.weburl, '');
// 			res.redirect('/sign-in?ref_login=' + ref_login);
// 		}
// 	}
// };

app.get('/holiday' ,function(req,res){
  res.locals.title = '';
  res.render('pages/holiday');
});

app.get('/attendence_self', (req, res) => {
  res.locals.title = '';
  res.render('pages/attendence_self');
});

app.get('/attendence_team', (req, res) => {
    res.locals.title = '';
    res.render('pages/attendence_team');
});

app.get('/attendance_regularization', (req, res) => {
    res.locals.title = '';
    res.render('pages/attendance_regularization');
});

app.get('/leave_req', (req, res) => {
    res.locals.title = '';
    res.render('pages/leave_request');
});

app.get('/leave_approval', (req, res) => {
    res.locals.title = '';
    res.render('pages/leave_approval');
});

app.get('/regulariz_approval', (req, res) => {
    res.locals.title = '';
    res.render('pages/attendance_regularization');
});

app.get('/regulariz_req', (req, res) => {
    res.locals.title = '';
    res.render('pages/regularization_request');
});

app.get('/sign-in', function (req, res) {
  res.locals.title = 'Horizon';
  res.locals.ref_login = (typeof req.query.ref_login !== 'undefined') ? req.query.ref_login : '';

  res.render('pages/login', {layout: false});

}); 


app.post('/login-in-user', function (req, res) {
  try {
      let objRequest = req.body;
      let ref_login = objRequest.ref_login;
      let login_ssid = objRequest.login_ss_id && objRequest.login_ss_id - 0 || '';
      let login_type = objRequest.login_type || '';
      let Client = require('node-rest-client').Client;
      let client = new Client();
      let objResponse = {
          "ref_login": "",
          "status": "",
          "email_id": ""
      };
      if (login_ssid && ref_login) {
          client.get('http://horizon.policyboss.com:5000/posps/dsas/view/' + login_ssid, {}, function (data, response) {
              try {
                  if (!data) {
                      objResponse['ref_login'] = ref_login;
                      objResponse['status'] = "DATA_NOT_FOUND";
                      //return res.redirect('/sign-in?ref_login=' + ref_login + '&status=DATA_NOT_FOUND');
                      return res.json(objResponse);
                  } else {
                      if (data.status !== "SUCCESS") {
                          objResponse['ref_login'] = ref_login;
                          objResponse['status'] = "DATA_SUCCESS_NOT_FOUND";
                          //return res.redirect('/sign-in?ref_login=' + ref_login + '&status=DATA_SUCCESS_NOT_FOUND');
                          return res.json(objResponse);
                      } else {
                          //saving login history
                          var ip = '';
                          if (req.headers['x-forwarded-for']) {
                              ip = req.headers['x-forwarded-for'].split(",")[0];
                          } else if (req.connection && req.connection.remoteAddress) {
                              ip = req.connection.remoteAddress;
                          } else {
                              ip = req.ip;
                          }

                          if (ip && ip.indexOf(':') > -1) {
                              ip = ip.split(':');
                              ip = ip[ip.length - 1];
                          }
                          var referer = ref_login;
                          var Client = require('node-rest-client').Client;
                          var client = new Client();
                          var args = {
                              data: {
                                  "session_id": req.sessionID,
                                  "ip_address": ip,
                                  "header": req.headers,
                                  "user_agent": objRequest["user_agent"],
                                  "referral": referer,
                                  "ss_id": data['EMP']['Emp_Id'],
                                  "fba_id": data['EMP']['FBA_ID'],
                                  "login_response": data,
                                  "login_type": login_type || "OTP"
                              },
                              headers: {
                                  "Content-Type": "application/json"
                              }
                          };
                          client.post(/*config.environment.weburl +*/ 'http://localhost:8000/logins/login', args, function (data, response) {});
                          var role_detail = null;
                          if (data['status'] === 'SUCCESS' && data.hasOwnProperty('user_type')) {

                              var Const_POSP_Code = {
                                  "1": "DC",
                                  "2": "SM",
                                  "4": "SG",
                                  "8": "GS",
                                  "11": "EM",
                                  "12": "LA",
                                  "13": "CC-AUTO",
                                  "14": "CC-HEALTH",
                                  "20": "RURBAN",
                                  "22": "REMOTE",
                                  "31": "DIRECT"
                              };
                              var Const_FOS_Code = {
                                  29: 'SM',
                                  34: 'GS',
                                  38: "SG",
                                  39: 'DC',
                                  41: 'EM',
                                  43: 'LA',
                                  51: 'RURBAN',
                                  56: "REMOTE"
                              };
                              data.Sources = 0;
                              if (data['user_type'] === 'POSP') {
                                  let dbPosp = data['POSP'];
                                  data.Sources = dbPosp['Sources'] || 0;
                                  dbPosp['Sources'] = dbPosp['Sources'] - 0;
                                  let channel = Const_POSP_Code[dbPosp['Sources']];
                                  role_detail = {
                                      'channel': 'POSP',
                                      'ownership': channel,
                                      'title': channel + '-POSP',
                                      'role': ['Agent']
                                  };
                                  data.EmailID = dbPosp.Email_Id;
                                  data.MobiNumb1 = dbPosp.Mobile_No;
                                  data.Fullname = dbPosp.First_Name + ' ' + (dbPosp.Middle_Name || '') + ' ' + dbPosp.Last_Name;
                                  data.RoleId = data['EMP']['Role_ID'];
                                  data.FBAId = dbPosp.Fba_Id;
                                  data.EmpCode = dbPosp.Erp_Id;
                              }
                              if (data['user_type'] === 'FOS') {
                                  let dbEmployee = data['EMP'];
                                  let Role_ID = dbEmployee['Role_ID'] - 0;
                                  let channel = Const_FOS_Code[Role_ID];
                                  role_detail = {
                                      'channel': 'FOS',
                                      'ownership': channel,
                                      'title': channel + '-FOS',
                                      'role': ['Agent']
                                  };
                              }
                              if (data['user_type'] === 'MISP') {
                                  let dbEmployee = data['EMP'];
                                  let Role_ID = dbEmployee['Role_ID'] - 0;
                                  role_detail = {
                                      'channel': 'MISP',
                                      'ownership': 'MISP',
                                      'title': 'MISP',
                                      'role': ['Agent']
                                  };
                              }


                              if (data['user_type'] === 'INS') {
                                  let dbEmployee = data['EMP'];
                                  let Role_ID = dbEmployee['Role_ID'] - 0;
                                  let Insurer_Id = (dbEmployee['Emp_Code'] - 0) - 9000000;
                                  role_detail = {
                                      'channel': 'INS',
                                      'ownership': 'INS',
                                      'title': 'INSURER REPRESENTATIVE',
                                      'role': ['Insurer'],
                                      'insurer': Insurer_Id
                                  };
                              }
                              if (data['user_type'] === 'EMP') {
                                  if (data['EMP']['Role_ID'] === 23) {
                                      role_detail = {
                                          'channel': 'CallCenter',
                                          'ownership': 'ST',
                                          'title': 'PB-CC',
                                          'role': ['Employee']
                                      };
                                  }
                                  if (data['EMP']['Role_ID'] === 30) {
                                      role_detail = {
                                          'channel': 'CallCenter',
                                          'ownership': 'ST',
                                          'title': 'RB-CC',
                                          'role': ['Employee']
                                      };
                                  }
                              }
                              role_detail['allowed_product'] = ['ALL'];
                              role_detail['allowed_make'] = ['ALL'];
                              /*
                              if (config.dealership.BENELLI.indexOf(data['EMP']['Emp_Id'] - 0) > -1 || config.dealership.TRIUMPH.indexOf(data['EMP']['Emp_Id'] - 0) > -1) {
                                  role_detail['allowed_product'] = ['TW'];
                                  role_detail['allowed_make'] = [];
                                  if (config.dealership.BENELLI.indexOf(data['EMP']['Emp_Id'] - 0) > -1) {
                                      role_detail['allowed_make'].push('BENELLI');
                                  }
                                  if (config.dealership.TRIUMPH.indexOf(data['EMP']['Emp_Id'] - 0) > -1) {
                                      role_detail['allowed_make'].push('TRIUMPH');
                                  }
                              }
                              */
                              if (data['EMP']['Emp_Id'] - 0 == 127818)
                              {
                                  role_detail['allowed_make'] = [];
                                  role_detail['allowed_make'].push('VOLKSWAGEN');
                              }
                          }

                          if (role_detail === null) {
                              let today = new Date();
                              var obj_error_log = {
                                  'TYPE': 'LOGIN_ERR',
                                  'MSG': 'ROLE_NOT_CONFIGURE',
                                  'RM_DETAILS': {},
                                  'LOGIN_RESP': data,
                                  'HRZ_RESP': data
                              };
                              let log_file_name = 'login_error_log_' + today.toISOString().substring(0, 10).toString().replace(/-/g, '') + ".log";
                              fs.appendFile(config.environment.horizon_app_path + "tmp/log/" + log_file_name, JSON.stringify(obj_error_log), function (err) {
                                  if (err) {
                                      //return //console.log(err);
                                  }
                              });
                              let obj_email = {
                                  'from': 'noreply@policyboss.com',
                                  'to': 'anuj.singh@policyboss.com,techsupport@policyboss.com',
                                  'cc': 'horizonlive.2019@gmail.com',
                                  'sub': '[LOGIN_ERR] fba_id : ' + data['EMP']['FBA_ID'] + ', ss_id : ' + data['EMP']['Emp_Id'] + ', Err_On : ' + (new Date()).toLocaleString(),
                                  'content': '<html><body><h1>LOGIN ERROR</h1><BR><pre>' + JSON.stringify(obj_error_log, undefined, 2) + '</pre></body></html>'
                              };
                              send_email(obj_email);
                              objResponse['ref_login'] = ref_login;
                              objResponse['status'] = "ROLE_NOT_CONFIGURE";
                              //return res.send('<h1>LOGIN ERROR</h1><BR><pre>' + JSON.stringify(obj_error_log, undefined, 2) + '</pre>');
                              return res.json(objResponse);
                          }
                          if (data['user_type'] === 'EMP') {
                              var channel = 'NA';
                              data.EmpCode = (data['EMP'].hasOwnProperty('Emp_Code') && data['EMP'].Emp_Code !== null) ? data['EMP'].Emp_Code : '000000';
                              if (['110196', '100151', '114708', '112666', '105248', '100015', '113907', '113265', '114143', '114504', '105504', '116108'].indexOf(data.EmpCode.toString()) > -1) {
                                  var arrChannelList = [];
                                  var arrChannelTransactionList = [];
                                  if (data.EmpCode == '114504' && false) {//sm
                                      channel = 'CC';
                                      arrChannelList = ['DIRECT'];
                                      arrChannelTransactionList = ['DIRECT'];
                                  }
                                  if (data.EmpCode == '100151') {//sm
                                      channel = 'SM';
                                      arrChannelList = ['SM-NP'];
                                      arrChannelTransactionList = ['SM-NP'];
                                  }
                                  if (data.EmpCode == '114708') {//dc
                                      channel = 'DC';
                                      arrChannelList = ['DC-NP', 'RURBAN', 'RURBAN-NP'];
                                      arrChannelTransactionList = ['DC-NP', 'RURBAN', 'RURBAN-NP'];
                                  }
                                  if (data.EmpCode == '114143') {//la snehal
                                      channel = 'LA';
                                      arrChannelList = ['DC-NP', 'RURBAN', 'RURBAN-NP'];
                                      arrChannelTransactionList = ['DC-NP', 'RURBAN', 'RURBAN-NP'];
                                  }
                                  if (data.EmpCode == '113907' || data.EmpCode == '113265') {//achint
                                      channel = 'EM';
                                      arrChannelList = ['EM-NP'];
                                  }
                                  if (data.EmpCode == '100015') {//sg
                                      channel = 'SG';
                                  }
                                  if (data.EmpCode == '112666' || data.EmpCode == '105248') {//gs
                                      channel = 'GS';
                                      arrChannelList = ['GS-NP'];
                                      arrChannelTransactionList = ['GS-NP'];
                                  }
                                  if (data.EmpCode == '116108') {//remote
                                      channel = 'REMOTE';
                                      arrChannelList.push('REMOTE-NP');
                                      arrChannelTransactionList.push('REMOTE-NP');
                                  }
                                  /*if (data.EmpCode == '100427') {//sandeep nair & Kiran
                                   channel = 'SM';
                                   arrChannelList = ['DC', 'SM', 'SG', 'GS', 'EM', 'LA', 'CC-AUTO', 'CC-HEALTH', 'SM-NP', 'GS-NP', 'DC-NP', 'EM-NP', 'OPS-NP', 'RURBAN', 'RURBAN-NP','UPCOUNTRY'];
                                   if(data.EmpCode == '100427'){
                                   arrChannelTransactionList = ['SM','SM-NP','REMOTE','REMOTE-NP'];
                                   }
                                   }*/

                                  if (data.EmpCode == '105504') {//cc_auto Ishaq
                                      channel = 'CC-AUTO';
                                  }

                                  if (channel !== 'NA') {
                                      arrChannelList.push(channel);
                                      arrChannelTransactionList.push(channel);
                                  }
                                  role_detail.role.push('ChannelHead');
                                  role_detail.channel = channel;
                                  role_detail.channel_list = arrChannelList;
                                  role_detail.channel_agent = arrChannelList;
                                  role_detail.channel_transaction = arrChannelTransactionList;
                                  role_detail.title = 'ChannelHead';
                              }
                              if (role_detail.hasOwnProperty('channel_list') === false) {
                                  role_detail.channel_list = [];
                              }
                              if (role_detail.hasOwnProperty('channel_agent') === false) {
                                  role_detail.channel_agent = [];
                              }
                              if (role_detail.hasOwnProperty('channel_transaction') === false) {
                                  role_detail.channel_transaction = [];
                              }

                              var ArrSuperAdmin = [107602, 100002, 100005, 100336, 104449, 112739, 110560, 103759, 103595, 114504, 116675, 118397, 118651];
                              if (ArrSuperAdmin.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('SuperAdmin');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'SuperAdmin';
                              }
                              var ArrCustomerCare = [108020, 118336, 115447, 100004, 115682, 115737, 116561, 116848];
                              if (ArrCustomerCare.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('SuperAdmin');
                                  role_detail.role.push('CustomerCare');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'SuperAdmin';
                              }
                              var ArrLegal = [102936];
                              if (ArrLegal.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('SuperAdmin');
                                  role_detail.role.push('LegalCompliance');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'LegalCompliance';
                              }
                              var ArrErpTeam = [105453]; //Dinesh Rajput
                              if (ArrErpTeam.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('SuperAdmin');
                                  role_detail.role.push('ErpTeam');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'ErpTeam';
                              }
                              var ArrProductAdmin = [111480, 100015]; // Vineet as TW Head, Sagar as SME Head
                              if (ArrProductAdmin.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('SuperAdmin');
                                  role_detail.role.push('ProductAdmin');
                                  role_detail.channel = 'ALL';
                                  if ((data.EmpCode - 0) == 111480) {
                                      role_detail.product = [10];
                                  }
                                  if ((data.EmpCode - 0) == 100015) {
                                      role_detail.product = [13, 19, 20, 21, 22, 23];
                                  }
                                  role_detail.title = 'SuperAdmin';
                              }
                              var ArrITAdmin = [107602, 104449, 104450];
                              if (ArrITAdmin.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('Developer');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'SuperAdmin';
                              }
                              var ArrMapping = [106154, 112835, 114504, 114827, 114492, 116218];
                              if (ArrMapping.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('Mapping');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'Mapping';
                              }
                              var ArrRecruiter = [110196, 100427]; //sandeep and kiran
                              if (ArrRecruiter.indexOf(data.EmpCode - 0) > -1) {
                                  role_detail.role.push('Recruiter');
                                  role_detail.channel = 'ALL';
                                  role_detail.title = 'Recruiter';
                              }
                          }
                          var web_session_data = {
                              "session_id": req.sessionID,
                              "agent_name": data.EMP && data.EMP.Emp_Name && data.EMP.Emp_Name || '',
                              "agent_city": 'NA',
                              "fba_id": data.EMP && data.EMP.FBA_ID && data.EMP.FBA_ID - 0 || 0,
                              "sub_fba_id": 0,
                              "agent_source": 0,
                              "AgentClientFBAID": null,
                              "agent_email": data.EMP && data.EMP.Email_Id || '',
                              "agent_mobile": data.EMP && data.EMP.Mobile_Number || '',
                              "UID": data.EmpCode,
                              "Is_Employee": (data.EMP && data.EMP.Role_ID === 23 ? 'Y' : 'N'),
                              'User_Type': data.user_type || '',
                              "Is_Posp_Certified": 'N',
                              "client_id": 2,
                              "agent_id": data.EMP && data.EMP.Emp_Id - 0 || 0,
                              'agent_rm_name': 'NA',
                              'role_detail': role_detail,
                              'sign_in_type': 'OTP'
                          };
                          if (data.EMP && data.EMP.Emp_Id && data.EMP.FBA_ID) {
                              web_session_data['AgentClientFBAID'] = data.EMP.Emp_Id - 0 + "," + 0 + "," + data.EMP.FBA_ID - 0;
                          }
                          if (data.user_type === 'POSP' && data.POSP.Erp_Id && data.POSP.Erp_Id.length == 6) {
                              web_session_data['Is_Posp_Certified'] = 'Y';
                          }
                          var obj_session = {
                              'session_id': req.sessionID,
                              'email': data.EMP && data.EMP.Email_Id || '',
                              'mobile': data.EMP && data.EMP.Mobile_Number || '',
                              'fullname': data.EMP && data.EMP.Emp_Name || '',
                              'role_id': data.EMP && data.EMP.Role_ID || 0,
                              'role_detail': role_detail,
                              'ss_id': data.EMP && data.EMP.Emp_Id - 0 || 0,
                              'fba_id': data.EMP && data.EMP.FBA_ID - 0 || 0,
                              'erp_id': data.EMP && data.EMP.Emp_Code - 0 || 0,
                              'sub_fba_id': 0,
                              'uid': data.EmpCode,
                              'website_session': web_session_data,
                              'direct': {
                                  'cnt_posp': 0,
                                  'cnt_dsa': 0,
                                  'cnt_cse': 0},
                              'team': {
                                  'cnt_posp': 0,
                                  'cnt_dsa': 0,
                                  'cnt_cse': 0},
                              'profile': {
                                  'Designation': role_detail.title,
                                  'UID':data.EmpCode
                              },
                              "POSP": {
                                  "Paid_On": data.POSP && data.POSP.Paid_On || '',
                                  "Is_Paid": data.POSP && data.POSP.Is_Paid || '',
                                  "Is_Certified": data.POSP && data.POSP.Is_Certified || '',
                                  "Certified_On": data.POSP && data.POSP.ERPID_CreatedDate || ''
                              },
                              'SYNC_CONTACT': data['SYNC_CONTACT'] || {},
                              'DEVICE': data['DEVICE'] || {},
                              'SYNC_CONTACT_LEAD_PURCHASE': data['SYNC_CONTACT_LEAD_PURCHASE'] || {},
                              'INSURANCE': data['INSURANCE'] || {}
                          };
                          if (data['user_type'] === 'EMP' && data['RM'] && data['RM']['rm_details']) {
                              web_session_data['agent_name'] = data['RM']['rm_details']['name'] || "NA";
                              web_session_data['agent_city'] = data['RM']['rm_details']['agent_city'] || "NA";
                              web_session_data['agent_email'] = data['RM']['rm_details']['email'] || "NA";
                              web_session_data['agent_mobile'] = data['RM']['rm_details']['mobile'] || "NA";

                              obj_session['fullname'] = data['RM']['rm_details']['name'] || "NA";
                              obj_session['email'] = data['RM']['rm_details']['email'] || "NA";
                              obj_session['mobile'] = data['RM']['rm_details']['mobile'] || "NA";
                          }
                          req.session.login_response = data;
                          req.session.user = obj_session;
                          if (data['user_type'] == 'INS') {
                              if (ref_login) {
                              objResponse['ref_login'] = ref_login;
                              objResponse['status'] = "SUCCESS";
                              objResponse['email_id'] = data.EMP.Email_Id || "";
                                  //return res.redirect(ref_login);
                                  return res.json(objResponse);
                              } else {
                                  objResponse['ref_login'] = '/insurer_dashboard';
                                  objResponse['status'] = "SUCCESS";
                                  objResponse['email_id'] = data.EMP.Email_Id || "";
                                  //return res.redirect('/insurer_dashboard');
                                  return res.json(objResponse);
                              }
                          } else if (data['user_type'] == 'EMP' || (data['user_type'] == 'POSP' && data['channel'].toString().indexOf('NP') > -1 && data['POSP']['Erp_Id'].toString().charAt(0) === '4')) {
                              let profile_data_url = '';
                              if (data['user_type'] == 'EMP') {
                                  profile_data_url = 'http://horizon.policyboss.com:5000/posps/rm_get_posp_dsa_ssid/' + data.EmpCode;
                              }
                              if (data['user_type'] == 'POSP' && data['channel'].toString().indexOf('NP') > -1 && data['POSP']['Erp_Id'].toString().charAt(0) === '4') {
                                  profile_data_url = 'http://horizon.policyboss.com:5000/posps/rm_get_posp_dsa_ssid/' + data['POSP']['Erp_Id'];
                              }
                              var Client = require('node-rest-client').Client;
                              var client = new Client();
                              //res.redirect('/my_daily');
                              client.get(profile_data_url, args, function (rmdetails, response) {
                                  try {
                                      if (rmdetails && rmdetails.hasOwnProperty('Profile')) {
                                          req.session.users_assigned = rmdetails;
                                          if (rmdetails.Team.POSP.length > 0) {
                                              obj_session.team.cnt_posp = rmdetails.Team.POSP.length;
                                          }
                                          if (rmdetails.Team.DSA.length > 0) {
                                              obj_session.team.cnt_dsa = rmdetails.Team.DSA.length;
                                          }
                                          if (rmdetails.Team.CSE.length > 0) {
                                              obj_session.team.cnt_cse = rmdetails.Team.CSE.length;
                                          }

                                          if (rmdetails.Direct.POSP.length > 0) {
                                              obj_session.direct.cnt_posp = rmdetails.Direct.POSP.length;
                                          }
                                          if (rmdetails.Direct.DSA.length > 0) {
                                              obj_session.direct.cnt_dsa = rmdetails.Direct.DSA.length;
                                          }
                                          if (rmdetails.Direct.CSE.length > 0) {
                                              obj_session.direct.cnt_cse = rmdetails.Direct.CSE.length;
                                          }
                                          req.session.user = obj_session;
                                          if (rmdetails.Profile !== null) {
                                              req.session.user.profile = rmdetails.Profile;
                                          }
                                      }
                                      if (ref_login) {
                                          objResponse['ref_login'] = ref_login;
                                          objResponse['status'] = "SUCCESS";
                                          objResponse['email_id'] = data.EMP.Email_Id || "";
                                          //return res.redirect(ref_login);
                                          return res.json(objResponse);
                                      } else {
                                          objResponse['ref_login'] = '/attendence_self';
                                          objResponse['status'] = "SUCCESS";
                                          objResponse['email_id'] = data.EMP.Email_Id || "";
//                                            return res.redirect('/product');
                                          return res.json(objResponse);
                                      }
                                  } catch (e) {
                                      let today = new Date();
                                      var obj_error_log = {
                                          'TYPE': 'RM_ERR',
                                          'MSG': e.stack,
                                          'RM_DETAILS': rmdetails,
                                          'LOGIN_RESP': data
                                      };
                                      let log_file_name = 'login_error_log_' + today.toISOString().substring(0, 10).toString().replace(/-/g, '') + ".log";
                                      fs.appendFile(config.environment.horizon_app_path + "tmp/log/" + log_file_name, JSON.stringify(obj_error_log), function (err) {
                                          if (err) {
                                              //return //console.log(err);
                                          }
                                      });
                                      objResponse['ref_login'] = ref_login;
                                      objResponse['status'] = e.stack;
                                          
                                      //return res.send('<h1>LOGIN ERROR</h1><BR><pre>' + JSON.stringify(obj_error_log, undefined, 2) + '</pre>');
                                      return res.json(objResponse);
                                  }
                              });
                          } else {
                              if (ref_login) {
                                  objResponse['ref_login'] = ref_login;
                                  objResponse['status'] = "SUCCESS";
                                  objResponse['email_id'] = data.EMP.Email_Id || "";
                                  //return res.redirect(ref_login);
                                  res.json(objResponse);
                              } else {
                                  objResponse['ref_login'] = '/attendence_self';
                                  objResponse['status'] = "SUCCESS";
                                  objResponse['email_id'] = data.EMP.Email_Id || "";
                                  //return res.redirect('/product');
                                  res.json(objResponse);
                              }
                          }
                      }
                  }
              } catch (e) {
                  let today = new Date();
                  var obj_error_log = {
                      'TYPE': 'LOGIN_ERR',
                      'MSG': e.stack,
                      'RM_DETAILS': {},
                      'LOGIN_RESP': data
                  };
                  let log_file_name = 'login_error_log_' + today.toISOString().substring(0, 10).toString().replace(/-/g, '') + ".log";
                  fs.appendFile(config.environment.horizon_app_path + "tmp/log/" + log_file_name, JSON.stringify(obj_error_log), function (err) {
                      if (err) {
                          //return //console.log(err);
                      }
                  });
                  objResponse['ref_login'] = ref_login;
                  objResponse['status'] = e.stack;
                  //return res.send('<h1>LOGIN ERROR</h1><BR><pre>' + JSON.stringify(obj_error_log, undefined, 2) + '</pre>');
                  res.json(objResponse);
              }
          });
      } else {
          let today = new Date();
          var obj_error_log = {
              'TYPE': 'SS_ID IS MANDATORY',
              'MSG': "SS_ID"
          };
          let log_file_name = 'login_error_log_' + today.toISOString().substring(0, 10).toString().replace(/-/g, '') + ".log";
          fs.appendFile(config.environment.horizon_app_path + "tmp/log/" + log_file_name, JSON.stringify(obj_error_log), function (err) {
              if (err) {
                  //return //console.log(err);
              }
          });
          objResponse['ref_login'] = ref_login;
          objResponse['status'] = "SS_ID IS MANDATORY";
          //return res.send('<h1>LOGIN ERROR</h1><BR><pre>' + JSON.stringify(obj_error_log, undefined, 2) + '</pre>');
          res.json(objResponse);
      }
  } catch (e) {
      let today = new Date();
      var obj_error_log = {
          'TYPE': 'MAIN_ERR',
          'MSG': e.stack,
          'LOGIN_REQ': req.body
      };
      let log_file_name = 'login_error_log_' + today.toISOString().substring(0, 10).toString().replace(/-/g, '') + ".log";
      // fs.appendFile(config.environment.horizon_app_path + "tmp/log/" + log_file_name, JSON.stringify(obj_error_log), function (err) {
      //     if (err) {
      //         //return //console.log(err);
      //     }
      // });
      objResponse['ref_login'] = ref_login;
      objResponse['status'] = e.stack;
      //return res.send('<h1>LOGIN ERROR</h1><BR><pre>' + JSON.stringify(obj_error_log, undefined, 2) + '</pre>');
      res.json(objResponse);
  }
});


app.get('/get-session', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
if(req.session.hasOwnProperty('user') && req.session.user.hasOwnProperty('session_id') && req.session.user.session_id !== ''){
  var referer = req.headers.referer;
  var Client = require('node-rest-client').Client;
  var client = new Client();
  var args = {
    data: {
      "session_id": req.session.user.session_id
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
  client.post(/*config.environment.weburl +*/ 'http://localhost:8000/logins/continue_session', args, function (data, response) {});
}
  res.json(req.session);
});



module.exports = app;