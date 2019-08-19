import React, { Component, ComponentType } from 'react';
import {
    ActivityIndicator,
    Text,
    AppRegistry,
    View,
    TextInput,
    StyleSheet,
    Platform,
    StatusBar,
    SafeAreaView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { LoginViewModel } from './LoginViewModel';
import { LoginService, EmailAddress, Password } from '../../Core/Application/LoginService';
import DeviceInfo from 'react-native-device-info';
import Images from './Images';
import PrimaryButton from './Base Components/PrimaryButton';
import Theme from './Theme';
import LoginPresenter from './LoginPresenter';
import { AuthenticationFirebase } from '../../Secondary Adapters/Infrastructure/AuthenticationFirebase';
import { AccountRepoRNCAsyncStorage } from '../../Secondary Adapters/Persistence/AccountRepoRNCAsyncStorage';
import { AccountRepoRNFirebase } from '../../Secondary Adapters/Persistence/AccountRepoRNFirebase';

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        paddingTop: (Platform.OS === 'android' && DeviceInfo.hasNotch())
            ? StatusBar.currentHeight : 0,
    },
    devBackgroundColor1: { backgroundColor: 'skyblue' },
    devBackgroundColor2: { backgroundColor: 'steelblue' },
    devBackgroundColor3: { backgroundColor: 'mediumblue' },
    devBackgroundColor4: { backgroundColor: 'navy' },
    devSmallBox: {
        width: 50,
        height: 50,
    },

    base: {
        backgroundColor: Theme.Color.AlmostWhite,
        paddingHorizontal: 16,
        justifyContent: 'space-around',
    },
    logo: {
        resizeMode: 'contain',
        width: undefined,
        height: undefined,
        marginHorizontal: 16,
    },
    textInput: {
        marginVertical: 4,
        paddingHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: Theme.BorderRadius,
        borderWidth: 1,
        borderColor: Theme.Color.ExtraLightGrey,
    },
    textInputError: {
        paddingLeft: 16,
        paddingTop: 4,
        color: Theme.Color.Error,
        fontWeight: 'bold',
    },
    logInButtonContainer: {
        justifyContent: 'center',
    },
    logInActivityIndicator: {
        alignSelf: 'center',
        position: 'absolute',
    },
});

export default class LoginViewController extends Component {

    private viewModel = new LoginViewModel();
    private loginPresenter = new LoginPresenter(this.viewModel);
    private authentication = new AuthenticationFirebase();
    private accountRepoLocal = new AccountRepoRNCAsyncStorage();
    private accountRepoRemote = new AccountRepoRNFirebase();
    private loginService = new LoginService(
        this.loginPresenter,
        this.authentication,
        this.accountRepoLocal,
        this.accountRepoRemote
    );

    state: Readonly<LoginState> = this.viewModel;

    componentDidMount(): void {
        this.viewModel.onDidUpdate((change): void => {
            this.setState(change);
        });
    }

    render(): Element {
        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                    <Images.IconLogoCombo style={[styles.logo]} />
                    <View>
                        <Text style={styles.textInputError}>
                            {this.state.emailErrorMessage}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            keyboardType="email-address"
                            placeholder="Email address"
                            //onSubmitEditing
                            onChangeText={(text): void => {
                                this.viewModel.emailInput = text;
                            }}
                            value={this.state.emailInput}
                        />
                        <Text style={styles.textInputError}>
                            {this.state.passwordErrorMessage}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            secureTextEntry={true}
                            placeholder="Password"
                            //onSubmitEditing
                            onChangeText={(text): void => {
                                this.viewModel.passwordInput = text;
                            }}
                            value={this.state.passwordInput}
                        />
                    </View>
                    <View style={styles.logInButtonContainer}>
                        <PrimaryButton
                            onPress={(): void => this.logInWithEmail()}
                            title="Log In"
                            disabled={this.state.logInButtonDisabled}
                        />
                        {this.state.isBusy
                            && <ActivityIndicator
                                style={styles.logInActivityIndicator}
                                size="large"
                                color={Theme.Color.PrimaryBlue}
                                animating={this.state.isBusy}
                            />
                        }
                    </View>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        );
    }

    private logInWithEmail(): void {
        const emailAddress = new EmailAddress(this.state.emailInput);
        const password = new Password(this.state.passwordInput);

        this.loginService.logInWithEmail(emailAddress, password);
    }
}

export interface LoginState {

    emailInput: string;
    passwordInput: string;
    emailErrorMessage: string;
    passwordErrorMessage: string;
    isBusy: boolean;
    logInButtonDisabled: boolean;
}

AppRegistry.registerComponent('MuTagReactNative', (): ComponentType => LoginViewController);