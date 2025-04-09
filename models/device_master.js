const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
autoIncrement = require('mongoose-plugin-autoinc');


const device_master_Schema = new mongoose.Schema({
    "Device_Id": { type: Number },
    "Divice_Master_Number":{ type: Number },
    "Device_Name": { type: String},
    "UID": { type: Number },
    "Location": { type: String},
    "Status": { type: Number, default: 1 },
    "Image": { type: String },
    "Created_On": { type: Date },  
    "Modified_On": { type: Date }  
}, {
    collection: 'device_master'
});
device_master_Schema.plugin(mongoosePaginate);
device_master_Schema.plugin(autoIncrement.plugin, {model: 'device_master', field: 'Device_Id', startAt: 1});

const device_master_data = mongoose.model("device_master", device_master_Schema);
module.exports = device_master_data;


