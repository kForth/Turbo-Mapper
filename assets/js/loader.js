// URL Parameter Loader
function updateUrlFromModel (model) {
  let params = new URLSearchParams();

  function setIfChanged(key, accessor, selector) {
    let current = accessor(model)();
    let def = accessor(DEFAULTS);
    if (selector instanceof Function) {
      current = selector(current);
      def = selector(def);
    }
    if (current != def) params.set(key, current);
  }

  setIfChanged("tn", e => e.turbo, e => e.name);
  setIfChanged("et", e => e.engineType, e => e.name);
  setIfChanged("ft", e => e.fuelType, e => e.name);
  setIfChanged("nt", e => e.numberOfTurbos);
  setIfChanged("ed", e => e.engineDisplacementRaw);
  setIfChanged("edu", e => e.engineDisplacementUnit);
  setIfChanged("nc", e => e.numberOfCylinders);
  setIfChanged("alt", e => e.altitudeRaw);
  setIfChanged("altu", e => e.altitudeUnit);
  setIfChanged("at", e => e.ambientTempRaw);
  setIfChanged("atu", e => e.ambientTempUnit);
  setIfChanged("apu", e => e.ambientPressureDisplayUnit, e => e.value);
  setIfChanged("ibu", e => e.inputBoostPressureUnit);
  setIfChanged("iru", e => e.inputRestrictionPressureUnit);
  setIfChanged("ipu", e => e.inputIntercoolerPressureUnit);
  setIfChanged("bpu", e => e.inputBackpressureUnit);
  setIfChanged("iar", e => e.inputAirFuelRatioUnit);

  function setIfParamsChanged(key, accessor) {
    const current = model.inputData().map(e => accessor(e)()).join(" ");
    const def = DEFAULTS.inputData.map(accessor).join(" ");
    if (current != def) params.set(key, current);
  }
  Object.keys(DEFAULTS.inputData[0]).forEach(e => setIfParamsChanged(e, pt => pt[e]))

  const paramStr = params.toString();
  history.replaceState(null, "", paramStr.length ? ("?" + paramStr) : window.location.pathname);
};

function updateFromUrlParams (model) {
  let params = new URLSearchParams(window.location.search);
  function updateFromList(key, setter, list, field) {
    if (params.has(key)) {
      let fieldVal = params.get(key);
      let val = list.find(t => t[field] == fieldVal);
      if (val) setter(val);
    }
  }
  function updateParam(key, setter, converter){
    if (params.has(key))
      setter(converter ? converter(params.get(key)) : params.get(key));
  }

  updateFromList("tn", model.turbo, model.turboList, "name");
  updateFromList("et", model.engineType, model.engineTypeList, "name");
  updateFromList("ft", model.fuelType, model.fuelTypeList, "name");
  updateFromList("apu", model.ambientPressureDisplayUnit, UNITS.pressure, "value");

  updateParam("nt", model.numberOfTurbos, parseInt);
  updateParam("ed", model.engineDisplacementRaw, parseFloat);
  updateParam("edu", model.engineDisplacementUnit);
  updateParam("nc", model.numberOfCylinders, parseInt);
  updateParam("alt", model.altitudeRaw, parseFloat);
  updateParam("altu", model.altitudeUnit);
  updateParam("at", model.ambientTempRaw, parseFloat);
  updateParam("atu", model.ambientTempUnit);
  updateParam("ibu", model.inputBoostPressureUnit);
  updateParam("iru", model.inputRestrictionPressureUnit);
  updateParam("ipu", model.inputIntercoolerPressureUnit);
  updateParam("bpu", model.inputBackpressureUnit);
  updateParam("iar", model.inputAirFuelRatioUnit);

  let newinputData = model.inputData();
  let data = {};
  Object.keys(newinputData[0]).forEach(e =>
    data[e] = params.has(e) ? params.get(e).split(" ").map(v => parseFloat(v)) : []
  );
  for (let i = 0; i < newinputData.length; i++) {
    Object.keys(newinputData[i]).forEach(e => {
      if (data[e] && data[e][i] !== undefined) newinputData[i][e](data[e][i]);
    });
  }
  model.inputData(newinputData);
};

// JSON Loader
function modelToJSON (model) {
  let data = {
    turbo: model.turbo().name,
    engineType: model.engineType().name,
    fuelType: model.fuelType().name,
    numberOfTurbos: model.numberOfTurbos(),
    engineDisplacementRaw: model.engineDisplacementRaw(),
    engineDisplacementUnit: model.engineDisplacementUnit(),
    numberOfCylinders: model.numberOfCylinders(),
    altitudeRaw: model.altitudeRaw(),
    altitudeUnit: model.altitudeUnit(),
    ambientTempRaw: model.ambientTempRaw(),
    ambientTempUnit: model.ambientTempUnit(),
    ambientPressureDisplayUnit: model.ambientPressureDisplayUnit().value,
    inputBoostPressureUnit: model.inputBoostPressureUnit(),
    inputRestrictionPressureUnit: model.inputRestrictionPressureUnit(),
    inputIntercoolerPressureUnit: model.inputIntercoolerPressureUnit(),
    inputBackpressureUnit: model.inputBackpressureUnit(),
    inputAirFuelRatioUnit: model.inputAirFuelRatioUnit(),
    resultPressureUnit: model.resultPressureUnit().value,
    resultAirTemperatureUnit: model.resultAirTemperatureUnit().value,
    resultAirDensityUnit: model.resultAirDensityUnit().value,
    resultAirMassFlowUnit: model.resultAirMassFlowUnit().value,
    resultAirVolFlowUnit: model.resultAirVolFlowUnit().value,
    resultFuelMassFlowUnit: model.resultFuelMassFlowUnit().value,
    resultFuelVolFlowUnit: model.resultFuelVolFlowUnit().value,
    resultExhGasMassFlowUnit: model.resultExhGasMassFlowUnit().value,
    resultPowerUnit: model.resultPowerUnit().value,
    resultTorqueUnit: model.resultTorqueUnit().value,

    inputData: model.inputData().map(pt => ko.mapping.toJS(pt))
  };
  return data;
};

function updateFromJSON (model, json) {
  function updateFromList(key, list, field) {
    if (json[key] !== undefined) {
      let val = list.find(t => t[field] == json[key]);
      if (val) model[key](val);
    }
  }
  function updateIfSet(key) {
    if (json[key] !== undefined) model[key](json[key]);
  }

  updateFromList("turbo", model.turboList, "name");
  updateFromList("engineType", model.engineTypeList, "name");
  updateFromList("fuelType", model.fuelTypeList, "name");
  updateFromList("ambientPressureDisplayUnit", UNITS.pressure, "value");
  updateIfSet("numberOfTurbos");
  updateIfSet("engineDisplacementRaw");
  updateIfSet("engineDisplacementUnit");
  updateIfSet("numberOfCylinders");
  updateIfSet("altitudeRaw");
  updateIfSet("altitudeUnit");
  updateIfSet("ambientTempRaw");
  updateIfSet("ambientTempUnit");
  updateIfSet("inputBoostPressureUnit");
  updateIfSet("inputRestrictionPressureUnit");
  updateIfSet("inputIntercoolerPressureUnit");
  updateIfSet("inputBackpressureUnit");
  updateIfSet("inputAirFuelRatioUnit");
  updateIfSet("resultPressureUnit");
  updateIfSet("resultAirTemperatureUnit");
  updateIfSet("resultAirDensityUnit");
  updateIfSet("resultAirMassFlowUnit");
  updateIfSet("resultAirVolFlowUnit");
  updateIfSet("resultFuelMassFlowUnit");
  updateIfSet("resultFuelVolFlowUnit");
  updateIfSet("resultExhGasMassFlowUnit");
  updateIfSet("resultPowerUnit");
  updateIfSet("resultTorqueUnit");

  if (json.inputData) {
    const data = DEFAULTS.inputData.map(e => ko.mapping.fromJS(e));
    for(let i = 0; i < data.length; i++) {
      Object.keys(json.inputData[i]).forEach(e => { data[i][e](json.inputData[i][e]); });
    }
    model.inputData(data);
  }
};
