var mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
autoIncrement = require('mongoose-plugin-autoinc');

var emp_leave_requests_Schema = new mongoose.Schema({
  Leave_ID: {type: Number,required: true,unique: true},
  UID: { type: Number,required: true },
  Leave_Type: {type: String,enum: ['PL', 'HD'],required: true},
  Leave_From_Date: { type: Date,required: true},
  Leave_To_Date: {type: Date,required: true},
  Leave_Count: {type: Number,required: true},
  Reason: {type: String, required: true },
  Supervisor_UID: {type: Number,required: true},
  Approval_Time: { type: Date,default: ''},
  Approval_Status: {type: String, enum: ['Pending', 'Approved', 'Reject'], default: 'Pending'},
  Supervisor_Remarks: { type: String, default:'' },
  Created_On: { type: Date },  
  Modified_On: { type: Date }
}, {
  collection: 'emp_leave_requests'
});


emp_leave_requests_Schema.plugin(mongoosePaginate);
emp_leave_requests_Schema.plugin(autoIncrement.plugin, {model: 'emp_leave_requests', field: 'Leave_ID', startAt: 1});
const emp_leave_req_data = mongoose.model("emp_leave_requests", emp_leave_requests_Schema);
module.exports = emp_leave_req_data;
