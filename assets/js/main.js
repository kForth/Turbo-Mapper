const HEAT_CAPACITY_RATIO_AIR = 1.395;
const HEAT_CAPACITY_RATIO_EXH = 1.34;
const SPECIFIC_HEAT_CAPACITY_AIR = 0.7171;  // kJ/kg/K
const SPECIFIC_HEAT_CAPACITY_EXH = 0.87;  // kJ/kg/K
const MOLECULAR_WEIGHT_AIR = 28.96; // g/mol
const MOLECULAR_WEIGHT_FUEL = 105; // g/mol (average for gasoline)
const DENSITY_OF_GASOLINE__KG_L = 0.7475;  // kg/L

class ViewModel {
  constructor() {
    var self = this;

    self.mapImg = new Image;
    self.flowImg = new Image;

    self.turboList = TURBOS;
    self.turboList.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    self.turbo = ko.observable(self.turboList[0].name);

    // Engine Specs
    self.engineDisplacementRaw = ko.observable(2.5);
    self.engineDisplacementUnit = ko.observable("L");
    self.engineDisplacement_L = ko.computed(() => {
      return _convert(self.engineDisplacementRaw(), self.engineDisplacementUnit(), 'L');
    }); // L
    self.numberOfTurbos = ko.observable(1); // TODO

    /// Environment
    self.altitudeRaw = ko.observable(0);
    self.altitudeUnit = ko.observable("m");
    self.altitude_m = ko.computed(() => {
      return _convert(self.altitudeRaw(), self.altitudeUnit(), 'm');
    }); // m
    self.ambientTempMinRaw = ko.observable(0);
    self.ambientTempMaxRaw = ko.observable(30);
    self.ambientTempUnit = ko.observable("degC");
    self.ambientTempMin_K = ko.computed(() => {
      return _convert(self.ambientTempMinRaw(), self.ambientTempUnit(), 'K');
    }); // K
    self.ambientTempMax_K = ko.computed(() => {
      return _convert(self.ambientTempMaxRaw(), self.ambientTempUnit(), 'K');
    }); // K
    self.ambientPressure_Pa = ko.computed(() => {
      return (0.0004 * self.altitude_m()^2) - (12.217 * self.altitude_m()) + 101338
    });

    // Compressor Chart Data
    self.compressorData = ko.observableArray([]);
    self._compChartX = function (pt, isMaxTemp) {
      switch (self.turbo().map_unit) {
        case 'lb_min':
          if (isMaxTemp === true)
            return pt.massFlow_maxTemp__lb_min;
          return pt.massFlow_minTemp__lb_min;
        case 'kg_s':
          if (isMaxTemp === true)
            return pt.massFlow_maxTemp__kg_s;
          return pt.massFlow_minTemp__kg_s;
        case 'cfm':
          return pt.airFlow__cfm;
        case 'm3_s':
          return pt.airFlow__m3_s;
      }
    };
    self.compressorChartMinTemp = ko.computed(() => _foreach(self.compressorData(), pt => ({ x: self._compChartX(pt, false), y: pt.pressure_ratio })));
    self.compressorChartMaxTemp = ko.computed(() => _foreach(self.compressorData(), pt => ({ x: self._compChartX(pt, true), y: pt.pressure_ratio })));
    self.compressorChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Min Temp.", showLine: true, data: self.compressorChartMinTemp() },
            { label: "Max Temp.", showLine: true, data: self.compressorChartMaxTemp() },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: () => self.mapImg.width / self.mapImg.height,
        scales: {
          x: {display: false, startAtZero: true, min: () => self.turbo().map_range[0], max: () => self.turbo().map_range[1]},
          y: {display: false, min: () => self.turbo().map_range[2], max: () => self.turbo().map_range[3]},
        },
        animation: false,
        animations: {colors: false, x: false},
        transitions: {active: {animation: {duration: 0}}},
      },
      plugins: [{id: 'compressorMapBackground', beforeDraw: (chart) => self.drawMapBg(chart, self.mapImg, self.turbo().map_range)}]
    };

    // Exhaust Flow Chart Data
    self.exhaustFlowPts_MinTemp = ko.computed(() => _foreach(self.compressorData(), pt => ({x: pt.turbineExpansionRatio, y: pt.phi_maxTemp})));
    self.exhaustFlowPts_MaxTemp = ko.computed(() => _foreach(self.compressorData(), pt => ({x: pt.turbineExpansionRatio, y: pt.phi_minTemp})));
    self.exhaustFlowChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Min Temp.", showLine: true, data: self.exhaustFlowPts_MinTemp() },
            { label: "Max Temp.", showLine: true, data: self.exhaustFlowPts_MaxTemp() },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: () => self.flowImg.width / self.flowImg.height,
        scales: {
          x: {display: false, startAtZero: true, min: () => self.turbo().flow_range ? self.turbo().flow_range[0] : 0, max: () => self.turbo().flow_range ? self.turbo().flow_range[1] : 4, title: { display: false, text: 'Turbine Expansion Ratio' } },
          y: {display: false, min: () => self.turbo().flow_range ? self.turbo().flow_range[2] : 0, max: () => self.turbo().flow_range ? self.turbo().flow_range[3] : 0.1, title: { display: true, text: 'Phi (Turbine Swallowing)' }},
        },
      },
      plugins: [{id: 'flowMapBackground', beforeDraw: (chart) => self.flowImg.width ? self.drawMapBg(chart, self.flowImg, self.turbo().flow_range) : undefined}]
    };

    // Boost Curve Data
    self.boostCurve = ko.observableArray([
      { rpm: ko.observable(2000), psi: ko.observable(5), ve: ko.observable(85), afr: ko.observable(12.2), ter: ko.observable(1.21), ie: ko.observable(90) },
      { rpm: ko.observable(3000), psi: ko.observable(10), ve: ko.observable(95), afr: ko.observable(12.2), ter: ko.observable(1.45), ie: ko.observable(90) },
      { rpm: ko.observable(4000), psi: ko.observable(14), ve: ko.observable(100), afr: ko.observable(12.2), ter: ko.observable(1.72), ie: ko.observable(90) },
      { rpm: ko.observable(5000), psi: ko.observable(16), ve: ko.observable(100), afr: ko.observable(12.2), ter: ko.observable(1.94), ie: ko.observable(90) },
      { rpm: ko.observable(6000), psi: ko.observable(16), ve: ko.observable(105), afr: ko.observable(12.2), ter: ko.observable(2.17), ie: ko.observable(90) },
      { rpm: ko.observable(7000), psi: ko.observable(16), ve: ko.observable(105), afr: ko.observable(12.2), ter: ko.observable(2.40), ie: ko.observable(90) },
    ]);
    self.boostCurvePts_Rpm = ko.computed(() => _foreach(self.boostCurve(), pt => pt.rpm()));
    self.boostCurvePts_Psi = ko.computed(() => _foreach(self.boostCurve(), pt => pt.psi()));
    self.boostCurvePts_Ve = ko.computed(() => _foreach(self.boostCurve(), pt => pt.ve()));
    self.boostCurvePts_Afr = ko.computed(() => _foreach(self.boostCurve(), pt => pt.afr()));
    self.boostCurvePts_Ter = ko.computed(() => _foreach(self.boostCurve(), pt => pt.ter()));
    self.boostCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => { return { x: pt.rpm(), y: pt.psi() }; }));
    self.veCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => { return { x: pt.rpm(), y: pt.ve() }; }));
    self.compCurveMassFlowPts_MaxTemp = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.massFlow_maxTemp__lb_min }; }))
    self.compCurveMassFlowPts_MinTemp = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.massFlow_minTemp__lb_min }; }))
    self.boostCurveChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Boost Curve", data: self.boostCurvePts(), showLine: true },
            { label: "VE %", data: self.veCurvePts(), showLine: true, yAxisID: "y2" },
            { label: "MassFlow MaxTemp", data: self.compCurveMassFlowPts_MaxTemp(), showLine: true, yAxisID: "y3" },
            { label: "MassFlow MinTemp", data: self.compCurveMassFlowPts_MinTemp(), showLine: true, yAxisID: "y3" },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'RPM' } },
          y: { min: 0, max: () => parseInt(Math.max(...self.boostCurvePts_Psi())) + 2, startAtZero: true, title: { display: true, text: 'PSI' } },
          y2: { min: 0, max: () => parseInt(Math.max(100 / 1.1, ...self.boostCurvePts_Ve()) * 1.1), startAtZero: true, title: { display: true, text: 'VE %' }, position: 'right' },
          y4: { min: 0, startAtZero: true, title: { display: true, text: 'lb/min' }, position: 'right' },
        }
      }
    };

    // Estimated Power/Torque Chart Data
    self.powerCurvePts_MaxTempPower = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.i, y: pt.approxPower_maxTemp__hp }; }));
    self.powerCurvePts_MinTempPower = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.i, y: pt.approxPower_minTemp__hp }; }));
    self.powerCurvePts_MaxTempTorque = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.i, y: pt.approxTorque_maxTemp__ftlb }; }));
    self.powerCurvePts_MinTempTorque = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.i, y: pt.approxTorque_minTemp__ftlb }; }));
    self.powerCurveChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "MaxTemp Power", data: self.powerCurvePts_MaxTempPower(), showLine: true, yAxisID: "y" },
            { label: "MinTemp Power", data: self.powerCurvePts_MinTempPower(), showLine: true, yAxisID: "y" },
            { label: "MaxTemp Torque", data: self.powerCurvePts_MaxTempTorque(), showLine: true, yAxisID: "y2" },
            { label: "MinTemp Torque", data: self.powerCurvePts_MaxTempTorque(), showLine: true, yAxisID: "y2" },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'RPM' } },
          y: { min: 0, startAtZero: true, title: { display: true, text: 'HP' }, position: 'left', max: parseInt(Math.max(...self.compressorData().map(pt => pt.approxPower_maxTemp__hp), ...self.compressorData().map(pt => pt.approxPower_minTemp__hp)) + 50) },
          y2: { min: 0, startAtZero: true, title: { display: true, text: 'ft.lb' }, position: 'right', max: parseInt(Math.max(...self.compressorData().map(pt => pt.approxTorque_maxTemp__ftlb), ...self.compressorData().map(pt => pt.approxTorque_minTemp__ftlb)) + 50) },
        }
      }
    };

    // Subscriptions
    [
      self.turbo,
      self.engineDisplacementRaw,
      self.engineDisplacementUnit,
      self.altitudeRaw,
      self.altitudeUnit,
      self.ambientTempMaxRaw,
      self.ambientTempMinRaw,
      self.ambientTempUnit,
    ].forEach(e => e.subscribe(() => self.loadMap()));
    self.boostCurve.subscribe(() => self.loadMap(), self, "arrayChange");
    ko.utils.arrayForEach(self.boostCurve(), (item) => {
      [item.rpm, item.psi, item.ve, item.afr, item.ter].forEach(e => e.subscribe(() => self.loadMap()));
    });

    // Boost Curve Table Helpers
    self._newBoostDataPoint = function (rpm, psi, ve, afr, ter, ie) {
      let pt = {
        rpm: ko.observable(rpm),
        psi: ko.observable(psi),
        ve: ko.observable(ve),
        afr: ko.observable(afr),
        ter: ko.observable(ter),
        ie: ko.observable(ie)
      };
      pt.psi.subscribe(() => self.loadMap());
      pt.rpm.subscribe(() => self.loadMap());
      pt.ve.subscribe(() => self.loadMap());
      pt.afr.subscribe(() => self.loadMap());
      pt.ter.subscribe(() => self.loadMap());
      pt.ie.subscribe(() => self.loadMap());
      return pt;
    };
    self._getBoostDataMidpoint = function (a, b) {
      return self._newBoostDataPoint(
        (a.rpm() + b.rpm()) / 2,
        (a.psi() + b.psi()) / 2,
        (a.ve() + b.ve()) / 2,
        (a.afr() + b.afr()) / 2,
        (a.ter() + b.ter()) / 2,
        (a.ie() + b.ie()) / 2
      );
    };
    self.addBoostDataRow = function () {
      let lastPt = self.boostCurve().at(-1);
      let pt = self._newBoostDataPoint(
        lastPt.rpm() + 500,
        lastPt.psi(),
        lastPt.ve(),
        lastPt.afr(),
        lastPt.ter(),
        lastPt.ie()
      );
      self.insertBoostDataRow(pt);
    };
    self.insertBoostDataRow = function (pt, index) {
      if (index === undefined)
        self.boostCurve.push(pt);

      else
        self.boostCurve.splice(index, 0, pt);
    };
    self.removeBoostDataRow = function (row) {
      self.boostCurve.remove(row);
    };
    self.moveBoostDataRowUp = function (row) {
      let index = self.boostCurve.indexOf(row);
      self.boostCurve.remove(row);
      self.boostCurve.splice(index - 1, 0, row);
    };
    self.moveBoostDataRowDown = function (row) {
      let index = self.boostCurve.indexOf(row);
      self.boostCurve.remove(row);
      self.boostCurve.splice(index + 1, 0, row);

    };
    self.insertBoostDataRowAbove = function (row) {
      let index = self.boostCurve.indexOf(row);
      let pt = (index > 0) ?
        self._getBoostDataMidpoint(self.boostCurve().at(index - 1), row) :
        self._newBoostDataPoint(row.rpm() - 500, row.psi(), row.ve());
      self.insertBoostDataRow(pt, index);
    };
    self.insertBoostDataRowBelow = function (row) {
      let index = self.boostCurve.indexOf(row);
      let pt = (index < self.boostCurve.length - 1) ?
        self._getBoostDataMidpoint(row, self.boostCurve().at(index + 1)) :
        self._newBoostDataPoint(row.rpm() + 500, row.psi(), row.ve());
      self.insertBoostDataRow(pt, index + 1);
    };

    // Main Update Function
    self.loadMap = function () {
      self.mapImg.src = self.turbo().map_img;
      self.flowImg.src = self.turbo().flow_img;
      self.compressorData(self.generatePoints());
    };

    self.drawMapBg = function (chart, img, bounds) {
      if (img.src && img.complete) {
        const ctx = chart.ctx;
        const boxX = chart.boxes.filter(e => e.id == 'x')[0];
        const boxY = chart.boxes.filter(e => e.id == 'y')[0];
        const origin = { x: boxX.left, y: boxY.bottom };
        const limit = { x: boxX.right, y: boxY.top };
        const chartVals = {
          minX: boxX.start,
          maxX: boxX.end,
          minY: boxY.start,
          maxY: boxY.end,
        };

        const x_scale = (chartVals.maxX - chartVals.minX) / (limit.x - origin.x);
        const y_scale = (chartVals.maxY - chartVals.minY) / (limit.y - origin.y);
        const x_min = chartVals.minX - x_scale * origin.x;
        const x_max = x_scale * chart.width + x_min;
        const y_min = chartVals.minY - y_scale * origin.y;
        const y_max = y_scale * chart.height + y_min;
        const chartRange = [x_min, x_max, y_max, y_min];

        const pt = self.val_to_px(chart, bounds[0], bounds[2], chartRange);
        const pt2 = self.val_to_px(chart, bounds[1], bounds[3], chartRange);
        const im_w = pt2[0] - pt[0];
        const im_h = pt2[1] - pt[1];
        ctx.drawImage(img, pt[0], chart.height - pt[1] - im_h, im_w, im_h);
      } else {
        img.onload = () => chart.draw();
      }
    };

    self.drawCompressorMap = function (map) {
      let canvas = $("#comp-map")[0];
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(self.mapImg, 0, 0);

      let pts = self.generatePoints();

      if (map.map_unit == 'lb_min') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp__lb_min', 'pressure_ratio');
        self.drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp__lb_min', 'pressure_ratio');
      }
      else if (map.map_unit == 'kg_s') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'massFlow_maxTemp__kg_s', 'pressure_ratio');
        self.drawLine(canvas, map.map_range, pts, 'blue', 'massFlow_minTemp__kg_s', 'pressure_ratio');
      }
      else if (map.map_unit == 'cfm') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'airFlow__cfm', 'pressure_ratio');
        // self.drawLine(canvas, map.map_range, pts, 'blue', 'airFlow__cfm', 'pressure_ratio');
      }
      else if (map.map_unit == 'm3_s') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'airFlow__m3_s', 'pressure_ratio');
        // self.drawLine(canvas, map.map_range, pts, 'blue', 'airFlow__m3_s', 'pressure_ratio');
      }

      self.drawFlowMap(map, pts);
    };

    self.val_to_px = function (c, x, y, range) {
      let minX = range[0];
      let maxX = range[1];
      let minY = range[2];
      let maxY = range[3];
      return [
        (x - minX) / (maxX - minX) * c.width,
        (y - minY) / (maxY - minY) * c.height
      ];
    };

    self.drawLine = function (canvas, px_range, pts, colour, x_key, y_key) {
      let ctx = canvas.getContext("2d");
      ctx.strokeStyle = colour;

      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        let pt = pts[i];
        var px = self.val_to_px(canvas, pt[x_key], pt[y_key], px_range);
        if (i == 0)
          ctx.moveTo(px[0], canvas.height - px[1]);

        else
          ctx.lineTo(px[0], canvas.height - px[1]);
      }
      ctx.stroke();

      ctx.fillStyle = colour;
      for (let pt of pts) {
        var px = self.val_to_px(canvas, pt[x_key], pt[y_key], px_range);
        ctx.beginPath();
        ctx.arc(px[0], canvas.height - px[1], 5, 0, 2 * Math.PI, false);
        ctx.fill();
      }
    };

    self.calcCfm = function (rpm, ve) {
      return _convert(self.engineDisplacement_L(), "L", "cuft") * rpm / 2 * (ve / 100);
    };

    self.calcAirDensity = function (temp, pr) {
      let pd = self.ambientPressure_Pa() * pr; //Dry Air Pressure (Pa)
      let pv = Math.exp(20.386 - (5132 / temp)) * 133.32239; //Water Vapor Pressure (Pa)
      let density = (pd / (287.058 * temp)) + (pv / (461.495 * temp)); //Air Density (kg/m^3)
      return _convert(density, 'kg/m3', 'lb/cuft'); // Convert to lb/cu.ft
    };

    self.calcPhi = function (wgPercent, exhMassFlow__kg_s, exhGasTemp_K, turbineExpansionRatio, backpressure__Pa) {
      let exhManifoldPressure_Pa = (backpressure__Pa + self.ambientPressure_Pa()) * turbineExpansionRatio;
      return (
          (1 - wgPercent)
          * exhMassFlow__kg_s
          * Math.sqrt(exhGasTemp_K)
          / (exhManifoldPressure_Pa / 1000)
      );
    };

    self.calcCompressorShaftPower__W = function (inletTemp__K, pressureRatio, massFlow__kg_s, compressorEfficiency) {
      return (
        massFlow__kg_s *
        SPECIFIC_HEAT_CAPACITY_AIR *
        inletTemp__K * (Math.pow(pressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR) - 1)
      ) / (compressorEfficiency / 100) / 42.41;
    };

    self.calcTurbineShaftPower__W = function (inletTemp__K, outletTemp__K, massFlow__kg_s) {
      return (
        massFlow__kg_s
        * (8.314 / (MOLECULAR_WEIGHT_AIR + MOLECULAR_WEIGHT_FUEL))
        * inletTemp__K
        * HEAT_CAPACITY_RATIO_EXH
        / (HEAT_CAPACITY_RATIO_EXH - 1)
        * outletTemp__K
      );
    };

    self.generatePoints = function () {
      var i_ = 0;
      let pts = [];
      let ambientTemp_maxTemp__K = self.ambientTempMax_K(); //Air Temp (deg Kelvin)
      let ambientTemp_minTemp__K = self.ambientTempMin_K(); //Air Temp (deg Kelvin)
      for (let pt of self.boostCurve()) {
        let rpm = pt.rpm();
        let boostPressure__psi = pt.psi();
        let volumetricEfficiency = pt.ve();
        let airToFuelRatio = pt.afr();
        let turboExpansionRatio = pt.ter();
        let intercoolerEfficiency = pt.ie() / 100;
        let exhGasTemp_K = 1100; // TODO: Estimate based on fuel type and AFR?
        let compressorEfficiency = 80;  // TODO: Adjust based on compressor map

        let airFlow__cfm = self.calcCfm(rpm, volumetricEfficiency); // CFM
        let ambientPressure__Pa = self.ambientPressure_Pa(); //Pa
        let pressureRatio = (_convert(boostPressure__psi, "psi", "Pa") + ambientPressure__Pa) / ambientPressure__Pa;
        let compOutletTemp_maxTemp__K = ambientTemp_maxTemp__K * Math.pow(pressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR);
        let compOutletTemp_minTemp__K = ambientTemp_minTemp__K * Math.pow(pressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR);
        let intercoolerOutletTemp_maxTemp_K = compOutletTemp_maxTemp__K - intercoolerEfficiency * (compOutletTemp_maxTemp__K - ambientTemp_maxTemp__K);
        let intercoolerOutletTemp_minTemp_K = compOutletTemp_minTemp__K - intercoolerEfficiency * (compOutletTemp_minTemp__K - ambientTemp_minTemp__K);
        let airDensity_maxTemp__lb_cuft = self.calcAirDensity(intercoolerOutletTemp_maxTemp_K, pressureRatio); // lb/cu.ft
        let airDensity_minTemp__lb_cuft = self.calcAirDensity(intercoolerOutletTemp_minTemp_K, pressureRatio); // lb/cu.ft
        let massFlow_maxTemp__lb_min = airFlow__cfm * airDensity_maxTemp__lb_cuft; // lb/min
        let massFlow_minTemp__lb_min = airFlow__cfm * airDensity_minTemp__lb_cuft; // lb/min
        let estPower_maxTemp__hp = _convert(massFlow_maxTemp__lb_min, "lb/min", "g/s") * 1.25;
        let estPower_minTemp__hp = _convert(massFlow_minTemp__lb_min, "lb/min", "g/s") * 1.25;


        let fuelFlowRate_maxTemp__lb_min = massFlow_maxTemp__lb_min * (airToFuelRatio / 100);
        let fuelFlowRate_minTemp__lb_min = massFlow_minTemp__lb_min * (airToFuelRatio / 100);
        let fuelFlowRate_maxTemp__L_hr = _convert(fuelFlowRate_maxTemp__lb_min, "lb/min", "kg/hr") / DENSITY_OF_GASOLINE__KG_L;
        let fuelFlowRate_minTemp__L_hr = _convert(fuelFlowRate_minTemp__lb_min, "lb/min", "kg/hr") / DENSITY_OF_GASOLINE__KG_L;

        // TODO: Fix these
        // let compShaftPower_maxTemp__W = self.calcCompressorShaftPower__W(
        //   maxTemp__K, pressureRatio, _convert(massFlow_maxTemp__lb_min, "lb/min", "kg/s"), compressorEfficiency
        // );
        // let compShaftPower_minTemp__W = self.calcCompressorShaftPower__W(
        //   minTemp__K, pressureRatio, _convert(massFlow_minTemp__lb_min, "lb/min", "kg/s"), compressorEfficiency
        // );
        let compShaftPower_maxTemp__W = self.calcTurbineShaftPower__W(
          ambientTemp_maxTemp__K, compOutletTemp_maxTemp__K, _convert(massFlow_maxTemp__lb_min, "lb/min", "kg/s")
        );
        let compShaftPower_minTemp__W = self.calcTurbineShaftPower__W(
          ambientTemp_minTemp__K, compOutletTemp_minTemp__K, _convert(massFlow_minTemp__lb_min, "lb/min", "kg/s")
        );

        // TODO: Fix these
        let exhMassFlow_maxTemp__lb_min = massFlow_maxTemp__lb_min + fuelFlowRate_maxTemp__lb_min;
        let exhMassFlow_minTemp__lb_min = massFlow_minTemp__lb_min + fuelFlowRate_minTemp__lb_min;
        let turbineShaftPower_maxTemp__W = (
          (compressorEfficiency / 100)
          * SPECIFIC_HEAT_CAPACITY_EXH
          * exhGasTemp_K
          * (1 - Math.pow(1 / turboExpansionRatio, (HEAT_CAPACITY_RATIO_EXH - 1) / HEAT_CAPACITY_RATIO_EXH))
          * _convert(exhMassFlow_maxTemp__lb_min, "lb/min", "kg/s")
        ) * 1000;
        let turbineShaftPower_minTemp__W = (
          (compressorEfficiency / 100)
          * SPECIFIC_HEAT_CAPACITY_EXH
          * exhGasTemp_K
          * (1 - Math.pow(1 / turboExpansionRatio, (HEAT_CAPACITY_RATIO_EXH - 1) / HEAT_CAPACITY_RATIO_EXH))
          * _convert(exhMassFlow_maxTemp__lb_min, "lb/min", "kg/s")
        ) * 1000;
        // let turbineShaftPower_maxTemp__W = self.calcTurbineShaftPower__W(
        //   exhGasTemp_K, exhOutletTemp__K, _convert(exhMassFlow_maxTemp__lb_min, "lb/min", "kg/s")
        // );
        // let turbineShaftPower_minTemp__W = self.calcTurbineShaftPower__W(
        //   exhGasTemp_K, exhOutletTemp__K, _convert(exhMassFlow_minTemp__lb_min, "lb/min", "kg/s")
        // );

        // TODO: Fix these
        let wgPercent_maxTemp = 1 - (compShaftPower_maxTemp__W / turbineShaftPower_maxTemp__W);
        let wgPercent_minTemp = 1 - (compShaftPower_minTemp__W / turbineShaftPower_minTemp__W);
        let phi_maxTemp = self.calcPhi(
          wgPercent_maxTemp,
          _convert(exhMassFlow_maxTemp__lb_min, "lb/min", "kg/s"),
          exhGasTemp_K,
          turboExpansionRatio,
          _convert(5, "psi", "Pa")
        );
        let phi_minTemp = self.calcPhi(
          wgPercent_minTemp,
          _convert(exhMassFlow_minTemp__lb_min, "lb/min", "kg/s"),
          exhGasTemp_K,
          turboExpansionRatio,
          _convert(5, "psi", "Pa")
        );

        pts.push({
          i: i_++,
          rpm: rpm,
          pressure__psi: boostPressure__psi,
          ambient_pressure: ambientPressure__Pa,
          ambient_pressure_psi: _convert(ambientPressure__Pa, "Pa", "psi"),
          pressure_ratio: pressureRatio,
          absolutePressure__psi: _convert(ambientPressure__Pa * pressureRatio, "Pa", "psi"),
          turbineExpansionRatio: turboExpansionRatio,
          exhGasTemp_K: exhGasTemp_K,
          fuelFlowRate_maxTemp__lb_hr: fuelFlowRate_maxTemp__lb_min,
          fuelFlowRate_minTemp__lb_hr: fuelFlowRate_minTemp__lb_min,
          fuelFlowRate_maxTemp__L_hr: fuelFlowRate_maxTemp__L_hr,
          fuelFlowRate_minTemp__L_hr: fuelFlowRate_minTemp__L_hr,
          airTemp_maxTemp__C: _convert(intercoolerOutletTemp_maxTemp_K, "K", "degC"),
          airTemp_minTemp__C: _convert(intercoolerOutletTemp_minTemp_K, "K", "degC"),
          airDensity_maxTemp__lb_cf: airDensity_maxTemp__lb_cuft,
          airDensity_minTemp__lb_cf: airDensity_minTemp__lb_cuft,
          massFlow_maxTemp__lb_min: massFlow_maxTemp__lb_min,
          massFlow_minTemp__lb_min: massFlow_minTemp__lb_min,
          massFlow_maxTemp__kg_s: _convert(massFlow_maxTemp__lb_min, "lb/min", "kg/s"),
          massFlow_minTemp__kg_s: _convert(massFlow_minTemp__lb_min, "lb/min", "kg/s"),
          airFlow__cfm: airFlow__cfm,
          airFlow__m3_s: _convert(airFlow__cfm, "cuft/min", "m3/s"),
          approxPower_maxTemp__hp: rpm == 0 ? 0 : estPower_maxTemp__hp,
          approxPower_minTemp__hp: rpm == 0 ? 0 : estPower_minTemp__hp,
          approxTorque_maxTemp__ftlb: rpm == 0 ? 0 : estPower_maxTemp__hp * 5252 / rpm,
          approxTorque_minTemp__ftlb: rpm == 0 ? 0 : estPower_minTemp__hp * 5252 / rpm,
          compressorOutletTemp_maxTemp__K: compOutletTemp_maxTemp__K,
          compressorOutletTemp_minTemp__K: compOutletTemp_minTemp__K,
          wgPercent_maxTemp: wgPercent_maxTemp,
          wgPercent_minTemp: wgPercent_minTemp,
          compressorShaftPower_maxTemp__W: compShaftPower_maxTemp__W,
          compressorShaftPower_minTemp__W: compShaftPower_minTemp__W,
          turbineShaftPower_maxTemp__W: turbineShaftPower_maxTemp__W,
          turbineShaftPower_minTemp__W: turbineShaftPower_minTemp__W,
          phi_maxTemp: phi_maxTemp,
          phi_minTemp: phi_minTemp,
        });
      }

      return pts;
    };
  }
}

ko.applyBindings(new ViewModel());
