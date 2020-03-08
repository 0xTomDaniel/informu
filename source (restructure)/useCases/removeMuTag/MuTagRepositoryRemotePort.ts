export default interface MuTagRepositoryRemotePort {
    removeByUid(uid: string, accountUid: string): Promise<void>;
}
