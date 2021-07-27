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
import MapboxGL, {
    SymbolLayerStyle,
    CircleLayerStyle
} from "@react-native-mapbox-gl/maps";
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

    const symbolLayerStyles: { [key: string]: StyleProp<SymbolLayerStyle> } = {
        belongingMarker: {
            iconAllowOverlap: true,
            iconImage: belongingMarkerIcon,
            iconPadding: 0,
            iconSize: ["interpolate", ["linear"], ["zoom"], 18, 0.5, 20, 1],
            textField: ["get", "name"],
            textFont: ["Open Sans SemiBold"],
            textJustify: "auto",
            textPadding: 0,
            textSize: ["interpolate", ["linear"], ["zoom"], 18, 12, 20, 18],
            textHaloColor: "rgba(255, 255, 255, 0.8)",
            textHaloWidth: 1,
            textHaloBlur: 1,
            textRadialOffset: 1.4,
            textVariableAnchor: [
                "bottom",
                "top",
                "left",
                "right",
                "bottom-left",
                "bottom-right",
                "top-left",
                "top-right"
            ]
        },
        clusterCount: {
            textField: "{point_count}",
            textSize: 18,
            textPitchAlignment: "map",
            textColor: "white",
            textFont: ["Open Sans SemiBold"]
        }
    };
    const circleLayerStyles: { [key: string]: StyleProp<CircleLayerStyle> } = {
        clusteredPoint: {
            circlePitchAlignment: "map",
            circleColor: Theme.Color.PrimaryOrange,
            circleRadius: ["interpolate", ["linear"], ["zoom"], 14, 20, 17, 30],
            circleStrokeWidth: 5,
            circleStrokeColor: Theme.Color.SecondaryOrange,
            circleStrokeOpacity: 0.5
        },
        belongingMarkerCircle: {
            circlePitchAlignment: "map",
            circleColor: Theme.Color.SecondaryOrange,
            circleRadius: ["interpolate", ["linear"], ["zoom"], 18, 25, 20, 50],
            circleOpacity: 0.15,
            circleStrokeWidth: 2,
            circleStrokeColor: Theme.Color.PrimaryOrange,
            circleStrokeOpacity: 0.15
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
        return () => subscription.unsubscribe();
    }, [props.belongingMapViewModel.showBelongingMarkers]);

    useEffect(() => {
        MapboxGL.setAccessToken(props.mapboxAccessToken);
    }, [props.mapboxAccessToken]);

    useEffect(() => {
        Icon.getImageSource(
            "radar",
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
                <MapboxGL.UserLocation
                    onUpdate={updateUserLocation}
                    visible={false}
                />
                <MapboxGL.Camera
                    zoomLevel={18}
                    centerCoordinate={mapLocation}
                    animationMode="flyTo"
                />
                <MapboxGL.ShapeSource
                    id="belongings"
                    cluster
                    shape={belongingMarkers}
                >
                    <MapboxGL.SymbolLayer
                        id="pointCount"
                        style={symbolLayerStyles.clusterCount}
                    />
                    <MapboxGL.CircleLayer
                        id="clusteredPoints"
                        belowLayerID="pointCount"
                        filter={["has", "point_count"]}
                        style={circleLayerStyles.clusteredPoint}
                    />
                    <MapboxGL.SymbolLayer
                        id="belongingMarkers"
                        filter={["!", ["has", "point_count"]]}
                        style={symbolLayerStyles.belongingMarker}
                    />
                    <MapboxGL.CircleLayer
                        id="belongingMarkerCircles"
                        belowLayerID="pointCount"
                        filter={["!", ["has", "point_count"]]}
                        style={circleLayerStyles.belongingMarkerCircle}
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
