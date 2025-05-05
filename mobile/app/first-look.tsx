import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Platform,
  StatusBar,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

type Point = Record<string, string | number>;
type AveragePoint = {
  sensor_id: string;
  year: number;
  week_number: number;
  avg_temperature: number | null;
  avg_pressure: number | null;
  avg_humidity: number | null;
  avg_vcc: number | null;
  datapoints: number;
  calculation_timestamp: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const REALTIME_FIELDS = [
  "esmcTime",
  "temperature",
  "humidity",
  "pressure",
  "soilMoisture20",
  "soilMoisture5",
  "soilTemperature",
  "vcc",
];

const AVERAGE_FIELDS = [
  "year",
  "week_number",
  "avg_temperature",
  "avg_pressure",
  "avg_humidity",
  "avg_vcc",
  "datapoints",
  "calculation_timestamp",
];

const REALTIME_HEADER_DISPLAY_NAMES: Record<string, string> = {
  temperature: "Temp(°C)",
  humidity: "Humidity(%)",
  pressure: "Pressure(kPa)",
  soilTemperature: "soilTemp(°C)",
  vcc: "Voltage(mV)",
};

const AVERAGE_HEADER_DISPLAY_NAMES: Record<string, string> = {
    year: "Year",
    week_number: "Week",
    avg_temperature: "Avg Temp (°C)",
    avg_pressure: "Avg Pres (kPa)",
    avg_humidity: "Avg Hum (%)",
    avg_vcc: "Avg VCC (mV)",
    datapoints: "Points",
    calculation_timestamp: "Updated (UTC)",
};

const formatChicagoTime = (utcString: string): string => {
    const utc = new Date(utcString);
    const offsetMs = -5 * 60 * 60 * 1000; // UTC-5 !! Hardcoded for now
    const chicago = new Date(utc.getTime() + offsetMs);
  
    const yyyy = chicago.getFullYear();
    const mm = String(chicago.getMonth() + 1).padStart(2, "0");
    const dd = String(chicago.getDate()).padStart(2, "0");
    const hh = String(chicago.getHours()).padStart(2, "0");
    const min = String(chicago.getMinutes()).padStart(2, "0");
  
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

const formatAverageTimestamp = (utcString: string): string => {
  const d = new Date(utcString);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

export default function FirstLook() {
  const [sensorId, setSensorId] = useState("usda-air-w06");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const [isWeeklyAverage, setIsWeeklyAverage] = useState(false);

  const [realtimeColumns, setRealtimeColumns] = useState<string[]>([]);
  const [realtimeRows, setRealtimeRows] = useState<Point[]>([]);

  const [averageColumns, setAverageColumns] = useState<string[]>([]);
  const [averageRows, setAverageRows] = useState<AveragePoint[]>([]);

  const [dataTypeDisplayed, setDataTypeDisplayed] = useState<'realtime' | 'average' | null>(null);

  const fetchData = useCallback(async () => {
    if (!sensorId.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setDataTypeDisplayed(null);
    setRealtimeColumns([]);
    setRealtimeRows([]);
    setAverageColumns([]);
    setAverageRows([]);

    try {
        let url = "";
        if (isWeeklyAverage) {
            url = `${API_BASE_URL}/api/sensor_data/get_average/${sensorId.trim()}/`;

            const resp = await fetch(url);
            if (!resp.ok) {
                let errorJson;
                try {
                    errorJson = await resp.json();
                } catch (parseError) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorJson?.error || `HTTP error! status: ${resp.status}`);
            }
            const avgData = (await resp.json()) as AveragePoint[];

            if (!Array.isArray(avgData)) {
                throw new Error("Invalid average data format received.");
            }
            if (avgData.length === 0) throw new Error("No average data points returned");

            setAverageColumns(AVERAGE_FIELDS);
            setAverageRows(avgData);
            setDataTypeDisplayed('average');

        } else {
            const baseURL = process.env.EXPO_PUBLIC_REALTIME_DATA_URL;
            url = `${baseURL}/querySensorInDB_working_reverse.php?sensorID=${sensorId.trim()}`;

            const resp = (await fetch(url).then((r) => r.json())) as {
                status: number;
                message: string;
                sensorID: string;
                points: Point[];
              };

              if (resp.status !== 200) {
                throw new Error(resp.message || "Unknown error fetching real-time data");
              }
              const pts = resp.points.slice(0, 20);
              if (pts.length === 0) throw new Error("No real-time data points returned");

              let cols = [...REALTIME_FIELDS];
              const first = pts[0];
              if (
                first.soilTemperature === "NaN" ||
                Number.isNaN(Number(first.soilTemperature))
              ) {
                cols = cols.filter(
                  (c) =>
                    !["soilMoisture20", "soilMoisture5", "soilTemperature"].includes(c)
                );
              }
              setRealtimeColumns(cols);
              setRealtimeRows(pts);
              setDataTypeDisplayed('realtime');
        }

    } catch (e: any) {
      setErrorMsg(e.message);
      setDataTypeDisplayed(null);
      setRealtimeColumns([]);
      setRealtimeRows([]);
      setAverageColumns([]);
      setAverageRows([]);
    } finally {
      setLoading(false);
    }
  }, [sensorId, isWeeklyAverage]);

  const realtimeOtherCols = realtimeColumns.filter((c) => c !== "esmcTime");
  const averageOtherCols = averageColumns.filter(c => !['year', 'week_number'].includes(c));

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          testID="back-button"
        >
          <ImageBackground
            source={require('@/assets/images/back-arrow.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Lookup</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="sensor_id, e.g. usda-air-w06"
          value={sensorId}
          onChangeText={setSensorId}
          onSubmitEditing={fetchData}
        />
        <Pressable style={styles.button} onPress={fetchData}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.switchRow}>
        <Text>Weekly Average   </Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isWeeklyAverage ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={() => setIsWeeklyAverage(previousState => !previousState)}
          value={isWeeklyAverage}
        />
        <Text></Text>
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 24 }} />}
      {!!errorMsg && !loading && (
        <Text style={styles.error}>{errorMsg}</Text>
      )}

      {!loading && !errorMsg && dataTypeDisplayed === 'realtime' && realtimeRows.length > 0 && (
        <ScrollView style={{ flex: 1, marginTop: 12 }}>
          <Text style={styles.tableTitle}>Real-time Data (Last 20 points)</Text>
          <View style={{ flexDirection: "row" }}>
            <View>
              <View style={[styles.row, styles.header]}>
                    <Text style={[styles.indexCell, styles.headerText]}>No. </Text>
                    <Text style={[styles.timeCell,  styles.headerText]}> Central Time (CT)</Text>
              </View>
              {realtimeRows.map((item, idx) => (
                <View style={styles.row} key={`realtime-${idx}`}>
                    <Text style={styles.indexCell}>{idx + 1}</Text>
                    <Text style={styles.timeCell}>
                        {formatChicagoTime(item.esmcTime as string)}
                    </Text>
                    <View style={styles.verticalLine} />
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={[styles.row, styles.header]}>
                  {realtimeOtherCols.map((c) => (
                    <Text style={[styles.cell, styles.headerText]} key={c}>
                      {REALTIME_HEADER_DISPLAY_NAMES[c] || c}
                    </Text>
                  ))}
                </View>
                {realtimeRows.map((item, idx) => (
                  <View style={styles.row} key={`realtime-data-${idx}`}>
                    {realtimeOtherCols.map((c) => (
                      <Text style={styles.cell} key={c}>
                        {String(item[c] ?? 'N/A')}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {!loading && !errorMsg && dataTypeDisplayed === 'average' && averageRows.length > 0 && (
         <ScrollView style={{ flex: 1, marginTop: 12 }}>
            <Text style={styles.tableTitle}>Weekly Average Data</Text>
            <View style={{ flexDirection: "row" }}>
                <View>
                    <View style={[styles.row, styles.header]}>
                        <Text style={[styles.yearWeekCell, styles.headerText]}>Year</Text>
                        <Text style={[styles.yearWeekCell, styles.headerText]}>Week</Text>
                        <View style={styles.verticalLine} />
                    </View>
                    {averageRows.map((item, idx) => (
                        <View style={styles.row} key={`avg-${item.year}-${item.week_number}`}>
                           <Text style={styles.yearWeekCell}>{item.year}</Text>
                           <Text style={styles.yearWeekCell}>{String(item.week_number).padStart(2, '0')}</Text>
                           <View style={styles.verticalLine} />
                        </View>
                    ))}
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                        <View style={[styles.row, styles.header]}>
                            {averageOtherCols.map((c) => (
                                <Text style={[styles.cell, styles.headerText]} key={c}>
                                    {AVERAGE_HEADER_DISPLAY_NAMES[c] || c}
                                </Text>
                            ))}
                        </View>
                         {averageRows.map((item, idx) => (
                            <View style={styles.row} key={`avg-data-${item.year}-${item.week_number}`}>
                                {averageOtherCols.map((c) => (
                                    <Text style={styles.cell} key={c}>
                                        {c === 'calculation_timestamp'
                                            ? formatAverageTimestamp(item[c as keyof AveragePoint] as string)
                                            : String(item[c as keyof AveragePoint] ?? 'N/A')}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
         </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  headerContainer: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 0) + 80,
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  backButton: {
    padding: 5,
    width: 40,
    alignItems: 'center',
  },
  backIcon: {
    width: 25,
    height: 25,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  inputRow: { marginTop: (StatusBar.currentHeight || 0) + 140, flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 40,
  },
  button: {
    marginLeft: 8,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  error: { color: "red", marginTop: 24, textAlign: 'center' },
  tableTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
  },
  header: { backgroundColor: "#f3f4f6" },
  headerText: { fontWeight: "600" },
  row: { flexDirection: "row", paddingVertical: 6, alignItems: 'center' },
  indexCell:  { width: 30, textAlign: "center", fontSize: 12 },
  timeCell:   { minWidth: 100, fontSize: 12 },
  yearWeekCell: { width: 50, textAlign: 'center', fontSize: 12},
  cell:       { minWidth: 100, fontSize: 12, paddingHorizontal: 4, textAlign: 'right'},
  verticalLine: {
    width: 1,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
    alignSelf: 'stretch',
  },
});
