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
import { createMaterialBottomTabNavigator } from "react-navigation-material-bottom-tabs";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import LoginViewController from "./source/Primary Adapters/Presentation/LoginViewController";
import LoadSessionViewController from "./source/Primary Adapters/Presentation/LoadSessionViewController";
import Theme from "./source/Primary Adapters/Presentation/Theme";
import { AuthenticationFirebase } from "./source/Secondary Adapters/Infrastructure/AuthenticationFirebase";
import AccountRepoLocalImpl from "./source/Secondary Adapters/Persistence/AccountRepoLocalImpl";
import BelongingDashboardView from "./source (restructure)/useCases/viewBelongingDashboard/presentation/BelongingDashboardView";
import { AccountRepoRNFirebase } from "./source/Secondary Adapters/Persistence/AccountRepoRNFirebase";
import AppViewModel, {
    Screen
} from "./source/Primary Adapters/Presentation/AppViewModel";
import AppPresenter from "./source/Primary Adapters/Presentation/AppPresenter";
import SessionService from "./source/Core/Application/SessionService";
import { AppStateController } from "./source/Primary Adapters/Device/AppStateController";
import { Rssi } from "./source (restructure)/shared/metaLanguage/Types";
import Percent from "./source (restructure)/shared/metaLanguage/Percent";
import { AddMuTagInteractorImpl } from "./source (restructure)/useCases/addMuTag/AddMuTagInteractor";
import AddMuTagViewModel from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagViewModel";
import MuTagRepoLocalImpl from "./source/Secondary Adapters/Persistence/MuTagRepoLocalImpl";
import { MuTagRepoRNFirebase } from "./source/Secondary Adapters/Persistence/MuTagRepoRNFirebase";
import BelongingDashboardInteractor, {
    BelongingDashboardInteractorImpl
} from "./source (restructure)/useCases/viewBelongingDashboard/BelongingDashboardInteractor";
import BelongingDetectionService from "./source/Core/Application/BelongingDetectionService";
import MuTagMonitorRnbm from "./source/Secondary Adapters/Infrastructure/MuTagMonitorRnbm";
import RemoveMuTagInteractor, {
    RemoveMuTagInteractorImpl
} from "./source (restructure)/useCases/removeMuTag/RemoveMuTagInteractor";
import DatabaseImplWatermelon from "./source/Secondary Adapters/Persistence/DatabaseImplWatermelon";
import { LoginViewModel } from "./source/Primary Adapters/Presentation/LoginViewModel";
import LoginPresenter from "./source/Primary Adapters/Presentation/LoginPresenter";
import { LoginService } from "./source/Core/Application/LoginService";
import AccountRegistrationService from "./source/Core/Application/AccountRegistrationService";
import NewAccountFactoryImpl from "./source/Core/Domain/NewAccountFactoryImpl";
import MuTagDevices from "./source (restructure)/shared/muTagDevices/MuTagDevices";
import BluetoothPort from "./source (restructure)/shared/bluetooth/BluetoothPort";
import Logger from "./source (restructure)/shared/metaLanguage/Logger";
import EventTracker, {
    EventTrackerImpl
} from "./source (restructure)/shared/metaLanguage/EventTracker";
import BelongingsLocationInteractor, {
    BelongingsLocation
} from "./source (restructure)/useCases/updateBelongingsLocation/BelongingsLocationInteractor";
import LocationMonitor, {
    Geocoder as LmGeocoder,
    Geolocation
} from "./source (restructure)/shared/geolocation/LocationMonitor";
import GeocoderImpl from "./source (restructure)/shared/geolocation/GeocoderImpl";
import Geocoder from "react-native-geocoding";
import GeolocationImpl from "./source (restructure)/shared/geolocation/GeolocationImpl";
import BelongingMapView from "./source (restructure)/useCases/viewBelongingMap/presentation/BelongingMapView";
import BelongingMapViewModel from "./source (restructure)/useCases/viewBelongingMap/presentation/BelongingMapViewModel";
import BelongingMapInteractor, {
    BelongingMapInteractorImpl
} from "./source (restructure)/useCases/viewBelongingMap/BelongingMapInteractor";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AdjustGeolocationInteractor from "./source (restructure)/useCases/adjustGeolocation/AdjustGeolocationInteractor";
import AppStateMonitor from "./source (restructure)/shared/appState/AppStateMonitor";
import BelongingDashboardViewModel from "./source (restructure)/useCases/viewBelongingDashboard/presentation/BelongingDashboardViewModel";
import SignOutInteractor, {
    SignOutInteractorImpl
} from "./source (restructure)/useCases/signOut/SignOutInteractor";
import MuTagBatteriesInteractor, {
    MuTagBatteriesInteractorImpl
} from "./source (restructure)/useCases/updateMuTagBatteries/MuTagBatteriesInteractor";
import BackgroundTask from "./source (restructure)/useCases/updateMuTagBatteries/device/BackgroundTask";
import BackgroundFetchProxyImpl from "./source (restructure)/useCases/updateMuTagBatteries/device/BackgroundFetchProxy";
import { Platform } from "react-native";
import BluetoothAndroidDecorator from "./source (restructure)/shared/bluetooth/BluetoothAndroidDecorator";
import ReactNativeBlePlxAdapter from "./source (restructure)/shared/bluetooth/ReactNativeBlePlxAdapter";
import { BleManager, fullUUID } from "react-native-ble-plx";
import MuTagDevicesPort from "./source (restructure)/shared/muTagDevices/MuTagDevicesPort";
import AddMuTagInteractor from "./source (restructure)/useCases/addMuTag/AddMuTagInteractor";
import ReactNavigationAdapter from "./source (restructure)/shared/navigation/ReactNavigationAdapter";
import FindAddMuTagView from "./source (restructure)/useCases/addMuTag/presentation/FindAddMuTagView";
import AddMuTagIntroView from "./source (restructure)/useCases/addMuTag/presentation/AddMuTagIntroView";
import NameMuTagView from "./source (restructure)/useCases/addMuTag/presentation/NameMuTagView";

// DEBUG
/*import MessageQueue from "react-native/Libraries/BatchedBridge/MessageQueue.js";

const spyFunction = (msg: unknown) => {
    if (
        msg.module === "66" ||
        msg.module === "54" ||
        msg.module === "UIManager" ||
        msg.module === "Timing" ||
        msg.module === "JSTimers" ||
        msg.module === "RCTEventEmitter"
    ) {
        return;
    }
    console.log(msg);
};

MessageQueue.spy(spyFunction);*/
// END DEBUG

// These dependencies should never be reset because the RN App Component depends
// on them never changing.
//
const appViewModel = new AppViewModel();
const sessionPresenter = new AppPresenter(appViewModel);

const otherRoutes = ["Home"] as const;
const routes = [...AddMuTagViewModel.routes, ...otherRoutes];
const navigationAdapter = new ReactNavigationAdapter(routes);

export class Dependencies {
    eventTracker: EventTracker;
    webClientId: string;
    authentication: AuthenticationFirebase;
    database: DatabaseImplWatermelon;
    accountRepoLocal: AccountRepoLocalImpl;
    accountRepoRemote: AccountRepoRNFirebase;
    muTagRepoLocal: MuTagRepoLocalImpl;
    muTagRepoRemote: MuTagRepoRNFirebase;
    belongingMapInteractor: BelongingMapInteractor;
    belongingMapViewModel: BelongingMapViewModel;
    connectThreshold: Rssi;
    addMuTagBatteryThreshold: Percent;
    belongingDashboardViewModel: BelongingDashboardViewModel;
    addMuTagViewModel: AddMuTagViewModel;
    bluetooth: BluetoothPort;
    muTagDevices: MuTagDevicesPort;
    addMuTagInteractor: AddMuTagInteractor;
    removeMuTagBatteryThreshold: Percent;
    removeMuTagInteractor: RemoveMuTagInteractor;
    signOutInteractor: SignOutInteractor;
    belongingDashboardInteractor: BelongingDashboardInteractor;
    muTagMonitor: MuTagMonitorRnbm;
    belongingDetectionService: BelongingDetectionService;
    geocodingApiKey: string;
    geocoderImpl: LmGeocoder;
    geoLocation: Geolocation;
    locationMonitor: LocationMonitor;
    belongingsLocationInteractor: BelongingsLocation;
    appStateMonitor: AppStateMonitor;
    adjustGeolocationInteractor: AdjustGeolocationInteractor;
    //adjustGeolocationInteractorDebug: AdjustGeolocationInteractorDebug;
    backgroundFetchProxy: BackgroundFetchProxyImpl;
    backgroundTask: BackgroundTask;
    muTagBatteriesInteractor: MuTagBatteriesInteractor;
    sessionService: SessionService;
    loginViewModel: LoginViewModel;
    loginPresenter: LoginPresenter;
    newAccountFactory: NewAccountFactoryImpl;
    accountRegistrationService: AccountRegistrationService;
    loginService: LoginService;
    appStateController: AppStateController;

    constructor(webClientId: string, geocodingApiKey: string) {
        this.eventTracker = new EventTrackerImpl();
        try {
            Logger.createInstance(this.eventTracker);
        } catch (e) {
            Logger.instance.warn(e);
        }
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
        this.belongingMapInteractor = new BelongingMapInteractorImpl(
            this.accountRepoLocal,
            this.muTagRepoLocal
        );
        this.belongingMapViewModel = new BelongingMapViewModel(
            this.belongingMapInteractor
        );
        const bluetooth = new ReactNativeBlePlxAdapter(
            new BleManager(),
            fullUUID,
            Platform
        );
        switch (Platform.OS) {
            case "android":
                this.bluetooth = new BluetoothAndroidDecorator(bluetooth);
                break;
            default:
                this.bluetooth = bluetooth;
        }
        this.connectThreshold = -80 as Rssi;
        this.addMuTagBatteryThreshold = new Percent(20);
        this.muTagDevices = new MuTagDevices(this.bluetooth);
        this.addMuTagInteractor = new AddMuTagInteractorImpl(
            this.connectThreshold,
            this.addMuTagBatteryThreshold,
            this.muTagDevices,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.accountRepoLocal,
            this.accountRepoRemote
        );
        this.addMuTagViewModel = new AddMuTagViewModel(
            navigationAdapter,
            this.addMuTagInteractor
        );
        this.removeMuTagBatteryThreshold = new Percent(20);
        this.removeMuTagInteractor = new RemoveMuTagInteractorImpl(
            this.removeMuTagBatteryThreshold,
            this.muTagDevices,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote
        );
        this.muTagMonitor = new MuTagMonitorRnbm();
        this.belongingDetectionService = new BelongingDetectionService(
            this.muTagMonitor,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.geocodingApiKey = geocodingApiKey;
        Geocoder.init(this.geocodingApiKey);
        this.geocoderImpl = new GeocoderImpl(Geocoder);
        this.geoLocation = new GeolocationImpl();
        this.locationMonitor = new LocationMonitor(
            this.geocoderImpl,
            this.geoLocation
        );
        this.belongingsLocationInteractor = new BelongingsLocationInteractor(
            this.accountRepoLocal,
            this.locationMonitor,
            this.muTagRepoLocal
        );
        this.appStateMonitor = new AppStateMonitor();
        this.adjustGeolocationInteractor = new AdjustGeolocationInteractor(
            this.appStateMonitor,
            this.locationMonitor
        );
        /*this.adjustGeolocationInteractorDebug = new AdjustGeolocationInteractorDebug(
            this.locationMonitor
        );*/
        this.loginViewModel = new LoginViewModel();
        this.loginPresenter = new LoginPresenter(this.loginViewModel);
        this.newAccountFactory = new NewAccountFactoryImpl();
        this.accountRegistrationService = new AccountRegistrationService(
            this.newAccountFactory,
            this.accountRepoRemote,
            this.accountRepoLocal
        );
        this.backgroundFetchProxy = BackgroundFetchProxyImpl.instance;
        this.backgroundTask = new BackgroundTask(this.backgroundFetchProxy);
        this.muTagBatteriesInteractor = new MuTagBatteriesInteractorImpl(
            this.accountRepoLocal,
            this.backgroundTask,
            this.muTagDevices,
            this.muTagRepoLocal
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
            this.accountRegistrationService,
            this.muTagBatteriesInteractor
        );
        this.sessionService.resetAllDependencies.subscribe(
            undefined,
            undefined,
            () => this.resetAll()
        );
        this.signOutInteractor = new SignOutInteractorImpl(this.sessionService);
        this.belongingDashboardInteractor = new BelongingDashboardInteractorImpl(
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.belongingDashboardViewModel = new BelongingDashboardViewModel(
            this.belongingDashboardInteractor,
            this.removeMuTagInteractor,
            this.signOutInteractor
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
        this.belongingMapInteractor = new BelongingMapInteractorImpl(
            this.accountRepoLocal,
            this.muTagRepoLocal
        );
        this.belongingMapViewModel = new BelongingMapViewModel(
            this.belongingMapInteractor
        );
        this.connectThreshold = -80 as Rssi;
        this.addMuTagBatteryThreshold = new Percent(20);
        this.muTagDevices = new MuTagDevices(this.bluetooth);
        this.addMuTagInteractor = new AddMuTagInteractorImpl(
            this.connectThreshold,
            this.addMuTagBatteryThreshold,
            this.muTagDevices,
            this.muTagRepoLocal,
            this.muTagRepoRemote,
            this.accountRepoLocal,
            this.accountRepoRemote
        );
        this.addMuTagViewModel = new AddMuTagViewModel(
            navigationAdapter,
            this.addMuTagInteractor
        );
        this.removeMuTagBatteryThreshold = new Percent(20);
        this.removeMuTagInteractor = new RemoveMuTagInteractorImpl(
            this.removeMuTagBatteryThreshold,
            this.muTagDevices,
            this.accountRepoLocal,
            this.accountRepoRemote,
            this.muTagRepoLocal,
            this.muTagRepoRemote
        );
        this.muTagMonitor = new MuTagMonitorRnbm();
        this.belongingDetectionService = new BelongingDetectionService(
            this.muTagMonitor,
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        // Should not call Geocoder.init again
        this.geocoderImpl = new GeocoderImpl(Geocoder);
        this.geoLocation = new GeolocationImpl();
        this.locationMonitor = new LocationMonitor(
            this.geocoderImpl,
            this.geoLocation
        );
        this.belongingsLocationInteractor = new BelongingsLocationInteractor(
            this.accountRepoLocal,
            this.locationMonitor,
            this.muTagRepoLocal
        );
        this.appStateMonitor = new AppStateMonitor();
        this.adjustGeolocationInteractor = new AdjustGeolocationInteractor(
            this.appStateMonitor,
            this.locationMonitor
        );
        /*this.adjustGeolocationInteractorDebug = new AdjustGeolocationInteractorDebug(
            this.locationMonitor
        );*/
        // Should not reset loginViewModel because forced sign out message must
        // persist and be displayed after all dependencies have been reset.
        this.loginPresenter = new LoginPresenter(this.loginViewModel);
        this.newAccountFactory = new NewAccountFactoryImpl();
        this.accountRegistrationService = new AccountRegistrationService(
            this.newAccountFactory,
            this.accountRepoRemote,
            this.accountRepoLocal
        );
        // BackgroundFetchProxyImpl instance is a singleton that doesn't need to
        // be instantiated again.
        this.backgroundTask = new BackgroundTask(this.backgroundFetchProxy);
        this.muTagBatteriesInteractor = new MuTagBatteriesInteractorImpl(
            this.accountRepoLocal,
            this.backgroundTask,
            this.muTagDevices,
            this.muTagRepoLocal
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
            this.accountRegistrationService,
            this.muTagBatteriesInteractor
        );
        this.sessionService.resetAllDependencies.subscribe(
            undefined,
            undefined,
            () => this.resetAll()
        );
        this.signOutInteractor = new SignOutInteractorImpl(this.sessionService);
        this.belongingDashboardInteractor = new BelongingDashboardInteractorImpl(
            this.muTagRepoLocal,
            this.accountRepoLocal
        );
        this.belongingDashboardViewModel = new BelongingDashboardViewModel(
            this.belongingDashboardInteractor,
            this.removeMuTagInteractor,
            this.signOutInteractor
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
const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;
assertNotNullOrUndefined(mapboxAccessToken);
const dependencies = new Dependencies(webClientId, geocodingApiKey);

const HomeStack = createStackNavigator(
    {
        [navigationAdapter.routes.Home]: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <BelongingDashboardView
                    belongingDashboardViewModel={
                        dependencies.belongingDashboardViewModel
                    }
                    {...props}
                />
            )
        },
        [navigationAdapter.routes.AddMuTagIntro]: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <AddMuTagIntroView
                    viewModel={dependencies.addMuTagViewModel}
                    {...props}
                />
            )
        },
        [navigationAdapter.routes.FindAddMuTag]: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <FindAddMuTagView
                    viewModel={dependencies.addMuTagViewModel}
                    {...props}
                />
            )
        },
        [navigationAdapter.routes.NameMuTag]: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <NameMuTagView
                    viewModel={dependencies.addMuTagViewModel}
                    {...props}
                />
            )
        }
    },
    {
        defaultNavigationOptions: {
            header: null
        },
        navigationOptions: ({ navigation }) => ({
            tabBarIcon: ({ tintColor, focused }): ReactElement => (
                <Icon
                    name="view-dashboard"
                    size={24}
                    color={
                        focused
                            ? Theme.Color.SecondaryBlue
                            : tintColor ?? undefined
                    }
                />
            ),
            tabBarVisible: navigation.state.index === 0
        })
    }
);

const MapStack = createStackNavigator(
    {
        Map: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <BelongingMapView
                    belongingMapViewModel={dependencies.belongingMapViewModel}
                    mapboxAccessToken={mapboxAccessToken}
                    {...props}
                />
            )
        }
    },
    {
        defaultNavigationOptions: {
            header: null
        },
        navigationOptions: {
            tabBarIcon: ({ tintColor, focused }): ReactElement => (
                <Icon
                    name="map-marker-radius"
                    size={24}
                    color={
                        focused
                            ? Theme.Color.SecondaryBlue
                            : tintColor ?? undefined
                    }
                />
            )
        }
    }
);

/*const DebugStack = createStackNavigator(
    {
        Debug: {
            screen: (props: NavigationScreenProps): ReactElement => (
                <AdjustGeolocationViewDebug
                    adjustGeolocationInteractorDebug={
                        dependencies.adjustGeolocationInteractorDebug
                    }
                    {...props}
                />
            )
        }
    },
    {
        defaultNavigationOptions: {
            header: null
        },
        navigationOptions: {
            tabBarIcon: ({ tintColor, focused }): ReactElement => (
                <Icon
                    name="bug"
                    size={24}
                    color={
                        focused
                            ? Theme.Color.SecondaryBlue
                            : tintColor ?? undefined
                    }
                />
            )
        }
    }
);*/

const AppStack = createMaterialBottomTabNavigator(
    {
        Home: { screen: HomeStack },
        Map: { screen: MapStack }
        //Debug: { screen: DebugStack }
    },
    {
        defaultNavigationOptions: {
            header: null
        },
        initialRouteName: "Home",
        activeColor: Theme.Color.PrimaryBlue,
        shifting: true,
        barStyle: { backgroundColor: "white" }
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
                ref={nvgtr => {
                    if (nvgtr != null) {
                        navigator = nvgtr;
                        navigationAdapter.setNavigator(nvgtr);
                    }
                }}
            />
        </PaperProvider>
    );
};

export default App;
