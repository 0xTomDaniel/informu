import { Button, Headline, ActivityIndicator } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, View } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps } from 'react-navigation';
import React, { Component } from 'react';
import DeviceInfo from 'react-native-device-info';
import { MuTagAddingViewModel } from './MuTagAddingViewModel';
import AddMuTagService from '../../Core/Application/AddMuTagService';
import { Scale } from './ResponsiveScaler';

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop: (Platform.OS === 'android' && DeviceInfo.hasNotch())
            ? StatusBar.currentHeight : 0,
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhite,
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
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    headline: {
        textAlign: 'center',
        fontSize: Scale(28, 24),
        marginBottom: 32,
    },
    attachedToInput: {
        backgroundColor: 'white',
    },
    button: {
        alignSelf: 'center',
        marginVertical: 16,
    },
});

interface MuTagAddingVCProps extends NavigationScreenProps {
    viewModel: MuTagAddingViewModel;
    addMuTagService: AddMuTagService;
}

export default class MuTagAddingViewController extends Component<MuTagAddingVCProps> {

    componentDidMount(): void {
        this.props.viewModel.onNavigateToMuTagSettings((): void => {
            //this.props.navigation.navigate();
        });
        this.props.viewModel.onNavigateToHomeScreen((): boolean => this.props.navigation.popToTop());
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <View style={styles.mainContainer}>
                    <Headline style={styles.headline}>
                        Connecting to Mu tag...
                    </Headline>
                    <ActivityIndicator animating={true} color={Theme.Color.PrimaryBlue} size="large" />
                </View>
                <Button
                    mode="contained"
                    onPress={(): void => this.props.addMuTagService.stopAddingNewMuTag()}
                    style={styles.button}
                >
                    Cancel
                </Button>
            </SafeAreaView>
        );
    }
}
