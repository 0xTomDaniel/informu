import React, { Component } from 'react';
import { SafeAreaView, NavigationScreenProps } from 'react-navigation';
import LoadSessionViewModel, { Screen } from './LoadSessionViewModel';
import SessionService from '../../Core/Application/SessionService';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import Images from './Images';
import { ProgressBar } from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
import Theme from './Theme';
import { Authentication } from '../../Core/Ports/Authentication';
import { AccountRepositoryLocal } from '../../Core/Ports/AccountRepositoryLocal';
import SessionPresenter from './SessionPresenter';

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
    logo: {
        resizeMode: 'contain',
        width: undefined,
        height: undefined,
        marginHorizontal: 16,
    },
    progress: {
        margin: 16,
    },
});

const paperTheme = {
    colors: {
        primary: Theme.Color.PrimaryBlue,
    },
};

interface LoadSessionVCProps extends NavigationScreenProps {
    authentication: Authentication;
    accountRepoLocal: AccountRepositoryLocal;
}

export default class LoadSessionViewController extends Component<LoadSessionVCProps> {

    private viewModel = new LoadSessionViewModel();
    private sessionPresenter = new SessionPresenter(this.viewModel);
    private sessionService = new SessionService(
        this.sessionPresenter,
        this.props.authentication,
        this.props.accountRepoLocal,
    );

    componentDidMount(): void {
        this.viewModel.onNavigate((screen): void => {
            switch (screen) {
                case Screen.App:
                    this.props.navigation.navigate('App');
                    break;
                case Screen.Entry:
                    this.props.navigation.navigate('Entry');
                    break;
            }
        });
        this.sessionService.load();
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Images.IconLogoCombo style={[styles.logo]} />
                <ProgressBar style={styles.progress} theme={paperTheme} indeterminate={true} />
            </SafeAreaView>
        );
    }
}
