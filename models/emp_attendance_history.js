const mongoose = require("mongoose");
autoIncrement = require('mongoose-plugin-autoinc');

const emp_attendance_history_Schema = new mongoose.Schema({
    "Attendance_History_Id": { type: Number },
    "UID": { type: String },
    "Log_Date": { type: Date },
    "Day": { type: String },
    "Shift_Name": { type: String },
    "Swipe_In": { type: String },
    "Swipe_Out": { type: String },
    "Device_Id": { type: Number },
    "Created_On": { type: Date },  
    "Modified_On": { type: Date }
}, {
    collection: 'emp_attendance_histories'
});

emp_attendance_history_Schema.plugin(autoIncrement.plugin, {model: 'emp_attendance_histories', field: 'Attendance_History_Id', startAt: 1});

module.exports = mongoose.model("emp_attendance_histories", emp_attendance_history_Schema);
