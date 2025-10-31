const UNITS = {
  linear: [
    { value: "in", label: "in", precision: 1 },
    { value: "ft", label: "ft", precision: 1 },
    { value: "mm", label: "mm", precision: 1, default: true },
    { value: "cm", label: "cm", precision: 1 },
    { value: "dm", label: "dm", precision: 1 },
    { value: "m", label: "m", precision: 1 },
  ],
  area: [
    { value: "mm^2", label: "mm²", precision: 1 },
    { value: "cm^2", label: "cm²", precision: 1 },
    { value: "dm^2", label: "dm²", precision: 1 },
    { value: "m^2", label: "m²", precision: 1 },
    { value: "in^2", label: "in²", precision: 1, default: true },
    { value: "ft^2", label: "ft²", precision: 1 },
  ],
  volume: [
    { value: "dm^3", label: "dm³", precision: 1 },
    { value: "mL", label: "mL", precision: 1 },
    { value: "L", label: "L", precision: 1, default: true },
    { value: "in^3", label: "cu.in", precision: 1 },
    { value: "ft^3", label: "cu.ft", precision: 1 },
  ],
  pressure: [
    { value: "psi", label: "PSI", precision: 1, default: true },
    { value: "bar", label: "Bar", precision: 2 },
    { value: "kPa", label: "kPa", precision: 1 },
    { value: "Pa", label: "Pa", precision: 0 },
  ],
  time: [
    { value: "ms", label: "ms", precision: 1 },
    { value: "sec", label: "sec", precision: 1, default: true },
    { value: "min", label: "min", precision: 1 },
    { value: "hr", label: "hr", precision: 1 },
  ],
  frequency: [
    { value: "rpm", label: "RPM", precision: 1, default: true },
    { value: "Hz", label: "Hz", precision: 1 },
  ],
  temperature: [
    { value: "degC", label: "°C", precision: 1, default: true },
    { value: "degF", label: "°F", precision: 1 },
  ],
  density: [
    { value: "lb/ft^3", label: "lb/cu.ft", precision: 3 },
    { value: "lb/in^3", label: "lb/cu.in", precision: 7 },
    { value: "kg/m^3", label: "kg/m³", precision: 2 },
    { value: "g/cm^3", label: "g/cm³", precision: 5, default: true },
  ],
  massFlow: [
    { value: "lb/min", label: "lb/min", precision: 1 },
    { value: "kg/s", label: "kg/s", precision: 1, default: true },
  ],
  volumetricFlow: [
    { value: "ft^3/min", label: "CFM", precision: 1,default: true },
    { value: "L/h", label: "Lph", precision: 0 },
    { value: "in^3/sec", label: "in³/s", precision: 0,default: true },
    { value: "cm^3/min", label: "cm/m", precision: 0 },
    { value: "m^3/s", label: "m³/s", precision: 3 },
  ],
};
