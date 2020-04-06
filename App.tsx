import * as Sentry from "@sentry/react-native";
import packageJson from "./package.json";
const environment = __DEV__ ? "development" : "production";
Sentry.init({
    dsn: "https://db49541b961149e79b3d69dfc6b275d0@sentry.io/4182912",
    release: "ai.informu.mutag@" + packageJson.version,
    environment: environment
});
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
import AddMuTagInteractor from "./source (restructure)/useCases/addMuTag/AddMuTagInteractor";
import { HomeViewModel } from "./source/Primary Adapters/Presentation/HomeViewModel";
import AddMuTagPresenter from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagPresenter";
import { AddMuTagViewModel } from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagViewModel";
import MuTagRepoLocalImpl from "./source/Secondary Adapters/Persistence/MuTagRepoLocalImpl";
import { MuTagRepoRNFirebase } from "./source/Secondary Adapters/Persistence/MuTagRepoRNFirebase";
import NameMuTagViewController from "./source (restructure)/useCases/addMuTag/presentation/NameMuTagViewController";
import { NameMuTagViewModel } from "./source (restructure)/useCases/addMuTag/presentation/NameMuTagViewModel";
import { MuTagAddingViewModel } from "./source (restructure)/useCases/addMuTag/presentation/MuTagAddingViewModel";
import MuTagAddingViewController from "./source (restructure)/useCases/addMuTag/presentation/MuTagAddingViewController";
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
import MuTagDevices from "./source (restructure)/shared/muTagDevices/MuTagDevices";
//import BluetoothImplRnBleManager from "./source (restructure)/shared/muTagDevices/BluetoothImplRnBleManager";
import MuTagDevicesPortAddMuTag from "./source (restructure)/useCases/addMuTag/MuTagDevicesPort";
import MuTagDevicesPortRemoveMuTag from "./source (restructure)/useCases/removeMuTag/MuTagDevicesPort";
import Bluetooth from "./source (restructure)/shared/muTagDevices/Bluetooth";
import BluetoothImplRnBlePlx from "./source (restructure)/shared/muTagDevices/BluetoothImplRnBlePlx";
import Logger from "./source (restructure)/shared/metaLanguage/Logger";
import EventTracker, {
    EventTrackerImpl
} from "./source (restructure)/shared/metaLanguage/EventTracker";
import BelongingsLocationInteractor, {
    BelongingsLocation
} from "./source (restructure)/useCases/updateBelongingsLocation/BelongingsLocationInteractor";
import LocationMonitorPort from "./source (restructure)/useCases/updateBelongingsLocation/LocationMonitorPort";
import LocationMonitor, {
    Geocoder,
    GeoLocation
} from "./source (restructure)/useCases/updateBelongingsLocation/infrastructure/LocationMonitor";
import GeocoderImpl from "./source (restructure)/useCases/updateBelongingsLocation/infrastructure/GeocoderImpl";
import * as RNGeocoder from "react-native-geocoding";
import GeoLocationImpl from "./source (restructure)/useCases/updateBelongingsLocation/infrastructure/GeoLocationImpl";

// These dependencies should never be reset because the RN App Component depends
// on them never changing.
//
const appViewModel = new AppViewModel();
const sessionPresenter = new AppPresenter(appViewModel);

export class Dependencies {
    eventTracker: EventTracker;
    webClientId: string;
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
    bluetooth: Bluetooth;
    muTagDevices: MuTagDevicesPortAddMuTag & MuTagDevicesPortRemoveMuTag;
    addMuTagInteractor: AddMuTagInteractor;
    removeMuTagBatteryThreshold: Percent;
    removeMuTagPresenter: RemoveMuTagPresenter;
    removeMuTagInteractor: RemoveMuTagInteractor;
    logoutPresenter: LogoutPresenter;
    logoutService: LogoutService;
    belongingDashboardPresenter: BelongingDashboardPresenter;
    belongingDashboardService: BelongingDashboardService;
    muTagMonitor: MuTagMonitorRNBM;
    belongingDetectionService: BelongingDetectionService;
    geocodingApiKey: string;
    geocoderImpl: Geocoder;
    geoLocation: GeoLocation;
    locationMonitor: LocationMonitorPort;
    belongingsLocationInteractor: BelongingsLocation;
    sessionService: SessionService;
    loginViewModel: LoginViewModel;
    loginPresenter: LoginPresenter;
    newAccountFactory: NewAccountFactoryImpl;
    accountRegistrationService: AccountRegistrationService;
    loginService: LoginService;
    appStateController: AppStateController;

    constructor(webClientId: string, geocodingApiKey: string) {
        this.eventTracker = new EventTrackerImpl();
        Logger.createInstance(this.eventTracker);
        this.webClientId = webClientId;
        this.authentication = new AuthenticationFirebase(webClientId);
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
        this.bluetooth = new BluetoothImplRnBlePlx();
        this.muTagDevices = new MuTagDevices(this.bluetooth);
        this.addMuTagInteractor = new AddMuTagInteractor(
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
        this.removeMuTagInteractor = new RemoveMuTagInteractor(
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
        this.geocodingApiKey = geocodingApiKey;
        RNGeocoder.init(this.geocodingApiKey);
        this.geocoderImpl = new GeocoderImpl(RNGeocoder);
        this.geoLocation = new GeoLocationImpl();
        this.locationMonitor = new LocationMonitor(
            this.geocoderImpl,
            this.geoLocation
        );
        this.belongingsLocationInteractor = new BelongingsLocationInteractor(
            this.accountRepoLocal,
            this.locationMonitor,
            this.muTagRepoLocal
        );
        this.logoutPresenter = new LogoutPresenter(this.homeViewModel);
        this.loginViewModel = new LoginViewModel();
        this.loginPresenter = new LoginPresenter(this.loginViewModel);
        this.newAccountFactory = new NewAccountFactoryImpl();
        this.accountRegistrationService = new AccountRegistrationService(
            this.newAccountFactory,
            this.accountRepoRemote,
            this.accountRepoLocal
        );
        this.sessionService = new SessionService(
            this.eventTracker,
            sessionPresenter,
            this.loginPresenter,
            this.authentication,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.belongingDetectionService,
            this.belongingsLocationInteractor,
            this.database,
            this.accountRegistrationService
        );
        this.sessionService.resetAllDependencies.subscribe(
            undefined,
            undefined,
            () => this.resetAll()
        );
        this.logoutService = new LogoutService(
            this.logoutPresenter,
            this.sessionService
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
        this.authentication = new AuthenticationFirebase(this.webClientId);
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
        this.muTagDevices = new MuTagDevices(this.bluetooth);
        this.addMuTagInteractor = new AddMuTagInteractor(
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
        this.removeMuTagInteractor = new RemoveMuTagInteractor(
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
        this.belongingDetectionService.stop();
        this.belongingDetectionService = new BelongingDetectionService(
            this.muTagMonitor,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.geocoderImpl = new GeocoderImpl(RNGeocoder);
        this.geoLocation = new GeoLocationImpl();
        this.locationMonitor = new LocationMonitor(
            this.geocoderImpl,
            this.geoLocation
        );
        this.belongingsLocationInteractor = new BelongingsLocationInteractor(
            this.accountRepoLocal,
            this.locationMonitor,
            this.muTagRepoLocal
        );
        this.logoutPresenter = new LogoutPresenter(this.homeViewModel);
        this.newAccountFactory = new NewAccountFactoryImpl();
        this.accountRegistrationService = new AccountRegistrationService(
            this.newAccountFactory,
            this.accountRepoRemote,
            this.accountRepoLocal
        );
        // Should not reset loginViewModel because forced sign out message must
        // persist and be displayed after all dependencies have been reset.
        this.loginPresenter = new LoginPresenter(this.loginViewModel);
        this.sessionService = new SessionService(
            this.eventTracker,
            sessionPresenter,
            this.loginPresenter,
            this.authentication,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.belongingDetectionService,
            this.belongingsLocationInteractor,
            this.database,
            this.accountRegistrationService
        );
        this.sessionService.resetAllDependencies.subscribe(
            undefined,
            undefined,
            () => this.resetAll()
        );
        this.logoutService = new LogoutService(
            this.logoutPresenter,
            this.sessionService
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

const webClientId = process.env.GOOGLE_WEB_CLIENT_ID;
assertNotNullOrUndefined(webClientId);
const geocodingApiKey = process.env.GEOCODING_API_KEY;
assertNotNullOrUndefined(geocodingApiKey);
const dependencies = new Dependencies(webClientId, geocodingApiKey);

const AppStack = createStackNavigator(
    {
        Home: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <HomeViewController
                    homeViewModel={dependencies.homeViewModel}
                    belongingDashboardService={
                        dependencies.belongingDashboardService
                    }
                    logoutService={dependencies.logoutService}
                    addMuTagService={dependencies.addMuTagInteractor}
                    removeMuTagService={dependencies.removeMuTagInteractor}
                    {...props}
                />
            )
        },
        AddMuTag: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <AddMuTagViewController
                    viewModel={dependencies.addMuTagViewModel}
                    addMuTagService={dependencies.addMuTagInteractor}
                    {...props}
                />
            )
        },
        NameMuTag: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <NameMuTagViewController
                    viewModel={dependencies.nameMuTagViewModel}
                    addMuTagService={dependencies.addMuTagInteractor}
                    {...props}
                />
            )
        },
        MuTagAdding: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <MuTagAddingViewController
                    viewModel={dependencies.muTagAddingViewModel}
                    addMuTagService={dependencies.addMuTagInteractor}
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
            screen: (props: NavigationScreenProps): ReactElement => (
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
