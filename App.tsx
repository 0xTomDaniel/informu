import React, { FunctionComponent, ReactElement, useEffect } from "react";
import {
    createSwitchNavigator,
    createStackNavigator,
    createAppContainer,
    NavigationScreenProps,
    NavigationContainerComponent,
    NavigationActions
} from "react-navigation";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import LoginViewController from "./source/Primary Adapters/Presentation/LoginViewController";
import LoadSessionViewController from "./source/Primary Adapters/Presentation/LoadSessionViewController";
import Theme from "./source/Primary Adapters/Presentation/Theme";
import { AuthenticationFirebase } from "./source/Secondary Adapters/Infrastructure/AuthenticationFirebase";
import AccountRepoLocalImpl from "./source/Secondary Adapters/Persistence/AccountRepoLocalImpl";
import HomeViewController from "./source/Primary Adapters/Presentation/HomeViewController";
import { AccountRepoRNFirebase } from "./source/Secondary Adapters/Persistence/AccountRepoRNFirebase";
import AppViewModel, {
    Screen
} from "./source/Primary Adapters/Presentation/AppViewModel";
import AppPresenter from "./source/Primary Adapters/Presentation/AppPresenter";
import SessionService from "./source/Core/Application/SessionService";
import { AppStateController } from "./source/Primary Adapters/Device/AppStateController";
import AddMuTagViewController from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagViewController";
import { Rssi } from "./source (restructure)/shared/metaLanguage/Types";
import Percent from "./source (restructure)/shared/metaLanguage/Percent";
import { MuTagDevicesRNBLEPLX } from "./source (restructure)/shared/muTagDevices/MuTagDevicesRNBLEPLX";
import AddMuTagInteractor from "./source (restructure)/useCases/addMuTag/AddMuTagInteractor";
import { HomeViewModel } from "./source/Primary Adapters/Presentation/HomeViewModel";
import AddMuTagPresenter from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagPresenter";
import { AddMuTagViewModel } from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagViewModel";
import MuTagRepoLocalImpl from "./source/Secondary Adapters/Persistence/MuTagRepoLocalImpl";
import { MuTagRepoRNFirebase } from "./source/Secondary Adapters/Persistence/MuTagRepoRNFirebase";
import NameMuTagViewController from "./source/Primary Adapters/Presentation/NameMuTagViewController";
import { NameMuTagViewModel } from "./source/Primary Adapters/Presentation/NameMuTagViewModel";
import { MuTagAddingViewModel } from "./source/Primary Adapters/Presentation/MuTagAddingViewModel";
import MuTagAddingViewController from "./source/Primary Adapters/Presentation/MuTagAddingViewController";
import LogoutService from "./source/Core/Application/LogoutService";
import LogoutPresenter from "./source/Primary Adapters/Presentation/LogoutPresenter";
import BelongingDashboardService from "./source/Core/Application/BelongingDashboardService";
import BelongingDashboardPresenter from "./source/Primary Adapters/Presentation/BelongingDashboardPresenter";
import BelongingDetectionService from "./source/Core/Application/BelongingDetectionService";
import MuTagMonitorRNBM from "./source/Secondary Adapters/Infrastructure/MuTagMonitorRNBM";
import RemoveMuTagInteractor from "./source (restructure)/useCases/removeMuTag/RemoveMuTagInteractor";
import RemoveMuTagPresenter from "./source/Primary Adapters/Presentation/RemoveMuTagPresenter";
import DatabaseImplWatermelon from "./source/Secondary Adapters/Persistence/DatabaseImplWatermelon";
import { LoginViewModel } from "./source/Primary Adapters/Presentation/LoginViewModel";
import LoginPresenter from "./source/Primary Adapters/Presentation/LoginPresenter";
import { LoginService } from "./source/Core/Application/LoginService";
import AccountRegistrationService from "./source/Core/Application/AccountRegistrationService";
import NewAccountFactoryImpl from "./source/Core/Domain/NewAccountFactoryImpl";

// These dependencies should never be reset because the RN App Component depends
// on them never changing.
//
const appViewModel = new AppViewModel();
const sessionPresenter = new AppPresenter(appViewModel);

export class Dependencies {
    webClientID: string;
    authentication: AuthenticationFirebase;
    database: DatabaseImplWatermelon;
    accountRepoLocal: AccountRepoLocalImpl;
    accountRepoRemote: AccountRepoRNFirebase;
    muTagRepoLocal: MuTagRepoLocalImpl;
    muTagRepoRemote: MuTagRepoRNFirebase;
    connectThreshold: Rssi;
    addMuTagBatteryThreshold: Percent;
    homeViewModel: HomeViewModel;
    addMuTagViewModel: AddMuTagViewModel;
    nameMuTagViewModel: NameMuTagViewModel;
    muTagAddingViewModel: MuTagAddingViewModel;
    addMuTagPresenter: AddMuTagPresenter;
    muTagDevices: MuTagDevicesRNBLEPLX;
    addMuTagService: AddMuTagInteractor;
    removeMuTagBatteryThreshold: Percent;
    removeMuTagPresenter: RemoveMuTagPresenter;
    removeMuTagService: RemoveMuTagInteractor;
    logoutPresenter: LogoutPresenter;
    logoutService: LogoutService;
    belongingDashboardPresenter: BelongingDashboardPresenter;
    belongingDashboardService: BelongingDashboardService;
    muTagMonitor: MuTagMonitorRNBM;
    belongingDetectionService: BelongingDetectionService;
    sessionService: SessionService;
    loginViewModel: LoginViewModel;
    loginPresenter: LoginPresenter;
    newAccountFactory: NewAccountFactoryImpl;
    accountRegistrationService: AccountRegistrationService;
    loginService: LoginService;
    appStateController: AppStateController;

    constructor(webClientID: string) {
        this.webClientID = webClientID;
        this.authentication = new AuthenticationFirebase(webClientID);
        this.database = new DatabaseImplWatermelon();
        this.accountRepoLocal = new AccountRepoLocalImpl(this.database);
        this.accountRepoRemote = new AccountRepoRNFirebase();
        this.muTagRepoLocal = new MuTagRepoLocalImpl(
            this.database,
            this.accountRepoLocal
        );
        this.muTagRepoRemote = new MuTagRepoRNFirebase();
        this.connectThreshold = -80 as Rssi;
        this.addMuTagBatteryThreshold = new Percent(20);
        this.homeViewModel = new HomeViewModel();
        this.addMuTagViewModel = new AddMuTagViewModel();
        this.nameMuTagViewModel = new NameMuTagViewModel();
        this.muTagAddingViewModel = new MuTagAddingViewModel();
        this.addMuTagPresenter = new AddMuTagPresenter(
            this.homeViewModel,
            this.addMuTagViewModel,
            this.nameMuTagViewModel,
            this.muTagAddingViewModel
        );
        this.muTagDevices = new MuTagDevicesRNBLEPLX();
        this.addMuTagService = new AddMuTagInteractor(
            this.connectThreshold,
            this.addMuTagBatteryThreshold,
            this.addMuTagPresenter,
            this.muTagDevices,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.accountRepoLocal,
            this.accountRepoRemote
        );
        this.removeMuTagBatteryThreshold = new Percent(20);
        this.removeMuTagPresenter = new RemoveMuTagPresenter(
            this.homeViewModel
        );
        this.removeMuTagService = new RemoveMuTagInteractor(
            this.removeMuTagBatteryThreshold,
            this.muTagDevices,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.removeMuTagPresenter
        );
        this.belongingDashboardPresenter = new BelongingDashboardPresenter(
            this.homeViewModel
        );
        this.belongingDashboardService = new BelongingDashboardService(
            this.belongingDashboardPresenter,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.muTagMonitor = new MuTagMonitorRNBM();
        this.belongingDetectionService = new BelongingDetectionService(
            this.muTagMonitor,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.logoutPresenter = new LogoutPresenter(this.homeViewModel);
        this.logoutService = new LogoutService(
            this.logoutPresenter,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.database,
            this.belongingDetectionService
        );
        this.logoutService.onResetAllDependencies((): void => this.resetAll());
        this.sessionService = new SessionService(
            sessionPresenter,
            this.authentication,
            this.accountRepoLocal,
            this.belongingDetectionService
        );
        this.loginViewModel = new LoginViewModel();
        this.loginPresenter = new LoginPresenter(this.loginViewModel);
        this.newAccountFactory = new NewAccountFactoryImpl();
        this.accountRegistrationService = new AccountRegistrationService(
            this.newAccountFactory,
            this.accountRepoRemote,
            this.accountRepoLocal
        );
        this.loginService = new LoginService(
            this.loginPresenter,
            this.authentication,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.sessionService,
            this.accountRegistrationService
        );
        this.appStateController = new AppStateController(this.sessionService);
    }

    private resetAll(): void {
        this.authentication = new AuthenticationFirebase(this.webClientID);
        this.database = new DatabaseImplWatermelon();
        this.accountRepoLocal = new AccountRepoLocalImpl(this.database);
        this.accountRepoRemote = new AccountRepoRNFirebase();
        this.muTagRepoLocal = new MuTagRepoLocalImpl(
            this.database,
            this.accountRepoLocal
        );
        this.muTagRepoRemote = new MuTagRepoRNFirebase();
        this.connectThreshold = -80 as Rssi;
        this.addMuTagBatteryThreshold = new Percent(20);
        this.homeViewModel = new HomeViewModel();
        this.addMuTagViewModel = new AddMuTagViewModel();
        this.nameMuTagViewModel = new NameMuTagViewModel();
        this.muTagAddingViewModel = new MuTagAddingViewModel();
        this.addMuTagPresenter = new AddMuTagPresenter(
            this.homeViewModel,
            this.addMuTagViewModel,
            this.nameMuTagViewModel,
            this.muTagAddingViewModel
        );
        this.muTagDevices = new MuTagDevicesRNBLEPLX();
        this.addMuTagService = new AddMuTagInteractor(
            this.connectThreshold,
            this.addMuTagBatteryThreshold,
            this.addMuTagPresenter,
            this.muTagDevices,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.accountRepoLocal,
            this.accountRepoRemote
        );
        this.removeMuTagBatteryThreshold = new Percent(20);
        this.removeMuTagPresenter = new RemoveMuTagPresenter(
            this.homeViewModel
        );
        this.removeMuTagService = new RemoveMuTagInteractor(
            this.removeMuTagBatteryThreshold,
            this.muTagDevices,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.removeMuTagPresenter
        );
        this.belongingDashboardPresenter = new BelongingDashboardPresenter(
            this.homeViewModel
        );
        this.belongingDashboardService = new BelongingDashboardService(
            this.belongingDashboardPresenter,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.muTagMonitor = new MuTagMonitorRNBM();
        this.belongingDetectionService = new BelongingDetectionService(
            this.muTagMonitor,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.logoutPresenter = new LogoutPresenter(this.homeViewModel);
        this.logoutService.onResetAllDependencies(undefined);
        this.logoutService = new LogoutService(
            this.logoutPresenter,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.database,
            this.belongingDetectionService
        );
        this.logoutService.onResetAllDependencies((): void => this.resetAll());
        this.sessionService = new SessionService(
            sessionPresenter,
            this.authentication,
            this.accountRepoLocal,
            this.belongingDetectionService
        );
        this.loginViewModel = new LoginViewModel();
        this.loginPresenter = new LoginPresenter(this.loginViewModel);
        this.newAccountFactory = new NewAccountFactoryImpl();
        this.accountRegistrationService = new AccountRegistrationService(
            this.newAccountFactory,
            this.accountRepoRemote,
            this.accountRepoLocal
        );
        this.loginService = new LoginService(
            this.loginPresenter,
            this.authentication,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.sessionService,
            this.accountRegistrationService
        );
        this.appStateController.destructor();
        this.appStateController = new AppStateController(this.sessionService);
    }
}

function assertNotNullOrUndefined(value: unknown): asserts value {
    if (value == null) {
        const error = new Error("value is undefined");
        console.error(error.message);
        throw error;
    }
}

const webClientID = process.env.GOOGLE_WEB_CLIENT_ID;
assertNotNullOrUndefined(webClientID);
const dependencies = new Dependencies(webClientID);

const AppStack = createStackNavigator(
    {
        Home: {
            screen: (props: NavigationScreenProps): Element => (
                <HomeViewController
                    homeViewModel={dependencies.homeViewModel}
                    belongingDashboardService={
                        dependencies.belongingDashboardService
                    }
                    logoutService={dependencies.logoutService}
                    addMuTagService={dependencies.addMuTagService}
                    removeMuTagService={dependencies.removeMuTagService}
                    {...props}
                />
            )
        },
        AddMuTag: {
            screen: (props: NavigationScreenProps): Element => (
                <AddMuTagViewController
                    viewModel={dependencies.addMuTagViewModel}
                    addMuTagService={dependencies.addMuTagService}
                    {...props}
                />
            )
        },
        NameMuTag: {
            screen: (props: NavigationScreenProps): Element => (
                <NameMuTagViewController
                    viewModel={dependencies.nameMuTagViewModel}
                    addMuTagService={dependencies.addMuTagService}
                    {...props}
                />
            )
        },
        MuTagAdding: {
            screen: (props: NavigationScreenProps): Element => (
                <MuTagAddingViewController
                    viewModel={dependencies.muTagAddingViewModel}
                    addMuTagService={dependencies.addMuTagService}
                    {...props}
                />
            )
        }
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);
const EntryStack = createStackNavigator(
    {
        Login: {
            screen: (props: NavigationScreenProps): Element => (
                <LoginViewController
                    viewModel={dependencies.loginViewModel}
                    loginService={dependencies.loginService}
                    {...props}
                />
            )
        }
    },
    {
        headerMode: "none"
    }
);

const AppNavigator = createSwitchNavigator(
    {
        LoadSession: LoadSessionViewController,
        App: AppStack,
        Entry: EntryStack
    },
    {
        initialRouteName: "LoadSession"
    }
);

const AppContainer = createAppContainer(AppNavigator);

const paperTheme = {
    ...DefaultTheme,
    roundness: Theme.BorderRadius,
    colors: {
        ...DefaultTheme.colors,
        primary: Theme.Color.PrimaryOrange,
        accent: Theme.Color.PrimaryBlue,
        background: Theme.Color.AlmostWhite,
        surface: "white",
        error: Theme.Color.Error,
        placeholder: Theme.Color.AlmostWhiteBorder
    }
};

const App: FunctionComponent = (): ReactElement => {
    let navigator: NavigationContainerComponent | null | undefined;

    const navigate = (routeName: string): void => {
        if (navigator != null) {
            navigator.dispatch(
                NavigationActions.navigate({ routeName: routeName })
            );
        }
    };

    useEffect((): (() => void) => {
        appViewModel.onNavigate((screen): void => {
            switch (screen) {
                case Screen.App:
                    navigate("App");
                    break;
                case Screen.Entry:
                    navigate("Entry");
                    break;
                case Screen.LoadSession:
                    navigate("LoadSession");
                    break;
            }
        });

        return (): void => {
            appViewModel.onNavigate(undefined);
        };
    });

    return (
        <PaperProvider theme={paperTheme}>
            <AppContainer
                ref={(navigationContainerComponent): void => {
                    navigator = navigationContainerComponent;
                }}
            />
        </PaperProvider>
    );
};

export default App;
