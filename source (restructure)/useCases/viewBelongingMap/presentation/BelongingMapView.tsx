import { StyleSheet, Platform, StatusBar, View, StyleProp } from "react-native";
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
import MapboxGL, { SymbolLayerStyle } from "@react-native-mapbox-gl/maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FeatureCollection, Point } from "geojson";
import { FAB } from "react-native-paper";

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
    mapOverlayContainer: {
        backgroundColor: "transparent",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        paddingHorizontal: 16,
        paddingVertical: 24
    },
    fab: {
        backgroundColor: "white"
    }
    /*annotation: {
        backgroundColor: Theme.Color.PrimaryBlue
    }*/
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
    const [belongingMarkerIcon, setBelongingMarkerIcon] = useState<any>("");
    const [mapLocation, setMapLocation] = useState<number[]>([0, 0]);
    const [userLocation, setUserLocation] = useState<MapboxGL.Location>({
        coords: { latitude: 0, longitude: 0 }
    });

    const mapboxStyles: { [key: string]: StyleProp<SymbolLayerStyle> } = {
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
                /*if (update.features.length !== 0) {
                    setMapLocation([
                        update.features[0].geometry.coordinates[0],
                        update.features[0].geometry.coordinates[1]
                    ]);
                }*/
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

    const goToUserLocation = (): void => {
        setMapLocation([
            userLocation.coords.longitude,
            userLocation.coords.latitude
        ]);
    };

    const updateUserLocation = (location: MapboxGL.Location): void => {
        const locationUpdateDelta =
            location.timestamp == null
                ? 2
                : location.timestamp - (userLocation.timestamp ?? 0);
        const didLongitudeChange =
            location.coords.longitude - userLocation.coords.longitude !== 0;
        const didLatitudeChange =
            location.coords.latitude - userLocation.coords.latitude !== 0;
        const didCoordinateChange = didLongitudeChange || didLatitudeChange;
        if (locationUpdateDelta >= 2 && didCoordinateChange) {
            const isFirstLocation =
                userLocation.coords.longitude === 0 &&
                userLocation.coords.latitude === 0;
            setUserLocation(location);
            if (isFirstLocation) {
                setMapLocation([
                    location.coords.longitude,
                    location.coords.latitude
                ]);
            }
        }
    };

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <MapboxGL.MapView
                style={styles.map}
                logoEnabled={false}
                attributionPosition={{ bottom: 24, left: 16 }}
            >
                <MapboxGL.UserLocation onUpdate={updateUserLocation} />
                <MapboxGL.Camera
                    zoomLevel={17}
                    centerCoordinate={mapLocation}
                    animationMode="flyTo"
                />
                <MapboxGL.ShapeSource id="belongings" shape={belongingMarkers}>
                    <MapboxGL.SymbolLayer
                        id="belongingMarker"
                        style={mapboxStyles.belongingMarker}
                    />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            <View pointerEvents="box-none" style={styles.mapOverlayContainer}>
                <FAB
                    icon="crosshairs-gps"
                    color={Theme.Color.DarkGrey}
                    onPress={goToUserLocation}
                    style={styles.fab}
                />
            </View>
        </SafeAreaView>
    );
};

export default BelongingMapView;
