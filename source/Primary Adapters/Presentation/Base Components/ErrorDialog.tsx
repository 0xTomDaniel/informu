import { FunctionComponent, ReactElement } from "react";
import {
    Portal,
    Dialog,
    Paragraph,
    Button,
    List,
    Caption,
    Divider
} from "react-native-paper";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Scale } from "../ResponsiveScaler";

const styles = StyleSheet.create({
    errorDialogTitle: {
        fontSize: Scale(20, 18)
    },
    detailDividerTop: {
        marginTop: 16
    },
    detailIcon: {
        fontSize: 5
    },
    detailContainer: {
        padding: 0,
        marginLeft: -10,
        marginRight: -4
    },
    detailDescription: {
        paddingLeft: 8,
        paddingRight: 8
    }
});

interface ErrorDialogProps {
    message: string;
    detailMessage: string;
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
                    {props.detailMessage !== "" ? (
                        <ErrorDialogDetail message={props.detailMessage} />
                    ) : null}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={dismiss}>Ok</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

interface ErrorDialogDetailProps {
    message: string;
}

const ErrorDialogDetail: FunctionComponent<ErrorDialogDetailProps> = (
    props
): ReactElement => {
    return (
        <View>
            <Divider style={styles.detailDividerTop} />
            <List.Accordion
                title=""
                left={subProps => (
                    <List.Icon {...subProps} icon="alert-circle" />
                )}
                style={styles.detailContainer}
            >
                <Caption style={styles.detailDescription}>
                    {props.message}
                </Caption>
            </List.Accordion>
            <Divider />
        </View>
    );
};

export default ErrorDialog;
