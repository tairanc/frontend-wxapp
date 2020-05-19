import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import styles from './login.scss';
import { browser } from 'js/common/utils.js';
import WapLogin from './wapLogin.jsx';

//用户登录
export default class UserLogin extends Component{
	componentWillMount() {
		if(browser.versions.weixin){
			window.location.replace( "https://open.weixin.qq.com/connect/oauth2/authorize?" +
				"appid=wx5c9c135a8f312e74" +
				"&redirect_uri="+this.getRedirect() +
				"&response_type=code" +
				"&scope=snsapi_userinfo" +
				"&state=123#wechat_redirect" );
		}
	}
	
	componentDidMount() {
		$( this.refs.userLogin).css({ minHeight:$(window).height() });
	}
	getRedirect=()=>{
		let { redirect_uri, from, invite } = this.props.location.query;
		from = from ? from :"";
		try{
			if( (/^TRC_/ig).test( invite) ){
				invite = Math.round( Number(invite.slice(4))/7 );
			}
		}catch( error ){
			console.log( error );
			invite = "";
		}
		let redirect = encodeURIComponent( redirect_uri ? redirect_uri:`${DIR}/homeIndex` );
		//测试host
		let host = window.location.origin;//window.location.protocol +"//"+ window.location.host;
		let url = encodeURIComponent( host +"/loginTransfer?"+ "redirect_uri="+ redirect +"&from="+ from +"&invite="+invite );
		return url;
	};
	render(){
		let { redirect_uri,invite,from } = this.props.location.query;
		if(browser.versions.weixin){
			return null;
		}else{
			return	<WapLogin redirect_uri={redirect_uri} invite={invite} from={from}/>;
		}
	}
}

class LoginMode extends Component{
	render(){
		const { config } = this.props;
		return (
			<div className={styles.loginModeGrid}>
				<div className={ styles.loginModeTop }>
					<div className={styles.greyLine}> </div>
					<div className={styles.titleText}>{config.title}</div>
				</div>
				<div className={styles.btnGrid}>
					<a href={config.btnUrl} className={`${styles.loginBtn} ${config.btnClass}`}> <i className={`${styles.loginIcon} ${config.iconClass}`}> </i>{config.btnText}</a>
				</div>
			</div>
		
		)
	}
}