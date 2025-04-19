var leave_req_pending_grid;
var leave_req_grid;
var leave_approval_grid;
var UID = 120258 || CONST_SESSION.uid
$(document).ready(function () {
    getLeaveReqPending();
    getLeaveReq();
    LeaveApprovedReject()

     $('#toDate').prop('disabled', true);
  
     $('#fromDate').on('change', function () {
       const fromDateVal = $(this).val();
   
       if (fromDateVal) {
         $('#toDate').prop('disabled', false);
         $('#toDate').val('');
         $('#toDate').attr('min', fromDateVal);
       } else {
         // If from date is cleared again, disable to date
         $('#toDate').val('');
         $('#toDate').prop('disabled', true);
         $('#toDate').removeAttr('min');
       }
     });
});



  


function getLeaveReqPending() {
    var const_list_coln = [
        { "data": "Leave_ID", "width": "10%" },
        { "data": "Leave_Type", "width": "10%" },
        { "data": "Entry_Time", "width": "10%" },
        { "data": "Leave_From_Date", "width": "10%" },
        { "data": "Leave_To_Date", "width": "10%" },
        { "data": "Leave_Count", "width": "10%" },
        { "data": "Reason", "width": "10%" },
    ];

    var list_column = [];
    leave_req_pending_array = [];

    if ($.fn.DataTable.isDataTable('.leave_req_pending_list_grid')) {
        $('.leave_req_pending_list_grid').DataTable().destroy();
        $('.leave_req_pending_list_grid tbody').empty();
    }

    $('#leave_req_pending_row_key_head, #leave_req_pending_key_foot').empty();
    for (var k in const_list_coln) {
        $('#leave_req_pending_row_key_head, #leave_req_pending_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;
   
    var filter = {
        'UID':120258 || CONST_SESSION.session_id,
        'status':'Pending'
    };

    var call_url = GetUrl() + "/emp_leave_req/get_emp_leave_request";

    leave_req_pending_grid = $('.leave_req_pending_list_grid').DataTable({
        processing: true,
        serverSide: true,
        scrollX: true,
        scrollY: true,
        searching: false,
        responsive: true,
        order: [[1, "desc"]],
        pageLength: 10,

        "ajax": {
            type: "POST",
            url: call_url,
            data: filter,
            dataFilter: function (data) {
                var json1 = jQuery.parseJSON(data);
                json1.recordsTotal = json1.Data.totalDocs || 0;
                json1.recordsFiltered = json1.Data.totalDocs || 0;

                var objResponse = [];
                json1.Data.docs.forEach(doc => {
                        var collist = {
                            Leave_ID: doc.Leave_ID || '',
                            Leave_Type: doc.Leave_Type || '',
                            Entry_Time: moment.utc(doc.Created_On).format("DD-MM-YYYY") || '',
                            Leave_From_Date: moment.utc(doc.Leave_From_Date).format("DD-MM-YYYY") || '',
                            Leave_To_Date:moment.utc(doc.Leave_To_Date).format("DD-MM-YYYY")|| '',
                            Leave_Count: doc.Leave_Count || '',
                            Reason: doc.Reason || ''
                        };
                        objResponse.push(collist);
                        leave_req_pending_array.push(doc);
                
                });
             

                json1.data = objResponse;
                return JSON.stringify(json1);
            }
        },
        "columns": list_column,
        "order": [[1, "desc"]],
        "pageLength": 10,
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




function getLeaveReq() {
    var const_list_coln = [
        { "data": "Leave_ID", "width": "10%" },
        { "data": "Leave_Type", "width": "10%" },
        { "data": "Entry_Time", "width": "10%" },
        { "data": "Leave_From_Date", "width": "10%" },
        { "data": "Leave_To_Date", "width": "10%" },
        { "data": "Leave_Count", "width": "10%" },
        { "data": "Reason", "width": "10%" },
        { "data": "Supervisor_UID", "width": "10%" },
        { "data": "Approval_Time", "width": "10%" },
        { "data": "Approval_Status", "width": "10%" },
        { "data": "Supervisor_Remarks", "width": "10%" },
    ];

    var list_column = [];
    leave_req_array = [];

    if ($.fn.DataTable.isDataTable('.leave_req_list_grid')) {
        $('.leave_req_list_grid').DataTable().destroy();
        $('.leave_req_list_grid tbody').empty();
    }

    $('#leave_req_row_key_head, #leave_req_key_foot').empty();
    for (var k in const_list_coln) {
        $('#leave_req_row_key_head, #leave_req_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;
   
    var filter = {
        'UID':120258 || CONST_SESSION.session_id,
        "excludePending":true,
    };


    var call_url = GetUrl() + "/emp_leave_req/get_emp_leave_request";

    leave_req_pending_grid = $('.leave_req_list_grid').DataTable({
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
                            Leave_ID: doc.Leave_ID || '',
                            Leave_Type: doc.Leave_Type,
                            Entry_Time: moment.utc(doc.Created_On).format("DD-MM-YYYY") || '',
                            Leave_From_Date: moment.utc(doc.Leave_From_Date).format("DD-MM-YYYY") || '',
                            Leave_To_Date: moment.utc(doc.Leave_To_Date).format("DD-MM-YYYY") || '',
                            Leave_Count: doc.Leave_Count || '',
                            Reason: doc.Reason || '',
                            Supervisor_UID: doc.Supervisor_UID || '',
                            Approval_Time: moment.utc(doc.Modified_On).format("DD-MM-YYYY") || '',
                            Approval_Status: doc.Approval_Status || '',
                            Supervisor_Remarks: doc.Supervisor_Remarks || ''
                        };
                        objResponse.push(collist);
                        leave_req_array.push(doc);
                
                });
             
                    let summaryTableBody = document.getElementById("leavebalanceTable");

                    summaryTableBody.innerHTML = ""

                    let summaryRow = `<tr>
                        <td>${json1.empLeaveCount.Total_Leave_Balance}</td>
                        <td>${json1.empLeaveCount.Leave_Approved}</td>
                        <td>${json1.empLeaveCount.Leave_Approval_Pending}</td>
                        <td>${json1.empLeaveCount.Current_Leave_Balance}</td>
                    </tr>`;

                    summaryTableBody.innerHTML += summaryRow;
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


function applyLeave() {
    const UID = 120258;
    const Leave_Type = $('#Leave_Type').val();
    const Leave_From_Date = $('#fromDate').val();
    const Leave_To_Date = $('#toDate').val();
    const Reason = $('#Reason').val();

    // if (!Leave_Type || !Leave_From_Date || !Leave_To_Date || !Reason) {
    // swal('Please fill all required fields.','','success');  
    //   return;
    // }

    let isValid = true;
    if(!Leave_From_Date){
        $("#from-date-error").text("Please select from date.");
        $("#fromDate").addClass("has-error");
        isValid = false;
    } else{
        $("#from-date-error").text("");
    }
    if(!Leave_To_Date){
        $("#to-date-error").text("Please select to date.");
        $("#toDate").addClass("has-error");
        isValid = false;
    } else{
        $("#to-date-error").text("");
    }
    if(!Leave_Type){
        $("#leave-type-error").text("Please select leave type");
        $("#Leave_Type").addClass("has-error");
        isValid = false;
    } else{
        $("#leave-type-error").text("");
    }
    if(!Reason){
        $("#reason-error").text("Please feel the reason");
        $("#Reason").addClass("has-error");
        isValid = false;
    } else{
        $("#reason-error").text("");
    }

    if (!isValid) {
        return;
    }

    const payload = {
      UID,
      Leave_Type,
      Leave_From_Date,
      Leave_To_Date,
      Reason
    };
    fetch("http://localhost:8000/emp_leave_req/add_emp_leave_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(res => {  
        if (res.Status === "FAIL"){
            swal(res.Msg,'','error');
        }else{
            $('#Reason,#Leave_Type,#toDate,#fromDate').val('').removeClass('has-error');
            $('#from-date-error,#to-date-error,#leave-type-error,#reason-error,#reason-error').text('');
            $('#leaveForm')[0].reset();
            swal(res.Msg, '', 'success').then(() => {
                window.location.reload();
            });
        }
    })
    .catch(error => {
      console.error("Error:", error);
    });
  }


  function LeaveApprovedReject() {
    var const_list_coln = [
        { "data": "Approve_Reject", "width": "10%" },
        { "data": "Leave_ID", "width": "10%" },
        { "data": "UIDNo", "width": "10%" },
        { "data": "Leave_Type", "width": "10%" },
        { "data": "Days", "width": "10%" },
        { "data": "Entry_Time", "width": "10%" },
        { "data": "Leave_From_Date", "width": "10%" },
        { "data": "Leave_To_Date", "width": "10%" },
        { "data": "Employee_Name", "width": "10%" },
        { "data": "Reason", "width": "10%"}
    ];

    var list_column = [];
    leave_approval_array = [];

    if ($.fn.DataTable.isDataTable('.leave_approval_list_grid')) {
        $('.leave_approval_list_grid').DataTable().destroy();
        $('.leave_approval_list_grid tbody').empty();
    }

    $('#leave_approval_row_key_head, #leave_approval_key_foot').empty();
    for (var k in const_list_coln) {
        $('#leave_approval_row_key_head, #leave_approval_row_key_foot').append('<th>' + const_list_coln[k]['data'] + '</th>');
    }

    list_column = const_list_coln;
   
    var filter = {
        'rm_UID':8067 || CONST_SESSION.session_id,
        'status':'Pending'
    };

    var call_url = GetUrl() + "/emp_leave_req/get_emp_leave_request_for_manager";

    leave_approval_grid = $('.leave_approval_list_grid').DataTable({
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
                            Approve_Reject: `<button class="btn btn-sm btn-info" onclick="openLeaveApprovalModal(${doc.Leave_ID})">Approve / Reject</button>`,
                            Leave_ID: doc.Leave_ID || '',
                            UIDNo: doc.UID || '',
                            Leave_Type: doc.Leave_Type || '',
                            Days: doc.Leave_Count || '',
                            Entry_Time:moment.utc(doc.Created_On).format("DD-MM-YYYY")|| '',
                            Leave_From_Date: moment.utc(doc.Leave_From_Date).format("DD-MM-YYYY") || '',
                            Leave_To_Date: moment.utc(doc.Leave_To_Date).format("DD-MM-YYYY") || '',
                            Employee_Name : '',
                            Reason : doc.Reason
                            
                        };
                        objResponse.push(collist);
                        leave_req_pending_array.push(doc);
                
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

function openLeaveApprovalModal(leaveId) {
    fetch('http://localhost:8000/emp_leave_req/get_leave_request_by_id', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Leave_ID: leaveId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.Status === "SUCCESS") {
        const doc = data.Data;

        $('#modal_emp_name').text(doc.Employee_Name || 'Pawann A Farde');
        $('#modal_leave_id').text(doc.Leave_ID || '');
        $('#modal_leave_type').text(doc.Leave_Type || '');
        $('#modal_from_date').text(moment.utc(doc.Leave_From_Date).format("DD-MM-YYYY") || '');
        $('#modal_to_date').text(moment.utc(doc.Leave_To_Date).format("DD-MM-YYYY") || '');
        $('#modal_leave_count').text(doc.Leave_Count || '');
        $('#modal_reason').text(doc.Reason || '');

        // Save current leaveId globally for use in submit
        window.selectedLeaveId = doc.Leave_ID;
        $('#remarks,#approve_status').val('').removeClass('has-error');
        $('#approve-status-error,#remarks-error').text('');
        $('#approve_status,#remarks').val('').selectpicker('refresh');
        $('#leave_req').modal('show');
      } else {
        alert("Failed to fetch leave request.");
      }
    })
    .catch(err => {
      console.error("Error fetching leave:", err);
    });
  }
  
function submitLeaveDecision() {
    const Status = $('#approve_status').val();
    const Remark = $('#remarks').val();
    const Leave_ID = window.selectedLeaveId;
  
    let isValid = true;
    if(!Status){
        $("#approve-status-error").text("Please select status.");
        $("#approve_status").addClass("has-error");
        isValid = false;
    }
    if(!Remark){
        $("#remarks-error").text("Please feel the remark.");
        $("#remarks").addClass("has-error");
        isValid = false;
    }
    if (!isValid) {
        return;
    }
    const payload = {
        Leave_ID,
        Status,
        Remark
      };
      fetch("http://localhost:8000/emp_leave_req/update_emp_leave_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(res => {  
          if (res.Status === "FAIL"){
              swal(res.Msg,'','error');
          }else{
              $('#remarks,#approve_status').val('').removeClass('has-error');
              $('#approve-status-error,#remarks-error').text('');
              $('#approve_status').text('');
              $('#remarks').text('');
              swal(res.Msg,'','success');
              $('#leave_req').modal('hide');
              window.location.reload();
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
