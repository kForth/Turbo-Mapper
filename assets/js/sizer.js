class ViewModel {
  constructor() {
    var self = this;

    self.canvas = $("#map")[0];
    self.mapImg = new Image;

    self.mapType = ko.observable("Compressor Map")
    self.turboList = ko.computed(() => TURBOS.filter(t =>
      (self.mapType() === "Compressor Map") ?
      (t.map_img && (!t.map_range || !t.map_range.length)) :
      (t.flow_img && (!t.flow_range || !t.flow_range.length))
    ));

    self.turbo = ko.observable();
    self.turbo.subscribe((t) => {
      if(self.mapType() === "Compressor Map")
        self.imgUrl(t.map_img);
      else
        self.imgUrl(t.flow_img);
    });
    self.imgUrl = ko.observable();
    self.mouseMode = ko.observable(undefined);

    self.minPosX = ko.observable(0);
    self.maxPosX = ko.observable(1);
    self.minPosY = ko.observable(0);
    self.maxPosY = ko.observable(1);

    self.minValX = ko.observable(0);
    self.maxValX = ko.observable(100);
    self.minValY = ko.observable(1);
    self.maxValY = ko.observable(4);

    self.xScale = ko.computed(() => (self.maxValX() - self.minValX()) / (self.maxPosX() - self.minPosX()));
    self.yScale = ko.computed(() => (self.maxValY() - self.minValY()) / (self.maxPosY() - self.minPosY()));

    self.imgMinX = ko.computed(() => self.minValX() - self.xScale() * self.minPosX());
    self.imgMaxX = ko.computed(() => self.xScale() * self.mapImg.width + self.imgMinX());
    self.imgMinY = ko.computed(() => self.minValY() - self.yScale() * self.minPosY());
    self.imgMaxY = ko.computed(() => self.yScale() * self.mapImg.height + self.imgMinY());

    self.mapRange = ko.computed(() => [self.imgMinX(), self.imgMaxX(), self.imgMinY(), self.imgMaxY()]);


    self.loadNewImg = function() {
      var newUrl = window.prompt("Enter Map Image URL:");
      self.imgUrl(newUrl);
    }

    self.redraw = function () {
      let canvas = self.canvas;
      let mapImg = self.mapImg;

      let ctx = canvas.getContext("2d");
      let scale = canvas.width / mapImg.width;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.rect(
          self.minPosX() * scale,
          canvas.height - self.maxPosY() * scale,
          (self.maxPosX() - self.minPosX()) * scale,
          (self.maxPosY() - self.minPosY()) * scale
      );
      ctx.stroke();
    }

    self.handleCanvasClick = function (_, e) {
      if(self.mouseMode() != "none" || e.shiftKey || e.ctrlKey){
        let rect = e.target.getBoundingClientRect();
        let scale = rect.width / self.mapImg.width;
        let x = (e.clientX - rect.left) / scale;
        let y = (rect.bottom - e.clientY) / scale;
          if(self.mouseMode() === "origin" || e.shiftKey) {
              self.minPosX(x);
              self.minPosY(y);
          }
          else if(self.mouseMode() === "max" || e.ctrlKey) {
              self.maxPosX(x);
              self.maxPosY(y);
          }
          self.mouseMode("none");
          self.redraw();
      }
    };

    self.clearPos = function() {
      self.minPosX(0);
      self.minPosY(0);
      self.maxPosX(self.mapImg.width);
      self.maxPosY(self.mapImg.height);
      self.redraw();
    };

    self.imgUrl.subscribe((url) => {
      self.updateUrlParams();
      self.mapImg.onload = () => {
          self.canvas.height = self.canvas.width * (self.mapImg.height / self.mapImg.width);
          // $(self.canvas).css('background-image', 'url("' + url + '")');
          self.redraw();
      };
      self.mapImg.src = url;
    });

    [self.minPosX, self.maxPosX, self.minPosY, self.maxPosY].forEach(e => e.subscribe(self.redraw));

    // URL Parameters
    self.updateUrlParams = function () {
      let params = new URLSearchParams();
      params.set("img", self.imgUrl());
      params.set("px0", self.minPosX());
      params.set("px1", self.maxPosX());
      params.set("py0", self.minPosY());
      params.set("py1", self.maxPosY());
      params.set("vx0", self.minValX());
      params.set("vx1", self.maxValX());
      params.set("vy0", self.minValY());
      params.set("vy1", self.maxValY());
      history.replaceState(null, "", "?" + params.toString());
    };
    [
      self.imgUrl,
      self.minPosX,
      self.maxPosX,
      self.minPosY,
      self.maxPosY,
      self.minValX,
      self.maxValX,
      self.minValY,
      self.maxValY,
    ].forEach(e => e.subscribe(self.updateUrlParams));

    self.loadFromUrlParams = function () {
      let params = new URLSearchParams(window.location.search);
      if (params.has("img")) self.imgUrl(params.get("img"));
      if (params.has("px0")) self.minPosX(parseFloat(params.get("px0")));
      if (params.has("px1")) self.maxPosX(parseFloat(params.get("px1")));
      if (params.has("py0")) self.minPosY(parseFloat(params.get("py0")));
      if (params.has("py1")) self.maxPosY(parseFloat(params.get("py1")));
      if (params.has("vx0")) self.minValX(parseFloat(params.get("vx0")));
      if (params.has("vx1")) self.maxValX(parseFloat(params.get("vx1")));
      if (params.has("vy0")) self.minValY(parseFloat(params.get("vy0")));
      if (params.has("vy1")) self.maxValY(parseFloat(params.get("vy1")));
    };
    self.loadFromUrlParams();
  }
}

ko.applyBindings(new ViewModel());
