const TURBOS = [
  // Garrett Maps
  // https://www.garrettmotion.com/racing-and-performance/performance-turbos/
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
    name: "GBC22-350 44mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2021/07/GBC-22-Comp-scaled.jpg",
    map_range: [-8.237704918032787, 48.28688574618981, 0.509899084810979, 4.0563735461609625],
    map_unit: "lb_min"
  },
  {
    name: "GBC20-300 39mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2021/07/GBC-20-Comp-scaled.jpg",
    map_range: [-7.312414733969986, 42.863120043912005, 0.5035405629694207, 4.040121867317016],
    map_unit: "lb_min"
  },
  {
    name: "GBC17-250 36mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2021/07/GBC-17-Comp-scaled.jpg",
    map_range: [-5.48431105047749, 32.147340032934004, 0.5072014292091169, 4.049864117107564],
    map_unit: "lb_min"
  },
  {
    name: "GBC14-200 34mm",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2021/07/GBC-14-Comp-scaled.jpg",
    map_range: [-5.506849315068493, 32.27945238923373, 0.6700490860556394, 3.042021857390435],
    map_unit: "lb_min"
  },
  {
    name: "GBC37-900 67MM",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2023/02/GBC37-900-Comp-Map--scaled.jpg",
    map_range: [-14.522292993630574, 102.60721972034236, 0.46240372213539027, 5.278839962321797],
    map_unit: "lb_min"
  },
  {
    name: "GT2860RS",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GT2860RS-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-6.059050064184852, 41.15361616455392, 0.7687842572321657, 3.02021443185782],
    map_unit: "lb_min"
  },
  {
    name: "GT2871R",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2018/05/Comp-Map-GT-2871R.jpg",
    map_range: [-6.908866995073891, 55.37027969736184, 0.7289330863097323, 3.7412939595974035],
    map_unit: "lb_min"
  },
  {
    name: "GT3071R",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GT3071-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-9.08366533864542, 64.18061153822212, 0.6309051037330906, 4.060763351029614],
    map_unit: "lb_min"
  },
  {
    name: "GT3076R",
    map_img: "https://www.garrettmotion.com/wp-content/uploads/2022/06/GT3076-Comp-Map-Kg-Sec-scaled.jpg",
    map_range: [-9.02127659574468, 69.23120636635637, 0.5701308747165776, 4.578305018395442],
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


  // MHI Maps
  {
    name: "TD04H-20TK3S",
    map_img: "/Turbo-Mapper/assets/img/maps/TD04H-20TK3S.avif",
    map_range: [-5.7283625494783, 49.366178550669424, 0.7451761344192123, 3.3918293555138224],
    map_unit: "lb_min"
  },
  {
    name: "TD04H-19T",
    map_img: "/Turbo-Mapper/assets/img/maps/td04h-19t.gif",
    map_range: [-114.31307521804949, 705.5548316421408, 0.7458097609026896, 3.4590006300469236],
    map_unit: "cfm"
  },
  {
    name: "TD04H-18T",
    map_img: "/Turbo-Mapper/assets/img/maps/td04h-18t.gif",
    map_range: [-115.61264822134387, 702.0948688974494, 0.7609216662730165, 3.4568843269054526],
    map_unit: "cfm"
  },
  {
    name: "TD04H-16T",
    map_img: "/Turbo-Mapper/assets/img/maps/td04h-16t.gif",
    map_range: [-114.31307521804949, 705.5548316421408, 0.7463406129833383, 3.458541063100809],
    map_unit: "cfm"
  },
  {
    name: "TD04H-13T",
    map_img: "/Turbo-Mapper/assets/img/maps/td04h-13t.jpg",
    map_range: [-0.08041193181818182, 0.3545062538493763, 0.7685482579805478, 3.7275930923636738],
    map_unit: "m3_s"
  },

  // BorgWarner Maps
  // https://www.borgwarner.com/matchbot/#version=1.4&displacement=1.5&CID=91.53&altitude=500&baro=14.502&aat=75&fueltype=1&turboconfig=1&compressor=62k80&pt1_rpm=2000&pt1_ve=85&pt1_boost=5&pt1_ie=99&pt1_filres=0.08&pt1_ipd=0.2&pt1_mbp=0.5&pt1_ce=66&pt1_te=75&pt1_egt=1550&pt1_ter=1.21&pt1_pw=14.54&pt1_bsfc=0.43&pt1_afr=11.5&pt1_wts=300&pt1_wd=83&pt1_wd2=74&pt1_wrsin=69033&pt2_rpm=3000&pt2_ve=95&pt2_boost=10&pt2_ie=95&pt2_filres=0.1&pt2_ipd=0.2&pt2_mbp=1&pt2_ce=70&pt2_te=73&pt2_egt=1600&pt2_ter=1.38&pt2_pw=13.14&pt2_bsfc=0.45&pt2_afr=11.5&pt2_wts=320&pt2_wd=83&pt2_wd2=74&pt2_wrsin=73635&pt3_rpm=4000&pt3_ve=100&pt3_boost=15&pt3_ie=95&pt3_filres=0.12&pt3_ipd=0.3&pt3_mbp=1.3&pt3_ce=74&pt3_te=72&pt3_egt=1650&pt3_ter=1.61&pt3_pw=22.16&pt3_bsfc=0.48&pt3_afr=11.5&pt3_wts=340&pt3_wd=83&pt3_wd2=74&pt3_wrsin=78238&pt4_rpm=5000&pt4_ve=100&pt4_boost=17&pt4_ie=92&pt4_filres=0.15&pt4_ipd=0.4&pt4_mbp=1.5&pt4_ce=76&pt4_te=71&pt4_egt=1650&pt4_ter=1.81&pt4_pw=30.66&pt4_bsfc=0.5&pt4_afr=11.5&pt4_wts=368&pt4_wd=83&pt4_wd2=74&pt4_wrsin=84681&pt5_rpm=6000&pt5_ve=105&pt5_boost=17&pt5_ie=90&pt5_filres=0.18&pt5_ipd=0.5&pt5_mbp=1.8&pt5_ce=72&pt5_te=70&pt5_egt=1650&pt5_ter=1.98&pt5_pw=34.33&pt5_bsfc=0.52&pt5_afr=11.5&pt5_wts=400&pt5_wd=83&pt5_wd2=74&pt5_wrsin=92044&pt6_rpm=7000&pt6_ve=105&pt6_boost=17&pt6_ie=90&pt6_filres=0.2&pt6_ipd=0.6&pt6_mbp=2&pt6_ce=66&pt6_te=70&pt6_egt=1650&pt6_ter=2.18&pt6_pw=36.06&pt6_bsfc=0.55&pt6_afr=11.5&pt6_wts=400&pt6_wd=83&pt6_wd2=74&pt6_wrsin=92044&
  {
    name: "62K80 (EFR 6258)",
    map_img: "https://www.borgwarner.com/matchbot/images/62k80.jpg",
    map_range: [-0.03235955056179775, 0.5186317152387641, 0.7167441198068072, 3.853800478321638],
    map_unit: "kg_s"
  },
  {
    name: "67X80 (EFR 6758)",
    map_img: "https://www.borgwarner.com/matchbot/images/67x80.jpg",
    map_range: [-0.03227895392278954, 0.5173399799579701, 0.7161941083889563, 3.859341838473718],
    map_unit: "kg_s"
  },
  {
    name: "EFR 6258",
    map_img: "/Turbo-Mapper/assets/img/maps/bw_efr_6258.png",
    map_range: [-8.084449021627188, 51.6271872083387, 0.3699091691009666, 4.297655725347485],
    map_unit: "lb_min"
  },
  {
    name: "EFR 6758",
    map_img: "/Turbo-Mapper/assets/img/maps/bw_efr_6758.png",
    map_range: [-9.784615384615384, 61.57538311298077, 0.3505053532013035, 4.307086123759566],
    map_unit: "lb_min"
  },
  {
    name: "EFR 7064",
    map_img: "/Turbo-Mapper/assets/img/maps/bw_efr_7064.png",
    map_range: [-9.048582995951419, 61.37246815299217, 0.1666623608424943, 5.147117016317909],
    map_unit: "lb_min"
  },
  {
    name: "70S75 (EFR 7064)",
    map_img: "https://www.borgwarner.com/matchbot/images/70s75.jpg",
    map_range: [-0.03231920199501247, 0.5179850422771196, 0.5816215721336571, 5.269037829837285],
    map_unit: "kg_s"
  },
  {
    name: "EFR 7163",
    map_img: "/Turbo-Mapper/assets/img/maps/bw_efr_7163.png",
    map_range: [-11.324742268041236, 66.38041073514013, 0.3313268232513433, 4.323614580576012],
    map_unit: "lb_min"
  },
  {
    name: "K24",
    map_img: "/Turbo-Mapper/assets/img/maps/k24.jpg",
    map_range: [-0.018788775806060747, 0.25284096564288683, 0.8005406035252226, 2.5907960549088807],
    map_unit: "m3_s"
  },
];
