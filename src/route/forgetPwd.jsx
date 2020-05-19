export default ( nextState, callback )=> {
	require.ensure([], (require) => {
        //window.returnIp = require('http://pv.sohu.com/cityjson');  //获取主机IP，标识用户身份，作为极验addressId参数值
		require('plugin/secCaptcha.js');
        //require('plugin/secCaptcha.js');
		callback(null, require('pages/user/forgetPwd.jsx').default);
	}, "forgetPwd");
}