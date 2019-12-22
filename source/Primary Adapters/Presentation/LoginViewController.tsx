import React, {
    FunctionComponent,
    ReactElement,
    useState,
    useEffect
} from "react";
import {
    View,
    StyleSheet,
    Platform,
    StatusBar,
    TouchableWithoutFeedback,
    Keyboard
} from "react-native";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import { LoginViewModel, LoginState } from "./LoginViewModel";
import { LoginService } from "../../Core/Application/LoginService";
import DeviceInfo from "react-native-device-info";
import { Images } from "./Images";
import Theme from "./Theme";
import { Button } from "react-native-paper";

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop:
            Platform.OS === "android" && DeviceInfo.hasNotch()
                ? StatusBar.currentHeight
                : 0
    },
    devBackgroundColor1: {
        backgroundColor: "skyblue"
    },
    devBackgroundColor2: {
        backgroundColor: "steelblue"
    },
    devBackgroundColor3: {
        backgroundColor: "mediumblue"
    },
    devBackgroundColor4: {
        backgroundColor: "navy"
    },
    devSmallBox: {
        width: 50,
        height: 50
    },

    base: {
        backgroundColor: Theme.Color.AlmostWhite,
        paddingHorizontal: 16,
        justifyContent: "space-evenly"
    },
    logo: {
        resizeMode: "contain",
        width: undefined,
        height: undefined,
        marginHorizontal: 16
    },
    content: {
        flex: 0.77,
        justifyContent: "center" //justifyContent: "space-between" // Use "space-between" for email login
    },
    deleteMeForEmailLogin: {
        height: 80
    },
    textInput: {
        backgroundColor: "white"
    },
    textInputError: {
        paddingLeft: 16,
        paddingTop: 4,
        color: Theme.Color.Error,
        fontWeight: "bold"
    },
    buttonContentStyle: {
        backgroundColor: "#FFFFFF",
        justifyContent: "space-evenly"
    },
    buttonStyle: {
        marginTop: 12,
        marginHorizontal: 16,
        borderColor: Theme.Color.AlmostWhiteBorder
    },
    buttonLabelStyle: {
        flex: 0.8
    }
});

interface LoginVCProps extends NavigationScreenProps {
    viewModel: LoginViewModel;
    loginService: LoginService;
}

const LoginViewController: FunctionComponent<LoginVCProps> = (
    props
): ReactElement => {
    const [state, setState] = useState<LoginState>(props.viewModel.state);

    const signInWithGoogle = (): void => {
        props.loginService.signInWithGoogle().catch(e => console.warn(e));
    };
    /*const signInWithEmail = (): void => {
        const emailAddress = new EmailAddress(state.emailInput);
        const password = new Password(state.passwordInput);

        props.loginService.logInWithEmail(emailAddress, password);
    };*/

    useEffect((): (() => void) => {
        props.viewModel.onDidUpdate((change): void => setState(change));
        props.viewModel.onNavigateToApp((): boolean =>
            props.navigation.navigate("App")
        );

        return (): void => {
            props.viewModel.onDidUpdate(undefined);
            props.viewModel.onNavigateToApp(undefined);
        };
    });

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                <Images.IconLogoCombo style={styles.logo} />
                <View style={styles.content}>
                    <View>
                        <Button
                            icon="facebook"
                            mode="outlined"
                            color="#3B5998"
                            uppercase={false}
                            loading={state.isBusy}
                            onPress={(): void => console.log("Pressed")}
                            style={styles.buttonStyle}
                            contentStyle={styles.buttonContentStyle}
                            labelStyle={styles.buttonLabelStyle}
                        >
                            Sign in with Facebook
                        </Button>
                        <Button
                            icon="google"
                            mode="outlined"
                            color="#DB4437"
                            uppercase={false}
                            loading={state.isBusy}
                            onPress={(): void => signInWithGoogle()}
                            style={styles.buttonStyle}
                            contentStyle={styles.buttonContentStyle}
                            labelStyle={styles.buttonLabelStyle}
                        >
                            Sign in with Google
                        </Button>
                    </View>
                    <View style={styles.deleteMeForEmailLogin}>
                        {/*<TextInput
                            label="Email address"
                            mode="outlined"
                            value={this.state.emailInput}
                            onChangeText={text => this.setState({ text })}
                            theme={{
                                colors: {
                                    primary: Theme.Color.SecondaryOrange
                                }
                            }}
                            style={styles.textInput}
                        />
                        <TextInput
                            label="Password"
                            mode="outlined"
                            value={this.state.passwordInput}
                            onChangeText={text => this.setState({ text })}
                            theme={{
                                colors: {
                                    primary: Theme.Color.SecondaryOrange
                                }
                            }}
                            style={styles.textInput}
                        />
                        <Button
                            icon="email-outline"
                            mode="outlined"
                            uppercase={false}
                            loading={this.state.isBusy}
                            onPress={() => console.log("Pressed")}
                            style={styles.buttonStyle}
                            contentStyle={styles.buttonContentStyle}
                            labelStyle={styles.buttonLabelStyle}
                        >
                            Sign in with email
                        </Button>*/}
                    </View>
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default LoginViewController;
