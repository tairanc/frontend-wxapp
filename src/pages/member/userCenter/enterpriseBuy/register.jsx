import React, { Component } from 'react';
import { actionAxios, concatPageAndType } from 'js/actions/actions';
import { tip } from 'component/modules/popup/tip/tip';
import { createAction } from 'filters/index';
import { browserHistory } from 'react-router';
import axios from 'axios';
import { ChooseAddress } from './update';
import './register.scss';

let initHeight = $(window).height();

const pageApi = {
    upToCompany: { url: "/account/company", method: "post", contentType: "application/json" },//升级为企业购账户
    register: { url: "/account/auth/simple", method: "post", headers:{ domain:".tairanmall.com" }, contentType: "application/json" },//登录注册一体
    isRegistered: {url:"/account/user/phone/exist/",method: "get"}, //验证手机号码是否已注册
    validataCode: {url: "/account/validate/login/", method: "post", contentType: "application/json" } //请求验证码
}

export default class InviteRegister extends Component {
    constructor(props) {
        super(props);
        let {inviter} = props.location.query;
        this.state = {
            inviterTel: ""+parseInt(inviter.substring(4))/7
        };
        !(/^1\d{10}$/.test(this.state.inviterTel)) && browserHistory.push("/");
    }

    privilegeArr = [
        { name:"开具发票", img:"receipt", line1:true },
        { name:"企业专享价", img:"price", line1:true },
        { name:"采购合同", img:"contract", line1:true },
        { name:"专属客服", img:"service", line1:false },
        { name:"大单议价", img:"negotiate", line1:false },
        { name:"便捷支付", img:"payment", line1: false }
    ];

    componentWillMount() {
        document.title= "邀请注册";
    }

    render() {
        let { inviterTel } = this.state;
        return(
            <div data-page="enterprise-register" className="c-tc">
                <header className="c-pr">
                    <img className="logo c-pa" src="/src/img/enterpriseBuy/inviteRegister/trc-logo.png"/>
                    <img className="model c-pa animationModel" src="/src/img/enterpriseBuy/inviteRegister/model.png"/>
                    <img className="envelope c-pa animationEnvelope" src="/src/img/enterpriseBuy/inviteRegister/envelope.png"/>
                    <p>{ inviterTel.replace(/(\d{3})\d{4}(\d{4})/,"$1****$2") }邀请你加入泰然城企业购</p>
                </header>
                <Register inviterTel={inviterTel}/>
                <div className="arrow">
                    {[1,2,3].map((item,i)=>{
                        return <div key={i} className={`arrowWrap arrow${item}Div`}>
                            <span className={`arrow${item} arrowLeft`}></span>
                            <span className={`arrow${item} arrowRight`}></span>
                        </div>
                    })}
                </div>
                <div className="privilege">
                    <span className="little-circle"></span>
                    <h4>企业购特权</h4>
                    <span className="little-circle"></span>
                    <ul>
                        {this.privilegeArr.map((item,i)=>{
                            return <li key={i} className={`${item.line1?'line1':''}`}>
                                <img src={`/src/img/enterpriseBuy/inviteRegister/icon-${item.img}.png`}/>
                                <br/>{item.name}
                            </li>
                        })}
                    </ul>
                </div>
                <footer>
                    <p>奖励发放形式咨询客服<br/>400-669-6610</p>
                </footer>
            </div>
        );
    }
}

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentStep: 0, //当前执行步骤
            name: "",
            contact: "",
            isCompanyUser: false
        }
    }

    changeState = (stateName)=> {
        this.setState(stateName);        
    };

    render(){
        let { currentStep,name,contact } = this.state;
        let { inviterTel } = this.props;
        /*currentStep =1;*/
        return(
            <div className="register">
            {currentStep ?(
                currentStep === 1 ?
                    <UpToCompany changeState={this.changeState} name={name} contact={contact}/>
                    :
                    <RegisterSuccess changeState={this.changeState}/>
                )
                :
                <RegisterTel changeState={this.changeState} inviterTel={inviterTel}/>
            }
            </div>
        )
    }
}

//步骤一：注册或登录
class RegisterTel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tel: "",
            code: "",
            complete: false,
            codeSend: false,
            count: 59
        }
    }

    componentWillUnmount(){
        clearInterval(this.timer);
    }

    //公司名称是否正确
    checkName = (name)=> {
        if (!/^.{4,40}$/.test(name)){
            tip.show({ msg: "公司名称长度需在4-40位字符之间" });
            return false;  
        }else if(!/^[\u4e00-\u9fa5_a-zA-Z0-9\-()（）]{4,40}$/.test(name)){
            tip.show({ msg: "公司名称只能由中英文、数字及“_”、“-”、()、（）组成" });
            return false;  
        }else {
            return true;
        }
    };

    //联系人姓名是否正确
    checkContact = (contact)=> {
        if(!contact.replace(/(^\s*)|(\s*$)/g,'')){
            tip.show({ msg: '联系人姓名不能为空' });
            return false;
        }else if (contact.length>20){
            tip.show({ msg: '联系人姓名请限制在20字以内' });
            return false;
        }else if(!/^[\u4e00-\u9fa5_a-zA-Z0-9 ]+$/.test(contact)) {
            tip.show({ msg: '联系人姓名只能由中英文、数字、空格和下划线组成' });
            return false;
        }else {
            return true;
        }
    };


    //手机号是否正确
    checkTel = (tel)=> {
        if(!(/^1\d{10}$/.test(tel))) {
            tip.show({ msg: "请输入正确的手机号码" });
            return false;  
        }else {
            return true;
        }
    };

    //验证码是否正确
    checkCode = (code)=> {
        if(!(/^\d{4}$/.test(code))) {
            tip.show({ msg: "验证码不正确" });
            return false;
        }else {
            return true;
        }
    };

    //输入值改变
    handleChange = ()=> {
        let name = $("#name").val(),
            contact = $("#contact").val(),
            tel = $("#tel").val(),
            code = $("#code").val();
        this.setState({
            //complete: !!(name && contact && tel && code && this.state.codeSend)
            complete: !!(name && contact && tel && code)
        });
    };

    //限制输入数字
    onlyNum = ()=> {
        $("#tel").val($("#tel").val().replace(/\D/g,''));
        $("#code").val($("#code").val().replace(/\D/g,''));
    };

    //停止倒计时
    stopCountdown = ()=> {
        this.setState({
            countdown: 60,
            codeSend: false
        });
        clearInterval(this.timer);
    };

    //验证码倒计时
    sendCodeClick = ()=> {
        let name = $("#name").val(),
            contact = $("#contact").val(),
            tel = $("#tel").val(),
            code = $("#code").val();
        let {codeSend,count} = this.state;

        if(!this.checkTel(tel)) { //检测是否填写手机号
            return false;
        }
        //验证码倒计时
        if(!codeSend) {
            //第一次立即执行
            this.setState({
                count: 59,
                codeSend: true
            });
            //第二次开始每间隔一秒执行
            this.timer = setInterval(() => {
                codeSend = true;
                count -= 1;

                if (count < 1 || this.state.tel_exist) {
                    count = 59;
                    codeSend = false;
                    clearInterval(this.timer);
                }
                this.setState({
                    count: count,
                    codeSend: codeSend
                });
            }, 1000);

            axios.request({
                //验证手机号码是否已注册
                ...pageApi.isRegistered, url:pageApi.isRegistered.url+tel
            }).then(({ data }) => {
                if( !data.have ){
                    axios.request({
                        //请求验证码
                        ...pageApi.validataCode, url: pageApi.validataCode.url + tel
                    }).then(() => {
                        tip.show({ msg: "验证码已发送" });
                    }).catch(({ response }) => {
                        this.stopCountdown();
                        tip.show({ msg: response.data.error.description? response.data.error.description : "服务器繁忙" });
                    })
                }else {
                    this.stopCountdown();
                    tip.show({ msg: "您已注册成功，请去个人中心升级为企业购用户" });
                }
            }).catch(({response}) => {
                this.stopCountdown();
                tip.show({ msg: response.data.error.description? response.data.error.description : "服务器繁忙" });
            })
        }
    }

    //下一步按钮
    nextStep = ()=> {
        let {inviterTel} = this.props;
        let name = $("#name").val(),
            contact = $("#contact").val(),
            tel = $("#tel").val(),
            code = $("#code").val();
        if(this.checkName(name) && this.checkContact(contact) && this.checkTel(tel) && this.checkCode(code)) {
            axios.request({//登录注册一体
                ...pageApi.register,
                data: {
                    phone: tel,
                    code: code,
                    inviteCode: inviterTel
                }
            }).then(()=>{
                this.props.changeState({
                    currentStep: 1,
                    name: name,
                    contact: contact
                });
                //页面回到顶部
                $(window).scrollTop(0);
                clearInterval(this.timer);
            }).catch(({response}) =>{
                tip.show({ msg: response.data.error.description? response.data.error.description : "服务器繁忙" });
            });
        }
    }

    render(){
        let { codeSend,count,complete } = this.state;
        let sendCodeTxt = codeSend ? count+"秒后重发" : "获取验证码";
        return(
            <div className="registerTel c-pr">
                <img className="company c-pa" src="/src/img/enterpriseBuy/inviteRegister/company.png"/>
                <input type="text" placeholder="公司名称" id="name" onChange={this.handleChange}/>
                
                <img className="contact c-pa" src="/src/img/enterpriseBuy/inviteRegister/contact.png"/>
                <input type="text" placeholder="联系人姓名" id="contact" onChange={this.handleChange}/>

                <img className="phone c-pa" src="/src/img/enterpriseBuy/inviteRegister/phone.png"/>
                <input type="text" placeholder="手机号码" id="tel" maxLength="11" onKeyUp={this.onlyNum} onPaste={this.onlyNum}
                       onChange={this.handleChange}/>
                <img className="lock c-pa" src="/src/img/enterpriseBuy/inviteRegister/lock.png"/>
                <div className="c-pr">
                    <input type="text" placeholder="验证码" id="code" maxLength="4" onKeyUp={this.onlyNum} onPaste={this.onlyNum} 
                           onChange={this.handleChange}/>
                    <span className="send-code c-pa" style={{color:codeSend?"#999":"#bd976e"}}
                          onClick={codeSend ? null:this.sendCodeClick}>{sendCodeTxt}</span>
                </div>

                <button className="next-step" style={{opacity:complete?"1":"0.3"}} onClick={this.nextStep} disabled={!complete}>
                    下一步
                </button>

                <div className="protocol">
                    <span className="c-c999">已阅读并同意</span>
                    <a className="c-cbd976e" href="https://passport.tairanmall.com/appprotocol/taihe_service.html">《用户协议》</a>
                    <a className="c-cbd976e" href="https://passport.tairanmall.com/appprotocol/group_privacy.html">《企业会员注册条款》</a>
                </div>
            </div>
        )
    }
}

//步骤二：升级为企业购用户
class UpToCompany extends Component {
    constructor(props) {
        super(props);
        this.state = {
            shadySlide: false,
            addrSlideIn: false,
            addressVal: "", //地址值

            buySlideIn: false,
            buyState: this.buyState,
            curBuyState: this.buyState,

            complete: false
        }
    }

    //采购类型
    buyState =[
        { name: 'IT设备', sel:false },
        { name: '数码通讯', sel:false },
        { name: '办公耗材', sel:false },
        { name: '大家电', sel:false },
        { name: '项目合作', sel:false },
        { name: '礼品', sel:false },
        { name: '商旅（机票/酒店等）', sel:false },
        { name: '礼品卡', sel:false }
    ];

    componentDidMount() {
        $(".shady").css({
            minWidth: $(window).width(),
            minHeight: $(window).height()
        });
    }

    changeState = (stateName)=> {
        this.setState(stateName,()=>{
            this.handleChange();
        });
    };

    //输入值改变
    handleChange = ()=> {
        let location = this.state.addressVal,
            detailed = $("#detailed").val(),
            buy = this.refs['buy'].value,
            companyTel = $("#companyTel").val();
        this.setState({
            complete: !!( location  && buy && companyTel && detailed )
        });
    };

    //取消采购类型选项
    cancelBuy = ()=> {
        this.setState({
            curBuyState: this.state.buyState.slice(),
            shadySlide: false,
            buySlideIn: false
        });
    };

    //确认采购类型选项
    confirmBuy = ()=> {
        this.setState({
            buyState: this.state.curBuyState.slice(),
            shadySlide: false,
            buySlideIn: false
        },()=>{
            let buyText =  this.state.buyState.filter(item=>item.sel).map(item=>item.name);
            this.refs['buy'].value = buyText.join('/');
            this.handleChange();
        });
    };

    changeBuyState = (i)=> {
        this.setState(( state,props )=>{
            let curBuyState = state.curBuyState.slice();
            curBuyState[i] = {...curBuyState[i], sel: !curBuyState[i].sel};
            return {
                ...state,
                curBuyState
            }
        });
    };

    //选择地址
    chooseAddress = () => {
        //获取当前页面高度 
        if($(window).height() < initHeight){
            setTimeout(()=>{this.setState({shadySlide: true, addrSlideIn: true})},500);
        }else {
            this.setState({shadySlide: true, addrSlideIn: true});
        }
    };

    //选择采购类型
    chooseBuy = () => {
        //获取当前页面高度 
        if($(window).height() < initHeight){
            setTimeout(()=>{this.setState({shadySlide: true, buySlideIn: true})},500);
        }else {
            this.setState({shadySlide: true, buySlideIn: true});
        }
    };
    
    shadyClick = () => {
        this.setState({
            curBuyState: this.state.buyState.slice(),
            shadySlide: false,
            addrSlideIn: false,
            buySlideIn: false
        });
    };

    //检查选择的地址
    checkAddr = ()=> {
        if(!this.state.addressVal){
            tip.show({ msg: '请选择公司地址' });
            return false;
        }
        return true;
    };

    //检查采购类型
    checkBuy = ()=> {
        if(!this.state.buyState.filter(item=>item.sel).length){
            Popup.MsgTip({ msg: '请选择采购类型' });
            return false;
        }
        return true;
    };

    //检查详细地址
    checkDetailed = (addr)=> {
        if(addr.length>50) {
            tip.show({ msg: '详细地址请限制在50字以内' });
            return false;
        }else if(!(/^\S{5,50}$/.test(addr))){
            tip.show({ msg: '详细地址至少由5个非空白字符组成' });
            return false;
        } else{
            return true;
        }
    };

    //固定电话是否正确
    checkCompTel = (tel)=> {
        if(!(/^0\d{2,3}-\d{5,9}(-\d{1,4})?$/.test(tel.trim()))) {
            tip.show({ msg: "请输入正确的公司固话" });
            return false;  
        }else {
            return true;
        }
    };

    //完成注册按钮
    nextStep = ()=> {
        let { name,contact } = this.props;
        let location = $("#location").val().split(" "),
            detailed = $("#detailed").val(),
            buy = this.state.buyState.filter(item=>item.sel).map(item=>item.name),
            companyTel = $("#companyTel").val();
        if(this.checkAddr() && this.checkBuy() && this.checkDetailed(detailed) && this.checkCompTel(companyTel)) {
            //升级为企业购用户
            axios.request({
                ...pageApi.upToCompany,
                data: {
                    companyName: name,
                    companyLocationProvince: location[0],
                    companyLocationCity: location[1],
                    companyLocationDistrict: location[2],
                    companyLocationAddress: detailed,
                    procurementType: buy,
                    contact: contact,
                    departmentOfContact: "办公室",
                    landlineTelphone: companyTel
                }
            }).then(()=>{
                this.props.changeState({
                    currentStep: 2
                });
                //回到窗口顶部
                $(window).scrollTop(0);
            }).catch(({response})=>{
                tip.show({ msg: response.data.error.description? response.data.error.description : "服务器繁忙" });
            });
        }  
    };

    render(){
        let { addrSlideIn,addressVal,buySlideIn,curBuyState,shadySlide,complete } = this.state;

        return(
            <div className="upToCompany c-pr">
                <div className={`shady ${shadySlide ? '':'c-dpno'}`} onClick={this.shadyClick}></div>

                <ChooseAddress addrSlideIn={addrSlideIn} changeState={this.changeState}/>
                <ChooseBuy cancelBuy={this.cancelBuy} confirmBuy={this.confirmBuy} changeBuyState={this.changeBuyState}
                           buySlideIn={buySlideIn} curBuyState={curBuyState}/>

                
                <div onClick={this.chooseAddress}>
                    <img className="location c-pa" src="/src/img/enterpriseBuy/inviteRegister/location.png"/>
                    <input type="text" placeholder="公司地址" id="location" disabled onChange={this.handleChange} value={addressVal}/>
                    <div className="bottom-line location-bottom-line"></div>
                    <div className="choose choose-addr">
                        <span>请选择</span>
                        <img className="choose-arrow" src="/src/img/enterpriseBuy/inviteRegister/arrow-right.png"/>
                    </div>
                </div>

                <input type="text" placeholder="请填写详细地址，不少于5个字" id="detailed" onChange={this.handleChange}/>
                
                <div onClick={this.chooseBuy}>
                    <img className="buy c-pa" src="/src/img/enterpriseBuy/inviteRegister/buy.png"/>
                    <input type="text" placeholder="采购类型" id="buy" disabled ref='buy'/>
                    <div className="bottom-line buy-bottom-line"></div>
                    <div className="choose choose-buy">
                        <span>请选择</span>
                        <img className="choose-arrow" src="/src/img/enterpriseBuy/inviteRegister/arrow-right.png"/>
                    </div>
                </div>

                <img className="companyTel c-pa" src="/src/img/enterpriseBuy/inviteRegister/tel.png"/>
                <input type="text" placeholder="公司固话，如0571-58066340" id="companyTel" onChange={this.handleChange}/>     

                <button className="next-step" style={{opacity:complete?"1":"0.3"}} onClick={this.nextStep} disabled={!complete}>
                    完成注册
                </button>

                <div className="protocol">
                    <span className="c-c999">已阅读并同意</span>
                    <a className="c-cbd976e" href="https://passport.tairanmall.com/appprotocol/taihe_service.html">《用户协议》</a>
                    <a className="c-cbd976e" href="https://passport.tairanmall.com/appprotocol/group_privacy.html">《企业会员注册条款》</a>
                </div>
            </div>
        )
    }
}

//选择采购类型
class ChooseBuy extends Component {
    render(){
        let { buySlideIn,curBuyState,cancelBuy,confirmBuy,changeBuyState } = this.props;
        let buySelect = curBuyState.filter( item=>item.sel ).length;
        return(
            <div className={`sel-content ${buySlideIn ? "animation1" : "animation2"}`}>
                <h3>采购类型</h3>
                <img className="close" src="/src/img/enterpriseBuy/inviteRegister/close.png" onClick={cancelBuy}/>
                <div className="sel-content-slide">
                    <ul className="type">
                        {curBuyState.map((val,i)=>{
                            return(
                                <li key={i} onClick={()=>{changeBuyState(i)}}>
                                    {val.name}
                                    <img className="select" src={`/src/img/enterpriseBuy/inviteRegister/sel-${val.sel?'':'un'}checked.png`}/>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="confirm">
                    <button className="confirm-btn" onClick={confirmBuy} style={{ opacity: buySelect?"1":"0.3" }} disabled ={ !buySelect }>
                        确定
                    </button>
                </div>
            </div>
        );
    }
}

//注册成功
class RegisterSuccess extends Component {
    render(){
        return(
            <div className="registerSucc c-pr">
                <img className="success" src="/src/img/enterpriseBuy/inviteRegister/register-succ.png"/>
                <img className="check" src="/src/img/enterpriseBuy/inviteRegister/circle-check.png"/>
                <span className="successTxt">恭喜您，注册成功</span>
                <p className="promoteTxt">立即前往享受企业会员价格~</p>
                <button className="next-step" onClick={()=>{window.location.replace('/qyg')}}>
                    立即前往
                </button>
            </div>
        )
    }
}