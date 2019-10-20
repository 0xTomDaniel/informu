import { Appbar, Text, Portal, Modal, ActivityIndicator, Card, Avatar, Title, Paragraph, IconButton } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, PermissionsAndroid, PermissionStatus, View, FlatList } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps, NavigationScreenOptions } from 'react-navigation';
import React, { Component, ReactElement, FunctionComponent } from 'react';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { HomeState, HomeViewModel, Belonging } from './HomeViewModel';
import AddMuTagService from '../../Core/Application/AddMuTagService';
import LogoutService from '../../Core/Application/LogoutService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from './Images';
import { Scale } from './ResponsiveScaler';

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop: (Platform.OS === 'android' && DeviceInfo.hasNotch())
            ? StatusBar.currentHeight : 0,
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhiteBackground,
    },
    appBar: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: Theme.Color.AlmostWhiteBorder,
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0,
            },
        }),
    },
    appBarLogo: {
        width: undefined,
        height: 26,
        marginLeft: Scale(30, 26),
        marginRight: -12,
    },
    tooltip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Theme.Color.PrimaryOrange,
        alignSelf: 'flex-end',
        marginRight: 68,
        // Fixes 1dp gap on some layouts
        marginBottom: -1,
    },
    tooltipContent: {
        padding: 20,
    },
    tooltipText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    belongingsContainer: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    belongingsEmpty: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        paddingVertical: 8,
        marginHorizontal: Scale(12),
        marginTop: Scale(12),
        backgroundColor: Theme.Color.AlmostWhite,
        borderWidth: 1,
        borderColor: Theme.Color.AlmostWhiteBorder,
    },
    cardSubtitle: {
        color: 'gray',
    },
    iconView: {
        backgroundColor: Theme.Color.PrimaryBlue,
        marginLeft: 4,
    },
    cardTitleText: {
        marginLeft: 8,
    },
    activityModal: {
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.Color.AlmostWhite,
    },
});

const BelongingsEmpty: FunctionComponent<object> = (): ReactElement => {
    return (
        <View style={styles.belongingsEmpty}>
            <View style={styles.tooltip}>
                <View style={styles.triangle} />
                <LinearGradient
                    start={{x: 0, y: 0}}
                    end={{x: 1.5, y: 0}}
                    colors={[Theme.Color.PrimaryOrange, Theme.Color.SecondaryOrange]}
                    style={styles.tooltipContent}
                >
                    <Text style={styles.tooltipText}>
                        Add your first Mu tag to get started.
                    </Text>
                </LinearGradient>
            </View>
            <Images.IconLogoCombo />
        </View>
    );
};

const BelongingCard: FunctionComponent<Belonging> = (props): ReactElement => {
    return (
        <Card elevation={0} style={styles.card}>
            <Card.Title
                title={props.name}
                subtitle={
                    <Text style={styles.cardSubtitle}>
                        <Icon name="checkbox-blank-circle" size={10} color={props.safeStatusColor} />
                        {' ' + props.lastSeen}
                    </Text>
                }
                left={(leftProps: any): Element =>
                    <Avatar.Icon {...leftProps} icon="radar" color="white" style={styles.iconView} />
                }
                right={(rightProps: any): Element =>
                    <IconButton {...rightProps} icon="dots-vertical" onPress={(): void => {}} />
                }
                titleStyle={styles.cardTitleText}
                subtitleStyle={styles.cardTitleText}
            />
        </Card>
    );
};

interface HomeVCProps extends NavigationScreenProps {

    homeViewModel: HomeViewModel;
    logoutService: LogoutService;
    addMuTagService: AddMuTagService;
}

export default class HomeViewController extends Component<HomeVCProps> {

    state: Readonly<HomeState> = this.props.homeViewModel;

    componentDidMount(): void {
        this.props.homeViewModel.onDidUpdate((update): void => this.setState(update));
        this.props.homeViewModel.onNavigateToAddMuTag((): boolean =>
            this.props.navigation.navigate('AddMuTag')
        );
        this.props.homeViewModel.onShowLogoutComplete((): boolean =>
            this.props.navigation.navigate('Login')
        );

        try {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((granted): Promise<PermissionStatus> | undefined => {
                if (granted) {
                    console.log('Bluetooth granted!');
                } else {
                    console.log('Bluetooth denied');
                    return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION, {
                        title: 'Cool Photo App Camera Permission',
                        message:
                            'Cool Photo App needs access to your camera ' +
                            'so you can take awesome pictures.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    });
                }
            }).then((granted): void => {
                if (granted == null) {
                    return;
                }

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('Bluetooth granted!');
                } else {
                    console.log('Bluetooth denied');
                }
            });
        } catch (err) {
            console.warn(err);
        }
    }

    componentWillUnmount(): void {
        this.props.homeViewModel.onDidUpdate(undefined);
        this.props.homeViewModel.onNavigateToAddMuTag(undefined);
        this.props.homeViewModel.onShowLogoutComplete(undefined);
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Appbar.Header style={styles.appBar}>
                    {/*<Images.InformuIconLight style={{width: undefined, height: 54, marginLeft: 12, marginRight: -16}} />*/}
                    <Images.MuLogo style={styles.appBarLogo} />
                    <Appbar.Content subtitle="beta" color="gray" />
                    <Appbar.Action
                        icon="plus-circle-outline"
                        onPress={(): Promise<void> => this.props.addMuTagService.startAddingNewMuTag()}
                    />
                    <Appbar.Action
                        icon="logout"
                        onPress={(): Promise<void> => this.props.logoutService.logOut()}
                    />
                </Appbar.Header>
                <FlatList
                    contentContainerStyle={styles.belongingsContainer}
                    ListEmptyComponent={<BelongingsEmpty />}
                    data={this.state.belongings}
                    renderItem={({ item }): ReactElement =>
                        <BelongingCard
                            uid={item.uid}
                            name={item.name}
                            safeStatusColor={item.safeStatusColor}
                            lastSeen={item.lastSeen}
                        />
                    }
                    keyExtractor={(item): string => item.uid}
                />
                <Portal>
                    <Modal
                        dismissable={false}
                        visible={this.state.showActivityIndicator}
                        contentContainerStyle={styles.activityModal}
                    >
                        <ActivityIndicator size="large" color={Theme.Color.PrimaryBlue} />
                    </Modal>
                </Portal>
            </SafeAreaView>
        );
    }
}
