import { Appbar, Button, Text, Subheading } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, View, Dimensions } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps } from 'react-navigation';
import React, { Component } from 'react';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ImageBackgrounds } from './Images';
import { AddMuTagViewModel as NameMuTagViewModel } from './AddMuTagViewModel';
import NameMuTagService from '../../Core/Application/AddMuTagService';

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop: (Platform.OS === 'android' && DeviceInfo.hasNotch())
            ? StatusBar.currentHeight : 0,
    },
    mainImage: {
        width: '100%',
        resizeMode: 'contain',
        backgroundColor: Theme.Color.AlmostWhite,
        position: 'absolute',
    },
    mainImageView: {
        width: '100%',
        height: '100%',
        backgroundColor: Theme.Color.AlmostWhite,
    },
    appBar: {
        backgroundColor: 'transparent',
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0,
            },
        }),
    },
    topContainer: {
        flex: 1,
    },
    bottomContainer: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    button: {
        marginVertical: 16,
    },
});

interface NameMuTagVCProps extends NavigationScreenProps {
    viewModel: NameMuTagViewModel;
    nameMuTagService: NameMuTagService;
}

export default class NameMuTagViewController extends Component<NameMuTagVCProps> {

    componentDidMount(): void {
        this.props.viewModel.onNavigateToNameMuTag((): void => {
            this.props.navigation.navigate('NameMuTag');
        });
        this.props.viewModel.onBack(this.props.navigation.goBack);
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView]}>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={(): void => this.props.viewModel.goBack()}/>
                </Appbar.Header>
                <View style={styles.bottomContainer}>

                </View>
                <View>
                    <Button
                        mode="contained"
                        onPress={(): void => this.props.nameMuTagService.setMuTagName()}
                        style={styles.button}
                    >
                        Add
                    </Button>
                </View>
            </SafeAreaView>
        );
    }
}
