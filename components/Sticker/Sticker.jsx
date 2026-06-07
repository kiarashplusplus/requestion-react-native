import React, { Component } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Share,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import styles, { gradientColors, outerContainer } from "./Sticker.styles";
const { width, height } = Dimensions.get("window");
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
// The classic FileSystem functions moved to the /legacy entry point in SDK 52+.
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const cardMargin = 10;
// Deep links into the target apps' library/upload after the sticker is saved to
// Photos. If the app isn't installed we fall back to the OS share sheet.
const instagramUrl = "instagram://library?AssetPath=";
const tiktokUrl = "tiktok://";

class Sticker extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    // Bound to 0.9 width X 0.7 height
    this.cardWidth = width * 0.9;
    this.cardHeight =
      (this.props.imgHeight * this.cardWidth) / this.props.imgWidth;
    if (this.cardHeight > height * 0.7) {
      this.cardHeight = height * 0.7;
      this.cardWidth =
        (this.props.imgWidth * this.cardHeight) / this.props.imgHeight;
    }

    this.state = {
      isLoading: false,
      cardWidth: 1,
      cardHeight: 1
    };
  }

  componentWillUnmount = () => (this._isMounted = false);

  componentDidMount() {
    this._isMounted = true;
    if (this.props.base64) {
      console.log("Base64 from props. Not fetching :)");
      this.setState({
        base64: this.props.base64
      });
    } else {
      this.setState({
        isLoading: true
      });

      fetch(this.props.imgSrc)
        .then(response => response.json())
        .then(responseJson => {
          console.log(`Fetched ${responseJson.stickerId}`);
          if (this._isMounted) {
            this.setState({
              base64: responseJson.image,
              isLoading: false
            });
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  onLoadEnd = () =>
    this.setState({
      isLoading: false,
      cardHeight: this.cardHeight,
      cardWidth: this.cardWidth
    });

  // Write the current base64 sticker to a temp PNG file. Photos and the share
  // sheet both need a file URI, not a base64 data URI.
  writeStickerFile = async () => {
    if (!this.state.base64) return null;
    const base64 = this.state.base64.replace(/^data:image\/\w+;base64,/, "");
    const fileUri = `${FileSystem.cacheDirectory}requestion-sticker-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64
    });
    return fileUri;
  };

  saveToPhotos = async fileUri => {
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (!granted) return false;
    await MediaLibrary.createAssetAsync(fileUri);
    return true;
  };

  // Try the target app's deep link; if it isn't installed, fall back to the OS
  // share sheet so the saved sticker can still be posted.
  openAppOrShareSheet = async (appUrl, fileUri) => {
    const canOpen = await Linking.canOpenURL(appUrl).catch(() => false);
    if (canOpen) return Linking.openURL(appUrl);
    if (await Sharing.isAvailableAsync()) return Sharing.shareAsync(fileUri);
  };

  onShare = async type => {
    console.log("onShare is pressed with type: ", type);
    try {
      const fileUri = await this.writeStickerFile();
      if (!fileUri) return;
      if (type === "IG") {
        await this.saveToPhotos(fileUri);
        await this.openAppOrShareSheet(instagramUrl, fileUri);
      } else if (type === "TikTok") {
        await this.saveToPhotos(fileUri);
        await this.openAppOrShareSheet(tiktokUrl, fileUri);
      } else if (await Sharing.isAvailableAsync()) {
        // Native share sheet with the real image file (more reliable than
        // sharing a base64 data URI through RN's Share API).
        await Sharing.shareAsync(fileUri, { dialogTitle: "Requestion" });
      } else {
        await Share.share({
          message: this.props.imgSrc + "&html=true",
          title: "Requestion",
          url: fileUri
        });
      }
    } catch (error) {
      console.log("onShare error:", error);
    }
  };

  renderSticker() {
    return (
      <LinearGradient
        start={[0, 0]}
        end={[1, 0]}
        colors={gradientColors}
        style={outerContainer(this.cardWidth, this.cardHeight)}
      >
        <View
          style={[
            styles.innerContainer,
            { flex: 1, paddingLeft: this.cardWidth / 2 - cardMargin }
          ]}
        >
          <ActivityIndicator animating={this.state.isLoading} />
        </View>
        {this.state.base64 && (
          <Image
            source={{
              uri: this.state.base64,
              width: this.state.cardWidth,
              height: this.state.cardHeight
            }}
            onLoadStart={() => {
              this.setState({ isLoading: true });
            }}
            onLoadEnd={this.onLoadEnd}
          />
        )}
      </LinearGradient>
    );
  }

  render() {
    return (
      <View style={styles.shadowStyle}>
        {this.props.openDetails ? (
          <TouchableOpacity
            onPress={() =>
              this.props.openDetails({
                base64: this.state.base64,
                ...this.props
              })
            }
          >
            {this.renderSticker()}
          </TouchableOpacity>
        ) : (
          <TouchableWithoutFeedback>
            {this.renderSticker()}
          </TouchableWithoutFeedback>
        )}
      </View>
    );
  }
}

Sticker.defaultProps = {
  imgHeight: 250,
  imgWidth: 400
};

export default Sticker;
