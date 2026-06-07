import React from "react";
import * as VectorIcons from "@expo/vector-icons";

// Compatibility shim for the old `react-native-dynamic-vector-icons` API, which
// took the icon family as a `type` prop:
//
//   <Icon name="arrow-back" type="MaterialIcons" size={30} color="#b3b6c3" />
//
// @expo/vector-icons exposes each family as its own component instead, so we map
// `type` -> the matching family and forward the rest of the props. This keeps
// the existing call sites (and the vendored search bar) unchanged.
//
// NOTE: some Ionicons glyph names changed after Ionicons v4 (the version this
// app originally used). Names like "ios-share-alt" no longer exist and will
// render as a missing glyph until updated — see UPGRADE.md.
export default function Icon({ type = "Ionicons", name, size, color, ...rest }) {
  const Family = VectorIcons[type] || VectorIcons.Ionicons;
  return <Family name={name} size={size} color={color} {...rest} />;
}
