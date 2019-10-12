import { AddMuTagOutput } from '../../Core/Ports/AddMuTagOutput';
import { HomeViewModel } from './HomeViewModel';
import { AddMuTagViewModel } from './AddMuTagViewModel';
import { LowMuTagBattery } from '../../Core/Application/AddMuTagService';
import { NewMuTagNotFound, ProvisionMuTagFailed, BluetoothUnsupported } from '../../Core/Ports/MuTagDevices';
import { NameMuTagViewModel } from './NameMuTagViewModel';
import { MuTagAddingViewModel } from './MuTagAddingViewModel';

type CurrentViewModel
    = HomeViewModel | AddMuTagViewModel | NameMuTagViewModel | MuTagAddingViewModel;

export default class AddMuTagPresenter implements AddMuTagOutput {

    private readonly homeViewModel: HomeViewModel;
    private readonly addMuTagViewModel: AddMuTagViewModel;
    private readonly nameMuTagViewModel: NameMuTagViewModel;
    private readonly muTagAddingViewModel: MuTagAddingViewModel;
    private currentViewModel: CurrentViewModel;

    constructor(
        homeViewModel: HomeViewModel,
        addMuTagViewModel: AddMuTagViewModel,
        nameMuTagViewModel: NameMuTagViewModel,
        muTagAddingViewModel: MuTagAddingViewModel,
    ) {
        this.homeViewModel = homeViewModel;
        this.addMuTagViewModel = addMuTagViewModel;
        this.nameMuTagViewModel = nameMuTagViewModel;
        this.muTagAddingViewModel = muTagAddingViewModel;
        this.currentViewModel = homeViewModel;
    }

    showAddMuTagScreen(): void {
        this.homeViewModel.navigateToAddMuTag();
        this.currentViewModel = this.addMuTagViewModel;
    }

    showMuTagNamingScreen(): void {
        this.addMuTagViewModel.navigateToNameMuTag();
        this.currentViewModel = this.nameMuTagViewModel;
    }

    showMuTagConnectingScreen(): void {
        this.nameMuTagViewModel.navigateToMuTagAdding();
    }

    showMuTagFinalSetupScreen(): void {
        throw new Error('Method not implemented.');
    }

    showActivityIndicator(): void {
        if (this.currentViewModel instanceof NameMuTagViewModel) {
            this.currentViewModel.showActivityIndicator = true;
        }
    }

    showHomeScreen(): void {
        if (
            this.currentViewModel instanceof AddMuTagViewModel
            || this.currentViewModel instanceof NameMuTagViewModel
            || this.currentViewModel instanceof MuTagAddingViewModel
        ) {
            this.currentViewModel.navigateToHomeScreen();
            this.currentViewModel = this.homeViewModel;
        }

        this.nameMuTagViewModel.showActivityIndicator = false;
        this.nameMuTagViewModel.attachedToInput = '';
    }

    showLowBatteryError(error: LowMuTagBattery): void {
        throw new Error('Method not implemented.');
    }

    showFindNewMuTagError(error: NewMuTagNotFound): void {
        throw new Error('Method not implemented.');
    }

    showProvisionFailedError(error: ProvisionMuTagFailed): void {
        throw new Error('Method not implemented.');
    }

    showBluetoothUnsupportedError(error: BluetoothUnsupported): void {
        throw new Error('Method not implemented.');
    }
}
