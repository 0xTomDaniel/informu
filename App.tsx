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
import AddMuTagViewController from './source/Primary Adapters/Presentation/AddMuTagViewController';
import { RSSI } from './source/Core/Domain/Types';
import Percent from './source/Core/Domain/Percent';
import { MuTagDevicesRNBLEPLX } from './source/Secondary Adapters/Infrastructure/MuTagDevicesRNBLEPLX';
import AddMuTagService from './source/Core/Application/AddMuTagService';
import { HomeViewModel } from './source/Primary Adapters/Presentation/HomeViewModel';
import AddMuTagPresenter from './source/Primary Adapters/Presentation/AddMuTagPresenter';
import { AddMuTagViewModel } from './source/Primary Adapters/Presentation/AddMuTagViewModel';
import { MuTagRepoRNCAsyncStorage } from './source/Secondary Adapters/Persistence/MuTagRepoRNCAsyncStorage';
import { MuTagRepoRNFirebase } from './source/Secondary Adapters/Persistence/MuTagRepoRNFirebase';
import NameMuTagViewController from './source/Primary Adapters/Presentation/NameMuTagViewController';
import { NameMuTagViewModel } from './source/Primary Adapters/Presentation/NameMuTagViewModel';
import { MuTagAddingViewModel } from './source/Primary Adapters/Presentation/MuTagAddingViewModel';
import MuTagAddingViewController from './source/Primary Adapters/Presentation/MuTagAddingViewController';
import LogoutService from './source/Core/Application/LogoutService';
import LogoutPresenter from './source/Primary Adapters/Presentation/LogoutPresenter';
import RepoLocalRNCAsyncStorage from './source/Secondary Adapters/Persistence/RepoLocalRNCAsyncStorage';
import BelongingDashboardService from './source/Core/Application/BelongingDashboardService';
import BelongingDashboardPresenter from './source/Primary Adapters/Presentation/BelongingDashboardPresenter';

const authentication = new AuthenticationFirebase();
const accountRepoLocal = new AccountRepoRNCAsyncStorage();
const accountRepoRemote = new AccountRepoRNFirebase();
const muTagRepoLocal = new MuTagRepoRNCAsyncStorage();
const muTagRepoRemote = new MuTagRepoRNFirebase();
const connectThreshold = -80 as RSSI;
const addMuTagBatteryThreshold = new Percent(20);
const homeViewModel = new HomeViewModel();
const addMuTagViewModel = new AddMuTagViewModel();
const nameMuTagViewModel = new NameMuTagViewModel();
const muTagAddingViewModel = new MuTagAddingViewModel();
const addMuTagPresenter = new AddMuTagPresenter(
    homeViewModel,
    addMuTagViewModel,
    nameMuTagViewModel,
    muTagAddingViewModel,
);
const muTagDevices = new MuTagDevicesRNBLEPLX();
const addMuTagService = new AddMuTagService(
    connectThreshold,
    addMuTagBatteryThreshold,
    addMuTagPresenter,
    muTagDevices,
    muTagRepoLocal,
    muTagRepoRemote,
    accountRepoLocal,
    accountRepoRemote,
);
const logoutPresenter = new LogoutPresenter(homeViewModel);
const repoLocal = new RepoLocalRNCAsyncStorage();
const logoutService = new LogoutService(
    logoutPresenter,
    accountRepoLocal,
    accountRepoRemote,
    muTagRepoLocal,
    muTagRepoRemote,
    repoLocal,
);
const belongingDashboardPresenter = new BelongingDashboardPresenter(homeViewModel);
const belongingDashboardService = new BelongingDashboardService(
    belongingDashboardPresenter,
    muTagRepoLocal,
);

const AppStack = createStackNavigator(
    {
        Home: {
            screen: (props: NavigationScreenProps): Element => (
                <HomeViewController
                    homeViewModel={homeViewModel}
                    belongingDashboardService={belongingDashboardService}
                    logoutService={logoutService}
                    addMuTagService={addMuTagService}
                    {...props}
                />
            ),
        },
        AddMuTag: {
            screen: (props: NavigationScreenProps): Element => (
                <AddMuTagViewController
                    viewModel={addMuTagViewModel}
                    addMuTagService={addMuTagService}
                    {...props}
                />
            ),
        },
        NameMuTag: {
            screen: (props: NavigationScreenProps): Element => (
                <NameMuTagViewController
                    viewModel={nameMuTagViewModel}
                    addMuTagService={addMuTagService}
                    {...props}
                />
            ),
        },
        MuTagAdding: {
            screen: (props: NavigationScreenProps): Element => (
                <MuTagAddingViewController
                    viewModel={muTagAddingViewModel}
                    addMuTagService={addMuTagService}
                    {...props}
                />
            ),
        },
    },
    {
        defaultNavigationOptions: {
            header: null,
        },
    },
);
const EntryStack = createStackNavigator(
    {
        Login: {
            screen: (props: NavigationScreenProps): Element => (
                <LoginViewController
                    authentication={authentication}
                    accountRepoLocal={accountRepoLocal}
                    accountRepoRemote={accountRepoRemote}
                    muTagRepoLocal={muTagRepoLocal}
                    muTagRepoRemote={muTagRepoRemote}
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
