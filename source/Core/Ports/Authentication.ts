export interface Authentication {

    authenticateWithEmail(emailAddress: string, password: string): Promise<UserData>;
}

export interface UserData {

    uid: string;
    emailAddress: string;
}
