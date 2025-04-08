// EquipmentPicker.js
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { getAllDevices } from "../services/deviceService";

const EquipmentPicker = ({ currentType, onSelect }) => {
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const devices = await getAllDevices({ type: currentType });
        setAvailableEquipment(devices);
      } catch (error) {
        console.error("Error loading equipment:", error);
      }
    };
    loadEquipment();
  }, [currentType]);

  const handleSelect = (equipment) => {
    setSelected(equipment.id);
    onSelect(equipment);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Replacement Equipment:</Text>
      <FlatList
        data={availableEquipment}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, selected === item.id && styles.selectedItem]}
            onPress={() => handleSelect(item)}
          >
            <Text>
              {item.model} ({item.brand})
            </Text>
            {selected === item.id && <Text>✓</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = {
  container: { marginVertical: 16 },
  title: { fontWeight: "600", marginBottom: 8 },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectedItem: { backgroundColor: "#f0f7ff" },
};

export default EquipmentPicker;
