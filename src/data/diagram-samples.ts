export type DiagramHomologyStep = {
  epsilon: number;
  diagramEpsilon: number;
  h1: number;
  h2: number;
};

export type DiagramSample = {
  sampleId: string;
  itemId: string;
  cacheFile: string;
  split: "train" | "test";
  sourceIndex: number;
  className: string;
  diagramFormat: string;
  epsilonRule: string;
  epsilonSteps: number[];
  diagramEpsilonSteps: number[];
  homologySteps: DiagramHomologyStep[];
  intervalCounts: { h1: number; h2: number };
};

export const DIAGRAM_SAMPLES: DiagramSample[] = [
  {
    "sampleId": "train-0",
    "itemId": "b1f6c40bb708d777790197cd9e47814139028798_22c25b319df4fe01",
    "cacheFile": "b1f6c40bb708d777790197cd9e47814139028798_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 0,
    "className": "airplane",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.041898,
      0.083796,
      0.125694,
      0.167593,
      0.209491,
      0.251389,
      0.293287,
      0.335185,
      0.377083,
      0.418982,
      0.46088
    ],
    "diagramEpsilonSteps": [
      0.0,
      15.166904,
      23.094295,
      25.216074,
      27.136935,
      29.454535,
      31.737497,
      34.320333,
      37.7419,
      43.944458,
      51.746095,
      64.147823
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.041898,
        "diagramEpsilon": 15.166904,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.083796,
        "diagramEpsilon": 23.094295,
        "h1": 44,
        "h2": 0
      },
      {
        "epsilon": 0.125694,
        "diagramEpsilon": 25.216074,
        "h1": 72,
        "h2": 0
      },
      {
        "epsilon": 0.167593,
        "diagramEpsilon": 27.136935,
        "h1": 86,
        "h2": 0
      },
      {
        "epsilon": 0.209491,
        "diagramEpsilon": 29.454535,
        "h1": 104,
        "h2": 0
      },
      {
        "epsilon": 0.251389,
        "diagramEpsilon": 31.737497,
        "h1": 113,
        "h2": 0
      },
      {
        "epsilon": 0.293287,
        "diagramEpsilon": 34.320333,
        "h1": 94,
        "h2": 1
      },
      {
        "epsilon": 0.335185,
        "diagramEpsilon": 37.7419,
        "h1": 68,
        "h2": 3
      },
      {
        "epsilon": 0.377083,
        "diagramEpsilon": 43.944458,
        "h1": 30,
        "h2": 3
      },
      {
        "epsilon": 0.418982,
        "diagramEpsilon": 51.746095,
        "h1": 19,
        "h2": 1
      },
      {
        "epsilon": 0.46088,
        "diagramEpsilon": 64.147823,
        "h1": 7,
        "h2": 3
      }
    ],
    "intervalCounts": {
      "h1": 417,
      "h2": 71
    }
  },
  {
    "sampleId": "train-2588",
    "itemId": "d58da674724ee3a538928d8d65485d0af79dfa69_22c25b319df4fe01",
    "cacheFile": "d58da674724ee3a538928d8d65485d0af79dfa69_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 2588,
    "className": "chair",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.048845,
      0.097691,
      0.146536,
      0.195382,
      0.244227,
      0.293073,
      0.341918,
      0.390764,
      0.439609,
      0.488455,
      0.5373
    ],
    "diagramEpsilonSteps": [
      0.0,
      18.970758,
      31.556566,
      39.73985,
      45.510841,
      49.088218,
      53.44326,
      58.079818,
      62.919065,
      69.295871,
      78.374154,
      94.142626
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.048845,
        "diagramEpsilon": 18.970758,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.097691,
        "diagramEpsilon": 31.556566,
        "h1": 10,
        "h2": 0
      },
      {
        "epsilon": 0.146536,
        "diagramEpsilon": 39.73985,
        "h1": 14,
        "h2": 0
      },
      {
        "epsilon": 0.195382,
        "diagramEpsilon": 45.510841,
        "h1": 35,
        "h2": 0
      },
      {
        "epsilon": 0.244227,
        "diagramEpsilon": 49.088218,
        "h1": 53,
        "h2": 0
      },
      {
        "epsilon": 0.293073,
        "diagramEpsilon": 53.44326,
        "h1": 52,
        "h2": 0
      },
      {
        "epsilon": 0.341918,
        "diagramEpsilon": 58.079818,
        "h1": 52,
        "h2": 0
      },
      {
        "epsilon": 0.390764,
        "diagramEpsilon": 62.919065,
        "h1": 47,
        "h2": 1
      },
      {
        "epsilon": 0.439609,
        "diagramEpsilon": 69.295871,
        "h1": 38,
        "h2": 1
      },
      {
        "epsilon": 0.488455,
        "diagramEpsilon": 78.374154,
        "h1": 23,
        "h2": 2
      },
      {
        "epsilon": 0.5373,
        "diagramEpsilon": 94.142626,
        "h1": 9,
        "h2": 3
      }
    ],
    "intervalCounts": {
      "h1": 246,
      "h2": 30
    }
  },
  {
    "sampleId": "train-4690",
    "itemId": "831861161fbd7788a8f42ba2c0e17b0763cfbcab_22c25b319df4fe01",
    "cacheFile": "831861161fbd7788a8f42ba2c0e17b0763cfbcab_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 4690,
    "className": "guitar",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.025332,
      0.050664,
      0.075997,
      0.101329,
      0.126661,
      0.151993,
      0.177326,
      0.202658,
      0.22799,
      0.253322,
      0.278655
    ],
    "diagramEpsilonSteps": [
      0.0,
      15.935763,
      25.62256,
      29.628957,
      32.019105,
      34.818798,
      37.967427,
      41.513956,
      46.100197,
      50.890697,
      55.493142,
      60.576043
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.025332,
        "diagramEpsilon": 15.935763,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.050664,
        "diagramEpsilon": 25.62256,
        "h1": 35,
        "h2": 0
      },
      {
        "epsilon": 0.075997,
        "diagramEpsilon": 29.628957,
        "h1": 81,
        "h2": 0
      },
      {
        "epsilon": 0.101329,
        "diagramEpsilon": 32.019105,
        "h1": 109,
        "h2": 0
      },
      {
        "epsilon": 0.126661,
        "diagramEpsilon": 34.818798,
        "h1": 126,
        "h2": 1
      },
      {
        "epsilon": 0.151993,
        "diagramEpsilon": 37.967427,
        "h1": 114,
        "h2": 1
      },
      {
        "epsilon": 0.177326,
        "diagramEpsilon": 41.513956,
        "h1": 86,
        "h2": 1
      },
      {
        "epsilon": 0.202658,
        "diagramEpsilon": 46.100197,
        "h1": 51,
        "h2": 0
      },
      {
        "epsilon": 0.22799,
        "diagramEpsilon": 50.890697,
        "h1": 36,
        "h2": 4
      },
      {
        "epsilon": 0.253322,
        "diagramEpsilon": 55.493142,
        "h1": 45,
        "h2": 3
      },
      {
        "epsilon": 0.278655,
        "diagramEpsilon": 60.576043,
        "h1": 14,
        "h2": 12
      }
    ],
    "intervalCounts": {
      "h1": 468,
      "h2": 111
    }
  },
  {
    "sampleId": "train-4990",
    "itemId": "072f7f87f7a5e3cc39d39b93e09ec945e2bc7ef6_22c25b319df4fe01",
    "cacheFile": "072f7f87f7a5e3cc39d39b93e09ec945e2bc7ef6_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 4990,
    "className": "lamp",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.047601,
      0.095202,
      0.142804,
      0.190405,
      0.238006,
      0.285607,
      0.333209,
      0.38081,
      0.428411,
      0.476012,
      0.523614
    ],
    "diagramEpsilonSteps": [
      0.0,
      17.332571,
      24.65667,
      27.964266,
      30.422548,
      33.011301,
      35.517114,
      38.349927,
      42.391549,
      46.148403,
      51.146688,
      57.932637
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.047601,
        "diagramEpsilon": 17.332571,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.095202,
        "diagramEpsilon": 24.65667,
        "h1": 36,
        "h2": 0
      },
      {
        "epsilon": 0.142804,
        "diagramEpsilon": 27.964266,
        "h1": 63,
        "h2": 0
      },
      {
        "epsilon": 0.190405,
        "diagramEpsilon": 30.422548,
        "h1": 77,
        "h2": 0
      },
      {
        "epsilon": 0.238006,
        "diagramEpsilon": 33.011301,
        "h1": 100,
        "h2": 0
      },
      {
        "epsilon": 0.285607,
        "diagramEpsilon": 35.517114,
        "h1": 116,
        "h2": 0
      },
      {
        "epsilon": 0.333209,
        "diagramEpsilon": 38.349927,
        "h1": 107,
        "h2": 2
      },
      {
        "epsilon": 0.38081,
        "diagramEpsilon": 42.391549,
        "h1": 87,
        "h2": 0
      },
      {
        "epsilon": 0.428411,
        "diagramEpsilon": 46.148403,
        "h1": 64,
        "h2": 2
      },
      {
        "epsilon": 0.476012,
        "diagramEpsilon": 51.146688,
        "h1": 38,
        "h2": 9
      },
      {
        "epsilon": 0.523614,
        "diagramEpsilon": 57.932637,
        "h1": 12,
        "h2": 3
      }
    ],
    "intervalCounts": {
      "h1": 399,
      "h2": 65
    }
  },
  {
    "sampleId": "train-8012",
    "itemId": "8e1d0ad98c53c8f6ea0bb988f942458bf56cf6b3_22c25b319df4fe01",
    "cacheFile": "8e1d0ad98c53c8f6ea0bb988f942458bf56cf6b3_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 8012,
    "className": "table",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.052679,
      0.105358,
      0.158037,
      0.210716,
      0.263395,
      0.316074,
      0.368753,
      0.421432,
      0.474111,
      0.52679,
      0.579469
    ],
    "diagramEpsilonSteps": [
      0.0,
      18.669987,
      23.975373,
      26.795145,
      29.205387,
      31.387327,
      33.656973,
      35.713258,
      38.452359,
      40.999988,
      44.142639,
      48.710998
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.052679,
        "diagramEpsilon": 18.669987,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.105358,
        "diagramEpsilon": 23.975373,
        "h1": 34,
        "h2": 0
      },
      {
        "epsilon": 0.158037,
        "diagramEpsilon": 26.795145,
        "h1": 48,
        "h2": 0
      },
      {
        "epsilon": 0.210716,
        "diagramEpsilon": 29.205387,
        "h1": 60,
        "h2": 0
      },
      {
        "epsilon": 0.263395,
        "diagramEpsilon": 31.387327,
        "h1": 84,
        "h2": 0
      },
      {
        "epsilon": 0.316074,
        "diagramEpsilon": 33.656973,
        "h1": 97,
        "h2": 1
      },
      {
        "epsilon": 0.368753,
        "diagramEpsilon": 35.713258,
        "h1": 101,
        "h2": 1
      },
      {
        "epsilon": 0.421432,
        "diagramEpsilon": 38.452359,
        "h1": 101,
        "h2": 1
      },
      {
        "epsilon": 0.474111,
        "diagramEpsilon": 40.999988,
        "h1": 91,
        "h2": 1
      },
      {
        "epsilon": 0.52679,
        "diagramEpsilon": 44.142639,
        "h1": 64,
        "h2": 2
      },
      {
        "epsilon": 0.579469,
        "diagramEpsilon": 48.710998,
        "h1": 40,
        "h2": 2
      }
    ],
    "intervalCounts": {
      "h1": 365,
      "h2": 24
    }
  },
  {
    "sampleId": "train-7118",
    "itemId": "d6192adb5c049d34089aa9b35c40265ea210f2f5_22c25b319df4fe01",
    "cacheFile": "d6192adb5c049d34089aa9b35c40265ea210f2f5_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 7118,
    "className": "sofa",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.04408,
      0.08816,
      0.13224,
      0.17632,
      0.2204,
      0.26448,
      0.30856,
      0.35264,
      0.39672,
      0.4408,
      0.48488
    ],
    "diagramEpsilonSteps": [
      0.0,
      13.986785,
      20.424505,
      22.583709,
      24.01395,
      25.540132,
      27.293727,
      28.953223,
      30.856687,
      34.787056,
      39.762817,
      44.52025
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.04408,
        "diagramEpsilon": 13.986785,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.08816,
        "diagramEpsilon": 20.424505,
        "h1": 41,
        "h2": 0
      },
      {
        "epsilon": 0.13224,
        "diagramEpsilon": 22.583709,
        "h1": 100,
        "h2": 0
      },
      {
        "epsilon": 0.17632,
        "diagramEpsilon": 24.01395,
        "h1": 139,
        "h2": 0
      },
      {
        "epsilon": 0.2204,
        "diagramEpsilon": 25.540132,
        "h1": 158,
        "h2": 0
      },
      {
        "epsilon": 0.26448,
        "diagramEpsilon": 27.293727,
        "h1": 154,
        "h2": 1
      },
      {
        "epsilon": 0.30856,
        "diagramEpsilon": 28.953223,
        "h1": 125,
        "h2": 1
      },
      {
        "epsilon": 0.35264,
        "diagramEpsilon": 30.856687,
        "h1": 100,
        "h2": 7
      },
      {
        "epsilon": 0.39672,
        "diagramEpsilon": 34.787056,
        "h1": 72,
        "h2": 5
      },
      {
        "epsilon": 0.4408,
        "diagramEpsilon": 39.762817,
        "h1": 30,
        "h2": 4
      },
      {
        "epsilon": 0.48488,
        "diagramEpsilon": 44.52025,
        "h1": 23,
        "h2": 6
      }
    ],
    "intervalCounts": {
      "h1": 488,
      "h2": 84
    }
  },
  {
    "sampleId": "train-8567",
    "itemId": "fa9d605526f7657c54a8f02d557ef67df88be059_22c25b319df4fe01",
    "cacheFile": "fa9d605526f7657c54a8f02d557ef67df88be059_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 8567,
    "className": "toilet",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.05341,
      0.106819,
      0.160229,
      0.213638,
      0.267048,
      0.320458,
      0.373867,
      0.427277,
      0.480686,
      0.534096,
      0.587505
    ],
    "diagramEpsilonSteps": [
      0.0,
      16.876524,
      24.411198,
      26.497439,
      28.938235,
      31.149239,
      33.03511,
      35.194421,
      37.743085,
      40.587907,
      44.625161,
      49.971039
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.05341,
        "diagramEpsilon": 16.876524,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.106819,
        "diagramEpsilon": 24.411198,
        "h1": 35,
        "h2": 0
      },
      {
        "epsilon": 0.160229,
        "diagramEpsilon": 26.497439,
        "h1": 61,
        "h2": 0
      },
      {
        "epsilon": 0.213638,
        "diagramEpsilon": 28.938235,
        "h1": 98,
        "h2": 0
      },
      {
        "epsilon": 0.267048,
        "diagramEpsilon": 31.149239,
        "h1": 124,
        "h2": 0
      },
      {
        "epsilon": 0.320458,
        "diagramEpsilon": 33.03511,
        "h1": 141,
        "h2": 1
      },
      {
        "epsilon": 0.373867,
        "diagramEpsilon": 35.194421,
        "h1": 132,
        "h2": 3
      },
      {
        "epsilon": 0.427277,
        "diagramEpsilon": 37.743085,
        "h1": 100,
        "h2": 3
      },
      {
        "epsilon": 0.480686,
        "diagramEpsilon": 40.587907,
        "h1": 93,
        "h2": 8
      },
      {
        "epsilon": 0.534096,
        "diagramEpsilon": 44.625161,
        "h1": 70,
        "h2": 4
      },
      {
        "epsilon": 0.587505,
        "diagramEpsilon": 49.971039,
        "h1": 31,
        "h2": 3
      }
    ],
    "intervalCounts": {
      "h1": 472,
      "h2": 75
    }
  },
  {
    "sampleId": "train-9740",
    "itemId": "530b2853712d0e7dbb63ac3062e9cae66cc18725_22c25b319df4fe01",
    "cacheFile": "530b2853712d0e7dbb63ac3062e9cae66cc18725_22c25b319df4fe01.npz",
    "split": "train",
    "sourceIndex": 9740,
    "className": "xbox",
    "diagramFormat": "[birth, death, homology_dimension]",
    "epsilonRule": "visual eps: linspace(0, percentile(pairwise_demo_distances, 30), 12); diagram eps: H1/H2 critical-event quantiles from 0% to 90%",
    "epsilonSteps": [
      0.0,
      0.058627,
      0.117254,
      0.175881,
      0.234508,
      0.293135,
      0.351762,
      0.410389,
      0.469016,
      0.527642,
      0.586269,
      0.644896
    ],
    "diagramEpsilonSteps": [
      0.0,
      14.339347,
      21.734545,
      24.496018,
      27.569757,
      30.040817,
      32.952932,
      36.544956,
      43.270729,
      48.444689,
      51.53994,
      54.732792
    ],
    "homologySteps": [
      {
        "epsilon": 0.0,
        "diagramEpsilon": 0.0,
        "h1": 0,
        "h2": 0
      },
      {
        "epsilon": 0.058627,
        "diagramEpsilon": 14.339347,
        "h1": 1,
        "h2": 0
      },
      {
        "epsilon": 0.117254,
        "diagramEpsilon": 21.734545,
        "h1": 53,
        "h2": 0
      },
      {
        "epsilon": 0.175881,
        "diagramEpsilon": 24.496018,
        "h1": 78,
        "h2": 0
      },
      {
        "epsilon": 0.234508,
        "diagramEpsilon": 27.569757,
        "h1": 109,
        "h2": 0
      },
      {
        "epsilon": 0.293135,
        "diagramEpsilon": 30.040817,
        "h1": 105,
        "h2": 1
      },
      {
        "epsilon": 0.351762,
        "diagramEpsilon": 32.952932,
        "h1": 113,
        "h2": 1
      },
      {
        "epsilon": 0.410389,
        "diagramEpsilon": 36.544956,
        "h1": 103,
        "h2": 0
      },
      {
        "epsilon": 0.469016,
        "diagramEpsilon": 43.270729,
        "h1": 62,
        "h2": 0
      },
      {
        "epsilon": 0.527642,
        "diagramEpsilon": 48.444689,
        "h1": 70,
        "h2": 3
      },
      {
        "epsilon": 0.586269,
        "diagramEpsilon": 51.53994,
        "h1": 48,
        "h2": 3
      },
      {
        "epsilon": 0.644896,
        "diagramEpsilon": 54.732792,
        "h1": 7,
        "h2": 25
      }
    ],
    "intervalCounts": {
      "h1": 521,
      "h2": 106
    }
  }
];
