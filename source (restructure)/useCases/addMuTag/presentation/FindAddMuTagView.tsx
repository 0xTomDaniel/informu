import { Button, Headline, ActivityIndicator, Text } from "react-native-paper";
import { StyleSheet, Platform, StatusBar, View } from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import React, {
    ReactElement,
    FunctionComponent,
    useEffect,
    useState
} from "react";
import DeviceInfo from "react-native-device-info";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AddMuTagViewModel from "./AddMuTagViewModel";
import { skip } from "rxjs/operators";
import { ViewModelUserMessage } from "../../../shared/viewModel/ViewModel";

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
    instructionsIcon: {
        fontSize: Scale(40),
        color: Theme.Color.PrimaryBlue
    },
    instructionsInfoIcon: {
        fontSize: Scale(22, 19),
        color: Theme.Color.Error
    },
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 12
    },
    instructionsText: {
        fontSize: Scale(22) // Default 24
    },
    instructionsInfoText: {
        fontSize: Scale(15, 13),
        color: Theme.Color.Error
    },
    button: {
        //alignSelf: "center",
        marginVertical: 16
    },
    errorDialogTitle: {
        fontSize: Scale(20, 19)
    }
});

interface FindAddMuTagViewProps extends NavigationScreenProps {
    viewModel: AddMuTagViewModel;
}

const FindAddMuTagView: FunctionComponent<FindAddMuTagViewProps> = (
    props
): ReactElement => {
    const [showActivity, setShowActivity] = useState<boolean>(
        props.viewModel.showActivity.value
    );
    const [showCancel, setShowCancel] = useState<boolean>(
        props.viewModel.showCancel.value
    );
    const [showCancelActivity, setShowCancelActivity] = useState<boolean>(
        props.viewModel.showCancelActivity.value
    );
    const [showFailure, setShowFailure] = useState<
        ViewModelUserMessage | undefined
    >(props.viewModel.showFailure.value);
    const [showRetry, setShowRetry] = useState<boolean>(
        props.viewModel.showRetry.value
    );

    useEffect(() => {
        const subscription = props.viewModel.showActivity
            .pipe(skip(1))
            .subscribe(setShowActivity);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showActivity]);

    useEffect(() => {
        const subscription = props.viewModel.showCancel
            .pipe(skip(1))
            .subscribe(setShowCancel);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showCancel]);

    useEffect(() => {
        const subscription = props.viewModel.showCancelActivity
            .pipe(skip(1))
            .subscribe(setShowCancelActivity);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showCancelActivity]);

    useEffect(() => {
        const subscription = props.viewModel.showFailure
            .pipe(skip(1))
            .subscribe(setShowFailure);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showFailure]);

    useEffect(() => {
        const subscription = props.viewModel.showRetry
            .pipe(skip(1))
            .subscribe(setShowRetry);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showRetry]);

    useEffect(() => {
        props.viewModel.startAddingMuTag();
    }, [props.viewModel]);

    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <View style={styles.mainContainer}>
                {showActivity ? (
                    <View>
                        <Headline style={styles.headline}>
                            {showCancel
                                ? "Searching for new Mu tag..."
                                : "Setting up new Mu tag..."}
                        </Headline>
                        <ActivityIndicator
                            animating={true}
                            color={Theme.Color.PrimaryBlue}
                            size="large"
                        />
                    </View>
                ) : null}
                {showFailure == null ? null : (
                    <View style={styles.instructionsRow}>
                        <Icon
                            name="alert-circle"
                            style={[
                                styles.instructionsIconCol,
                                styles.instructionsIcon
                            ]}
                        />
                        <Text
                            style={[
                                styles.instructionsTextCol,
                                styles.instructionsText
                            ]}
                        >
                            {showFailure.message}
                        </Text>
                    </View>
                )}
            </View>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between"
                }}
            >
                <Button
                    mode="text"
                    onPress={() => props.viewModel.cancel()}
                    style={styles.button}
                    disabled={!showCancel}
                    loading={showCancelActivity}
                >
                    Cancel
                </Button>
                {showRetry ? (
                    <Button
                        mode="contained"
                        onPress={() => props.viewModel.startAddingMuTag(true)}
                        style={styles.button}
                        disabled={showActivity}
                    >
                        Try again
                    </Button>
                ) : null}
            </View>
            {/*<ErrorDialog
                message={showFailure?.message ?? ""}
                detailMessage={showFailure?.details ?? ""}
                visible={showFailure != null}
                onDismiss={(): void =>
                    this.props.addMuTagService.stopAddingNewMuTag()
                }
            />*/}
        </SafeAreaView>
    );
};

export default FindAddMuTagView;
