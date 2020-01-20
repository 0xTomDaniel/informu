import {
    Button,
    Headline,
    ActivityIndicator,
    Portal,
    Dialog,
    Paragraph,
    Text
} from "react-native-paper";
import { StyleSheet, Platform, StatusBar, View } from "react-native";
import Theme from "./Theme";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import React, { Component } from "react";
import DeviceInfo from "react-native-device-info";
import { MuTagAddingViewModel, MuTagAddingState } from "./MuTagAddingViewModel";
import AddMuTagInteractor from "../../../source (restructure)/useCases/addMuTag/AddMuTagInteractor";
import { Scale } from "./ResponsiveScaler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MuTagColor } from "../../Core/Domain/MuTag";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhite,
        paddingHorizontal: 16
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
        justifyContent: "center"
    },
    headline: {
        textAlign: "center",
        fontSize: Scale(28, 24),
        marginBottom: 32
    },
    attachedToInput: {
        backgroundColor: "white"
    },
    instructionsRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        width: "100%"
    },
    instructionsInfoRow: {
        marginTop: 4,
        marginBottom: 12
    },
    instructionsIconCol: {
        flex: 1,
        textAlign: "center"
    },
    instructionsInfoIcon: {
        fontSize: Scale(22, 19),
        color: Theme.Color.SecondaryBlue
    },
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 12
    },
    instructionsInfoText: {
        fontSize: Scale(15, 13),
        color: "grey"
    },
    button: {
        alignSelf: "center",
        marginVertical: 16
    },
    errorDialogTitle: {
        fontSize: Scale(20, 19)
    }
});

interface MuTagAddingVCProps extends NavigationScreenProps {
    viewModel: MuTagAddingViewModel;
    addMuTagService: AddMuTagInteractor;
}

export default class MuTagAddingViewController extends Component<
    MuTagAddingVCProps
> {
    state: Readonly<MuTagAddingState> = this.props.viewModel;

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
        this.props.viewModel.onNavigateToHomeScreen((): boolean =>
            this.props.navigation.popToTop()
        );
    }

    componentWillUnmount(): void {
        this.props.viewModel.onDidUpdate(undefined);
        this.props.viewModel.onNavigateToMuTagSettings(undefined);
        this.props.viewModel.onNavigateToHomeScreen(undefined);
    }

    render(): Element {
        return (
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <View style={styles.mainContainer}>
                    <Headline style={styles.headline}>
                        Connecting to Mu tag...
                    </Headline>
                    <ActivityIndicator
                        animating={true}
                        color={Theme.Color.PrimaryBlue}
                        size="large"
                    />
                </View>
                <View
                    style={[styles.instructionsRow, styles.instructionsInfoRow]}
                >
                    <Icon
                        name="information-outline"
                        style={[
                            styles.instructionsIconCol,
                            styles.instructionsInfoIcon
                        ]}
                    />
                    <Text
                        style={[
                            styles.instructionsTextCol,
                            styles.instructionsInfoText
                        ]}
                    >
                        If nothing seems to be happening, then press the Mu tag
                        button to ensure it's awake.
                    </Text>
                </View>
                <Button
                    mode="contained"
                    onPress={(): void =>
                        this.props.addMuTagService.stopAddingNewMuTag()
                    }
                    style={styles.button}
                >
                    Cancel
                </Button>
                <Portal>
                    <Dialog
                        visible={this.state.showError}
                        onDismiss={(): void =>
                            this.props.addMuTagService.stopAddingNewMuTag()
                        }
                    >
                        <Dialog.Title style={styles.errorDialogTitle}>
                            Something went wrong :(
                        </Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{this.state.errorDescription}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                onPress={(): void =>
                                    this.props.addMuTagService.stopAddingNewMuTag()
                                }
                            >
                                Exit
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </SafeAreaView>
        );
    }
}
