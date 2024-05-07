var map = undefined;
let mapImg = undefined;
let flowImg = undefined;

let boostCurveData = [
    {
        rpm: 1500,
        psi: 6
    },
    {
        rpm: 3000,
        psi: 10
    },
    {
        rpm: 4000,
        psi: 13
    },
    {
        rpm: 5000,
        psi: 15
    },
    {
        rpm: 6000,
        psi: 16
    },
    {
        rpm: 7000,
        psi: 16
    },
]
let boostCurveChart = new Chart(
    $("#boost-map"),
    {
      type: 'line',
      data: {
        labels: boostCurveData.map(pt => `${pt.rpm} RPM`),
        datasets: [{
            label: "PSI",
            data: boostCurveData.map(pt => pt.psi),
            cubicInterpolationMode: 'monotone'
        }]
      }
    }
  );

const pressures = {
    // altitude(meters): pressure(Pa)
    0: 101325,
    600: 94170,
    1200: 87330,
    1800: 80820,
    2400: 74620,
    3000: 68730,
    3600: 63160,
    4200: 57900,
    4800: 53090,
}

function getInputValue(key, unitKey){
    return parseFloat($(`#${key}`).val()) * parseFloat($(`#${unitKey}`).val());
}

function getEngineDisplacement(){
    return getInputValue('es-displacement', 'es-displacement-unit > option:selected');
}

function estimatePressure(altitude){
    return (-1.03001e-9 * altitude^3) + (0.0000482823 * altitude^2) + (-3.6778 * altitude + 101329);
}

function loadMap(map_name){
    map = TURBOS[map_name];
    let img = new Image;
    img.onload = () => {
        $("#comp-map")[0].width = img.width;
        $("#comp-map")[0].height = img.height;
        drawCompressorMap(map);
    };
    img.src = `/assets/img/${map.map_img}`;
    mapImg = img;

    let img_f = new Image;
    img_f.onload = () => {
        $("#flow-map")[0].width = img_f.width;
        $("#flow-map")[0].height = img_f.height;
        drawCompressorMap(map);
    };
    img_f.src = `/assets/img/${map.flow_img}`;
    flowImg = img_f;
}

function psiToPa(v){
    return v * 6894.76;
}
function paToPsi(v){
    return v / 6894.76;
}

function drawFlowMap(map, pts) {
    let canvas = $("#flow-map")[0];
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(flowImg, 0, 0);

    // drawLine(canvas, map.flow_range, pts, 'red', 'pressure_ratio', 'massFlow_maxTemp__lb_min');
    // drawLine(canvas, map.flow_range, pts, 'blue', 'pressure_ratio', 'massFlow_minTemp__lb_min');
}

function drawCompressorMap(map){
    let canvas = $("#comp-map")[0]
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImg, 0, 0);

    let pts = generatePoints();

    if(map.map_unit == 'lb_min'){
        drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp__lb_min', 'pressure_ratio');
        drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp__lb_min', 'pressure_ratio');
    }
    else if(map.map_unit == 'kg_s'){
        drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp__kg_s', 'pressure_ratio');
        drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp__kg_s', 'pressure_ratio');
    }
    else if(map.map_unit == 'cfm'){
        // drawLine(canvas, map.map_range, pts, 'red', 'coldCfm_maxTemp', 'pressure_ratio');
        // drawLine(canvas, map.map_range, pts, 'blue', 'coldCfm_minTemp', 'pressure_ratio');
        drawLine(canvas, map.map_range, pts, 'red', 'airFlow__cfm', 'pressure_ratio');
        // drawLine(canvas, map.map_range, pts, 'blue', 'airFlow__cfm', 'pressure_ratio');
    }
    else if(map.map_unit == 'm3_s'){
        // drawLine(canvas, map.map_range, pts, 'red', 'coldCfm_maxTemp', 'pressure_ratio');
        // drawLine(canvas, map.map_range, pts, 'blue', 'coldCfm_minTemp', 'pressure_ratio');
        drawLine(canvas, map.map_range, pts, 'red', 'airFlow__m3_s', 'pressure_ratio');
        // drawLine(canvas, map.map_range, pts, 'blue', 'airFlow__m3_s', 'pressure_ratio');
    }
    
    drawFlowMap(map, pts);
}

function generatePoints(){
    let pts = [];
    let tempUnit = JSON.parse($("#temp-unit > option:selected").val() || "[1,0]");
    let maxTemp = parseFloat($("#temp-max").val()) * tempUnit[0] + tempUnit[1]; //Air Temp (deg Kelvin)
    let minTemp = parseFloat($("#temp-min").val()) * tempUnit[0] + tempUnit[1]; //Air Temp (deg Kelvin)

    for(let pt of boostCurveData){
        let rpm = pt.rpm; // RPM
        let pressure__psi = pt.psi; //Psi
        let ambient_pressure = pressures[$("#altitude").val()]; //Pa
        let pressure_ratio = (psiToPa(pressure__psi) + ambient_pressure) / ambient_pressure;
        let airDensity_maxTemp = calcDensity(maxTemp, pressure_ratio); // lb/cu.ft
        let airDensity_minTemp = calcDensity(minTemp, pressure_ratio); // lb/cu.ft
        let massFlow_maxTemp = calcMassFlow2(rpm, airDensity_maxTemp); // CFM
        let massFlow_minTemp = calcMassFlow2(rpm, airDensity_minTemp); // CFM
        let airFlow__cfm = calcCfm(rpm);
        pts.push({
            rpm: rpm,
            pressure__psi: pressure__psi,
            ambient_pressure: ambient_pressure,
            pressure_ratio: pressure_ratio,
            airDensity_maxTemp__lb_cf: airDensity_maxTemp,
            airDensity_minTemp__lb_cf: airDensity_minTemp,
            massFlow_maxTemp__lb_min: massFlow_maxTemp,
            massFlow_minTemp__lb_min: massFlow_minTemp,
            massFlow_maxTemp__kg_s: massFlow_maxTemp * 0.00755987,
            massFlow_minTemp__kg_s: massFlow_minTemp * 0.00755987,
            airFlow__cfm: airFlow__cfm,
            airFlow__m3_s: airFlow__cfm * 0.0004719472,
            approxPower_maxTemp__hp: 10 * massFlow_maxTemp,
            approxPower_minTemp__hp: 10 * massFlow_minTemp,
        });
    }

    return pts;
}

function val_to_px(c, x, y, range){
    let minX = range[0];
    let maxX = range[1];
    let minY = range[2];
    let maxY = range[3];
    return [
        (x - minX) / (maxX - minX) * c.width,
        (y - minY) / (maxY - minY) * c.height
    ];
}

function drawLine(canvas, px_range, pts, colour, x_key, y_key){
    let ctx = canvas.getContext("2d");
    ctx.strokeStyle = colour;

    ctx.beginPath();
    for(let i = 0; i < pts.length; i++){
        let pt = pts[i];
        var px = val_to_px(canvas, pt[x_key], pt[y_key], px_range);
        if(i == 0)
            ctx.moveTo(px[0], canvas.height - px[1]);
        else
            ctx.lineTo(px[0], canvas.height - px[1]);
    }
    ctx.stroke();

    ctx.fillStyle = colour;
    for(let pt of pts){
        var px = val_to_px(canvas, pt[x_key], pt[y_key], px_range);
        ctx.beginPath();
        ctx.arc(px[0], canvas.height - px[1], 5, 0, 2 * Math.PI, false);
        ctx.fill();
    }
}

function getAmbientPressure(){
    return pressures[$("#altitude").val()]; //Dry Air Pressure (Pa)
}

function calcCfm(rpm){
    let eng_displ = getInputValue('es-displacement', 'es-displacement-unit > option:selected');
    let eng_ve = parseFloat($("#engVE").val());
    return eng_displ * LITRE_TO_CUBIC_FOOT * rpm / 2 * (eng_ve / 100)
}

function calcDensity(temp, pr){
    let pd = pressures[$("#altitude").val()] * pr; //Dry Air Pressure (Pa)
    let pv = Math.exp(20.386 - (5132 / temp)) * 133.32239; //Water Vapor Pressure (Pa)
    let density = (pd / (287.058 * temp)) + (pv / (461.495 * temp)); //Air Density (kg/m^3)
    return density *= 0.06243; // Convert to lb/cu.ft
}

const LITRE_TO_CUBIC_FOOT = 0.0353147; // L to ft^3
function calcMassFlow(rpm, pr, temp){
    let cfm = calcCfm(rpm);
    let density = calcDensity(temp, pr);
    return cfm * density; // Mass Flow Rate (lb/min)
}
function calcMassFlow2(rpm, density){
    let cfm = calcCfm(rpm);
    return cfm * density; // Mass Flow Rate (lb/min)
}

function estimateOemVe(){
    let eng_displ = getInputValue('es-displacement', 'es-displacement-unit > option:selected');
    let hp_str = window.prompt("Enter Peak Engine HP (hp@rpm):");
    let hp = parseFloat(hp_str.substr(0, hp_str.indexOf("@")));
    let rpm = parseFloat(hp_str.substr(hp_str.indexOf("@")+1));
    let bsfc = 0.57; // Estimated (random)

    let ve = Math.round((9487 * hp * bsfc ) / (eng_displ * rpm));

    $("#engVE").val(ve);
}

$("#estimateVE").on('click', estimateOemVe);

$("#mapSelect").on('change', (e) => {
    loadMap($("#mapSelect").val());
});

$("input, select").on('change', (e) =>{
    drawCompressorMap(map);
});

$(window).on('load', (e) => {
    ctx = $("#comp-map")[0].getContext("2d");
});

$(window).on('load', (e) => {
    loadMap(Object.keys(TURBOS)[0]);
});