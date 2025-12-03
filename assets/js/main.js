const HEAT_CAPACITY_RATIO_AIR = 1.398; // @ ~200C
const HEAT_CAPACITY_RATIO_EXH = 1.367; // @ ~750C
const SPECIFIC_HEAT_CAPACITY_AIR = 1.006; // Isobaric @ ~30C kJ/kg/K
const SPECIFIC_HEAT_CAPACITY_EXH = 1.159; // Isobaric @ ~825C kJ/kg/K

const FUEL_TYPES = [
  { name: "Gasoline", density__kg_L: 0.726, stoich: 14.7 },
  { name: "Diesel", density__kg_L: 1.875, stoich: 14.5 },
  { name: "E85", density__kg_L: 0.778, stoich: 9.8 },
  { name: "E100", density__kg_L: 0.789, stoich: 9.0 },
  { name: "M1", density__kg_L: 0.793, stoich: 6.5 },
]

const ENGINE_TYPES = [
  { name: "Four-Stroke", rpm_factor: 0.5 },
  { name: "Two-Stroke", rpm_factor: 1 },
];

const DEFAULTS = {
  turbo: TURBOS[0],
  numberOfTurbos: 1,
  engineType: ENGINE_TYPES[0],
  engineDisplacementRaw: 2.5,
  engineDisplacementUnit: "L",
  numberOfCylinders: 5,
  fuelType: FUEL_TYPES[0],
  altitudeRaw: 0,
  altitudeUnit: "m",
  ambientTempRaw: 30,
  ambientTempUnit: "degC",
  inputData: [
    { rpm: 2000, boost: 5, ve: 85, afr: 12.2, wg: 13.0, ir: 0.50, ie: 99, ipd: 0.2, ce: 60, te: 75, ebp: 0.5 },
    { rpm: 3000, boost: 10, ve: 95, afr: 12.2, wg: 20.5, ir: 0.52, ie: 95, ipd: 0.2, ce: 65, te: 73, ebp: 1.2 },
    { rpm: 4000, boost: 14, ve: 100, afr: 12.2, wg: 30.0, ir: 0.58, ie: 95, ipd: 0.3, ce: 70, te: 72, ebp: 2.1 },
    { rpm: 5000, boost: 16, ve: 100, afr: 12.2, wg: 35.5, ir: 0.68, ie: 92, ipd: 0.4, ce: 75, te: 71, ebp: 3.3 },
    { rpm: 6000, boost: 16, ve: 105, afr: 12.2, wg: 41.5, ir: 0.82, ie: 90, ipd: 0.5, ce: 80, te: 70, ebp: 4.8 },
    { rpm: 7000, boost: 16, ve: 105, afr: 12.2, wg: 41.5, ir: 1.0, ie: 90, ipd: 0.6, ce: 75, te: 70, ebp: 6.5 },
  ],

  ambientPressureDisplayUnit: UNITS.pressure.find(e => e.default),
  inputBoostPressureUnit: UNITS.pressure.find(e => e.default).value,
  inputRestrictionPressureUnit: UNITS.pressure.find(e => e.default).value,
  inputIntercoolerPressureUnit: UNITS.pressure.find(e => e.default).value,
  inputBackpressureUnit: UNITS.pressure.find(e => e.default).value,
};

class ViewModel extends BaseModel {
  constructor() {
    super();
    var self = this;

    self.turboList = TURBOS.filter(e => e.map_range.length);
    self.fuelTypeList = FUEL_TYPES;
    self.engineTypeList = ENGINE_TYPES;

    // Turbo Selection
    self.turbo = ko.observable(DEFAULTS.turbo);
    self.numberOfTurbos = ko.observable(DEFAULTS.numberOfTurbos);
    // Engine Specs
    self.engineType = ko.observable(DEFAULTS.engineType);
    self.engineDisplacementRaw = ko.observable(DEFAULTS.engineDisplacementRaw);
    self.engineDisplacementUnit = ko.observable(DEFAULTS.engineDisplacementUnit);
    self.engineDisplacement_L = ko.computed(() => {
      return _convert(self.engineDisplacementRaw(), self.engineDisplacementUnit(), 'L');
    });
    self.numberOfCylinders = ko.observable(DEFAULTS.numberOfCylinders);
    self.fuelType = ko.observable(DEFAULTS.fuelType)

    // Environment
    self.altitudeRaw = ko.observable(DEFAULTS.altitudeRaw);
    self.altitudeUnit = ko.observable(DEFAULTS.altitudeUnit);
    self.altitude_m = ko.computed(() => {
      return _convert(self.altitudeRaw(), self.altitudeUnit(), 'm');
    });
    self.ambientTempRaw = ko.observable(DEFAULTS.ambientTempRaw);
    self.ambientTempUnit = ko.observable(DEFAULTS.ambientTempUnit);
    self.ambientTemp_K = ko.computed(() => {
      return _convert(self.ambientTempRaw(), self.ambientTempUnit(), 'K');
    });
    self.ambientPressure_Pa = ko.computed(() => {
      return (0.0004 * self.altitude_m()^2) - (12.217 * self.altitude_m()) + 101338
    });
    self.ambientPressureDisplayUnit = ko.observable(DEFAULTS.ambientPressureDisplayUnit);

    // Result Data
    self.compressorData = ko.observableArray([]);
    self.minInjectorSize__cc_m = ko.computed(() => {
      let minFlow = Math.max(...self.compressorData().map(pt => pt.injectorVolFlowRate__L_hr)) / 0.8;
      return Math.ceil(_convert(minFlow, "L/hr", "cm^3/min") / 50) * 50
    });
    self.minFuelPumpSize__L_hr = ko.computed(() => {
      let minFlow = Math.max(...self.compressorData().map(pt => pt.fuelVolFlowRate__L_hr)) / 0.8;
      return Math.ceil(minFlow / 5) * 5
    });

    // Input Table Units
    self.inputBoostPressureUnit = ko.observable(DEFAULTS.inputBoostPressureUnit);
    self.inputRestrictionPressureUnit = ko.observable(DEFAULTS.inputRestrictionPressureUnit);
    self.inputIntercoolerPressureUnit = ko.observable(DEFAULTS.inputIntercoolerPressureUnit);
    self.inputBackpressureUnit = ko.observable(DEFAULTS.inputBackpressureUnit);

    // Result Table Units
    self.resultPressureUnit = ko.observable(UNITS.pressure.find(e => e.default));
    self.resultAirTemperatureUnit = ko.observable(UNITS.temperature.find(e => e.default));
    self.resultAirDensityUnit = ko.observable(UNITS.density.find(e => e.default));
    self.resultAirMassFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));
    self.resultAirVolFlowUnit = ko.observable(UNITS.volumetricFlow.find(e => e.default));
    self.resultFuelMassFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));
    self.resultFuelVolFlowUnit = ko.observable(UNITS.volumetricFlow.find(e => e.default));
    self.resultExhGasMassFlowUnit = ko.observable(UNITS.massFlow.find(e => e.default));
    self.resultPowerUnit = ko.observable(UNITS.power.find(e => e.default));
    self.resultTorqueUnit = ko.observable(UNITS.torque.find(e => e.default));

    // Compressor Chart Data
    self.mapImg = new Image;
    self._compChartX = function (pt) {
      switch (self.turbo().map_unit) {
        case "lb/min":
          return pt.compAirMassFlowCorrected__lb_min;
        case "kg/s":
          return pt.compInletAirMassFlowCorrected__kg_s;
        case "cuft/min":
          return pt.compAirFlowCorrected__cfm;
        case "m^3/s":
          return pt.compAirFlowCorrected__m3_s;
      }
    };
    self.compressorChartPts = ko.computed(() => _foreach(self.compressorData(), pt => ({ x: self._compChartX(pt), y: pt.compPressureRatio })));
    self.compressorChart = {
      type: 'scatter',
      data: ko.computed(() => ({
        datasets: [{ label: "Compressor Curve", showLine: true, data: self.compressorChartPts() }]
      })),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: true,
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
    self.exhaustFlowPts = ko.computed(() => _foreach(self.compressorData(), pt => ({
      x: pt.turbineExpansionRatio,
      y: self.turbo().flow_unit == "phi" ? pt.phi :
         self.turbo().flow_unit == "lb/min" ? _convert(pt.correctedGasFlow__kg_s, "kg/s", "lb/min") :
         self.turbo().flow_unit == "kg/s" ? pt.correctedGasFlow__kg_s :
         pt.phi
    })));
    self.exhaustFlowChart = {
      type: 'scatter',
      data: ko.computed(() => ({
        datasets: [{ label: "Phi", showLine: true, data: self.exhaustFlowPts() }]
      })),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: () => self.flowImg.src ? (self.flowImg.width / self.flowImg.height) : undefined,
        scales: {
          x: {display: () => !self.turbo().flow_range, min: () => self.turbo().flow_range ? self.turbo().flow_range[0] : 1, max: () => self.turbo().flow_range ? self.turbo().flow_range[1] : Math.max(...self.compressorData().map(pt => pt.turbineExpansionRatio)) * 1.1, title: { display: true, text: 'Turbine Expansion Ratio' } },
          y: {display: () => !self.turbo().flow_range, min: () => self.turbo().flow_range ? self.turbo().flow_range[2] : 0, max: () => self.turbo().flow_range ? self.turbo().flow_range[3] : Math.max(...self.compressorData().map(pt => pt.phi)) * 1.1, title: { display: true, text: 'Phi (Turbine Swallowing)' }},
        },
        animation: false,
        animations: {colors: false, x: false},
        transitions: {active: {animation: {duration: 0}}},
        plugins: { legend: { display: () => !self.turbo().flow_range } },
      },
      plugins: [{id: 'flowMapBackground', beforeDraw: (chart) => drawMapBg(chart, self.flowImg, self.turbo().flow_range)}]
    };

    // Boost Curve Data
    self.inputData = ko.observableArray([]);
    self.boostCurvePts = ko.computed(() => _foreach(self.inputData(), pt => { return { x: pt.rpm(), y: pt.boost() }; }));
    self.veCurvePts = ko.computed(() => _foreach(self.inputData(), pt => { return { x: pt.rpm(), y: pt.ve() }; }));
    self.airMassFlowPts = ko.computed(() => _foreach(self.compressorData(), pt => { return { x: pt.rpm, y: pt.compAirMassFlow__lb_min }; }))
    self.inputDataChart = {
      type: 'scatter',
      data: ko.computed(() => ({
        datasets: [
          { label: "Boost", data: self.boostCurvePts(), showLine: true },
          { label: "VE", data: self.veCurvePts(), showLine: true, yAxisID: "y2" },
          { label: "Air Flow", data: self.airMassFlowPts(), showLine: true, yAxisID: "y3" },
        ]
      })),
      options: {
        observeChanges: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'RPM' } },
          y: { min: 0, max: () => parseInt(Math.max(...self.boostCurvePts().map(pt => pt.y))) + 2, startAtZero: true, title: { display: true, text: () => `Boost [${self.inputBoostPressureUnit()}]` } },
          y2: { min: 0, max: () => parseInt(Math.max(100 / 1.1, ...self.veCurvePts().map(pt => pt.y)) * 1.1), startAtZero: true, title: { display: true, text: 'Volumetric Efficiency [%]' }, position: 'right' },
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
      data: ko.computed(() => ({
        datasets: [
          { label: "Power", data: self.powerCurvePtsPower(), showLine: true, yAxisID: "y" },
          { label: "Torque", data: self.powerCurvePtsTorque(), showLine: true, yAxisID: "y2" },
        ]
      })),
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

    // Data Verification
    self.warnings = ko.computed(() => {
      let turbo = self.turbo();
      let input = self.inputData();
      // let data = self.compressorData();
      let compPts = self.compressorChartPts();
      let flowPts = self.exhaustFlowPts();
      let warnings = [];

      for (let i = 1; i < input.length; i++) {
        if (input[i-1].rpm() > input[i].rpm()) {
          warnings.push("RPMs should be increasing");
          break;
        }
      }
      if (input.filter(pt => input.filter(e => e.rpm() == pt.rpm()).length > 1).length)
        warnings.push("Duplicate RPM points in input data!")
      if (compPts.filter(pt => pt.x > turbo.map_range[1]).length)
        warnings.push("Air flow exceeds turbo compressor map!")
      if (compPts.filter(pt => pt.y > turbo.map_range[3]).length)
        warnings.push("Pressure ratio exceeds turbo compressor map!")
      if (turbo.flow_range) {
        if (flowPts.filter(pt => pt.x > turbo.flow_range[1]).length)
          warnings.push("Exhaust pressure exceeds turbine map!")
        if (flowPts.filter(pt => pt.y > turbo.flow_range[3]).length)
          warnings.push("Exhaust flow exceeds turbine map! ")
      }

      return warnings;
    });

    // Main Update Functions
    self.updateCompressorMap = function () {
      self.compressorData(self.updateCompressorMapPoints());
    };

    self.updateCompressorMapPoints = function () {
      var i_ = 0;
      let pts = [];
      let ambientTemp__K = self.ambientTemp_K();
      let ambientPressure__Pa = self.ambientPressure_Pa();

      for (let pt of self.inputData()) {
        let rpm = pt.rpm();
        let boostPressure__Pa = _convert(pt.boost(), self.inputBoostPressureUnit(), "Pa");
        let volumetricEfficiency = pt.ve();
        let wastegateFlowPercent = pt.wg() / 100;
        let intakeRestriction__Pa = _convert(pt.ir(), self.inputRestrictionPressureUnit(), "Pa");
        let intercoolerEfficiency = pt.ie() / 100;
        let intercoolerPressureDrop__Pa = _convert(pt.ipd(), self.inputIntercoolerPressureUnit(), "Pa");
        let compressorEfficiency = pt.ce() / 100;
        let turbineEfficiency = pt.te() / 100;
        let exhaustBackpressure__Pa = _convert(pt.ebp(), self.inputBackpressureUnit(), "Pa");
        let exhGasTemp_K = 1100; // TODO: Estimate based on fuel type and AFR?

        let intakeAirPressure__Pa = ambientPressure__Pa - intakeRestriction__Pa;
        let airFlow__cfm = _convert(self.engineDisplacement_L(), "L", "cuft") * rpm * (volumetricEfficiency / 100) * self.engineType().rpm_factor;
        let compOutletPressure__Pa = intakeAirPressure__Pa + boostPressure__Pa;
        let compPressureRatio = compOutletPressure__Pa / intakeAirPressure__Pa;
        let compOutletTemp__K = (ambientTemp__K * Math.pow(compPressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR) - ambientTemp__K) / compressorEfficiency + ambientTemp__K;

        let compAirFlow__cfm = airFlow__cfm / self.numberOfTurbos();
        let compAirDensity__lb_cuft = _convert(compOutletPressure__Pa / 287.055 / ambientTemp__K, "kg/m^3", "lb/ft^3");
        let compAirMassFlow__lb_min = compAirFlow__cfm * compAirDensity__lb_cuft;

        let compAirMassFlowCorrected__lb_min = compAirMassFlow__lb_min * Math.sqrt(ambientTemp__K / 298.15) * (intakeAirPressure__Pa / 101325);
        let compAirFlowCorrected__cfm = compAirMassFlowCorrected__lb_min / compAirDensity__lb_cuft;

        let manifoldAirTemp__K = compOutletTemp__K - (intercoolerEfficiency * (compOutletTemp__K - ambientTemp__K));
        let manifoldAbosultePressure__Pa = compOutletPressure__Pa - intercoolerPressureDrop__Pa;
        let manifoldPressureRatio = manifoldAbosultePressure__Pa / intakeAirPressure__Pa;
        let manifoldAirDensity__lb_cuft = _convert(manifoldAbosultePressure__Pa / 287.055 / manifoldAirTemp__K, "kg/m^3", "lb/ft^3");

        let fuelMassFlowRate__lb_min = compAirMassFlow__lb_min / pt.afr();
        let fuelVolFlowRate__L_hr = _convert(fuelMassFlowRate__lb_min, "lb/min", "kg/hr") / self.fuelType().density__kg_L;
        let injectorVolFlowRate__L_hr = fuelVolFlowRate__L_hr / self.numberOfCylinders();
        let approxPower__hp = _convert(compAirMassFlow__lb_min, "lb/min", "g/s") * 1.25;
        let approxTorque__ftlb = rpm == 0 ? 0 : approxPower__hp * 5252 / rpm;
        let exhaustMassFlow__kg_s = _convert(compAirMassFlow__lb_min * (1 + 1 / pt.afr()), "lb/min", "kg/s");
        let wastegateMassFlow__kg_s = wastegateFlowPercent * exhaustMassFlow__kg_s;
        let turbineMassFlow__kg_s = exhaustMassFlow__kg_s - wastegateMassFlow__kg_s;

        // Calculate the power required to compress the air to a given pressure ratio
        let compressorShaftPower__kW =
          _convert(compAirMassFlow__lb_min, "lb/min", "kg/s") * SPECIFIC_HEAT_CAPACITY_AIR *
          ambientTemp__K *
          (Math.pow(compPressureRatio, (HEAT_CAPACITY_RATIO_AIR - 1) / HEAT_CAPACITY_RATIO_AIR) - 1) /
          compressorEfficiency;

        // Calculate required turbine expansion ratio for the given compressor shaft power
        let turbineExpansionRatio = 1 / Math.exp(HEAT_CAPACITY_RATIO_EXH * Math.log((
          -compressorShaftPower__kW / turbineMassFlow__kg_s / SPECIFIC_HEAT_CAPACITY_EXH / exhGasTemp_K / turbineEfficiency
        ) + 1) / (HEAT_CAPACITY_RATIO_EXH - 1));

        // Calculate turbine swallowing parameter and corrected exhaust gas mass flowrate
        let exhaustManifoldPressure_Pa = (exhaustBackpressure__Pa + ambientPressure__Pa) * turbineExpansionRatio;
        let phi = turbineMassFlow__kg_s * Math.sqrt(exhGasTemp_K) / (exhaustManifoldPressure_Pa / 1000);
        let correctedGasFlow__kg_s = turbineMassFlow__kg_s * Math.sqrt(exhGasTemp_K / 298.15) * (101325 / exhaustManifoldPressure_Pa);

        pts.push({
          i: i_++,
          rpm: rpm,
          turbineExpansionRatio: turbineExpansionRatio,
          compOutletPressure__Pa: compOutletPressure__Pa,
          compPressureRatio: compPressureRatio,
          exhGasTemp_K: exhGasTemp_K,
          airFlow__cfm: airFlow__cfm,
          compAirFlow__cfm: compAirFlow__cfm,
          compInletAirFlow__m3_s: _convert(compAirFlow__cfm, "cuft/min", "m^3/s"),
          compAirDensity__lb_cuft: compAirDensity__lb_cuft,
          compAirMassFlow__lb_min: compAirMassFlow__lb_min,
          compInletAirMassFlow__kg_s: _convert(compAirMassFlow__lb_min, "lb/min", "kg/s"),
          compAirMassFlowCorrected__lb_min: compAirMassFlowCorrected__lb_min,
          compInletAirMassFlowCorrected__kg_s: _convert(compAirMassFlowCorrected__lb_min, "lb/min", "kg/s"),
          compAirFlowCorrected__cfm: compAirFlowCorrected__cfm,
          compAirFlowCorrected__m3_s: _convert(compAirFlowCorrected__cfm, "cuft/min", "m^3/s"),
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
          exhaustManifoldPressure_Pa: exhaustManifoldPressure_Pa,
          correctedGasFlow__kg_s: correctedGasFlow__kg_s,
          exhaustMassFlow__kg_s: exhaustMassFlow__kg_s,
          wastegateMassFlow__kg_s: wastegateMassFlow__kg_s,
          phi: phi,
        });
      }

      return pts;
    };

    self.updateMapBgs = function () {
      self.mapImg.src = self.turbo().map_img;
      self.flowImg.src = self.turbo().flow_img;
    }

    // Config File Buttons
    self.exportConfig = function () {
      const data = modelToJSON(self);
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "config.json";
      a.click();
      URL.revokeObjectURL(a.href);
    };
    self.loadFromConfig = function (e) {
      const reader = new FileReader();
      reader.onload = (e) => updateFromJSON(self, JSON.parse(e.target.result));
      reader.readAsText(e);
    };
    const configFileUploadButton = $("#configFileUploadButton")
    configFileUploadButton.on("click", () =>
      $("#configFileUpload").trigger('click')
    ).on("drop", (e) => {
      self.loadFromConfig(e.originalEvent.dataTransfer.items[0].getAsFile());
    }).on("dragover", (e) => {
      const fileItems = [...e.originalEvent.dataTransfer.items].filter(
        (item) => item.kind === "file",
      );
      if (fileItems.length == 1) {
        e.preventDefault();
        if (fileItems[0].type == "application/json") {
          e.originalEvent.dataTransfer.dropEffect = "copy";
        } else {
          e.originalEvent.dataTransfer.dropEffect = "none";
        }
      }
    });
    $(window).on("drop", (e) => {
      if ([...e.originalEvent.dataTransfer.items].some((item) => item.kind === "file")) {
        e.preventDefault();
      }
    }).on("dragover", (e) => {
      const fileItems = [...e.originalEvent.dataTransfer.items].filter(
        (item) => item.kind === "file",
      );
      if (fileItems.length > 0) {
        e.preventDefault();
        if (!configFileUploadButton[0].contains(e.target)) {
          e.originalEvent.dataTransfer.dropEffect = "none";
        }
      }
    });

    // Initialize Boost Curve
    self.inputData(DEFAULTS.inputData.map(pt => ko.mapping.fromJS(pt)));
    updateFromUrlParams(self);

    // Setup Subscriptions
    self.update = function() {
      updateUrlFromModel(self);
      self.updateCompressorMap()
    };
    [
      self.engineType,
      self.engineDisplacementRaw,
      self.engineDisplacementUnit,
      self.numberOfTurbos,
      self.turbo,
      self.fuelType,
      self.numberOfCylinders,
      self.altitudeRaw,
      self.altitudeUnit,
      self.ambientTempRaw,
      self.ambientTempUnit,
      self.ambientPressureDisplayUnit,
      self.inputBoostPressureUnit,
      self.inputRestrictionPressureUnit,
      self.inputIntercoolerPressureUnit,
      self.inputBackpressureUnit,
    ].forEach(e => e.subscribe(() => self.update()));
    self.inputData.subscribe(() => self.update(), self, "arrayChange");
    ko.utils.arrayForEach(self.inputData(), (item) => {
        Object.values(item).forEach(e => e instanceof Function ? e.subscribe(() => self.update()) : null);
    });
    self.turbo.subscribe(self.updateMapBgs);

    // Initial Calculation
    self.updateMapBgs();
    self.updateCompressorMap();
  }
}

ko.applyBindings(new ViewModel());
