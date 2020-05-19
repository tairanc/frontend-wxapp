import axios from 'axios';
import {browserHistory} from 'react-router';
import {miniProgramLogin} from 'js/util/miniProgramLogin';
import Popup from 'component/modal2';
import { getCookie } from 'js/common/cookie';
import popup from "../reducers/popup";

//request拦截器全局加channel_type
axios.interceptors.request.use(config => {
	let {headers,url} = config;
    let _t = new Date().getTime();
    url.indexOf('?') === -1 ? url = `${url}?_t=${_t}` : url = `${url}&_t=${_t}`;
	headers = Object.assign(headers, {"X-Channel": "TrMall", "X-Platform-Type": "TRXCX", "X-Platform-From": "TrMall"});
	// headers = {...headers,"X-Channel":"TrMall", "X-Platform-Type":"WX", "X-Platform-From":"TrMall"};
	config = {...config, headers, url};
	return config;
}, error => {
	return Promise.reject(error);
});

//对返回的状态进行判断
axios.interceptors.response.use(response => {
	if (response.data.code === 401) {
	    if(!getCookie('mini'))
        Popup.MsgTip({msg: "未登录，请在小程序打开"});
		miniProgramLogin(location.href);
		return
	}
	return response
}, error => {
	if (error.response && error.response.data.code === 401) {
        if(!getCookie('mini'))
        Popup.MsgTip({msg: "未登录，请在小程序打开"});
        miniProgramLogin(location.href);
		return
	}
	return Promise.reject(error);
});



export default axios
