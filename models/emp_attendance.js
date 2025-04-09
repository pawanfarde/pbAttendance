const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");


const emp_attendance_Schema = new mongoose.Schema({
    "UID": { type: String, required: true, },
    "Log_Date": { type: Date, required: true },
    "Day": { type: String },
    "Shift_Name": { type: String },
    "Schedule": { type: String },
    "Swipe_In": { type: String },
    "Swipe_Out": { type: String },
    "Calc_In": { type: String },
    "Calc_Out": { type: String },
    "Req_Min": { type: Number },
    "Calc_Min": { type: Number },
    "Diff": { type: Number },
    "Calc_Attendance": { type: String },
    "Outdoor": { type: String },
    "Leave": { type: String },
    "Final_Attendance": { type: String },
    "Exception": { type: String },
    "HD_Cut_Off_Time": { type: String },
    "Device_Id": { type: Number },
    "Created_On": { type: Date },  
    "Modified_On": { type: Date }  
}, {
    collection: 'emp_attendances'
});
emp_attendance_Schema.plugin(mongoosePaginate);
module.exports = mongoose.model("emp_attendances", emp_attendance_Schema);
