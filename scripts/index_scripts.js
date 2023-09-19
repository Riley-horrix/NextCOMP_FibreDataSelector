function isAPIAvailable() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        return true;
    } else {
        // source: File API availability - http://caniuse.com/#feat=fileapi
        // source: <output> availability - http://html5doctor.com/the-output-element/
        document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
        // 6.0 File API & 13.0 <output>
        document.writeln(' - Google Chrome: 13.0 or later<br />');
        // 3.6 File API & 6.0 <output>
        document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
        // 10.0 File API & 10.0 <output>
        document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
        // ? File API & 5.1 <output>
        document.writeln(' - Safari: Not supported<br />');
        // ? File API & 9.2 <output>
        document.writeln(' - Opera: Not supported');
        return false;
    }
}

// Function called when the page has finished loading
$(function () {
    if (isAPIAvailable()) {
        // Place a change event trigger on the file upload
        $('#fileupload').bind('change', saveDataToVar);
    }

    $('#stop-search-1').on("click", function () {
        if (typeof (SearchDataObjectArray[0]) != "undefined") {
            SearchDataObjectArray[0].stopSearch();
            displayStatus(1, FINISHED);
        }
    });

    $('#stop-search-2').on("click", function () {
        if (typeof (SearchDataObjectArray[1]) != "undefined") {
            SearchDataObjectArray[1].stopSearch();
            displayStatus(2, FINISHED);
        }
    });

    $('#download-sample-1').on("click", function () {
        if (typeof (SearchDataObjectArray[0]) != "undefined") {
            SearchDataObjectArray[0].saveSample();
        }
    });

    $('#download-sample-2').on("click", function () {
        if (typeof (SearchDataObjectArray[1]) != "undefined") {
            SearchDataObjectArray[1].saveSample();
        }
    });

    $('#flatten-samples').on("click", function () {
        ISFLATTENED = !ISFLATTENED;
        SelectedDataSketches.forEach(function (item) {
            item.redraw();
        })
    });
})

// If the input file is changed, then send the event to this function to read the data
// stored in the file, and save it to a global variable.
function saveDataToVar(event) {

    var files = event.target.files;
    var file = files[0];

    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function (event) {
        var csv = event.target.result;
        let data = $.csv.toArrays(csv);
        FIBRE_DATA_OBJECT = new FibreDataObject(data);
        FIBRE_DATA_OBJECT.initAll();
    };

    reader.onerror = function () { alert('Unable to read ' + file.fileName); };

}

function displayMetrics1() {
    displayMetrics(1, document.forms["metrics-1-form"]);
}

function displayMetrics2() {
    displayMetrics(2, document.forms["metrics-2-form"]);
}

function displayMetrics(number, form) {

    if (typeof (SearchDataObjectArray[number - 1]) != "undefined") {
        let status = getStatus(number);
        displayRerunMessage(number, status);
        if (status == SEARCHING || status == ERROR) {
            return false;
        }
    }

    let misalignmentMetric = -1;
    if (form["misalignment-" + number.toString() + "-check"].checked) {
        misalignmentMetric = parseInt(form["misalignment-" + number.toString() + "-slider"].value);
    }

    let aveTortMetric = -1;
    if (form["aveTort-" + number.toString() + "-check"].checked) {
        aveTortMetric = parseInt(form["aveTort-" + number.toString() + "-slider"].value);
    }

    let maxTortMetric = -1;
    if (form["maxTort-" + number.toString() + "-check"].checked) {
        maxTortMetric = parseInt(form["maxTort-" + number.toString() + "-slider"].value);
    }

    let fibreVolMetric = -1;
    if (form["fibreVol-" + number.toString() + "-check"].checked) {
        fibreVolMetric = parseInt(form["fibreVol-" + number.toString() + "-slider"].value);
    }

    let sampleRadius = parseInt(form["radius-" + number.toString()].value);
    let sampleHeight = parseInt(form["height-" + number.toString()].value);
    let searchTime = parseInt(form["time-" + number.toString()].value);

    displayRerunMessage(number);

    if (typeof (SearchDataObjectArray[number - 1]) == "undefined") {
        let searchObj = new MetricSearchObject(misalignmentMetric, aveTortMetric, maxTortMetric, fibreVolMetric, sampleRadius, sampleHeight, number);
        SearchDataObjectArray[number - 1] = searchObj;

        var refreshIntervalId = setInterval(searchObj.searchForBestFit, 500, 100); // Search for 100 iterations every 0.5s
        searchObj.setRefreshId(refreshIntervalId);

        displayStatus(number, SEARCHING);
        setTimeout(function () {
            clearInterval(refreshIntervalId);
            displayStatus(number, FINISHED);
        }, (searchTime * 1000));

    } else {
        let searchObj = SearchDataObjectArray[number - 1];
        searchObj.stopSearch();
        var refreshIntervalId = setInterval(searchObj.searchForBestFit, 500, 100);

        searchObj.updateMetrics(misalignmentMetric, aveTortMetric, maxTortMetric, fibreVolMetric, sampleRadius, sampleHeight, refreshIntervalId);

        displayStatus(number, SEARCHING);
        setTimeout(function () {
            clearInterval(refreshIntervalId);
            displayStatus(number, FINISHED);
        }, (searchTime * 1000));
    }

    return true;
    // searchObj.searchForBestFit(1);
}

function displayStatus(number, status) {
    let element = document.getElementById('status-' + number.toString());
    switch (status) {
        case FINISHED:
            element.innerHTML = "FINISHED";
            break;

        case SEARCHING:
            element.innerHTML = "SEARCHING";
            break;

        case IDLE:
            element.innerHTML = "IDLE";
            break;

        default:
            element.innerHTML = "ERROR";
    }
}

function getStatus(number) {
    console.log(number);
    let status = document.getElementById('status-' + number.toString()).innerHTML;
    console.log("status = %o", status);

    if (status == "FINISHED") {
        return FINISHED;
    } else if (status == "SEARCHING") {
        return SEARCHING;
    } else if (status == "IDLE") {
        return IDLE;
    } else if (status == "ERROR") {
        return ERROR;
    } else {
        return -1;
    }
}

function displayRerunMessage(number, status) {
    let element = document.getElementById("rerun-message-" + number.toString());
    switch (status) {
        case SEARCHING:
            element.innerHTML = "Wait for program to finish or manually stop.";
            break;
        case ERROR:
            element.innerHTML = "Error Occurred";
            break;
        default:
            element.innerHTML = "";
    }
}

function goBack() {
    window.history.back();
}
