/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
// var mongoosePaginate = require('mongoose-paginate');

var login_Schema = new Schema({
    "session_id": String,
    "ip_address": String,
    "user_agent": Object,
    "header": Object,
    "referral": String,
    "ss_id": Number,
    "fba_id": Number,
    "login_response": Object,
    "login_time": Date,
    "logout_time": Date,
	"duration" : Number,
	"last_activity_on" : Date
});
// the schema is useless so far
// we need to create a model using it
// login_Schema.plugin(mongoosePaginate);
var logins = mongoose.model('logins', login_Schema);

// make this available to our users in our Node applications
module.exports = logins;

