const TURBOS = [
  {
    name: "GBC37-900 67MM",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2023/02/GBC37-900-Comp-Map--scaled.jpg",
    map_range: [-14.522292993630574, 102.60721972034236, 0.46240372213539027, 5.278839962321797],
    map_unit: "lb_min"
  },
  {
    name: "G30-900 62mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/G30-900-35-900-Comp-Map-kg-sec-scaled.jpg",
    map_range: [-14.122340425531913, 95.9202137399227, 0.5991849881090541, 4.044098655732842],
    map_unit: "lb_min"
  },
  {
    name: "G30-770 58mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/G30-770-Comp-Map-kg-sec-scaled.jpg",
    map_range: [-12.397350993377481, 85.02958143625827, 0.602697841112418, 4.049774038095766],
    map_unit: "lb_min"
  },
  // Bad img link on garrett website
  // {
  //   name: "G30-660 54mm",
  //   map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/G25-660-Comp-Map-kg-sec-scaled.jpg",
  //   map_range: [-9.671052631578949, 75.01666741622124, 0.6258296729123445, 4.045014087489065],
  //   map_unit: "lb_min"
  // },
  {
    name: "G25-660 54mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/G25-660-Comp-Map-kg-sec-scaled.jpg",
    map_range: [-9.79150167606058, 75.14207839405213, 0.6226354665507113, 4.0482161502295595],
    map_unit: "lb_min"
  },
  {
    name: "G25-550 48mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/G25-550-Comp-Map-kg-sec-scaled.jpg",
    map_range: [-8.192161820480404, 61.5524658511773, 0.5900502573173779, 4.209551591914949],
    map_unit: "lb_min"
  },
  {
    name: "GT3582R",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GT3582-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-10.760351011115905, 81.53241433941736, 0.5607368265137205, 4.568076108452972],
    map_unit: "lb_min"
  },
  {
    name: "GTW3476R 58MM",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTW3476-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-11.640211640211641, 85.65784918568121, 0.5799949454073912, 4.570699297735423],
    map_unit: "lb_min"
  },
  {
    name: "GTW3684R 62MM",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTW3684-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-12.126315468236019, 84.65965030067845, 0.5789842506195657, 4.544993650427752],
    map_unit: "lb_min"
  },
  {
    name: "GTW3884R 62mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTW3884-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-13.561103409755875, 107.26237553961175, 0.640885483715242, 4.0354207830478455],
    map_unit: "lb_min"
  },
  {
    name: "GTX3071R",
    map_img: "/img/maps/GTX3071R.jpg",
    map_range: [-10.432692307692308, 73.70192307692308, 0.7159090909090908, 4.039772727272727],
    map_unit: "lb_min"
  },
  {
    name: "GTX3076R GEN II 58mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTX3076R-G2-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-12.542819499341238, 84.37066401103426, 0.5468347492176978, 4.541684857131669],
    map_unit: "lb_min"
  },
  /// Bad img links on website
  // {
  //   name: "GTX3576R GEN II 58mm",
  //   map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTX3076R-G2-Comp-Map-Kg-Sec-scaled.jpg",
  //   map_range: [-12.542819499341238, 84.37066401103426, 0.5462691189776211, 4.54610550512389],
  //   map_unit: "lb_min"
  // },
  {
    name: "GTX3582R GEN II 66mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTX3582R-G2-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-11.417910447761193, 91.50746359753964, 0.5893899745377033, 4.559493953506346],
    map_unit: "lb_min"
  },
  {
    name: "GTX3584RS 67mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GTX3584R-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-13.83812010443864, 106.19669383873205, 0.6015003620363586, 4.544735278079658],
    map_unit: "lb_min"
  },
  {
    name: "GT2860RS",
    map_img: "/img/maps/GT2860RS-Comp-Map-Kg-Sec-scaled.webp",
    flow_img: "/img/flows/Turbine-Flow-Maps-GT28-scaled.webp",
    map_range: [-6.059050064184852, 41.15361616455392, 0.7684046900850208, 3.023531455370124],
    map_unit: "lb_min"
  },
  {
    name: "GT42 56T",
    map_img: "/img/maps/gt42-56trim-cfm.gif",
    map_range: [-19.852800000000002, 121.5232, 0.5714285714285714, 5.0928571428571425],
    // map_range: [-264, 1616, 0.5714285714285714, 5.0928571428571425],
    map_unit: "cfm"
  },
  {
    name: "GBC35-700 58MM",
    map_img: "/img/maps/GBC35-700-Conmpressor-Map-scaled.webp",
    map_range: [-10.348258706467663, 81.1409626671331, 0.504138563217669, 5.207467897427286],
    map_unit: "lb_min"
  },
  {
    name: "GT42 53T",
    map_img: "/img/maps/gt42-53trim-cfm.gif",
    map_range: [-19.852800000000002, 121.5232, 0.5714285714285714, 5.0928571428571425],
    // map_range: [-264, 1616, 0.5706618962432917, 5.100178890876565],
    map_unit: "cfm"
  },
  {
    name: "GT35 52T",
    map_img: "/img/maps/gt35-52trim-cfm.gif",
    map_range: [-10.125131195335277, 61.97807580174926, 0.7428571428571429, 3.455714285714286],
    // map_range: [-135.38461538461536, 828.7179487179486, 0.7428571428571429, 3.455714285714286],
    map_unit: "cfm"
  },
  {
    name: "GT35 48T",
    map_img: "/img/maps/gt35-48trim-cfm.gif",
    map_range: [-8.973953488372091, 54.93147286821705, 0.7428571428571429, 3.455714285714286],
    // map_range: [-117.26804123711341, 730.6701030927835, 0.7428571428571429, 3.455714285714286],
    map_unit: "cfm"
  },
  {
    name: "GT28RS",
    map_img: "/img/maps/gt28rs-62trim-cfm.gif",
    map_range: [-8.973953488372091, 54.93147286821705, 0.7428571428571429, 3.455714285714286],
    // map_range: [-117.26804123711341, 730.6701030927835, 0.7428571428571429, 3.455714285714286],
    map_unit: "cfm"
  },
  {
    name: "G40-900",
    map_img: "/img/maps/G40-900.jpg",
    map_range: [-14.832535885167465, 104.78468899521532, 0.6136363636363636, 5.037878787878788],
    map_unit: "lb_min"
  },
  {
    name: "Garrett G42-1450 79MM",
    map_img: "/img/maps/G42-1450C-Comp-Map-kg-sec-scaled.webp",
    map_range: [-22.076215505913275, 171.24135081307494, 0.5829717770989513, 4.552256239024837],
    map_unit: "lb_min"
  },
  {
    name: "TD04H-20TK3S",
    map_img: "/img/maps/TD04H-20TK3S.avif",
    map_range: [-5.7283625494783, 49.366178550669424, 0.7451761344192123, 3.3918293555138224],
    map_unit: "lb_min"
  },
  {
    name: "TD04H-19T",
    map_img: "/img/maps/td04h-19t.gif",
    map_range: [-114.31307521804949, 705.5548316421408, 0.7458097609026896, 3.4590006300469236],
    map_unit: "cfm"
  },
  {
    name: "TD04H-18T",
    map_img: "/img/maps/td04h-18t.gif",
    map_range: [-115.61264822134387, 702.0948688974494, 0.7609216662730165, 3.4568843269054526],
    map_unit: "cfm"
  },
  {
    name: "TD04H-16T",
    map_img: "/img/maps/td04h-16t.gif",
    map_range: [-114.31307521804949, 705.5548316421408, 0.7463406129833383, 3.458541063100809],
    map_unit: "cfm"
  },
  {
    name: "TD04H-13T",
    map_img: "/img/maps/td04h-13t.jpg",
    map_range: [-0.08041193181818182, 0.3545062538493763, 0.7685482579805478, 3.7275930923636738],
    map_unit: "m3_s"
  },
  {
    name: "S300SX-E 87S72",
    map_img: "/img/maps/e87s72.jpg",
    map_range: [-4.991823899371069, 82.1654213836478, 0.5459098497495827, 5.086811352253757],
    map_unit: "lb_min"
  },
  {
    name: "K24",
    map_img: "/img/maps/k24.jpg",
    map_range: [-0.018788775806060747, 0.25284096564288683, 0.8005406035252226, 2.5907960549088807],
    map_unit: "m3_s"
  },
];