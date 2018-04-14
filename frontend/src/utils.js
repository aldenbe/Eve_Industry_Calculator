var fetch = require('fetch-retry');
const formatNumbersWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const getMinSellValue = (regionID, typeID) => {
  return fetch('https://esi.tech.ccp.is/latest/markets/' + regionID + '/orders/?order_type=sell&type_id=' + typeID, {
    retryOn: [500, 502],
    retryDelay: 250,
    method: 'GET',
    headers: {
      "Content-Type": "application/json"
    }
  }).then(response => {
    if (response.ok){
      return response.json()
    }
  }).then(json => {

    //get minimum price or set 0 if no price available
    let minPrice = 0;
    if (json.length > 0){
      minPrice = json[0].price;
      for (let j = 1, len=json.length; j < len; j++){
        let curPrice = json[j].price;
        minPrice = (curPrice < minPrice) ? curPrice : minPrice;
      }
    }

    return minPrice;
  });
}
const formatTime = (seconds) => {
  let days = Math.floor(seconds / (3600*24));
  seconds  -= days*3600*24;
  let hours   = Math.floor(seconds / 3600);
  seconds  -= hours*3600;
  let minutes = Math.floor(seconds / 60);
  seconds  -= minutes*60;
  return (days + ":" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2));
}

const   pad = (num, size) => {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

exports.getMinSellValue = getMinSellValue;
exports.formatNumbersWithCommas = formatNumbersWithCommas;
exports.formatTime = formatTime;
