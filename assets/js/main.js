var map = undefined;
let mapImg = undefined;
let flowImg = undefined;

const pressures = { // altitude(meters): pressure(Pa)
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

function calcBoost(i, n){
    let max = getInputValue("boost-max", "boost-unit > option:selected");
    let min = getInputValue("boost-min", "boost-unit > option:selected");
    let x = i / (n - 1);
    switch($("#boost-curve").val().toLowerCase()){
        default:
        case 'linear':
            return (max - min) * x + min; //Psi
        case 'curved':
            return (max - min) * (Math.sin(Math.PI * x / 2)) + min; // Psi
    }
}

function drawBoostMap(map, pts) {
    let canvas = $("#boost-map")[0];
    canvas.width = 600;
    canvas.height = canvas.width / 2;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    
    let img_range = [
        0, parseFloat($("#rpm-max").val()) + parseFloat($("#rpm-min").val()),
        0, parseFloat($("#boost-max").val()) + parseFloat($("#boost-min").val())
    ];

    drawLine(canvas, img_range, pts, 'blue', 'rpm', 'boost');
}

function drawFlowMap(map, pts) {
    let canvas = $("#flow-map")[0];
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(flowImg, 0, 0);

    // drawLine(canvas, map.flow_range, pts, 'red', 'pr', 'massFlow_maxTemp');
    // drawLine(canvas, map.flow_range, pts, 'blue', 'pr', 'massFlow_minTemp');
}

function drawCompressorMap(map){
    let canvas = $("#comp-map")[0]
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImg, 0, 0);

    let pts = generatePoints();

    if(map.map_unit == 'lb_min'){
        drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp', 'pr');
        drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp', 'pr');
    }
    else if(map.map_unit == 'cfm'){
        // drawLine(canvas, map.map_range, pts, 'red', 'coldCfm_maxTemp', 'pr');
        // drawLine(canvas, map.map_range, pts, 'blue', 'coldCfm_minTemp', 'pr');
        drawLine(canvas, map.map_range, pts, 'red', 'airCfm', 'pr');
        drawLine(canvas, map.map_range, pts, 'blue', 'airCfm', 'pr');
    }
    
    drawFlowMap(map, pts);
    drawBoostMap(map, pts);
}

function generatePoints(){
    let pts = [];
    let n_pts = 10;
    let maxRpm = parseFloat($("#rpm-max").val());
    let minRpm = parseFloat($("#rpm-min").val());
    let tempUnit = JSON.parse($("#temp-unit > option:selected").val() || "[1,0]");
    let maxTemp = parseFloat($("#temp-max").val()) * tempUnit[0] + tempUnit[1]; //Air Temp (deg Kelvin)
    let minTemp = parseFloat($("#temp-min").val()) * tempUnit[0] + tempUnit[1]; //Air Temp (deg Kelvin)

    let d_rpm = (maxRpm - minRpm) / n_pts;
    for(let i = 0; i < n_pts; i++){
        let rpm = minRpm + i * d_rpm;
        let boost = calcBoost(i, n_pts); //Psi
        let ambient_pressure = pressures[$("#altitude").val()]; //Pa
        let pressure_ratio = (psiToPa(boost) + ambient_pressure) / ambient_pressure;
        console.log(calcMassFlow(rpm, pressure_ratio, 922));
        pts.push({
            rpm: rpm,
            boost: boost,
            airDensity_maxTemp: calcDensity(maxTemp, pressure_ratio),
            airDensity_minTemp: calcDensity(minTemp, pressure_ratio),
            massFlow_maxTemp: calcMassFlow(rpm, pressure_ratio, maxTemp),
            massFlow_minTemp: calcMassFlow(rpm, pressure_ratio, minTemp),
            airCfm: calcCfm(rpm),
            coldCfm_maxTemp: calcEquivCfm(rpm, pressure_ratio, maxTemp),
            coldCfm_minTemp: calcEquivCfm(rpm, pressure_ratio, maxTemp),
            ap: ambient_pressure,
            pr: pressure_ratio
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

function calcEquivCfm(rpm, pr, temp){
    let hotCfm = calcMassFlow(rpm, pr, temp);
    let hotDensity = calcDensity(temp, pr);
    let coldDensity = calcDensity(293, 1);
    return hotCfm * hotDensity / coldDensity; // Mass Flow Rate (lb/min)
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