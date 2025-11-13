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
        let formattedValue = precision == 0 ? parseInt(convertedVal) : parseFloat(convertedVal).toFixed(precision);  // Could use toPrecision, but don't like scientific
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

function drawMapBg(chart, img, bounds) {
  if (!bounds) return;
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

    const pt = val_to_px(chart, bounds[0], bounds[2], chartRange);
    const pt2 = val_to_px(chart, bounds[1], bounds[3], chartRange);
    const im_w = pt2[0] - pt[0];
    const im_h = pt2[1] - pt[1];
    ctx.drawImage(img, pt[0], chart.height - pt[1] - im_h, im_w, im_h);
  } else {
    let canvas = $(chart.canvas);
    let wd = canvas.parent().width();
    canvas.attr("width", parseInt(wd))
            .attr("height", parseInt(wd * (img.height / img.width)));
    img.onload = () => chart.draw();
  }
};

function val_to_px(c, x, y, range) {
  let minX = range[0];
  let maxX = range[1];
  let minY = range[2];
  let maxY = range[3];
  return [
    (x - minX) / (maxX - minX) * c.width,
    (y - minY) / (maxY - minY) * c.height
  ];
};

// Collapse Carets
$('.collapse').on('show.bs.collapse', function () {
  $(`*[data-bs-target="#${$(this).attr("id")}"] .caret`).removeClass("flip");
});
$('.collapse').on('hide.bs.collapse', function () {
  $(`*[data-bs-target="#${$(this).attr("id")}"] .caret`).addClass("flip");
});
