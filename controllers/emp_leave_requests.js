var express = require('express');
var router = express.Router();
const moment = require("moment");
const Employee = require("../models/employee");
const EmpLeave = require('../models/emp_leave');
const EmpLeaveRequest = require("../models/emp_leave_request");
const EmpAttendance = require('../models/emp_attendance');
const EmpShift = require("../models/emp_shift_master.js");

router.post('/emp_leave/add_emp_leave', async (req, res) => {
    try {
        const empLeaveData = new EmpLeave(req.body);
        const savedEmpLeave = await empLeaveData.save();

        res.status(201).json({
            Msg: "created successfully",
            Status: "SUCCESS",
            Data: savedEmpLeave
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({
            Msg: "Failed to create holiday",
            Status: "FAIL",
            Error: err.message
        });
    }
});

router.post("/emp_leave_req/add_emp_leave_request", async (req, res) => {
    try {
        var { UID, Leave_Type, Leave_From_Date, Leave_To_Date, Reason } = req.body;

        var fromDate = moment.utc(Leave_From_Date, "YYYY-MM-DD").startOf('day').toDate();
        var toDate = moment.utc(Leave_To_Date, "YYYY-MM-DD").endOf('day').toDate();

        const duplicateLeave = await EmpLeaveRequest.findOne({
            UID: UID,
            Leave_From_Date: { $lte: toDate },
            Leave_To_Date: { $gte: fromDate }
        });
        if (duplicateLeave) { return res.status(400).json({ Status: "FAIL", Msg: "Leave already exists or overlaps with existing leave." }); }

        if (Leave_Type === "HD") {
            const leaveDate = moment.utc(Leave_From_Date).startOf('day').toDate();
            const attRecord = await EmpAttendance.findOne({ UID, Log_Date: leaveDate });
            if (!attRecord) {
                return res.status(400).json({ Status: "FAIL", Msg: "Employee not present on this date.You can not apply half Day" })
            }
        }


        const emp = await Employee.findOne({ UID: UID, IsActive: 1 });
        if (!emp) return res.status(404).json({ message: "Employee not found" });

        const Supervisor_UID = emp.Reporting_Manager_Emp_Id;

        const diffDays = moment(toDate).diff(moment(fromDate), "days") + 1;
        const leaveCount = Leave_Type === "PL" ? diffDays : diffDays / 2;
        const empLeave = await EmpLeave.findOne({ UID });
        if (!empLeave) {
            return res.status(404).json({ Status: "FAIL", Msg: "Employee leave data not found." });
        }
        if (empLeave.Current_Leave_Balance < leaveCount) {
            return res.status(400).json({ Status: "FAIL", Msg: `Insufficient leave balance.Your current leave balance is ${empLeave.Current_Leave_Balance}` });
        }

        const empLeaveReq = await EmpLeaveRequest.create({
            UID,
            Leave_Type,
            Leave_From_Date: fromDate,
            Leave_To_Date: toDate,
            Leave_Count: diffDays,
            Reason,
            Supervisor_UID,
            Approval_Status: "Pending",
            Created_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]"),
            Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
        });


        await EmpLeave.updateOne(
            { UID: UID },
            {
                $inc: {
                    Leave_Approval_Pending: leaveCount,
                    Current_Leave_Balance: -leaveCount
                },
                $set: {
                    Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
                }
            }
        );
        res.status(200).json({ Status: "SUCCESS", Msg: "Leave applied successfully", Data: empLeaveReq });
    } catch (err) {
        console.error(err);
        res.status(500).json({ Status: "FAIL", Msg: "Server error" });
    }
});


router.post("/emp_leave_req/update_emp_leave_request", async (req, res) => {
    try {
        const { Leave_ID,Status,Remark } = req.body;
        if (!Leave_ID || !Status || !Remark) {
            return res.status(400).json({ Status: 'FAIL', Msg: 'Required feilds are missing.' });
        }

        const leaveRequest = await EmpLeaveRequest.findOne({ Leave_ID });
        if (!leaveRequest) {
            return res.status(404).json({ Status: 'FAIL', Msg: 'Leave request not found.' });
        }

        const { UID, Leave_Count, Leave_Type, Leave_From_Date, Leave_To_Date } = leaveRequest;

        await EmpLeaveRequest.updateOne(
            { Leave_ID },
            {
                $set: {
                    Approval_Status: Status,
                    Supervisor_Remarks: Remark,
                    Approval_Time: moment().format("YYYY-MM-DDTHH:mm:ss[Z]"),
                    Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
                }
            }
        );

        const empLeave = await EmpLeave.findOne({ UID });
        if (!empLeave) {
            return res.status(404).json({ Status: 'FAIL', Msg: 'Employee leave data not found.' });
        }
        let empShift = await EmpShift.findOne({ UID })
        const leaveDate = moment.utc(Leave_From_Date).startOf('day').toDate();
        if (Status === "Reject"){
            const updatedLeaves = {
                Leave_Approval_Pending: Leave_Type === "PL"? empLeave.Leave_Approval_Pending - Leave_Count : empLeave.Leave_Approval_Pending - 0.5,
                Current_Leave_Balance: Leave_Type === "PL"? empLeave.Current_Leave_Balance + Leave_Count : empLeave.Current_Leave_Balance + 0.5,
                Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
            };

            await EmpLeave.updateOne({ UID }, { $set: updatedLeaves });
            return res.status(404).json({ Status: 'SUCCESS', Msg: 'Your leave request is rejected.' });
        }
        if (Leave_Type === "PL") {
            const updatedLeaves = {
                Leave_Approved: empLeave.Leave_Approved + Leave_Count,
                Leave_Approval_Pending: empLeave.Leave_Approval_Pending - Leave_Count,
                Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
            };

            await EmpLeave.updateOne({ UID }, { $set: updatedLeaves });

            const from = moment.utc(Leave_From_Date).startOf('day');
            const to = moment.utc(Leave_To_Date).startOf('day');

            for (let m = moment.utc(from); m.isSameOrBefore(to); m.add(1, 'days')) {
                const date = m.toDate();
                const day = m.format('dddd');

                const existing = await EmpAttendance.findOne({ UID, Log_Date: date });
                if (!existing) {
                    const attendance = new EmpAttendance({
                        UID,
                        Log_Date: date,
                        Day: day,
                        Shift_Name: empShift.Shift_Name,
                        Leave: "PL",
                        Final_Attendance: "Present",
                        Created_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]"),
                        Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
                    });
                    await attendance.save();
                } else {
                    await EmpAttendance.updateOne(
                        { UID, Log_Date: date },
                        { $set: { Leave: "PL", Final_Attendance: "Present" } }
                    );
                }
            }
        } else {
            const updatedLeaves = {
                Leave_Approved: empLeave.Leave_Approved + 0.5,
                Leave_Approval_Pending: empLeave.Leave_Approval_Pending - 0.5,
                Modified_On: moment().format("YYYY-MM-DDTHH:mm:ss[Z]")
            };

            await EmpLeave.updateOne({ UID }, { $set: updatedLeaves });
            const attRecord = await EmpAttendance.findOne({ UID, Log_Date: leaveDate });
            if (attRecord) {
                await EmpAttendance.updateOne(
                    { _id: attRecord._id },
                    {
                        $set: {
                            Leave: "HD",
                            Final_Attendance: "Present"
                        }
                    }
                );
            }
        }

        res.status(200).json({
            Status: 'SUCCESS',
            Msg: 'Leave approved and records updated.'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            Status: 'FAIL',
            Msg: 'Something went wrong',
            error: error.message
        });
    }
});


// router.post('/emp_leave_req/get_emp_leave_request', async (req, res) => {
//     try {
//         const { UID,status, page, limit,excludePending  } = req.body;

//         let filter = {};
//         if (UID) filter.UID = UID;
//         if (status) {
//             filter.Approval_Status = status;
//         } else if (excludePending) {
//             filter.Approval_Status = { $ne: "Pending" }; 
//         }
//         // if (startDate && endDate) {
//         //     filter.Log_Date = { $gte: new Date(startDate), $lte: new Date(endDate) };
//         // }

//         const optionPaginate = {
//             page: parseInt(page),
//             limit: parseInt(limit),
//             sort: { Created_On: 1 },
//             lean: true
//         };

//         const getempLeaveRequest = await EmpLeaveRequest.paginate(filter, optionPaginate);
//         const empLeaveCount = await EmpLeave.findOne({ UID });
//         res.json({
//             Status: "SUCCESS",
//             Data: getempLeaveRequest,
//             empLeaveCount    
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ Status: "FAIL", Msg: "Something went wrong", Error: err.message });
//     }
// });


router.post('/emp_leave_req/get_emp_leave_request_for_manager', async (req, res) => {
    try {
        const { rm_UID, status, page, limit,excludePending  } = req.body;

        let filter = {};
        if (rm_UID) filter.Supervisor_UID = rm_UID;
        if (status) filter.Approval_Status = status;
       

        const optionPaginate = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { Created_On: 1 },
            lean: true
        };

        const getempLeaveRequest = await EmpLeaveRequest.paginate(filter, optionPaginate);
        res.json({
            Status: "SUCCESS",
            Data: getempLeaveRequest,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ Status: "FAIL", Msg: "Something went wrong", Error: err.message });
    }
});

// Get single leave request by Leave_ID
router.post('/emp_leave_req/get_leave_request_by_id', async (req, res) => {
    try {
      const { Leave_ID } = req.body;
  
      if (!Leave_ID) {
        return res.status(400).json({
          Status: 'FAIL',
          Msg: 'Leave_ID is required.'
        });
      }
  
      const leave = await EmpLeaveRequest.findOne({ Leave_ID: Leave_ID });
  
      if (!leave) {
        return res.status(404).json({
          Status: 'FAIL',
          Msg: 'No leave request found for given Leave_ID.'
        });
      }
  
      res.status(200).json({
        Status: 'SUCCESS',
        Data: leave
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        Status: 'FAIL',
        Msg: 'Server error',
        Error: err.message
      });
    }
  });
  



  router.post('/emp_leave_req/get_emp_leave_request', async (req, res) => {
    try {
        const ObjRequest = req.body;
        const obj_pagination = jqdt_paginate_process(ObjRequest); 

        const filter = obj_pagination.filter || {};
        const optionPaginate = {
            page: obj_pagination.paginate.page ,
            limit: obj_pagination.paginate.limit ,
            sort: { Created_On: 1 },
            lean: true
        };

        // Extra filtering from payload
        if (ObjRequest.UID) {
            filter.UID = parseInt(ObjRequest.UID);
        }
        if (ObjRequest.status) {
            filter.Approval_Status = ObjRequest.status;
        } else if (ObjRequest.excludePending) {
            filter.Approval_Status = { $ne: "Pending" };
        }

        const EmpLeaveRequest = require('../models/emp_leave_request');
        const EmpLeave = require('../models/emp_leave');

        const getempLeaveRequest = await EmpLeaveRequest.paginate(filter, optionPaginate);
        const empLeaveCount = await EmpLeave.findOne({ UID: parseInt(ObjRequest.UID) });

        res.json({
            Data: getempLeaveRequest,
            empLeaveCount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ Status: "FAIL", Msg: "Something went wrong", Error: err.message });
    }
});

  function jqdt_paginate_process(paginate_param) {
    let obj_pagination = {
        filter: {},
        paginate: {
            page: 1,
            total: 0,
            limit: 10
        },
        sort: []
    };

    // Calculate page and limit
    obj_pagination.paginate.page = Math.floor(paginate_param.start / paginate_param.length) + 1;
    obj_pagination.paginate.limit = parseInt(paginate_param.length);

    let t_key = '', t_val = '';
    for (let key in paginate_param) {
        if (key.indexOf('[data]') > -1) {
            t_key = paginate_param[key];
        }
        if (key.indexOf('[search][value]') > -1) {
            t_val = isNaN(paginate_param[key]) ? paginate_param[key] : (paginate_param[key] - 0);
            if (t_val !== '') {
                obj_pagination.filter[t_key] = t_val;
            }
            t_key = t_val = '';
        }
    }

    return obj_pagination;
}



module.exports = router;


