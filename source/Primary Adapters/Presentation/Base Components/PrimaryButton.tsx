import React, { Component } from 'react';
import CustomButton from './CustomButton';
import Theme from '../Theme';
import { NativeSyntheticEvent, NativeTouchEvent } from 'react-native';

type PrimaryButtonProps = Readonly<{
    /**
     * Text to display inside the button
     */
    title: string;

    /**
     * Determines if the title is upper case
     */
    titleIsUpperCase?: boolean;

    /**
     * Handler to be called when the user taps the button
     */
    onPress: (ev: NativeSyntheticEvent<NativeTouchEvent>) => void;

    /**
     * If true; disable all interactions for this component.
     */
    disabled?: boolean;

    /**
     * If true, doesn't play system sound on touch (Android Only)
     **/
    touchSoundDisabled?: boolean;

    /**
     * TV preferred focus (see documentation for the View component).
     */
    hasTVPreferredFocus?: boolean;

    /**
     * TV next focus down (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusDown?: number;

    /**
     * TV next focus forward (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusForward?: number;

    /**
     * TV next focus left (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusLeft?: number;

    /**
     * TV next focus right (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusRight?: number;

    /**
     * TV next focus up (see documentation for the View component).
     *
     * @platform android
     */
    nextFocusUp?: number;

    /**
     * Text to display for blindness accessibility features
     */
    accessibilityLabel?: string;

    /**
     * Used to locate this view in end-to-end tests.
     */
    testID?: string;
}>;

export default class PrimaryButton extends Component<PrimaryButtonProps> {
    render(): Element {
        return (
            <CustomButton color={Theme.Color.PrimaryOrange} {...this.props} />
        );
    }
}
