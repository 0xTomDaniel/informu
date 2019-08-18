import React, { Component, ReactType } from 'react';
import { StyleSheet, Platform, TouchableNativeFeedback, TouchableOpacity, View, Text, NativeSyntheticEvent, NativeTouchEvent } from 'react-native';
import Theme from '../Theme';

const styles = StyleSheet.create({
    button: {
        // Material design blue from https://material.google.com/style/color.html#color-color-palette
        backgroundColor: '#2196F3',
        borderRadius: Theme.BorderRadius,
        marginVertical: 8,
        minHeight: 36,
        minWidth: 64,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.8,
                shadowRadius: 1,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    text: {
        textAlign: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#dfdfdf',
        ...Platform.select({
            ios: {},
            android: {
                elevation: 0,
            },
        }),
    },
    textDisabled: {
        color: '#cdcdcd',
    },
});

export enum ButtonType {
    Contained,
    Outlined,
    TextOnly,
}

type ButtonProps = Readonly<{
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
     * Color of the text or background color of the button according to button
     * type.
     */
    color?: string;

    /**
     * Determines the button is a contained, outlined, or text style
     */
    type?: ButtonType;

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

export default class CustomButton extends Component<ButtonProps> {
    render(): Element {
        const {
            accessibilityLabel,
            color,
            onPress,
            touchSoundDisabled,
            title,
            titleIsUpperCase,
            type,
            hasTVPreferredFocus,
            nextFocusDown,
            nextFocusForward,
            nextFocusLeft,
            nextFocusRight,
            nextFocusUp,
            disabled,
            testID,
        } = this.props;

        const buttonStyles: object[] = [styles.button];
        const textStyles: object[] = [styles.text];

        switch (type) {
            case undefined:
            case ButtonType.Contained:
                if (color != null) {
                    buttonStyles.push({ backgroundColor: color });
                }

                break;
            case ButtonType.Outlined:
                if (color != null) {
                    buttonStyles.push({
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: color,
                        ...Platform.select({
                            ios: {},
                            android: {
                                elevation: 0,
                            },
                        }),
                    });

                    textStyles.push({ color: color });
                }

                break;
            case ButtonType.TextOnly:
                if (color != null) {
                    buttonStyles.push({
                        backgroundColor: 'transparent',
                        ...Platform.select({
                            ios: {},
                            android: {
                                elevation: 0,
                            },
                        }),
                    });

                    textStyles.push({ color: color });
                }

                break;
        }

        const accessibilityStates = [];

        if (disabled) {
            buttonStyles.push(styles.buttonDisabled);
            textStyles.push(styles.textDisabled);
            accessibilityStates.push('disabled');
        }

        const formattedTitle = (titleIsUpperCase != null && !titleIsUpperCase)
            ? title : title.toUpperCase();
        const Touchable: ReactType = Platform.OS === 'android'
            ? TouchableNativeFeedback : TouchableOpacity;

        return (
            <Touchable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                accessibilityStates={accessibilityStates}
                hasTVPreferredFocus={hasTVPreferredFocus}
                nextFocusDown={nextFocusDown}
                nextFocusForward={nextFocusForward}
                nextFocusLeft={nextFocusLeft}
                nextFocusRight={nextFocusRight}
                nextFocusUp={nextFocusUp}
                testID={testID}
                disabled={disabled}
                onPress={onPress}
                touchSoundDisabled={touchSoundDisabled}
            >
                <View style={buttonStyles}>
                    <Text style={textStyles}>
                        {formattedTitle}
                    </Text>
                </View>
            </Touchable>
        );
    }
}
