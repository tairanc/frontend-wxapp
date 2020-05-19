import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Shady} from './common.jsx';
import {browserHistory} from 'react-router';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import {urlReplace} from 'js/common/utils';
import {setCookie} from 'js/common/cookie';
import {UCENTER, UCAPPID, WXAPI} from 'config/index';
import axios from 'axios';
import './module.scss';
import Popup from "./modal2";

const pageApi = {
    uc_phoneExist: (phone) => { return {url: `${UCENTER}/user/phone_${phone}/exists`, method: "post"} },
    uc_sendCode: {url: `${UCENTER}/mock/send_code`, method: 'post'},    //发送手机验证码
    uc_loginOrRegister: {url: `${UCENTER}/login/quick_login_register`, method: 'post'},   //登录注册一体
    uc_wxBind: {url: `${UCENTER}/login/wechat/bind?platform=MEDIA_PLATFORM`, method: 'post'}, //微信授权绑定
    uc_isLogin: {url: `${UCENTER}/user`}, //是否登录
    uc_logout: {url: `${UCENTER}/user/logout`, method: 'post'},  //退出登录
    setOpenId: {url: `${WXAPI}/userBind`}   //设置openid
};
const createActionsLogin = concatPageAndType("userLogin");
const createActionsGlobal = concatPageAndType("global");

class LoginPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            phone: "",
            validateCode: "",
            phoneFocus: false,
            codeFocus: false,
            canSend: false,
            sending: false,
            countDown: 60,
            canSure: false,
            isRegister: false
        };
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    //检查手机号
    changePhone = (e) => {
        let phone = e.target.value;
        if (phone.length > 11) return;
        this.setState({phone: phone});
        if (phone.length === 11) {
            this.setState({canSend: true});
        } else {
            this.setState({canSend: false});
        }
        this.checkCanSure();
    };

    changeValidate = (e) => {
        let validate = e.target.value;
        if (validate.length > 4) return;
        this.setState({validateCode: validate});
        this.checkCanSure();
    };

    //清空手机输入框
    clearPhone = () => {
        this.setState({phone: ""});
        this.checkCanSure();
    };
    clearValidate = () => {
        this.setState({validateCode: ""});
        this.checkCanSure();
    };

    //手机号是否正确
    checkTel = (tel)=> {
        if(!(/^1[34578]\d{9}$/.test(tel))) {
            Popup.MsgTip({ msg: "请输入正确的手机号码" });
            return false;
        }else {
            this.setState({telCorrect: true});
            return true;
        }
    };

    focusCtrl = (type, value) => {
        this.setState({[type + 'Focus']: value});
    };

    checkCanSure = () => {
        setTimeout(() => {
            let {phone, validateCode} = this.state;
            if (phone.length === 11 && validateCode.length === 4) {
                this.setState({canSure: true});
            } else {
                this.setState({canSure: false});
            }
        }, 0);
    };
    //发送验证码
    sendValidate = () => {
        let {phone} = this.state;
        if(!this.checkTel(phone)){
            return
        }
        let interval = () => {
            let {countDown} = this.state;
            if (countDown > 1) {
                this.setState({countDown: countDown - 1});
                return;
            }
            clearInterval(this.timer);
            this.setState({sending: false, countDown: 60});
        };
        this.setState({sending: true});
        this.timer = setInterval(interval, 1000);

        let {dispatch} = this.props;
        //验证手机号是否存在
        axios.request({
            ...pageApi.uc_phoneExist(phone),
            params: {
                //phone: phone,
                appid: UCAPPID
            }
        }).then(({data}) => {
            if (data.code !== "200") {
                this.setState({phoneExist: data.body})
            }
        }).catch(error => {
            console.log(error);
        });
        //发送手机验证码
        axios.request({
            ...pageApi.uc_sendCode,
            data: {
                appId: UCAPPID,
                phone: phone,
                usage: "QUICK_LOGIN_REGISTER"
            }
        }).then(({data}) => {
            if (data.code !== "200") {
                dispatch(createActionsLogin('ctrlPrompt', {prompt: true, msg: data.message}));
            }
        }).catch(error => {
            console.log(error);
            dispatch(createActionsLogin('ctrlPrompt', {prompt: true, msg:'服务器繁忙'}));
            throw new Error(error);
        })
    };

    //注册
    sendRegister = () => {
        this.setState({isRegister: true});
        let {phone, validateCode, phoneExist} = this.state;
        let {from, invite} = this.props;
        let {dispatch} = this.props;

        if (from === "ecard_red_jr") {
            //快速注册
            axios.request({
                ...pageApi.uc_loginOrRegister,
                headers: {'X-Platform-Info': 'WECHAT'},
                data: {
                    appId: UCAPPID,
                    phone: phone,
                    phoneCode: validateCode,
                    inviteCode: invite
                }
            }).then(({data}) => {
                if (data.code === "200") {
                    let token = data.body.token;
                    this.setState({isRegister: false});
                    setCookie('token', token);
                    dispatch(createActionsGlobal('changeLogin', {login: true}));

                    /*判断是新、老用户*/
                    let user = phoneExist ? "old" : "new";
                    let redirect_uri = decodeURIComponent(this.props.redirect_uri);
                    if (/\?/.test(this.props.redirect_uri)) {
                        redirect_uri = redirect_uri + "&user=" + user;
                    } else {
                        redirect_uri = redirect_uri + "?user=" + user;
                    }
                    let { ident, openId } = this.props;

                    //绑定微信
                    axios.request({
                        ...pageApi.uc_wxBind,
                        headers: {'Authorization': "Bearer " + token},
                        data: {ident: ident}
                    }).then(({data}) => {
                        if (data.code === "200") {
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
                        } else {
                            dispatch(createActionsLogin("ctrlPrompt", {prompt: true, msg: data.message}));
                        }
                    }).catch(error => {
                        console.log('error',error);
                        this.setState({isRegister: false});
                        dispatch(createActionsLogin("ctrlPrompt", {prompt: true, msg: "服务器繁忙"}));
                        urlReplace( redirect_uri );
                        throw new Error(error);
                    })
                } else {
                    this.setState({isRegister: false});
                    dispatch(createActionsGlobal('changeLogin', {login: false}));
                    dispatch(createActionsLogin("ctrlPrompt", {prompt: true, msg: data.message}));
                    urlReplace(this.props.redirect_uri);
                }
            }).catch(error => {
                console.log(error);
                this.setState({isRegister: false});
                dispatch(createActionsLogin('ctrlPrompt', {prompt: true, msg: "服务器繁忙"}));
                urlReplace( redirect_uri );
                throw new Error(error);
            })
        } else {
            axios.request({
                ...pageApi.uc_loginOrRegister,
                data: {
                    appId: UCAPPID,
                    phone: phone,
                    phoneCode: validateCode,
                    inviteCode: invite
                }
            }).then(({data}) => {
                if(data.code==="200"){
                    let { token } = data.body;
                    let { ident, openId, redirect_uri } = this.props;

                    setCookie('token', token);
                    this.setState({isRegister: false});

                    //绑定泰然城和微信
                    axios.request({
                        ...pageApi.uc_wxBind,
                        headers: { 'Authorization': "Bearer " + token },
                        params: { ident: ident }
                    }).then(({data}) => {
                        if(data.code==="200"){
                            dispatch(createActionsGlobal('changeLogin', {login: true}));
                        }
                        //传openId给服务器
                        axios.request({
                            ...pageApi.setOpenId,
                            params:{ openid:  openId }
                        }).then( ()=>{
                            window.location.replace(redirect_uri);
                        }).catch( error =>{
                            console.log( error );
                            window.location.replace(redirect_uri);
                        });
                    }).catch(error => {
                        console.log('error',error);
                        this.setState({isRegister: false});
                        dispatch(createActionsLogin("ctrlPrompt", {prompt: true, msg: "服务器繁忙"}));
                        urlReplace( redirect_uri );
                        throw new Error(error);
                    })
                } else {
                    this.setState({isRegister: false});
                    dispatch(createActionsGlobal('changeLogin', {login: false}));
                    dispatch(createActionsLogin("ctrlPrompt", {prompt: true, msg: data.message}));
                    //urlReplace(this.props.redirect_uri);
                }
            }).catch(error => {
                console.log(error);
                this.setState({isRegister: false});
                dispatch(createActionsLogin('ctrlPrompt', {prompt: true, msg: "服务器繁忙"}));
                urlReplace( redirect_uri );
                throw new Error(error);
            })
        }

        /*		if( from === "ecard_red_jr"){
                    //快速注册
                    axios.request({
                        ...pageApi.fastLogin,
                        data:{
                            phone:phone,
                            code: validateCode,
                            inviteCode: invite
                        }}).then( result =>{
                            this.setState({ isRegister:false });

                            let user = result.data.isNew ? "new":"old";
                            let redirect_uri = decodeURIComponent( this.props.redirect_uri );
                            if( /\?/.test( this.props.redirect_uri ) ){
                                redirect_uri = redirect_uri + "&user=" + user;
                            }else{
                                redirect_uri = redirect_uri + "?user=" + user;
                            }

                            //绑定微信
                            axios.request({ ...pageApi.bind, data:{ oauthWebToken: this.props.token  } })
                                .then( result =>{

                                    //绑定之后判断有没有登录
                                    axios.request( pageApi.isLogin )
                                        .then( result =>{
                                            if( result.data.isLogined ==="true" ){
                                                dispatch( createActionsGlobal('changeLogin',{ login:true }) );

                                                //登录之后获取openId
                                                axios.request( pageApi.getOpenId )
                                                    .then( result =>{

                                                        setCookie( 'openId', result.data.openid );

                                                        //传openId给服务器
                                                        axios.request({ ...pageApi.setOpenId, params:{ openid:  result.data.openid }})
                                                            .then( result =>{
                                                                urlReplace(  redirect_uri )
                                                            }).catch( error =>{
                                                            urlReplace(  redirect_uri )
                                                        })

                                                    }).catch( error =>{
                                                    error = error.response.data.error;
                                                    dispatch(createActionsLogin( "ctrlPrompt",{ prompt:true, msg:error.description }));
                                                });
                                            }else{
                                                dispatch( createActionsGlobal('changeLogin',{ login:false }) );
                                                urlReplace(  this.props.redirect_uri )
                                            }
                                        }).catch( error =>{
                                        urlReplace(  this.props.redirect_uri )
                                    });

                                }).catch( error =>{
                                    error = error.response.data.error;
                                    if( error.code === 200442 ){
                                        axios.request({ ...pageApi.loginOut }).then( result =>{
                                            console.log("登出成功");
                                        }).catch( error =>{
                                            console.log("登出失败");
                                        })
                                    }
                                    dispatch(createActionsLogin( "ctrlPrompt",{ prompt:true, msg:error.description }));
                                    throw new Error(error);
                            })

                        }).catch( error =>{
                            this.setState({isRegister:false});
                            error = error.response.data.error;
                            dispatch(createActionsLogin( "ctrlPrompt",{ prompt:true, msg:error.description }));
                    })

                }else{
                    axios.request({ ...pageApi.register, data:{ phone:phone,code:validateCode }})
                        .then( result =>{
                            this.setState({ isRegister:false });
                            //绑定泰然城和微信
                            axios.request({ ...pageApi.bind, data:{ oauthWebToken: this.props.token  }})
                                .then( result =>{

                                    //绑定之后判断有没有登录
                                    axios.request( pageApi.isLogin )
                                        .then( result =>{
                                            if( result.data.isLogined ==="true" ){
                                                dispatch( createActionsGlobal('changeLogin',{ login:true }) );

                                                //登录之后获取openId
                                                axios.request( pageApi.getOpenId )
                                                    .then( result =>{

                                                        setCookie( 'openId', result.data.openid );

                                                        //传openId给服务器
                                                        axios.request({ ...pageApi.setOpenId, params:{ openid:  result.data.openid }})
                                                            .then( result =>{
                                                                urlReplace(  this.props.redirect_uri )
                                                            }).catch( error =>{
                                                            urlReplace(  this.props.redirect_uri )
                                                        })

                                                    }).catch( error =>{
                                                    error = error.response.data.error;
                                                    dispatch(createActionsLogin( "ctrlPrompt",{ prompt:true, msg:error.description }));
                                                });
                                            }else{
                                                dispatch( createActionsGlobal('changeLogin',{ login:false }) );
                                                urlReplace(  this.props.redirect_uri )
                                            }
                                        }).catch( error =>{
                                        urlReplace(  this.props.redirect_uri )
                                    });

                                }).catch( error => {
                                error = error.response.data.error;
                                if( error.code === 200442 ){
                                    axios.request({ ...pageApi.loginOut }).then( result =>{
                                        console.log("登出成功");
                                    }).catch( error =>{
                                        console.log("登出失败");
                                    })
                                }
                                dispatch(createActionsLogin( "ctrlPrompt",{ prompt:true, msg:error.description }));
                                throw new Error(error);
                            })

                        }).catch( (error )=>{
                            this.setState({isRegister:false});
                            let errorMsg = error.response.data.error;
                            dispatch( createActionsLogin('ctrlPrompt',{ prompt:true, msg:errorMsg.description } ) );
                            throw new Error( error );
                    })
                }*/
    };


    render() {
        const {phone, validateCode, phoneFocus, codeFocus, canSend, sending, countDown, canSure, isRegister} = this.state;
        return (
            <div data-comp="login-popup">
                <div className="login-popup">
                    <h3>绑定手机更安全</h3>
                    <i className="close-xa-icon" onClick={this.props.popupClose}> </i>
                    <label className="strip-grid phone-input">
                        <div className="icon-grid"><i className="phone-shape-icon"> </i></div>
                        <div className="input-grid">
                            <input type="number" placeholder="请输入手机号码" value={phone} onInput={this.changePhone}
                                   onFocus={(e) => {
                                       this.focusCtrl('phone', true)
                                   }} onBlur={(e) => this.focusCtrl('phone', false)}/>
                            {phone !== "" && phoneFocus &&
                            <i className="close-x-icon" onTouchTap={this.clearPhone}> </i>}
                        </div>
                    </label>
                    <div className="strip-grid">
                        <label className="validate-grid">
                            <div className="icon-grid"><i className="key-shape-icon"> </i></div>
                            <div className="input-grid">
                                <input type="number" placeholder="短信验证码" value={validateCode}
                                       onInput={this.changeValidate} onFocus={(e) => {
                                    this.focusCtrl('code', true)
                                }} onBlur={(e) => this.focusCtrl('code', false)}/>
                                {validateCode !== "" && codeFocus &&
                                <i className="close-x-icon" onTouchTap={this.clearValidate}> </i>}
                            </div>
                        </label>
                        <div className={`send-validate ${ (canSend && !sending) ? 'active' : '' }`}
                             onClick={(canSend && !sending) && this.sendValidate}>
                            {sending ? `${countDown}秒后重发` : "发送验证码"}
                        </div>
                    </div>
                    <div className="login-btn-grid">
                        <div className={`login-btn ${ (canSure && !isRegister) ? "" : "dis"}`}
                             onClick={canSure && !isRegister && this.sendRegister}>确认
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export const LoginPopupModule = connect()(LoginPopup);


