import { Appbar, Text, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, PermissionsAndroid, PermissionStatus, View } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps, NavigationScreenOptions } from 'react-navigation';
import React, { Component, ReactElement } from 'react';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { HomeState, HomeViewModel } from './HomeViewModel';
import AddMuTagService from '../../Core/Application/AddMuTagService';
import LogoutService from '../../Core/Application/LogoutService';

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop: (Platform.OS === 'android' && DeviceInfo.hasNotch())
            ? StatusBar.currentHeight : 0,
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhite,
        //paddingHorizontal: 16,
        //justifyContent: 'center',
    },
    appBar: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: Theme.Color.ExtraLightGrey,
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0,
            },
        }),
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
        marginLeft: 20,
    },
    tooltipContent: {
        padding: 20,
    },
    tooltipText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activityModal: {
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.Color.AlmostWhite,
    },
});

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
                    <Appbar.Action
                        icon="plus-circle-outline"
                        onPress={(): Promise<void> => this.props.addMuTagService.startAddingNewMuTag()}
                    />
                    <Appbar.Content title="" />
                    <Appbar.Action
                        icon="logout"
                        onPress={(): Promise<void> => this.props.logoutService.logOut()}
                    />
                </Appbar.Header>
                {this.state.showAddMuTagTooltip &&
                    <View>
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
                }
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
