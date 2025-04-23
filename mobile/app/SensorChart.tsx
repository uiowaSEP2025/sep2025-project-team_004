import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  CartesianChart,
  Line,
  useChartPressState,
} from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";
import { useDerivedValue, runOnJS } from "react-native-reanimated";
import inter from "../assets/fonts/Inter_18pt-Medium.ttf";

// Define type for tooltip state
type TooltipData = { x: string | number; y: number } | null;

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
  const [tooltipData, setTooltipData] = useState<TooltipData>(null);

  const { state, isActive } = useChartPressState<{
    x: string | number;
    y: Record<"y", number>;
  }>({ x: 0, y: { y: 0 } });

  // Function to update state on JS thread
  const updateTooltip = (newData: TooltipData) => {
    "worklet";
    runOnJS(setTooltipData)(newData);
  };

  // Derived value to react to changes on UI thread and update JS state
  useDerivedValue(() => {
    if (isActive) {
      if (state.x.value.value !== undefined && state.y.y.value.value !== undefined) {
        const currentData = {
          x: state.x.value.value,
          y: state.y.y.value.value,
        };
        updateTooltip(currentData);
      }else{
        updateTooltip(null);
      }
    } else { // When finger is lifted
      // Clear tooltip data
      updateTooltip(null);
    }
  }, [isActive, state.x.value, state.y.y.value]);

  if (!font) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.chartTitle}>{title}</Text>
      {/* Display Coordinates using React state */}
      {tooltipData !== null && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {`Time: ${tooltipData.x}\n${title}: ${tooltipData.y.toFixed(1)}`}
          </Text>
        </View>
      )}
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
    // Ensure positioning context for absolute children
    position: "relative",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  // Style for the coordinate display
  tooltip: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 10, // Ensure it's above chart elements
  },
  tooltipText: {
    color: "#fff",
    fontSize: 10,
  },
});

export default React.memo(SensorChart);
