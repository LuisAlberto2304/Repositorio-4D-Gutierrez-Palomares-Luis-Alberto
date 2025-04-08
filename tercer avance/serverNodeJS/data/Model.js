const sampleModels = [
  // Modelos existentes con nuevos IDs
  {
    id: "DELL-OP7090",
    description: "OptiPlex 7090",
    brand: "Dell",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LEN-THX1C",
    description: "ThinkPad X1 Carbon",
    brand: "Lenovo",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "HP-LJPM404",
    description: "LaserJet Pro M404dn",
    brand: "HP",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "INT-NUC13P",
    description: "NUC 13 Pro",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "SYN-DS920",
    description: "DS920+",
    brand: "Synology",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "CLV-FLX01",
    description: "Flex",
    brand: "Clover",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "KST-FBDDR4",
    description: "Fury Beast DDR4",
    brand: "Kingston",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "SGT-B2TB",
    description: "Barracuda 2TB",
    brand: "Seagate",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "AMD-R5560G",
    description: "Ryzen 5 5600G",
    brand: "AMD",
    dateCreated: new Date("2024-03-25"),
  },

  // Nuevos productos (2 por marca de Brand.js)
  // Logitech
  {
    id: "LOG-MK270",
    description: "MK270 Wireless Combo",
    brand: "Logitech",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LOG-MXKEYS",
    description: "MX Keys Advanced Keyboard",
    brand: "Logitech",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LOG-K120",
    description: "K120 Keyboard",
    brand: "Logitech",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LOG-Z120",
    description: "Z120 Speakers",
    brand: "Logitech",
    dateCreated: new Date("2024-03-25"),
  },

  // Microsoft
  {
    id: "MCS-SURFLP",
    description: "Surface Laptop 5",
    brand: "Microsoft",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "MCS-SURFHD",
    description: "Surface Hub 2S",
    brand: "Microsoft",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "MCS-MBO",
    description: "Basic Optical Mouse",
    brand: "Microsoft",
    dateCreated: new Date("2024-03-25"),
  },

  // ViewSonic
  {
    id: "VEW-VX3276",
    description: "VX3276-4K Monitor",
    brand: "ViewSonic",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "VEW-PX7484K",
    description: "PX748-4K Projector",
    brand: "ViewSonic",
    dateCreated: new Date("2024-03-25"),
  },

  // NEC
  {
    id: "NEC-ME402X",
    description: "MultiSync ME402X",
    brand: "NEC",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "NEC-E464",
    description: "E464 Desktop",
    brand: "NEC",
    dateCreated: new Date("2024-03-25"),
  },

  // Fujitsu
  {
    id: "FJT-ESPRIMO",
    description: "ESPRIMO P558",
    brand: "Fujitsu",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "FJT-CELSIUS",
    description: "CELSIUS M470",
    brand: "Fujitsu",
    dateCreated: new Date("2024-03-25"),
  },

  // Cisco
  {
    id: "CSCO-CAT9K",
    description: "Catalyst 9300 Switch",
    brand: "Cisco",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "CSCO-WAP581",
    description: "Aironet 2800 Access Point",
    brand: "Cisco",
    dateCreated: new Date("2024-03-25"),
  },

  // QNAP
  {
    id: "QNAP-TS873A",
    description: "TS-873A NAS",
    brand: "QNAP",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "QNAP-TVS872X",
    description: "TVS-872XT R2",
    brand: "QNAP",
    dateCreated: new Date("2024-03-25"),
  },

  // Crucial
  {
    id: "CRU-BALL16",
    description: "Ballistix 16GB DDR4",
    brand: "Crucial",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "CRU-MX500",
    description: "MX500 1TB SSD",
    brand: "Crucial",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "CRU-8GBDDR4",
    description: "8GB DDR4 RAM",
    brand: "Crucial",
    dateCreated: new Date("2024-03-25"),
  },

  // Seasonic
  {
    id: "SEA-FOCGX650",
    description: "FOCUS GX-650 PSU",
    brand: "Seasonic",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "SEA-PRIMTX850",
    description: "PRIME TX-850",
    brand: "Seasonic",
    dateCreated: new Date("2024-03-25"),
  },

  // ASUS
  {
    id: "ASU-ROGX570",
    description: "ROG Crosshair VIII",
    brand: "ASUS",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "ASU-TUFB550",
    description: "TUF Gaming B550",
    brand: "ASUS",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "ASU-B450M",
    description: "Prime B450M Motherboard",
    brand: "ASUS",
    dateCreated: new Date("2024-03-25"),
  },

  // Western Digital
  {
    id: "WDC-WD40EFZX",
    description: "WD Red Pro 4TB",
    brand: "Western Digital",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "WDC-SN850X",
    description: "Black SN850X NVMe",
    brand: "Western Digital",
    dateCreated: new Date("2024-03-25"),
  },

  // Ubiquiti
  {
    id: "UBNT-UAPACPRO",
    description: "UniFi AP AC Pro",
    brand: "Ubiquiti",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "UBNT-USW24PRO",
    description: "UniFi Switch Pro 24",
    brand: "Ubiquiti",
    dateCreated: new Date("2024-03-25"),
  },

  // Intel
  {
    id: "INT-CI37100",
    description: "Core i3-7100",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "INT-CI56500",
    description: "Core i5-6500",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "INT-CI310100",
    description: "Core i3-10100",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "INT-XEONW1250",
    description: "Xeon W-1250",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "INT-CI511500",
    description: "Core i5-11500",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "INT-CI511400",
    description: "Core i5-11400",
    brand: "Intel",
    dateCreated: new Date("2024-03-25"),
  },

  // Dell
  {
    id: "DEL-OP3080",
    description: "OptiPlex 3080",
    brand: "Dell",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "DEL-E1916H",
    description: "E1916H Monitor",
    brand: "Dell",
    dateCreated: new Date("2024-03-25"),
  },

  // Kingston
  {
    id: "KST-VAL8GB",
    description: "ValueRAM 8GB DDR4",
    brand: "Kingston",
    dateCreated: new Date("2024-03-25"),
  },

  // Seagate
  {
    id: "SGT-BC1TB",
    description: "BarraCuda 1TB",
    brand: "Seagate",
    dateCreated: new Date("2024-03-25"),
  },

  // HP
  {
    id: "HP-22FW",
    description: "22fw Monitor",
    brand: "HP",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "HP-USBKBD",
    description: "USB Keyboard",
    brand: "HP",
    dateCreated: new Date("2024-03-25"),
  },

  // Genius
  {
    id: "GEN-SPU115",
    description: "SP-U115 Speakers",
    brand: "Genius",
    dateCreated: new Date("2024-03-25"),
  },

  // Toshiba
  {
    id: "TOS-1TBHDD",
    description: "1TB Hard Drive",
    brand: "Toshiba",
    dateCreated: new Date("2024-03-25"),
  },

  // EVGA
  {
    id: "EVG-450W",
    description: "450W Power Supply",
    brand: "EVGA",
    dateCreated: new Date("2024-03-25"),
  },

  // TP-Link
  {
    id: "TPL-TG3468",
    description: "TG-3468 Network Card",
    brand: "TP-Link",
    dateCreated: new Date("2024-03-25"),
  },

  // New models
  {
    id: "NVA-GT710",
    description: "GT 710 Graphics Card",
    brand: "NVIDIA",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "KST-A400240",
    description: "A400 240GB SSD",
    brand: "Kingston",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "ZBR-DS2208",
    description: "DS2208 Barcode Scanner",
    brand: "Zebra",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "EPS-TMT20II",
    description: "TM-T20II Receipt Printer",
    brand: "Epson",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "APG-VASARIO",
    description: "Vasario Cash Drawer",
    brand: "APG",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "MGT-SWIPE",
    description: "Swipe Card Reader",
    brand: "Magtek",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "ELO-1515L",
    description: "1515L Touch Screen",
    brand: "Elo",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "TPL-ARCHERC6",
    description: "Archer C6 Router",
    brand: "TP-Link",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "CSCO-SG11024",
    description: "SG110-24 Network Switch",
    brand: "Cisco",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "UBNT-UAPACLITE",
    description: "UniFi AC Lite Access Point",
    brand: "Ubiquiti",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "FJT-IX1500",
    description: "ScanSnap iX1500",
    brand: "Fujitsu",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LOG-H390",
    description: "H390 Headset",
    brand: "Logitech",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "MCS-HD3000",
    description: "LifeCam HD-3000",
    brand: "Microsoft",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "SGN-HP20",
    description: "Hamster Pro 20",
    brand: "SecuGen",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "ZBR-RFD8500",
    description: "RFD8500 RFID Reader",
    brand: "Zebra",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "SYN-DS220PLUS",
    description: "DS220+ Network Storage",
    brand: "Synology",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "WDC-MYPASSPORT1TB",
    description: "My Passport 1TB",
    brand: "Western Digital",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "APC-BACKUPS600",
    description: "Back-UPS 600VA",
    brand: "APC",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "TPL-PDU1230",
    description: "PDU 1230",
    brand: "Tripp Lite",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "CM-HYPER212",
    description: "Hyper 212 Cooling Fan",
    brand: "Cooler Master",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LG-GP65NB60",
    description: "GP65NB60 Optical Disk Drive",
    brand: "LG",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LEN-THE15",
    description: "ThinkPad E15 Laptop",
    brand: "Lenovo",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "DEL-PET40",
    description: "PowerEdge T40 Server",
    brand: "Dell",
    dateCreated: new Date("2024-03-25"),
  },
  {
    id: "LEN-TCM70Q",
    description: "ThinkCentre M70q Tiny Desktop",
    brand: "Lenovo",
    dateCreated: new Date("2024-03-25"),
  },
];

module.exports = sampleModels;
