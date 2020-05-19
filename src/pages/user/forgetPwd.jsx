import React, {Component} from 'react';
import Popup from 'component/modal2';
import { UCENTER, UCGEE, UCAPPID } from 'config/index';
import { browserHistory } from 'react-router';
import axios from "axios/index";
import './forgetPwd.scss';
import {browser} from "../../js/common/utils";

const pageApi = {
    uc_sendCode: { url: `${UCENTER}/mock/send_code`, method: 'post' },    //发送手机验证码
    uc_resetPwd: { url: `${UCENTER}/password/reset`, method: 'put' },    //重置密码
    uc_phoneExist: (tel) => { return { url: `${UCENTER}/user/phone_${tel}/exists` }},    //验证手机号是否注册
    uc_geeInit: (tel) => { return {url: `${UCGEE}/gee/getChallenge?addressIp=${tel}&t=${(new Date()).getTime()}` }}, // 加随机数防止缓存
    uc_geeVerify: { url: `${UCGEE}/gee/verifyLogin`, method: 'post' } //极验初始化
};

//忘记密码
export default class ForgetPwd extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tel: '',
            code: '',
            nextStep: false,
            inputComp: false
        };
    }

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
            let tel = $("#tel").val().replace(/\s+/g, '');
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

    //手机号是否正确
    checkTel = (tel) => {
        if (!(/^1[34578]\d{9}$/.test(tel))) {
            Popup.MsgTip({msg: "请输入正确的手机号码"});
            return false;
        } else {
            this.setState({telCorrect: true});
            return true;
        }
    };

    changeHandle = () => {
        let tel = $("#tel").val().replace(/\s+/g, '');

        if (tel.length === 11) {
            this.setState({
                tel: tel,
                inputComp: true
            });
        } else {
            this.setState({
                inputComp: false
            });
        }
    };

    //删除手机号码输入框的值
    deleteTel = () => {
        $("#tel").val("").focus();
        this.setState({
            tel: '',
            inputComp: false
        });
    };

    //限制输入数字
    onlyNum = () => {
        $("#tel").val($("#tel").val().replace(/\D/g, ''));
    };


    //获取验证码倒计时
    onClickNext = ()=> {
        let tel = $("#tel").val().replace(/\s+/g,'');

        if (this.checkTel(tel)) {
            //验证手机号是否已注册
            axios.request({
                ...pageApi.uc_phoneExist(tel),
                params: { appId: UCAPPID }
            }).then(({data})=>{
                if(data.code === '200'){
                    //已注册手机号才允许发送忘记密码验证码
                    if(data.body){
                        this.loadCaptchas(tel);
                        this.getCatcha();
                    }else{
                        Popup.MsgTip({msg: "手机号还未注册"});
                    }
                }
            }).catch(err=>{
                console.log(err);
                Popup.MsgTip({msg: "服务器繁忙"});
            });
        }
    };

    //循环测试极验是否初始化成功
    getCatcha = ()=>{
        let {captchaObj} = this.state;
        if(captchaObj){
            captchaObj.verify();
        }else{
            setTimeout(this.getCatcha, 1000);
        }
    };

   /* //下一步
    onClickNext = () => {



        //图形验证码改为极验
        this.loadCaptchas();

        let {captchaObj} = this.state;
        let tel = $("#tel").val().replace(/\s+/g, '');

        //检测手机号、验证码
        if (!(this.checkTel(tel))) {
            return;
        }
        captchaObj && captchaObj.verify();
    };*/

    //  下一步
    nextHandle = () => {
        let tel = $("#tel").val().replace(/\s+/g, '');
        //请求验证码
        axios.request({
            ...pageApi.uc_sendCode,
            data:{
                appId: UCAPPID,
                phone: tel,
                usage: 'RESET_PASSWORD'
            }
        }).then(({data})=>{
            if(data.code === '200'){
                Popup.MsgTip({msg: "验证码已发送"});
                this.setState({nextStep: true});
            }else {
                Popup.MsgTip({msg: data.message});
            }
        }).catch(err=>{
            console.log(err);
            Popup.MsgTip({msg: "服务器繁忙"});
        });
    };

    render() {
        let {tel, inputComp} = this.state;
        return (
            <div data-page="forget-pwd" style={{minHeight: $(window).height()}}>
                {this.state.nextStep ?
                    <SetNewPwd tel={tel}/>
                    :
                    <div className="input-area">
                        <div className="c-pr">
                            <input type="tel" id="tel" placeholder="请输入手机号" maxLength="11" onChange={this.changeHandle}
                                   onKeyUp={this.onlyNum} onPaste={this.onlyNum}/>
                            <img className="del-icon" src="/src/img/user/delete.png" onClick={this.deleteTel}/>
                        </div>

                        <input type="button" className="submit-btn c-tc"
                               style={{background: (inputComp ? "#353535" : "#c9c9c9")}} onClick={this.onClickNext}
                               disabled={!inputComp} value="下一步"/>
                        <p className="promotion">系统会发送验证码到您的手机，请尽快查收</p>
                    </div>
                }
            </div>
        );
    }
}

//设置新密码
class SetNewPwd extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inputComp: false
        };
    }

    //限制输入数字
    onlyNum = () => {
        $("#code").val($("#code").val().replace(/\D/g, ''));
    };

    //验证码是否正确
    checkCode = (code) => {
        if (!(/^\d{4}$/.test(code))) {
            Popup.MsgTip({msg: "验证码不正确"});
            return false;
        } else {
            return true;
        }
    };

    //检测密码
    checkPwd = (pwd) => {
        if (pwd.length < 6) {
            Popup.MsgTip({msg: "新密码长度小于6位，请重新输入"});
            return false;
        } else if (!(/^[\x21-\x7E]{6,20}$/).test(pwd)) {
            Popup.MsgTip({msg: "新密码不能包含特殊字符，请重新输入"});
            return false;
        } else {
            return true;
        }
    };

    //两次密码是否一致
    checkSame = (pwd1, pwd2) => {
        if (pwd1 !== pwd2) {
            Popup.MsgTip({msg: "两次密码不一致"});
            return false;
        } else {
            return true;
        }
    };

    //监听输入框值
    changeHandle = () => {
        let newPwd = $("#new-pwd").val().replace(/\s+/g, ''),
            confirmPwd = $("#confirm-pwd").val().replace(/\s+/g, '');

        if (newPwd && confirmPwd) {
            this.setState({inputComp: true});
        } else {
            this.setState({inputComp: false});
        }
    };

    //完成
    compHandle = () => {
        let code = $("#code").val(),
            newPwd = $("#new-pwd").val(),
            confirmPwd = $("#confirm-pwd").val();

        //检测手机号、密码
        if (!(this.checkCode(code) && this.checkPwd(newPwd) && this.checkSame(newPwd, confirmPwd))) {
            return;
        }

        //完成设置新密码
        let {tel} = this.props;
        axios.request({
            ...pageApi.uc_resetPwd,
            data:{
                appId: UCAPPID,
                encryptFlag: false,
                newPassword: newPwd,
                phone: tel,
                phoneCode: code
            }
        }).then(({data})=>{
            if(data.code==="200"){
                Popup.MsgTip({ msg: '密码修改成功' });
                browserHistory.replace('/wapLogin');
            }else {
                Popup.MsgTip({ msg: data.message });
            }
        }).catch(err=>{
            console.log(err);
            Popup.MsgTip({msg: '服务器繁忙'});
        });
    };

    //删除密码
    deletePwd = (e) => {
        $(e.target).prev().val("").focus();
        this.setState({inputComp: false});
    };

    render() {
        let {inputComp} = this.state;
        return (
            <div className="input-area">
                <div className="c-pr">
                    <input type="text" id="code" placeholder="请输入验证码" maxLength="4" onChange={this.changeHandle}
                           onKeyUp={this.onlyNum} onPaste={this.onlyNum}/>
                </div>

                <div className="c-pr">
                    <input type="password" id="new-pwd" placeholder="新密码" maxLength="20"
                           onChange={this.changeHandle}/>
                    <img className="del-icon" src="/src/img/user/delete.png" onClick={this.deletePwd}/>
                </div>
                <div className="c-pr">
                    <input type="password" id="confirm-pwd" placeholder="确认密码" maxLength="20"
                           onChange={this.changeHandle}/>
                    <img className="del-icon" src="/src/img/user/delete.png" onClick={this.deletePwd}/>
                </div>
                <div className="pwd-rule">密码为6-20位，由字母、数字与符号中的两种组成</div>

                <input type="button" className="submit-btn c-tc"
                       style={{background: (inputComp ? "#353535" : "#c9c9c9")}}
                       onClick={this.compHandle} value="完成" disabled={!inputComp}/>

                <div className="not-recieve">如果您10分钟还未收到验证码，请联系客服<a href="tel:400-669-6610"> 400-669-6610 </a></div>
            </div>
        );
    }
}