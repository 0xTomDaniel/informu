export function fatalError(message?: string): never {
    if (message) {
        throw Error(message);
    } else {
        throw Error('A fatal error has occurred.');
    }
}
