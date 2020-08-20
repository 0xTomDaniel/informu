import * as RNLocalize from "react-native-localize";
import { getEnumMember } from "../metaLanguage/Enum";

const localizedTextJson: Record<
    keyof typeof LanguageTag,
    Record<string, unknown>
> = {
    "en-US": require("../../../assets/text/en-US.json"),
    "ja-JP": require("../../../assets/text/ja-JP.json")
};

export enum LanguageTag {
    "en-US",
    "ja-JP"
}
export enum TextKey {
    addMuTag_instructions_list1,
    addMuTag_instructions_list2,
    addMuTag_instructions_info,
    addMuTag_instructions_buttonContinue,
    addMuTag_naming_askNameTitle,
    addMuTag_naming_nameInputLabel,
    addMuTag_naming_buttonAdd,
    addMuTag_naming_buttonAdding
}
type LocalizedText = Record<keyof typeof TextKey, string>;

export default class Localize {
    private static _instance: Localize | undefined;
    static get instance(): Localize {
        return this._instance ?? (this._instance = new this());
    }

    private languageTag: LanguageTag;
    private localizedText: LocalizedText | undefined;

    private constructor() {
        this.languageTag =
            getEnumMember(
                RNLocalize.getLocales()[0].languageTag,
                LanguageTag
            ) ?? LanguageTag["en-US"];
    }

    getText(key: TextKey): string {
        if (this.localizedText == null) {
            const localizedText = Localize.getLocalizedText(this.languageTag);
            this.localizedText = localizedText;
        }
        const textKey = TextKey[key] as keyof typeof TextKey;
        return this.localizedText[textKey];
    }

    private static getLocalizedText(languageTag: LanguageTag): LocalizedText {
        const languageTagKey = LanguageTag[
            languageTag
        ] as keyof typeof LanguageTag;
        const localizedText = localizedTextJson[languageTagKey];
        this.assertIsLocalizedText(localizedText);
        return localizedText;
    }

    private static assertIsLocalizedText(
        json: Record<string, unknown>
    ): asserts json is LocalizedText {
        const textKeyMembers = Object.keys(TextKey).filter(key =>
            isNaN(Number(key))
        );
        for (const key of textKeyMembers) {
            if (!(key in json)) {
                throw new Error(`Expected JSON to contain key '${key}'.`);
            }
            if (typeof json[key] !== "string") {
                throw new Error(
                    `Expected JSON value for key '${key}' to be of type 'string'.`
                );
            }
        }
    }
}
