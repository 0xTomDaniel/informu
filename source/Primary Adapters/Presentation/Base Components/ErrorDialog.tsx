import { FunctionComponent, ReactElement } from "react";
import { Portal, Dialog, Paragraph, Button } from "react-native-paper";
import React from "react";
import { StyleSheet } from "react-native";
import { Scale } from "../ResponsiveScaler";

const styles = StyleSheet.create({
    errorDialogTitle: {
        fontSize: Scale(20, 18)
    }
});

interface ErrorDialogProps {
    message: string;
    visible: boolean;
    onDismiss: () => void;
    title?: string;
}

const ErrorDialog: FunctionComponent<ErrorDialogProps> = (
    props
): ReactElement => {
    const dismiss = (): void => props.onDismiss();

    return (
        <Portal>
            <Dialog visible={props.visible} onDismiss={dismiss}>
                <Dialog.Title style={styles.errorDialogTitle}>
                    {props.title != null
                        ? props.title
                        : "Something went wrong  🤕"}
                </Dialog.Title>
                <Dialog.Content>
                    <Paragraph>{props.message}</Paragraph>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={dismiss}>Ok</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

export default ErrorDialog;
