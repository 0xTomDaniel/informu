import { Appbar, Text } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, PermissionsAndroid, PermissionStatus, View } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps, NavigationScreenOptions } from 'react-navigation';
import React, { Component, ReactElement } from 'react';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { HomeState, HomeViewModel } from './HomeViewModel';
import AddMuTagService from '../../Core/Application/AddMuTagService';

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
});

interface HomeVCProps extends NavigationScreenProps {
    viewModel: HomeViewModel;
    addMuTagService: AddMuTagService;
}

export default class HomeViewController extends Component<HomeVCProps> {

    static navigationOptions = ({ addMuTagService }: HomeVCProps): NavigationScreenOptions => ({
        header: (): ReactElement => (
            <Appbar style={styles.appBar}>
                <Appbar.Action
                    icon="plus-circle-outline"
                    onPress={(): void => { addMuTagService.startAddingNewMuTag(); }}
                />
            </Appbar>
        ),
    });

    state: Readonly<HomeState> = this.props.viewModel;

    componentDidMount(): void {
        this.props.viewModel.onDidUpdate((update): void => this.setState(update));
        this.props.viewModel.onNavigateToAddMuTag((): void => {
            this.props.navigation.navigate('AddMuTag');
        });
    }

    /*componentDidMount(): void {
        try {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((granted): Promise<PermissionStatus> | undefined => {
                if (granted) {
                    console.log('Bluetooth granted!');
                    connectToNewMuTag();
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
                    connectToNewMuTag();
                } else {
                    console.log('Bluetooth denied');
                }
            });
        } catch (err) {
            console.warn(err);
        }
    }*/

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
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
            </SafeAreaView>
        );
    }
}
