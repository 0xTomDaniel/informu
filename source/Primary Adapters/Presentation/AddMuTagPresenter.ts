import { AddMuTagOutput } from '../../Core/Ports/AddMuTagOutput';
import { HomeViewModel } from './HomeViewModel';
import { AddMuTagViewModel } from './AddMuTagViewModel';
import { LowMuTagBattery } from '../../Core/Application/AddMuTagService';
import { NewMuTagNotFound, ProvisionMuTagFailed, BluetoothUnsupported } from '../../Core/Ports/MuTagDevices';

export default class AddMuTagPresenter implements AddMuTagOutput {

    private readonly homeViewModel: HomeViewModel;
    private readonly addMuTagViewModel: AddMuTagViewModel;

    constructor(
        homeViewModel: HomeViewModel,
        addMuTagViewModel: AddMuTagViewModel,
    ) {
        this.homeViewModel = homeViewModel;
        this.addMuTagViewModel = addMuTagViewModel;
    }

    showAddMuTagScreen(): void {
        this.homeViewModel.navigateToAddMuTag();
    }

    showMuTagNamingScreen(): void {
        throw new Error('Method not implemented.');
    }

    showMuTagConnectingScreen(): void {
        throw new Error('Method not implemented.');
    }

    showMuTagFinalSetupScreen(): void {
        throw new Error('Method not implemented.');
    }

    showActivityIndicator(): void {
        throw new Error('Method not implemented.');
    }

    showHomeScreen(): void {
        throw new Error('Method not implemented.');
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
