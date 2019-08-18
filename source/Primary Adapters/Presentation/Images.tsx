import React, { Component } from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';

const imageWithAspectRatio = (imageSource: ImageSourcePropType): typeof Component => {
    return class extends Component<ImageProps> {
        render(): Element {
            const { width, height } = Image.resolveAssetSource(imageSource);
            const aspectRatio = width / height;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { source, style, ...passThroughProps } = this.props;

            return <Image
                source={imageSource}
                style={[{ aspectRatio: aspectRatio }, style]}
                {...passThroughProps}
            />;
        }
    };
};

const ImageSources: { [key: string]: ImageSourcePropType } = {
    IconLogoCombo: require('../../../assets/icon-logo-combo.png'),
};

const Images = {
    IconLogoCombo: imageWithAspectRatio(ImageSources.IconLogoCombo),
};

export default Images;
