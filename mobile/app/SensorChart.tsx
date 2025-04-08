import React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";

const chartWidth = Dimensions.get("window").width - 32;

interface SensorChartProps {
  title: string;
  data: any;
  config: any;
}

const SensorChart: React.FC<SensorChartProps> = ({ title, data, config }) => (
  <View style={styles.card}>
    <Text style={styles.chartTitle}>{title}</Text>
    <LineChart
      data={data}
      width={chartWidth}
      height={220}
      chartConfig={config}
      withInnerLines
      withOuterLines
      withVerticalLines={false}
      fromZero={false}
      withHorizontalLabels
      withVerticalLabels
      yLabelsOffset={8}
      xLabelsOffset={-4}
      horizontalLabelRotation={0}
      style={{ transform: [{ translateX: -12 }] }}
      withShadow={false}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
});

export default React.memo(SensorChart);
