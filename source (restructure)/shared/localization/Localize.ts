import ReactNativeLocalize from "react-native-localize";
import * as D from "io-ts/lib/Decoder";
import { getEnumMember } from "../metaLanguage/Enum";
import { AddMuTagTextDecoder } from "../../useCases/addMuTag/presentation/Localization";
import { cast } from "../metaLanguage/cast";
import { RemoveMuTagTextDecoder } from "../../useCases/removeMuTag/presentation/Localization";
import { SignOutTextDecoder } from "../../useCases/signOut/presentation/Localization";
import { BelongingsLocationTextDecoder } from "../../useCases/updateBelongingsLocation/presentation/Localization";
import { ViewBelongingDashboardTextDecoder } from "../../useCases/viewBelongingDashboard/presentation/Localization";

const localizedTextJson: Record<keyof typeof LanguageTag, unknown> = {
    "en-US": require("../../../assets/text/en-US.json"),
    "ja-JP": require("../../../assets/text/ja-JP.json")
};
export enum LanguageTag {
    "en-US",
    "ja-JP"
}

// Cannot import TabBarTextDecoder from App.ts because Jest throws a weird
// error, "Cannot find module 'warnOnce'".
const TabBarTextDecoder = D.type({
    Screen: D.type({
        Home: D.string,
        Map: D.string
    })
});
const LocalizedTextDecoder = D.type({
    AddMuTag: AddMuTagTextDecoder,
    RemoveMuTag: RemoveMuTagTextDecoder,
    SignOut: SignOutTextDecoder,
    BelongingsLocation: BelongingsLocationTextDecoder,
    ViewBelongingDashboard: ViewBelongingDashboardTextDecoder,
    TabBar: TabBarTextDecoder
});
type LocalizedText = D.TypeOf<typeof LocalizedTextDecoder>;
export type RnLocalize = typeof ReactNativeLocalize;

export default class Localize {
    private static _instance: Localize | undefined;
    static get instance(): Localize {
        if (this._instance == null) {
            throw Error(
                "Localize instance does not exist. Please create it first."
            );
        }
        return this._instance;
    }

    static createInstance(rnLocalize: RnLocalize): void {
        if (this._instance != null) {
            throw Error("Localize instance already exists.");
        }
        this._instance = new this(rnLocalize);
    }

    private languageTag: LanguageTag;
    private localizedText: LocalizedText | undefined;
    private rnLocalize: RnLocalize;

    private constructor(rnLocalize: RnLocalize) {
        this.rnLocalize = rnLocalize;
        this.languageTag =
            getEnumMember(
                this.rnLocalize.getLocales()[0].languageTag,
                LanguageTag
            ) ?? LanguageTag["en-US"];
    }

    /*getText(a: string, b: string, c: string): string {
        return a + b + c;
    }*/

    getText<
        C extends keyof LocalizedText,
        S extends keyof LocalizedText[C],
        K extends keyof LocalizedText[C][S]
    >(component: C, section: S, key: K): LocalizedText[C][S][K] {
        if (this.localizedText == null) {
            const localizedText = Localize.getLocalizedText(this.languageTag);
            this.localizedText = localizedText;
        }
        return this.localizedText[component][section][key];
    }

    private static getLocalizedText(languageTag: LanguageTag): LocalizedText {
        const languageTagKey = LanguageTag[
            languageTag
        ] as keyof typeof LanguageTag;
        return cast(localizedTextJson[languageTagKey], LocalizedTextDecoder);
    }

    /*private static assertIsLocalizedText(
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
    }*/
}
