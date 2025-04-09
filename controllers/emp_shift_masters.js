// controllers/empShiftController.js
var express = require("express");
var router = express.Router();
const EmpShift = require("../models/emp_shift_master");

router.post('/add-shift', async (req, res) => {
  try {
    const shiftData = new EmpShift(req.body);
    const saved = await shiftData.save();
    return res.status(201).json({ Msg: "Shift assigned successfully", Status: "SUCCESS", Data: saved });
  } catch (err) {
    res.status(500).json({ Msg: "Error saving shift", Status: "FAIL", Error: err.message });
  }
});

router.get('/getEmpShift', async (req, res) => {
  try {
      const holidays = await EmpShift.find();
      res.status(200).json({
          Msg: "fetched successfully",
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


module.exports = router;
