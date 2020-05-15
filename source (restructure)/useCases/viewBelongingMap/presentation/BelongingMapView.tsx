import { StyleSheet, Platform, StatusBar } from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import DeviceInfo from "react-native-device-info";
import { NavigationScreenProps, SafeAreaView } from "react-navigation";
import React, {
    useEffect,
    useState,
    FunctionComponent,
    ReactElement
} from "react";
import BelongingMapViewModel, {
    BelongingFeatureProperties
} from "./BelongingMapViewModel";
import MapboxGL from "@react-native-mapbox-gl/maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FeatureCollection, Point } from "geojson";

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
    map: {
        flex: 1
    },
    annotation: {
        backgroundColor: Theme.Color.PrimaryBlue
    }
});

interface BelongingMapViewProps extends NavigationScreenProps {
    belongingMapViewModel: BelongingMapViewModel;
    mapboxAccessToken: string;
}

const BelongingMapView: FunctionComponent<BelongingMapViewProps> = (
    props
): ReactElement => {
    const [belongingMarkers, setBelongingMarkers] = useState<
        FeatureCollection<Point, BelongingFeatureProperties>
    >({
        type: "FeatureCollection",
        features: []
    });
    const [mapLocation, setMapLocation] = useState<number[]>([0, 0]);
    const [belongingMarkerIcon, setBelongingMarkerIcon] = useState<any>("");

    const mapboxStyles = {
        belongingMarker: {
            iconImage: belongingMarkerIcon,
            iconAnchor: "bottom",
            textField: ["get", "name"],
            textFont: ["Open Sans SemiBold"],
            textAnchor: "bottom",
            textOffset: [0, -2.25],
            textHaloColor: "rgba(255, 255, 255, 0.8)",
            textHaloWidth: 1,
            textHaloBlur: 1
        }
    };

    useEffect(() => {
        const subscription = props.belongingMapViewModel.showBelongingMarkers.subscribe(
            update => {
                setBelongingMarkers(update);
                if (update.features.length !== 0) {
                    setMapLocation([
                        update.features[0].geometry.coordinates[0],
                        update.features[0].geometry.coordinates[1]
                    ]);
                }
            }
        );

        return (): void => {
            subscription.unsubscribe();
        };
    }, [props.belongingMapViewModel.showBelongingMarkers]);

    useEffect(() => {
        MapboxGL.setAccessToken(props.mapboxAccessToken);
    }, [props.mapboxAccessToken]);

    useEffect(() => {
        Icon.getImageSource(
            "map-marker",
            36,
            Theme.Color.PrimaryOrange
        ).then(source => setBelongingMarkerIcon(source));
    }, []);

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <MapboxGL.MapView style={styles.map} logoEnabled={false}>
                <MapboxGL.Camera
                    zoomLevel={16}
                    centerCoordinate={mapLocation}
                />
                <MapboxGL.ShapeSource id="belongings" shape={belongingMarkers}>
                    <MapboxGL.SymbolLayer
                        id="belongingMarker"
                        style={mapboxStyles.belongingMarker}
                    />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
        </SafeAreaView>
    );
};

export default BelongingMapView;
