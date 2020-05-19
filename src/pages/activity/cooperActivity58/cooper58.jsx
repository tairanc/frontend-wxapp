import React, {Component} from 'react';
import {Link, browserHistory} from 'react-router';
import {Shady, LoadingRound} from 'component/common';
import './cooper58.scss';
import Popup from 'component/modal2';
import {Prompt} from 'component/modules/popup/index';
import {setCookie} from 'js/common/cookie';
import {UCENTER, UCAPPID, WXURL} from 'config/index';
import axios from 'axios';

const pageApi = {
    uc_phoneExist: (phone) => { return {url: `${UCENTER}/user/phone_${phone}/exists`} }, //手机号是否存在
    uc_sendCode: {url: `${UCENTER}/mock/send_code`, method: 'post'},    //发送手机验证码
    uc_loginOrRegister: {url: `${UCENTER}/login/quick_login_register`, method: 'post'},   //登录注册一体
};

//新人专享登录wrapper
class CooperWrapper extends Component {
    constructor(props) {
        super(props);
        this.state = {
            updata: true,
            showSuccessModal: false
        }
    }

    componentWillMount() {
        document.title = "泰然城新人福利";
    }


    componentDidMount() {
        $("#copWrap").css({minHeight: $(window).height()})
        //popupMsg.show({msg: "hahahaha", status: true});
    }

    render() {
        let {updata, showSuccessModal} = this.state;
        return (
            updata ?
                <div data-page="copWrap" id="copWrap">
                    <div className="bannerCo">
                        {/*<a href="https://www.tairanmall.com/wap/activities/58shenqi.html"><img
                            src="src/pages/outActivity/cooperActivity58/img/banner.png" alt=""/></a>*/}
                        <img
                            src="src/pages/activity/cooperActivity58/img/father.jpg" alt=""/>
                    </div>
                    <CodeLogin/>
                    <div className="btnIcon">
                        <img src="src/pages/activity/cooperActivity58/img/bot.png" alt=""/>
                    </div>
                    <div className="activetyRule">
                        <div className="rulesAc">活动规则</div>
                        <p>1、新人专享福利仅限泰然城新注册用户专享；</p>
                        <p>2、1分钱专享优惠券为商品抵扣券，不含运费，具
                            体运费以订单结算页为准；</p>
                        <p>3、下载泰然城APP或关注泰然城公众号使用，具体
                            在"泰然城-我的-优惠券"查看。</p>
                    </div>
                </div> :
                <LoadingRound/>
        )
    }
}

//信息提示弹框
class PopupMsg extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false
        }
    }

    componentDidMount() {
        if (this.props.status) {
            this.setState({show: true});
        }
    }

    closePopupModal = () => {
        this.setState({show: false});
    };

    render() {
        return (
            this.state.show ? <div className="popup-modal">
                <Shady/>

                <div className="msg-wrapper">
                    {this.props.msg}
                    <div className="closeMsg" onClick={this.closePopupModal}><img
                        src="/src/img/icon/close/close-l-x-icon.png"/></div>
                </div>
            </div> : null
        )
    }
}

const popupMsg = new Prompt(PopupMsg);

//登录注册成功弹框
class SuccessModal extends Component {
    render() {
        return this.props.showSuccessModal ? <div className="success-modal">
            <Shady/>
            <div className="success-img">
                <a href={`${WXURL}/item?item_id=61938`}>
                    <button className="left"></button>
                </a>
                <button className="right" onClick={this.props.closeModal}></button>
               {/* <a  href={`${window.location.protocol}//wx.tairanmall.com/item?item_id=61938`}>
                    <button className="left"></button>
                </a>*/}
            </div>
        </div> : null
    }
}

//验证码登录
class CodeLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 60,
            codeSend: false,
            telCorrect: false,
            inputComp: false,
            errroMsgco: "",
            captchaId: "",
            reciveCode: "",
            userId: "",
            isNew: false,
            getcodeFlag: false,
            errroMsgcoimg: "",
            imgFlag: false
        };
    }

    componentWillMount() {
        this.getCaptcha();
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    //获取图形验证码
    getCaptcha = () => {
        let self = this;
        $.ajax({
            url: "/wxapi/getRandomCaptcha.api",
            type: "get",
            contentType: "application/json",
            success(data) {
                self.setState({imgFlag: !self.state.imgFlag});
                if (data.status) {
                    self.setState({reciveCode: data.data.captcha_code});
                    self.setState({captchaId: data.data.primary_image});
                }
            },
            error(err) {
                self.setState({imgFlag: !self.state.imgFlag});
                //console.log(err);
            }
        });

    }
    //点击刷新图片验证码
    refreshImg = () => {
        if (this.state.imgFlag) {
            this.setState({imgFlag: !this.state.imgFlag});
            if (this.state.imgFlag) {
                this.getCaptcha()
            }
        }
    }

    //手机号是否正确
    checkTel = () => {
        let tel = $("#tel").val().replace(/\s+/g, '');
        if (!(/^1/.test(tel))) {
            //popupMsg.show({msg: "手机号不正确", status: true});
            return false;
        } else {
            this.setState({telCorrect: true});
            return true;
        }
    };

    //验证图形验证码
    checkCodeImg = () => {
        let codeImg = $("#codeImg").val().replace(/\s+/g, '');
        let regCode = new RegExp(`^${this.state.reciveCode}$`, "i");
        if (!codeImg.match(regCode)) {
            //popupMsg.show({msg: "图形验证码不正确", status: true});
            this.setState({errroMsgcoimg: "输入错误请重新输入"});
            //debugger
            return false;
        } else {
            this.setState({errroMsgcoimg: ""});
            return true;
        }
    };

    //获取验证码倒计时
    getCode = () => {
        let tel = $("#tel").val();
        this.setState({getcodeFlag: true});
        this.setState({errroMsgcode: ""});
        if (tel.length !== 11 && !this.checkTel()) {
            return false;
        } else if (!this.checkCodeImg()) {
            return false;
        } else {
            //执行操作
            let {count, codeSend} = this.state;

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
                    $(".get-code").addClass("countdown").removeClass("send-code");
                    self.setState({
                        codeSend: true
                    });
                    self.timer = setInterval(function () {
                        --count;
                        codeSend = true;
                        if (count === 0) {
                            count = 60;
                            codeSend = false;
                            clearInterval(self.timer);
                            $(".get-code").addClass("send-code").removeClass("countdown");
                        }
                        self.setState({
                            count: count,
                            codeSend: codeSend
                        });
                    }.bind(self), 1000);
                }else {
                    self.setState({errroMsgcode: data.message})
                    //Popup.MsgTip({msg: data.message});
                }
            }).catch(()=>{
                self.setState({errroMsgcode: "服务器繁忙"});
                //Popup.MsgTip({msg: "服务器繁忙"});
            });


/*            $.ajax({
                url: `/account/validate/login/${tel}`,
                type: "POST",
                success(data) {
                    $(".get-code").addClass("countdown").removeClass("send-code");
                    self.setState({
                        codeSend: true
                    });
                    self.timer = setInterval(function () {
                        --count;
                        codeSend = true;
                        if (count === 0) {
                            count = 60;
                            codeSend = false;
                            clearInterval(self.timer);
                            $(".get-code").addClass("send-code").removeClass("countdown");
                        }
                        self.setState({
                            count: count,
                            codeSend: codeSend
                        });
                    }.bind(self), 1000);
                    //popupMsg.show({msg: "验证码已发送", status: true});
                },
                error(error) {
                    self.setState({errroMsgcode: JSON.parse(error.responseText).error.description})
                    //popupMsg.show({msg: JSON.parse(error.responseText).error.description, status: true});
                }
            });*/

        }
    }


    changeHandle = () => {
        this.setState({errroMsgcode: ""});
        let tel = $("#tel").val(),
            code = $("#code").val();

        if ((/^1/.test(tel)) && this.state.isNew && this.checkCodeImg() && code && this.state.codeSend) {
            this.setState({
                inputComp: true
            });
        } else {
            this.setState({
                inputComp: false
            });
        }
    }


    //验证手机号 以及是否为新用户 由于手机验证是单独设置的  所以在手机号change事件里加入统一的changeHandle
    formatPhone = (e) => {
        let tel = e.target.value;
        if (tel.length !== 11 || !(/^1/.test(tel))) {
            this.setState({errroMsgco: "请输入正确的手机号"});
            $("#tel").addClass("tel_error");
        } else {
            $("#tel").removeClass("tel_error");
            this.setState({errroMsgco: ""});
            let self = this;

            //验证手机号是否存在
            axios.request({
                ...pageApi.uc_phoneExist(tel),
                params: {
                    appId: UCAPPID
                }
            }).then(({data}) => {
                if (data.code == "200") {
                    if (data.body) {
                        self.setState({errroMsgco: "您已是泰然城会员，点击活动主图查看更多优惠"});
                        self.setState({isNew: false});
                        $("#tel").addClass("tel_error");
                        self.changeHandle()
                    } else {
                        $("#tel").removeClass("tel_error");
                        self.setState({isNew: true})
                    }
                }else {
                    self.setState({errroMsgcode: data.message});
                }
            }).catch(error => {
                console.log(error);
                self.setState({errroMsgcode: "服务器繁忙"});
            });

            /*$.ajax({
                url: `/account/user/phone/exist/${tel}`,
                type: "GET",
                contentType: "application/json",
                success(data) {
                    if (data.have) {
                        self.setState({errroMsgco: "您已是泰然城会员，点击活动主图查看更多优惠"});
                        self.setState({isNew: false});
                        $("#tel").addClass("tel_error");
                        self.changeHandle()
                    } else {
                        $("#tel").removeClass("tel_error");
                        self.setState({isNew: true})
                    }
                },
                error(error) {
                    self.setState({errroMsgco: JSON.parse(error.response).error.description});
                }
            });*/
        }
    }
    checkPhone = (e) => {
        let tel = e.target.value;
        this.setState({errroMsgcode: ""});
        if ((/^1/.test(tel)) || !tel.length) {
            $("#tel").removeClass("tel_error");
            this.setState({errroMsgco: ""});
        } else {
            this.setState({errroMsgco: "请输入正确的手机号"});
            $("#tel").addClass("tel_error");
        }
    }
    //点击领劵
    loginHandleco = () => {
        let tel = $("#tel").val();
        let code = $("#code").val();
        let bigSelf = this;

        if (this.checkTel() && this.checkCodeImg() && code && this.state.isNew) {
            bigSelf.setState({errroMsgcode: ""});

            axios.request({
                ...pageApi.uc_loginOrRegister,
                headers: {'X-Platform-Info': 'WECHAT'},
                data: {
                    appId: UCAPPID,
                    phone: tel,
                    phoneCode: code
                    //inviteCode: invite
                }
            }).then(({data}) => {
                if(data.code==="200"){
                    let { token,isNew,userId } = data.body;
                    setCookie('token', token);

                    if (!isNew) {
                        bigSelf.setState({errroMsgco: "您已是泰然城会员，点击活动主图查看更多优惠"});
                        $("#tel").addClass("tel_error");
                        return;
                    } else {
                        $.ajax({
                            url: "/wxapi/obtainCoupon.api",
                            type: "POST",
                            headers: {
                                domain: ".tairanmall.com",
                            },
                            data: JSON.stringify({
                                phone: tel,
                                ucenter_id: userId,
                            }),
                            contentType: "application/json",
                            success(dataSm) {
                                if (dataSm.code == 200) {
                                    bigSelf.setState({showSuccessModal: true});
                                    bigSelf.setState({inputComp: false});
                                    bigSelf.setState({isNew: false});
                                } else {
                                    popupMsg.show({msg: dataSm.msg, status: true});
                                }
                            },
                            error(error) {
                                popupMsg.show({msg: JSON.parse(error.response).error.description, status: true});
                            }
                        });
                    }
                } else {
                    bigSelf.setState({errroMsgcode: data.message});
                }
            }).catch((error) => {
                console.log(error.response);
                bigSelf.setState({errroMsgcode: error.response.data.message});
            });

            /*$.ajax({
                url: "/account/auth/simple",
                type: "POST",
                headers: {domain: ".tairanmall.com"},
                contentType: "application/json",
                data: JSON.stringify({
                    phone: tel,
                    code: code,
                }),
                success(data) {
                    if (!data.isNew) {
                        bigSelf.setState({errroMsgco: "您已是泰然城会员，点击活动主图查看更多优惠"});
                        $("#tel").addClass("tel_error");
                        return;
                    } else {
                        $.ajax({
                            url: "/wxapi/obtainCoupon.api",
                            type: "POST",
                            headers: {
                                domain: ".tairanmall.com",
                            },
                            data: JSON.stringify({
                                phone: tel,
                                ucenter_id: data.userId,
                            }),
                            contentType: "application/json",
                            success(dataSm) {
                                if (dataSm.code == 200) {
                                    bigSelf.setState({showSuccessModal: true});
                                    bigSelf.setState({inputComp: false});
                                    bigSelf.setState({isNew: false});
                                } else {
                                    popupMsg.show({msg: dataSm.msg, status: true});
                                }
                            },
                            error(error) {
                                popupMsg.show({msg: JSON.parse(error.response).error.description, status: true});
                            }
                        });
                    }


                },
                error(error) {
                    //popupMsg.show({msg: JSON.parse(error.response).error.description, status: true});
                    bigSelf.setState({errroMsgcode: JSON.parse(error.response).error.description});
                }
            });*/
        }
    };


    //限制输入数字
    onlyNum = () => {
        $("#tel").val($("#tel").val().replace(/\D/g, ''));
        $("#code").val($("#code").val().replace(/\D/g, ''));
    }
    //限制输入字母和数字
    onlyLetter = () => {
        $("#codeImg").val($("#codeImg").val().replace(/[^a-zA-Z0-9]/g, ''));
    };
    //关闭领劵
    closeModal = () => {
        this.setState({showSuccessModal: false})
    };

    render() {
        let {count, codeSend, inputComp, telCorrect, errroMsgco, errroMsgcoimg, errroMsgcode, captchaId, showSuccessModal, isNew, handleUpdate, getcodeFlag} = this.state;
        let cntTxt = codeSend ? `${count}s后重发` : "获取验证码";
        let tel = $("#tel").val();
        return (
            <div className="input-area">
                <div className="logoTrc"><img src="src/pages/activity/cooperActivity58/img/logotrc.png" alt=""/>
                </div>
                <div className="input-info c-pr">
                    <input type="text" id="tel" placeholder="请输入手机号码" maxLength="11" onKeyUp={this.onlyNum}
                           onPaste={this.onlyNum}
                           onBlur={this.formatPhone} onChange={this.checkPhone}/>
                    <span className="errroMsgco">{errroMsgco}</span>
                </div>
                <div className="input-info c-pr posImg">
                    <input type="text" id="codeImg" placeholder="请输入图形验证码" maxLength="10" onBlur={this.checkCodeImg}/>
                    <span className="get-img c-tc">
                            {/*图形验证码*/}<img className="img-captcha" src={captchaId} onClick={this.refreshImg}/>
                        </span>
                    <span className="errroMsgimg">{errroMsgcoimg}</span>
                </div>
                <div className="input-info c-pr posCode">
                    <input type="text" id="code" placeholder="请输入验证码" maxLength="10" onChange={this.changeHandle}
                           onKeyUp={this.onlyNum} onPaste={this.onlyNum}/>
                    <span className="get-code c-tc send-code" id="codeSend"
                          onClick={codeSend || !isNew ? '' : this.getCode}
                          disabled={!(telCorrect && codeSend)}>
                            {cntTxt}{/*验证码*/}
                        </span>
                    <span className="errroMsgcode">{errroMsgcode}</span>
                </div>
                <div>
                    <input type="button" className="submit-btn c-tc" disabled={!inputComp || !getcodeFlag}
                           style={{background: ((inputComp && getcodeFlag) ? "#bd976e" : "#c9c9c9")}}
                           value="立即注册领取福利" onClick={this.loginHandleco}/>
                    <p className="agreement">
                        <span className="agreeIcon">
                            <img src="src/pages/activity/cooperActivity58/img/circle.png"/>
                        </span>
                        <span style={{color: "#6d6d6d"}}>我已阅读并同意
                            <a id="serviceproto" style={{color: "#bd976e"}}
                               href="https://passport.tairanmall.com/appprotocol/taihe_service.html">《泰然一账通会员服务协议》</a>
                        </span>
                    </p>
                </div>
                <SuccessModal showSuccessModal={showSuccessModal} closeModal={this.closeModal}/>
                {/*<SuccessModal showSuccessModal={true} closeModal={this.closeModal}/>*/}

            </div>
        );
    }
}

export default CooperWrapper;