export const formatNumbersWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export const formatTime = (seconds) => {
  let days = Math.floor(seconds / (3600*24));
  seconds  -= days*3600*24;
  let hours   = Math.floor(seconds / 3600);
  seconds  -= hours*3600;
  let minutes = Math.floor(seconds / 60);
  seconds  -= minutes*60;
  return (days + ":" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2));
}

const pad = (num, size) => {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
