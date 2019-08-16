import React, { Component, ComponentType } from 'react';
import { Text, AppRegistry, View, TextInput, StyleSheet, Platform, StatusBar, SafeAreaView, TouchableWithoutFeedback, Keyboard, Button, Image } from 'react-native';
import { LoginViewModel, LoginViewModelState } from './LoginViewModel';
import { LoginService } from '../../Core/Application/LoginService';
import DeviceInfo from 'react-native-device-info';
import Images from './Images';
import PrimaryButton from './Base Components/PrimaryButton';
import Theme from './Theme';

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
});

export default class LoginViewController extends Component {

    componentDidMount(): void {
        this.viewModel.onDidUpdate((): void => {
            this.setState((): object => (
                this.viewModel.state
            ));
        });
    }

    viewModel = new LoginViewModel();
    //loginService = new LoginService();
    state: Readonly<State> = {
        viewModel: this.viewModel.state,
    }

    render(): Element {
        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <SafeAreaView style={[styles.safeAreaView, styles.base]}>
                    <Images.IconLogoCombo style={[styles.logo]} />
                    <View>
                        <Text style={styles.textInputError}>
                            {this.state.viewModel.emailErrorMessage}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            keyboardType="email-address"
                            placeholder="Email address"
                            //onSubmitEditing
                            onChangeText={(text): void => this.setState({
                                emailInput: text,
                            })}
                            value={this.state.emailInput}
                        />
                        <Text style={styles.textInputError}>
                            {this.state.viewModel.passwordErrorMessage}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            secureTextEntry={true}
                            placeholder="Password"
                            //onSubmitEditing
                            onChangeText={(text): void => this.setState({
                                passwordInput: text,
                            })}
                            value={this.state.passwordInput}
                        />
                    </View>
                    <PrimaryButton
                        onPress={(): void => this.setState({
                            viewModel: {
                                //emailErrorMessage: 'Fuck off',
                                passwordErrorMessage: 'Eat a dick',
                            },
                        })}
                        title="Log In"
                    />
                </SafeAreaView>
            </TouchableWithoutFeedback>
        );
    }
}

interface State {

    viewModel: LoginViewModelState;
    emailInput?: string;
    passwordInput?: string;
}

AppRegistry.registerComponent('MuTagReactNative', (): ComponentType => LoginViewController);
