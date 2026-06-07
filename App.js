import React, { Component } from "react";
import {
  ActivityIndicator,
  View,
  InputAccessoryView,
  Platform,
  FlatList,
  Text,
  TouchableOpacity,
  SectionList,
  Keyboard,
  StatusBar,
  SafeAreaView
} from "react-native";
import * as Font from "expo-font";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import SearchBar from "./components/react-native-dynamic-search-bar";
import Sticker from "./components/Sticker";
import StickerDetails from "./components/StickerDetails";
const _ = require("lodash");

const localityParam = locality =>
  locality ? "&locality=" + encodeURIComponent(locality) : "";

const requestionLocalities = () =>
  fetch("https://requestion.app/localities")
    .then(response => (response.ok ? response.json() : []))
    .catch(error => {
      console.error(error);
      return [];
    });

// "Near you" headlines for the selected locality.
const requestionFeatured = locality =>
  fetch("https://requestion.app/featured?locality=" + encodeURIComponent(locality || ""))
    .then(response => {
      if (!response.ok) {
        return [];
      }
      return response.json();
    })
    .then(stickers => {
      return stickers;
    })
    .catch(error => {
      console.error(error);
      return [];
    });

const requestionQuery = (query, locality) =>
  fetch(
    "https://requestion.app/query?q=" +
      encodeURIComponent(query) +
      localityParam(locality)
  )
    .then(response => {
      if (!response.ok) {
        return [];
      }
      return response.json();
    })
    .then(responseJson => {
      return responseJson.sections;
    })
    .catch(error => {
      console.error(error);
      return [];
    });

// 1 second pause before fetching new data based on user search query changes.
const queryDebounced = AwesomeDebouncePromise(requestionQuery, 500);

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      sections: {},
      isLoading: false,
      fontLoaded: false,
      localities: [],
      locality: null
    };
  }

  async componentDidMount() {
    await Font.loadAsync({
      roboto: require("./assets/fonts/Roboto-Black.ttf")
    });
    await Font.loadAsync({
      "roboto-light": require("./assets/fonts/Roboto-Light.ttf")
    });
    const localities = await requestionLocalities();
    // Default to the first available locality so "near you" has content on launch.
    const locality = localities.length ? localities[0].id : null;
    const featured = await requestionFeatured(locality);
    console.log(featured);
    //_.map(featured, item => Image.prefetch(item.imgSrc));
    this.setState({ fontLoaded: true, featured: featured, localities, locality });
  }

  // Switch locality: refresh "near you" headlines and re-run any active search.
  selectLocality = async locality => {
    if (locality === this.state.locality) return;
    this.setState({ locality, featured: [] });
    const featured = await requestionFeatured(locality);
    this.setState({ featured });
    if (this.state.query) {
      this.setQuery(this.state.query);
    }
  };

  setQuery = async text => {
    this.setState({
      sections: {},
      query: text,
      isLoading: true
    });
    const sections = await queryDebounced(text, this.state.locality);
    if (this.state.query == text) {
      this.setState({ sections: sections, isLoading: false });
      Keyboard.dismiss();
    } else {
      this.setState({
        sections: {},
        isLoading: false
      });
    }
  };

  // item is a combination of Sticker props as well as Sticker's inner state.
  openDetails = item => {
    if (item.query) {
      this.setQuery(item.query);
      Keyboard.dismiss();
    } else {
      this.setState({ stickerDetails: item, isDetailsPage: true });
    }
  };

  renderItem = item => {
    return (
      <Sticker
        imgSrc={item.imgSrc}
        imgHeight={item.imgHeight}
        imgWidth={item.imgWidth}
        query={item.query}
        redirectUrl={item.redirectUrl}
        openDetails={this.openDetails}
      />
    );
  };

  backToSerp = () => {
    this.setState({ stickerDetails: {}, isDetailsPage: false });
  };

  renderSection = section => {
    return (
      <FlatList
        initialNumToRender={2}
        // minimumViewTime={100}
        data={section.data}
        horizontal={true}
        renderItem={({ item }) => this.renderItem(item)}
        keyExtractor={(item, index) => index.toString()}
      />
    );
  };

  render() {
    const inputAccessoryViewID = "requestionSearch";
    const placeholder = "Search for fact stickers";
    return (
      this.state.fontLoaded && <SafeAreaView style={{ flex: 1, backgroundColor: "#21283d" }}>
        <StatusBar barStyle={"light-content"} />
        <View style={styles.container}>
          <SearchBar
            autoFocus={true}
            ref={search => (this.search = search)}
            fontColor="#c6c6c6"
            iconColor="#c6c6c6"
            shadowColor="#282828"
            cancelIconColor="#c6c6c6"
            backgroundColor="#353d5e"
            showCancel={this.state.query ? true : false}
            placeholder={this.state.query ? this.state.query : placeholder}
            onChangeText={text => {
              this.setQuery(text);
            }}
            onPressCancel={text => {
              this.setState({
                sections: {},
                isDetailsPage: false,
                query: text
              });
              this.search.textInput.focus();
            }}
          />
          {this.state.localities.length > 0 && (
            <FlatList
              data={this.state.localities}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps={"handled"}
              style={{ marginTop: 12, maxHeight: 40 }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const active = item.id === this.state.locality;
                return (
                  <TouchableOpacity
                    onPress={() => this.selectLocality(item.id)}
                    style={[styles.localityChip, active && styles.localityChipActive]}
                  >
                    <Text
                      style={[
                        styles.localityChipText,
                        active && styles.localityChipTextActive
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
          <View style={{ top: 16 }}>
            {this.state.isLoading && !this.state.isDetailsPage && (
              <ActivityIndicator animating={this.state.isLoading} />
            )}
            {this.state.isDetailsPage && (
              <StickerDetails
                backToSerp={this.backToSerp}
                stickerDetails={this.state.stickerDetails}
              />
            )}
            {!this.state.isDetailsPage && (
              <SectionList
                renderItem={({ item, index, section }) =>
                  !index && this.renderSection(section)
                }
                renderSectionHeader={({ section: { title } }) =>
                  title ? (
                    <Text
                      style={{
                        margin: 16,
                        fontFamily: "roboto",
                        fontSize: 18,
                        color: "white",
                        fontWeight: "bold"
                      }}
                    >
                      {title}
                    </Text>
                  ) : null
                }
                sections={[
                  {
                    title: "",
                    data: _.map(
                      _.filter(
                        this.state.featured,
                        sticker => sticker.query == this.state.query
                      ),
                      o => _.omit(o, "query")
                    )
                  },
                  ...Object.values(this.state.sections)
                ]}
                keyExtractor={(item, index) => item + index}
                stickySectionHeadersEnabled={false}
                ListFooterComponent={() => (
                  <Text
                    style={{ margin: 50, fontFamily: "roboto", fontSize: 25 }}
                  >
                    {" "}
                  </Text>
                )}
              />
            )}
          </View>
          <InputAccessoryView nativeID={inputAccessoryViewID}>
            <View>
              {this.state.fontLoaded && (
                <Text
                  style={{
                    fontFamily: "roboto",
                    fontSize: 20,
                    margin: 16,
                    color: "white"
                  }}
                >
                  Near you
                </Text>
              )}
              <FlatList
                keyboardShouldPersistTaps={"handled"}
                data={this.state.featured}
                horizontal={true}
                renderItem={({ item }) => this.renderItem(item)}
                keyExtractor={(item, index) => index.toString()}
                style={{ marginBottom: 20 }}
              />
            </View>
          </InputAccessoryView>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#21283d"
  },
  localityChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "#353d5e",
    justifyContent: "center"
  },
  localityChipActive: {
    backgroundColor: "#556cd6"
  },
  localityChipText: {
    color: "#c6c6c6",
    fontSize: 14
  },
  localityChipTextActive: {
    color: "white",
    fontWeight: "bold"
  }
};
