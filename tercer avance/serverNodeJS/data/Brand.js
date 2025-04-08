const sampleBrands = [
  // Periféricos básicos empresariales
  {
    brandId: "LOG",
    name: "Logitech",
    dateCreated: new Date("2023-01-10"),
  },
  {
    brandId: "MCS",
    name: "Microsoft",
    dateCreated: new Date("2023-02-15"),
  },
  {
    brandId: "HP0",
    name: "HP",
    dateCreated: new Date("2023-04-05"),
  },

  // Monitores empresariales
  {
    brandId: "VEW",
    name: "ViewSonic",
    dateCreated: new Date("2023-05-18"),
  },
  {
    brandId: "NEC",
    name: "NEC",
    dateCreated: new Date("2023-06-01"),
  },
  {
    brandId: "BNQ",
    name: "BenQ",
    dateCreated: new Date("2023-07-12"),
  },

  // Hardware empresarial
  {
    brandId: "LNV",
    name: "Lenovo",
    dateCreated: new Date("2023-08-09"),
  },
  {
    brandId: "FJT",
    name: "Fujitsu",
    dateCreated: new Date("2023-09-25"),
  },
  {
    brandId: "IBM",
    name: "IBM",
    dateCreated: new Date("2023-10-30"),
  },

  // Redes y conectividad
  {
    brandId: "CSCO",
    name: "Cisco",
    dateCreated: new Date("2023-11-14"),
  },
  {
    brandId: "TPL",
    name: "TP-Link",
    dateCreated: new Date("2023-12-01"),
  },
  {
    brandId: "UBNT",
    name: "Ubiquiti",
    dateCreated: new Date("2024-01-15"),
  },

  // Almacenamiento empresarial
  {
    brandId: "SYN",
    name: "Synology",
    dateCreated: new Date("2024-02-01"),
  },
  {
    brandId: "QNAP",
    name: "QNAP",
    dateCreated: new Date("2024-02-15"),
  },

  // Seguridad empresarial
  {
    brandId: "HID",
    name: "HID",
    dateCreated: new Date("2024-03-01"),
  },
  {
    brandId: "PAL",
    name: "Palo Alto Networks",
    dateCreated: new Date("2024-03-15"),
  }, // Fixed missing comma

  // Memorias RAM
  {
    brandId: "KST",
    name: "Kingston",
    dateCreated: new Date("2023-03-05"),
  },
  {
    brandId: "CRU",
    name: "Crucial",
    dateCreated: new Date("2023-04-01"),
  },
  {
    brandId: "SMG",
    name: "Samsung",
    dateCreated: new Date("2023-05-12"),
  },

  // Fuentes de Alimentación (PSU)
  {
    brandId: "SEA",
    name: "Seasonic",
    dateCreated: new Date("2023-06-20"),
  },
  {
    brandId: "EVG",
    name: "EVGA",
    dateCreated: new Date("2023-07-08"),
  },
  {
    brandId: "DEL",
    name: "Dell",
    dateCreated: new Date("2023-08-01"),
  },

  // Placas Madre
  {
    brandId: "SUP",
    name: "Supermicro",
    dateCreated: new Date("2023-09-15"),
  },
  {
    brandId: "ASU",
    name: "ASUS",
    dateCreated: new Date("2023-10-05"),
  },
  {
    brandId: "GGB",
    name: "Gigabyte",
    dateCreated: new Date("2023-11-10"),
  },

  // Almacenamiento
  {
    brandId: "WDC",
    name: "Western Digital",
    dateCreated: new Date("2023-12-01"),
  },
  {
    brandId: "SGT",
    name: "Seagate",
    dateCreated: new Date("2024-01-15"),
  },
  {
    brandId: "TOS",
    name: "Toshiba",
    dateCreated: new Date("2024-02-01"),
  },

  // Tarjetas de Red
  {
    brandId: "INL",
    name: "Intel",
    dateCreated: new Date("2024-03-10"),
  },
  {
    brandId: "BRC",
    name: "Broadcom",
    dateCreated: new Date("2024-04-05"),
  },

  // Tarjetas Gráficas Empresariales
  {
    brandId: "NVA",
    name: "NVIDIA",
    dateCreated: new Date("2024-05-20"),
  },
  {
    brandId: "AMD",
    name: "AMD",
    dateCreated: new Date("2024-06-01"),
  },
  {
    brandId: "GEN",
    name: "Genius",
    dateCreated: new Date("2024-03-25"),
  },

  // New brands
  {
    brandId: "ZBR",
    name: "Zebra",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "EPS",
    name: "Epson",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "APG",
    name: "APG",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "MGT",
    name: "Magtek",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "ELO",
    name: "Elo",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "SGN",
    name: "SecuGen",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "APC",
    name: "APC",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "TPL",
    name: "Tripp Lite",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "CM",
    name: "Cooler Master",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "LG",
    name: "LG",
    dateCreated: new Date("2024-03-25"),
  },
  {
    brandId: "GEN",
    name: "Generic",
    dateCreated: new Date("2024-03-25"),
  },
];

module.exports = sampleBrands; // Fixed incorrect export name
