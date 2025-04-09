const mongoose = require("mongoose");

const EmpShiftSchema = new mongoose.Schema({
    UID: { type: Number },
    Shift_Code: { type: Number },
    Shift_Name: { type: String },
    Shift_Type: { type: String },
    Shift_Timing: { type: String },
    Base_Location: { type: String },
    Weekly_Off: { type: String },
    Single_Punch: { type: String },
    App_Access: { type: String },
    Outdoor_Access: { type: String },
    Mapped_Device_Id: { type: Number }
}, {
    collection: 'employee_shift_masters'
});

module.exports = mongoose.model("employee_shift_masters", EmpShiftSchema);