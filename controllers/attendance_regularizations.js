const moment = require('moment');
const express = require('express');
const router = express.Router();

const AttendanceRegularization = require('../models/attendance_regularization');
const Attendance = require('../models/emp_attendance');
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
        const DateVal =  moment(ObjRequest.Date).format("YYYY-MM-DDTHH:mm:ss[Z]");    //moment(ObjRequest.Date).toDate();  moment(ObjRequest.Date).format("YYYY-MM-DDTHH:mm:ss[Z]")
        console.log("DateVal=",DateVal)
        const Time = ObjRequest.Time || "";
        const Reson = ObjRequest.Reson || "";
        const Direction = ObjRequest.Direction || "";
        const Reg_Req_Status = "Pending";
        
        const emp = await Employee.findOne({ UID: UID, IsActive: 1 });
        if (!emp) {
            return res.status(400).json({ status: 'FAIL', message: 'Employee not found or inactive.' });
        }

        const startOfDay1 = moment().startOf('day').toDate();
        const endOfDay1 = moment().endOf('day').toDate();

        const existingDay = await AttendanceRegularization.findOne({ UID, Created_On: {
            $gte: startOfDay1,
            $lte: endOfDay1
        } });
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
        console.log("startOfQuarter",startOfQuarter)
        console.log("endOfQuarter",endOfQuarter)

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
            Created_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]"),
            Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
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


// // ✅ Month Range: 26 to 25 logic
// function getCurrentMonthRange() {
//     const today = moment();
//     const currentDate = today.date();

//     let startDate, endDate;

//     if (currentDate >= 26) {
//         startDate = moment(today).date(26);
//         endDate = moment(today).add(1, 'months').date(25).endOf('day');
//     } else {
//         startDate = moment(today).subtract(1, 'months').date(26);
//         endDate = moment(today).date(25).endOf('day');
//     }

//     return { startDate, endDate };
// }

// // ✅ Quarter Logic
// function getQuarterMonths(date) {
//     const m = date.month();
//     if (m <= 2) return [0, 1, 2];       // Jan–Mar
//     if (m <= 5) return [3, 4, 5];       // Apr–Jun
//     if (m <= 8) return [6, 7, 8];       // Jul–Sep
//     return [9, 10, 11];                 // Oct–Dec
// }

// // ✅ Regularize Attendance API
// router.post('/att_reg/regularize', async (req, res) => {
//     try {
//         const { uid: UID, Date, Time, Reson, Direction } = req.body;

//         if (!UID || !Date || !Direction || !Reson) {
//             return res.status(400).json({ status: 'FAIL', message: 'All fields are required.' });
//         }

//         const DateVal = moment(Date).toDate(); // 👈 Preserves time
//         const nowIST = moment().utcOffset("+05:30").toDate(); // 👈 Created_On / Modified_On in IST   format("YYYY-MM-DDTHH:mm:ss[Z]")

//         const emp = await Employee.findOne({ UID, IsActive: 1 });
//         if (!emp) {
//             return res.status(404).json({ status: 'FAIL', message: 'Employee not found or inactive.' });
//         }

//         // ✅ Rule 1: Only one request per UID per day (on same 'Date' field)
//         const startOfDay = moment().startOf('day').toDate();
//         const endOfDay = moment().endOf('day').toDate();

//         const existingDay = await AttendanceRegularization.findOne({
//             UID,
//             Created_On: { $gte: startOfDay, $lte: endOfDay }
//         });

//         if (existingDay) {
//             return res.status(400).json({ status: 'FAIL', message: 'Only one regularization allowed per day.' });
//         }

//         // ✅ Rule 2: Max 2/month (custom range: 26 → 25)
//         const { startDate, endDate } = getCurrentMonthRange();

//         const monthlyCount = await AttendanceRegularization.countDocuments({
//             UID,
//             Date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         });

//         if (monthlyCount >= 2) {
//             return res.status(400).json({
//                 status: 'FAIL',
//                 message: 'Max 2 regularizations allowed in the current month (26th to 25th).'
//             });
//         }

//         // ✅ Rule 3: Max 4/quarter
//         const quarterMonths = getQuarterMonths(moment(DateVal));
//         const startQuarter = moment(DateVal).month(quarterMonths[0]).startOf('month').toDate();
//         const endQuarter = moment(DateVal).month(quarterMonths[2]).endOf('month').toDate();

//         const quarterCount = await AttendanceRegularization.countDocuments({
//             UID,
//             Date: { $gte: startQuarter, $lte: endQuarter }
//         });

//         if (quarterCount >= 4) {
//             return res.status(400).json({
//                 status: 'FAIL',
//                 message: 'Max 4 regularizations allowed per quarter.'
//             });
//         }

//         // ✅ All good, save the regularization request
//         const newRequest = new AttendanceRegularization({
//             UID,
//             RM_Id: emp.Reporting_Manager_Emp_Id || 0,
//             Date: DateVal,
//             Time: Time || moment(DateVal).format('HH:mm:ss'), // default to punch time
//             Reson,
//             Direction,
//             Reg_Req_Status: 'Pending',
//             Created_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]"),
//             Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
//         });

//         await newRequest.save();

//         res.status(201).json({
//             status: 'Success',
//             message: 'Regularization request created successfully.',
//             data: newRequest
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             status: 'Error',
//             message: 'Something went wrong',
//             error: err.message
//         });
//     }
// });

router.post('/att_reg/get_regularize_req', async (req, res) => {
    try {
        const { UID,status,RM_Id, startDate, endDate, page, limit } = req.body;

        let filter = {};
        if (UID) filter.UID = UID;
        if(status) filter.Reg_Req_Status = status;
        if(RM_Id) filter.RM_Id =RM_Id;
        // if (startDate && endDate) {
        //     filter.Log_Date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        // }

        const optionPaginate = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { Log_Date: 1 },
            lean: true
        };

        const getAttendanceRegularization = await AttendanceRegularization.paginate(filter, optionPaginate);
       
        res.json({
            Status: "SUCCESS",
            docs: getAttendanceRegularization,    
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ Status: "FAIL", Msg: "Something went wrong", Error: err.message });
    }
});

router.post('/att_reg/update-status', async (req, res) => {
    try {
        const { UID, Date, Status } = req.body;
        if (!UID || !Date || !Status) {
            return res.status(400).json({ status: 'FAIL', message: 'UID, Date, and Status are required.' });
        }

        const DateVal = moment(Date).startOf('day').toDate(); 
        const nextDay = moment(Date).endOf('day').toDate();   

        const reg = await AttendanceRegularization.findOne({
            UID,
            Date: { $gte: DateVal, $lte: nextDay }
        });

        if (!reg) {
            return res.status(404).json({ status: 'FAIL', message: 'Regularization request not found.' });
        }

        const attendance = await Attendance.findOne({
            UID,
            Log_Date: { $gte: DateVal, $lte: nextDay }
        });

        if (!attendance) {
            return res.status(404).json({ status: 'FAIL', message: 'Attendance record not found.' });
        }

        let regTime = moment(reg.Time, "HH:mm");
        let calcMin = 0;
        if(Status === "Approved"){
            if (reg.Direction === "IN") {
                if (!attendance.Swipe_Out) {
                    return res.status(400).json({ status: 'FAIL', message: 'Swipe_Out is missing for IN direction.' });
                }
    
                // calcMin = moment(attendance.Swipe_Out).diff(moment(regTime), 'minutes');
                
                const swipeOutTime = moment(attendance.Swipe_Out, "HH:mm");
                calcMin = swipeOutTime.diff(regTime, 'minutes');
    
                if (calcMin >= attendance.Req_Min) {
                    await AttendanceRegularization.updateOne({ _id: reg._id }, { $set: { Reg_Req_Status: "Approved" } });
                    await Attendance.updateOne({ _id: attendance._id }, {
                        $set: {
                            Swipe_In: reg.Time,
                            Calc_Min: calcMin,
                            Calc_Attendance:"PR",
                            Final_Attendance: "Present"
                        }
                    });
                }
    
            } else if (reg.Direction === "OUT") {
                if (!attendance.Swipe_In) {
                    return res.status(400).json({ status: 'FAIL', message: 'Swipe_In is missing for OUT direction.' });
                }
    
                // calcMin = moment(regTime).diff(moment(attendance.Swipe_In), 'minutes');
    
                const swipeInTime = moment(attendance.Swipe_In, "HH:mm");
                calcMin = regTime.diff(swipeInTime, 'minutes');
    
                if (calcMin >= attendance.Req_Min) {
                    await AttendanceRegularization.updateOne({ _id: reg._id }, { $set: { Reg_Req_Status: "Approved" } });
                    await Attendance.updateOne({ _id: attendance._id }, {
                        $set: {
                            Swipe_Out: reg.Time,
                            Calc_Min: calcMin,
                            Calc_Attendance:"PR",
                            Final_Attendance: "Present"
                        }
                    });
                }
            }
        } else{
            await AttendanceRegularization.updateOne({ _id: reg._id }, { $set: { Reg_Req_Status: "Reject" } });
            return res.status(404).json({ status: 'FAIL', message: 'Your Regularize request is rejected' });
        }
        return res.status(200).json({
            status: 'Success',
            message: 'Regularization status checked and updated.',
            Calc_Min: calcMin
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'Error',
            message: 'Something went wrong',
            error: error.message
        });
    }
});


module.exports = router;
