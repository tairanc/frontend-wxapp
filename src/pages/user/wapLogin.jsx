import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import Popup from 'component/modal2';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {connect} from 'react-redux';
import { UCENTER, UCGEE, UCAPPID,DIR } from 'config/index';
import { getCookie,setCookie } from 'js/common/cookie';
import axios from 'axios';
import './wapLogin.scss';

const axiosCreator = actionAxios('wapLoginIndex');
const createActions = concatPageAndType('global');

const pageApi = {
    /*uc前缀为用户中心接口*/
    uc_loginOrReg: { url: `${UCENTER}/login/quick_login_register`, method: 'post' },   //登录注册一体
    uc_phoneExist: (tel) => { return { url: `${UCENTER}/user/phone_${tel}/exists` }},    //验证手机号是否注册
    uc_sendCode: { url: `${UCENTER}/mock/send_code`, method: 'post' },    //发送手机验证码
    uc_loginByPwd: { url: `${UCENTER}/login/phone`, method: 'post' },  //密码登录
    uc_geeInit: (tel) => { return {url: `${UCGEE}/gee/getChallenge?addressIp=${tel}&t=${(new Date()).getTime()}` }}, // 加随机数防止缓存
    uc_geeVerify: { url: `${UCGEE}/gee/verifyLogin`, method: 'post' } //极验初始化
};

//WAP登录
export class WapLogin extends Component{
    constructor(props) {
        super(props);
        this.state = {
            selCode: true,
            redirect_uri: this.props.redirect_uri,
            params: this.props
        }
    }

    //选择验证码登录
    codeHandle = ()=> {
        this.setState({ selCode: true });
    };

    //选择密码登录
    pwdHandle = ()=> {
        this.setState({ selCode: false });
    };

    render(){
        let {selCode,redirect_uri,params} = this.state;
        return (
            <div data-page="wap-login" style={{minHeight: $(window).height()}}>
                <div className="page-logo">
                    <img src="/src/img/user/trc-logo.png"/>
                </div>
                <div className="c-tc">
                    <div className="login-method" onClick={this.codeHandle}>
                        <span>验证码登录</span>
                        <div className="split-line code" style={selCode?{"background":"#e60a30"}:{}}></div>
                    </div>
                    <div className="login-method" onClick={this.pwdHandle}>
                        <span>密码登录</span>
                        <div className="split-line pwd" style={selCode?{}:{"background":"#e60a30"}}></div>
                    </div>
                </div>
                { selCode ?
                    <CodeLogin changeLogin={this.props.changeLogin} params={params}/>
                    :
                    <PwdLogin changeLogin={this.props.changeLogin} redirect_uri={redirect_uri}/>
                }
            </div>
        );
    }
}

//验证码登录
class CodeLogin extends Component{
    constructor(props){
        super(props);
        this.state={
            count: 60,
            codeSend: false,
            telCorrect: false,
            inputComp: false,
            isNew: false
        };
    }

    componentWillUnmount(){
        clearInterval(this.timer);
    }

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

    //验证码是否正确
    checkCode = (code)=> {
        if(!(/^\d{4}$/.test(code))) {
            Popup.MsgTip({ msg: "验证码不正确" });
            return false;
        }else {
            return true;
        }
    };

    //初始化极验验证码
    loadCaptchas = (tel) => {
        axios.request(pageApi.uc_geeInit(tel)).then(data=>{
            if(data.status===200){
                let res  = data.data;
                initGeetest({
                    // 以下 4 个配置参数为必须，不能缺少
                    gt: res.gt,
                    challenge: res.challenge,
                    offline: !res.success, // 表示用户后台检测极验服务器是否宕机
                    new_captcha: res.serverStatus, // 用于宕机时表示是新验证码的宕机
                    product:  "bind",//"float", // 产品形式，包括：float，popup
                }, this.handlerEmbed);
                this.setState({serverStatus: res.serverStatus});
            }
        }).catch(err=>{
            console.log(err);
            Popup.MsgTip({ msg: '服务器繁忙' })
        })
    };

    //极验验证
    handlerEmbed = (captchaObj) => {
        let self = this;
        captchaObj.onError(function () {
            Popup.MsgTip({
                msg: "验证错误"
            });
        }).onSuccess(function () {
            let result = captchaObj.getValidate();
            let { serverStatus } = self.state;
            let tel = $("#tel").val().replace(/\s+/g,'');
            if (!result) {
                Popup.MsgTip({  msg: "请完成验证" });
            }
            axios.request({
                ...pageApi.uc_geeVerify,
                data: {
                    challenge: result.geetest_challenge,
                    validate: result.geetest_validate,
                    seccode: result.geetest_seccode,
                    addressIp: tel,
                    serverStatus:serverStatus
                }
            }).then(data=>{
                if (data.status !== 200) {
                    captchaObj.reset();
                }
            }).catch(err=>{
                console.log(err);
                Popup.MsgTip({ msg: '服务器繁忙' })
            });
            self.nextHandle();
        });
        if (captchaObj) {
            this.setState({ captchaObj: captchaObj });
        }
    };

    //下一步
    nextHandle = () => {
        let tel = $("#tel").val().replace(/\s+/g,'');
        let { count,codeSend } = this.state;
        if(!codeSend){
            $(".get-code").addClass("countdown").removeClass("send-code");
            this.setState({
                codeSend: true
            });

            this.timer = setInterval(function(){
                --count;
                codeSend = true;
                if(count === 0){
                    count = 60;
                    codeSend = false;
                    clearInterval(this.timer);
                    $(".get-code").addClass("send-code").removeClass("countdown");
                }
                this.setState({
                    count: count,
                    codeSend: codeSend
                });
            }.bind(this),1000);

            let self = this;
            //请求验证码
            axios.request({
                ...pageApi.uc_sendCode,
                data:{
                    appId: UCAPPID,
                    phone: tel,
                    usage: 'QUICK_LOGIN_REGISTER'
                }
            }).then(({data})=>{
                if(data.code === '200'){
                    Popup.MsgTip({msg: "验证码已发送"});
                }else {
                    Popup.MsgTip({msg: data.message});
                }
            }).catch(()=>{
                Popup.MsgTip({msg: "服务器繁忙"});
            });

            //验证手机号是否已注册
            axios.request({
                ...pageApi.uc_phoneExist(tel),
                params: { appId: UCAPPID }
            }).then(({data})=>{
                if(data.code === '200'){
                    self.setState({isNew: !data.body});
                }
            }).catch(()=>{
                Popup.MsgTip({msg: "服务器繁忙"});
            });
        }
    };

    //获取验证码倒计时
    getCode = ()=> {
        let tel = $("#tel").val().replace(/\s+/g,'');

        if (!this.checkTel(tel)) {
            return;
        }
        this.loadCaptchas(tel);
        this.getCatcha();
    };

    //循环测试极验是否初始化成功
    getCatcha = ()=>{
        //debugger
        let {captchaObj} = this.state;
        if(captchaObj){
            captchaObj.verify();
        }else{
            setTimeout(this.getCatcha, 1000);
        }
    };

    //监测输入框改变
    changeHandle = ()=>{
        let tel = $("#tel").val().replace(/\s+/g,''),
            code = $("#code").val().replace(/\s+/g,'');

        if( tel.length === 11 && code ){
            this.setState({
                inputComp: true
            });
        }else{
            this.setState({
                inputComp: false
            });
        }
    };

    loginHandle = ()=>{
        let tel = $("#tel").val().replace(/\s+/g,''),
            code = $("#code").val().replace(/\s+/g,'');

        //检测手机号、验证码
        if(!(this.checkTel(tel) && this.checkCode(code))) {
            return;
        }
        let { isNew } = this.state;
        let { redirect_uri,invite,from } = this.props.params;

        //invite邀请码有两种，1.cf开头的字符串2.加密手机号
        if(from==="ecard_red_jr" && isNew){
            if(/^TRC_/ig.test(invite)){
                invite = ""+parseInt(invite.substring(4))/7; //手机号解码
            }
        }

        //注册登录一体
        let self = this;
        axios.request({
            ...pageApi.uc_loginOrReg,
            headers: {'X-Platform-Info': 'H5'},
            data:{
                appId: UCAPPID,
                //inviteCode: invite||"",
                phone: tel,
                phoneCode : code
            }
        }).then(({data})=>{
            if(data.code==="200"){
                Popup.MsgTip({ msg: "成功" });
                setCookie( 'token', data.body.token );
                self.props.changeLogin(true);
                if(redirect_uri && from==="ecard_red_jr" || !(/\?/.test(redirect_uri))){
                    window.location.replace(redirect_uri);
                }else if(/\?/.test(redirect_uri)){
                    window.location.replace(redirect_uri+`&user=${isNew?'new':'old'}`)
                }else {
                    browserHistory.goBack();
                }
            }else {
                Popup.MsgTip({msg: data.message});
            }
        }).catch((error)=>{
            console.log(error);
            self.props.changeLogin(false);
        });
    };

    //删除手机号码输入框的值
    delHandle = (e)=> {
        $(e.target).prev().val("").focus();
        this.setState({ inputComp: false });
    };

    //限制输入数字
    onlyNum = ()=> {
        $("#tel").val($("#tel").val().replace(/\D/g,''));
        $("#code").val($("#code").val().replace(/\D/g,''));
    };

    render(){
        let { count,codeSend,inputComp,telCorrect } = this.state;
        let cntTxt = codeSend ? `${count}s后重发` : "获取验证码";
        let tel = $("#tel").val();
        return(
            <div className="input-area">
                <div className="input-info c-pr">
                    <input type="text" id="tel" placeholder="泰然城账号/手机号码" maxLength="11" onChange={this.changeHandle}
                           onKeyUp={this.onlyNum} onPaste={this.onlyNum} />
                    <img className={`del-icon ${tel?'':'c-dpno'}`} src="/src/img/user/delete.png" onClick={this.delHandle}/>
                </div>

                <div className="input-info c-pr">
                    <input type="text" id="code" placeholder="请输入验证码" maxLength="4" onChange={this.changeHandle}
                           onKeyUp={this.onlyNum} onPaste={this.onlyNum} />
                    <span className="get-code c-tc send-code" onClick={this.getCode} disabled={!(telCorrect && codeSend)}>
                        {cntTxt}{/*验证码*/}
                    </span>
                </div>

                <input type="button" className="submit-btn c-tc" style={{background:(inputComp ? "#353535" : "#c9c9c9")}}
                       disabled={!inputComp} value="登录" onClick={this.loginHandle}/>
            </div>
        );
    }
}

//密码登录
class PwdLogin extends Component{
    constructor(props){
        super(props);
        this.state = {
            tel: '',
            showPwd: false,
            inputComp: false
        };
    }

    //密码显示或隐藏
    pwdToggle = ()=> {
        this.setState({
            showPwd: !this.state.showPwd
        });
    };

    //手机号是否正确
    checkTel = (tel)=> {
        if(!(/^1[34578]\d{9}$/.test(tel.trim()))) {
            Popup.MsgTip({ msg: "请输入正确的手机号码" });
            return false;
        }else {
            this.setState({telCorrect: true});
            return true;
        }
    };

    //检测密码
    checkPwd = (pwd)=> {
        if(!(/^[\x21-\x7E]{6,20}$/)) {
            Popup.MsgTip({ msg: "密码不正确" });
            return false;
        }else {
            return true;
        }
    };

    changeHandle = ()=>{
        let tel = $("#tel").val().replace(/\s+/g,''),
            pwd = $("#pwd").val().replace(/\s+/g,'');

        if( !tel ){
            this.setState({ tel: '' });
        }else{
            this.setState({ tel: tel });
        }
        if( tel.length === 11 && pwd.length >= 6 ){
            this.setState({ inputComp: true });
        }else{
            this.setState({ inputComp: false });
        }
    };

    //登录
    loginHandle = ()=>{
        let tel = $("#tel").val().replace(/\s+/g,''),
            pwd = $("#pwd").val().replace(/\s+/g,'');

        //检测手机号、密码
        if(!(this.checkTel(tel) && this.checkPwd(pwd))) {
            return;
        }

        let {redirect_uri} = this.props;
        let self = this;
        //密码登录
        axios.request({
            ...pageApi.uc_loginByPwd,
            data: {
                appId: UCAPPID,
                encryptFlag: false,
                password: pwd,
                phone: tel,
            }
        }).then(({data})=>{
            if(data.code==="200"){
                Popup.MsgTip({ msg: "登录成功" });
                //在cookie中设置token
                setCookie( 'token', data.body.token );
                self.props.changeLogin(true);
                redirect_uri? window.location.replace(redirect_uri):window.history.go(-1);
            }else{
                Popup.MsgTip({ msg: data.message });
            }
        }).catch(({error})=>{
            console.log(error);
            Popup.MsgTip({ msg: "服务器繁忙" });
            self.props.changeLogin(false);
        });
    };

    //删除手机号码输入框的值
    delHandle = (e)=> {
        $(e.target).prev().val("").focus();
        this.setState({ inputComp: false });
    };

    //限制输入数字
    onlyNum = ()=> {
        $("#tel").val($("#tel").val().replace(/\D/g,''));
    };

    render(){
        let { tel,showPwd,inputComp } = this.state;

        return(
            <div className="input-area">
                <div className="input-info c-pr">
                    <input type="text" id="tel" placeholder="请输入手机号码/泰然城账号" maxLength="11" onChange={this.changeHandle}
                           onKeyUp={this.onlyNum} onPaste={this.onlyNum} />
                    <img className={`del-icon ${ tel ? '':'c-dpno'}`} src="/src/img/user/delete.png" onClick={this.delHandle}/>
                </div>

                <div className="input-info c-pr">
                    <input type={`${showPwd ? 'text':'password'}`} id="pwd" placeholder="请输入密码" maxLength="20"
                           onChange={this.changeHandle} />
                    {showPwd ?
                        <img className="eye-open" src="/src/img/user/eye-open.png" onClick={this.pwdToggle}/>:
                        <img className="eye-close" src="/src/img/user/eye-close.png" onClick={this.pwdToggle}/>}
                </div>

                <input type="button" className="submit-btn c-tc" style={{background:(inputComp ? "#353535":"#c9c9c9")}}
                       disabled={!inputComp} value="登录" onClick={this.loginHandle}/>

                <Link to={`${DIR}/forgetPwd`}>
                    <div className="forget-btn">忘记密码</div>
                </Link>
            </div>
        );
    }
}

export function wapLoginState(state, props) {
    return {
        ...state.wapLoginIndex
    }
}

export function wapLoginDispatch(dispatch, props) {
    return {
        changeLogin: function (tof) {
            dispatch(createActions('changeLogin', {login: tof}));
        }

    }
}

export default connect(wapLoginState, wapLoginDispatch)(WapLogin);
