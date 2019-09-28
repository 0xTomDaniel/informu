import { Text } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, PermissionsAndroid, PermissionStatus } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps } from 'react-navigation';
import React, { Component } from 'react';
import DeviceInfo from 'react-native-device-info';

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop: (Platform.OS === 'android' && DeviceInfo.hasNotch())
            ? StatusBar.currentHeight : 0,
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhite,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
});

export default class HomeViewController extends Component<NavigationScreenProps> {

    static navigationOptions = {
        title: 'My Mu Tags',
    };

    componentDidMount(): void {
        /*try {
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
        }*/
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Text>Home Screen</Text>
            </SafeAreaView>
        );
    }
}
