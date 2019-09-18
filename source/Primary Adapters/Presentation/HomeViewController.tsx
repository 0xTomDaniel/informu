import { Text } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps } from 'react-navigation';
import React, { Component } from 'react';
import DeviceInfo from 'react-native-device-info';
import AddMuTagService from '../../Core/Application/AddMuTagService';
import { ReactNativeBLEPLX } from '../../Secondary Adapters/Infrastructure/ReactNativeBLEPLX';
import { RSSI } from '../../Core/Domain/Types';

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
        const bluetooth = new ReactNativeBLEPLX();
        const scanThreshold = -100 as RSSI;
        bluetooth.connectToNewMuTag(scanThreshold).then((unprovisionedMuTag): void => {
            console.log(unprovisionedMuTag);
        });
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Text>Home Screen</Text>
            </SafeAreaView>
        );
    }
}