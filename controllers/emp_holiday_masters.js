var express = require('express');
var router = express.Router();
const EmpHolidayMaster = require('../models/emp_holiday_master');

router.get('/getAllHolidays', async (req, res) => {
    try {
        const holidays = await EmpHolidayMaster.find();
        res.status(200).json({
            Msg: "Holiday list fetched successfully",
            Status: "SUCCESS",
            Data: holidays
        });
    } catch (err) {
        res.status(500).json({
            Msg: "Failed to fetch holiday list",
            Status: "FAIL",
            Error: err.message
        });
    }
});


router.post('/createHolidays', async (req, res) => {
    try {
        const holidayData = new EmpHolidayMaster(req.body);
        const savedHoliday = await holidayData.save();

        res.status(201).json({
            Msg: "Holiday created successfully",
            Status: "SUCCESS",
            Data: savedHoliday
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


module.exports = router;
