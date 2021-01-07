import {
    Appbar,
    Text,
    Portal,
    Modal,
    ActivityIndicator,
    Dialog,
    Paragraph,
    Button
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
    AppView,
    BelongingViewData
} from "./BelongingDashboardViewModel";
import { Images } from "../../../../source/Primary Adapters/Presentation/Images";
import ErrorDialog from "../../../../source/Primary Adapters/Presentation/Base Components/ErrorDialog";
import BelongingCard from "./BelongingCard";
import Exception from "../../../shared/metaLanguage/Exception";

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
                        Add your first Mu tag to get started.
                    </Text>
                </LinearGradient>
            </View>
            <Images.NoMuTags />
        </View>
    );
};

interface BelongingDashboardViewProps extends NavigationScreenProps {
    belongingDashboardViewModel: BelongingDashboardViewModel;
}

const BelongingDashboardView: FunctionComponent<BelongingDashboardViewProps> = (
    props
): ReactElement => {
    const [belongings, setBelongings] = useState<BelongingViewData[]>([]);
    const [showActivityIndicator, setShowActivityIndicator] = useState(true);
    const [showEmptyDashboard, setShowEmptyDashboard] = useState(true);
    const [showError, setShowError] = useState<Exception<string> | undefined>();
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);

    const onDismissErrorDialog = (): void => {
        setShowError(undefined);
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
                title: "Mu Tags Require 'Coarse Location' Permission",
                message:
                    "Please select 'Allow'. This is required for your " +
                    "Mu tags to have accurate and up-to-date locations.",
                //buttonNeutral: "Ask Me Later",
                buttonNegative: "Deny",
                buttonPositive: "Allow"
            }
        );

        if (permissionStatus === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Bluetooth granted!");
        } else {
            console.log("Bluetooth denied");
        }
    };

    useEffect(() => {
        const subscription = props.belongingDashboardViewModel.navigateToView.subscribe(
            view => {
                switch (view) {
                    case AppView.AddMuTag:
                        props.navigation.navigate("AddMuTagIntro");
                        break;
                    case AppView.SignIn:
                        props.navigation.navigate("Login");
                        break;
                }
            }
        );
        return () => subscription.unsubscribe();
    }, [props.belongingDashboardViewModel.navigateToView, props.navigation]);

    useEffect((): (() => void) => {
        const subscription = props.belongingDashboardViewModel.showActivityIndicator.subscribe(
            setShowActivityIndicator
        );
        return () => subscription.unsubscribe();
    }, [props.belongingDashboardViewModel.showActivityIndicator]);

    useEffect((): (() => void) => {
        const subscription = props.belongingDashboardViewModel.showBelongings.subscribe(
            setBelongings
        );
        return () => subscription.unsubscribe();
    }, [props.belongingDashboardViewModel.showBelongings]);

    useEffect((): (() => void) => {
        const subscription = props.belongingDashboardViewModel.showEmptyDashboard.subscribe(
            setShowEmptyDashboard
        );
        return () => subscription.unsubscribe();
    }, [props.belongingDashboardViewModel.showEmptyDashboard]);

    useEffect((): (() => void) => {
        const subscription = props.belongingDashboardViewModel.showError.subscribe(
            setShowError
        );
        return () => subscription.unsubscribe();
    }, [props.belongingDashboardViewModel.showError]);

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
                    onPress={() => props.belongingDashboardViewModel.addMuTag()}
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
                        onRemoveMuTag={uid =>
                            props.belongingDashboardViewModel.removeMuTag(uid)
                        }
                        viewData={item}
                    />
                )}
                keyExtractor={item => item.uid}
            />
            <Portal>
                <Dialog
                    visible={showSignOutDialog}
                    onDismiss={() => setShowSignOutDialog(false)}
                >
                    <Dialog.Content>
                        <Paragraph>
                            Are you sure you want to sign out?
                        </Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowSignOutDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() =>
                                props.belongingDashboardViewModel.signOut()
                            }
                        >
                            Sign Out
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Modal
                    dismissable={false}
                    visible={showActivityIndicator}
                    contentContainerStyle={styles.activityModal}
                >
                    <ActivityIndicator
                        size="large"
                        color={Theme.Color.PrimaryBlue}
                    />
                </Modal>
            </Portal>
            <ErrorDialog
                message={showError?.message ?? ""}
                detailMessage={
                    showError?.sourceException != null
                        ? String(showError?.sourceException)
                        : ""
                }
                visible={showError != null}
                onDismiss={onDismissErrorDialog}
            />
        </SafeAreaView>
    );
};

export default BelongingDashboardView;
