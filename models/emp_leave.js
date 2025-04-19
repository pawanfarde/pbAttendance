const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
autoIncrement = require('mongoose-plugin-autoinc');

const emp_leave_Schema = new mongoose.Schema({
    "UID": { type: Number },
    "Total_Leave_Balance": { type: Number },
    "Leave_Approved": { type: Number },
    "Leave_Approval_Pending": { type: Number },
    "Current_Leave_Balance": { type: Number },
    "Created_On": { type: Date },  
    "Modified_On": { type: Date }
}, {
    collection: 'emp_leaves'
});


emp_leave_Schema.plugin(mongoosePaginate);
const emp_leave_data = mongoose.model("emp_leaves", emp_leave_Schema);
module.exports = emp_leave_data;
