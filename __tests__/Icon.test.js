import Icon from "../components/Icon";
import { MaterialIcons, Ionicons, Octicons } from "@expo/vector-icons";

// Icon is a thin compat shim: it returns React.createElement(<family>, props),
// so we can assert on the returned element directly without rendering — which
// keeps the test fast and avoids a host renderer under React 19.
describe("Icon compat shim", () => {
  it("maps the `type` prop to the matching @expo/vector-icons family", () => {
    const el = Icon({ type: "MaterialIcons", name: "arrow-back", size: 30, color: "#fff" });
    expect(el.type).toBe(MaterialIcons);
    expect(el.props).toMatchObject({ name: "arrow-back", size: 30, color: "#fff" });
  });

  it("defaults to Ionicons when no type is given", () => {
    const el = Icon({ name: "logo-instagram" });
    expect(el.type).toBe(Ionicons);
    expect(el.props.name).toBe("logo-instagram");
  });

  it("falls back to Ionicons for an unknown family", () => {
    const el = Icon({ type: "NotARealFamily", name: "x" });
    expect(el.type).toBe(Ionicons);
  });

  it("forwards extra props through to the family component", () => {
    const el = Icon({ type: "Octicons", name: "search", accessibilityLabel: "search" });
    expect(el.type).toBe(Octicons);
    expect(el.props.accessibilityLabel).toBe("search");
  });
});
