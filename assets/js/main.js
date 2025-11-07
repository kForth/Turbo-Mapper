const HEAT_CAPACITY_RATIO_AIR = 1.398; // @ ~200C
const HEAT_CAPACITY_RATIO_EXH = 1.367; // @ ~750C
const SPECIFIC_HEAT_CAPACITY_AIR = 0.7178; // @ ~30C kJ/kg/K
const SPECIFIC_HEAT_CAPACITY_EXH = 0.8716; // @ ~825C kJ/kg/K

const FUEL_TYPES = [
  { name: "Gasoline", density__kg_L: 0.726, stoich: 14.7 },
  { name: "Diesel", density__kg_L: 1.875, stoich: 14.5 },
  { name: "E85", density__kg_L: 0.778, stoich: 9.8 },
  { name: "E100", density__kg_L: 0.789, stoich: 9.0 },
  { name: "M1", density__kg_L: 0.793, stoich: 6.5 },
]

class ViewModel {
  constructor() {
    var self = this;

    self.turboList = TURBOS;
    self.turboList.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    self.fuelTypeList = FUEL_TYPES;

    // Turbo Selection
    self.turbo = ko.observable(self.turboList[0]);
    self.numberOfTurbos = ko.observable(1);

    // Engine Specs
    self.engineDisplacementRaw = ko.observable(2.5);
    self.engineDisplacementUnit = ko.observable("L");
    self.engineDisplacement_L = ko.computed(() => {
      return _convert(self.engineDisplacementRaw(), self.engineDisplacementUnit(), 'L');
    }); // L
    self.numberOfCylinders = ko.observable(5);
    self.fuelType = ko.observable(self.fuelTypeList[0])

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

    // Result Data
    self.compressorData = ko.observableArray([]);
    self.minInjectorSize = ko.computed(() => {
      let minFlow = Math.max(...self.compressorData().map(pt => pt.injectorVolFlowRate__L_hr)) / 0.8;
      return Math.ceil(_convert(minFlow, "L/hr", "cm^3/min") / 50) * 50
    });

    // Input Table Units
    self.inputBoostPressureUnit = ko.observable(UNITS.pressure.find(e => e.default));

    // Result Table Units
    self.resultPressureUnit = ko.observable(UNITS.pressure.find(e => e.default));
    self.resultAirTemperatureUnit = ko.observable(UNITS.temperature.find(e => e.default));
    self.resultAirDensityUnit = ko.observable(UNITS.density.find(e => e.default));
    self.resultAirMassFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));
    self.resultAirVolFlowUnit = ko.observable(UNITS.volumetricFlow.find(e => e.default));
    self.resultFuelMassFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));
    self.resultFuelVolFlowUnit = ko.observable(UNITS.volumetricFlow.find(e => e.default));
    self.resultPowerUnit = ko.observable(UNITS.power.find(e => e.default));
    self.resultTorqueUnit = ko.observable(UNITS.torque.find(e => e.default));

    // Compressor Chart Data
    self.mapImg = new Image;
    self.mapImg.src = self.turbo().map_img;
    self._compChartX = function (pt) {
      switch (self.turbo().map_unit) {
        case 'lb_min':
          return pt.compAirMassFlowCorrected__lb_min;
        case 'kg_s':
          return pt.compInletAirMassFlowCorrected__kg_s;
        case 'cfm':
          return pt.compAirFlow__cfm;
        case 'm3_s':
          return pt.compInletAirFlow__m3_s;
      }
    };
    self.compressorChartPts = ko.computed(() => _foreach(self.compressorData(), pt => ({ x: self._compChartX(pt), y: pt.compPressureRatio })));
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
          x: {display: false, min: () => self.turbo().map_range[0], max: () => self.turbo().map_range[1]},
          y: {display: false, min: () => self.turbo().map_range[2], max: () => self.turbo().map_range[3]},
        },
        animation: false,
        animations: {colors: false, x: false},
        transitions: {active: {animation: {duration: 0}}},
        plugins: { legend: { display: false } },
      },
      plugins: [{id: 'compressorMapBackground', beforeDraw: (chart) => drawMapBg(chart, self.mapImg, self.turbo().map_range)}]
    };

    // Exhaust Flow Chart Data
    self.flowImg = new Image;
    self.flowImg.src = self.turbo().flow_img;
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
          x: {display: false, min: () => self.turbo().flow_range ? self.turbo().flow_range[0] : 0, max: () => self.turbo().flow_range ? self.turbo().flow_range[1] : 4, title: { display: false, text: 'Turbine Expansion Ratio' } },
          y: {display: false, min: () => self.turbo().flow_range ? self.turbo().flow_range[2] : 0, max: () => self.turbo().flow_range ? self.turbo().flow_range[3] : 0.1, title: { display: true, text: 'Phi (Turbine Swallowing)' }},
        },
        animation: false,
        animations: {colors: false, x: false},
        transitions: {active: {animation: {duration: 0}}},
        plugins: { legend: { display: false } },
      },
      plugins: [{id: 'flowMapBackground', beforeDraw: (chart) => self.flowImg.width ? drawMapBg(chart, self.flowImg, self.turbo().flow_range) : undefined}]
    };

    // Boost Curve Data
    self.boostCurve = ko.observableArray([]);
    self.boostCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => { return { x: pt.rpm(), y: pt.boost() }; }));
    self.veCurvePts = ko.computed(() => _foreach(self.boostCurve(), pt => { return { x: pt.rpm(), y: pt.ve() }; }));
    self.airMassFlowPts = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.compAirMassFlow__lb_min }; }))
    self.boostCurveChart = {
      type: 'scatter',
      data: ko.computed(() => {
        return {
          datasets: [
            { label: "Boost", data: self.boostCurvePts(), showLine: true },
            { label: "VE", data: self.veCurvePts(), showLine: true, yAxisID: "y2" },
            { label: "Air Flow", data: self.airMassFlowPts(), showLine: true, yAxisID: "y3" },
          ]
        };
      }),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'RPM' } },
          y: { min: 0, max: () => parseInt(Math.max(...self.boostCurvePts().map(pt => pt.y))) + 2, startAtZero: true, title: { display: true, text: 'Boost [psi]' } },
          y2: { min: 0, max: () => parseInt(Math.max(100 / 1.1, ...self.veCurvePts().map(pt => pt.y)) * 1.1), startAtZero: true, title: { display: true, text: 'VE %' }, position: 'right' },
          y3: { min: 0, max: parseInt(Math.max(...self.airMassFlowPts().map(pt => pt.y)) + 5), startAtZero: true, title: { display: true, text: 'Air Flow [lb/min]' }, position: 'right' },
        },
        animation: false,
        animations: {colors: false, x: false},
        transitions: {active: {animation: {duration: 0}}},
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
        },
        animation: false,
        animations: {colors: false, x: false},
        transitions: {active: {animation: {duration: 0}}},
      }
    };

    // Subscriptions
    [
      self.engineDisplacementRaw,
      self.engineDisplacementUnit,
      self.numberOfTurbos,
      self.turbo,
      self.fuelType,
      self.altitudeRaw,
      self.altitudeUnit,
      self.ambientTempRaw,
      self.ambientTempUnit,
      self.inputBoostPressureUnit,
    ].forEach(e => e.subscribe(() => self.updateCompressorMap()));
    self.boostCurve.subscribe(() => self.updateCompressorMap(), self, "arrayChange");
    ko.utils.arrayForEach(self.boostCurve(), (item) => {
      [item.rpm, item.boost, item.ve, item.afr, item.ter].forEach(e => e.subscribe(() => self.updateCompressorMap()));
    });
    self.turbo.subscribe(() => {
      self.mapImg.src = self.turbo().map_img;
      self.flowImg.src = self.turbo().flow_img;
    });

    // Main Update Function
    self.updateCompressorMap = function () {
      self.compressorData(self.updateCompressorMapPoints());
    };

    self.updateCompressorMapPoints = function () {
      var i_ = 0;
      let pts = [];
      let ambientTemp__K = self.ambientTemp_K();
      let ambientPressure__Pa = self.ambientPressure_Pa();

      for (let pt of self.boostCurve()) {
        let rpm = pt.rpm();
        let intakeAirPressure__Pa = ambientPressure__Pa; // - intakeRestriction__Pa // TODO
        let boostPressure__psi = _convert(pt.boost(), self.inputBoostPressureUnit().value, "psi");
        let volumetricEfficiency = pt.ve();
        let turbineExpansionRatio = pt.ter();
        let intercoolerEfficiency = pt.ie() / 100;
        let compressorEfficiency = pt.ce();
        let turbineEfficiency = 72; // TODO
        let exhGasTemp_K = 1100; // TODO: Estimate based on fuel type and AFR?
        let mufflerSystemBackpressure__psi = 1.5; // TODO

        let airFlow__cfm = _convert(self.engineDisplacement_L(), "L", "cuft") * rpm / 2 * (volumetricEfficiency / 100); // TODO: Intake restriction?
        let compOutletPressure__Pa = intakeAirPressure__Pa + _convert(boostPressure__psi, "psi", "Pa")
        let compPressureRatio = compOutletPressure__Pa / intakeAirPressure__Pa;
        let compOutletTemp__K = (ambientTemp__K * Math.pow(compPressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR) - ambientTemp__K) / (compressorEfficiency / 100) + ambientTemp__K;

        let compAirFlow__cfm = airFlow__cfm / self.numberOfTurbos();
        let compAirDensity__lb_cuft = _convert(compOutletPressure__Pa / 287.055 / ambientTemp__K, "kg/m^3", "lb/ft^3");
        let compAirMassFlow__lb_min = compAirFlow__cfm * compAirDensity__lb_cuft;

        let compAirMassFlowCorrected__lb_min = compAirMassFlow__lb_min * Math.sqrt(ambientTemp__K / 298.15) * (intakeAirPressure__Pa / 101325); // TODO: Intake restriction?
        let compAirFlowCorrected__cfm = compAirMassFlowCorrected__lb_min / compAirDensity__lb_cuft;

        let manifoldAirTemp__K = compOutletTemp__K - (intercoolerEfficiency * (compOutletTemp__K - ambientTemp__K));
        let manifoldAbosultePressure__Pa = compOutletPressure__Pa - 0; // TODO: Intercooler pressure drop?
        let manifoldPressureRatio = manifoldAbosultePressure__Pa / intakeAirPressure__Pa;
        let manifoldAirDensity__lb_cuft = _convert(manifoldAbosultePressure__Pa / 287.055 / manifoldAirTemp__K, "kg/m^3", "lb/ft^3");

        let fuelMassFlowRate__lb_min = compAirMassFlow__lb_min / pt.afr();
        let fuelVolFlowRate__L_hr = _convert(fuelMassFlowRate__lb_min, "lb/min", "kg/hr") / self.fuelType().density__kg_L;
        let injectorVolFlowRate__L_hr = fuelVolFlowRate__L_hr / self.numberOfCylinders();
        let approxPower__hp = _convert(compAirMassFlow__lb_min, "lb/min", "g/s") * 1.25;
        let approxTorque__ftlb = rpm == 0 ? 0 : approxPower__hp * 5252 / rpm;

        //https://www.grc.nasa.gov/www/k-12/airplane/compth.html
        let compressorShaftPower__kW =
          _convert(compAirMassFlow__lb_min, "lb/min", "kg/s") * SPECIFIC_HEAT_CAPACITY_AIR *
          ambientTemp__K *
          (Math.pow(compPressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR) - 1) /
          (compressorEfficiency / 100);

        let turbineShaftPower__kW =
          _convert(compAirMassFlow__lb_min * (1 + 1 / pt.afr()), "lb/min", "kg/s") * SPECIFIC_HEAT_CAPACITY_EXH *
          exhGasTemp_K *
          (Math.pow(1 / turbineExpansionRatio, (HEAT_CAPACITY_RATIO_EXH - 1) / HEAT_CAPACITY_RATIO_EXH) - 1) *
          (turbineEfficiency / 100) * -1;

        let wastegateFlowPercent = (turbineShaftPower__kW - compressorShaftPower__kW) / turbineShaftPower__kW * 100;
        let exhaustMassFlow__kg_s = _convert(compAirMassFlow__lb_min * (1 + 1 / pt.afr()), "lb/min", "kg/s");
        let turbineMassFlow__kg_s = (1 - wastegateFlowPercent / 100) * exhaustMassFlow__kg_s;
        let exhaustManifoldPressure_Pa = (_convert(mufflerSystemBackpressure__psi, "psi", "Pa") + ambientPressure__Pa) * turbineExpansionRatio;
        let phi = turbineMassFlow__kg_s * Math.sqrt(exhGasTemp_K) / (exhaustManifoldPressure_Pa / 1000);

        pts.push({
          i: i_++,
          rpm: rpm,
          compOutletPressure__Pa: compOutletPressure__Pa,
          compPressureRatio: compPressureRatio,
          turbineExpansionRatio: turbineExpansionRatio,
          exhGasTemp_K: exhGasTemp_K,
          airFlow__cfm: airFlow__cfm,
          compAirFlow__cfm: compAirFlow__cfm,
          compInletAirFlow__m3_s: _convert(compAirFlow__cfm, "cuft/min", "m3/s"),
          compAirDensity__lb_cuft: compAirDensity__lb_cuft,
          compAirMassFlow__lb_min: compAirMassFlow__lb_min,
          compInletAirMassFlow__kg_s: _convert(compAirMassFlow__lb_min, "lb/min", "kg/s"),
          compAirMassFlowCorrected__lb_min: compAirMassFlowCorrected__lb_min,
          compInletAirMassFlowCorrected__kg_s: _convert(compAirMassFlowCorrected__lb_min, "lb/min", "kg/s"),
          compAirFlowCorrected__cfm: compAirFlowCorrected__cfm,
          compOutletTemp__K: compOutletTemp__K,
          manifoldAirTemp__K: manifoldAirTemp__K,
          manifoldAbosultePressure__Pa: manifoldAbosultePressure__Pa,
          manifoldPressureRatio: manifoldPressureRatio,
          manifoldAirDensity__lb_cuft: manifoldAirDensity__lb_cuft,
          fuelMassFlowRate__lb_min: fuelMassFlowRate__lb_min,
          fuelVolFlowRate__L_hr: fuelVolFlowRate__L_hr,
          injectorVolFlowRate__L_hr: injectorVolFlowRate__L_hr,
          approxPower__hp: approxPower__hp,
          approxTorque__ftlb: approxTorque__ftlb,

          compressorShaftPower__kW: compressorShaftPower__kW,
          turbineShaftPower__kW: turbineShaftPower__kW,
          exhaustManifoldPressure_Pa: exhaustManifoldPressure_Pa,
          wastegateFlowPercent: wastegateFlowPercent,
          phi: phi,
        });
      }

      return pts;
    };

    // Initialize Boost Curve
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
      Object.values(pt).forEach(
        e => e.subscribe(() => self.updateCompressorMap())
      );
      return pt;
    };
    self.boostCurve([
      self._newBoostDataPoint(2000, 5, 85, 12.2, 1.21, 99, 60),
      self._newBoostDataPoint(3000, 10, 95, 12.2, 1.45, 95, 65),
      self._newBoostDataPoint(4000, 14, 100, 12.2, 1.72, 95, 70),
      self._newBoostDataPoint(5000, 16, 100, 12.2, 1.94, 92, 75),
      self._newBoostDataPoint(6000, 16, 105, 12.2, 2.17, 90, 80),
      self._newBoostDataPoint(7000, 16, 105, 12.2, 2.40, 90, 75),
    ])
  }
}

ko.applyBindings(new ViewModel());
