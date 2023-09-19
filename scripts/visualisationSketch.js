let visualisationSketch = (sketch) => {

    sketch.setup = () => {
        sketch.createCanvas(400, 400, sketch.WEBGL);
        sketch.angleMode(sketch.DEGREES);
        SelectedDataSketches[0] = sketch;
    };

    sketch.draw = () => {

        sketch.background(250);

        if (typeof (FIBRE_DATA_OBJECT) != "undefined") {
            if (FIBRE_DATA_OBJECT.isReady()) {

                if (!ISFLATTENED) {
                    sketch.translate(0, 0, -FIBRE_DATA_OBJECT.getDataHeight());
                    sketch.rotateX(30);
                }

                sketch.strokeWeight(1.5);
                FIBRE_DATA_OBJECT.draw(sketch);
                sketch.noLoop();
            }
        }
    };

};

let visualisationP5 = new p5(visualisationSketch, 'visualisationCanvas');