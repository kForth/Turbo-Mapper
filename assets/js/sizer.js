var canvas = undefined;
var ctx = undefined;
var mapImg = undefined;

var mouseMode = undefined;

$("#selectOrigin").click(() => {
    mouseMode = "origin";
    $("#map").css('cursor', 'crosshair');
})

$("#selectMax").click(() => {
    mouseMode = "max";
    $("#map").css('cursor', 'crosshair');
})

$("#map").click((e) => {
    console.log(e);
    let rect = e.target.getBoundingClientRect();
    let scale = rect.width / mapImg.width;
    let x = (e.clientX - rect.left) / scale;
    let y = (rect.bottom - e.clientY) / scale;
    console.log(x, y, scale, mapImg.width);
    if(mouseMode){
        if(mouseMode === 'origin') {
            $("#bbox_xmin").val(x)
            $("#bbox_ymin").val(y)
        }
        else if(mouseMode === 'max') {
            $("#bbox_xmax").val(x)
            $("#bbox_ymax").val(y)
        }   
        mouseMode = undefined;
        $("#map").css('cursor', 'inherit');

        redraw();
    }
})

function loadImg(url){
    mapImg.onload = () => {
        // canvas.width = mapImg.width;
        canvas.height = canvas.width * (mapImg.height / mapImg.width);
        $(canvas).css('background-image', 'url("' + url + '")');

        $("#bbox_xmax").val(mapImg.width);
        $("#bbox_xmax").attr('max', mapImg.width);
        $("#bbox_ymax").val(mapImg.height);
        $("#bbox_ymax").attr('max', mapImg.height);

        redraw();
    };
    mapImg.src = url;
}

function redraw(){
    let scale = canvas.width / mapImg.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.rect(
        $("#bbox_xmin").val() * scale,
        canvas.height - $("#bbox_ymax").val() * scale,
        ($("#bbox_xmax").val() - $("#bbox_xmin").val()) * scale,
        ($("#bbox_ymax").val() - $("#bbox_ymin").val()) * scale
    );
    ctx.stroke();

    let x_scale = ($("#val_xmax").val() - $("#val_xmin").val()) / ($("#bbox_xmax").val() - $("#bbox_xmin").val())
    let y_scale = ($("#val_ymax").val() - $("#val_ymin").val()) / ($("#bbox_ymax").val() - $("#bbox_ymin").val())

    let x_min = $("#val_xmin").val() - x_scale * $("#bbox_xmin").val();
    let x_max = x_scale * mapImg.width + x_min;

    let y_min = $("#val_ymin").val() - y_scale * $("#bbox_ymin").val();
    let y_max = y_scale * mapImg.height + y_min;
    
    let output = `
- name: "${$("#name").val()}"
  map_img: "${mapImg.src.replace('http://localhost:4000/assets/img/', '')}"
  map_range: [${x_min}, ${x_max}, ${y_min}, ${y_max}]
  map_unit: ${$("#x_units").val()}`;
    $("#output").text(output);
}

$(window).on('load', (e) => {
    canvas = $("#map")[0];
    ctx = canvas.getContext("2d");
    mapImg = new Image;
    loadImg("maps/td04h-16t.gif");
});

$("#load_map_img").on("click", (e) => {
    var newUrl = window.prompt("Enter Map Image URL:");
    loadImg(newUrl);
});

$("#bbox_xmin, #bbox_xmax, #bbox_ymin, #bbox_ymax").on('change', (e) => {
    redraw();
});
$("#val_xmin, #val_xmax, #val_ymin, #val_ymax").on('change', (e) => {
    redraw();
});