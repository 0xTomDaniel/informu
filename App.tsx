import React from 'react';
import {
    createSwitchNavigator,
    createStackNavigator,
    createAppContainer,
    NavigationScreenProps,
} from 'react-navigation';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import LoginViewController from './source/Primary Adapters/Presentation/LoginViewController';
import LoadSessionViewController from './source/Primary Adapters/Presentation/LoadSessionViewController';
import Theme from './source/Primary Adapters/Presentation/Theme';
import { AuthenticationFirebase } from './source/Secondary Adapters/Infrastructure/AuthenticationFirebase';
import { AccountRepoRNCAsyncStorage } from './source/Secondary Adapters/Persistence/AccountRepoRNCAsyncStorage';
import HomeViewController from './source/Primary Adapters/Presentation/HomeViewController';
import { AccountRepoRNFirebase } from './source/Secondary Adapters/Persistence/AccountRepoRNFirebase';

const authentication = new AuthenticationFirebase();
const accountRepoLocal = new AccountRepoRNCAsyncStorage();
const accountRepoRemote = new AccountRepoRNFirebase();

const AppStack = createStackNavigator({ Home: HomeViewController });
const EntryStack = createStackNavigator(
    {
        Login: {
            screen: (props: NavigationScreenProps): Element => (
                <LoginViewController
                    authentication={authentication}
                    accountRepoLocal={accountRepoLocal}
                    accountRepoRemote={accountRepoRemote}
                    {...props}
                />
            ),
        },
    },
    {
        headerMode: 'none',
    }
);

const AppNavigator = createAppContainer(createSwitchNavigator(
    {
        LoadSession: {
            screen: (props: NavigationScreenProps): Element => (
                <LoadSessionViewController
                    authentication={authentication}
                    accountRepoLocal={accountRepoLocal}
                    {...props}
                />
            ),
        },
        App: AppStack,
        Entry: EntryStack,
    },
    {
        initialRouteName: 'LoadSession',
    }
));

const paperTheme = {
    ...DefaultTheme,
    roundness: Theme.BorderRadius,
    colors: {
        ...DefaultTheme.colors,
        primary: Theme.Color.PrimaryOrange,
        accent: Theme.Color.PrimaryBlue,
        background: Theme.Color.AlmostWhite,
        surface: 'white',
        error: Theme.Color.Error,
    },
};

export default function App(): Element {
    return (
        <PaperProvider theme={paperTheme}>
            <AppNavigator />
        </PaperProvider>
    );
}
