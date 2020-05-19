import {browserHistory} from 'react-router';

export const timeUtils = {
	//获取格式化时间
	formatDate(time){
		if (isNaN(Number(time))) return "";
		time = new Date(time * 1000);
		return {
			year: time.getFullYear(),
			month: this.toTwoDigit(time.getMonth() + 1),
			date: this.toTwoDigit(time.getDate()),
			hour: this.toTwoDigit(time.getHours()),
			minute: this.toTwoDigit(time.getMinutes()),
			second: this.toTwoDigit(time.getSeconds())
		}
	},
	toTwoDigit(num){
		return num < 10 ? "0" + num : num;
	},
	//时间格式化
	timeFormat(time){
		let dateObj = this.formatDate(time);
		if (!dateObj) {
			return "";
		}
		let {year, month, date} = dateObj;
		return year + "." + month + "." + date;
	},
	//具体时间格式化
	detailFormat(time){
		let dateObj = this.formatDate(time);
		if (!dateObj) {
			return "";
		}
		let {year, month, date, hour, minute, second} = dateObj;
		return `${year}-${month}-${date} ${hour}:${minute}:${second}`;
	},
	//格式化中文时间
	cnFormat(time){
		let dateObj = this.formatDate(time);
		if (!dateObj) {
			return "";
		}
		let {month, date, hour, minute} = dateObj;
		return `${month}月${date}日${hour}:${minute}`

	},

};

//函数节流
export function throttle(fn, wait) {
	let _self = fn,
		timer,
		args,
		firstTime = true;
	return function () {
		let _me = this;
		args = arguments;
		if (firstTime) {
			_self.apply(_me, args);
			return firstTime = false;
		}
		if (timer) {
			return false;
		}
		timer = setTimeout(function () {
			clearTimeout(timer);
			timer = null;
			_self.apply(_me, args);
		}, wait || 500);
	}
}

//函数延迟
export function delay(fn, wait) {
	let _self = fn,
		timer,
		args;
	return function () {
		let _me = this;
		args = arguments;
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			clearTimeout(timer);
			timer = null;
			_self.apply(_me, args);
		}, wait || 500);
	}
}

export let browser = {
	versions: function () {
		let u = navigator.userAgent,
			app = navigator.appVersion;
		return {
			trident: u.indexOf('Trident') > -1, //IE内核
			presto: u.indexOf('Presto') > -1, //opera内核
			webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
			gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
			mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
			ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
			android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
			iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
			iPad: u.indexOf('iPad') > -1, //是否iPad
			webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
			weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
			qq: u.match(/\sQQ/i) == " qq", //是否QQ
			safari: u.indexOf("Safari") > -1 && u.indexOf("Chrome") < 1  //判断是否Safari浏览器
		};
	}(),
	language: (navigator.browserLanguage || navigator.language).toLowerCase()
}

export function urlReplace(url) {
	if (/^http/g.test(url)) {
		window.location.replace(url);
	} else {
		browserHistory.replace(url);
	}
}

//最多保留两位小数，去除小数点后多余的0
export const trimZero = (price) => {
	return Number.parseFloat(Number.parseFloat(price).toFixed(2));
};