const moment = require('moment');
const express = require('express');
const router = express.Router();

const AttendanceRegularization = require('../models/attendance_regularization');
const Employee = require('../models/employee'); 
function getCurrentMonthRange() {
    const today = moment();
    const currentDate = today.date();
    
    let startDate, endDate;

    if (currentDate >= 26) {
        startDate = moment(today).date(26);
        endDate = moment(today).add(1, 'months').date(25).endOf('day');
    } else {
        startDate = moment(today).subtract(1, 'months').date(26);
        endDate = moment(today).date(25).endOf('day');
    }

    return { startDate, endDate };
}

function getQuarter(date) {
    const m = date.month();
    if (m <= 2) return [0, 1, 2];       
    else if (m <= 5) return [3, 4, 5];  
    else if (m <= 8) return [6, 7, 8];  
    else return [9, 10, 11];            
}

router.post('/att_reg/regularize', async (req, res) => {
    try {
        const ObjRequest = req.body;
        const now = new Date();

        const UID = ObjRequest.uid || "";
        const RM_Id = ObjRequest.RM_Id || "";
        const DateVal = moment(ObjRequest.Date).startOf('day').toDate();
        const Time = ObjRequest.Time || "";
        const Reson = ObjRequest.Reson || "";
        const Direction = ObjRequest.Direction || "";
        const Reg_Req_Status = "Pending";

        const emp = await Employee.findOne({ UID: UID, IsActive: 1 });
        if (!emp) {
            return res.status(400).json({ status: 'FAIL', message: 'Employee not found or inactive.' });
        }

        const existingDay = await AttendanceRegularization.findOne({ UID, Date: DateVal });
        if (existingDay) {
            return res.status(400).json({ status: 'FAIL', message: 'Only one regularization allowed per day.' });
        }

        const { startDate, endDate } = getCurrentMonthRange();

        const monthlyCount = await AttendanceRegularization.countDocuments({
            UID,
            Date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        });

        if (monthlyCount >= 2) {
            return res.status(400).json({
                Status: 'FAIL',
                message: 'You cannot apply for more than 2 days in the current month (26th to 25th).'
            });
        }

        const quarterMonths = getQuarter(moment(DateVal));
        const startOfQuarter = moment(DateVal).month(quarterMonths[0]).startOf('month').toDate();
        const endOfQuarter = moment(DateVal).month(quarterMonths[2]).endOf('month').toDate();

        const quarterCount = await AttendanceRegularization.countDocuments({
            UID,
            Date: { $gte: startOfQuarter, $lte: endOfQuarter }
        });

        if (quarterCount >= 4) {
            return res.status(400).json({
                status: 'FAIL',
                message: 'You cannot apply for more than 4 days in this quarter.'
            });
        }

        const newRequest = new AttendanceRegularization({
            UID,
            RM_Id:emp.Reporting_Manager_Emp_Id,
            Date: DateVal,
            Time,
            Reson,
            Direction,
            Reg_Req_Status,
            Created_On: moment().toDate(),
            Modified_On: moment().toDate()
        });

        await newRequest.save();

        res.status(201).json({
            status: 'Success',
            message: 'Regularization request created successfully',
            data: newRequest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'Error',
            message: 'Failed to create regularization request',
            error: error.message
        });
    }
});

module.exports = router;
