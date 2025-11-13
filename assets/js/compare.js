class ViewModel {
  constructor() {
    var self = this;

    self.canvas = $("#map")[0];

    self.turboList = TURBOS.filter(e => e.map_img && e.map_img.length).map((e) => {
      // Convert volumetric units to 'lb/min' mass flow
      if (e.map_unit == "cuft/min") {
        e.map_range[0] = e.map_range[0] * 0.07647;
        e.map_range[1] = e.map_range[1] * 0.07647;
        e.map_unit = "lb/min";
      } else if (e.map_unit == "m^3/s") {
        e.map_range[0] = e.map_range[0] * 2.7005;
        e.map_range[1] = e.map_range[1] * 2.7005;
        e.map_unit = "lb_min";
      }
      return e;
    });

    self.selected = ko.observableArray([]);
    self.selected.subscribe(() => self.redraw());

    self.toggleSelected = function() {
      if(self.selected.indexOf(this) >= 0)
        self.selected.remove(this)
      else
        self.selected.push(this);
      return true;
    };

    self.redraw = async function () {
      let canvas = self.canvas;
      let ctx = canvas.getContext("2d");

      if (self.selected().length == 0) {
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        return;
      }

      // Load images and find largest x and y axis ranges
      let imgs = [];
      let x_range = undefined;
      let x_wd = 0;
      let x_unit = undefined;
      let y_range = undefined;
      let y_wd = 0;
      for (let e of self.selected()) {
        // let map = new Image;
        // map.src = e.map_img;
        let map = await loadImageAsync(e.map_img);

        const x_ = e.map_range[1] - e.map_range[0];
        if (x_ > x_wd){
          x_wd = x_;
          x_range = [e.map_range[0], e.map_range[1]];
          x_unit = e.map_unit;
        }
        const y_ = e.map_range[3] - e.map_range[2];
        if (y_ > y_wd){
          y_wd = y_;
          y_range = [e.map_range[2], e.map_range[3]];
        }
        imgs.push([e, map]);
      }

      // Resize canvas
      const maxWd = Math.max(...imgs.map(([_, map]) => map.width));
      const maxHt = Math.max(...imgs.map(([_, map]) => map.height));
      $(canvas).attr("width", parseInt(maxWd));
      $(canvas).attr("height", parseInt(maxHt));
      canvas.width = parseInt(maxWd);
      canvas.height = parseInt(maxHt);

      // Fill with white
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fill();

      // Draw images overlapped and aligned, then collect img data.
      let imgData = [];
      for (let [e, img2] of imgs){
        let xr = [e.map_range[0], e.map_range[1]];
        if (x_unit != e.map_unit){
          xr[0] = _convert(xr[0], e.map_unit, x_unit)
          xr[1] = _convert(xr[1], e.map_unit, x_unit)
        }
        const wd = (xr[1] - xr[0]) / x_wd * canvas.width;
        const x_pos = (xr[0] - x_range[0]) / x_wd * canvas.width;

        const y_pos = ((y_range[1] - e.map_range[3]) / y_wd * canvas.height);
        const ht = (e.map_range[3] - e.map_range[2]) / y_wd * canvas.height;

        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        ctx.drawImage(img2, x_pos, y_pos, wd, ht);

        imgData.push(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      }

      // Combine images
      const resultImageData = ctx.createImageData(canvas.width, canvas.height);
      const resultData = resultImageData.data;
      for (let i = 0; i < imgData[0].length; i += 4) {
        resultData[i] = Math.min(255, ...imgData.map(e => e[i])); // Red
        resultData[i + 1] = Math.min(255, ...imgData.map(e => e[i + 1])); // Green
        resultData[i + 2] = Math.min(255, ...imgData.map(e => e[i + 2])); // Blue
        resultData[i + 3] = Math.min(255, ...imgData.map(e => e[i + 3])); // Alpha
      }
      ctx.putImageData(resultImageData, 0, 0);
    }
  }
}

ko.applyBindings(new ViewModel());
