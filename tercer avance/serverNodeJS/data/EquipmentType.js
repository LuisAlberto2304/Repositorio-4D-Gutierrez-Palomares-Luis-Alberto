const { Timestamp } = require("firebase-admin/firestore");
const sampleEquipmentTypes = [
  {
    name: "Desktop Computer",
    dateCreated: Timestamp.fromDate(new Date("2023-03-01")),
    description:
      "Stationary computing device commonly used in offices and labs",
  },
  {
    name: "Laptop",
    dateCreated: Timestamp.fromDate(new Date("2023-03-05")),
    description:
      "Portable computer with integrated battery, ideal for mobile work",
  },
  {
    name: "Printer",
    dateCreated: Timestamp.fromDate(new Date("2023-03-10")),
    description: "Device for printing physical documents from digital sources",
  },
  {
    name: "Mini-PC",
    dateCreated: Timestamp.fromDate(new Date("2023-03-15")),
    description: "Compact computer suitable for limited-space environments",
  },
  {
    name: "Server",
    dateCreated: Timestamp.fromDate(new Date("2023-03-20")),
    description:
      "High-performance system for handling network and data services",
  },
  {
    name: "All-in-One Workstation",
    dateCreated: Timestamp.fromDate(new Date("2023-04-01")),
    description: "Integrated system combining monitor and computer in one unit",
  },
  {
    name: "Network Attached Storage",
    dateCreated: Timestamp.fromDate(new Date("2023-04-05")),
    description:
      "Dedicated device for storing and sharing files over a network",
  },
  {
    name: "Point of Sale System",
    dateCreated: Timestamp.fromDate(new Date("2023-04-10")),
    description:
      "System used for processing retail transactions and managing sales",
  },
];

module.exports = sampleEquipmentTypes;
