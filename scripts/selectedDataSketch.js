let selectedDataSketch1 = (sketch) => {

    sketch.setup = () => {
        sketch.createCanvas(400, 400, sketch.WEBGL);
        sketch.angleMode(sketch.DEGREES);
        sketch.noLoop();
        SelectedDataSketches[1] = sketch;
    };

    sketch.draw = () => {
        sketch.background(250);
        if (typeof (SearchDataObjectArray[0]) != "undefined") {

            if (!ISFLATTENED) {
                sketch.translate(0, 0, -SearchDataObjectArray[0].getDataHeight());
                sketch.rotateX(50);
            }

            sketch.strokeWeight(1.5);
            SearchDataObjectArray[0].draw(sketch);
        }
    };
};

let selectedData1P5 = new p5(selectedDataSketch1, 'selectedData1');

let selectedDataSketch2 = (sketch) => {

    sketch.setup = () => {
        sketch.createCanvas(400, 400, sketch.WEBGL);
        sketch.angleMode(sketch.DEGREES);
        sketch.noLoop();
        SelectedDataSketches[2] = sketch;
    };

    sketch.draw = () => {
        sketch.background(250);
        if (typeof (SearchDataObjectArray[1]) != "undefined") {

            if (!ISFLATTENED) {
                sketch.translate(0, 0, -SearchDataObjectArray[0].getDataHeight());
                sketch.rotateX(50);
            }

            sketch.strokeWeight(1.5);
            SearchDataObjectArray[1].draw(sketch);
        }
    };
};

let selectedData2P5 = new p5(selectedDataSketch2, 'selectedData2');

