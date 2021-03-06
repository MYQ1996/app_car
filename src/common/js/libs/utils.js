import path from 'path';
import EventEmitter from './events';

import axios from 'axios';
import storage from 'good-storage';
import url from 'url';


let params = url.parse(location.href);

import generateStaticHtml from '../generateStaticHtml/index';

import { frontMonitor } from 'globalEvent';


export default {
    
    openRemotePage(page) {
        
        let url = "http://www.wangluodaikuankouzi.com/newdaichao/pages/${page}.html";

        this.openBrowser({
            
            url
        });
    },
    //扩展属性
    extend(arg1, arg2) {
        if (typeof arg2 == 'string') {
            arg1 = arg2
            return arg1;
        }else{
            for (let item in arg2) {
                arg1[item] = arg2[item];
            }
            return arg1;
        }
    },

    //提示信息
    tipInfo: function(opt) {


        let hasTipInfo = document.querySelector('.tip-info-wrapper');
        hasTipInfo || createTipInfo();
        function createTipInfo() {
            let content = opt.content || '',
                data = opt.data || null,
                time = opt.time || 2,
                callback = opt.callback || function() {},
                div = document.createElement('div');

            div.classList.add('tip-info-wrapper');
            div.innerHTML = content;
            document.body.appendChild(div);
            setTimeout(function() {
                div.parentNode.removeChild(div);
                callback(data);
            }, time * 1000);
        }

    },

    //添加事件
    addEvent: function(eventId, label, mapkv) {

        let arrs = Array.prototype.slice.call(arguments);

        if (window.TDAPP) {

            TDAPP.onEvent.apply(TDAPP, arrs);
            return;
        }

        let timer = setInterval(function() {
            try {

                TDAPP && clearInterval(timer);

                TDAPP.onEvent.apply(TDAPP, arrs);

            } catch (e) {

                console.log(e);
            }
        }, 1000);
    },

    //获取参数
    getParams: function(key, url) {

        let queryString = location.search.slice(1);
        let params = {};

        let temParams = queryString.split('&');

        for (let i = 0; i < temParams.length; i++) {

            let temData = temParams[i].split('=');

            params[temData[0]] = temData[1] || '';
        }

        return !!key ? params[key] : params;
    },

    //显示loading
    showLoading: function() {
        let div = document.createElement('div');
        div.id = 'loading';
        document.body.appendChild(div);
    },

    //隐藏loading
    hideLoading: function() {
        let ele = document.getElementById('loading');

        ele && document.body.removeChild(ele);
    },

    //网络请求, 获取数据
    async fetch(opt, ip) {

        if (process.env.NODE_ENV == 'static' || process.env.NODE_ENV == 'staticbuild') {


            return generateStaticHtml(opt);
        }

        let res = await new Promise((resolve, reject) => {



            let e = new EventEmitter()
            e.on('overtime', () => {

                this.tipInfo({ content: '您的网络有点儿慢...' });
            })

            let timer = setInterval(() => {

                e.emit('overtime');

                clearInterval(timer);

            }, 10000);

            //当状态码不是0的时候，是否提示错误信息
            let errorTip = typeof opt.errorTip === 'undefined' ? true : false;

            //是否有加载提示
            let loadingTip = typeof opt.loadingTip === "undefined" ? true : false;

            loadingTip && this.showLoading();

            let defaultParams = {};
           
            

            defaultParams = {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                }
            }
            
            let options = this.extend(defaultParams, opt);

            let self = this;

            this.generateSubmitData(options);
            
            console.log(options)
            axios(options)
                //状态码正常的情况下
                .then(response => {

                    clearInterval(timer);

                    loadingTip && self.hideLoading();

                    let data = response.data;
                
                    if (typeof data.code != 'undefined') {

                        if (data.code != 0) { //有code的情况,一种数据格式

                            //登录验证失败的情况
                            // if ((data.code == 403 || data.code == 10001 && data.module == 'appouth') && (data.message == '登陆验证失败')) {
                            if (data.code == 403 || data.code == 10001) {
                                self.tipInfo({

                                    content: '登录验证失败，请重新登录',
                                    callback() {

                                        self.go('user-login', {

                                            redirectUrl: location.href
                                        })
                                    }
                                })
                                return;
                            }

                            self.tipInfo({

                                content: `${data.message}` || `服务器繁忙-(${data.code})`,
                                callback() {

                                    frontMonitor.saveServerDataError(response);

                                    reject(data)
                                }
                            })

                        } else {

                            //安装最新约定的数据格式，并且返回的是正常的数据
                            resolve(data.data);
                        }

                    } else { //没有code的情况，另一种数据格式(后台历史遗留问题)


                        if ((data.statusCode == 403) && (data.message == '验证登录信息失败')) {

                            self.tipInfo({

                                content: '登录验证失败，请重新登录',
                                callback() {

                                    self.go('user-login', {

                                        redirectUrl: location.href
                                    })
                                }
                            })
                            return;
                        }
                        resolve(data);
                    }
                })
                //状态码非正常情况都会走这里面
                .catch(error => {
                    clearInterval(timer);

                    loadingTip && self.hideLoading();

                    if (error.toString().indexOf('Network Error') > -1) {

                        self.tipInfo({

                            content: '似乎没网啦',
                            callback() {

                                frontMonitor.saveNetWorkError(error)
                            }
                        })
                        return;
                    }

                    let data = error.response.data;
                    if ((data.statusCode == 403) && (data.message == '验证登录信息失败')) {

                        self.tipInfo({

                            content: '登录验证失败，请重新登录',
                            callback() {

                                self.go('user-login', {

                                    redirectUrl: location.href
                                })
                            }
                        })
                        return;
                    }

                    self.tipInfo({

                        content: '服务器繁忙',
                        callback() {

                            frontMonitor.saveServerError(error);
                        }
                    })

                })
        })

        return res;
    },

    //生成提交到后台的数据
    generateSubmitData(options) {

        let temData;
        let productId = storage.get('productId');

        if (Object.prototype.toString.call(options.data) === '[object Array]') {

            temData = options.data;
        } else {
            if (typeof options.data !== 'string' && options.string !== true) {
                temData = { productId };
            }
            temData = this.extend(temData, options.data);
        }


        if(!/\.json/.test(options.url)){
            
            let auto = storage.get("identityInfo");
            options.headers["Authority.Token"] = auto||"";

            this.judgeIsLogin(options);

        }

        if (options.method == 'POST') {

            options.data = temData;
        } else {

            options.params = temData;
        }
    },

    //并行发起多个请求
    fetchAll(opt) {

        let queue = [];

        opt.forEach(item => {
            queue.push(this.fetch(item))
        })

        return Promise.all(queue)
    },

    //判断用户是否登录了
    judgeIsLogin(opt) {

        let isNeedIdentity = (typeof opt.isNeedIdentity === 'undefined' || !!opt.isNeedIdentity) ? true : false;

        if (!isNeedIdentity) return false; //如果不需要身份校验，返回

        let identityInfo = storage.get('identityInfo');

        if(!identityInfo) {

            this.go('user-login', {

                redirectUrl: location.href
            })
        }
        
    },
    //路由的前往函数
    go(url, params = {}) {

        let queryString = '';

        url = url.indexOf('.html') > -1 ? url : `${url}.html`;

        for (let i in params) {

            queryString += `${i}=${params[i]}&`;
        }

        queryString = queryString.slice(0, -1);

        let wholeUrl = !!queryString ? `${url}?${queryString}` : url;

        //存储路由栈
        if (process.env.NODE_PLATFORM == 'app') {

            this.storageUrlStack(location.href);
        }

        window.location.href = wholeUrl;
    },

    generateUUID () {
        var d = new Date().getTime()
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0
            d = Math.floor(d / 16)
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
        return uuid
    },

    storageUrlStack(url) {

        let urlStacks = storage.get('urlStacks');

        //如果不存在url栈
        if (!urlStacks) {

            storage.set('urlStacks', [url]);

            return;
        }

        //如果存在url栈
        if (urlStacks) {

            urlStacks.push(url);
            storage.set('urlStacks', urlStacks);
            return;
        }
    },

    openBrowser(opts) {

        if (typeof window.cordova === 'undefined') {

            location.href = opts.url;
            return;
        }


        let url = opts.url,
            target = "_blank",
            options = "location=yes",
            ref = cordova.InAppBrowser.open(url, target, options);

        opts.start && ref.addEventListener('loadstart', opts.start); //开始加载(点击webview里面的其他链接，也会触发这个方法; opts.start(event)里面会包含一个事件信息，如url)
        opts.stop && ref.addEventListener('loadstop', opts.stop); //加载完成了
        opts.error && ref.addEventListener('loaderror', opts.error); //加载错误
        opts.exit && ref.addEventListener('exit', opts.exit); //关闭webview

        return ref;
    },

    /**
     * [checkCardId 身份证号码验证]
     * @param  {[string]} humanId [身份证号]
     * @return {[boolean]}         [格式正确返回true,否则返回false]
     */
    checkCardId(humanId) {
        humanId = humanId.replace('x', 'X');
        var vcity = {
            11: "北京",
            12: "天津",
            13: "河北",
            14: "山西",
            15: "内蒙古",
            21: "辽宁",
            22: "吉林",
            23: "黑龙江",
            31: "上海",
            32: "江苏",
            33: "浙江",
            34: "安徽",
            35: "福建",
            36: "江西",
            37: "山东",
            41: "河南",
            42: "湖北",
            43: "湖南",
            44: "广东",
            45: "广西",
            46: "海南",
            50: "重庆",
            51: "四川",
            52: "贵州",
            53: "云南",
            54: "西藏",
            61: "陕西",
            62: "甘肃",
            63: "青海",
            64: "宁夏",
            65: "新疆",
            71: "台湾",
            81: "香港",
            82: "澳门",
            91: "国外"
        };
        var regId = /(^\d{17}(\d|X)$)/;
        var province = humanId.substr(0, 2);
        var len = humanId.length;
        var re_eighteen = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/;
        var arr_data = humanId.match(re_eighteen);
        if (regId.test(humanId) == false) {
            return false; //校验位数；
        } else if (vcity[province] == undefined) {
            return false; //校验城市
        } else if (regId.test(humanId) !== false) {
            var year = arr_data[2];
            var month = arr_data[3];
            var day = arr_data[4];
            var birthday = new Date(year + '/' + month + '/' + day);
            var now = new Date();
            var now_year = now.getFullYear();
            var time = now_year - year;
            if (birthday.getFullYear() == year && (birthday.getMonth() + 1) == month && birthday.getDate() == day) {
                if (time >= 3 && time <= 100) {
                    var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                    var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                    var cardTemp = 0,
                        i, valnum;
                    for (i = 0; i < 17; i++) {
                        cardTemp += humanId.substr(i, 1) * arrInt[i];
                    }
                    valnum = arrCh[cardTemp % 11];
                    if (valnum == humanId.substr(17, 1)) {
                        return true;
                    }
                    return false;
                }
                return false;
            }
            return false;
        }
    },

    //计算添加几天之后的日期
    addDays(date, days) {

        let arr;

        if (typeof(date) == "string") {
            arr = date.split("-");
            if (parseInt(arr[1]) < 10) {
                arr[1] = "0" + parseInt(arr[1]);
            }
            if (parseInt(arr[2]) < 10) {
                arr[2] = "0" + parseInt(arr[2]);
            }
            date = arr.join("-");
        }


        const d = new Date(date);
        d.setDate(d.getDate() + parseInt(days));
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },

    //运行的项目是否是demo版
    isDemo() {

        return process.env.NODE_ENV === 'static' || process.env.NODE_ENV === 'staticbuild';
    },

    //url拼接参数
    urlSpliceParmas(opts) {

        let url = opts.url || location.href;
        let params = opts.params;

        if (url.indexOf('?') == -1) {

            url = url + '?';
        }

        for (let i in params) {

            url = `${url}${i}=${params[i]}&`;
        }

        return url.slice(0, -1);
    },

    //获取连连支付成功之后的回调地址
    getllPayRedirectUrl(opts) {


        if (process.env.NODE_PLATFORM == 'app') {

            return 'close-pay-window';
        } else {

            opts = typeof opts === 'undefined' ? {} : opts;
            let redirectUrl
            if(process.env.NODE_ENV == 'production'){
                redirectUrl = opts.redirectUrl || `${location.protocol}//${location.host}/pages/order-list.html`;
            }else{
                redirectUrl = opts.redirectUrl || `${location.protocol}//${location.host}/blackcard/pages/order-list.html`;
            }

            return redirectUrl;
        }
    },

    //获取连连支付成功之后的回调地址
    getBlackCardPayctUrl(opts) {


        if (process.env.NODE_PLATFORM == 'app') {

            return 'close-pay-window-vip';
        } else {

            opts = typeof opts === 'undefined' ? {} : opts;
            let redirectUrl
            if (process.env.NODE_ENV == 'production') {
                redirectUrl = opts.redirectUrl || `${location.protocol}//${location.host}/pages/vip-card.html`;
            } else {
                redirectUrl = opts.redirectUrl || `${location.protocol}//${location.host}/blackcard/pages/vip-card.html`;
            }

            return redirectUrl;
        }
    },

    //获取连连支付成功之后的回调地址
    getllPayRedirectIndexUrl(opts) {


        if (process.env.NODE_PLATFORM == 'app') {

            return 'close-pay-window';
        } else {

            opts = typeof opts === 'undefined' ? {} : opts;
            let redirectUrl
            if (process.env.NODE_ENV == 'production') {
                redirectUrl = opts.redirectUrl || `${location.protocol}//${location.host}/pages/index.html`;
            } else {
                redirectUrl = opts.redirectUrl || `${location.protocol}//${location.host}/blackcard/pages/index.html`;
            }

            return redirectUrl;
        }
    },

    isIphone() {

        if (navigator.userAgent.toLowerCase().indexOf('iphone') > -1) {

            return true;
        }

        return false;
    },

    ChineseToNumber(n) {
        if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(n)) return "数据非法";
        var unit = "京亿万千百0兆万千百0亿千百0万千百0 角分",
            str = "";
        n += "00";
        var p = n.indexOf('.');
        if (p >= 0)
            n = n.substring(0, p) + n.substr(p + 1, 2);
        unit = unit.substr(unit.length - n.length);
        for (var i = 0; i < n.length; i++) str += '零123456789'.charAt(n.charAt(i)) + unit.charAt(i);
         str = str.replace(/零(千|百|0|角)/g, "零").replace(/(零)+/g, "零").replace(/零(兆|万|亿| )/g, "$1").replace(/(兆|亿)万/g, "$1").replace(/(京|兆)亿/g, "$1").replace(/(京)兆/g, "$1").replace(/(京|兆|亿|千|百|0)(万?)(.)千/g, "$1$2零$3千").replace(/^ 零?|零分/g, "").replace(/( |角)$/g, "$1").replace(/\s+/g, "");;
         return str = str.replace("百","")
    },
    // 防抖
   _debounce(fn, delay) {
        var delay = delay || 200;
        var timer;
        return function () {
            var th = this;
            var args = arguments;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                timer = null;
                fn.apply(th, args);
            }, delay);
        };
    },
    // 节流
    _throttle(fn, interval) {
        var last;
        var timer;
        var interval = interval || 200;
        return function () {
            var th = this;
            var args = arguments;
            var now = +new Date();
            if (last && now - last < interval) {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    last = now;
                    fn.apply(th, args);
                }, interval);
            } else {
                last = now;
                fn.apply(th, args);
            }
        }
    },
    // 转换百分数
    toPercent(point) {
        var str = Number(point * 100).toFixed(2);
        str += "%";
        return str;
    }
}