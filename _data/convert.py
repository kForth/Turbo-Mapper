maps = [
    {
        "name": "GTX3576R",
        "bbox": [62, 476, 53, 576],
        "vals": [0, 80, 1, 4.5]
    },
    {
        "name": "GTX3071R",
        "bbox": [61, 479, 51, 579],
        "vals": [0, 70, 1, 4]
    },
    {
        "name": "G40-900",
        "bbox": [63, 481, 51, 580],
        "vals": [0, 100, 1, 5]
    },
    {
        "name": "K24",
        "bbox": [44, 348, 48, 329],
        "vals": [0, 19.8416, 1, 2.2]
    }
]

for m in maps:
    b = map(float, m["bbox"])
    v = map(float, m["vals"])
    xs = (v[1] - v[0]) / (b[1] - b[0])
    ys = (v[3] - v[2]) / (b[3] - b[2])
    ranges = [
        v[0] - xs * b[0],
        v[1],
        v[2] - ys * b[2],
        0,
    ]
    print("map_range: [" + ", ".join(map(str, ranges)) + "]")