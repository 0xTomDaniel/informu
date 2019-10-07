import { Appbar, Button, Text, Subheading } from 'react-native-paper';
import { StyleSheet, Platform, StatusBar, View, Dimensions } from 'react-native';
import Theme from './Theme';
import { SafeAreaView, NavigationScreenProps } from 'react-navigation';
import React, { Component } from 'react';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ImageBackgrounds } from './Images';
import { AddMuTagViewModel } from './AddMuTagViewModel';
import AddMuTagService from '../../Core/Application/AddMuTagService';

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
    instructions: {
        flex: 1,
        justifyContent: 'space-evenly',
        marginHorizontal: 16,
    },
    instructionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    instructionsInfoRow: {
        marginTop: 4,
        marginBottom: 12,
    },
    instructionsIconCol: {
        flex: 1,
        textAlign: 'center',
    },
    instructionsIcon: {
        fontSize: 32,
        color: Theme.Color.SecondaryBlue,
    },
    instructionsInfoIcon: {
        fontSize: 22,
        color: Theme.Color.PrimaryBlue,
    },
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 8,
    },
    instructionsText: {
        fontWeight: 'bold',
    },
    instructionsInfoText: {
        color: 'grey',
    },
    button: {
        marginVertical: 16,
    },
});

interface AddMuTagVCProps extends NavigationScreenProps {
    viewModel: AddMuTagViewModel;
    addMuTagService: AddMuTagService;
}

export default class AddMuTagViewController extends Component<AddMuTagVCProps> {

    componentDidMount(): void {
        this.props.viewModel.onNavigateToNameMuTag((): void => {
            this.props.navigation.navigate('NameMuTag');
        });
        this.props.viewModel.onBack(this.props.navigation.goBack);
    }

    render(): Element {
        const window = Dimensions.get('window');

        return (
            <ImageBackgrounds.AddMuTag
                imageStyle={[styles.mainImage, {top: -window.height / 6}]}
                style={styles.mainImageView}
            >
                <SafeAreaView style={[styles.safeAreaView]}>
                    <View style={styles.topContainer}>
                        <Appbar.Header style={styles.appBar}>
                            <Appbar.BackAction onPress={(): void => this.goBack()}/>
                        </Appbar.Header>
                    </View>
                    <View style={styles.bottomContainer}>
                        <View style={styles.instructions}>
                            <View>
                                <View style={styles.instructionsRow}>
                                    <Icon
                                        name="numeric-1-circle-outline"
                                        style={[styles.instructionsIconCol, styles.instructionsIcon]}
                                    />
                                    <Subheading style={[styles.instructionsTextCol, styles.instructionsText]}>
                                        Press the Mu tag button now to wake it up.
                                    </Subheading>
                                </View>
                                <View style={[styles.instructionsRow, styles.instructionsInfoRow]}>
                                    <Icon
                                        name="information-outline"
                                        style={[styles.instructionsIconCol, styles.instructionsInfoIcon]}
                                    />
                                    <Text style={[styles.instructionsTextCol, styles.instructionsInfoText]}>
                                        The dot on the Mu tag logo should start flashing green.
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.instructionsRow}>
                                <Icon
                                    name="numeric-2-circle-outline"
                                    color="black" style={[styles.instructionsIconCol, styles.instructionsIcon]}
                                />
                                <Subheading style={[styles.instructionsTextCol, styles.instructionsText]}>
                                    Keep the Mu tag close to the app during this setup.
                                </Subheading>
                            </View>
                        </View>
                        <View>
                            <Button
                                mode="contained"
                                onPress={(): void => this.props.addMuTagService.instructionsComplete()}
                                style={styles.button}
                            >
                                Continue
                            </Button>
                        </View>
                    </View>
                </SafeAreaView>
            </ImageBackgrounds.AddMuTag>
        );
    }

    private goBack(): void {
        this.props.viewModel.goBack();
        this.props.addMuTagService.stopAddingNewMuTag();
    }
}
