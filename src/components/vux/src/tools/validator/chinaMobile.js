/**
https://gist.github.com/JerryC8080/b4005ef5c4902b1ea7a0

电信

2G/3G号段（CDMA2000网络）133、153、180、181、189
4G号段 177、173、190、199

联通

2G号段（GSM网络）130、131、132、155、156
3G上网卡145
3G号段（WCDMA网络）185、186
4G号段 176、185[1]、196

移动

2G号段（GSM网络）有134x（0-8）、135、136、137、138、139、150、151、152、158、159、182、183、184。
3G号段（TD-SCDMA网络）有157、187、188
3G上网卡 147
4G号段 178、197、198
*/

export default function (str) {
  return /^1[3|4|5|7|8|9][0-9]{9}$/.test(str)
}
