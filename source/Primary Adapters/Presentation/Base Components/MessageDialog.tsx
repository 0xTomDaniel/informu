import { FunctionComponent, ReactElement } from "react";
import { Portal, Dialog, Paragraph, Button } from "react-native-paper";
import React from "react";

interface ErrorDialogProps {
    message: string;
    visible: boolean;
    onDismiss: () => void;
}

const MessageDialog: FunctionComponent<ErrorDialogProps> = (
    props
): ReactElement => {
    const dismiss = (): void => props.onDismiss();

    return (
        <Portal>
            <Dialog visible={props.visible} onDismiss={dismiss}>
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

export default MessageDialog;
