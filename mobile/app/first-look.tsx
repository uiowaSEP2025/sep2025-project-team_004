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
} from "react-native";
import { useRouter } from "expo-router";

type Point = Record<string, string | number>;

const FIELDS = [
  "esmcTime",
  "temperature",
  "humidity",
  "pressure",
  "soilMoisture20",
  "soilMoisture5",
  "soilTemperature",
  "vcc",
];

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

export default function FirstLook() {
  const [sensorId, setSensorId] = useState("usda-air-w06");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Point[]>([]);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!sensorId.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      // Will change the URL to env var later
      // const url = `https://d2tedebo3dq0kj.cloudfront.net/api/sensor_data/${sensorId.trim()}`;
      const baseURL = process.env.EXPO_PUBLIC_REALTIME_DATA_URL; 
      const url = `${baseURL}/querySensorInDB_working_reverse.php?sensorID=${sensorId.trim()}`;

      const resp = (await fetch(url).then((r) => r.json())) as {
        status: number;
        message: string;
        sensorID: string;
        points: Point[];
      };

      if (resp.status !== 200) {
        throw new Error(resp.message || "Unknown error");
      }
      const pts = resp.points.slice(0, 20);
      if (pts.length === 0) throw new Error("No data points returned");


      let cols = [...FIELDS];
      // If the first soilTemperature is NaN, remove the last three columns
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

      setColumns(cols);
      setRows(pts);
    } catch (e: any) {
      setErrorMsg(e.message);
      setColumns([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [sensorId]);

  // All columns except esmcTime are used for horizontal scrolling
  const otherCols = columns.filter((c) => c !== "esmcTime");

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={styles.headerContainer}>
        {/* Back Button */}
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

        {/* Title */}
        <Text style={styles.headerTitle}>Real-Time Data Lookup</Text>

        {/* Placeholder for centering */}
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="sensor_id, e.b. usda-air-w06"
          value={sensorId}
          onChangeText={setSensorId}
          onSubmitEditing={fetchData}
        />
        <Pressable style={styles.button} onPress={fetchData}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
      </View>

      {/* loading / error */}
      {loading && <ActivityIndicator size="large" style={{ marginTop: 24 }} />}
      {!!errorMsg && !loading && (
        <Text style={styles.error}>{errorMsg}</Text>
      )}

      {!loading && !errorMsg && rows.length > 0 && (
        <ScrollView style={{ flex: 1, marginTop: 12 }}>
          <View style={{ flexDirection: "row" }}>
            <View>
              <View style={[styles.row, styles.header]}>
                    <Text style={[styles.indexCell, styles.headerText]}>No. </Text>
                    <Text style={[styles.timeCell,  styles.headerText]}> Central Time (CT)</Text>
              </View>
              {rows.map((item, idx) => (
                <View style={styles.row} key={idx}>
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
                  {otherCols.map((c) => (
                    <Text style={[styles.cell, styles.headerText]} key={c}>
                      {c}
                    </Text>
                  ))}
                </View>

                {rows.map((item, idx) => (
                  <View style={styles.row} key={idx}>
                    {otherCols.map((c) => (
                      <Text style={styles.cell} key={c}>
                        {String(item[c])}
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
  error: { color: "red", marginTop: 24 },
  header: { backgroundColor: "#f3f4f6" },
  headerText: { fontWeight: "600" },
  row:        { flexDirection: "row", paddingVertical: 6 },
  indexCell:  { width: 30, textAlign: "center", fontSize: 12 },
  timeCell:   { minWidth: 100, fontSize: 12 },  
  cell:       { width: 100, fontSize: 12, paddingHorizontal: 4 },
  verticalLine: {
    width: 1,
    backgroundColor: "black",
    marginHorizontal: 4,
    height: "100%", 
  },
  

});
