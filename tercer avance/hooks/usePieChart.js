import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const PieChartComponent = ({ data, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No hay datos disponibles</Text>
      </View>
    );
  }

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const chartData = data.map((item, index) => {
    const colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"];
    return {
      name: item.type,
      count: item.count,
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    };
  });

  return (
    <View style={styles.chartContainer}>
      <PieChart
        data={chartData}
        width={Dimensions.get("window").width - 60}
        height={height}
        chartConfig={chartConfig}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  noDataContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#95a5a6",
    fontSize: 14,
  },
});

export default PieChartComponent;
