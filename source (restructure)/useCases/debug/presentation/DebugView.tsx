import { StyleSheet, Platform, StatusBar, View } from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { NavigationScreenProps, SafeAreaView } from "react-navigation";
import React, {
    FunctionComponent,
    ReactElement,
    useState,
    useEffect
} from "react";
import DeviceInfo from "react-native-device-info";
import LocationMonitor, {
    Location,
    LocationMonitorState
} from "../../../shared/geolocation/LocationMonitor";
import { Chip, DataTable, Title } from "react-native-paper";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhiteBackground
    },
    container: {
        padding: 16
    },
    keyboardAvoidingView: {
        flex: 1
    }
});

interface DebugViewProps extends NavigationScreenProps {
    locationMonitor: LocationMonitor;
}

const DebugView: FunctionComponent<DebugViewProps> = (props): ReactElement => {
    const [count, setCount] = useState<number>(0);
    const [geolocation, setGeolocation] = useState<Location>();
    const [geolocationState, setGeolocationState] = useState<
        LocationMonitorState
    >("stopped");

    useEffect(() => {
        const subscription = props.locationMonitor.location.subscribe(
            location => {
                setCount(c => {
                    const newCount = c + 1;
                    console.log(`newCount: ${newCount}`);
                    return newCount;
                });
                setGeolocation(location);
            }
        );
        const cleanup = (): void => subscription.unsubscribe();
        return cleanup;
    }, []);

    useEffect(() => {
        const subscription = props.locationMonitor.state.subscribe(state =>
            setGeolocationState(state)
        );
        const cleanup = (): void => subscription.unsubscribe();
        return cleanup;
    }, []);

    const toDateString = (timestamp?: number): string | undefined => {
        const formatDate = (t: number): string => {
            const date = new Date(t);
            const stringDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const stringTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            return `${stringDate} ${stringTime}`;
        };
        return timestamp != null ? formatDate(timestamp) : undefined;
    };

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <View style={styles.container}>
                <Title>Location Monitor State</Title>
                <Chip
                    disabled={geolocationState === "stopped"}
                    icon={
                        geolocationState === "started"
                            ? "crosshairs-gps"
                            : "close-circle-outline"
                    }
                    selected={geolocationState === "started"}
                    selectedColor="#006400"
                >
                    {geolocationState}
                </Chip>
                <Title>Location Update</Title>
                <DataTable.Row>
                    <DataTable.Cell>Count</DataTable.Cell>
                    <DataTable.Cell numeric>{count}</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Time</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {toDateString(geolocation?.time)}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Latitude</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {geolocation?.latitude}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Longitude</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {geolocation?.longitude}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Address 1</DataTable.Cell>
                    <DataTable.Cell>
                        {geolocation?.address?.route}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Address 2</DataTable.Cell>
                    <DataTable.Cell>
                        {geolocation?.address?.locality}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Address 3</DataTable.Cell>
                    <DataTable.Cell>
                        {geolocation?.address?.administrativeAreaLevel1}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Accuracy</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {geolocation?.accuracy}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Altitude</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {geolocation?.altitude}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Speed</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {geolocation?.speed}
                    </DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Bearing</DataTable.Cell>
                    <DataTable.Cell numeric>
                        {geolocation?.bearing}
                    </DataTable.Cell>
                </DataTable.Row>
            </View>
        </SafeAreaView>
    );
};

export default DebugView;
