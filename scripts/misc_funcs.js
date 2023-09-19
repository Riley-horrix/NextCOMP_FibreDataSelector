
function fibreDataComparison(a, b) {
    if (a[FIBREINDEX] < b[FIBREINDEX]) {
        return -1;
    }
    if (a[FIBREINDEX] > b[FIBREINDEX]) {
        return 1;
    }
    if (a[ZCOORD] < b[ZCOORD]) {
        return -1;
    }
    if (a[ZCOORD] > b[ZCOORD]) {
        return 1;
    } else {
        return 0;
    }
}

function getRGBHexFromDec(val) {
    if (val > 1) {
        return "#000000";
    } else if (val < 0) {
        return "#ffffff"
    }

    if (val < (1 / 6)) {
        return "#FF" + normaliseHex(Math.floor(val * 6 * 255)) + "00";
    } else if (val < (2 / 6)) {
        return "#" + normaliseHex(Math.floor(255 - (val - 1 / 6) * 6 * 255)) + "FF00";
    } else if (val < (3 / 6)) {
        return "#00FF" + normaliseHex(Math.floor((val - 2 / 6) * 6 * 255));
    } else if (val < (4 / 6)) {
        return "#00" + normaliseHex(Math.floor(255 - (val - 3 / 6) * 6 * 255)) + "FF";
    } else if (val < (5 / 6)) {
        return "#" + normaliseHex(Math.floor((val - 4 / 6) * 6 * 255)) + "00FF";
    } else {
        return "#FF00" + normaliseHex(Math.floor(255 - (val - 5 / 6) * 6 * 255));
    }
}

function normaliseHex(value) {
    let result = "";

    if (value < 16) {
        result = "0";
    }

    return result + value.toString(16);
}

function calculateFibreVolFrac(data, radius, volume) {

    let averageZgap = 1;

    return (data.length * radius * radius * Math.PI * averageZgap) / volume;
}

/** Given input parameters, filter the array s.t. the points lie inside the cylinder. */
function filterDataToCylinder(data, position, radius, height) {
    // console.log(radius);
    // console.log(height);
    // console.log(data);
    // console.log(position);
    let newArr = data.filter(function (item) {
        if (Math.hypot(item[XCOORD] - position[XCOORD], item[YCOORD] - position[YCOORD]) > radius) {
            return false;
        }
        return item[ZCOORD] >= position[ZCOORD] && item[ZCOORD] <= (position[ZCOORD] + height);
    });
    // console.log(newArr);
    return newArr;
}

/** Calculate the average of said array. */
function arrAverage(array) {

    let elems = array.length;
    let sum = array.reduce((acc, curr) => acc + curr);

    return sum / elems;
}

function min(a, b) {
    if (a < b) {
        return a;
    } else {
        return b;
    }
}

function max(a, b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

function findGradient(values_y, values_x) {
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var count = 0;

    /*
     * We'll use those variables for faster read/write access.
     */
    var x = 0;
    var y = 0;
    var values_length = values_x.length;

    if (values_length != values_y.length) {
        throw new Error('The parameters values_x and values_y need to have same size!');
    }

    /*
     * Nothing to do.
     */
    if (values_length === 0) {
        return 0;
    }

    /*
     * Calculate the sum for each of the parts necessary.
     */
    for (var v = 0; v < values_length; v++) {
        x = values_x[v];
        y = (values_y[v]);
        sum_x += x;
        sum_y += y;
        sum_xx += x * x;
        sum_xy += x * y;
        count++;
    }

    // console.log(sum_x);
    // console.log(sum_xx);
    // console.log(sum_xy);
    // console.log(sum_y);
    // console.log(count);
    /*
     * Return gradient
     */
    let top = (count * sum_xy - sum_x * sum_y)
    let bottom = (count * sum_xx - sum_x * sum_x);
    return top / bottom;
}

/** Returns [0-1] depending on how close the given actual value is to the target value in the range. */
function calculateFit(actualValue, targetValue, range) {
    // console.log("Acc = %o", actualValue);
    // console.log("Trg = %o", targetValue);
    // console.log("Rng = %o\n\n\n", range);
    return max(1 - Math.abs((actualValue - targetValue) / range), 0);
}

function saveAs(text, filename) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=urf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
};

function generateCSVString(data) {
    let string = "";

    for (let row in data) {
        for (let col in data[row]) {
            string += data[row][col].toString();
            if (col != FIBREINDEX) {
                string += ", ";
            }
        }
        string += "\n";
    }

    return string;
}

function elvis(boolean, trueOut, falseOut) {
    if (boolean) {
        return trueOut;
    } else {
        return falseOut;
    }
}