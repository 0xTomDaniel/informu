export class Account {

    uid: string;
    emailAddress: string;

    constructor(userData: AccountData) {
        this.uid = userData.uid;
        this.emailAddress = userData.emailAddress;
    }
}

export interface AccountData {

    uid: string;
    emailAddress: string;
}
