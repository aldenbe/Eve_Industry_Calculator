let backendHost;
let iconHost;

const hostname = window && window.location && window.location.hostname;

if(hostname === 'localhost') {
  //modify backendHost to coincide with your own local hosting of the backend for dev environment
  backendHost = 'http://eic/backend/';
  iconHost = "https://image.eveonline.com/type/";

} else {
  backendHost = './backend/';
  iconHost = "./images/icons/";
}

export const API_ROOT = backendHost;
export const ICON_ROOT = iconHost;
