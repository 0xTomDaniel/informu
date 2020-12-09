import { Button, TextInput, Headline, Text } from "react-native-paper";
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
import React, {
    ReactElement,
    FunctionComponent,
    useState,
    useEffect
} from "react";
import DeviceInfo from "react-native-device-info";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import AddMuTagViewModel from "./AddMuTagViewModel";
import { skip } from "rxjs/operators";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
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
        color: Theme.Color.Error
    },
    instructionsTextCol: {
        flex: 6,
        marginHorizontal: 12
    },
    instructionsInfoText: {
        fontSize: Scale(15, 13),
        color: Theme.Color.Error
    },
    button: {
        alignSelf: "center",
        marginVertical: 16
    },
    errorDialogTitle: {
        fontSize: Scale(20, 19)
    }
});

interface NameMuTagViewProps extends NavigationScreenProps {
    viewModel: AddMuTagViewModel;
}

const NameMuTagView: FunctionComponent<NameMuTagViewProps> = (
    props
): ReactElement => {
    const [muTagName, setMuTagName] = useState<string>("");
    const [showActivity, setShowActivity] = useState<boolean>(
        props.viewModel.showActivity.value
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

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                {/*<Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction
                        onPress={(): void =>
                            this.props.addMuTagService.stopAddingNewMuTag()
                        }
                    />
                    </Appbar.Header>*/}
                <View style={styles.mainContainer}>
                    <Headline style={styles.headline}>
                        What is the name of this Mu tag?
                    </Headline>
                    <TextInput
                        label="Attached to"
                        mode="outlined"
                        value={muTagName}
                        onChangeText={text => setMuTagName(text)}
                        theme={{
                            colors: {
                                primary: Theme.Color.SecondaryOrange,
                                placeholder: "silver"
                            }
                        }}
                        style={styles.attachedToInput}
                    />
                </View>
                {showFailure == null ? null : (
                    <View
                        style={[
                            styles.instructionsRow,
                            styles.instructionsInfoRow
                        ]}
                    >
                        <Icon
                            name="alert-circle-outline"
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
                            {showFailure.message}
                        </Text>
                    </View>
                )}
                <Button
                    mode="contained"
                    onPress={() => props.viewModel.setMuTagName(muTagName)}
                    loading={showActivity}
                    style={styles.button}
                    disabled={showActivity}
                >
                    {showActivity ? "Saving" : "Save"}
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
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default NameMuTagView;
