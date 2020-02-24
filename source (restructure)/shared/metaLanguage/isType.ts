export enum RuntimeType {
    Undefined = "undefined",
    Object = "object",
    Boolean = "boolean",
    Number = "number",
    Bigint = "bigint",
    String = "string",
    Symbol = "symbol",
    Function = "function",
    StringArray = "stringArray"
}

export default function isType(value: any, type: RuntimeType): boolean {
    switch (type) {
        case RuntimeType.Undefined:
        case RuntimeType.Object:
        case RuntimeType.Boolean:
        case RuntimeType.Number:
        case RuntimeType.Bigint:
        case RuntimeType.String:
        case RuntimeType.Symbol:
        case RuntimeType.Function:
            return typeof value === type;
        case RuntimeType.StringArray:
            return (
                Array.isArray(value) &&
                value.every(
                    (item): boolean => typeof item === RuntimeType.String
                )
            );
    }
}
