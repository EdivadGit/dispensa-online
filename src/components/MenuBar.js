import React, { Component } from "react";
import Icon from "@mdi/react";
import { mdiPlus, mdiWarehouse, mdiMinus } from "@mdi/js";
import { useLocation } from "react-router-dom";

class MenuBar extends Component {
  is_active(path) {
    const pathname = this.props.location?.pathname || window.location.pathname;
    return pathname === path;
  }
  render() {
    var class_icon =
      "rounded-full p-2 shadow-lg border cursor-pointer bg-white";

    return (
      <div className="bottom-0 left-0 w-full flex justify-around items-center px-10 py-2 fixed bg-gray-200 z-30">
        <a href="/remove" aria-label="History">
          <Icon
            path={mdiMinus}
            size={2}
            className={
              class_icon +
              (this.is_active("/remove") ? " text-white !bg-red-600" : "")
            }
          />
        </a>
        <a href="/" aria-label="Home">
          <Icon
            path={mdiWarehouse}
            size={2}
            className={
              class_icon +
              (this.is_active("/") ? " text-white !bg-blue-800" : "")
            }
          />
        </a>
        <a href="/new" aria-label="New">
          <Icon
            path={mdiPlus}
            size={2}
            className={
              class_icon +
              (this.is_active("/new") ? " text-white !bg-green-800" : "")
            }
          />
        </a>
      </div>
    );
  }
}
function MenuBarWithLocation(props) {
  const location = useLocation();
  return <MenuBar {...props} location={location} />;
}

export default MenuBarWithLocation;
