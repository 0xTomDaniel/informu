import {
    StyleSheet,
    Platform,
    StatusBar,
    View,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView
} from "react-native";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { NavigationScreenProps, SafeAreaView } from "react-navigation";
import AdjustGeolocationInteractorDebug from "./AdjustGeolocationInteractorDebug";
import React, {
    FunctionComponent,
    ReactElement,
    useState,
    useEffect
} from "react";
import DeviceInfo from "react-native-device-info";
import { GeolocationOptions } from "../../../shared/geolocation/LocationMonitor";
import { TextInput, Title, RadioButton, Text } from "react-native-paper";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    base: {
        backgroundColor: Theme.Color.AlmostWhiteBackground
    },
    container: {
        padding: 16
    },
    keyboardAvoidingView: {
        flex: 1
    }
});

interface AdjustGeolocationViewDebugProps extends NavigationScreenProps {
    adjustGeolocationInteractorDebug: AdjustGeolocationInteractorDebug;
}

const AdjustGeolocationViewDebug: FunctionComponent<AdjustGeolocationViewDebugProps> = (
    props
): ReactElement => {
    const [geolocationOptions, setGeolocationOptions] = useState<
        GeolocationOptions
    >({});
    const [activitiesIntervalText, setActivitiesIntervalText] = useState<
        string
    >("");
    const [fastestIntervalText, setFastestIntervalText] = useState<string>("");
    const [intervalText, setIntervalText] = useState<string>("");
    const [
        isKeyboardAvoidingViewEnabled,
        setIsKeyboardAvoidingViewEnabled
    ] = useState<boolean>(true);

    useEffect(() => {
        setGeolocationOptions(
            props.adjustGeolocationInteractorDebug.defaultGeolocationOptions
        );
        setActivitiesIntervalText(
            props.adjustGeolocationInteractorDebug.defaultGeolocationOptions.activitiesInterval?.toString() ??
                ""
        );
        setFastestIntervalText(
            props.adjustGeolocationInteractorDebug.defaultGeolocationOptions.fastestInterval?.toString() ??
                ""
        );
        setIntervalText(
            props.adjustGeolocationInteractorDebug.defaultGeolocationOptions.interval?.toString() ??
                ""
        );
    }, [props.adjustGeolocationInteractorDebug.defaultGeolocationOptions]);

    const updateGeolocationOptions = (options: GeolocationOptions): void => {
        props.adjustGeolocationInteractorDebug.configureGeolocation(options);
        setGeolocationOptions({ ...geolocationOptions, ...options });
    };

    const updateActivitiesInterval = (text: string): void => {
        setActivitiesIntervalText(text);
        if (text === "") {
            return;
        }
        updateGeolocationOptions({
            activitiesInterval: parseInt(text, 10)
        });
    };

    const updateFastestInterval = (text: string): void => {
        setFastestIntervalText(text);
        if (text === "") {
            return;
        }
        updateGeolocationOptions({
            fastestInterval: parseInt(text, 10)
        });
    };

    const updateInterval = (text: string): void => {
        setIntervalText(text);
        if (text === "") {
            return;
        }
        updateGeolocationOptions({
            interval: parseInt(text, 10)
        });
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <KeyboardAvoidingView
                    behavior="position"
                    style={styles.keyboardAvoidingView}
                    keyboardVerticalOffset={-64}
                    enabled={isKeyboardAvoidingViewEnabled}
                >
                    <View style={styles.container}>
                        <TextInput
                            label="Activities Interval"
                            value={activitiesIntervalText}
                            onChangeText={updateActivitiesInterval}
                            onFocus={() =>
                                setIsKeyboardAvoidingViewEnabled(false)
                            }
                            onBlur={() => {
                                setActivitiesIntervalText(
                                    geolocationOptions?.activitiesInterval?.toString() ??
                                        ""
                                );
                                setIsKeyboardAvoidingViewEnabled(true);
                            }}
                        />
                        <RadioButton.Group
                            onValueChange={value =>
                                updateGeolocationOptions({
                                    desiredAccuracy: parseInt(value, 10)
                                })
                            }
                            value={
                                geolocationOptions?.desiredAccuracy?.toString() ??
                                "1"
                            }
                        >
                            <Title>Geolocation Accuracy</Title>
                            <View>
                                <Text>{"  High"}</Text>
                                <RadioButton value="0" />
                            </View>
                            <View>
                                <Text>{"  Medium"}</Text>
                                <RadioButton value="1" />
                            </View>
                            <View>
                                <Text>{"  Low"}</Text>
                                <RadioButton value="2" />
                            </View>
                            <View>
                                <Text>{"  Passive"}</Text>
                                <RadioButton value="3" />
                            </View>
                        </RadioButton.Group>
                        <TextInput
                            label="Fastest Interval"
                            value={fastestIntervalText}
                            onChangeText={updateFastestInterval}
                            onBlur={() => {
                                setFastestIntervalText(
                                    geolocationOptions?.fastestInterval?.toString() ??
                                        ""
                                );
                            }}
                        />
                        <TextInput
                            label="Interval"
                            value={intervalText}
                            onChangeText={updateInterval}
                            onBlur={() => {
                                setIntervalText(
                                    geolocationOptions?.interval?.toString() ??
                                        ""
                                );
                            }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default AdjustGeolocationViewDebug;
