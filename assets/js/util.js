ko.bindingHandlers.fileUpload = {
  init: function (element, valueAccessor) {
    $(element).on("change", function () {
      valueAccessor()(element.files[0]);
    });
  },
  update: function (element, valueAccessor) {
    if (ko.unwrap(valueAccessor()) === null) {
      $(element).wrap("<form>").closest("form").get(0).reset();
      $(element).unwrap();
    }
  },
};

ko.bindingHandlers.numeric = {
    update: function(element, valueAccessor, allBindings) {
        let value = ko.unwrap(valueAccessor());
        let precision = ko.unwrap(allBindings.get('precision')) || 1; // Default to 1 decimal places
        let formattedValue = parseFloat(value).toFixed(precision);
        if(element.tagName.toLowerCase() == "input")
          ko.applyBindingsToNode(element, { value: formattedValue });
        else
          ko.applyBindingsToNode(element, { text: formattedValue });
    }
};

ko.bindingHandlers.converted = {
    update: function(element, valueAccessor, allBindings) {
        let value = ko.unwrap(valueAccessor());
        let fromUnit = ko.unwrap(allBindings.get('from'));
        let toUnit = ko.unwrap(allBindings.get('to'));
        let convertedVal = _convert(value, fromUnit, toUnit)
        let precision = ko.unwrap(allBindings.get('precision')) || 1; // Default to 1 decimal places
        let formattedValue = parseFloat(convertedVal).toFixed(precision);
        if(element.tagName.toLowerCase() == "input")
          ko.applyBindingsToNode(element, { value: formattedValue });
        else
          ko.applyBindingsToNode(element, { text: formattedValue });
    }
};

function _convert(v, from, to){
    return math.unit(parseFloat(v), from).toNumber(to);
}
function _foreach(arr, fn) {
    return ko.utils.arrayMap(arr, fn)
}
