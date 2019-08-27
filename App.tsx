import React, { Component } from 'react';
import {
    createSwitchNavigator,
    createStackNavigator,
    createAppContainer,
    NavigationScreenProps,
    NavigationContainerComponent,
    NavigationActions,
} from 'react-navigation';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import LoginViewController from './source/Primary Adapters/Presentation/LoginViewController';
import LoadSessionViewController from './source/Primary Adapters/Presentation/LoadSessionViewController';
import Theme from './source/Primary Adapters/Presentation/Theme';
import { AuthenticationFirebase } from './source/Secondary Adapters/Infrastructure/AuthenticationFirebase';
import { AccountRepoRNCAsyncStorage } from './source/Secondary Adapters/Persistence/AccountRepoRNCAsyncStorage';
import HomeViewController from './source/Primary Adapters/Presentation/HomeViewController';
import { AccountRepoRNFirebase } from './source/Secondary Adapters/Persistence/AccountRepoRNFirebase';
import AppViewModel, { Screen } from './source/Primary Adapters/Presentation/AppViewModel';
import AppPresenter from './source/Primary Adapters/Presentation/AppPresenter';
import SessionService from './source/Core/Application/SessionService';
import { AppStateController } from './source/Primary Adapters/Device/AppStateController';

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
        LoadSession: LoadSessionViewController,
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

export default class App extends Component {

    private navigator: NavigationContainerComponent | null | undefined;
    private viewModel = new AppViewModel();
    private sessionPresenter = new AppPresenter(this.viewModel);
    private sessionService = new SessionService(
        this.sessionPresenter,
        authentication,
        accountRepoLocal,
    );
    private appStateController = new AppStateController(this.sessionService);

    componentDidMount(): void {
        this.viewModel.onNavigate((screen): void => {
            switch (screen) {
                case Screen.App:
                    this.navigate('App');
                    break;
                case Screen.Entry:
                    this.navigate('Entry');
                    break;
                case Screen.LoadSession:
                    this.navigate('LoadSession');
                    break;
            }
        });
        this.sessionService.load();
    }

    render(): Element {
        return (
            <PaperProvider theme={paperTheme}>
                <AppNavigator
                    ref={(navigator): void => {
                        this.navigator = navigator;
                    }}
                />
            </PaperProvider>
        );
    }

    private navigate(routeName: string): void {
        if (this.navigator != null) {
            this.navigator.dispatch(
                NavigationActions.navigate({ routeName: routeName })
            );
        }
    }
}
