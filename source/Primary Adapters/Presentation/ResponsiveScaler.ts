import { Dimensions } from "react-native";
import config from "./ResponsiveScalerConfig.json";
import Exception from "../../../source (restructure)/shared/metaLanguage/Exception";

const ExceptionType = ["SetupRequired"] as const;
type ExceptionType = typeof ExceptionType[number];

class ResponsiveScalerException<T extends ExceptionType> extends Exception<T> {
    static get SetupRequired(): ResponsiveScalerException<"SetupRequired"> {
        return new this(
            "SetupRequired",
            "Setup must run before ResponsiveScaler can be used.",
            "error",
            undefined,
            true
        );
    }
}

export default class ResponsiveScaler {
    private static instance: ResponsiveScaler;
    static get shared(): ResponsiveScaler {
        return this.instance || (this.instance = new this());
    }

    private standardReferenceDPWidth?: number;
    private smallReferenceDPWidth?: number;
    private readonly currentScreenDPWidth: number;

    private constructor() {
        /* We consider width to be the shortest screen dimension regardless of
         * device orientation. 'Dimensions.get('window').width' will return the
         * longest screen dimension if the device is in horizontal orientation.
         * Therefore we just need the smallest number out of width and height.
         */
        const { width, height } = Dimensions.get("window");
        this.currentScreenDPWidth = Math.min(width, height);
    }

    static setup(
        standardReferenceDPWidth: number,
        smallReferenceDPWidth?: number
    ): void {
        const Scaler = this.shared;
        Scaler.standardReferenceDPWidth = standardReferenceDPWidth;
        Scaler.smallReferenceDPWidth = smallReferenceDPWidth;
    }

    scale(standardValue: number, smallValue?: number): number {
        if (this.standardReferenceDPWidth == null) {
            throw ResponsiveScalerException.SetupRequired;
        }

        if (smallValue == null || this.smallReferenceDPWidth == null) {
            const ratio = standardValue / this.standardReferenceDPWidth;
            return Math.round(ratio * this.currentScreenDPWidth);
        }

        const isCurrentScreenMedium =
            this.standardReferenceDPWidth > this.currentScreenDPWidth;
        const smallScreen = this.smallReferenceDPWidth;
        const mediumScreen = isCurrentScreenMedium
            ? this.currentScreenDPWidth
            : this.standardReferenceDPWidth;
        const largeScreen = isCurrentScreenMedium
            ? this.standardReferenceDPWidth
            : this.currentScreenDPWidth;
        const x = mediumScreen - smallScreen;
        const y = standardValue - smallValue;
        const z = largeScreen - smallScreen;

        return Math.round((x * y) / z + smallValue);
    }
}

ResponsiveScaler.setup(
    config.standardReferenceDPWidth,
    config.smallReferenceDPWidth
);

export const Scale = (standardValue: number, smallValue?: number): number => {
    return ResponsiveScaler.shared.scale(standardValue, smallValue);
};
