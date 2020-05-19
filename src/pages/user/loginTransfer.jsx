import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import {connect} from 'react-redux';
import { LoginPopupModule } from 'component/module.jsx';
import { PopupTip } from 'component/modal.jsx';
import {concatPageAndType,actionAxios } from 'js/actions/actions';
import { urlReplace } from 'js/common/utils';
import { setCookie } from 'js/common/cookie';
import { UCENTER,UCAPPID,WXAPI } from 'config/index';
import axios from 'axios';

const pageApi = {
	uc_wx: { url: `${UCENTER}/login/wechat` }, //微信授权登录(每次都调用)
    uc_isLogin: { url: `${UCENTER}/user` }, //是否登录
    setOpenId: {url: `${WXAPI}/userBind`}   //设置openid
};

const createActions = concatPageAndType("userLogin");
const createActionsGlobal = concatPageAndType("global");

class UserTransfer extends Component{
	componentWillMount() {
		this.props.getPower();
		this.state = { height: $(window).height() }
	}
	render(){
		return <div>
			{ this.props.showPopup && <div style={{ height:this.state.height, overflow:"hidden",background:"rgba(0,0,0,0.5)"}}>
				<LoginPopupModule {...this.props}  />
			</div> }
			<PopupTip active={ this.props.prompt } msg={this.props.promptMsg } onClose={ this.props.tipClose } />
		</div>
	}
}

function userLoginState( state, props ) {
	return {
		...state.userLogin
	}
}
function userLoginDispatch( dispatch, props ) {
	let { redirect_uri, from, invite } = props.location.query;
	redirect_uri = redirect_uri ? redirect_uri : "/homeIndex";
	return {
		redirect_uri:redirect_uri,
		from:from,
		invite: invite,
        getPower:function () {
            let { code,state } = props.location.query;
            if( code ){
            	//微信授权登录
                axios.request({
                    ...pageApi.uc_wx,
                    params:{
                        code:code,
                        appId:UCAPPID,
                        returnBy:'JSON',
                        platform: 'MEDIA_PLATFORM'
                    }
                }).then( ({data}) => {
                    if (data.code === "200" ) {
                        let { ident, token, extraInfo:{openId} } = data.body;
                        setCookie( 'openId', openId );
                        dispatch(createActions('addIdentAndOpenid', { ident:ident, openId:openId }));  //添加参数ident、openid

                        if(data.body && token){
                            setCookie('token', token);
                            dispatch(createActions('addToken', {token: token}));
                            dispatch(createActionsGlobal('changeLogin', {login: true}));

                            //传openId给服务器
                            axios.request({
                                ...pageApi.setOpenId,
                                params:{ openid:  openId }
                            }).then( ()=>{
                                window.location.replace(redirect_uri);
                                //urlReplace( redirect_uri );
                            }).catch( error =>{
                                console.log( error );
                                window.location.replace(redirect_uri);
                                //urlReplace( redirect_uri );
                            });
                        }else{
                            //登录成功，没有token，跳转登录
                            dispatch( createActionsGlobal('changeLogin',{ login:false }) );
                            dispatch(createActions('ctrlPopup', {status: true}));//登录并绑定
                        }
                    } else {
                        //登录接口出错
                        dispatch( createActionsGlobal('changeLogin',{ login:false }) );
                        dispatch( createActions('ctrlPrompt',{ prompt:true, msg:data.message||"服务器繁忙" } ) );
                        urlReplace( redirect_uri )
                    }
                }).catch(error=>{
                    console.log(error);
					dispatch( createActions('ctrlPrompt',{ prompt:true, msg:"服务器繁忙" } ) );
                    throw new Error( error );
				});
            }
        },
		
		/*getPower2:function () {
			let { code,state } = props.location.query;
			if( code ){
				axios.request({
					...pageApi.getPower,
					data:{ code:code, state:state }
				}).then( result => {
					//判断有没有登录
					if( result.data.isBind ){//该微信帐号是否已经被绑定，若为true则将获取登陆状态
						axios.request( pageApi.isLogin )
							.then( result =>{
								if( result.data.isLogined==="true" ){
									dispatch( createActionsGlobal('changeLogin',{ login:true }) );
								}else{
									dispatch( createActionsGlobal('changeLogin',{ login:false }) );
								}
								
								//登录之后获取openId
								axios.request( pageApi.getOpenId )
									.then( result =>{
										setCookie( 'openId', result.data.openid );
										//传openId给服务器
										axios.request({ ...pageApi.setOpenId, params:{ openid:  result.data.openid }})
											.then( result =>{
												urlReplace( redirect_uri )
											}).catch( error =>{
											urlReplace( redirect_uri );
											console.log( error );
										})
										
									}).catch( error =>{
									error = error.response.data.error;
									dispatch( createActions( "ctrlPrompt",{ prompt:true, msg:error.description }));
									urlReplace( redirect_uri );
								});
								
							}).catch( error =>{
							urlReplace( redirect_uri );
						});
					}else{
						dispatch( createActions('addToken',{ token: result.data.oauthWebToken }));
						dispatch( createActions('ctrlPopup',{ status: true }) );
					}}).catch( error =>{
						let errorMsg = error.response.data.error;
						dispatch( createActions('ctrlPrompt',{ prompt:true, msg:errorMsg.description } ) );
						throw new Error( error );
					});
			}
		},*/
		popupClose:function () {
			window.history.go( -2 );
		},
		tipClose:function () {
			dispatch( createActions('ctrlPrompt',{ prompt:false,msg:""}) );
		}
	}
}


export default connect( userLoginState,userLoginDispatch )( UserTransfer );