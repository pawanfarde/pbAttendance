const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    Emp_Id: Number,
    Emp_Code: Number,
    Emp_Name: String,
    Department_ID: Number,
    Designation_ID: Number,
    Role_ID: Number,
    Email_Id: String,
    Alternate_Email: String,
    Mobile_Number: Number,
    Alternate_Number: Number,
    Emp_Password: Buffer, 
    Reporting_Manager_Emp_Id: Number,
    CreatedOn: Number,
    IsActive: { type: Number, default: 1 },
    Updated_On: Number,
    IsPasswordChanged: Number,
    BloodGroup: String,
    Branch: String,
    DOB: Number,
    DOJ: Number,
    PathofSnaps: String,
    Advt_Source_Id: Number,
    LMSBuyer_Id: Number,
    LastUpdatedBy: Number,
    Dailer_Id: Number,
    AdharCardNumber: String,
    Pan: String,
    VendorCode: String,
    UID: Number,
    FBA_ID: Number,
    Reporting_UID_Name: String,
    Reporting_Email_ID: String,
    Reporting_Mobile_Number: String,
    LastPasswordChangedDate: Number,
    Is_FSM: Number,
    DateOfBirth: Number,
    Password_New: String
}, {
    collection: 'employee'
});

module.exports = mongoose.model('Employee', employeeSchema);
