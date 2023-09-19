class MetricSearchObject {

    constructor(mis, aveTort, maxTort, fibreVol, rad, height, id) {

        this.misalignment = mis;
        this.averageTort = aveTort;
        this.maxTort = maxTort;
        this.fibreVol = fibreVol;
        this.radius = rad;
        this.height = height;
        this.volume = Math.PI * rad * rad * height;

        this.initialiseMetrics();

        this.misRange = FIBRE_DATA_OBJECT.getRangeOfMetric(MISALIGNMENT);
        this.tortRange = FIBRE_DATA_OBJECT.getRangeOfMetric(TORTUOSITY);
        this.maxTortRange = FIBRE_DATA_OBJECT.getRangeOfMetric(MAXTORT);
        this.fibreVolRange = FIBRE_DATA_OBJECT.getRangeOfMetric(FIBREVOLFRAC);

        this.drawResolution = 1;
        this.refreshId = -1;

        this.saveID = 0;

        this.currentSampleMis = 0.0;
        this.currentSampleTort = 0.0;
        this.currentSampleMaxTort = 0.0;
        this.currentSampleFibreVol = 0.0;

        this.tempSampleMis = 0.0;
        this.tempSampleTort = 0.0;
        this.tempSampleMaxTort = 0.0;
        this.tempSampleFibreVol = 0.0;

        this.id = id;
        this.currentEval = 0;
        this.internal_should_draw = false;

        this.dataHeight = 50;

    }

    initialiseMetrics = () => {
        this.misTarget = FIBRE_DATA_OBJECT.valueFromPercentile(this.misalignment, MISALIGNMENT);
        this.tortTarget = FIBRE_DATA_OBJECT.valueFromPercentile(this.averageTort, TORTUOSITY);
        this.maxTortTarget = FIBRE_DATA_OBJECT.valueFromPercentile(this.maxTort, MAXTORT);
        this.fibreVolTarget = FIBRE_DATA_OBJECT.valueFromPercentile(this.fibreVol, FIBREVOLFRAC);
    }

    /** Returns [0-1] depending on how close the given data meets the parameters. */
    evaluateSample = (someData) => {

        let resultArray = new Array();

        if (this.misalignment >= 0) {
            let sampleMisalignment = calculateMisalignment(someData);
            this.tempSampleMis = sampleMisalignment;
            resultArray.push(calculateFit(
                sampleMisalignment,
                this.misTarget,
                this.misRange));
        }

        if (this.averageTort >= 0) {
            let sampleTort = calculateTortuosity(someData);
            this.tempSampleTort = sampleTort;
            resultArray.push(calculateFit(
                sampleTort,
                this.tortTarget,
                this.tortRange));
        }

        if (this.maxTort >= 0) {
            let sampleMaxTort = calculateMaxTortuosity(someData);
            this.tempSampleMaxTort = sampleMaxTort;
            resultArray.push(calculateFit(
                sampleMaxTort,
                this.maxTortTarget,
                this.maxTortRange));
        }

        if (this.fibreVol >= 0) {
            let samplefibreVol = calculateFibreVol(someData, this.volume);
            this.tempSampleFibreVol = samplefibreVol;
            resultArray.push(calculateFit(
                samplefibreVol,
                this.fibreVolTarget,
                this.fibreVolRange));
        }

        if (resultArray.length == 0) {
            return 1;
        }

        return arrAverage(resultArray);

    }

    searchForBestFit = (iterations) => {
        for (let i = iterations; i > 0; i--) {
            let sample = FIBRE_DATA_OBJECT.randomSample(this.radius, this.height);

            if (sample.length < 2) {
                console.log("Sample not large enough");
                continue;
            }

            let thisEval = this.evaluateSample(sample);

            // TODO this if true is debug
            // if (true) {
            if (thisEval > this.currentEval) {
                this.currentEval = thisEval;
                this.sampleData = sample;

                SelectedDataSketches[this.id].redraw();

                this.calculateWebpageMetrics();
                this.updateWebpageMetrics();
            }

        }
    }

    calculateWebpageMetrics = () => {
        if (this.misalignment < 0) {
            this.tempSampleMis = calculateMisalignment(this.sampleData);
        }

        if (this.averageTort < 0) {
            this.tempSampleTort = calculateTortuosity(this.sampleData);
        }

        if (this.maxTort < 0) {
            this.tempSampleMaxTort = calculateMaxTortuosity(this.sampleData);
        }

        if (this.fibreVol < 0) {
            this.tempSampleFibreVol = calculateFibreVol(this.sampleData, this.volume);
        }
    }

    updateWebpageMetrics = () => {
        let currentMetricText = document.getElementById("mis-disp-" + this.id);
        this.currentSampleMis = this.tempSampleMis;
        currentMetricText.innerHTML = this.currentSampleMis;

        currentMetricText = document.getElementById("tort-disp-" + this.id);
        this.currentSampleTort = this.tempSampleTort;
        currentMetricText.innerHTML = this.currentSampleTort;

        currentMetricText = document.getElementById("maxtort-disp-" + this.id);
        this.currentSampleMaxTort = this.tempSampleMaxTort;
        currentMetricText.innerHTML = this.currentSampleMaxTort;

        currentMetricText = document.getElementById("fibrevol-disp-" + this.id);
        this.currentSampleFibreVol = this.tempSampleFibreVol;
        currentMetricText.innerHTML = this.currentSampleFibreVol;
    }

    draw = (sketch) => {
        let thisPoint = this.sampleData[0];
        let nextPoint;

        let maxX = -Infinity;
        let minX = Infinity;
        let maxY = -Infinity;
        let minY = Infinity;
        let maxZ = -Infinity;
        let minZ = Infinity;

        for (let row in this.sampleData) {
            minX = min(minX, this.sampleData[row][XCOORD]);
            maxX = max(maxX, this.sampleData[row][XCOORD]);
            minY = min(minY, this.sampleData[row][YCOORD]);
            maxY = max(maxY, this.sampleData[row][YCOORD]);
            minZ = min(minZ, this.sampleData[row][ZCOORD]);
            maxZ = max(maxZ, this.sampleData[row][ZCOORD]);
        }

        this.dataHeight = maxZ - minZ;

        let dataWidth = maxX - minX;
        let dataDepth = maxY - minY;

        for (let i = 0; i < this.sampleData.length - this.drawResolution; i += this.drawResolution) {
            nextPoint = this.sampleData[i + this.drawResolution];

            if (thisPoint[FIBREINDEX] != nextPoint[FIBREINDEX]) {
                // Draw the rest of the fibre
                let lastFibrePointIndex = i;
                while (this.sampleData[lastFibrePointIndex][FIBREINDEX] == thisPoint[FIBREINDEX]) {
                    lastFibrePointIndex++;
                }
                lastFibrePointIndex--;

                let lastFibrePoint = this.sampleData[lastFibrePointIndex];

                sketch.stroke(getRGBHexFromDec((thisPoint[XCOORD] - minX) / (maxX - minX)));

                let x1 = (thisPoint[XCOORD] - minX) * sketch.width / dataWidth - sketch.width / 2;
                let y1 = (thisPoint[YCOORD] - minY) * sketch.height / dataDepth - sketch.height / 2;

                let x2 = (lastFibrePoint[XCOORD] - minX) * sketch.width / dataWidth - sketch.width / 2;
                let y2 = (lastFibrePoint[YCOORD] - minY) * sketch.height / dataDepth - sketch.height / 2;

                let z1, z2;

                if (ISFLATTENED) {
                    z1 = 0;
                    z2 = 0;
                } else {
                    z1 = thisPoint[ZCOORD] - minZ;
                    z2 = lastFibrePoint[ZCOORD] - minZ;
                }

                sketch.line(x1, y1, z1, x2, y2, z2);

                // Set this point to the first new fibre point.
                thisPoint = this.sampleData[lastFibrePointIndex + 1];
            }


            sketch.stroke(getRGBHexFromDec((thisPoint[XCOORD] - minX) / (maxX - minX)));

            let x1 = (thisPoint[XCOORD] - minX) * sketch.width / dataWidth - sketch.width / 2;
            let y1 = (thisPoint[YCOORD] - minY) * sketch.height / dataDepth - sketch.height / 2;

            let x2 = (nextPoint[XCOORD] - minX) * sketch.width / dataWidth - sketch.width / 2;
            let y2 = (nextPoint[YCOORD] - minY) * sketch.height / dataDepth - sketch.height / 2;

            let z1, z2;

            if (ISFLATTENED) {
                z1 = 0;
                z2 = 0;
            } else {
                z1 = thisPoint[ZCOORD] - minZ;
                z2 = nextPoint[ZCOORD] - minZ;
            }

            sketch.line(x1, y1, z1, x2, y2, z2);

            thisPoint = nextPoint;
        }
    }

    saveSample() {
        console.log("SAVING");
        let csvStr = generateCSVString(this.sampleData);
        saveAs(csvStr, "generatedSample" + this.saveID + ".csv");
        this.saveID++;
    }

    setRefreshId(id) {
        this.refreshId = id;
    }

    stopSearch() {
        clearInterval(this.refreshId);
    }

    getDataHeight() {
        return this.dataHeight;
    }

    updateMetrics(mis, aveTort, maxTort, fibreVol, rad, height, refId) {
        this.misalignment = mis;
        this.averageTort = aveTort;
        this.maxTort = maxTort;
        this.fibreVol = fibreVol;
        this.radius = rad;
        this.height = height;
        this.volume = Math.PI * rad * rad * height;
        this.refreshId = refId;

        this.currentEval = 0;

        this.initialiseMetrics();
    }

}
