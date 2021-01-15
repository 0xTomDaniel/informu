import { useEffect, FunctionComponent, ReactElement, useState } from "react";
import { Card, Text, Menu, IconButton, Avatar } from "react-native-paper";
import React from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
    BelongingViewData,
    BatteryLevelRange,
    SafeStatus,
    BatteryBarLevel
} from "./BelongingDashboardViewModel";
import Theme from "../../../../source/Primary Adapters/Presentation/Theme";
import { Scale } from "../../../../source/Primary Adapters/Presentation/ResponsiveScaler";
import Localize from "../../../shared/localization/Localize";

const localize = Localize.instance;

const styles = StyleSheet.create({
    card: {
        //paddingVertical: 8,
        marginHorizontal: Scale(8),
        marginTop: Scale(12),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: Theme.Color.AlmostWhiteBorder
    },
    cardHeader: {
        paddingTop: 4,
        paddingHorizontal: 19,
        marginBottom: -16,
        alignItems: "flex-end"
    },
    batteryIcon: {
        transform: [{ rotate: "90deg" }]
    },
    cardSubtitle: {
        color: "gray"
    },
    cardIconView: {
        backgroundColor: Theme.Color.PrimaryBlue,
        marginLeft: 4
    },
    cardIconButton: {
        marginRight: 11
    },
    cardTitleText: {
        marginLeft: 8
    },
    cardContent: {
        paddingHorizontal: 20
    },
    cardAddressView: {
        marginLeft: 58,
        marginTop: -7,
        flexDirection: "row"
    },
    cardAddressIcon: {
        marginRight: 2
    },
    cardAddressText: {
        color: "gray",
        fontSize: 12
    }
});

interface BelongingCardProps {
    onRemoveMuTag: (uid: string) => void;
    viewData: BelongingViewData;
}

const BelongingCard: FunctionComponent<BelongingCardProps> = (
    props
): ReactElement => {
    const convertToBatteryBarColor = (
        batteryLevelRange: BatteryLevelRange
    ): string => {
        switch (batteryLevelRange) {
            case "High":
                return Theme.Color.Green;
            case "Medium":
                return "gold";
            case "Low":
                return Theme.Color.Error;
        }
    };
    const convertToBatteryIconName = (
        batteryBarLevel: BatteryBarLevel
    ): string => {
        const batteryLevelPercentage = batteryBarLevel.slice(0, -1);
        switch (batteryLevelPercentage) {
            case "0":
                return "battery-outline";
            case "100":
                return "battery";
            default:
                return `battery-${batteryLevelPercentage}`;
        }
    };
    const convertToSafeStatusColor = (safeStatus: SafeStatus): string => {
        switch (safeStatus) {
            case "InRange":
                return Theme.Color.Green;
            case "InSafeZone":
                return "gray";
            case "Unsafe":
                return Theme.Color.Error;
        }
    };

    const [batteryBarColor, setBatteryBarColor] = useState(
        convertToBatteryBarColor(props.viewData.batteryLevelRange)
    );
    const [batteryBarIconName, setBatteryBarIconName] = useState(
        convertToBatteryIconName(props.viewData.batteryBarLevel)
    );

    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const hideMenu = (): void => setIsMenuVisible(false);
    const showMenu = (): void => setIsMenuVisible(true);

    const [safeStatusColor, setSafeStatusColor] = useState(
        convertToSafeStatusColor(props.viewData.safeStatus)
    );

    useEffect((): void => {
        setBatteryBarColor(
            convertToBatteryBarColor(props.viewData.batteryLevelRange)
        );
    }, [props.viewData.batteryLevelRange]);

    useEffect((): void => {
        setBatteryBarIconName(
            convertToBatteryIconName(props.viewData.batteryBarLevel)
        );
    }, [props.viewData.batteryBarLevel]);

    useEffect((): void => {
        setSafeStatusColor(convertToSafeStatusColor(props.viewData.safeStatus));
    }, [props.viewData.safeStatus]);

    return (
        <Card elevation={0} style={styles.card}>
            <View style={styles.cardHeader}>
                <Icon
                    name={batteryBarIconName}
                    size={19}
                    color={batteryBarColor}
                    style={styles.batteryIcon}
                />
            </View>
            <Card.Title
                title={props.viewData.name}
                subtitle={
                    <Text style={styles.cardSubtitle}>
                        <Icon
                            name="checkbox-blank-circle"
                            size={10}
                            color={safeStatusColor}
                        />
                        {` ${props.viewData.lastSeen}`}
                    </Text>
                }
                left={(leftProps: any): ReactElement => (
                    <Avatar.Icon
                        {...leftProps}
                        icon="radar"
                        color="white"
                        style={styles.cardIconView}
                    />
                )}
                right={(rightProps: any): ReactElement => (
                    <Menu
                        visible={isMenuVisible}
                        onDismiss={hideMenu}
                        anchor={
                            <IconButton
                                {...rightProps}
                                icon="dots-horizontal"
                                color={Theme.Color.DarkGrey}
                                style={styles.cardIconButton}
                                onPress={showMenu}
                            />
                        }
                    >
                        <Menu.Item
                            title={localize.getText(
                                "viewBelongingDashboard",
                                "belongingCard",
                                "buttonRemove"
                            )}
                            icon="minus-circle-outline"
                            onPress={() =>
                                props.onRemoveMuTag(props.viewData.uid)
                            }
                        />
                    </Menu>
                )}
                titleStyle={styles.cardTitleText}
                subtitleStyle={styles.cardTitleText}
                //style={{ backgroundColor: "blue", marginTop: -16 }}
            />
            <Card.Content style={styles.cardContent}>
                <View style={styles.cardAddressView}>
                    <Icon
                        name="map-marker"
                        size={14}
                        color={Theme.Color.PrimaryBlue}
                        style={styles.cardAddressIcon}
                    />
                    <Text style={styles.cardAddressText}>
                        {props.viewData.address}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
};

export default BelongingCard;
