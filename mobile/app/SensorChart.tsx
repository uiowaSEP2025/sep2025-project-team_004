import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  CartesianChart,
  Line,
  useChartPressState,
} from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";
import inter from "../assets/fonts/Inter_18pt-Medium.ttf";

// Use system font — no import needed!
const SensorChart = ({
  title,
  data,
  color,
}: {
  title: string;
  data: { x: string | number; y: number }[];
  color: string;
}) => {
  const font = useFont(inter, 12);

  const { state, isActive } = useChartPressState<{
    x: string | number;
    y: Record<"y", number>;
  }>({ x: 0, y: { y: 0 } });

  if (!font) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={{ height: 220 }}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={["y"]}
          axisOptions={{
            font,
            tickCount: 5,
          }}
          chartPressState={state}
        >
          {({ points }) => (
            <>
              <Line points={points.y} color={color} strokeWidth={2.5} />
              {isActive && (
                <Circle
                  cx={state.x.position}
                  cy={state.y.y.position}
                  r={6}
                  color={color}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
};

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
    textAlign: "center",
  },
});

export default React.memo(SensorChart);
