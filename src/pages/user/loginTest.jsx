import React, {Component} from 'react';
import axios from 'axios';
// import Events from 'js/util/event';

// let events = new Events();

export default class LoginTest extends Component {
	constructor(props) {
		super(props);
		this.phone = "";
		this.pw = "";
	/*/!*	events.on("myClick",this.fun1 )
			.all("myClick1","myClick2", this.fun3 )
			.emit( "myClick", "ahaha","arg2" )
			.emitAll("myClick1","myClick2")
			.remove("myClick", this.fun3, this.fun4 )*!/
		events.once("myClick", this.fun1 )
			.emit("myClick", "a","b")
			.emit("myClick", "a","b")
			.once("myClick", this.fun1 )
			.emit("myClick", "c", "d")
			.emit("myClick", "c", "d")
		*/
	}
	fun1( a,b ){
		console.log( a + b )
	}
	fun2(){
		console.log(2)
	}
	fun3(){
		console.log(3)
	}
	fun4(){
		console.log(4)
	}
	fun5(){
		console.log(5)
	}
	componentWillMount() {
		if( window.location.protocol !== "http:"){
			window.location.replace('https://wx.tairanmall.com/home/index');
		}
	}
	phoneHandle = (e) => {
		this.phone = e.target.value;
	};
	pwHandle = (e) => {
		this.pw = e.target.value;
	};
	submitHandle = () => {
		if (this.phone === "" || this.phone.length !== 11 || this.pw === "") {
			alert("账号密码不正确");
			return;
		}
		axios.request({
			url: "/account/user/login",
			method:"post",
			headers:{
				domain:".tairanmall.com",
			},
			data: `phone=${this.phone}&password=${this.pw}`
		}).then( result =>{
			alert("登录成功");
			window.history.back();
		}).catch( error =>{
			alert("登录失败");
		})
	}
	
	resetPW =()=>{
		axios.request({
			url:"/account/user/reset/password/login_password",
			method:"put",
			headers:{
				'Content-Type':'application/x-www-form-urlencoded'
			},
			data:`phone=${this.phone}&newPassword=${this.pw}&smsCode=1311&type=thw_sms_dlmm`
		}).then( result =>{
			alert("重置成功");
		}).catch( error =>{});
	}
	
	unBindWeixin(){
		axios.request({
			url:"/account/user/oauth/bind/weixin",
			method:"delete"
		}).then( result =>{
			alert("解绑成功");
		})
	}
	registerAccount=()=>{
		axios.request({
			url:"/account/user/register",
			method:"post",
			data:`phone=${this.phone}&password=${this.pw}&smsCode=1311`
		}).then( result =>{
			alert("注册成功");
		})
	}
	
	loginOut(){
		axios.request({
			url:"/account/user/logout",
			method:"post",
		}).then( result =>{
			alert("退出成功");
		})
	}
	render() {
		return (
			<div>
				<div style={{borderBottom:"1px solid #f4f4f4"}} >
					<div style={{textIndent:"20px", fontSize:"18px",color:"blue" }}>登录</div><br/>
					<div>手机号：<input type="text" placeholder="请输入手机号" onInput={this.phoneHandle }/></div><br/>
					<div>密码：<input type="password" placeholder="请输入密码" onInput={ this.pwHandle }/></div><br/>
				</div>
				<div>
					<div  style={{borderBottom:"1px solid #f4f4f4", padding:"20px"}} >
						<button style={{width: "100px", background: "#ccc"}} type="button" onClick={ this.submitHandle }>登录</button>
					</div>
					<div  style={{borderBottom:"1px solid #f4f4f4", padding:"20px"}} >
						<button style={{width: "100px", background: "#ccc"}} type="button" onClick={ this.resetPW }>重置密码</button>
					</div>
					<div  style={{borderBottom:"1px solid #f4f4f4", padding:"20px"}} >
						<button style={{width: "100px", background: "#ccc"}} type="button" onClick={ this.registerAccount }>注册账号</button>
					</div>
				</div>
				<div>
					<div style={{textIndent:"20px", fontSize:"18px",color:"blue" }}>无表单</div>
					<div  style={{borderBottom:"1px solid #f4f4f4", padding:"20px"}} >
						<button style={{width: "100px", background: "#ccc"}} type="button" onClick={ this.unBindWeixin }>微信解除授权</button>
					</div>
					<div  style={{borderBottom:"1px solid #f4f4f4", padding:"20px"}} >
						<button style={{width: "100px", background: "#ccc"}} type="button" onClick={ this.loginOut }>退出登录</button>
					</div>
				</div>
			</div>
		)
	}
}
