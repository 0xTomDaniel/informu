import { AccountRepositoryLocalException } from './AccountRepositoryLocal';

export interface LoginOutput {

    showHomeScreen(): void;
    showLoginError(error: Error): void;
}
