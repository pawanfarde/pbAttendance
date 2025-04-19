/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/* global exampleDataTable, CONST_SESSION */

    
var attendance_grid;
var employee_grid;
var employee_list_grid;
var employee_list_array = [];
// let db_id = "";
var uid = 0;
var UID = 120258 || CONST_SESSION.uid
var ss_id = 0;
var curr_emp_data;
$(document).ready(function () {

    // getAttendance();
    // getEmployee();
    // GetEmployeeList();
    GetEmployeeListNew();
    fetchEmployees();

    fetchCycleDates();
    GetExtendedShiftList(UID);

    $("#employeeDropdown").change(function () {
        let selectedId = $(this).val();
        if (selectedId) {
            getAttendance(selectedId);
        }
    });

    if (window.location.pathname.includes("attendence_self")) {
        getAttendance();
    }
});
var Employee_List = {};
function populateMonthDropdown() {
    var currentDate = new Date();

    var currentMonth = currentDate.toLocaleString('default', { month: 'short' }) + "-" + currentDate.getFullYear();

    currentDate.setMonth(currentDate.getMonth() - 1);
    var lastMonth = currentDate.toLocaleString('default', { month: 'short' }) + "-" + currentDate.getFullYear();

    var $dropdown = $("#Col_Name_month");

    if ($dropdown.children("option").length <= 1) {
        $dropdown.empty().append(`
            <option value="">Select-Month</option>
            <option value="${lastMonth}">${lastMonth}</option>
            <option value="${currentMonth}">${currentMonth}</option>
        `);
    }

    $dropdown.selectpicker('refresh');
}


function getAttendance(type, selectedStartDate, selectedEndDate) {
    var const_list_coln = [
        { "data": "UID", "width": "10%" },
        { "data": "Log_Date", "width": "10%" },
        { "data": "Day", "width": "10%" },
        { "data": "Shift_Name", "width": "10%" },
        { "data": "Schedule", "width": "10%" },
        { "data": "Swipe_In", "width": "10%" },
        { "data": "Swipe_Out", "width": "10%" },
        { "data": "Calc_In", "width": "10%" },
        { "data": "Calc_Out", "width": "10%" },
        { "data": "Req_Min", "width": "10%" },
        { "data": "Calc_Min", "width": "10%" },
        { "data": "Diff", "width": "10%" },
        { "data": "Calc_Attendance", "width": "10%" },
        { "data": "Final_Attendance", "width": "10%" }
    ];

    var list_column = [];
    attendance_array = [];

    if ($.fn.DataTable.isDataTable('.attendance_list_grid')) {
        $('.attendance_list_grid').DataTable().destroy();
        $('.attendance_list_grid tbody').empty();
    }

    $('#attendance_row_key_head, #attendance_row_key_foot').empty();
    for (var k in const_list_coln) {
        $('#attendance_row_key_head, #attendance_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;

    function getCurrentCycleDates(date) {
        var inputDate = moment(date);
        var startDate, endDate;

        if (inputDate.date() >= 26) {
            startDate = inputDate.clone().date(26);
            endDate = inputDate.clone().add(1, 'months').date(25);
        } else {
            startDate = inputDate.clone().subtract(1, 'months').date(26);
            endDate = inputDate.clone().date(25);
        }
        return { startDate: startDate.format("YYYY-MM-DD"), endDate: endDate.format("YYYY-MM-DD") };
    }

    var today = moment();
    var { startDate, endDate } = selectedStartDate && selectedEndDate
        ? { startDate: selectedStartDate, endDate: selectedEndDate }
        : getCurrentCycleDates(today);

    var filter = {
        'UID':120258 || CONST_SESSION.session_id,
        'startDate': startDate,
        'endDate': endDate,
    };

    if (type) {
        filter['UID'] = type;
    } else {
        filter['UID'] = 120258 || CONST_SESSION.uid;
    }

    var call_url = GetUrl() + "/attendance/get_attendance";

    attendance_grid = $('.attendance_list_grid').DataTable({
        processing: true,
        serverSide: true,
        scrollX: true,
        scrollY: true,
        searching: false,
        responsive: true,
        order: [[1, "desc"]],
        pageLength: 30,

        "ajax": {
            type: "POST",
            url: call_url,
            data: filter,
            dataFilter: function (data) {
                var json1 = jQuery.parseJSON(data);
                json1.recordsTotal = json1.total || 0;
                json1.recordsFiltered = json1.total || 0;

                var objResponse = [];
                var today = moment().format("YYYY-MM-DD");
                json1.docs.forEach(doc => {
                    var logDate = doc.Log_Date ? doc.Log_Date.split("T")[0] : '';

                    if (logDate <= today) {
                        var collist = {
                            UID: doc.UID || '',
                            Log_Date: logDate,
                            Day: doc.Day || '',
                            Shift_Name: doc.Shift_Name || '',
                            Schedule: doc.Schedule || '',
                            Swipe_In: doc.Swipe_In || '',
                            Swipe_Out: doc.Swipe_Out || '',
                            Calc_In: doc.Calc_In || '',
                            Calc_Out: doc.Calc_Out || '',
                            Req_Min: doc.Req_Min || '',
                            Calc_Min: doc.Calc_Min || '',
                            Diff: doc.Diff || '',
                            Calc_Attendance: doc.Calc_Attendance || '',
                            Final_Attendance: doc.Final_Attendance || ''
                        };
                        objResponse.push(collist);
                        attendance_array.push(doc);
                    }
                });
                // work shedule
                if (!type) {
                    let scheduleTableBody = document.getElementById("scheduleTable");
                    let summaryTableBody = document.getElementById("summaryTable");

                    scheduleTableBody.innerHTML = "";
                    summaryTableBody.innerHTML = "";

                    json1.offDays.forEach(item => {
                        scheduleTableBody.innerHTML += `<tr>
                            <td>${item.Log_Date}</td>
                            <td>${item.Day}</td>
                            <td>${item.Schedule}</td>
                        </tr>`;
                    });

                    let summaryRow = `<tr>
                        <td>${json1.summary.Total_Days}</td>
                        <td>${json1.summary.No_Schedule}</td>
                        <td>${json1.summary.Full_Day}</td>
                        <td>${json1.summary.WO}</td>
                        <td>${json1.summary.Holiday}</td>
                        <td>${json1.summary.Leave}</td>
                        <td>${json1.summary.Half_Day}</td>
                        <td>${json1.summary.Absent}</td>
                        <td>${json1.summary.Payable_Days}</td>
                    </tr>`;

                    summaryTableBody.innerHTML += summaryRow;
                }

                json1.data = objResponse;
                return JSON.stringify(json1);
            }
        },
        "columns": list_column,
        "order": [[1, "desc"]],
        "pageLength": 30,
        "rowCallback": function (row, data) { },

        "initComplete": function () {
            $('#DataTables_Table_0_filter input[type=search]').on('input', function () {
                if (this.value.length === 6) {
                    console.log('Search Key Matched:', this.value);
                } else {
                    console.log('Search Key Ignored:', this.value);
                }
            });
        }
    });
}

function btnSearchAttendance() {
    getAttendance('');
}

function Reset_Attendance_Search() {
    $("#Col_Name").val('default').selectpicker("refresh");
    $("#txtCol_Val").val("");
    getAttendance();
}

function getEmployee(type) {
    var const_list_coln_emp = [
        { "data": "name", "width": "20%" },
        { "data": "pid", "width": "20%" }
    ];

    var list_column_emp = [];
    employee_array = [];

    if ($.fn.DataTable.isDataTable('.employee_list_grid')) {
        $('.employee_list_grid').DataTable().destroy();
        $('.employee_list_grid tbody').empty();
    }

    $('#employee_row_key_head, #employee_row_key_foot').empty()
    for (var k in const_list_coln_emp) {
        $('#employee_row_key_head, #employee_row_key_foot').append('<th>' + const_list_coln_emp[k]['data'] + '</th>');
    }

    list_column_emp = const_list_coln_emp;

    var filter = {};

    // if (type === '') {
    //     if ($('#Col_Name').val() && $('#Col_Name').val() === 'UID' && $('#txtCol_Val').val() !== '') {
    //         filter['UID'] = $('#txtCol_Val').val() || CONST_SESSION.uid;
    //     }else{
    //         filter['UID'] = CONST_SESSION.uid
    //     }
    // } else{
    //     filter['UID'] = CONST_SESSION.uid
    // }

    // var call_url = GetUrl() + "/postservicecall/employee_list";
    var call_url = "https://horizon.policyboss.com:5443/employees/tree/119594"

    employee_grid = $('.employee_list_grid').DataTable({
        processing: true,
        serverSide: true,
        scrollX: true,
        scrollY: true,
        searching: true,
        responsive: true,
        order: [[1, "desc"]],
        pageLength: 10,

        "ajax": {
            type: "GET",
            url: call_url,
            data: filter,
            dataFilter: function (data) {
                var json1 = jQuery.parseJSON(data);
                json1.recordsTotal = json1.total || 0;
                json1.recordsFiltered = json1.total || 0;

                var objResponse = [];
                json1.forEach(doc => {
                    var collist = {
                        name: doc.name || '',
                        pid: doc.pid || '',
                    };
                    objResponse.push(collist);
                    employee_array.push(doc);
                });

                json1.data = objResponse;
                return JSON.stringify(json1);
            }
        },
        "columns": list_column_emp,
        "order": [[1, "desc"]],
        "pageLength": 10,
        "rowCallback": function (row, data) {
        },

        "initComplete": function () {
            $('#DataTables_Table_0_filter input[type=search]').on('input', function () {
                if (this.value.length === 6) {
                    console.log('Search Key Matched:', this.value);
                } else {
                    console.log('Search Key Ignored:', this.value);
                }
            });
        }
    });
}


function GetEmployeeListNew() {
    $('#waitloader').show();

    var call_url ="https://horizon.policyboss.com:5443/employees/tree/107602" //  GetUrl() + "/employees/tree/" + UID;

    $.ajax({
        url: call_url,
        type: "GET",
        contentType: "application/json",
        data: "",
        success: function (res) {
            $('#waitloader').hide();

            Employee_List = {
                "data": res,
                "Summary": {}
            };

            if ($.fn.DataTable.isDataTable(".employee_list_grid")) {
                $('.employee_list_grid').DataTable().destroy();
                $('.employee_list_grid tbody').empty();
            }

            var const_employee_list_coln = [
                { "data": "Employee_Name" },
                { "data": "UID" },
                { "data": "Designation" }
            ];

            $('.employee_list_grid thead, .employee_list_grid tfoot').html('<tr></tr>');
            for (var col of const_employee_list_coln) {
                $('.employee_list_grid thead tr, .employee_list_grid tfoot tr').append("<th>" + col['data'] + "</th>");
            }


            for (var Employee_Single_Data of Employee_List['data']) {
                $('.employee_list_grid tbody').append('<tr>' +
                    '<td>' + Employee_Single_Data["name"] + '</td>' +
                    '<td>' + Employee_Single_Data["id"] + '</td>' +
                    '<td>' + Employee_Single_Data["title"] + '</td>' +
                    '</tr>');
            }

            $(".employee_list_grid").DataTable({
                "order": [[1, "desc"]],
                "pageLength": 10,
                responsive: true
            });

        },
        error: function (err) {
            console.error("Error fetching attendance data", err);
            $('#waitloader').hide();
        }
    });
}


function fetchEmployees() {
    $.ajax({
        // https://horizon.policyboss.com:5443/employees/tree/:UID
        url: "https://horizon.policyboss.com:5443/employees/tree/107602",    //GetUrl() + "/employees/tree/" + UID,
        type: "GET",
        dataType: "json",
        success: function (data) {
            console.log("API Response:", data);

            let dropdown = $("#employeeDropdown");
            dropdown.empty().append('<option value="">--- Select Employee ---</option>');

            if (Array.isArray(data)) {
                $.each(data, function (index, emp) {
                    dropdown.append($('<option>', {
                        value: emp.id,
                        text: emp.name
                    }));
                });
                dropdown.selectpicker('refresh');
                // 	dropdown.selectpicker('destroy').selectpicker({
                // 		liveSearch: true,
                // 		size: 5
                // 	}).selectpicker('refresh');
                // } else {
                console.error("API Response is not an array:", data);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error fetching employees:", error);
        }
    });
}


// extended page code 



function fetchCycleDates() {
    $.ajax({
        url: GetUrl() + "/attendance/get_cycle_dates",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ date: moment().format("YYYY-MM-DD") }),
        success: function (response) {
            if (response.Status === "SUCCESS") {
                console.log("date Response:", response.Dates);

                let data = response.Dates;
                let dropdown = $("#dateDropdown");

                dropdown.empty().append('<option value="">Select Shift Date</option>');

                $.each(data, function (index, date) {
                    dropdown.append(`<option value="${date}">${date}</option>`);
                });
                dropdown.selectpicker('refresh');

            } else {
                console.error("Error fetching cycle dates:", response.Msg);
            }
        },
        error: function (xhr, status, error) {
            console.error("Fetch error:", error);
        }
    });
}

function GetExtendedShiftList(uid) {
    $('#waitloader').show();

    var call_url = GetUrl() + "/attendance/get_extended_shift";

    fetch(call_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "UID": uid })
    })
    .then(response => response.json())
    .then(res => {
        $('#waitloader').hide();

        if (res.Status !== "SUCCESS") {
            console.error("Error fetching extended shift data:", res.Msg);
            return;
        }

        let Extended_Shift_List = res.data.docs;

        if ($.fn.DataTable.isDataTable(".extended_shift_req_list_grid")) {
            $('.extended_shift_req_list_grid').DataTable().destroy();
            $('.extended_shift_req_list_grid tbody').empty();
        }

        var shift_table_columns = [
            { "data": "Extended_Shift_Id", "title": "Shift ID" },
            { "data": "Extended_Shift_Date", "title": "Shift Date" },
            { "data": "Extended_Shift_Day", "title": "Day" },
            { "data": "Shift_Name", "title": "Shift Name" },
            { "data": "Created_On", "title": "Applied On" }
        ];

        $('.extended_shift_req_list_grid thead, .extended_shift_req_list_grid tfoot').html('<tr></tr>');
        for (var col of shift_table_columns) {
            $('.extended_shift_req_list_grid thead tr, .extended_shift_req_list_grid tfoot tr').append("<th>" + col.title + "</th>");
        }

        for (var shift of Extended_Shift_List) {
            $('.extended_shift_req_list_grid tbody').append('<tr>' +
                '<td>' + shift.Extended_Shift_Id + '</td>' +
                '<td>' + moment(shift.Extended_Shift_Date).format("YYYY-MM-DD") + '</td>' + 
                '<td>' + shift.Extended_Shift_Day + '</td>' +
                '<td>' + shift.Shift_Name + '</td>' +
                '<td>' + moment(shift.Created_On).format("YYYY-MM-DD HH:mm:ss") + '</td>' +
                '</tr>');
        }

        $(".extended_shift_req_list_grid").DataTable({
            "order": [[1, "desc"]],
            "pageLength": 10,
            responsive: true
        });

    })
    .catch(error => {
        console.error("Error fetching extended shift data", error);
        $('#waitloader').hide();
    });
}


function applyExtendedShift(event) {
    if (event) event.preventDefault(); 

    var call_url = GetUrl() + "/attendance/apply_extended_shift";
    let date = $("#dateDropdown").val()
    fetch(call_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "uid": UID, "date": date })
    })
    .then(response => response.json())
    .then(res => {
        if (res.Status === "FAIL") {
            swal(res.Msg,'','error');
        }else{
            swal(res.Msg,'','success');
            GetExtendedShiftList(UID)
        }
    })
    .catch(error => {
        console.error("Error:", error);
    })
   
}









function GetUrl() {
    var url = window.location.href;
    var newurl;
    if (url.includes("local")) {
        newurl = "http://localhost:8000";
    } else if (url.includes("qa")) {
        if (url.includes("https")) {
            newurl = "https://qa-horizon.policyboss.com:3443";
        } else {
            newurl = "http://qa-horizon.policyboss.com:3000";
        }
    } else if (url.includes("https")) {
        newurl = "https://horizon.policyboss.com:5443";
    } else if (url.includes("www") || url.includes("cloudfront") || url.includes("horizon")) {
        newurl = "http://horizon.policyboss.com:5000";
    } else {
        newurl = "http://horizon.policyboss.com:5000";
    }
    return newurl;
}

