import React, { FunctionComponent } from "react";
import { SafeAreaView, NavigationScreenProps } from "react-navigation";
import { StyleSheet, Platform, StatusBar } from "react-native";
import { Images } from "./Images";
import { ProgressBar } from "react-native-paper";
import DeviceInfo from "react-native-device-info";
import Theme from "./Theme";
import { Authentication } from "../../Core/Ports/Authentication";
import { AccountRepositoryLocal } from "../../Core/Ports/AccountRepositoryLocal";

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
        paddingHorizontal: 16,
        justifyContent: "center"
    },
    logo: {
        resizeMode: "contain",
        width: undefined,
        height: undefined,
        marginHorizontal: 16
    },
    progress: {
        margin: 16
    }
});

const paperTheme = {
    colors: {
        primary: Theme.Color.PrimaryBlue
    }
};

interface LoadSessionVCProps extends NavigationScreenProps {
    authentication: Authentication;
    accountRepoLocal: AccountRepositoryLocal;
}

const LoadSessionViewController: FunctionComponent = () => {
    return (
        <SafeAreaView style={[styles.safeAreaView, styles.base]}>
            <Images.IconLogoCombo style={[styles.logo]} />
            <ProgressBar
                style={styles.progress}
                theme={paperTheme}
                indeterminate={true}
            />
        </SafeAreaView>
    );
};

export default LoadSessionViewController;
