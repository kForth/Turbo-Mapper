// const boostCurveChart = new Chart(
//     $("#boost-map"),
//     {
//         type: 'line',
//         data: {
//             labels: [],
//             datasets: [{
//                 label: "PSI",
//                 data: [],
//                 cubicInterpolationMode: 'monotone'
//             }]
//         }
//     }
// );

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

function ViewModel() {
    var self = this;

    // self.ctx = $("#comp-map")[0].getContext("2d");

    self.mapImg = undefined;
    self.flowImg = undefined;

    self.turboList = TURBOS;
    self.turbo = ko.observable(self.turboList[0].name);

    // Engine Specs
    self.engineDisplacementRaw = ko.observable(2.5);
    self.engineDisplacementUnit = ko.observable("L");
    self.engineDisplacement = ko.computed(() => {
        return _convert(self.engineDisplacementRaw(), self.engineDisplacementUnit(), 'L');
    }) // L
    self.volumetricEfficieny = ko.observable(90); // %

    /// Environment
    self.altitudeRaw = ko.observable(0);
    self.altitudeUnit = ko.observable("m");
    self.altitude = ko.computed(() => {
        return _convert(self.altitudeRaw(), self.altitudeUnit(), 'm');
    }) // m
    self.ambientTempMaxRaw = ko.observable(0);
    self.ambientTempMinRaw = ko.observable(30);
    self.ambientTempUnit = ko.observable("degC");
    self.ambientTempMax = ko.computed(() => {
        return _convert(self.ambientTempMaxRaw(), self.ambientTempUnit(), 'K');
    }) // K
    self.ambientTempMin = ko.computed(() => {
        return _convert(self.ambientTempMinRaw(), self.ambientTempUnit(), 'K');
    }) // K
    
    self.ambientPressure = ko.computed(() => {
        // let altutude = this.altitude();
        // return (-1.03001e-9 * altitude^3) + (0.0000482823 * altitude^2) + (-3.6778 * altitude + 101329);
        return pressures[self.altitude()];
    })

    // Boost Curve
    self.boostCurveData = ko.observableArray([
        {rpm: ko.observable(1500), psi: ko.observable(6)},
        {rpm: ko.observable(3000), psi: ko.observable(10)},
        {rpm: ko.observable(4000), psi: ko.observable(13)},
        {rpm: ko.observable(5000), psi: ko.observable(15)},
        {rpm: ko.observable(6000), psi: ko.observable(16)},
        {rpm: ko.observable(7000), psi: ko.observable(16)},
    ]);
    self.addBoostDataRow = function(){
        let lastPt = self.boostCurveData().at(-1);
        let newPt = {
            rpm: ko.observable(lastPt.rpm() + 500),
            psi: ko.observable(lastPt.psi())
        }
        newPt.psi.subscribe(() => self.loadMap());
        newPt.rpm.subscribe(() => self.loadMap());
        self.boostCurveData.push(newPt);
        self.loadMap();
    }
    self.removeBoostDataRow = function(row){
        self.boostCurveData.remove(row);
        self.loadMap();
    }

    self.turbo.subscribe(() => self.loadMap());
    self.engineDisplacementRaw.subscribe(() => self.loadMap());
    self.engineDisplacementUnit.subscribe(() => self.loadMap());
    self.volumetricEfficieny.subscribe(() => self.loadMap());
    self.altitudeRaw.subscribe(() => self.loadMap());
    self.altitudeUnit.subscribe(() => self.loadMap());
    self.ambientTempMaxRaw.subscribe(() => self.loadMap());
    self.ambientTempMinRaw.subscribe(() => self.loadMap());
    self.ambientTempUnit.subscribe(() => self.loadMap());
    self.boostCurveData.subscribe(() => self.loadMap(), self, "arrayChange");
    ko.utils.arrayForEach(self.boostCurveData(), (item) => {
        item.rpm.subscribe(() => self.loadMap());
        item.psi.subscribe(() => self.loadMap());
    });

    self.loadMap = function() {
        let map = self.turbo();
        let img = new Image;
        img.onload = () => {
            $("#comp-map")[0].width = img.width;
            $("#comp-map")[0].height = img.height;
            self.drawCompressorMap(map);
        };
        img.src = `/assets/img/${map.map_img}`;
        self.mapImg = img;
    
        let img_f = new Image;
        img_f.onload = () => {
            $("#flow-map")[0].width = img_f.width;
            $("#flow-map")[0].height = img_f.height;
            self.drawCompressorMap(map);
        };
        img_f.src = `/assets/img/${map.flow_img}`;
        self.flowImg = img_f;
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
        console.log(pts);
    
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
    
    self.generatePoints = function() {
        let pts = [];
        let maxTemp = self.ambientTempMax(); //Air Temp (deg Kelvin)
        let minTemp = self.ambientTempMin(); //Air Temp (deg Kelvin)
    
        for(let {rpm, psi} of self.boostCurveData()){
            rpm = rpm();
            psi = psi();
            let cfm = self.calcCfm(rpm);
            let ambient_pressure = pressures[self.altitude()]; //Pa
            let pressure_ratio = (self.psiToPa(psi) + ambient_pressure) / ambient_pressure;
            let airDensity_maxTemp = self.calcDensity(maxTemp, pressure_ratio); // lb/cu.ft
            let airDensity_minTemp = self.calcDensity(minTemp, pressure_ratio); // lb/cu.ft
            let massFlow_maxTemp = self.calcMassFlow2(cfm, airDensity_maxTemp); // CFM
            let massFlow_minTemp = self.calcMassFlow2(cfm, airDensity_minTemp); // CFM

            pts.push({
                rpm: rpm,
                pressure__psi: psi,
                ambient_pressure: ambient_pressure,
                pressure_ratio: pressure_ratio,
                airDensity_maxTemp__lb_cf: airDensity_maxTemp,
                airDensity_minTemp__lb_cf: airDensity_minTemp,
                massFlow_maxTemp__lb_min: massFlow_maxTemp,
                massFlow_minTemp__lb_min: massFlow_minTemp,
                massFlow_maxTemp__kg_s: massFlow_maxTemp * 0.00755987,
                massFlow_minTemp__kg_s: massFlow_minTemp * 0.00755987,
                airFlow__cfm: cfm,
                airFlow__m3_s: cfm * 0.0004719472,
                approxPower_maxTemp__hp: 10 * massFlow_maxTemp,
                approxPower_minTemp__hp: 10 * massFlow_minTemp,
            });
        }
    
        return pts;
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
    
    self.calcCfm = function(rpm) {
        let eng_displ = self.engineDisplacement();
        let eng_ve = self.volumetricEfficieny();
        return eng_displ * LITRE_TO_CUBIC_FOOT * rpm / 2 * (eng_ve / 100)
    }
    
    self.calcDensity = function(temp, pr) {
        let pd = self.ambientPressure() * pr; //Dry Air Pressure (Pa)
        let pv = Math.exp(20.386 - (5132 / temp)) * 133.32239; //Water Vapor Pressure (Pa)
        let density = (pd / (287.058 * temp)) + (pv / (461.495 * temp)); //Air Density (kg/m^3)
        return density *= 0.06243; // Convert to lb/cu.ft
    }
    
    self.calcMassFlow = function(rpm, pr, temp) {
        let cfm = calcCfm(rpm);
        let density = calcDensity(temp, pr);
        return cfm * density; // Mass Flow Rate (lb/min)
    }
    self.calcMassFlow2 = function(cfm, density) {
        return cfm * density; // Mass Flow Rate (lb/min)
    }
    
    self.estimateOemVe = function() {
        let eng_displ = self.engineDisplacement();
        let hp_str = window.prompt("Enter Peak Engine HP (hp@rpm):");
        let hp = parseFloat(hp_str.substr(0, hp_str.indexOf("@")));
        let rpm = parseFloat(hp_str.substr(hp_str.indexOf("@")+1));
        let bsfc = 0.57; // Estimated (random)
    
        let ve = Math.round((9487 * hp * bsfc ) / (eng_displ * rpm));
    
        self.volumetricEfficieny(ve);
        // $("#engVE").val(ve);
    }
}

ko.applyBindings(new ViewModel());
