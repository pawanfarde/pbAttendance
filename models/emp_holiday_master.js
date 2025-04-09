const mongoose = require('mongoose');
autoIncrement = require('mongoose-plugin-autoinc');

const emp_holiday_master_Schema = new mongoose.Schema({
    Employee_Holiday_Master_Id: Number,
    Date: Date,
    Weekday: String,
    Festival: String,
    Calendar_Name: String,
    Holiday_Type: String,
    Branches: [String],
    Year: Number
}, {
    collection: 'emp_holiday_masters'
});
emp_holiday_master_Schema.plugin(autoIncrement.plugin, {model: 'emp_holiday_master',field: 'Employee_Holiday_Master_Id',startAt: 1});
const employee_holiday_data = mongoose.model('emp_holiday_master', emp_holiday_master_Schema);
module.exports = employee_holiday_data