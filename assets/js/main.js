const LITRE_TO_CUBIC_FOOT = 0.0353147; // L to ft^3
const pressures = {
    // altitude(meters): pressure(Pa)
    0: 101325 ,
    600: 94170 ,
    1200: 87330 ,
    1800: 80820 ,
    2400: 74620 ,
    3000: 68730 ,
    3600: 63160 ,
    4200: 57900 ,
    4800: 53090 ,
}

function _convert(v, from, to){
    return math.unit(parseFloat(v), from).toNumber(to);
}
function _foreach(arr, fn) {
    return ko.utils.arrayMap(arr, fn)
}

function ViewModel() {
    var self = this;

    self.mapImg = new Image;
    self.flowImg = new Image;

    self.compPlugin = {
        id: 'compressorMapBackground',
        beforeDraw: (chart) => {
            let map = self.turbo();
            if (self.mapImg.complete) {
                const ctx = chart.ctx;
                const boxX = chart.boxes.filter(e => e.id == 'x')[0];
                const boxY = chart.boxes.filter(e => e.id == 'y')[0];
                const origin = { x: boxX.left, y:boxY.bottom };
                const limit = { x: boxX.right, y:boxY.top };
                const chartVals = {
                    minX: boxX.start,
                    maxX: boxX.end,
                    minY: boxY.start,
                    maxY: boxY.end,
                }

                const x_scale = (chartVals.maxX - chartVals.minX) / (limit.x - origin.x)
                const y_scale = (chartVals.maxY - chartVals.minY) / (limit.y - origin.y)
                const x_min = chartVals.minX - x_scale * origin.x;
                const x_max = x_scale * chart.width + x_min;
                const y_min = chartVals.minY - y_scale * origin.y;
                const y_max = y_scale * chart.height + y_min;
                const chartRange = [x_min, x_max, y_max, y_min];

                const pt = self.val_to_px(chart, map.map_range[0], map.map_range[2], chartRange)
                const pt2 = self.val_to_px(chart, map.map_range[1], map.map_range[3], chartRange)
                const im_w = pt2[0] - pt[0];
                const im_h = pt2[1] - pt[1];
                ctx.drawImage(self.mapImg, pt[0], chart.height - pt[1] - im_h, im_w, im_h);
            } else {
                self.mapImg.onload = () => chart.draw();
            }
        }
      };

    self.turboList = TURBOS;
    self.turboList.sort((a, b) => {
        if(a.name < b.name) return -1;
        if(a.name > b.name) return 1;
        return 0
    });
    self.turbo = ko.observable(self.turboList[0].name);

    // Engine Specs
    self.engineDisplacementRaw = ko.observable(2.5);
    self.engineDisplacementUnit = ko.observable("L");
    self.engineDisplacement = ko.computed(() => {
        return _convert(self.engineDisplacementRaw(), self.engineDisplacementUnit(), 'L');
    }) // L

    /// Environment
    self.altitudeRaw = ko.observable(0);
    self.altitudeUnit = ko.observable("m");
    self.altitude = ko.computed(() => {
        return _convert(self.altitudeRaw(), self.altitudeUnit(), 'm');
    }) // m
    self.ambientTempMinRaw = ko.observable(0);
    self.ambientTempMaxRaw = ko.observable(30);
    self.ambientTempUnit = ko.observable("degC");
    self.ambientTempMin = ko.computed(() => {
        return _convert(self.ambientTempMinRaw(), self.ambientTempUnit(), 'K');
    }) // K
    self.ambientTempMax = ko.computed(() => {
        return _convert(self.ambientTempMaxRaw(), self.ambientTempUnit(), 'K');
    }) // K

    self.ambientPressure = ko.computed(() => {
        // let altutude = this.altitude();
        // return (-1.03001e-9 * altitude^3) + (0.0000482823 * altitude^2) + (-3.6778 * altitude + 101329);
        return pressures[self.altitude()];
    })

    // Compressor Chart Data
    self.compressorData = ko.observableArray([]);
    self._compChartX = function (pt, isMaxTemp) {
        switch(self.turbo().map_unit){
            case 'lb_min':
                if(isMaxTemp === true)
                    return pt.massFlow_maxTemp__lb_min;
                return pt.massFlow_minTemp__lb_min;
            case 'kg_s':
                if(isMaxTemp === true)
                    return pt.massFlow_maxTemp__kg_s;
                return pt.massFlow_minTemp__kg_s;
            case 'cfm':
                return pt.airFlow__cfm;
            case 'm3_s':
                return pt.airFlow__m3_s;
        }
    }
    self.compressorChartMinTemp = ko.computed(() => _foreach(
        self.compressorData(), pt => {
            return {
                x: self._compChartX(pt, false),
                y: pt.pressure_ratio
            };
        }
    ));
    self.compressorChartMaxTemp = ko.computed(() => _foreach(
        self.compressorData(), pt => {
            return {
                x: self._compChartX(pt, true),
                y: pt.pressure_ratio
            };
        }
    ));

    self.compressorChart = {
        type: 'scatter',
        data: ko.computed(() => {
            return {
                datasets: [
                    {
                        label: "Min Temp.",
                        showLine: true,
                        data: self.compressorChartMinTemp(),
                    },
                    {
                        label: "Max Temp.",
                        showLine: true,
                        data: self.compressorChartMaxTemp(),
                    },
                ]
            };
        }),
        options: {
            observeChanges: true,
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: () => self.mapImg.width / self.mapImg.height,
            scales: {
                x: {
                    display: false,
                    startAtZero: true,
                    min: () => self.turbo().map_range[0],
                    max: () => self.turbo().map_range[1],
                },
                y: {
                    display: false,
                    min: () => self.turbo().map_range[2],
                    max: () => self.turbo().map_range[3],
                },
            },
            animation: false, // disables all animations
            animations: {
                colors: false, // disables animation defined by the collection of 'colors' properties
                x: false, // disables animation defined by the 'x' property
            },
            transitions: {
                active: {
                    animation: {
                        duration: 0, // disables the animation for 'active' mode
                    }
                }
            },
        },
        plugins: [self.compPlugin]
    };

    // Boost Curve Data
    self.boostCurve = ko.observableArray([
        {rpm: ko.observable(0), psi: ko.observable(0), ve: ko.observable(50)},
        {rpm: ko.observable(2000), psi: ko.observable(6), ve: ko.observable(70)},
        {rpm: ko.observable(3000), psi: ko.observable(12), ve: ko.observable(75)},
        {rpm: ko.observable(4000), psi: ko.observable(14), ve: ko.observable(80)},
        {rpm: ko.observable(5000), psi: ko.observable(16), ve: ko.observable(90)},
        {rpm: ko.observable(6000), psi: ko.observable(16), ve: ko.observable(80)},
        {rpm: ko.observable(7000), psi: ko.observable(16), ve: ko.observable(70)},
    ]);
    self.boostCurveRpm = ko.computed(() => _foreach(self.boostCurve(), pt => pt.rpm()));
    self.boostCurvePsi = ko.computed(() => _foreach(self.boostCurve(), pt => pt.psi()));
    self.boostCurveVe = ko.computed(() => _foreach(self.boostCurve(), pt => pt.ve()));
    self.boostCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => {return {x: pt.rpm(), y: pt.psi()}}));
    self.veCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => {return {x: pt.rpm(), y: pt.ve()}}));
    self.boostCurveChart = {
        type: 'scatter',
        data: ko.computed(() => {
            return {
                datasets: [
                    {
                        label: "Boost Curve",
                        data: self.boostCurvePts(),
                        showLine: true,
                    },
                    {
                        label: "VE %",
                        data: self.veCurvePts(),
                        showLine: true,
                        yAxisID: "y2",
                    },
                    {
                        label: "Flowrate",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.airFlow__cfm}})),
                        showLine: true,
                        yAxisID: "y3",
                    },
                    {
                        label: "MassFlow MaxTemp",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.massFlow_maxTemp__lb_min}})),
                        showLine: true,
                        yAxisID: "y4",
                    },
                    {
                        label: "MassFlow MinTemp",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.massFlow_minTemp__lb_min}})),
                        showLine: true,
                        yAxisID: "y4",
                    },
                ]
            }
        }),
        options: {
            observeChanges: true,
            scales: {
                x: {min: 0, startAtZero: true, title: {display: true, text: 'RPM'} },
                y: { min: 0, max: () => parseInt(Math.max(...self.boostCurvePsi())) + 2, startAtZero: true, title: {display: true, text: 'PSI'} },
                y2: { min: 0, max: () => parseInt(Math.max(100/1.1, ...self.boostCurveVe()) * 1.1), startAtZero: true, title: {display: true, text: 'VE %'}, position: 'right' },
                y3: { min: 0, startAtZero: true, title: {display: true, text: 'CFM'}, position: 'left' },
                y4: { min: 0, startAtZero: true, title: {display: true, text: 'lb/min'}, position: 'right' },
            }
        }
    };
    self.powerCurveChart = {
        type: 'scatter',
        data: ko.computed(() => {
            return {
                datasets: [
                    {
                        label: "MaxTemp Power",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.approxPower_maxTemp__hp}})),
                        showLine: true,
                        yAxisID: "y",
                    },
                    {
                        label: "MinTemp Power",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.approxPower_minTemp__hp}})),
                        showLine: true,
                        yAxisID: "y",
                    },
                    {
                        label: "MaxTemp Torque",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.approxTorque_maxTemp__ftlb}})),
                        showLine: true,
                        yAxisID: "y2",
                    },
                    {
                        label: "MinTemp Torque",
                        data: ko.computed(() => _foreach(self.compressorData(), pt => {return {x: pt.rpm, y: pt.approxTorque_minTemp__ftlb}})),
                        showLine: true,
                        yAxisID: "y2",
                    },
                ]
            }
        }),
        options: {
            observeChanges: true,
            scales: {
                x: {min: 0, startAtZero: true, title: {display: true, text: 'RPM'} },
                y: { min: 0, startAtZero: true, title: {display: true, text: 'HP'}, position: 'left' },
                y2: { min: 0, startAtZero: true, title: {display: true, text: 'ft.lb'}, position: 'right' },
            }
        }
    };

    // Subscriptions
    self.turbo.subscribe(() => self.loadMap());
    self.engineDisplacementRaw.subscribe(() => self.loadMap());
    self.engineDisplacementUnit.subscribe(() => self.loadMap());
    self.altitudeRaw.subscribe(() => self.loadMap());
    self.altitudeUnit.subscribe(() => self.loadMap());
    self.ambientTempMaxRaw.subscribe(() => self.loadMap());
    self.ambientTempMinRaw.subscribe(() => self.loadMap());
    self.ambientTempUnit.subscribe(() => self.loadMap());
    self.boostCurve.subscribe(() => self.loadMap(), self, "arrayChange");
    ko.utils.arrayForEach(self.boostCurve(), (item) => {
        item.rpm.subscribe(() => self.loadMap());
        item.psi.subscribe(() => self.loadMap());
        item.ve.subscribe(() => self.loadMap());
    });

    // Boost Curve Table Helpers
    self._newBoostDataPoint = function(rpm, psi, ve){
        let pt = {
            rpm: ko.observable(rpm),
            psi: ko.observable(psi),
            ve: ko.observable(ve)
        };
        pt.psi.subscribe(() => self.loadMap());
        pt.rpm.subscribe(() => self.loadMap());
        pt.ve.subscribe(() => self.loadMap());
        return pt;
    }
    self._getBoostDataMidpoint = function(a, b){
        return self._newBoostDataPoint(
            (a.rpm() + b.rpm()) / 2,
            (a.psi() + b.psi()) / 2,
            (a.ve() + b.ve()) / 2,
        );
    }
    self.addBoostDataRow = function(){
        let lastPt = self.boostCurve().at(-1);
        let pt = self._newBoostDataPoint(
            lastPt.rpm() + 500,
            lastPt.psi(),
            lastPt.ve()
        );
        self.insertBoostDataRow(pt);
    }
    self.insertBoostDataRow = function(pt, index){
        if(index === undefined)
            self.boostCurve.push(pt);
        else
            self.boostCurve.splice(index, 0, pt);
    }
    self.removeBoostDataRow = function(row){
        self.boostCurve.remove(row);
    }
    self.moveBoostDataRowUp = function(row) {
        let index = self.boostCurve.indexOf(row);
        self.boostCurve.remove(row);
        self.boostCurve.splice(index - 1, 0, row);
    }
    self.moveBoostDataRowDown = function(row) {
        let index = self.boostCurve.indexOf(row);
        self.boostCurve.remove(row);
        self.boostCurve.splice(index + 1, 0, row);

    }
    self.insertBoostDataRowAbove = function(row) {
        let index = self.boostCurve.indexOf(row);
        let pt = (index > 0) ?
            self._getBoostDataMidpoint(self.boostCurve().at(index - 1), row) :
            self._newBoostDataPoint(row.rpm() - 500, row.psi(), row.ve());
        self.insertBoostDataRow(pt, index);
    }
    self.insertBoostDataRowBelow = function(row) {
        let index = self.boostCurve.indexOf(row);
        let pt = (index < self.boostCurve.length - 1) ?
            self._getBoostDataMidpoint(row, self.boostCurve().at(index + 1)) :
            self._newBoostDataPoint(row.rpm() + 500, row.psi(), row.ve());
        self.insertBoostDataRow(pt, index + 1);
    }

    // Main Update Function
    self.loadMap = function() {
        self.mapImg.src = self.turbo().map_img;
        self.compressorData(self.generatePoints());
        console.log(self.compressorData());
        // let img = new Image;
        // self.mapImg = img;

        // let img_f = new Image;
        // img_f.src = self.turbo().flow_img;
        // self.flowImg = img_f;
    }

    self.psiToPa = function(v) {
        return _convert(v, 'psi', 'Pa');
        // return v * 6894.76;
    }
    self.paToPsi = function(v) {
        return _convert(v, 'Pa', 'psi');
        // return v / 6894.76;
    }

    self.drawFlowMap = function(map, pts) {
        // let canvas = $("#flow-map")[0];
        // let ctx = canvas.getContext("2d");
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.drawImage(self.flowImg, 0, 0);

        // self.drawLine(canvas, map.flow_range, pts, 'red', 'pressure_ratio', 'massFlow_maxTemp__lb_min');
        // self.drawLine(canvas, map.flow_range, pts, 'blue', 'pressure_ratio', 'massFlow_minTemp__lb_min');
    }

    self.drawCompressorMap = function(map) {
        let canvas = $("#comp-map")[0]
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(self.mapImg, 0, 0);

        let pts = self.generatePoints();

        if(map.map_unit == 'lb_min'){
            self.drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp__lb_min', 'pressure_ratio');
            self.drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp__lb_min', 'pressure_ratio');
        }
        else if(map.map_unit == 'kg_s'){
            self.drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp__kg_s', 'pressure_ratio');
            self.drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp__kg_s', 'pressure_ratio');
        }
        else if(map.map_unit == 'cfm'){
            self.drawLine(canvas, map.map_range, pts, 'red', 'airFlow__cfm', 'pressure_ratio');
            // self.drawLine(canvas, map.map_range, pts, 'blue', 'airFlow__cfm', 'pressure_ratio');
        }
        else if(map.map_unit == 'm3_s'){
            self.drawLine(canvas, map.map_range, pts, 'red', 'airFlow__m3_s', 'pressure_ratio');
            // self.drawLine(canvas, map.map_range, pts, 'blue', 'airFlow__m3_s', 'pressure_ratio');
        }

        self.drawFlowMap(map, pts);
    }

    self.val_to_px = function(c, x, y, range) {
        let minX = range[0];
        let maxX = range[1];
        let minY = range[2];
        let maxY = range[3];
        return [
            (x - minX) / (maxX - minX) * c.width,
            (y - minY) / (maxY - minY) * c.height
        ];
    }

    self.drawLine = function(canvas, px_range, pts, colour, x_key, y_key) {
        let ctx = canvas.getContext("2d");
        ctx.strokeStyle = colour;

        ctx.beginPath();
        for(let i = 0; i < pts.length; i++){
            let pt = pts[i];
            var px = self.val_to_px(canvas, pt[x_key], pt[y_key], px_range);
            if(i == 0)
                ctx.moveTo(px[0], canvas.height - px[1]);
            else
                ctx.lineTo(px[0], canvas.height - px[1]);
        }
        ctx.stroke();

        ctx.fillStyle = colour;
        for(let pt of pts){
            var px = self.val_to_px(canvas, pt[x_key], pt[y_key], px_range);
            ctx.beginPath();
            ctx.arc(px[0], canvas.height - px[1], 5, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    }

    self.getAmbientPressure = function() {
        return pressures[$("#altitude").val()]; //Dry Air Pressure (Pa)
    }

    self.calcCfm = function(rpm, ve) {
        return _convert(self.engineDisplacement(), "L", "cuft") * rpm / 2 * (ve / 100);
        // return _convert(self.engineDisplacement(), "L", "cuin") * rpm / 3456 * (ve / 100);
    }

    self.calcAirDensity = function(temp, pr) {
        let pd = self.ambientPressure() * pr; //Dry Air Pressure (Pa)
        let pv = Math.exp(20.386 - (5132 / temp)) * 133.32239; //Water Vapor Pressure (Pa)
        let density = (pd / (287.058 * temp)) + (pv / (461.495 * temp)); //Air Density (kg/m^3)
        return _convert(density, 'kg/m3', 'lb/cuft'); // Convert to lb/cu.ft
    }

    self.generatePoints = function() {
        let pts = [];
        let maxTemp = self.ambientTempMax(); //Air Temp (deg Kelvin)
        let minTemp = self.ambientTempMin(); //Air Temp (deg Kelvin)

        for(let {rpm, psi, ve} of self.boostCurve()){
            rpm = rpm();
            psi = psi();
            ve = ve();
            let cfm = self.calcCfm(rpm, ve); // CFM
            let ambient_pressure = pressures[self.altitude()]; //Pa
            let pressure_ratio = (self.psiToPa(psi) + ambient_pressure) / ambient_pressure;
            let airDensity_maxTemp = self.calcAirDensity(maxTemp, pressure_ratio); // lb/cu.ft
            let airDensity_minTemp = self.calcAirDensity(minTemp, pressure_ratio); // lb/cu.ft
            let massFlow_maxTemp = cfm * airDensity_maxTemp; // lb/min
            let massFlow_minTemp = cfm * airDensity_minTemp; // lb/min

            pts.push({
                rpm: rpm,
                pressure__psi: psi,
                ambient_pressure: ambient_pressure,
                pressure_ratio: pressure_ratio,
                airDensity_maxTemp__lb_cf: airDensity_maxTemp,
                airDensity_minTemp__lb_cf: airDensity_minTemp,
                massFlow_maxTemp__lb_min: massFlow_maxTemp,
                massFlow_minTemp__lb_min: massFlow_minTemp,
                massFlow_maxTemp__kg_s: _convert(massFlow_maxTemp, "lb/min", "kg/s"),
                massFlow_minTemp__kg_s: _convert(massFlow_minTemp, "lb/min", "kg/s"),
                airFlow__cfm: cfm,
                airFlow__m3_s: _convert(cfm, "cuft/min", "m3/s"), // * 0.0004719472,
                approxPower_maxTemp__hp: 10 * massFlow_maxTemp,
                approxPower_minTemp__hp: 10 * massFlow_minTemp,
                approxTorque_maxTemp__ftlb: rpm == 0 ? 0 : (10 * massFlow_maxTemp) / (rpm / 5252),
                approxTorque_minTemp__ftlb: rpm == 0 ? 0 : (10 * massFlow_minTemp) / (rpm / 5252),
            });
        }

        return pts;
    }
}

ko.applyBindings(new ViewModel());
