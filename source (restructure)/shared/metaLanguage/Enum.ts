export const isEnumMember = <T>(
    member: string,
    _enum: T
): member is Extract<keyof T, string> => member in _enum;

export const getEnumMember = <T>(
    name: string,
    _enum: T
): T[keyof T] | undefined =>
    isEnumMember(name, _enum) ? _enum[name] : undefined;
