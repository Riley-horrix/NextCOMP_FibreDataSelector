class FibreDataObject {

    constructor(data) {

        this.internal_ready_bool = false;

        for (let row in data) {
            for (let col in data[row]) {
                data[row][col] = parseFloat(data[row][col]);
            }
        }

        data.sort(fibreDataComparison);

        this.fibreData = data;

        let indexSet = new Set();

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        for (let row in data) {
            minX = min(minX, data[row][XCOORD]);
            maxX = max(maxX, data[row][XCOORD]);
            minY = min(minY, data[row][YCOORD]);
            maxY = max(maxY, data[row][YCOORD]);
            minZ = min(minZ, data[row][ZCOORD]);
            maxZ = max(maxZ, data[row][ZCOORD]);
            indexSet.add(data[row][FIBREINDEX]);
        }


        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;

        this.indexSet = indexSet;
        this.fibreNumber = indexSet.size;
        this.dataHeight = Math.ceil(maxZ - minZ);
        this.dataWidth = Math.ceil(maxX - minX);
        this.dataDepth = Math.ceil(maxY - minY);

        this.drawResolution = Math.ceil(this.dataHeight / 10)

        this.misalignmentArray = [];
        this.fibreVolArray = [];
        this.maxTortArray = [];
        this.tortArray = [];
    }

    initAll = () => {
        this.initMisalignment();
        this.initFibreVolFraction(max(20, min(100, (this.maxX - this.minX) / 10)), max(50, min(200, (this.maxZ - this.minZ) / 5)), 1000);
        this.initTortuosity();
        this.displayHistograms();
        this.internal_ready_bool = true;
    }

    initMisalignment = () => {
        let xzMisalignments = new Array(this.fibreNumber);
        let yzMisalignments = new Array(this.fibreNumber);
        let misalignments = new Array(this.fibreNumber);

        let thisXFibreData = new Array();
        let thisYFibreData = new Array();
        let thisZFibreData = new Array();

        let currentFibreIndex = this.fibreData[0][FIBREINDEX];
        var arrayIndex = 0;

        for (let row in this.fibreData) {
            if (this.fibreData[row][FIBREINDEX] != currentFibreIndex) {

                xzMisalignments[arrayIndex] = findGradient(thisXFibreData, thisZFibreData);
                yzMisalignments[arrayIndex] = findGradient(thisYFibreData, thisZFibreData);
                thisXFibreData.length = 0;
                thisYFibreData.length = 0;
                thisZFibreData.length = 0;
                arrayIndex++;
            }

            currentFibreIndex = this.fibreData[row][FIBREINDEX];
            thisXFibreData.push(this.fibreData[row][XCOORD]);
            thisYFibreData.push(this.fibreData[row][YCOORD]);
            thisZFibreData.push(this.fibreData[row][ZCOORD]);
        }

        xzMisalignments[arrayIndex] = findGradient(thisXFibreData, thisZFibreData);
        yzMisalignments[arrayIndex] = findGradient(thisYFibreData, thisZFibreData);

        for (var row in xzMisalignments) {
            misalignments[row] = Math.abs((xzMisalignments[row] + yzMisalignments[row]) / 2);
        }

        misalignments.sort();

        this.misalignmentArray = misalignments;
    }

    initFibreVolFraction = (radius, height, iterations) => {
        let fibreVolArray = new Array();

        let cylinderVolume = Math.PI * radius * radius * height;

        for (let i = 0; i < iterations; i++) {

            let selectedCylinder = this.randomSample(radius, height);
            fibreVolArray.push(calculateFibreVolFrac(selectedCylinder, FIBRERADIUS, cylinderVolume));

        }

        fibreVolArray.sort();

        this.fibreVolArray = fibreVolArray;

    }

    initTortuosity = () => {

        let localLengthArray = new Array(MINTORTSAMPLE);
        let overallTortArray = new Array();
        let maxTortArray = new Array();
        let overallLengthArray = new Array();
        let localTortArray = new Array();

        this.indexSet.forEach((index) => {

            localTortArray.length = 0;
            overallLengthArray.length = 0;

            let thisFibreData = this.fibreData.filter((item) => item[FIBREINDEX] == index);

            if (thisFibreData.length < MINTORTSAMPLE + 1) {
                return;
            }

            // Iterate through fibre adding in relevent segments
            for (let i = 0; i < thisFibreData.length - 1; i++) {
                let previousPoint = thisFibreData[i];
                let nextPoint = thisFibreData[i + 1];

                let xDiff = nextPoint[XCOORD] - previousPoint[XCOORD];
                let yDiff = nextPoint[YCOORD] - previousPoint[YCOORD];
                let zDiff = nextPoint[ZCOORD] - previousPoint[ZCOORD];

                let segmentLength = Math.hypot(xDiff, yDiff, zDiff);
                localLengthArray[i % MINTORTSAMPLE] = segmentLength;
                overallLengthArray.push(segmentLength);

                if (i >= MINTORTSAMPLE) {
                    let localxDiff = thisFibreData[i][XCOORD] - thisFibreData[i - MINTORTSAMPLE][XCOORD];
                    let localyDiff = thisFibreData[i][YCOORD] - thisFibreData[i - MINTORTSAMPLE][YCOORD];
                    let localzDiff = thisFibreData[i][ZCOORD] - thisFibreData[i - MINTORTSAMPLE][ZCOORD];
                    localTortArray.push(localLengthArray.reduce((a, b) => a + b) / Math.hypot(localxDiff, localyDiff, localzDiff));
                }
            }

            let overallxDiff = thisFibreData[thisFibreData.length - 1][XCOORD] - thisFibreData[0][XCOORD];
            let overallyDiff = thisFibreData[thisFibreData.length - 1][YCOORD] - thisFibreData[0][YCOORD];
            let overallzDiff = thisFibreData[thisFibreData.length - 1][ZCOORD] - thisFibreData[0][ZCOORD];

            overallTortArray.push(overallLengthArray.reduce((a, b) => a + b) / Math.hypot(overallxDiff, overallyDiff, overallzDiff));
            maxTortArray.push(localTortArray.reduce((a, b) => {
                if (a <= b) {
                    return b;
                } else {
                    return a;
                }
            }))
        });

        maxTortArray.sort();
        overallTortArray.sort();

        this.maxTortArray = maxTortArray;
        this.tortArray = overallTortArray;

    }

    // Returns the range of values from a given metric
    getRangeOfMetric(metricNo) {
        switch (metricNo) {
            case MISALIGNMENT:
                return Math.abs(this.misalignmentArray[0] - this.misalignmentArray[this.misalignmentArray.length - 1]);
            case TORTUOSITY:
                return Math.abs(this.tortArray[0] - this.tortArray[this.tortArray.length - 1]);
            case MAXTORT:
                return Math.abs(this.maxTortArray[0] - this.maxTortArray[this.maxTortArray.length - 1]);
            case FIBREVOLFRAC:
                return Math.abs(this.fibreVolArray[0] - this.fibreVolArray[this.fibreVolArray.length - 1]);
            default:
                throw new Error("Unidentified metric number in data obj in getDistance!");
        }
    }

    valueFromPercentile(percentile, valueID) {

        let dataArray;

        switch (valueID) {
            case MISALIGNMENT:
                dataArray = this.misalignmentArray;
                break;
            case TORTUOSITY:
                dataArray = this.tortArray;
                break;
            case MAXTORT:
                dataArray = this.maxTortArray;
                break;
            case FIBREVOLFRAC:
                dataArray = this.fibreVolArray;
                break;
            default:
                throw new Error("valueID not recognised in data_object.js in valueFromPercentile!");
        }

        let arrayLen = dataArray.length;

        if (arrayLen == 0) {
            throw new Error("Array has no size in data_object.js in valueFromPercentile!");
        }

        let index = Math.round((percentile / 100) * arrayLen);

        let sum = 0;
        let elems = 0;

        for (let i = max(0, index - 5); i < min(arrayLen, index + 5); i++) {
            elems++;
            sum += dataArray[i];
        }

        return sum / elems;
    }

    draw(sketch) {
        let thisPoint = this.fibreData[0];
        let nextPoint;

        // sketch.translate(0, 0, -this.dataHeight * 5);
        // sketch.angleMode(sketch.DEGREES);
        // sketch.rotateX(25);


        for (let i = 0; i < this.fibreData.length - this.drawResolution; i += this.drawResolution) {

            nextPoint = this.fibreData[i + this.drawResolution];

            if (thisPoint[FIBREINDEX] != nextPoint[FIBREINDEX]) {
                // Draw the rest of the fibre
                let lastFibrePointIndex = i;
                while (this.fibreData[lastFibrePointIndex][FIBREINDEX] == thisPoint[FIBREINDEX]) {
                    lastFibrePointIndex++;
                }
                lastFibrePointIndex--;

                let lastFibrePoint = this.fibreData[lastFibrePointIndex];

                sketch.stroke(getRGBHexFromDec((thisPoint[XCOORD] - this.minX) / (this.maxX - this.minX)));

                let x1 = (thisPoint[XCOORD] - this.minX) * sketch.width / this.dataWidth - sketch.width / 2;
                let y1 = (thisPoint[YCOORD] - this.minY) * sketch.height / this.dataDepth - sketch.height / 2;

                let x2 = (lastFibrePoint[XCOORD] - this.minX) * sketch.width / this.dataWidth - sketch.width / 2;
                let y2 = (lastFibrePoint[YCOORD] - this.minY) * sketch.height / this.dataDepth - sketch.height / 2;

                let z1, z2;

                if (ISFLATTENED) {
                    z1 = 0;
                    z2 = 0;
                } else {
                    z1 = thisPoint[ZCOORD] - this.minZ;
                    z2 = lastFibrePoint[ZCOORD] - this.minZ
                }

                sketch.line(x1, y1, z1, x2, y2, z2);

                // Set this point to the first new fibre point.
                thisPoint = this.fibreData[lastFibrePointIndex + 1];
            }


            sketch.stroke(getRGBHexFromDec((thisPoint[XCOORD] - this.minX) / (this.maxX - this.minX)));

            let x1 = (thisPoint[XCOORD] - this.minX) * sketch.width / this.dataWidth - sketch.width / 2;
            let y1 = (thisPoint[YCOORD] - this.minY) * sketch.height / this.dataDepth - sketch.height / 2;

            let x2 = (nextPoint[XCOORD] - this.minX) * sketch.width / this.dataWidth - sketch.width / 2;
            let y2 = (nextPoint[YCOORD] - this.minY) * sketch.height / this.dataDepth - sketch.height / 2

            let z1, z2;

            if (ISFLATTENED) {
                z1 = 0;
                z2 = 0;
            } else {
                z1 = thisPoint[ZCOORD] - this.minZ;
                z2 = nextPoint[ZCOORD] - this.minZ;
            }

            sketch.line(x1, y1, z1, x2, y2, z2);

            thisPoint = nextPoint;
        }
    }

    randomSample = (radius, height) => {
        let dataSize = this.fibreData.length;
        for (let i = 1000; i > 0; i--) {
            let randIndex = Math.floor(Math.random() * dataSize);
            var selectedPoint = this.fibreData[randIndex];

            if (selectedPoint[XCOORD] < (this.minX + radius) || selectedPoint[XCOORD] > (this.maxX - radius)) {
                continue;
            }
            if (selectedPoint[YCOORD] < (this.minY + radius) || selectedPoint[YCOORD] > (this.maxY - radius)) {
                continue;
            }
            if (selectedPoint[ZCOORD] < this.minZ || selectedPoint[ZCOORD] > (this.maxZ - height)) {
                continue;
            }

            let cylinder = filterDataToCylinder(this.fibreData, selectedPoint, radius, height);
            return cylinder;
        }
        console.log("ERROR, DATA CANNOT BE PLACED INSIDE SAMPLE, try reducing radius or height.");
    }

    displayHistograms = () => {

        var target = document.getElementById("mis-hist");
        var trace = {
            x: this.misalignmentArray,
            type: 'histogram',
        };
        console.log("%o", this.misalignmentArray);
        var data = [trace];
        Plotly.newPlot(target, data);

        var target = document.getElementById("tort-hist");
        trace.x = this.tortArray;
        data = [trace];
        Plotly.newPlot(target, data);

        var target = document.getElementById("maxtort-hist");
        trace.x = this.maxTortArray;
        data = [trace];
        Plotly.newPlot(target, data);

        var target = document.getElementById("vol-hist");
        trace.x = this.fibreVolArray;
        data = [trace];
        Plotly.newPlot(target, data);

    }

    isReady() {
        return this.internal_ready_bool;
    }

    getDataHeight() {
        return this.dataHeight;
    }
}
