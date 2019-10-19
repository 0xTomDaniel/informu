import React, { Component } from 'react';
import {
    Image,
    ImageProps,
    ImageSourcePropType,
    ImageBackgroundProps,
    ImageBackground
} from 'react-native';

const imageWithAspectRatio = (imageSource: ImageSourcePropType, imageBackground = false): typeof Component => {
    const { width, height } = Image.resolveAssetSource(imageSource);
    const aspectRatio = width / height;

    class ImageWrapper extends Component<ImageProps> {
        render(): Element {
            // Pass through all props except 'source'
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { source, style, ...passThroughProps } = this.props;

            return <Image
                source={imageSource}
                style={[{ aspectRatio: aspectRatio }, style]}
                {...passThroughProps}
            />;
        }
    }

    class ImageBackgroundWrapper extends Component<ImageBackgroundProps> {
        render(): Element {
            // Pass through all props except 'source'
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { source, imageStyle, ...passThroughProps } = this.props;

            return <ImageBackground
                source={imageSource}
                imageStyle={[{ aspectRatio: aspectRatio }, imageStyle]}
                {...passThroughProps}
            />;
        }
    }

    return imageBackground ? ImageBackgroundWrapper : ImageWrapper;
};

const ImageSources = {
    IconLogoCombo: require('../../../assets/icon-logo-combo.png') as ImageSourcePropType,
    AddMuTag: require('../../../assets/add-mu-tag.png') as ImageSourcePropType,
};

export const Images = {
    IconLogoCombo: imageWithAspectRatio(ImageSources.IconLogoCombo),
};

export const ImageBackgrounds = {
    AddMuTag: imageWithAspectRatio(ImageSources.AddMuTag, true),
};
