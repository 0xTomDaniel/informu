import {
    Appbar,
    Text,
    Portal,
    Modal,
    ActivityIndicator,
    Card,
    Avatar,
    IconButton,
    Menu,
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
import {
    BelongingDashboardViewModel,
    BelongingViewData
} from "./BelongingDashboardViewModel";
import AddMuTagInteractor from "../../addMuTag/AddMuTagInteractor";
import LogoutService from "../../../../source/Core/Application/LogoutService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Images } from "../../../../source/Primary Adapters/Presentation/Images";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import BelongingDashboardInteractor from "../BelongingDashboardInteractor";
import RemoveMuTagInteractor from "../../removeMuTag/RemoveMuTagInteractor";
import ErrorDialog from "../../../../source/Primary Adapters/Presentation/Base Components/ErrorDialog";

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
    card: {
        //paddingVertical: 8,
        marginHorizontal: Scale(8),
        marginTop: Scale(12),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: Theme.Color.AlmostWhiteBorder
    },
    cardSubtitle: {
        color: "gray"
    },
    cardIconView: {
        backgroundColor: Theme.Color.PrimaryBlue,
        marginLeft: 4
    },
    cardIconButton: {
        paddingRight: 4
    },
    cardTitleText: {
        marginLeft: 8
    },
    cardContent: {
        paddingHorizontal: 20
    },
    cardAddressView: {
        marginLeft: 58,
        marginTop: -7,
        flexDirection: "row"
    },
    cardAddressIcon: {
        marginRight: 2
    },
    cardAddressText: {
        color: "gray",
        fontSize: 12
    },
    activityModal: {
        alignSelf: "center",
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.Color.AlmostWhite
    }
});

const BelongingsEmpty: FunctionComponent<object> = (): ReactElement => {
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

interface BelongingCardProps {
    viewData: BelongingViewData;
    removeMuTagService: RemoveMuTagInteractor;
}

const BelongingCard: FunctionComponent<BelongingCardProps> = (
    props
): ReactElement => {
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const showMenu = (): void => setIsMenuVisible(true);
    const hideMenu = (): void => setIsMenuVisible(false);
    const removeMuTag = (): void => {
        hideMenu();
        props.removeMuTagService.remove(props.viewData.uid).catch((e): void => {
            console.warn(`removeMuTagService.remove() - error: ${e}`);
        });
    };

    return (
        <Card elevation={0} style={styles.card}>
            <Card.Title
                title={props.viewData.name}
                subtitle={
                    <Text style={styles.cardSubtitle}>
                        <Icon
                            name="checkbox-blank-circle"
                            size={10}
                            color={props.viewData.safeStatusColor}
                        />
                        {` ${props.viewData.lastSeen}`}
                    </Text>
                }
                left={(leftProps: any): ReactElement => (
                    <Avatar.Icon
                        {...leftProps}
                        icon="radar"
                        color="white"
                        style={styles.cardIconView}
                    />
                )}
                right={(rightProps: any): ReactElement => (
                    <Menu
                        visible={isMenuVisible}
                        onDismiss={hideMenu}
                        anchor={
                            <IconButton
                                {...rightProps}
                                icon="dots-vertical"
                                color={Theme.Color.DarkGrey}
                                style={styles.cardIconButton}
                                onPress={showMenu}
                            />
                        }
                    >
                        <Menu.Item
                            title="Remove"
                            icon="minus-circle-outline"
                            onPress={removeMuTag}
                        />
                    </Menu>
                )}
                titleStyle={styles.cardTitleText}
                subtitleStyle={styles.cardTitleText}
            />
            <Card.Content style={styles.cardContent}>
                <View style={styles.cardAddressView}>
                    <Icon
                        name="map-marker"
                        size={14}
                        color={Theme.Color.PrimaryBlue}
                        style={styles.cardAddressIcon}
                    />
                    <Text style={styles.cardAddressText}>
                        {props.viewData.address}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
};

interface HomeVCProps extends NavigationScreenProps {
    homeViewModel: BelongingDashboardViewModel;
    belongingDashboardInteractor: BelongingDashboardInteractor;
    logoutService: LogoutService;
    addMuTagService: AddMuTagInteractor;
    removeMuTagService: RemoveMuTagInteractor;
}

const BelongingDashboardViewController: FunctionComponent<HomeVCProps> = (
    props
): ReactElement => {
    const [state, setState] = useState(props.homeViewModel.state);
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);

    const onDismissErrorDialog = (): void => {
        props.homeViewModel.updateState({
            errorDescription: "",
            isErrorVisible: false
        });
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

    useEffect((): (() => void) => {
        props.homeViewModel.onDidUpdate((newState): void => {
            setState(newState);
        });
        props.homeViewModel.onNavigateToAddMuTag((): boolean =>
            props.navigation.navigate("AddMuTag")
        );
        props.homeViewModel.onShowLogoutComplete((): boolean =>
            props.navigation.navigate("Login")
        );

        return (): void => {
            props.homeViewModel.onDidUpdate(undefined);
            props.homeViewModel.onNavigateToAddMuTag(undefined);
            props.homeViewModel.onShowLogoutComplete(undefined);
        };
    });

    useEffect((): void => {
        props.belongingDashboardInteractor.open().catch(e => console.warn(e));
    }, [props.belongingDashboardInteractor]);

    useEffect((): void => {
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
                    onPress={(): void => {
                        props.addMuTagService.startAddingNewMuTag();
                    }}
                />
                <Appbar.Action
                    icon="logout"
                    color={Theme.Color.DarkGrey}
                    style={styles.appBarActionSignOut}
                    onPress={(): void => setShowSignOutDialog(true)}
                />
            </Appbar.Header>
            <FlatList
                contentContainerStyle={styles.belongingsContainer}
                ListEmptyComponent={<BelongingsEmpty />}
                scrollEnabled={!state.showEmptyBelongings}
                data={state.belongings}
                renderItem={({ item }): ReactElement => (
                    <BelongingCard
                        viewData={item}
                        removeMuTagService={props.removeMuTagService}
                    />
                )}
                keyExtractor={(item): string => item.uid}
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
                            onPress={() => props.logoutService.logOut()}
                        >
                            Sign Out
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Modal
                    dismissable={false}
                    visible={state.showActivityIndicator}
                    contentContainerStyle={styles.activityModal}
                >
                    <ActivityIndicator
                        size="large"
                        color={Theme.Color.PrimaryBlue}
                    />
                </Modal>
            </Portal>
            <ErrorDialog
                message={state.errorDescription}
                detailMessage={state.detailedErrorDescription}
                visible={state.isErrorVisible}
                onDismiss={onDismissErrorDialog}
            />
        </SafeAreaView>
    );
};

export default BelongingDashboardViewController;
