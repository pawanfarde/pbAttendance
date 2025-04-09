const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
autoIncrement = require('mongoose-plugin-autoinc');


const attendance_regularization_Schema = new mongoose.Schema({
    "UID": { type: Number },
    "RM_Id":{ type: Number },
    "Date": { type: Date },
    "Time": { type: String },
    "Reson": { type: String },
    "Direction": { type: String },
    "Reg_Req_Status": { type: String, default: "Pending" },
    "Created_On": { type: Date },  
    "Modified_On": { type: Date }  
}, {
    collection: 'attendance_regularizations'
});

const device_master_data = mongoose.model("attendance_regularizations", attendance_regularization_Schema);
module.exports = device_master_data;


