import { Appbar, Button, Text } from "react-native-paper";
import {
    StyleSheet,
    Platform,
    StatusBar,
    View,
    Dimensions,
    ScaledSize
} from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import React, {
    ReactElement,
    FunctionComponent,
    useEffect,
    useState
} from "react";
import DeviceInfo from "react-native-device-info";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ImageBackgrounds } from "../../../../source/Primary Adapters/Presentation/Images";
import AddMuTagViewModel from "./AddMuTagViewModel";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import Localize from "../../../shared/localization/Localize";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    mainImage: {
        width: "100%",
        resizeMode: "contain",
        backgroundColor: Theme.Color.AlmostWhite,
        position: "absolute"
    },
    mainImageView: {
        width: "100%",
        height: "100%",
        backgroundColor: Theme.Color.AlmostWhite
    },
    appBar: {
        backgroundColor: "transparent",
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0
            }
        })
    },
    topContainer: {
        flex: 1
    },
    bottomContainer: {
        flex: 1
    },
    instructions: {
        flex: 1,
        justifyContent: "space-evenly",
        marginHorizontal: 16
    },
    instructionsRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        width: "100%"
    },
    instructionsInfoRow: {
        marginTop: 4,
        marginBottom: 12
    },
    instructionsIconCol: {
        flex: 1,
        textAlign: "center"
    },
    instructionsIcon: {
        fontSize: Scale(40),
        color: Theme.Color.PrimaryBlue
    },
    instructionsInfoIcon: {
        fontSize: Scale(22, 19),
        color: Theme.Color.SecondaryBlue
    },
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 12
    },
    instructionsText: {
        fontSize: Scale(22) // Default 24
    },
    instructionsInfoText: {
        fontSize: Scale(15, 13), // Default 14
        color: "grey"
    },
    button: {
        alignSelf: "center",
        marginVertical: 16
    },
    errorDialogTitle: {
        fontSize: Scale(20, 19)
    }
});

interface AddMuTagIntroViewProps extends NavigationScreenProps {
    localize: Localize;
    viewModel: AddMuTagViewModel;
}

const AddMuTagIntroView: FunctionComponent<AddMuTagIntroViewProps> = (
    props
): ReactElement => {
    const getWindow = (): ScaledSize => Dimensions.get("window");
    const [window, setWindow] = useState<ScaledSize>(getWindow());

    useEffect(() => {
        setWindow(getWindow());
    }, [window]);

    return (
        <ImageBackgrounds.AddMuTag
            imageStyle={[styles.mainImage, { top: -window.height / Scale(6) }]}
            style={styles.mainImageView}
        >
            <SafeAreaView style={[styles.safeAreaView]}>
                <View style={styles.topContainer}>
                    <Appbar.Header style={styles.appBar}>
                        <Appbar.BackAction
                            onPress={() => {
                                props.viewModel.cancel();
                            }}
                        />
                    </Appbar.Header>
                </View>
                <View style={styles.bottomContainer}>
                    <View style={styles.instructions}>
                        <View style={styles.instructionsRow}>
                            <Icon
                                name="numeric-1-circle"
                                color="black"
                                style={[
                                    styles.instructionsIconCol,
                                    styles.instructionsIcon
                                ]}
                            />
                            <Text
                                style={[
                                    styles.instructionsTextCol,
                                    styles.instructionsText
                                ]}
                            >
                                {props.localize.getText(
                                    "AddMuTag",
                                    "Instructions",
                                    "List1"
                                )}
                            </Text>
                        </View>
                        <View>
                            <View style={styles.instructionsRow}>
                                <Icon
                                    name="numeric-2-circle"
                                    style={[
                                        styles.instructionsIconCol,
                                        styles.instructionsIcon
                                    ]}
                                />
                                <Text
                                    numberOfLines={2}
                                    style={[
                                        styles.instructionsTextCol,
                                        styles.instructionsText
                                    ]}
                                >
                                    {props.localize.getText(
                                        "AddMuTag",
                                        "Instructions",
                                        "List2"
                                    )}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.instructionsRow,
                                    styles.instructionsInfoRow
                                ]}
                            >
                                <Icon
                                    name="information-outline"
                                    style={[
                                        styles.instructionsIconCol,
                                        styles.instructionsInfoIcon
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.instructionsTextCol,
                                        styles.instructionsInfoText
                                    ]}
                                >
                                    {props.localize.getText(
                                        "AddMuTag",
                                        "Instructions",
                                        "Info"
                                    )}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <Button
                    mode="contained"
                    onPress={() => props.viewModel.goToFindMuTag()}
                    style={styles.button}
                >
                    {props.localize.getText(
                        "AddMuTag",
                        "Instructions",
                        "ButtonContinue"
                    )}
                </Button>
            </SafeAreaView>
        </ImageBackgrounds.AddMuTag>
    );
};

export default AddMuTagIntroView;
