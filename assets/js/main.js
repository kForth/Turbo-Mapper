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
    self.ambientTempRaw = ko.observable(30);
    self.ambientTempUnit = ko.observable("degC");
    self.ambientTemp_K = ko.computed(() => {
      return _convert(self.ambientTempRaw(), self.ambientTempUnit(), 'K');
    }); // K
    self.ambientPressure_Pa = ko.computed(() => {
      return (0.0004 * self.altitude_m()^2) - (12.217 * self.altitude_m()) + 101338
    });
    self.ambientPressureDisplayUnit = ko.observable(UNITS.pressure.find(e => e.default));

    // Input Table Units
    self.inputBoostPressureUnit = ko.observable(UNITS.pressure.find(e => e.default));

    // Result Table Units
    self.resultAmbientPressureUnit = ko.observable(UNITS.pressure.find(e => e.default));
    self.resultAirTemperatureUnit = ko.observable(UNITS.temperature.find(e => e.default));
    self.resultAirDensityUnit = ko.observable(UNITS.density.find(e => e.default));
    self.resultAirMassFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));
    self.resultAirVolFlowUnit = ko.observable(UNITS.volumetricFlow.find(e => e.default));
    self.resultFuelFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));

    // Compressor Chart Data
    self.compressorData = ko.observableArray([]);
    self._compChartX = function (pt) {
      switch (self.turbo().map_unit) {
        case 'lb_min':
          return pt.massFlow__lb_min;
        case 'kg_s':
          return pt.massFlow__kg_s;
        case 'cfm':
          return pt.airFlow__cfm;
        case 'm3_s':
          return pt.airFlow__m3_s;
      }
    };
    self.compressorChartPts = ko.computed(() => _foreach(self.compressorData(), pt => ({ x: self._compChartX(pt), y: pt.pressure_ratio })));
    self.compressorChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Compressor Curve", showLine: true, data: self.compressorChartPts() },
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
        plugins: { legend: { display: false } },
      },
      plugins: [{id: 'compressorMapBackground', beforeDraw: (chart) => self.drawMapBg(chart, self.mapImg, self.turbo().map_range)}]
    };

    // Exhaust Flow Chart Data
    self.exhaustFlowPts = ko.computed(() => _foreach(self.compressorData(), pt => ({x: pt.turbineExpansionRatio, y: pt.phi})));
    self.exhaustFlowChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Phi", showLine: true, data: self.exhaustFlowPts() },
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
        plugins: { legend: { display: false } },
      },
      plugins: [{id: 'flowMapBackground', beforeDraw: (chart) => self.flowImg.width ? self.drawMapBg(chart, self.flowImg, self.turbo().flow_range) : undefined}]
    };

    // Boost Curve Data
    self.boostCurve = ko.observableArray([]);
    self.boostCurvePts_Rpm = ko.computed(() => _foreach(self.boostCurve(), pt => pt.rpm()));
    self.boostCurvePts_Boost = ko.computed(() => _foreach(self.boostCurve(), pt => pt.boost()));
    self.boostCurvePts_Ve = ko.computed(() => _foreach(self.boostCurve(), pt => pt.ve()));
    self.boostCurvePts_Afr = ko.computed(() => _foreach(self.boostCurve(), pt => pt.afr()));
    self.boostCurvePts_Ter = ko.computed(() => _foreach(self.boostCurve(), pt => pt.ter()));
    self.boostCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => { return { x: pt.rpm(), y: pt.boost() }; }));
    self.veCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => { return { x: pt.rpm(), y: pt.ve() }; }));
    self.compCurveMassFlowPts = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.massFlow__lb_min }; }))
    self.boostCurveChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Boost", data: self.boostCurvePts(), showLine: true },
            { label: "VE", data: self.veCurvePts(), showLine: true, yAxisID: "y2" },
            { label: "Air Flow", data: self.compCurveMassFlowPts(), showLine: true, yAxisID: "y3" },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'RPM' } },
          y: { min: 0, max: () => parseInt(Math.max(...self.boostCurvePts_Boost())) + 2, startAtZero: true, title: { display: true, text: 'Boost [psi]' } },
          y2: { min: 0, max: () => parseInt(Math.max(100 / 1.1, ...self.boostCurvePts_Ve()) * 1.1), startAtZero: true, title: { display: true, text: 'VE %' }, position: 'right' },
          y3: { min: 0, max: parseInt(Math.max(...self.compCurveMassFlowPts().map(pt => pt.y)) + 5), startAtZero: true, title: { display: true, text: 'Air Flow [lb/min]' }, position: 'right' },
        }
      }
    };

    // Estimated Power/Torque Chart Data
    self.powerCurvePtsPower = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.approxPower__hp }; }));
    self.powerCurvePtsTorque = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.approxTorque__ftlb }; }));
    self.powerCurveChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Power", data: self.powerCurvePtsPower(), showLine: true, yAxisID: "y" },
            { label: "Torque", data: self.powerCurvePtsTorque(), showLine: true, yAxisID: "y2" },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'RPM' } },
          y: { min: 0, startAtZero: true, title: { display: true, text: 'HP' }, position: 'left', max: parseInt(Math.max(...self.compressorData().map(pt => pt.approxPower__hp)) + 50) },
          y2: { min: 0, startAtZero: true, title: { display: true, text: 'ft.lb' }, position: 'right', max: parseInt(Math.max(...self.compressorData().map(pt => pt.approxTorque__ftlb)) + 50) },
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
      self.ambientTempRaw,
      self.ambientTempUnit,
      self.inputBoostPressureUnit,
    ].forEach(e => e.subscribe(() => self.loadMap()));
    self.boostCurve.subscribe(() => self.loadMap(), self, "arrayChange");
    ko.utils.arrayForEach(self.boostCurve(), (item) => {
      [item.rpm, item.boost, item.ve, item.afr, item.ter].forEach(e => e.subscribe(() => self.loadMap()));
    });

    // Boost Curve Table Helpers
    self._newBoostDataPoint = function (rpm, boost, ve, afr, ter, ie, ce) {
      let pt = {
        rpm: ko.observable(rpm),
        boost: ko.observable(boost),
        ve: ko.observable(ve),
        afr: ko.observable(afr),
        ter: ko.observable(ter),
        ie: ko.observable(ie),
        ce: ko.observable(ce)
      };
      pt.rpm.subscribe(() => self.loadMap());
      pt.boost.subscribe(() => self.loadMap());
      pt.ve.subscribe(() => self.loadMap());
      pt.afr.subscribe(() => self.loadMap());
      pt.ter.subscribe(() => self.loadMap());
      pt.ie.subscribe(() => self.loadMap());
      pt.ce.subscribe(() => self.loadMap());
      return pt;
    };

    // Main Update Function
    self.loadMap = function () {
      self.mapImg.src = self.turbo().map_img;
      self.flowImg.src = self.turbo().flow_img;
      self.compressorData(self.updateCompressorMapPoints());
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

      let pts = self.compressorData();

      if (map.map_unit == 'lb_min') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'massFlow__lb_min', 'pressure_ratio');
      }
      else if (map.map_unit == 'kg_s') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'massFlow__kg_s', 'pressure_ratio');
      }
      else if (map.map_unit == 'cfm') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'airFlow__cfm', 'pressure_ratio');
      }
      else if (map.map_unit == 'm3_s') {
        self.drawLine(canvas, map.map_range, pts, 'red', 'airFlow__m3_s', 'pressure_ratio');
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

    self.updateCompressorMapPoints = function () {
      var i_ = 0;
      let pts = [];
      let ambientTemp__K = self.ambientTemp_K(); //Air Temp (deg Kelvin)
      for (let pt of self.boostCurve()) {
        let rpm = pt.rpm();
        let boost = pt.boost();
        let boostPressure__psi = _convert(boost, self.inputBoostPressureUnit().value, "psi");
        let volumetricEfficiency = pt.ve();
        let airToFuelRatio = pt.afr();
        let turboExpansionRatio = pt.ter();
        let intercoolerEfficiency = pt.ie() / 100;
        let compressorEfficiency = pt.ce();
        let exhGasTemp_K = 1100; // TODO: Estimate based on fuel type and AFR?

        let airFlow__cfm = self.calcCfm(rpm, volumetricEfficiency); // CFM
        let ambientPressure__Pa = self.ambientPressure_Pa(); //Pa
        let pressureRatio = (_convert(boostPressure__psi, "psi", "Pa") + ambientPressure__Pa) / ambientPressure__Pa;
        let compOutletTemp__K = ambientTemp__K * Math.pow(pressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR) / (compressorEfficiency / 100);
        let intercoolerOutletTemp_K = compOutletTemp__K - intercoolerEfficiency * (compOutletTemp__K - ambientTemp__K);
        let airDensity__lb_cuft = self.calcAirDensity(intercoolerOutletTemp_K, pressureRatio); // lb/cu.ft
        let massFlow__lb_min = airFlow__cfm * airDensity__lb_cuft; // lb/min
        let estPower__hp = _convert(massFlow__lb_min, "lb/min", "g/s") * 1.25;


        let fuelFlowRate__lb_min = massFlow__lb_min * (airToFuelRatio / 100);
        let fuelFlowRate__L_hr = _convert(fuelFlowRate__lb_min, "lb/min", "kg/hr") / DENSITY_OF_GASOLINE__KG_L;

        // TODO: Fix these
        // let compShaftPower__W = self.calcCompressorShaftPower__W(
        //   ambientPressure__Pa, pressureRatio, _convert(massFlow__lb_min, "lb/min", "kg/s"), compressorEfficiency
        // );
        let compShaftPower__W = self.calcTurbineShaftPower__W(
          ambientTemp__K, compOutletTemp__K, _convert(massFlow__lb_min, "lb/min", "kg/s")
        );

        // TODO: Fix these
        let exhMassFlow__lb_min = massFlow__lb_min + fuelFlowRate__lb_min;
        let turbineShaftPower__W = (
          (compressorEfficiency / 100)
          * SPECIFIC_HEAT_CAPACITY_EXH
          * exhGasTemp_K
          * (1 - Math.pow(1 / turboExpansionRatio, (HEAT_CAPACITY_RATIO_EXH - 1) / HEAT_CAPACITY_RATIO_EXH))
          * _convert(exhMassFlow__lb_min, "lb/min", "kg/s")
        ) * 1000;
        // let turbineShaftPower__W = self.calcTurbineShaftPower__W(
        //   exhGasTemp_K, exhOutletTemp__K, _convert(exhMassFlow__lb_min, "lb/min", "kg/s")
        // );

        // TODO: Fix these
        let wgPercent = 1 - (compShaftPower__W / turbineShaftPower__W);
        let phi = self.calcPhi(
          wgPercent,
          _convert(exhMassFlow__lb_min, "lb/min", "kg/s"),
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
          fuelFlowRate__lb_hr: fuelFlowRate__lb_min,
          fuelFlowRate__L_hr: fuelFlowRate__L_hr,
          airTemp__C: _convert(intercoolerOutletTemp_K, "K", "degC"),
          airDensity__lb_cf: airDensity__lb_cuft,
          massFlow__lb_min: massFlow__lb_min,
          massFlow__kg_s: _convert(massFlow__lb_min, "lb/min", "kg/s"),
          airFlow__cfm: airFlow__cfm,
          airFlow__m3_s: _convert(airFlow__cfm, "cuft/min", "m3/s"),
          approxPower__hp: rpm == 0 ? 0 : estPower__hp,
          approxTorque__ftlb: rpm == 0 ? 0 : estPower__hp * 5252 / rpm,
          compressorOutletTemp__K: compOutletTemp__K,
          wgPercent: wgPercent,
          compressorShaftPower__W: compShaftPower__W,
          turbineShaftPower__W: turbineShaftPower__W,
          phi: phi,
        });
      }

      return pts;
    };

    self.boostCurve([
      self._newBoostDataPoint(2000, 5, 85, 12.2, 1.21, 99, 60),
      self._newBoostDataPoint(3000, 10, 95, 12.2, 1.45, 95, 65),
      self._newBoostDataPoint(4000, 14, 100, 12.2, 1.72, 95, 70),
      self._newBoostDataPoint(5000, 16, 100, 12.2, 1.94, 92, 75),
      self._newBoostDataPoint(6000, 16, 105, 12.2, 2.17, 90, 80),
      self._newBoostDataPoint(7000, 16, 105, 12.2, 2.40, 90, 75),
    ])

    self.updateChartColors = (theme) => {
      console.log(theme);
      // TODO: Update chart.js colours
    };
    $(document).on('change', (e) => self.updateChartColors($(document.documentElement).attr("data-bs-theme")));
    $("button[data-bs-theme-value]").on('click', (e) => self.updateChartColors($(e.target).attr("data-bs-theme-value")));
  }
}

ko.applyBindings(new ViewModel());
