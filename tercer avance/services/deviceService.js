import {
  doc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { updateTicketFinished } from "./ticketService";

export const changeBaseEquipment = async ({
  oldDeviceId,
  newDeviceId,
  problemType,
  notes,
  serialNumber,
  componentSerials,
  ticketId,
}) => {
  try {
    // 1. Obtener ambos equipos
    const oldDeviceRef = doc(db, "EquipmentActive", oldDeviceId);
    const newDeviceRef = doc(db, "Equipment", newDeviceId);

    const [oldDeviceSnap, newDeviceSnap] = await Promise.all([
      getDoc(oldDeviceRef),
      getDoc(newDeviceRef),
    ]);

    if (!oldDeviceSnap.exists()) {
      throw new Error(`Old device ${oldDeviceId} not found`);
    }

    if (!newDeviceSnap.exists()) {
      throw new Error(`New device ${newDeviceId} not found`);
    }

    const oldDeviceData = oldDeviceSnap.data();
    const newDeviceData = newDeviceSnap.data();

    // 2. Preparar componentes - versión más flexible
    let componentsWithDates = {};

    const componentKeys = {
      cpu: "component1", // Asumiendo que component1 es CPU
      mobo: "component2", // component2 es Motherboard
      ram: "component3", // component3 es RAM
      sto: "component4", // component4 es Storage
      psu: "component5", // component5 es PSU
    };

    if (newDeviceData.components) {
      Object.entries(newDeviceData.components).forEach(
        ([key, componentValue]) => {
          const componentName =
            typeof componentValue === "string"
              ? componentValue
              : componentValue?.name ||
                `Component ${key.replace("component", "")}`;

          // Determinar si este componente tiene un serial específico
          const componentType = Object.keys(componentKeys).find(
            (type) => componentKeys[type] === key,
          );
          const specificSerial = componentType
            ? componentSerials[componentType]
            : null;

          componentsWithDates[key] = {
            name: componentName,
            installationDate:
              typeof componentValue === "object"
                ? componentValue?.installationDate || serverTimestamp()
                : serverTimestamp(),
            serialNumber:
              specificSerial ||
              (typeof componentValue === "object"
                ? componentValue?.serialNumber
                : null) ||
              "N/A",
          };
        },
      );
    }
    // Opción 2: Si no hay componentes en el nuevo dispositivo, mantener los del antiguo
    else if (
      oldDeviceData.components &&
      Object.keys(oldDeviceData.components).length > 0
    ) {
      componentsWithDates = {
        component1: {
          name: "Processor",
          installationDate: serverTimestamp(),
          serialNumber: componentSerials.cpu || "N/A",
        },
        component2: {
          name: "Motherboard",
          installationDate: serverTimestamp(),
          serialNumber: componentSerials.mobo || "N/A",
        },
        component3: {
          name: "RAM",
          installationDate: serverTimestamp(),
          serialNumber: componentSerials.ram || "N/A",
        },
        component4: {
          name: "Storage",
          installationDate: serverTimestamp(),
          serialNumber: componentSerials.sto || "N/A",
        },
        component5: {
          name: "Power Supply",
          installationDate: serverTimestamp(),
          serialNumber: componentSerials.psu || "N/A",
        },
      };
    }
    // Opción 3: Si no hay componentes en ningún dispositivo
    else {
      console.warn("No components found in either device, using empty set");
      componentsWithDates = {
        component1: {
          name: "Default Component",
          installationDate: serverTimestamp(),
        },
      };
    }

    // 3. Preparar datos para actualización con valores seguros
    const updateData = {
      brand: newDeviceData.brand,
      location: oldDeviceData.location,
      type: newDeviceData.type,
      status: oldDeviceData.status || "Active",
      model: newDeviceData.model,
      components: componentsWithDates,
      peripherals: oldDeviceData.peripherals || {},
      serialNumber: serialNumber || newDeviceData.serialNumber || "N/A", // Usa el serial proporcionado o el del dispositivo
      lastMaintenance: {
        date: serverTimestamp(),
        notes: notes || "Device changed",
        problemType: problemType,
      },
      dateModified: serverTimestamp(),
    };

    console.log("Prepared update data:", updateData);

    // 4. Actualizar el documento
    await updateDoc(oldDeviceRef, updateData);
    await updateTicketFinished(ticketId);

    return {
      success: true,
      message: "Device change successfully",
      details: {
        componentsTransferred: Object.keys(componentsWithDates).length,
        usedNewDeviceComponents: !!newDeviceData.components,
      },
    };
  } catch (error) {
    console.error("Error transferring components:", error);
    throw new Error(`Transfer failed: ${error.message}`);
  }
};

export const changeComponents = async ({
  deviceId,
  componentUpdates,
  problemType,
  notes,
  ticketId,
}) => {
  try {
    const deviceRef = doc(db, "EquipmentActive", deviceId);
    const deviceSnap = await getDoc(deviceRef);

    if (!deviceSnap.exists()) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const deviceData = deviceSnap.data();
    const updatedComponents = { ...(deviceData.components || {}) };
    const updatedPeripherals = { ...(deviceData.peripherals || {}) };
    let componentChangesApplied = 0;
    let peripheralChangesApplied = 0;

    // Procesar cada cambio
    componentUpdates.forEach((update) => {
      if (!update.replacementComponentId || !update.partType) return;

      // Determinar si es componente o periférico
      const isPeripheral = update.partType.toLowerCase() === "peripheral"; // Importante que coincida con renderItem del Modal
      const targetMap = isPeripheral ? updatedPeripherals : updatedComponents;
      const changesCounter = isPeripheral
        ? peripheralChangesApplied
        : componentChangesApplied;

      // Buscar la clave por nombre
      const itemKey = Object.keys(targetMap).find((key) => {
        const item = targetMap[key];
        // Manejar tanto string como objeto
        const itemName = typeof item === "string" ? item : item?.name;
        return itemName === update.componentName;
      });

      if (itemKey) {
        // Actualizar el item
        targetMap[itemKey] = {
          name: update.replacementComponentId,
          serialNumber: update.replacementSerialNumber || "N/A",
          installationDate: serverTimestamp(),
          ...(typeof targetMap[itemKey] === "object"
            ? {
                // Mantener otras propiedades si existen
                ...targetMap[itemKey],
                name: update.replacementComponentId,
                serialNumber: update.replacementSerialNumber || "N/A",
                installationDate: serverTimestamp(),
              }
            : null),
        };

        // Incrementar el contador correspondiente
        if (isPeripheral) {
          peripheralChangesApplied++;
        } else {
          componentChangesApplied++;
        }
      }
    });

    // Preparar datos de actualización
    const updateData = {
      ...(Object.keys(updatedComponents).length > 0 && {
        components: updatedComponents,
      }),
      ...(Object.keys(updatedPeripherals).length > 0 && {
        peripherals: updatedPeripherals,
      }),
      lastMaintenance: {
        date: serverTimestamp(),
        notes: notes || "Component/Peripheral changes",
        problemType: problemType || "General",
      },
      dateModified: serverTimestamp(),
    };

    // Realizar update solo si hay cambios
    if (componentChangesApplied > 0 || peripheralChangesApplied > 0) {
      await updateDoc(deviceRef, updateData);
      await updateTicketFinished(ticketId);
    }

    return {
      success: true,
      message: `${componentChangesApplied} components and ${peripheralChangesApplied} peripherals updated`,
      updatedComponents: Object.keys(updatedComponents),
      updatedPeripherals: Object.keys(updatedPeripherals),
    };
  } catch (error) {
    console.error("Error updating components/peripherals:", error);
    throw new Error(`Update failed: ${error.message}`);
  }
};

export const updateEquipmentActiveNoChanges = async ({
  deviceId,
  problemType,
  notes,
  ticketId,
}) => {
  try {
    // Primero necesitamos obtener la referencia del dispositivo
    const deviceRef = doc(db, "EquipmentActive", deviceId);

    // Preparar datos para actualizar solo el historial
    const updateData = {
      status: "Active",
      lastMaintenance: {
        date: serverTimestamp(),
        notes: notes || "Maintenance performed (no parts changed)",
        problemType: problemType || "General",
      },
      dateModified: serverTimestamp(),
    };

    // Actualizar el documento
    await updateDoc(deviceRef, updateData);
    await updateTicketFinished(ticketId);

    return {
      success: true,
      message: "Ticket Successfully Solved",
    };
  } catch (error) {
    console.error("Error updating:", error);
    throw new Error(`Update failed: ${error.message}`);
  }
};

export const getDeviceByTicket = async (equipmentUID) => {
  try {
    // Validación básica del UID
    if (!equipmentUID) {
      throw new Error("Equipment UID not provided");
    }

    // 1. Consultar la info del equipo específico
    const equipmentRef = doc(db, "EquipmentActive", equipmentUID);
    const equipmentSnap = await getDoc(equipmentRef);

    if (!equipmentSnap.exists()) {
      throw new Error("Device not found");
    }

    // 2. Devolver los datos del equipo
    return {
      id: equipmentSnap.id,
      ...equipmentSnap.data(),
    };
  } catch (error) {
    console.error("Error getting equipment:", error);
    throw error;
  }
};

export const getAllDevices = async (filters = {}) => {
  try {
    const devicesRef = collection(db, "Equipment");

    // Construir la consulta dinámicamente según los filtros
    let queryRef = devicesRef;

    // Ejemplo: Filtrar por type si está presente en filters
    if (filters.type) {
      queryRef = query(queryRef, where("type", "==", filters.type));
    }

    const snapshot = await getDocs(queryRef);

    const devices = [];
    snapshot.forEach((doc) => {
      devices.push({
        id: doc.id,
        serialNumber: doc.data().serialNumber,
        ...doc.data(),
      });
    });

    return devices;
  } catch (error) {
    console.error("Error getting filtered devices:", error);
    throw error;
  }
};
