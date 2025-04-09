var express = require('express');
var router = express.Router();
var moment = require('moment');
// var EmpShift = require("../models/emp_shift.js");
var EmpShift = require("../models/emp_shift_master.js");
let Attendance = require('../models/emp_attendance.js');
var AttendanceHistory = require('../models/emp_attendance_history.js');
let BufferCount = require('../models/emp_monthly_count.js');
const Holiday = require('../models/emp_holiday_master.js');
const DeviceMaster = require('../models/device_master.js');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {imageHash} = require('image-hash');


const upload = multer({
    dest: 'temp_uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/attendance/punch_in_pawann", upload.single("image"), async function (req, res) {
    try {
        let ObjRequest = req.body;
        let log_Date = moment().format("YYYY-MM-DD");

        let obj_Data = {
            "UID": ObjRequest.uid || "",
            "time": ObjRequest.time || "",
            "device_id": ObjRequest.device_id || "",
            "Type": ObjRequest.type || "",
            "Log_Date": "2025-03-29"//log_Date
        };
        var timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

        if (obj_Data.UID === "") { return res.json({ "Msg": "UID is Missing", "Status": "FAIL" }); }
        // if (obj_Data.time === "" || !timeRegex.test(obj_Data.time)) { return res.json({ "Msg": "Invalid or missing punch time", "Status": "FAIL" }); }
        if (obj_Data.Type === "") { return res.json({ "Msg": "Type (IN/OUT) is Missing", "Status": "FAIL" }); }
        if (obj_Data.device_id === "") { return res.json({ "Msg": "divice_id is Missing", "Status": "FAIL" }); }
        if (!req.file) {
            return res.json({ Status: "FAIL", Msg: "Image file is required" });
        }

        let punchTime = moment(obj_Data.time, "HH:mm");
        let monthCycle = getMonthCycle(log_Date);


        let empDeviceData = await DeviceMaster.findOne({ UID: obj_Data.UID, Divice_Master_Number: obj_Data.device_id, Status: 1 });
        if (!empDeviceData) {
            return res.json({ "Msg": "The employee has not been assigned this device ID", "Status": "FAIL" })
        }

        let storedImagePath = path.join(__dirname, "..", empDeviceData.Image);
        let uploadedImagePath = req.file.path;

        let similarity = await compareImages(uploadedImagePath, storedImagePath);

        if (similarity >= 70) {
            // Match mil gaya
            // Attendance logic continue
        } else {
            // Match fail
            return res.status(401).json({ message: "Image not matched", similarity: similarity.toFixed(2) + "%" });
        }


        if (obj_Data.Type.toUpperCase() === "IN") {
            let empShift = await EmpShift.findOne({ UID: obj_Data.UID, Mapped_Device_Id: obj_Data.device_id });
            // let empShift = empShiftData._doc

            if (!empShift) { return res.json({ "Msg": "The employee has not been assigned a shift", "Status": "FAIL" }); }
            if (!empShift.Base_Location) { return res.json({ "Msg": "The employee has not been assigned location", "Status": "FAIL" }) }

            let mappedDevice = empShift.Mapped_Device_Id
            if (!mappedDevice) { return res.json({ "Msg": "The employee has not been assigned a device ID", "Status": "FAIL" }) }
            if (mappedDevice = !obj_Data.device_id) { return res.json({ "Msg": "You punch in the wrong device", "Status": "FAIL" }) }
            let shiftStartTime = moment(empShift.Shift_Timing.split("_To_")[0], "HH:mm");
            let shiftEndTime = moment(empShift.Shift_Timing.split("_To_")[1], "HH:mm");
            let reqMin = shiftEndTime.diff(shiftStartTime, 'minutes');

            let existing_Record = await Attendance.findOne({ UID: obj_Data.UID, Log_Date: obj_Data.Log_Date });
            let swipeInTime = empShift.Single_Punch === "Yes" ? empShift.Shift_Timing.split("_To_")[0] : obj_Data.time;
            let swipeOutTime = empShift.Single_Punch === "Yes" ? empShift.Shift_Timing.split("_To_")[1] : obj_Data.time;
            let calcAttendance = empShift.Single_Punch === "Yes" ? "PR" : "AB";
            let finalAttendance = empShift.Single_Punch === "Yes" ? "Present" : "Absent";

            let obj_Keys = {
                "UID": obj_Data.UID,
                "Log_Date": obj_Data.Log_Date,
                "Day": moment().format("dddd"),
                "Shift_Name": empShift.Shift_Name,
                "Schedule": "shift",
                "Swipe_In": swipeInTime,
                "Swipe_Out": swipeOutTime,
                "Calc_In": swipeInTime,
                "Calc_Out": swipeOutTime,
                "Req_Min": reqMin,
                "Calc_Min": 0,
                "Diff": 0,
                "Calc_Attendance": calcAttendance,
                "Final_Attendance": finalAttendance,
                "Exception": "",
                "Created_On": moment().toDate(),
                "Modified_On": moment().toDate(),
                "Device_Id": obj_Data.device_id,
            };

            let history_obj = {
                "UID": obj_Data.UID,
                "Log_Date": obj_Data.Log_Date,
                "Day": moment().format("dddd"),
                "Shift_Name": empShift.Shift_Name,
                "Swipe_In": swipeInTime,
                "Swipe_Out": swipeOutTime,
                "Device_Id": obj_Data.device_id,
                "Created_On": moment().toDate(),
                "Modified_On": moment().toDate(),
            };
            if (empShift.Single_Punch === "Yes") {
                let saved_Entry = new Attendance(obj_Keys);
                let saved_Data = await saved_Entry.save();

                let saved_History = new AttendanceHistory(history_obj);
                await saved_History.save();

                return res.json({ "Msg": "Punch-In recorded successfully", "Status": "SUCCESS", "Data": saved_Data });
            }

            if (empShift.Single_Punch !== "Yes" && empShift.Shift_Type === "General Shift (GEN)") {
                let bufferEntry = await BufferCount.findOne({ UID: obj_Data.UID });
                let bufferCount = bufferEntry ? bufferEntry.Buffer_Count : 0;

                if (punchTime.isBetween(shiftStartTime.clone().add(1, 'minutes'), shiftStartTime.clone().add(10, 'minutes'), null, '[]')) {
                    await BufferCount.updateOne({ UID: obj_Data.UID, Month_Cycle: monthCycle }, { $inc: { Buffer_Count: 1 } }, { upsert: true });
                }
            }
            if (!existing_Record) {

                let saved_Entry = new Attendance(obj_Keys);
                let saved_Data = await saved_Entry.save();

                let saved_History = new AttendanceHistory(history_obj);
                await saved_History.save();
                return res.json({ "Msg": "Punch-In recorded successfully", "Status": "SUCCESS", "Data": saved_Data });
            }
        } else if (obj_Data.Type.toUpperCase() === "OUT") {
            let existing_Record = await Attendance.findOne({ UID: obj_Data.UID, Log_Date: obj_Data.Log_Date });
            if (!existing_Record) {
                return res.json({ "Msg": "No existing punch-in found for the given UID and date", "Status": "FAIL" });
            }
            let swipeInTime = moment(existing_Record.Swipe_In, "HH:mm");
            let calc_Min = punchTime.diff(swipeInTime, 'minutes');
            let diff = calc_Min < existing_Record.Req_Min ? existing_Record.Req_Min - calc_Min : 0;
            let findBufferEntry = await BufferCount.findOne({ UID: obj_Data.UID, Month_Cycle: monthCycle });

            let shiftDetails = existing_Record.Shift_Name.split("#")
            let shiftStartTime = moment(shiftDetails[1], "HH:mm")
            let shiftEndTime = moment(shiftDetails[2], "HH:mm");

            let final_Attendance = "Absent", calc_Attendance = "AB", Req_Min = existing_Record.Req_Min
            if (shiftDetails[0] === "FLX") {
                if (calc_Min >= existing_Record.Req_Min) {
                    calc_Attendance = "PR";
                    final_Attendance = "Present";
                } else if (calc_Min >= 300) {
                    calc_Attendance = "HD";
                    final_Attendance = "Half Day";
                }
            } else {
                if ((swipeInTime.isSameOrBefore(shiftStartTime)) &&
                    (punchTime.isSameOrAfter(shiftEndTime)) && (calc_Min >= existing_Record.Req_Min)) {
                    calc_Attendance = "PR"
                    final_Attendance = "Present";
                } else if (findBufferEntry && findBufferEntry.Buffer_Count <= 6 && swipeInTime.isBetween(shiftStartTime.clone().add(1, 'minutes'), shiftStartTime.clone().add(10, 'minutes'), null, '[]')) {
                    if (calc_Min >= (existing_Record.Req_Min - 10)) {
                        calc_Attendance = "PR"
                        final_Attendance = "Present";
                    }
                } else if (swipeInTime.isBetween(shiftStartTime.clone().add(1, 'minutes'), shiftStartTime.clone().add(30, 'minutes'), null, '[]')) {
                    let requiredSwipeOut = shiftEndTime.clone().add(30 + swipeInTime.diff(shiftStartTime, 'minutes'), 'minutes');
                    let reqMinInLate = requiredSwipeOut.diff(swipeInTime, 'minutes');
                    // if (punchTime.isSameOrAfter(requiredSwipeOut) && calc_Min >= reqMinInLate) {
                    //     calc_Attendance = "PR"
                    //     final_Attendance = "Present";
                    // } else
                    if (calc_Min >= 300) {
                        Req_Min = reqMinInLate
                        calc_Attendance = "HD"
                        final_Attendance = "Half Day";
                    } else {
                        calc_Attendance = "Ab"
                        final_Attendance = "Absent";
                    }
                } else if (swipeInTime.isBetween(shiftStartTime.clone().add(31, 'minutes'), shiftStartTime.clone().add(210, 'minutes'), null, '[]')) {
                    if (calc_Min >= 300) {
                        calc_Attendance = "HD"
                        final_Attendance = "Half Day";
                    } else {
                        calc_Attendance = "Ab"
                        final_Attendance = "Absent";
                    }
                } else if (swipeInTime.isSameOrAfter(shiftStartTime.clone().add(241, 'minutes'))) {
                    calc_Attendance = "Ab"
                    final_Attendance = "Absent";
                } else if (calc_Min >= 300) {
                    calc_Attendance = "HD"
                    final_Attendance = "Half Day";
                } else {
                    calc_Attendance = "Ab"
                    final_Attendance = "Absent";
                }
            }


            let update_Data = {
                "Swipe_Out": obj_Data.time,
                "Calc_Out": obj_Data.time,
                "Req_Min": Req_Min,
                "Calc_Min": calc_Min,
                "Diff": diff,
                "Calc_Attendance": calc_Attendance,
                "Final_Attendance": final_Attendance,
                "Modified_On": moment().toDate(),
            };

            let Att_updated_Record = await Attendance.findOneAndUpdate(
                { UID: obj_Data.UID, Log_Date: obj_Data.Log_Date },
                { $set: update_Data },
                { new: true }
            );

            if (Att_updated_Record) {
                let history_obj = {
                    "UID": obj_Data.UID,
                    "Log_Date": obj_Data.Log_Date,
                    "Day": moment().format("dddd"),
                    "Shift_Name": existing_Record.Shift_Name,
                    "Swipe_In": existing_Record.Swipe_In,
                    "Swipe_Out": obj_Data.time,
                    "Device_Id": existing_Record.Device_Id,
                    "Created_On": moment().toDate(),
                    "Modified_On": moment().toDate(),
                };

                let saved_History = new AttendanceHistory(history_obj);
                await saved_History.save();
                return res.json({ "Msg": "Punch-Out recorded successfully", "Status": "SUCCESS" });
            }
        }
        return res.json({ "Msg": "Invalid request", "Status": "FAIL" });
    } catch (error) {
        console.log(error)
        return res.json({ "Msg": "Unexpected error while processing punch", "Status": "FAIL", "Data": error.message });
    }
});

// image compare functions start
function getHash(imagePath) {
    return new Promise((resolve, reject) => {
        imageHash(imagePath, 16, true, (error, data) => {
            if (error) reject(error);
            else resolve(data);
        });
    });
}

function calculateSimilarity(hash1, hash2) {
    let distance = 0;
    for (var i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }
    let similarity = ((hash1.length - distance) / hash1.length) * 100;
    return similarity;
}

async function compareImages(uploadedImagePath, storedImagePath) {
    try {
        let hash1 = await getHash(uploadedImagePath);
        let hash2 = await getHash(storedImagePath);

        let similarity = calculateSimilarity(hash1, hash2);
        return similarity;
    } catch (err) {
        console.error('Image comparison error:', err);
        return 0;
    }
}

// image compare function end 


function getMonthCycle(date) {
    let currentDate = moment(date, "YYYY-MM-DD");
    let startCycle = moment(date, "YYYY-MM-DD").date(26);
    let endCycle = moment(startCycle).add(1, 'month').date(25);
    if (currentDate.date() < 26) {
        startCycle = moment(startCycle).subtract(1, 'month');
        endCycle = moment(endCycle).subtract(1, 'month');
    }
    return `${startCycle.format("YYYY-MM-DD")}_To_${endCycle.format("YYYY-MM-DD")}`;
}


router.post('/attendance/get_attendance', async (req, res) => {
    try {
        const { UID, startDate, endDate, page, limit } = req.body;

        let filter = {};
        if (UID) filter.UID = UID;
        if (startDate && endDate) {
            filter.Log_Date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const optionPaginate = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { Log_Date: 1 },
            lean: true
        };

        const attendanceData = await Attendance.paginate(filter, optionPaginate);
        const attendanceList = attendanceData.docs.map(record => {
            record.Log_Date = moment(record.Log_Date).format('YYYY-MM-DD');
            return record;
        });

        const offDays = await getEmployeeOffDays(UID, startDate, endDate);
        const finalData = [...attendanceList, ...offDays];
        finalData.sort((a, b) => new Date(a.Log_Date) - new Date(b.Log_Date));

        const summary = {
            Total_Days: 0,
            No_Schedule:0,
            Full_Day: 0,
            WO: 0,
            Holiday: 0,
            Leave: 0,
            Half_Day: 0,
            Absent: 0,
            Payable_Days: 0
        };

        const today = moment().format('YYYY-MM-DD');
        finalData.forEach(record => {
            if (record.Log_Date > today) return;
            summary.Total_Days++;
            switch (record.Final_Attendance) {
                case 'Present': summary.Full_Day++; break;
                case 'WO': summary.WO++; break;
                case 'Holiday': summary.Holiday++; break;
                case 'Leave': summary.Leave++; break;
                case 'Half Day': summary.Half_Day++; break;
                case 'Absent': summary.Absent++; break;
            }
        });

        summary.Payable_Days = (summary.Full_Day + summary.WO + summary.Holiday) - (summary.Absent + summary.Half_Day * 0.5);

        res.json({
            Status: "SUCCESS",
            docs: finalData,
            summary,
            offDays
            
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ Status: "FAIL", Msg: "Something went wrong", Error: err.message });
    }
});


// async function getEmployeeOffDays(uid, startDate, endDate) {
//     try {
//         const empShift = await EmpShift.findOne({ UID: uid });
//         if (!empShift) return [];

//         const weeklyOff = empShift.Weekly_Off;
//         const shiftName = empShift.Shift_Name;
//         const weekends = [];
//         const currentDate = moment(startDate);
//         const end = moment(endDate);

//         const holidays = await Holiday.find({
//             Date: { $gte: new Date(startDate), $lte: new Date(endDate) }
//         });

//         const holidayMap = {};
//         holidays.forEach(holiday => {
//             const formatted = moment(holiday.Date).format("YYYY-MM-DD");
//             holidayMap[formatted] = holiday;
//         });

//         while (currentDate.isSameOrBefore(end, 'day')) {
//             const dateStr = currentDate.format("YYYY-MM-DD");
//             const dayNum = currentDate.day();

//             let off = {
//                 Log_Date: dateStr,
//                 UID: uid,
//                 Day: currentDate.format('dddd'),
//                 Shift_Name: shiftName,
//                 Schedule: '',
//                 Calc_Attendance: '',
//                 Final_Attendance: ''
//             };

//             if (holidayMap[dateStr]) {
//                 off.Schedule = off.Calc_Attendance = off.Final_Attendance = 'Holiday';
//             } else if (
//                 (weeklyOff === 'Only SunOff' && dayNum === 0) ||
//                 (weeklyOff === 'All Sat/Sun Off' && (dayNum === 0 || dayNum === 6)) ||
//                 (weeklyOff === 'All Sun Off' && dayNum === 0) ||
//                 (weeklyOff === '1st/3rd Sat' && dayNum === 6 && [1, 3].includes(getWeekOfMonth(currentDate))) ||
//                 (weeklyOff === '2nd/4th Sat & All Sun Off' && dayNum === 6 && [2, 4].includes(getWeekOfMonth(currentDate)))
//             ) {
//                 off.Schedule = off.Calc_Attendance = off.Final_Attendance = 'WO';
//             } else {
//                 currentDate.add(1, 'day');
//                 continue;
//             }

//             weekends.push(off);
//             currentDate.add(1, 'day');
//         }

//         return weekends;
//     } catch (err) {
//         console.log("Error in getEmployeeOffDays:", err.message);
//         return [];
//     }
// }

// function getWeekOfMonth(date) {
//     return Math.ceil(date.date() / 7);
// }

// async function test() {
//     console.log("Employee pawann a farde Off Days:", await getEmployeeOffDays(120258.0, "2025-03-26", "2025-04-25"));
// }
// test()

async function getEmployeeOffDays(uid, startDate, endDate) {
    try {
        let empShift = await EmpShift.findOne({ UID: uid });

        if (!empShift) {
            return `Employee with UID ${uid} not found!`;
        }

        let weeklyOff = empShift._doc.Weekly_Off;
        let weekends = [];
        let currentDate = moment(startDate);

        let holidays = await Holiday.find({
            Date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        let holidayMap = {};
        holidays.forEach(holiday => {
            let formattedDate = moment(holiday.Date).format("YYYY-MM-DD");
            holidayMap[formattedDate] = holiday;
        });

        while (currentDate.isSameOrBefore(endDate, "day")) {
            let day = currentDate.day();
            let dateStr = currentDate.format("YYYY-MM-DD");

            let offDayObject = {
                Log_Date: dateStr,
                UID: "",
                Day: "",
                Shift_Name: "",
                Schedule: "",
                Calc_Attendance: "",
                Final_Attendance: ""
            };

            if (holidayMap[dateStr]) {
                let holiday = holidayMap[dateStr];
                offDayObject.UID = uid
                offDayObject.Day = holiday._doc.Weekday;
                offDayObject.Shift_Name = empShift._doc.Shift_Name;
                offDayObject.Schedule = "HO";
                offDayObject.Calc_Attendance = "HO";
                offDayObject.Final_Attendance = "Holiday";

                weekends.push(offDayObject);
            }
            else {
                let dayName = day === 6 ? "Saturday" : "Sunday";
                offDayObject.UID = uid
                offDayObject.Day = dayName;
                offDayObject.Shift_Name = empShift._doc.Shift_Name;
                offDayObject.Schedule = "WO";
                offDayObject.Calc_Attendance = "WO";
                offDayObject.Final_Attendance = "WO";

                if (weeklyOff.includes("Only SunOff") && day === 0) {
                    weekends.push(offDayObject);
                }
                if (weeklyOff.includes("All Sat/Sun Off") && (day === 0 || day === 6)) {
                    weekends.push(offDayObject);
                }
                if (weeklyOff.includes("1st/3rd Sat") && day === 6) {
                    let weekNumber = Math.ceil((currentDate.date() - 1) / 7) + 1;
                    if (weekNumber === 1 || weekNumber === 3) {
                        weekends.push(offDayObject);
                    }
                }
                if (weeklyOff.includes("2nd/4th Sat") && day === 6) {
                    let weekNumber = Math.ceil((currentDate.date() - 1) / 7) + 1;
                    if (weekNumber === 2 || weekNumber === 4) {
                        weekends.push(offDayObject);
                    }
                }
                if (weeklyOff.includes("All Sun Off") && day === 0) {
                    weekends.push(offDayObject);
                }
            }

            currentDate.add(1, "days");
        }

        return weekends;
    } catch (error) {
        console.error("Error fetching employee shift:", error);
        return "Error fetching employee shift.";
    }
}

// async function test (){
//     console.log("Employee pawann a farde Off Days:",await getEmployeeOffDays(119901.0, "2025-03-26", "2025-04-25"));
// }
// test()



function getWeeklyOffDates(startDate, endDate, weeklyOffType) {
    let currentDate = moment(startDate);
    let finalDate = moment(endDate);
    let weekends = [];

    while (currentDate.isSameOrBefore(finalDate, "day")) {
        let day = currentDate.day(); // 0: Sunday, 6: Saturday
        let weekNumber = Math.ceil(currentDate.date() / 7); // Week of the month
        let dateStr = currentDate.format("YYYY-MM-DD");

        let isWeekend = false;

        if (weeklyOffType.includes("Only SunOff") && day === 0) {
            isWeekend = true;
        }

        if (weeklyOffType.includes("All Sat/Sun Off") && (day === 0 || day === 6)) {
            isWeekend = true;
        }

        if (weeklyOffType.includes("1st/3rd Sat") && day === 6 && (weekNumber === 1 || weekNumber === 3)) {
            isWeekend = true;
        }

        if (weeklyOffType.includes("2nd/4th Sat") && day === 6 && (weekNumber === 2 || weekNumber === 4)) {
            isWeekend = true;
        }

        if (weeklyOffType.includes("All Sun Off") && day === 0) {
            isWeekend = true;
        }

        if (isWeekend) {
            weekends.push({
                date: dateStr,
                day: currentDate.format("dddd") // returns full day name like 'Sunday'
            });
        }

        currentDate.add(1, "day");
    }

    return weekends;
}

async function getEmployeeOffDays(uid, startDate, endDate) {
    try {
        let empShift = await EmpShift.findOne({ UID: uid });

        if (!empShift) {
            return [];
        }

        let weeklyOffType = empShift._doc.Weekly_Off;
        let shiftName = empShift._doc.Shift_Name || "";

        let weekendDates = getWeeklyOffDates(startDate, endDate, weeklyOffType);

        let formattedOffDays = weekendDates.map(off => ({
            Log_Date: off.date,
            UID: uid,
            Final_Attendance: "WO",
            Day: off.day,
            Schedule: "WO",
            Calc_Attendance: "WO",
            Shift_Name: shiftName
        }));

        return formattedOffDays;

    } catch (error) {
        console.error("Error getting employee off days:", error);
        return [];
    }
}

// async function test (){
//     console.log("Employee pawann a farde Off Days:",await getEmployeeOffDays(119901.0, "2025-03-26", "2025-04-25"));
// }
// test()
// async function test (){
//     console.log("Employee pawann a farde Off Days:", await getEmployeeOffDays("119595", "2025-04-26", "2025-05-25"));
// }
// test()



module.exports = router;