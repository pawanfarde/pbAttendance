const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const DeviceMaster = require("../models/device_master");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { UID, Divice_Master_Number } = req.body;

        if (!UID || !Divice_Master_Number) {
            return cb(new Error("UID and Divice_Master_Number are required before uploading file"));
        }

        const folderName = `${UID}_${Divice_Master_Number}`;
        const uploadPath = path.join(__dirname, "..", "upload", folderName);

        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `image_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

router.post("/device_master/create", upload.single("Image"), async (req, res) => {
    try {
        let { Device_Name, Divice_Master_Number, UID, Location, Status } = req.body;

        let imagePath = "";
        if (req.file) {
            const folderName = `${UID}_${Divice_Master_Number}`;
            imagePath = `/upload/${folderName}/${req.file.filename}`;
        }

        let newDevice = new DeviceMaster({
            Device_Name,
            Divice_Master_Number,
            UID,
            Location,
            Image: imagePath,
            Status: Status,
            Created_On: moment().toDate(),
            Modified_On: moment().toDate()
        });

        let savedDevice = await newDevice.save();
        res.json({ Status: "SUCCESS", Msg: "Device created successfully!", data: savedDevice });

    } catch (error) {
        console.error("Error creating device:", error);
        res.json({ Status: "FAIL", Msg: "Something went wrong!", Error: error.message });
    }
});

router.post('/postservicecall/auth_tokens/auth_login', function (req, res) {
    req.body = JSON.parse(JSON.stringify(req.body));
    let objRequest = req.body;
    let obj_login = {
        "UserName": objRequest.username,
        "Password": objRequest.password,
        "pwd": objRequest.password,
        "IpAdd": "180.179.132.185"
    };
    let post_args = {
        data: obj_login,
        headers: {
            "Content-Type": "application/json",
            'Username': config.pb_config.api_crn_user,
            'Password': config.pb_config.api_crn_pass
        }
    };
    let Client = require('node-rest-client').Client;
    let client = new Client();
    let objResponse = {};
    client.post(config.pb_config.api_login_url, post_args, function (login_data, login_response) {
        try {
            if (login_data && login_data.Result && login_data.Result === "Success" && login_data.SuppAgentId) {
                objResponse['SS_ID'] = login_data.SuppAgentId || "";
                objResponse['Mobile_No'] = login_data.MobiNumb1 || "";
                objResponse['Email_ID'] = login_data.EmailID || "";
                res.json({"Status": "SUCCESS", "Msg": "RECORD FETCH SUCCESSFULLY", "Data": objResponse});
            } else {
                res.json({"Status": "FAIL", "Msg": login_data});
            }
        } catch (e) {
            res.json({"Status": "FAIL", "Msg": e.stack});
        }
    });
});

module.exports = router;