import {
    Button,
    Headline,
    ActivityIndicator,
    Banner
} from "react-native-paper";
import { StyleSheet, Platform, StatusBar, View } from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import React, {
    ReactElement,
    FunctionComponent,
    useEffect,
    useState
} from "react";
import DeviceInfo from "react-native-device-info";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AddMuTagViewModel, { MediumPriorityMessage } from "./AddMuTagViewModel";
import { ProgressIndicatorState } from "../../../shared/viewModel/ViewModel";
import Localize from "../../../shared/localization/Localize";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhite,
        paddingHorizontal: 16
    },
    mainContainer: {
        flex: 1,
        justifyContent: "center"
    },
    headline: {
        textAlign: "center",
        fontSize: Scale(28, 24),
        marginBottom: 32
    },
    attachedToInput: {
        backgroundColor: "white"
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
    /*instructionsIconCol: {
        flex: 1,
        textAlign: "center"
    },
    instructionsIcon: {
        fontSize: Scale(40),
        color: Theme.Color.PrimaryBlue
    },*/
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 12
    },
    instructionsText: {
        fontSize: Scale(22) // Default 24
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    button: {
        marginVertical: 16
    },
    errorDialogTitle: {
        fontSize: Scale(20, 19)
    }
});

type BannerActions = Array<{ label: string; onPress: () => void }>;

interface FindAddMuTagViewProps extends NavigationScreenProps {
    localize: Localize;
    viewModel: AddMuTagViewModel;
}

const FindAddMuTagView: FunctionComponent<FindAddMuTagViewProps> = (
    props
): ReactElement => {
    const [bannerActions, setBannerActions] = useState<BannerActions>([]);
    const [bannerMessage, setBannerMessage] = useState<
        MediumPriorityMessage | undefined
    >(props.viewModel.mediumPriorityMessageValue);
    const [progressIndicator, setProgressIndicator] = useState<
        ProgressIndicatorState
    >(props.viewModel.progressIndicatorValue);
    const [showCancel, setShowCancel] = useState<boolean>(
        props.viewModel.showCancel.value
    );
    const [showCancelActivity, setShowCancelActivity] = useState<boolean>(
        props.viewModel.showCancelActivity.value
    );
    const [showRetry, setShowRetry] = useState<boolean>(
        props.viewModel.showRetry.value
    );

    useEffect(() => {
        const subscription = props.viewModel.progressIndicator.subscribe(
            setProgressIndicator
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.progressIndicator]);

    useEffect(() => {
        const subscription = props.viewModel.showCancel.subscribe(
            setShowCancel
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.showCancel]);

    useEffect(() => {
        const subscription = props.viewModel.showCancelActivity.subscribe(
            setShowCancelActivity
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.showCancelActivity]);

    useEffect(() => {
        const subscription = props.viewModel.mediumPriorityMessage.subscribe(
            setBannerMessage
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.mediumPriorityMessage]);

    useEffect(() => {
        const subscription = props.viewModel.showRetry.subscribe(setShowRetry);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showRetry]);

    useEffect(() => {
        props.viewModel.startAddingMuTag();
    }, [props.viewModel]);

    useEffect(() => {
        const actions: BannerActions = [];
        if (showCancel) {
            actions.push({
                label: props.localize.getText(
                    "AddMuTag",
                    "Adding",
                    "ButtonCancel"
                ),
                onPress: () => props.viewModel.cancel()
            });
        }
        if (showRetry) {
            actions.push({
                label: props.localize.getText(
                    "AddMuTag",
                    "Adding",
                    "ButtonTryAgain"
                ),
                onPress: () => props.viewModel.startAddingMuTag(true)
            });
        }
        setBannerActions(actions);
    }, [props.localize, props.viewModel, showCancel, showRetry]);

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <Banner
                visible={bannerMessage != null}
                actions={bannerActions}
                icon={({ size }) => (
                    <Icon name="alert-circle" style={{ fontSize: size }} />
                )}
            >
                {bannerMessage != null
                    ? props.localize.getText(
                          "AddMuTag",
                          "BannerMessage",
                          bannerMessage
                      )
                    : ""}
            </Banner>
            <View style={styles.mainContainer}>
                {progressIndicator === "Indeterminate" ? (
                    <View>
                        <Headline style={styles.headline}>
                            {showCancel
                                ? props.localize.getText(
                                      "AddMuTag",
                                      "Adding",
                                      "Searching"
                                  )
                                : props.localize.getText(
                                      "AddMuTag",
                                      "Adding",
                                      "SettingUp"
                                  )}
                        </Headline>
                        <ActivityIndicator
                            animating={true}
                            color={Theme.Color.PrimaryBlue}
                            size="large"
                        />
                    </View>
                ) : null}
                {/*bannerMessage == null ? null : (
                    <View style={styles.instructionsRow}>
                        <Icon
                            name="alert-circle"
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
                            {bannerMessage}
                        </Text>
                    </View>
                )*/}
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    mode="text"
                    onPress={() => props.viewModel.cancel()}
                    style={styles.button}
                    disabled={!showCancel}
                    loading={showCancelActivity}
                >
                    {props.localize.getText(
                        "AddMuTag",
                        "Adding",
                        "ButtonCancel"
                    )}
                </Button>
                {/*showRetry ? (
                    <Button
                        mode="contained"
                        onPress={() => props.viewModel.startAddingMuTag(true)}
                        style={styles.button}
                        disabled={progressIndicator != null}
                    >
                        {props.localize.getText(
                            "AddMuTag",
                            "Adding",
                            "ButtonTryAgain"
                        )}
                    </Button>
                ) : null*/}
            </View>
        </SafeAreaView>
    );
};

export default FindAddMuTagView;
