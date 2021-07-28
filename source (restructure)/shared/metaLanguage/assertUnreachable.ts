export default function assertUnreachable(_: never): never {
    throw new Error(`Unreachable switch case: ${String(_)}`);
}
