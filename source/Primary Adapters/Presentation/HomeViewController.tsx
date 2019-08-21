import { Text } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar } from 'react-native';
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

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Text>Home Screen</Text>
            </SafeAreaView>
        );
    }
}