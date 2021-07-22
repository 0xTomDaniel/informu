import {
    Button,
    TextInput,
    Headline,
    Banner,
    Snackbar
} from "react-native-paper";
import {
    StyleSheet,
    Platform,
    StatusBar,
    View,
    TouchableWithoutFeedback,
    Keyboard
} from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import React, {
    ReactElement,
    FunctionComponent,
    useState,
    useEffect
} from "react";
import DeviceInfo from "react-native-device-info";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import AddMuTagViewModel, {
    MediumPriorityMessage,
    LowPriorityMessage
} from "./AddMuTagViewModel";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
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
        backgroundColor: Theme.Color.AlmostWhite
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 32
    },
    headline: {
        flex: 1,
        textAlign: "center",
        textAlignVertical: "center",
        fontSize: Scale(28, 24)
    },
    attachedToInput: {
        backgroundColor: "white"
    },
    bottomContent: {
        flex: 1,
        justifyContent: "center"
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
    instructionsInfoIcon: {
        fontSize: Scale(22, 19),
        color: Theme.Color.Error
    },*/
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 12
    },
    instructionsInfoText: {
        fontSize: Scale(15, 13),
        color: Theme.Color.Error
    },
    button: {
        alignSelf: "center",
        marginVertical: 16
    }
});

type BannerActions = Array<{ label: string; onPress: () => void }>;

interface NameMuTagViewProps extends NavigationScreenProps {
    localize: Localize;
    viewModel: AddMuTagViewModel;
}

const NameMuTagView: FunctionComponent<NameMuTagViewProps> = (
    props
): ReactElement => {
    const [bannerActions, setBannerActions] = useState<BannerActions>([]);
    const [bannerMessage, setBannerMessage] = useState<
        MediumPriorityMessage | undefined
    >(props.viewModel.mediumPriorityMessageValue);
    const [muTagName, setMuTagName] = useState<string>("");
    const [progressIndicator, setProgressIndicator] = useState<
        ProgressIndicatorState
    >(props.viewModel.progressIndicatorValue);
    const [showRetry, setShowRetry] = useState<boolean>(
        props.viewModel.showRetry.value
    );
    const [snackbarMessage, setSnackbarMessage] = useState<
        LowPriorityMessage | undefined
    >(props.viewModel.lowPriorityMessageValue);

    useEffect(() => {
        const subscription = props.viewModel.progressIndicator.subscribe(
            setProgressIndicator
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.progressIndicator]);

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
        const subscription = props.viewModel.lowPriorityMessage.subscribe(
            setSnackbarMessage
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.lowPriorityMessage]);

    useEffect(() => {
        const actions: BannerActions = [];
        if (showRetry) {
            actions.push({
                label: props.localize.getText(
                    "AddMuTag",
                    "Naming",
                    "ButtonTryAgain"
                ),
                onPress: () => props.viewModel.setMuTagName(muTagName, true)
            });
        }
        setBannerActions(actions);
    }, [muTagName, props.localize, props.viewModel, showRetry]);

    const getBannerMessage = (): string => {
        switch (bannerMessage?.messageKey) {
            case "FailedToAddMuTag":
            case "FailedToNameMuTag":
            case "NewMuTagNotFound":
                return props.localize.getText(
                    "AddMuTag",
                    "BannerMessage",
                    bannerMessage.messageKey
                );
            case "LowMuTagBattery":
                return props.localize.getText(
                    "AddMuTag",
                    "BannerMessage",
                    bannerMessage.messageKey
                );
            default:
                return "";
        }
    };

    const getSnackbarMessage = (): string => {
        if (snackbarMessage == null) {
            return "";
        }

        const message = props.localize.getText(
            "AddMuTag",
            "SnackbarMessage",
            snackbarMessage.messageKey
        );

        return props.localize.replaceVariables(message, snackbarMessage.data);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Banner
                    visible={bannerMessage != null}
                    actions={bannerActions}
                    icon={({ size }) => (
                        <Icon name="alert-circle" style={{ fontSize: size }} />
                    )}
                >
                    {getBannerMessage()}
                </Banner>
                <View style={styles.mainContainer}>
                    <Headline style={styles.headline}>
                        {props.localize.getText(
                            "AddMuTag",
                            "Naming",
                            "AskNameTitle"
                        )}
                    </Headline>
                    <TextInput
                        label={props.localize.getText(
                            "AddMuTag",
                            "Naming",
                            "NameInputLabel"
                        )}
                        mode="outlined"
                        value={muTagName}
                        onChangeText={text => setMuTagName(text)}
                        theme={{
                            colors: {
                                primary: Theme.Color.SecondaryOrange,
                                placeholder: "silver"
                            }
                        }}
                        style={styles.attachedToInput}
                    />
                    <View style={styles.bottomContent} />
                </View>
                <Snackbar
                    duration={Number.POSITIVE_INFINITY}
                    visible={snackbarMessage != null}
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    onDismiss={() => {}}
                    action={{
                        label: props.localize.getText(
                            "AddMuTag",
                            "SnackbarButton",
                            "Dismiss"
                        ),
                        onPress: () => props.viewModel.hideLowPriorityMessage()
                    }}
                >
                    {getSnackbarMessage()}
                </Snackbar>
                <Button
                    mode="contained"
                    onPress={() => props.viewModel.setMuTagName(muTagName)}
                    loading={progressIndicator === "Indeterminate"}
                    style={styles.button}
                    disabled={progressIndicator === "Indeterminate"}
                >
                    {progressIndicator === "Indeterminate"
                        ? props.localize.getText(
                              "AddMuTag",
                              "Naming",
                              "ButtonSaving"
                          )
                        : props.localize.getText(
                              "AddMuTag",
                              "Naming",
                              "ButtonSave"
                          )}
                </Button>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default NameMuTagView;
