var regularization_approval_grid;
var regularization_grid;
$(document).ready(function () {
    getRegReqPending()
    getRegReqApprovedReject()
    fetchCycleDates(); //dropdown date

    RegularizationApprovedReject()
})


function getRegReqPending() {
    var const_list_coln = [
        { "data": "Entry_Time", "width": "10%" },
        { "data": "AR_Date", "width": "10%" },
        { "data": "Direction", "width": "10%" },
        { "data": "AR_Time", "width": "10%" },
        { "data": "AR_Reason", "width": "10%" },
        { "data": "Approval_Status", "width": "10%" },
    ];

    var list_column = [];
    reg_req_pending_array = [];

    if ($.fn.DataTable.isDataTable('.reg_req_pending_list_grid')) {
        $('.reg_req_pending_list_grid').DataTable().destroy();
        $('.reg_req_pending_list_grid tbody').empty();
    }

    $('#reg_req_pending_row_key_head, #reg_req_pending_key_foot').empty();
    for (var k in const_list_coln) {
        $('#reg_req_pending_row_key_head, #reg_req_pending_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;

    var filter = {
        'UID': 120258 || CONST_SESSION.session_id,
        'status': 'Pending'
    };

    var call_url = GetUrl() + "/att_reg/get_regularize_req";

    leave_req_pending_grid = $('.reg_req_pending_list_grid').DataTable({
        processing: true,
        serverSide: true,
        scrollX: true,
        scrollY: true,
        searching: false,
        responsive: true,
        order: [[1, "desc"]],
        pageLength: 4,

        "ajax": {
            type: "POST",
            url: call_url,
            data: filter,
            dataFilter: function (data) {
                var json1 = jQuery.parseJSON(data);
                json1.recordsTotal = json1.total || 0;
                json1.recordsFiltered = json1.total || 0;

                var objResponse = [];
                json1.Data.docs.forEach(doc => {
                    var collist = {
                        Entry_Time: moment.utc(doc.Created_On).format("DD-MM-YYYY") || '',
                        AR_Date: moment.utc(doc.Date).format("DD-MM-YYYY") || '',
                        Direction: doc.Direction || '',
                        AR_Time: doc.Time || '',
                        AR_Reason: doc.Reson || '',
                        Approval_Status: doc.Reg_Req_Status || '',
                    };
                    objResponse.push(collist);
                    reg_req_pending_array.push(doc);

                });


                json1.data = objResponse;
                return JSON.stringify(json1);
            }
        },
        "columns": list_column,
        "order": [[1, "desc"]],
        "pageLength": 4,
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

function getRegReqApprovedReject() {
    var const_list_coln = [
        { "data": "Entry_Time", "width": "10%" },
        { "data": "AR_Date", "width": "10%" },
        { "data": "Direction", "width": "10%" },
        { "data": "AR_Time", "width": "10%" },
        { "data": "AR_Reason", "width": "10%" },
        { "data": "Approval_Status", "width": "10%" },
    ];

    var list_column = [];
    reg_req_array = [];

    if ($.fn.DataTable.isDataTable('.reg_req_list_grid')) {
        $('.reg_req_list_grid').DataTable().destroy();
        $('.reg_req_list_grid tbody').empty();
    }

    $('#reg_req_row_key_head, #reg_req_key_foot').empty();
    for (var k in const_list_coln) {
        $('#reg_req_row_key_head, #reg_req_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;

    var filter = {
        'UID': 120258 || CONST_SESSION.session_id,
        'excludePending': true
    };

    var call_url = GetUrl() + "/att_reg/get_regularize_req";

    regularization_grid = $('.reg_req_list_grid').DataTable({
        processing: true,
        serverSide: true,
        scrollX: true,
        scrollY: true,
        searching: false,
        responsive: true,
        order: [[1, "desc"]],
        pageLength: 4,

        "ajax": {
            type: "POST",
            url: call_url,
            data: filter,
            dataFilter: function (data) {
                var json1 = jQuery.parseJSON(data);
                json1.recordsTotal = json1.total || 0;
                json1.recordsFiltered = json1.total || 0;

                var objResponse = [];
                json1.Data.docs.forEach(doc => {
                    var collist = {
                        Entry_Time: moment.utc(doc.Created_On).format("DD-MM-YYYY") || '',
                        AR_Date: moment.utc(doc.Date).format("DD-MM-YYYY") || '',
                        Direction: doc.Direction || '',
                        AR_Time: doc.Time || '',
                        AR_Reason: doc.Reson || '',
                        Approval_Status: doc.Reg_Req_Status || '',
                    };
                    objResponse.push(collist);
                    reg_req_pending_array.push(doc);

                });


                json1.data = objResponse;
                return JSON.stringify(json1);
            }
        },
        "columns": list_column,
        "order": [[1, "desc"]],
        "pageLength": 4,
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

function applyRegReq() {
    const uid = 120258;
    const Date = $('#dateDropdown').val();
    const Time = $('#reg-Time').val();
    const Reson = $('#reg-Reason').val();
    const Direction = $('#Direction').val();

    // if (!Leave_Type || !Leave_From_Date || !Leave_To_Date || !Reason) {
    // swal('Please fill all required fields.','','success');  
    //   return;
    // }

    let isValid = true;
    if (!Date) {
        $("#date-dropdown-error").text("Please select date.");
        $("#dateDropdown").addClass("has-error");
        isValid = false;
    } else {
        $("#date-dropdown-error").text("")
    }
    if (!Time) {
        $("#time-error").text("Please select time.");
        $("#reg-Time").addClass("has-error");
        isValid = false;
    } else {
        $("#time-error").text("");
    }
    if (!Reson) {
        $("#reg-reason-error").text("Please feel the reason.");
        $("#reg-Reason").addClass("has-error");
        isValid = false;
    } else {
        $("#reg-reason-error").text("");
    }
    if (!Direction) {
        $("#direction-error").text("Please select direction.");
        $("#Direction").addClass("has-error");
        isValid = false;
    } else {
        $("#direction-error").text("");
    }

    if (!isValid) {
        return;
    }

    const payload = {
        uid,
        Date,
        Time,
        Reson,
        Direction
    };
    fetch("http://localhost:8000/att_reg/add_regularize_req", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(res => {
            if (res.Status === "FAIL") {
                swal(res.Msg, '', 'error');
                $('#dateDropdown,#reg-Time,#reg-Reason,#Direction').val('').removeClass('has-error');
                $('#date-dropdown-error,#time-error,#reg-reason-error,#direction-error').text('');
                $('#dateDropdown,#reg-Time,#reg-Time,#reg-Reason,#Direction').val('').selectpicker('refresh');
            } else {
                $('#dateDropdown,#reg-Time,#reg-Reason,#Direction').val('').removeClass('has-error');
                $('#date-dropdown-error,#time-error,#reg-reason-error,#direction-error').text('');
                $('#dateDropdown,#reg-Time,#reg-Time,#reg-Reason,#Direction').val('').selectpicker('refresh');
                swal(res.Msg, '', 'success').then(() => {
                    window.location.reload();
                });
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}


function RegularizationApprovedReject() {
    var const_list_coln = [
        { "data": "Approve_Reject", "width": "10%" },
        // { "data": "Regularization_ID", "width": "10%" },
        { "data": "UIDNo", "width": "10%" },
        { "data": "Entry_Time", "width": "10%" },
        { "data": "AR_Date", "width": "10%" },
        { "data": "Employee_Name", "width": "10%" },
        { "data": "Direction", "width": "10%" },
        { "data": "AR_Time", "width": "10%" },
        { "data": "Current_In", "width": "10%" },
        { "data": "Current_Out", "width": "10%" },
        { "data": "Reason", "width": "10%" }
    ];

    var list_column = [];
    regularization_approval_array = [];

    if ($.fn.DataTable.isDataTable('.regularization_approval_list_grid')) {
        $('.regularization_approval_list_grid').DataTable().destroy();
        $('.regularization_approval_list_grid tbody').empty();
    }

    $('#regularization_approval_row_key_head, #regularization_approval_key_foot').empty();
    for (var k in const_list_coln) {
        $('#regularization_approval_row_key_head, #regularization_approval_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;

    var filter = {
        'rm_UID': 8067 || CONST_SESSION.session_id,
        'status': 'Pending'
    };

    var call_url = GetUrl() + "/att_reg/get_regularize_req";

    regularization_approval_grid = $('.regularization_approval_list_grid').DataTable({
        processing: true,
        serverSide: true,
        scrollX: true,
        scrollY: true,
        searching: false,
        responsive: true,
        order: [[1, "desc"]],
        pageLength: 4,

        "ajax": {
            type: "POST",
            url: call_url,
            data: filter,
            dataFilter: function (data) {
                var json1 = jQuery.parseJSON(data);
                json1.recordsTotal = json1.total || 0;
                json1.recordsFiltered = json1.total || 0;

                var objResponse = [];
                json1.Data.docs.forEach(doc => {
                    var collist = {
                        Approve_Reject: `<button class="btn btn-sm btn-info" onclick="openRegularizeApprovalModal('${doc.id}')">Approve / Reject</button>`,
                        // Regularization_ID: doc.Regularization_ID || '',
                        UIDNo: doc.UID || '',
                        Entry_Time: moment.utc(doc.Created_On).format("DD-MM-YYYY") || '',
                        AR_Date: moment.utc(doc.Date).format("DD-MM-YYYY") || '',
                        Direction: doc.Direction || '',
                        AR_Time: doc.Time || '',
                        Reason: doc.Reson || '',
                        Employee_Name: '',
                        Current_In: doc.Current_In || '',
                        Current_Out: doc.Current_Out || ''
                    };
                    objResponse.push(collist);
                    regularization_approval_array.push(doc);

                });


                json1.data = objResponse;
                return JSON.stringify(json1);
            }
        },
        "columns": list_column,
        "order": [[1, "desc"]],
        "pageLength": 4,
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



// fetchCycleDates for Apply Attendance Regularization Request dates

function fetchCycleDates() {
    $.ajax({
        url: GetUrl() + "/att_reg/get_cycle_dates",
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

function openRegularizeApprovalModal(id) {
    fetch('http://localhost:8000/att_reg/get_reg_request_by_id', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id })
    })
        .then(res => res.json())
        .then(data => {
            if (data.Status === "SUCCESS") {
                const doc = data.Data;

                $('#modal-emp-name').text(doc.Employee_Name || 'Pawann A Farde');
                $('#modal-ar-date').text(moment.utc(doc.Date).format("DD-MM-YYYY") || '');
                $('#modal-direction').text(doc.Direction || '');
                $('#modal-ar-time').text(doc.Time || '');
                $('#modal-ar-reason').text(doc.Reson || '');

                // Save current Id globally for use in submit
                window.selectedRegularizeReqId = doc._id;
                $("#reg-approve-status-error").text("");
                $('#reg-approve-status,#reg-remarks').val('').selectpicker('refresh');
                $('#reg-req-model').modal('show');
            } else {
                alert("Failed to fetch leave request.");
            }
        })
        .catch(err => {
            console.error("Error fetching Regularize req:", err);
        });
}

function submitRegDecision() {
    const Status = $('#reg-approve-status').val();
    const Remark = $('#reg-remarks').val();
    const Id = window.selectedRegularizeReqId;

    let isValid = true;
    if (!Status) {
        $("#reg-approve-status-error").text("Please select status.");
        $("#reg-remarks").addClass("has-error");
        isValid = false;
    }
    if (!isValid) {
        return;
    }
    const payload = {
        Id,
        Status,
        // Remark
    };
    fetch("http://localhost:8000/att_reg/update-status", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(res => {
            if (res.Status === "FAIL") {
                swal(res.Msg, '', 'error');
            } else {
                $('#reg-remarks,#reg-approve-status').val('').removeClass('has-error');
                $('#reg-approve-status-error').text('');
                $('#reg-approve-status,#reg-remarks').val('').selectpicker('refresh');
                swal(res.Msg, '', 'success').then(() => {
                    $('#reg-req-model').modal('hide');
                    window.location.reload();
                });
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });

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