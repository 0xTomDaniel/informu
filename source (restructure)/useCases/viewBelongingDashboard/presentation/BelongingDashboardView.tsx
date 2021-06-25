import {
    Appbar,
    Text,
    Portal,
    ActivityIndicator,
    Dialog,
    Paragraph,
    Button,
    Snackbar,
    Banner
} from "react-native-paper";
import {
    StyleSheet,
    Platform,
    StatusBar,
    PermissionsAndroid,
    View,
    FlatList,
    ListRenderItem
} from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import {
    SafeAreaView,
    NavigationScreenProps,
    ScreenProps
} from "react-navigation";
import React, {
    ReactElement,
    FunctionComponent,
    useState,
    useEffect
} from "react";
import DeviceInfo from "react-native-device-info";
import LinearGradient from "react-native-linear-gradient";
import BelongingDashboardViewModel, {
    BelongingViewData,
    MediumPriorityMessage,
    LowPriorityMessage,
    HighPriorityMessage
} from "./BelongingDashboardViewModel";
import { Images } from "../../../../source/Primary Adapters/Presentation/Images";
import BelongingCard from "./BelongingCard";
import { ProgressIndicatorState } from "../../../shared/viewModel/ViewModel";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
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
        backgroundColor: Theme.Color.AlmostWhiteBackground
    },
    appBar: {
        backgroundColor: "transparent",
        //borderBottomWidth: 1,
        //borderColor: Theme.Color.AlmostWhiteBorder,
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0
            }
        })
    },
    appBarLogo: {
        width: undefined,
        height: 26,
        marginLeft: 14,
        marginRight: -14
    },
    appBarContent: {
        marginBottom: 18
    },
    appBarActionAddMuTag: {
        // Minor adjustments to icon needed to center it.
        // NOTE: Use a background color temporarily to help center the icon.
        paddingBottom: 2
    },
    appBarActionSignOut: {
        // Minor adjustments to icon needed to center it.
        // NOTE: Use a background color temporarily to help center the icon.
        paddingLeft: 3,
        paddingBottom: 2
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: "transparent",
        borderStyle: "solid",
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: Theme.Color.SecondaryOrange,
        alignSelf: "flex-end",
        marginRight: 68,
        // Fixes 1dp gap on some layouts
        marginBottom: -1
    },
    tooltipContent: {
        padding: 20
    },
    tooltipText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16
    },
    belongingsContainer: {
        flexGrow: 1,
        paddingTop: 4,
        paddingBottom: 16
    },
    belongingsEmpty: {
        flex: 1,
        justifyContent: "center"
    }
    /*activityModal: {
        alignSelf: "center",
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.Color.AlmostWhite
    }*/
});

interface BelongingsEmptyViewProps extends ScreenProps {
    isLoading: boolean;
    localize: Localize;
}

const BelongingsEmpty: FunctionComponent<BelongingsEmptyViewProps> = (
    props
): ReactElement => {
    return (
        <View style={styles.belongingsEmpty}>
            {props.isLoading ? (
                <ActivityIndicator
                    size="large"
                    color={Theme.Color.PrimaryBlue}
                />
            ) : (
                <View>
                    <View style={styles.triangle} />
                    <LinearGradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1.5, y: 0 }}
                        colors={[
                            Theme.Color.PrimaryOrange,
                            Theme.Color.SecondaryOrange
                        ]}
                        style={styles.tooltipContent}
                    >
                        <Text style={styles.tooltipText}>
                            {props.localize.getText(
                                "ViewBelongingDashboard",
                                "Dashboard",
                                "NoMuTagMessage"
                            )}
                        </Text>
                    </LinearGradient>
                </View>
            )}
            <Images.NoMuTags />
        </View>
    );
};

type BannerActions = Array<{ label: string; onPress: () => void }>;

interface BelongingDashboardViewProps extends NavigationScreenProps {
    localize: Localize;
    viewModel: BelongingDashboardViewModel;
}

const BelongingDashboardView: FunctionComponent<BelongingDashboardViewProps> = (
    props
): ReactElement => {
    const [bannerMessage, setBannerMessage] = useState<
        MediumPriorityMessage | undefined
    >(props.viewModel.mediumPriorityMessageValue);
    const [belongings, setBelongings] = useState<BelongingViewData[]>(
        props.viewModel.showBelongingsValue
    );
    const [dialogMessage, setDialogMessage] = useState<HighPriorityMessage>();
    const [progressIndicator, setProgressIndicator] = useState<
        ProgressIndicatorState
    >(props.viewModel.progressIndicatorValue);
    const [snackbarMessage, setSnackbarMessage] = useState<
        LowPriorityMessage | undefined
    >(props.viewModel.lowPriorityMessageValue);
    const [showEmptyDashboard, setShowEmptyDashboard] = useState(
        props.viewModel.showEmptyDashboardValue
    );

    /*const onDismissErrorDialog = (): void => {
        setBannerMessage(undefined);
    };*/

    const requestPermissions = async (): Promise<void> => {
        const isPermissionGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        if (isPermissionGranted) {
            console.log("Bluetooth granted!");
            return;
        }

        console.log("Bluetooth denied");

        const permissionStatus = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            {
                title: props.localize.getText(
                    "ViewBelongingDashboard",
                    "LocationPermissionRequest",
                    "Title"
                ),
                message: props.localize.getText(
                    "ViewBelongingDashboard",
                    "LocationPermissionRequest",
                    "Message"
                ),
                //buttonNeutral: "Ask Me Later",
                buttonNegative: props.localize.getText(
                    "ViewBelongingDashboard",
                    "LocationPermissionRequest",
                    "ButtonDeny"
                ),
                buttonPositive: props.localize.getText(
                    "ViewBelongingDashboard",
                    "LocationPermissionRequest",
                    "ButtonAllow"
                )
            }
        );

        if (permissionStatus === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Bluetooth granted!");
        } else {
            console.log("Bluetooth denied");
        }
    };

    useEffect((): (() => void) => {
        const subscription = props.viewModel.progressIndicator.subscribe(
            setProgressIndicator
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.progressIndicator]);

    useEffect((): (() => void) => {
        const subscription = props.viewModel.showBelongings.subscribe(
            setBelongings
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.showBelongings]);

    useEffect((): (() => void) => {
        const subscription = props.viewModel.showEmptyDashboard.subscribe(
            setShowEmptyDashboard
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.showEmptyDashboard]);

    useEffect((): (() => void) => {
        const subscription = props.viewModel.highPriorityMessage.subscribe(
            setDialogMessage
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.highPriorityMessage]);

    useEffect((): (() => void) => {
        const subscription = props.viewModel.mediumPriorityMessage.subscribe(
            setBannerMessage
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.mediumPriorityMessage]);

    useEffect((): (() => void) => {
        const subscription = props.viewModel.lowPriorityMessage.subscribe(
            setSnackbarMessage
        );
        return () => subscription.unsubscribe();
    }, [props.viewModel.lowPriorityMessage]);

    useEffect(() => {
        requestPermissions().catch(e => console.warn(e));
    }, []);

    const renderItem: ListRenderItem<BelongingViewData> = ({ item }) => (
        <BelongingCard
            localize={props.localize}
            onRemoveMuTag={uid => props.viewModel.removeMuTag(uid)}
            viewData={item}
        />
    );

    const getBannerActions = (): BannerActions => {
        let buttonLabel: string;
        switch (bannerMessage?.messageKey) {
            case "FailedToRemoveMuTag":
            case "FailedToRemoveMuTagFromAccount":
            case "FailedToResetMuTag":
                buttonLabel = props.localize.getText(
                    "RemoveMuTag",
                    "BannerButton",
                    "Dismiss"
                );
                break;
            case "SignOutFailed":
                buttonLabel = props.localize.getText(
                    "SignOut",
                    "BannerButton",
                    "Dismiss"
                );
                break;
            default:
                buttonLabel = "";
        }
        return [
            {
                label: buttonLabel,
                onPress: () => props.viewModel.hideMediumPriorityMessage()
            }
        ];
    };

    const getBannerMessage = (): string => {
        switch (bannerMessage?.messageKey) {
            case "FailedToRemoveMuTag":
            case "FailedToRemoveMuTagFromAccount":
            case "FailedToResetMuTag":
                return props.localize.getText(
                    "RemoveMuTag",
                    "BannerMessage",
                    bannerMessage.messageKey
                );
            case "SignOutFailed":
                return props.localize.getText(
                    "SignOut",
                    "BannerMessage",
                    "SignOutFailed"
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
            "RemoveMuTag",
            "SnackbarMessage",
            snackbarMessage.messageKey
        );

        return props.localize.replaceVariables(message, snackbarMessage.data);
    };

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <Appbar.Header style={styles.appBar}>
                <Images.MuLogo style={styles.appBarLogo} />
                <Appbar.Content
                    title=""
                    subtitle="beta"
                    color="gray"
                    style={styles.appBarContent}
                />
                <Appbar.Action
                    icon="plus-circle-outline"
                    color={Theme.Color.DarkGrey}
                    style={styles.appBarActionAddMuTag}
                    onPress={() => props.viewModel.addMuTag()}
                />
                <Appbar.Action
                    icon="logout"
                    color={Theme.Color.DarkGrey}
                    style={styles.appBarActionSignOut}
                    onPress={() => props.viewModel.signOut()}
                />
            </Appbar.Header>
            <Banner
                visible={bannerMessage != null}
                actions={getBannerActions()}
                icon={({ size }) => (
                    <Icon name="alert-circle" style={{ fontSize: size }} />
                )}
            >
                {getBannerMessage()}
            </Banner>
            <FlatList
                contentContainerStyle={styles.belongingsContainer}
                ListEmptyComponent={
                    <BelongingsEmpty
                        isLoading={false}
                        localize={props.localize}
                    />
                }
                scrollEnabled={!showEmptyDashboard}
                data={belongings ?? null}
                renderItem={renderItem}
                keyExtractor={item => item.uid}
            />
            <Snackbar
                duration={Number.POSITIVE_INFINITY}
                visible={snackbarMessage != null}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onDismiss={() => {}}
                action={{
                    label: props.localize.getText(
                        "RemoveMuTag",
                        "SnackbarButton",
                        "Dismiss"
                    ),
                    onPress: () => props.viewModel.hideLowPriorityMessage()
                }}
            >
                {getSnackbarMessage()}
            </Snackbar>
            <Portal>
                <Dialog
                    visible={dialogMessage != null}
                    onDismiss={() => props.viewModel.hideHighPriorityMessage()}
                >
                    <Dialog.Content>
                        <Paragraph>
                            {props.localize.getText(
                                "SignOut",
                                "DialogMessage",
                                "ConfirmSignOut"
                            )}
                        </Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() =>
                                props.viewModel.hideHighPriorityMessage()
                            }
                        >
                            {props.localize.getText(
                                "SignOut",
                                "DialogButton",
                                "Cancel"
                            )}
                        </Button>
                        <Button onPress={() => props.viewModel.signOut()}>
                            {props.localize.getText(
                                "SignOut",
                                "DialogButton",
                                "SignOut"
                            )}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Dialog visible={progressIndicator != null} dismissable={false}>
                    <Dialog.Content>
                        <ActivityIndicator
                            size="large"
                            color={Theme.Color.PrimaryBlue}
                        />
                    </Dialog.Content>
                </Dialog>
            </Portal>
            {/*<ErrorDialog
                message={bannerMessage ?? ""}
                detailMessage={""}
                visible={bannerMessage != null}
                onDismiss={onDismissErrorDialog}
            />*/}
        </SafeAreaView>
    );
};

export default BelongingDashboardView;
