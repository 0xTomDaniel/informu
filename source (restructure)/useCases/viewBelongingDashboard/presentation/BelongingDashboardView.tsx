import {
    Appbar,
    Text,
    Portal,
    Modal,
    ActivityIndicator,
    Dialog,
    Paragraph,
    Button,
    Snackbar
} from "react-native-paper";
import {
    StyleSheet,
    Platform,
    StatusBar,
    PermissionsAndroid,
    View,
    FlatList
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
import LinearGradient from "react-native-linear-gradient";
import BelongingDashboardViewModel, {
    BelongingViewData,
    MediumPriorityMessage,
    LowPriorityMessage
} from "./BelongingDashboardViewModel";
import { Images } from "../../../../source/Primary Adapters/Presentation/Images";
import ErrorDialog from "../../../../source/Primary Adapters/Presentation/Base Components/ErrorDialog";
import BelongingCard from "./BelongingCard";
import Localize from "../../../shared/localization/Localize";
import { ProgressIndicatorState } from "../../../shared/viewModel/ViewModel";

const localize = Localize.instance;

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
    },
    activityModal: {
        alignSelf: "center",
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.Color.AlmostWhite
    }
});

const BelongingsEmpty: FunctionComponent = (): ReactElement => {
    return (
        <View style={styles.belongingsEmpty}>
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
                        {localize.getText(
                            "viewBelongingDashboard",
                            "dashboard",
                            "noMuTagMessage"
                        )}
                    </Text>
                </LinearGradient>
            </View>
            <Images.NoMuTags />
        </View>
    );
};

interface BelongingDashboardViewProps extends NavigationScreenProps {
    viewModel: BelongingDashboardViewModel;
}

const BelongingDashboardView: FunctionComponent<BelongingDashboardViewProps> = (
    props
): ReactElement => {
    const [belongings, setBelongings] = useState<BelongingViewData[]>();
    const [progressIndicator, setProgressIndicator] = useState<
        ProgressIndicatorState
    >(undefined);
    const [bannerMessage, setBannerMessage] = useState<
        MediumPriorityMessage | undefined
    >(props.viewModel.mediumPriorityMessageValue);
    const [showEmptyDashboard, setShowEmptyDashboard] = useState(true);
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<
        LowPriorityMessage
    >();

    const onDismissErrorDialog = (): void => {
        setBannerMessage(undefined);
    };

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
                title: localize.getText(
                    "viewBelongingDashboard",
                    "locationPermissionRequest",
                    "title"
                ),
                message: localize.getText(
                    "viewBelongingDashboard",
                    "locationPermissionRequest",
                    "message"
                ),
                //buttonNeutral: "Ask Me Later",
                buttonNegative: localize.getText(
                    "viewBelongingDashboard",
                    "locationPermissionRequest",
                    "buttonDeny"
                ),
                buttonPositive: localize.getText(
                    "viewBelongingDashboard",
                    "locationPermissionRequest",
                    "buttonAllow"
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
                    onPress={() => setShowSignOutDialog(true)}
                />
            </Appbar.Header>
            <FlatList
                contentContainerStyle={styles.belongingsContainer}
                ListEmptyComponent={<BelongingsEmpty />}
                scrollEnabled={!showEmptyDashboard}
                data={belongings}
                renderItem={({ item }) => (
                    <BelongingCard
                        onRemoveMuTag={uid => props.viewModel.removeMuTag(uid)}
                        viewData={item}
                    />
                )}
                keyExtractor={item => item.uid}
            />
            <Snackbar
                duration={Number.POSITIVE_INFINITY}
                visible={snackbarMessage != null}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onDismiss={() => {}}
                action={{
                    label: "Dismiss",
                    onPress: () => props.viewModel.hideLowPriorityMessage()
                }}
            >
                {snackbarMessage}
            </Snackbar>
            <Portal>
                <Dialog
                    visible={showSignOutDialog}
                    onDismiss={() => setShowSignOutDialog(false)}
                >
                    <Dialog.Content>
                        <Paragraph>
                            {localize.getText(
                                "viewBelongingDashboard",
                                "signOutDialog",
                                "message"
                            )}
                        </Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowSignOutDialog(false)}>
                            {localize.getText(
                                "viewBelongingDashboard",
                                "signOutDialog",
                                "buttonCancel"
                            )}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => props.viewModel.signOut()}
                        >
                            {localize.getText(
                                "viewBelongingDashboard",
                                "signOutDialog",
                                "buttonSignOut"
                            )}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Modal
                    dismissable={false}
                    visible={progressIndicator === "Indeterminate"}
                    contentContainerStyle={styles.activityModal}
                >
                    <ActivityIndicator
                        size="large"
                        color={Theme.Color.PrimaryBlue}
                    />
                </Modal>
            </Portal>
            <ErrorDialog
                message={bannerMessage ?? ""}
                detailMessage={""}
                visible={bannerMessage != null}
                onDismiss={onDismissErrorDialog}
            />
        </SafeAreaView>
    );
};

export default BelongingDashboardView;
