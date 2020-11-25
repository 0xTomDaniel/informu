import { Appbar, Button, TextInput, Headline } from "react-native-paper";
import {
    StyleSheet,
    Platform,
    StatusBar,
    View,
    TouchableWithoutFeedback,
    Keyboard
} from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import React, { Component, ReactElement } from "react";
import DeviceInfo from "react-native-device-info";
import { NameMuTagViewModel, NameMuTagState } from "./NameMuTagViewModel";
import AddMuTagInteractorImpl from "../AddMuTagInteractor";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import { MuTagColor } from "../../../../source/Core/Domain/MuTag";
import ErrorDialog from "../../../../source/Primary Adapters/Presentation/Base Components/ErrorDialog";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhite
    },
    mainImage: {
        width: "100%",
        resizeMode: "contain",
        backgroundColor: Theme.Color.AlmostWhite,
        position: "absolute"
    },
    mainImageView: {
        width: "100%",
        height: "100%",
        backgroundColor: Theme.Color.AlmostWhite
    },
    appBar: {
        backgroundColor: "transparent",
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0
            }
        })
    },
    mainContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 32
    },
    headline: {
        position: "absolute",
        top: 0,
        left: 32,
        textAlign: "center",
        fontSize: Scale(28, 24)
    },
    attachedToInput: {
        backgroundColor: "white"
    },
    button: {
        alignSelf: "center",
        marginVertical: 16
    },
    errorDialogTitle: {
        fontSize: Scale(20, 19)
    }
});

interface NameMuTagVCProps extends NavigationScreenProps {
    viewModel: NameMuTagViewModel;
    addMuTagService: AddMuTagInteractorImpl;
}

export default class NameMuTagViewController extends Component<
    NameMuTagVCProps
> {
    state: Readonly<NameMuTagState> = this.props.viewModel;

    componentDidMount(): void {
        this.props.viewModel.onDidUpdate((change): void =>
            this.setState(change)
        );
        this.props.viewModel.onNavigateToMuTagSettings(
            (): Promise<void> =>
                this.props.addMuTagService.completeMuTagSetup(
                    MuTagColor.MuOrange
                )
        );
        this.props.viewModel.onNavigateToMuTagAdding((): boolean =>
            this.props.navigation.navigate("MuTagAdding")
        );
        this.props.viewModel.onNavigateToHomeScreen((): boolean =>
            this.props.navigation.popToTop()
        );
    }

    componentWillUnmount(): void {
        this.props.viewModel.onDidUpdate(undefined);
        this.props.viewModel.onNavigateToMuTagSettings(undefined);
        this.props.viewModel.onNavigateToMuTagAdding(undefined);
        this.props.viewModel.onNavigateToHomeScreen(undefined);
    }

    render(): ReactElement {
        return (
            <TouchableWithoutFeedback
                onPress={Keyboard.dismiss}
                accessible={false}
            >
                <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                    <Appbar.Header style={styles.appBar}>
                        <Appbar.BackAction
                            onPress={(): void =>
                                this.props.addMuTagService.stopAddingNewMuTag()
                            }
                        />
                    </Appbar.Header>
                    <View style={styles.mainContainer}>
                        <Headline style={styles.headline}>
                            What is the name of this Mu tag?
                        </Headline>
                        <TextInput
                            label="Attached to"
                            mode="outlined"
                            value={this.state.attachedToInput}
                            onChangeText={(text: string): void => {
                                this.props.viewModel.attachedToInput = text;
                            }}
                            theme={{
                                colors: {
                                    primary: Theme.Color.SecondaryOrange,
                                    placeholder: "silver"
                                }
                            }}
                            style={styles.attachedToInput}
                        />
                    </View>
                    <Button
                        mode="contained"
                        onPress={(): Promise<void> =>
                            this.props.addMuTagService.setMuTagName(
                                this.state.attachedToInput
                            )
                        }
                        loading={this.state.showActivityIndicator}
                        style={styles.button}
                    >
                        {this.state.showActivityIndicator ? "Adding" : "Add"}
                    </Button>
                    <ErrorDialog
                        message={this.state.userErrorDescription}
                        detailMessage={this.state.detailedErrorDescription}
                        visible={this.state.showError}
                        onDismiss={(): void =>
                            this.props.addMuTagService.stopAddingNewMuTag()
                        }
                    />
                </SafeAreaView>
            </TouchableWithoutFeedback>
        );
    }
}
