/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/* global exampleDataTable, CONST_SESSION */

var attendance_grid;
let db_id = "";
var uid = 0;
var ss_id = 0;
var curr_emp_data;

$(document).ready(function () {
    $.ajax({
        url: GetUrl() + "/getAllHolidays", 
        type: "GET", 
        dataType: "json",
        success: function (response) {
            if (response.Status === "SUCCESS" && response.Data.length > 0) {
                bindHolidayData(response.Data); 
            } else {
                showError("No holiday data available.");
            }
        },
        error: function (xhr, status, error) {
            console.error("API Error:", error);
            showError("Failed to fetch holiday data.");
        }
    });
});

function bindHolidayData(holidays) {
    let tableBody = $("#holidayTable tbody");
    tableBody.empty(); 

    holidays.forEach(holiday => {
       let Date = moment(holiday.Date).format("YYYY-MM-DD") 
        let row = `
<tr>
    <td>${Date}</td>
    <td>${holiday.Weekday}</td>
    <td>${holiday.Festival}</td>
    <td>${holiday.Calendar_Name}</td>
</tr>
`;
        tableBody.append(row);
    });
}

function showError(message) {
    $("#holidayTable tbody").html(`<tr><td colspan="4" class="text-danger">${message}</td></tr>`);
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

