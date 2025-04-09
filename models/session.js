/*
 * Author : Chirag Modi 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 *
 *
 * 
 */

// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

var sessionSchema = new Schema({
	'_id' : String,
	'expires' : {type: Date},
	'session' : String
});

// the schema is useless so far
// we need to create a model using it
var Session = mongoose.model('Session', sessionSchema);

// make this available to our users in our Node applications
module.exports = Session;