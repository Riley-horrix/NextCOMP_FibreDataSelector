function calculateFibreVol(data, volume) {
    // TODO change 1 to the actual mean distance between adjacent same fibre nodes
    return data.length * FIBRERADIUS * FIBRERADIUS * Math.PI * 1 / volume;
}

function calculateTortuosity(data) {
    // TODO refactor so that these functions can take an obj?
    // TODO inline this with the data_object functions
    let indexSet = new Set();
    for (let row in data) {
        indexSet.add(data[row][FIBREINDEX]);
    }

    let sum = 0;
    let fibreLength = 0;

    indexSet.forEach(index => {
        let thisFibreData = data.filter((item) => item[FIBREINDEX] == index);
        fibreLength = 0;

        // Iterate through fibre adding in relevent segments
        for (let i = 0; i < thisFibreData.length - 1; i++) {
            let previousPoint = thisFibreData[i];
            let nextPoint = thisFibreData[i + 1];

            let xDiff = nextPoint[XCOORD] - previousPoint[XCOORD];
            let yDiff = nextPoint[YCOORD] - previousPoint[YCOORD];
            let zDiff = nextPoint[ZCOORD] - previousPoint[ZCOORD];

            fibreLength += Math.hypot(xDiff, yDiff, zDiff);
        }

        let overallxDiff = thisFibreData[thisFibreData.length - 1][XCOORD] - thisFibreData[0][XCOORD];
        let overallyDiff = thisFibreData[thisFibreData.length - 1][YCOORD] - thisFibreData[0][YCOORD];
        let overallzDiff = thisFibreData[thisFibreData.length - 1][ZCOORD] - thisFibreData[0][ZCOORD];

        sum += Math.hypot(overallxDiff, overallyDiff, overallzDiff) / fibreLength;
    });

    return sum / indexSet.size;
}

function calculateMaxTortuosity(data) {
    let indexSet = new Set();
    for (let row in data) {
        indexSet.add(data[row][FIBREINDEX]);
    }

    let localLengthArray = new Array(MINTORTSAMPLE);
    let maxTortSum = 0;
    let localTortArray = new Array();

    indexSet.forEach(index => {

        localTortArray.length = 0;

        let thisFibreData = data.filter((item) => item[FIBREINDEX] == index);

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

            if (i >= MINTORTSAMPLE) {
                let localxDiff = thisFibreData[i][XCOORD] - thisFibreData[i - MINTORTSAMPLE][XCOORD];
                let localyDiff = thisFibreData[i][YCOORD] - thisFibreData[i - MINTORTSAMPLE][YCOORD];
                let localzDiff = thisFibreData[i][ZCOORD] - thisFibreData[i - MINTORTSAMPLE][ZCOORD];
                localTortArray.push(localLengthArray.reduce((a, b) => a + b) / Math.hypot(localxDiff, localyDiff, localzDiff));
            }
        }

        maxTortSum += localTortArray.reduce((a, b) => {
            if (a <= b) {
                return b;
            } else {
                return a;
            }
        }, 1);
    });

    return maxTortSum / indexSet.size;
}

function calculateMisalignment(data) {

    let runningSum = 0;

    let indexSet = new Set();
    for (let row in data) {
        indexSet.add(data[row][FIBREINDEX]);
    }


    let thisXFibreData = new Array();
    let thisYFibreData = new Array();
    let thisZFibreData = new Array();

    let currentFibreIndex = data[0][FIBREINDEX];
    var arrayIndex = 0;

    for (let row in data) {
        if (data[row][FIBREINDEX] != currentFibreIndex) {

            runningSum += Math.abs(findGradient(thisXFibreData, thisZFibreData));
            runningSum += Math.abs(findGradient(thisYFibreData, thisZFibreData));
            thisXFibreData.length = 0;
            thisYFibreData.length = 0;
            thisZFibreData.length = 0;
            arrayIndex++;
        }

        currentFibreIndex = data[row][FIBREINDEX];
        thisXFibreData.push(data[row][XCOORD]);
        thisYFibreData.push(data[row][YCOORD]);
        thisZFibreData.push(data[row][ZCOORD]);
    }

    runningSum += Math.abs(findGradient(thisXFibreData, thisZFibreData));
    runningSum += Math.abs(findGradient(thisYFibreData, thisZFibreData));

    return runningSum / (indexSet.size * 2);
}