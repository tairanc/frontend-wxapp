import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { browser } from 'js/common/utils.js';
import { compress } from 'js/common/compressImage';
import { LoadingRound } from 'component/common';
import { tip } from 'component/modules/popup/tip/tip';
import { UCENTER } from 'config/index';
import { getCookie } from 'js/common/cookie';
import axios from 'axios';
import './update.scss';

const pageApi = {
    uc_getInfo: { url: `${UCENTER}/user/company_user_info` },//获取企业购账户资料
    uc_setInfo: { url: `${UCENTER}/user/company_user_info`,method:'put' },//获取企业购账户资料
    uc_upgrade: { url: `${UCENTER}/user/upgrade`, method: 'put' },//升级为企业购用户
};

export default class UpToEnterprise extends Component{
    constructor(props) {
        super(props);
        let { company } = props.location.query;
        this.state = {
            isCompanyUser: company==="1",

            shadySlide: false,
            addrSlideIn: false,
            addressVal: '', //地址值

            buySlideIn: false,
            buyState: this.buyState,
            curBuyState: this.buyState,

            branchSlideIn: false,
            branchState: this.branchState,
            curBranchState: this.branchState,

            update: false,
            data: {}
        }
    }

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

    branchState =[
        { name: '办公室', sel:false },
        { name: '采购部', sel:false },
        { name: '技术部', sel:false },
        { name: '人力资源部', sel:false },
        { name: '市场部', sel:false },
        { name: '其它', sel:false }
    ];

    componentWillMount(){
        document.title= '升级企业会员';
        this.token = getCookie('token');
        if(this.state.isCompanyUser){
            axios.request({
                ...pageApi.uc_getInfo,
                headers: { 'Authorization': "Bearer " + this.token }
            }).then(({data})=>{
                let { code,body } = data;
                if(code==="200"){
                    let {companyLocationProvince,companyLocationCity,companyLocationDistrict} = body.details;
                    this.setState({
                        data: body,
                        update: true,
                        addressVal: companyLocationProvince?companyLocationProvince+
                                (companyLocationCity?' '+companyLocationCity+
                                (companyLocationDistrict?' '+companyLocationDistrict:''):''):''
                    });
                    this.initBuy();
                    this.initBranch();
                }else{
                    tip.show({ msg:data.message })
                }
            }).catch(err =>{
                console.log(err);
                tip.show({ msg: "服务器繁忙" });
            });
        }else {
            this.setState({ update: true });
        }
    }

    changeState = (stateName)=> {
        this.setState(stateName);
    };

    //初始化采购类型选项
    initBuy = ()=> {
        let {usage} = this.state.data.details;
        usage.map(text=>{
            this.setState(( state,props )=>{
                let buyState = state.buyState.map(item=>{
                    return {...item, sel: item.sel || item.name === text }
                });
                let curBuyState = buyState.slice();
                return {
                    ...state,
                    buyState,
                    curBuyState
                }
            });
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

    //初始化所属部门选项
    initBranch = ()=> {
        let {department} = this.state.data.details;
        this.setState(( state,props )=>{
            let branchState = state.branchState.map( item =>{
                return {...item, sel: item.name === department }
            });
            let curBranchState = branchState.slice();
            return {
                ...state,
                branchState,
                curBranchState
            }
        });
    }

    //取消所属部门选项
    cancelBranch = ()=> {
        this.setState({
            curBranchState: this.state.branchState.slice(),
            shadySlide: false,
            branchSlideIn: false
        });
    }

    //确认所属部门选项
    confirmBranch = ()=> {
        this.setState({
            branchState: this.state.curBranchState.slice(),
            shadySlide: false,
            branchSlideIn: false
        },()=>{
            let branchStateTxt = this.state.branchState.filter(item=>item.sel).map(item=>item.name);
            this.refs['branch'].value = branchStateTxt.join('/');
        });
    }

    changeBranchState = (i)=> {
        this.setState(( state,props )=>{
            let curBranchState = state.curBranchState.slice();
            curBranchState = curBranchState.map( (item,index) =>{
                return {...item, sel: index === i}
            });
            return {
                ...state,
                curBranchState
            }
        });
    }

    //选择地址
    chooseAddress = () => {
        //获取当前页面高度
        /*if($(window).height() < initHeight){
         setTimeout(()=>{this.setState({shadySlide: true, addrSlideIn: true})},500);
         }else {*/
        this.setState({shadySlide: true, addrSlideIn: true});
        /*}*/
    }

    //选择采购类型
    chooseBuy = () => {
        //获取当前页面高度
        /*if($(window).height() < initHeight){
         setTimeout(()=>{this.setState({shadySlide: true, buySlideIn: true})},500);
         }else {*/
        this.setState({shadySlide: true, buySlideIn: true});
        /*}*/
    }

    //选择所属部门
    chooseBranch = () => {
        this.setState({shadySlide: true, branchSlideIn: true});
    };

    shadyClick = () => {
        this.setState({
            curBuyState: this.state.buyState.slice(),
            curBranchState: this.state.branchState.slice(),
            shadySlide: false,
            addrSlideIn: false,
            buySlideIn: false,
            branchSlideIn: false
        });
    };

    //公司名称是否正确
    checkName = (name)=> {
        if(!name){
            tip.show({ msg: '请输入公司名称' });
            return false;
        }else if (!/^.{4,40}$/.test(name)){
            tip.show({ msg: '公司名称长度需在4-40位字符之间' });//请输入正确的公司名称
            return false;
        }else if(!/^[\u4e00-\u9fa5_a-zA-Z0-9\-()（）]{4,40}$/.test(name)){
            tip.show({ msg: '公司名称只能由中英文、数字及“_”、“-”、()、（）组成' });
            return false;
        }else {
            return true;
        }
    };

    //检查采购类型
    checkBuy = ()=> {
        if(!this.state.buyState.filter((item,i)=>item.sel).length){
            tip.show({ msg: '请选择采购类型' });
            return false;
        }
        return true;
    };

    //公司电话是否正确
    checkTel = (tel)=> {
        if(!(/^0\d{2,3}-\d{5,9}(-\d{1,4})?$/.test(tel.trim()))) {
            tip.show({ msg: '请输入正确的公司电话' });
            return false;
        }
        return true;
    };

    //检查选择的地址
    checkAddr = ()=> {
        if(!this.state.addressVal){
            tip.show({ msg: '请选择公司地址' });
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

    //联系人姓名是否正确
    checkContact = (contact)=> {
        if(!contact.replace(/(^\s*)|(\s*$)/g,'')){
            tip.show({ msg: '联系人姓名不能为空' });
            return false;
        }else if (contact.length>20){
            tip.show({ msg: '联系人姓名请限制在20字以内' });
            return false;
        }else if(!/^[\u4e00-\u9fa5a-zA-Z]{2,20}$/.test(contact)) {
            tip.show({ msg: '联系人姓名只能由2——20个中英文组成' });
            return false;
        }else {
            return true;
        }
    };

    //检查所属部门
    checkBranch = ()=> {
        if(!this.state.branchState.filter((item,i)=>item.sel).length){
            tip.show({ msg: '请选择所属部门' });
            return false;
        }else {
            return true;
        }
    };

    //申请/完成按钮
    applyHandle = ()=> {
        let name = this.refs['name'].value,
            buy = this.state.buyState.filter(item=>item.sel).map(item=>item.name),//this.refs['buy'].value,
            tel = this.refs['tel'].value,
            location = this.refs['location'].value.split(' '),
            detailed = this.refs['detailed'].value,
            contact = this.refs['contact'].value,
            branch = this.refs['branch'].value;
            //inviteCode = this.refs['inviteCode'].value;
        let { isCompanyUser } = this.state;
        if(this.checkName(name)&&this.checkBuy()&&this.checkTel(tel)&&this.checkAddr()&&this.checkDetailed(detailed)
            &&this.checkContact(contact)&&this.checkBranch()) {
            axios.request({
                ...(isCompanyUser?pageApi.uc_setInfo:pageApi.uc_upgrade), //更新企业信息
                headers: { 'Authorization': "Bearer " + this.token },
                data: {
                    companyName: name,
                    companyAddress: detailed,
                    usage: buy.join(','),
                    contactName: contact,
                    department: branch,
                    telephone: tel,
                    companyLocationProvince: location[0],
                    companyLocationCity: location[1],
                    companyLocationDistrict: location[2]?location[2]:''
                    /*registerInviteCode: inviteCode*/
                }
            }).then(({data}) =>{
                if(data.code==="200"){
                    tip.show({msg: `${isCompanyUser?'更新':'申请'}成功`});
                    browserHistory.push('/userInfo');
                }else{
                    tip.show({msg: data.message});
                }
            }).catch( ({ response }) =>{
                tip.show({ msg: response.data.error.description? response.data.error.description : "服务器繁忙" });
            });

            /*if(isCompanyUser){
                axios.request({
                    ...pageApi.uc_setInfo, //更新企业信息
                    headers: { 'Authorization': "Bearer " + this.token },
                    data: {
                        companyName: name,
                        companyAddress: detailed,
                        usage: buy.join(','),
                        contactName: contact,
                        department: branch,
                        telephone: tel,
                        companyLocationProvince: location[0],
                        companyLocationCity: location[1],
                        companyLocationDistrict: location[2]?location[2]:''
                        /!*registerInviteCode: inviteCode*!/
                    }
                }).then(({data}) =>{
                    if(data.code==="200"){
                        tip.show({msg: '更新成功'});
                        browserHistory.goBack();
                    }else{
                        tip.show({msg: data.message});
                    }
                }).catch( ({ response }) =>{
                    tip.show({ msg: response.data.error.description? response.data.error.description : "服务器繁忙" });
                });
            }else {//升级为企业购账户
                axios.request({
                    ...pageApi.uc_upgrade,
                    headers: { 'Authorization': "Bearer " + this.token },
                    data: {
                        companyName: name,
                        companyAddress: detailed,
                        usage: buy.join(','),
                        contactName: contact,
                        department: branch,
                        telephone: tel,
                        companyLocationProvince: location[0],
                        companyLocationCity: location[1],
                        companyLocationDistrict: location[2]?location[2]:''
                    }
                }).then(({data}) =>{
                    if(data.code==="200"){
                        tip.show({msg: '申请成功'});
                        browserHistory.goBack();
                    }else{
                        tip.show({msg: data.message});
                    }
                }).catch(err =>{
                    console.log('err',err);
                    tip.show({ msg: err.data.error.description? err.data.error.description : "服务器繁忙" });
                })
            }*/
        }
    }

    render(){
        let { buySlideIn,curBuyState, branchSlideIn,curBranchState, addrSlideIn,addressVal,shadySlide, isCompanyUser,data,update} = this.state;
        let emptyVal = '';
        //let {telephone='',} = data.details;
        return(
            update ?
            <div data-page="enterprise-update" style={{ minHeight:$(window).height() }}>
                {shadySlide && <div className="shady" onClick={this.shadyClick}></div>}
                <ChooseBuy cancelBuy={this.cancelBuy} confirmBuy={this.confirmBuy} changeBuyState={this.changeBuyState}
                           buySlideIn={buySlideIn} curBuyState={curBuyState}/>
                <ChooseBranch cancelBranch={this.cancelBranch} confirmBranch={this.confirmBranch} changeBranchState={this.changeBranchState}
                              branchSlideIn={branchSlideIn} curBranchState={curBranchState}/>
                <ChooseAddress addrSlideIn={addrSlideIn} changeState={this.changeState}/>

                <ul className="info-list">
                    <li className="li-info li-border">
                        <span><i>*</i>公司名称</span>
                        <input type='text' placeholder='请输入公司名称' ref='name' defaultValue={data.companyName||''}/>
                    </li>

                    <li className="li-info li-border" onClick={this.chooseBuy}>
                        <span><i>*</i>采购类型</span>
                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                        <input type='text' placeholder='请选择采购类型' ref='buy' disabled
                               defaultValue={data.details?data.details.usage.join("/"):''}/>
                    </li>

                    <li className="li-info li-border">
                        <span><i>*</i>公司电话</span>
                        <input type="text" placeholder="如:0571-58066340" ref='tel' defaultValue={data.details?data.details.telephone:''}/>
                    </li>

                    <li className="li-info li-border" onClick={this.chooseAddress}>
                        <span><i>*</i>公司地址</span>
                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                        <input type='text' placeholder='请选择省市区' disabled ref='location' value={addressVal}/>
                    </li>

                    <li className="li-info detailed-addr">
                        <textarea placeholder="请填写详细地址，不少于5个字" ref='detailed' defaultValue={data.companyAddress||''}></textarea>
                    </li>
                </ul>

                <ul className="second-ul">
                    <li className="li-info li-border">
                        <span><i>*</i>联系人</span>
                        <input type="text" ref='contact' placeholder="请输入联系人姓名" defaultValue={data.details?data.details.contactName:''}/>
                    </li>

                    <li className="li-info li-border" onClick={this.chooseBranch}>
                        <span><i>*</i>所属部门</span>
                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                        <input type="text" placeholder="请选择所属部门" disabled ref='branch' defaultValue={data.details?data.details.department:''}/>
                    </li>

                    {/*<li className={`li-info ${data.registerInviteCode?'c-dpno':''}`}>
                        <span>邀请码</span>
                        <input type="text" placeholder="请输入邀请码" ref='inviteCode' defaultValue={data.registerInviteCode||''}/>
                    </li>*/}
                </ul>

                <div className="protocol">
                    <span className="c-c999">申请成功即表示同意</span>
                    <a className="c-cbd976e" href="https://passport.tairanmall.com/appprotocol/group_privacy.html">《企业会员注册条款》</a>
                </div>

                <div className="apply">
                    <button onClick={this.applyHandle}>{ isCompanyUser ? '完成':'立即申请' }</button>
                </div>
            </div>
            :
            <LoadingRound/>
        );
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

//选择所属部门
class ChooseBranch extends Component {
    render(){
        let { branchSlideIn,curBranchState,cancelBranch,confirmBranch,changeBranchState } = this.props;
        let branchSelect = curBranchState.filter( item=>item.sel ).length;

        return(
            <div className={`sel-content ${branchSlideIn ? 'animation1' : 'animation2'}`}>
                <h3>所属部门</h3>
                <img className='close' src="/src/img/enterpriseBuy/inviteRegister/close.png" onClick={cancelBranch}/>
                <div className="sel-content-slide">
                    <ul className="type">
                        {curBranchState.map((val,i)=>{
                            return(
                                <li key={i} onClick={()=>{changeBranchState(i) }}>
                                    {val.name}
                                    <img className="select" src={`/src/img/enterpriseBuy/inviteRegister/sel-${val.sel?'':'un'}checked.png`}/>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="confirm">
                    <button className="confirm-btn" onClick={confirmBranch} style={{opacity:branchSelect?'1':'0.3'}} disabled={!branchSelect}>
                        确定
                    </button>
                </div>
            </div>
        );
    }
}

//选择地址
export class ChooseAddress extends Component {
    constructor(props) {
        super(props);
        this.state = {
            provincetxt: "",
            cityData: [],
            cityTxt: "",
            countyData: [],
            countyTxt: "",
            cityClickAble: false,
            countyClickAble: false,
            confirmClickAble: false,
            isCounty: true
        }
    }

    componentWillMount() {
        let cityData = this.getCity("北京市");
        this.setState({provincetxt: "北京市", cityData: cityData, cityClickAble: "true", isCounty: false});
    }

    componentDidMount() {
        $(".choose-address").css({minWidth: $(window).width()});
        this.mySwiper = new Swiper(".swiper-container", {
            preventClicks: true,
            onSlideChangeStart: (swiper)=>{
                this.handleActiveClass(swiper.activeIndex);
            },
        });
        //默认选中北京市
        $("#110100").addClass('active-one').siblings().removeClass('active-one');

        let self = this;
        //点击每个省
        $(".each-address").click(function (e) {
            let txt = this.innerText;
            let provinceId = $(this).attr("id");
            $(this).addClass('active-one').siblings().removeClass('active-one');
            self.mySwiper.slideTo(1, 300);
            //点击的同时获取城市数据
            let cityData = self.getCity(txt);
            self.setState({ isCounty: false,countyData: []});
            self.mySwiper.update();
            if (/北京市|天津市|上海市|重庆市|澳门/.test(txt)) {
                self.setState({isCounty: false});
                self.mySwiper.update();
            } else {
                self.setState({isCounty: true});
            }
            self.setState({
                provincetxt: txt,
                provinceId: provinceId,
                cityData: cityData,
                cityClickAble: true,
                countyClickAble: false,
                cityTxt: "",
                countyTxt: "",
                confirmClickAble: false
            });
            $(".each-cityaddress").removeClass('active-one');
            $(".each-countyaddress").removeClass('active-one');
        });
    }

    //点击nav切换
    clickNavProvince = (e) => {
        let idName = $(e.target).attr('id');
        if (!$(e.target).hasClass('active-one')) {
            this.mySwiper.slideTo(idName, 300);
            $(e.target).addClass('active-one').siblings().removeClass('active-one');
        }
    }

    clickNavCity = (e) => {
        let idName = $(e.target).attr("id");
        let {cityClickAble} = this.state;
        if (cityClickAble) {
            if (!$(e.target).hasClass('active-one')) {
                this.mySwiper.slideTo(idName, 300);
                $(e.target).addClass('active-one').siblings().removeClass('active-one');
            }
        }
    }

    clickNavCounty = (e) => {
        let idName = $(e.target).attr("id");
        let {countyClickAble} = this.state;
        if (countyClickAble) {
            if (!$(e.target).hasClass('active-one')) {
                this.mySwiper.slideTo(idName, 300);
                $(e.target).addClass('active-one').siblings().removeClass('active-one');
            }
        }
    }

    //处理swiper滑动样式
    handleActiveClass = (index) => {
        if (!$("#" + index).hasClass('active-one')) {
            $("#" + index).addClass('active-one').siblings().removeClass('active-one');
        }
    }

    //获取城市数据
    getCity = (province) => {
        return addressData.filter(item=>item.value === province)[0].children;
    }

    //获取区县数据
    getCounty = (city) => {
        let {cityData} = this.state;
        if (cityData[0].children) {//从第一个城市判断有没有区
            return cityData.filter(item=>item.value === city)[0].children;
        } else {
            //没有城市（）
            this.setState({countyTxt: ""})
        }
    }

    //点击每个城市
    clickCity = (e) => {
        let {cityData} = this.state;
        let parentId = cityData[0].parentId;
        let txt = e.target.innerText;
        let cityId = $(e.target).attr("id");
        $(e.target).addClass('active-one').siblings().removeClass('active-one');
        if (/(1101|1201|3101|5001|8200)00/.test(parentId)) {
            this.setState({confirmClickAble: true});
        } else {
            countyData = this.getCounty(txt);
            if (!countyData) {
                this.mySwiper.update();
                this.setState({confirmClickAble: true, isCounty: false});
            } else {
                this.mySwiper.update();
                this.mySwiper.slideTo(2, 300);
                this.setState({confirmClickAble: false, isCounty: true});
            }
        }
        //点击的同时获取县数据
        let countyData = this.getCounty(txt);
        if (countyData) {
            this.setState({isCounty: true}, function () {
                this.mySwiper.update();
                this.mySwiper.slideTo(2, 300);
            });
        } else {
            this.setState({confirmClickAble: true, isCounty: false});
        }
        this.setState({
            cityTxt: txt,
            cityId: cityId,
            countyData: countyData,
            countyClickAble: true,
            countyTxt: "",
            parentId: parentId
        });
        $(".each-countyaddress").removeClass('active-one');
    }

    //点击每个区县
    clickCounty = (e) => {
        let txt = e.target.innerText;
        let countyId = $(e.target).attr("id");
        $(e.target).addClass('active-one').siblings().removeClass('active-one');
        this.setState({countyTxt: txt, countyId: countyId});
    }

    //确定
    confirm = () => {
        let {provincetxt, cityTxt, countyTxt, provinceId, cityId, countyId, confirmClickAble} = this.state;
        if (confirmClickAble || countyTxt) {
            this.setState({
                provinceId: provinceId,
                cityId: cityId
            });
            if (countyTxt) {
                this.props.changeState({addressVal: provincetxt + " " + cityTxt + " " + countyTxt});
                this.setState({
                    countyId: countyId
                });
            } else {
                this.props.changeState({addressVal: provincetxt + " " + cityTxt});
            }
            this.props.changeState({
                shadySlide: false,
                addrSlideIn: false
            });
        }
    }

    render() {
        let {addrSlideIn} = this.props;
        let {provincetxt, cityData, cityTxt, countyTxt, countyData, cityClickAble, countyClickAble, confirmClickAble, isCounty} = this.state;
        let provinceData = addressData.map(function (item, i) {
            return <p key={i} className="each-address" id={item.id}>{item.value}</p>
        });
        return (
            <div className={`choose-address ${addrSlideIn ? "animationAddr1" : "animationAddr2"}`}>
                <ul className='nav'>
                    <li id='0' className='active-one' onClick={this.clickNavProvince}>
                        {provincetxt || '省份'}
                    </li>
                    <li id='1' className={`${cityClickAble?'':'c-cc9'}`} onClick={this.clickNavCity}>
                        {cityTxt || '城市'}
                    </li>
                    <li id='2' className={`${isCounty?'':'c-dpno'}`} style={{color:countyClickAble?'':'#c9c9c9'}} onClick={this.clickNavCounty}>
                         {countyTxt || "区县"}
                    </li>
                    <li className={`confirm ${(confirmClickAble||countyTxt)?'':'c-cc9'}`} onClick={this.confirm}>
                        完成
                    </li>
                </ul>
                <div className="address-content" data-plugin="swiper">
                    <div className="swiper-container">
                        <div className="swiper-wrapper ">
                            <div className="swiper-slide each-list">
                                {provinceData}
                            </div>
                            <div className="swiper-slide each-list">
                                <CityList data={cityData} fn={this.clickCity}/>
                            </div>
                            <div className={`swiper-slide each-list ${isCounty?"":"c-dpno"}`}>
                                <CountyList data={countyData || []} fn={this.clickCounty}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

//城市
class CityList extends Component {
    render() {
        let {data} = this.props;
        let cityList = data.map((item, i) => {
            return <p key={i} className="each-cityaddress" onClick={this.props.fn} id={item.id}>
                {item.value}
            </p>
        });
        return (
            <div>{cityList}</div>
        )
    }
}

//区县
class CountyList extends Component {
    render() {
        let {data} = this.props;
        let countyList = data.map((item, i) => {
            return <p key={i} className="each-countyaddress" onClick={this.props.fn} id={item.id}>
                {item.value}
            </p>
        });
        return (
            <div>{countyList}</div>
        )
    }
}
