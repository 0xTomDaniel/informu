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
import AddMuTagViewModel, { MediumPriorityMessage } from "./AddMuTagViewModel";
import { skip } from "rxjs/operators";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ProgressIndicatorState } from "../../../shared/viewModel/ViewModel";

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
    mainContainer: {
        flex: 1,
        paddingHorizontal: 32
    },
    headline: {
        flex: 1,
        textAlign: "center",
        textAlignVertical: "center",
        fontSize: Scale(28, 24)
    },
    attachedToInput: {
        backgroundColor: "white"
    },
    bottomContent: {
        flex: 1,
        justifyContent: "center"
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
    }
});

interface NameMuTagViewProps extends NavigationScreenProps {
    viewModel: AddMuTagViewModel;
}

const NameMuTagView: FunctionComponent<NameMuTagViewProps> = (
    props
): ReactElement => {
    const [mediumPriorityMessage, setMediumPriorityMessage] = useState<
        MediumPriorityMessage | undefined
    >(props.viewModel.mediumPriorityMessageValue);
    const [muTagName, setMuTagName] = useState<string>("");
    const [progressIndicator, setProgressIndicator] = useState<
        ProgressIndicatorState
    >(props.viewModel.progressIndicatorValue);
    const [showRetry, setShowRetry] = useState<boolean>(
        props.viewModel.showRetry.value
    );

    useEffect(() => {
        const subscription = props.viewModel.progressIndicator
            .pipe(skip(1))
            .subscribe(setProgressIndicator);
        return () => subscription.unsubscribe();
    }, [props.viewModel.progressIndicator]);

    useEffect(() => {
        const subscription = props.viewModel.mediumPriorityMessage
            .pipe(skip(1))
            .subscribe(setMediumPriorityMessage);
        return () => subscription.unsubscribe();
    }, [props.viewModel.mediumPriorityMessage]);

    useEffect(() => {
        const subscription = props.viewModel.showRetry
            .pipe(skip(1))
            .subscribe(setShowRetry);
        return () => subscription.unsubscribe();
    }, [props.viewModel.showRetry]);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
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
                    <View style={styles.bottomContent}>
                        {mediumPriorityMessage == null ? null : (
                            <View style={styles.instructionsRow}>
                                <Icon
                                    name="alert-circle"
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
                                    {mediumPriorityMessage}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <Button
                    mode="contained"
                    onPress={() => props.viewModel.setMuTagName(muTagName)}
                    loading={progressIndicator === "Indeterminate"}
                    style={styles.button}
                    disabled={progressIndicator === "Indeterminate"}
                >
                    {progressIndicator === "Indeterminate"
                        ? "Saving"
                        : showRetry
                        ? "Try again"
                        : "Save"}
                </Button>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default NameMuTagView;
