const generateRandomCode = () =>
  Math.random().toString(36).toUpperCase().slice(2, 6);

const equipmentActives = [
  {
    serialNumber: `EQ-${generateRandomCode()}`,
    components: {
      component1: {
        name: "Procesador Intel Core i3-7100",
        installationDate: new Date("2025-03-27T08:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component2: {
        name: "Placa Madre Dell OptiPlex 3080",
        installationDate: new Date("2025-03-27T08:15:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component3: {
        name: "RAM Kingston Value 8GB DDR4",
        installationDate: new Date("2025-03-27T08:30:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component4: {
        name: "SSD Kingston A400 240GB",
        installationDate: new Date("2025-03-27T08:45:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component5: {
        name: "Fuente de Poder Dell 240W",
        installationDate: new Date("2025-03-27T09:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
    },
    peripherals: {
      peripheral1: {
        name: "Monitor HP 22fw",
        installationDate: new Date("2025-03-27T09:15:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral2: {
        name: "Teclado Logitech K120",
        installationDate: new Date("2025-03-27T09:30:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral3: {
        name: "Mouse Logitech M90",
        installationDate: new Date("2025-03-27T09:45:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
    },
    dateCreated: new Date("2025-03-27T10:00:00Z"),
    equipmentId: "CENTRO-CAJA001",
    lastMaintenance: {
      date: new Date("2025-05-15T14:30:00Z"),
      notes: "Reemplazo de módulo RAM defectuoso",
      type: "Hardware",
    },
    location: "Sucursal Centro",
    status: "Active",
    type: "Desktop Computer",
    brand: "Dell",
    model: "DEL-OP3080",
  },
  {
    serialNumber: `EQ-${generateRandomCode()}`,
    components: {
      component1: {
        name: "Procesador Intel Core i5-8500",
        installationDate: new Date("2025-03-28T08:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component2: {
        name: "Placa Madre ASUS Prime B450M",
        installationDate: new Date("2025-03-28T08:20:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component3: {
        name: "RAM Crucial 8GB DDR4",
        installationDate: new Date("2025-03-28T08:40:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component4: {
        name: "Disco Duro Seagate BarraCuda 1TB",
        installationDate: new Date("2025-03-28T09:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component5: {
        name: "Fuente de Poder EVGA 450W",
        installationDate: new Date("2025-03-28T09:20:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
    },
    peripherals: {
      peripheral1: {
        name: "Monitor Dell E1916H",
        installationDate: new Date("2025-03-28T09:40:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral2: {
        name: "Teclado HP USB Keyboard",
        installationDate: new Date("2025-03-28T10:00:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral3: {
        name: "Mouse Microsoft Basic Optical",
        installationDate: new Date("2025-03-28T10:20:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
    },
    dateCreated: new Date("2025-03-28T10:40:00Z"),
    equipmentId: "ZONARIO-CAJA001",
    lastMaintenance: {
      date: new Date("2025-05-16T15:00:00Z"),
      notes: "Actualización de BIOS y controladores",
      type: "Software",
    },
    location: "Sucursal Zona Río",
    status: "Active",
    type: "Desktop Computer",
    brand: "HP",
    model: "HP-PD400G6",
  },
  {
    serialNumber: `EQ-${generateRandomCode()}`,
    components: {
      component1: {
        name: "Procesador Intel Core i3-12100",
        installationDate: new Date("2025-03-29T08:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component2: {
        name: "Placa Madre Lenovo Q470",
        installationDate: new Date("2025-03-29T08:15:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component3: {
        name: "RAM Kingston Value 8GB DDR4",
        installationDate: new Date("2025-03-29T08:30:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component4: {
        name: "SSD Kingston A400 240GB",
        installationDate: new Date("2025-03-29T08:45:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component5: {
        name: "Fuente de Poder Dell 240W",
        installationDate: new Date("2025-03-29T09:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
    },
    peripherals: {
      peripheral1: {
        name: "Monitor HP 22fw",
        installationDate: new Date("2025-03-29T09:15:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral2: {
        name: "Teclado Lenovo Preferred Pro",
        installationDate: new Date("2025-03-29T09:30:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral3: {
        name: "Mouse Lenovo 300",
        installationDate: new Date("2025-03-29T09:45:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
    },
    dateCreated: new Date("2025-03-29T10:00:00Z"),
    equipmentId: "PLAYAS-CAJA001",
    lastMaintenance: {
      date: new Date("2025-05-17T11:30:00Z"),
      notes: "Optimización de sistema y limpieza interna",
      type: "Performance",
    },
    location: "Sucursal Playas",
    status: "Active",
    type: "Desktop Computer",
    brand: "Lenovo",
    model: "LEN-TCM70Q",
  },
  {
    serialNumber: `EQ-${generateRandomCode()}`,
    components: {
      component1: {
        name: "Procesador Intel Core i3-10100",
        installationDate: new Date("2025-03-30T08:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component2: {
        name: "Placa Madre ASUS Prime H410M",
        installationDate: new Date("2025-03-30T08:20:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component3: {
        name: "RAM Crucial 8GB DDR4",
        installationDate: new Date("2025-03-30T08:40:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component4: {
        name: "HDD Toshiba 1TB",
        installationDate: new Date("2025-03-30T09:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component5: {
        name: "Fuente de Poder Seasonic FOCUS GX-550",
        installationDate: new Date("2025-03-30T09:20:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
    },
    peripherals: {
      peripheral1: {
        name: "Monitor BenQ GW2480",
        installationDate: new Date("2025-03-30T09:40:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral2: {
        name: "Teclado ASUS KB07",
        installationDate: new Date("2025-03-30T10:00:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral3: {
        name: "Mouse ASUS MD100",
        installationDate: new Date("2025-03-30T10:20:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
    },
    dateCreated: new Date("2025-03-30T10:40:00Z"),
    equipmentId: "OTAY-CAJA001",
    lastMaintenance: {
      date: new Date("2025-05-18T14:00:00Z"),
      notes: "Reemplazo de cable de alimentación dañado",
      type: "Hardware",
    },
    location: "Sucursal Otay",
    status: "Active",
    type: "Desktop Computer",
    brand: "ASUS",
    model: "ASU-EXCD5",
  },
  {
    serialNumber: `EQ-${generateRandomCode()}`,
    components: {
      component1: {
        name: "Procesador Intel Core i5-8500",
        installationDate: new Date("2025-03-31T08:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component2: {
        name: "Placa Madre Dell OptiPlex 3080",
        installationDate: new Date("2025-03-31T08:20:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component3: {
        name: "RAM Crucial 8GB DDR4",
        installationDate: new Date("2025-03-31T08:40:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component4: {
        name: "SSD Kingston A400 240GB",
        installationDate: new Date("2025-03-31T09:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component5: {
        name: "Fuente de Poder Dell 240W",
        installationDate: new Date("2025-03-31T09:20:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
    },
    peripherals: {
      peripheral1: {
        name: "Monitor Dell P2422H",
        installationDate: new Date("2025-03-31T09:40:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral2: {
        name: "Teclado Dell KB522",
        installationDate: new Date("2025-03-31T10:00:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral3: {
        name: "Mouse Dell MS322",
        installationDate: new Date("2025-03-31T10:20:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
    },
    dateCreated: new Date("2025-03-31T10:40:00Z"),
    equipmentId: "LAMESA-CAJA001",
    lastMaintenance: {
      date: new Date("2025-05-19T15:30:00Z"),
      notes: "Actualización de firmware de almacenamiento",
      type: "Configuration",
    },
    location: "Sucursal La Mesa",
    status: "Active",
    type: "Desktop Computer",
    brand: "Dell",
    model: "DEL-PR3240",
  },
  {
    serialNumber: `EQ-${generateRandomCode()}`,
    components: {
      component1: {
        name: "Procesador Intel Core i5-8500",
        installationDate: new Date("2025-04-01T08:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component2: {
        name: "Placa Madre HP EliteDesk",
        installationDate: new Date("2025-04-01T08:15:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component3: {
        name: "RAM Kingston Fury 16GB DDR4",
        installationDate: new Date("2025-04-01T08:30:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component4: {
        name: "SSD Samsung 870 EVO 1TB",
        installationDate: new Date("2025-04-01T08:45:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
      component5: {
        name: "Fuente de Poder HP 300W 80+ Bronze",
        installationDate: new Date("2025-04-01T09:00:00Z"),
        serialNumber: `CP-${generateRandomCode()}`,
      },
    },
    peripherals: {
      peripheral1: {
        name: "Monitor HP M24f FHD",
        installationDate: new Date("2025-04-01T09:15:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral2: {
        name: "Teclado HP USB Keyboard",
        installationDate: new Date("2025-04-01T09:30:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
      peripheral3: {
        name: "Mouse Microsoft Basic Optical",
        installationDate: new Date("2025-04-01T09:45:00Z"),
        serialNumber: `PR-${generateRandomCode()}`,
      },
    },
    dateCreated: new Date("2025-04-01T10:00:00Z"),
    equipmentId: "CHAPUL-CAJA001",
    lastMaintenance: {
      date: new Date("2025-05-20T12:00:00Z"),
      notes: "Actualización de controladores y software",
      type: "Software",
    },
    location: "Sucursal Chapultepec",
    status: "Active",
    type: "Desktop Computer",
    brand: "HP",
    model: "HP-ED800G4",
  },
];

module.exports = equipmentActives;
