const mongoose = require("mongoose");

const emp_monthly_count_Schema = new mongoose.Schema({
   "UID": { type: String },  
    "Month_Cycle": { type: String },  
    "Buffer_Count": { type: Number, default: 0 },
    "Extended_Apply_Count": { type: Number, default: 0 },
    "Created_On": { type: String },
    "Modified_On": { type: String }
}, {
    collection: 'emp_monthly_counts'
});

const emp_monthly_count_data =  mongoose.model("emp_monthly_counts", emp_monthly_count_Schema);
module.exports = emp_monthly_count_data