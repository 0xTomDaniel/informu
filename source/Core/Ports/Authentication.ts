export interface Authentication {

    authenticateWithEmail(emailAddress: string, password: string): Promise<UserData>;
    isAuthenticatedAs(uid: string): boolean;
}

export interface UserData {

    uid: string;
    emailAddress: string;
}

export class InvalidCredentials extends Error {

    constructor() {
        super('Wrong email address or password. Please try again.');
        this.name = 'InvalidCredentials';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AccountDisabled extends Error {

    constructor() {
        super('This account is currently disabled. Please contact support@informu.io.');
        this.name = 'AccountDisabled';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class TooManyAttempts extends Error {

    constructor() {
        super('Too many unsuccessful login attempts. Please try again later.');
        this.name = 'TooManyAttempts';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type AuthenticationException
    = InvalidCredentials | AccountDisabled | TooManyAttempts;
