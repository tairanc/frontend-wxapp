import React, { Component } from 'react';
import { Link,browserHistory } from 'react-router';
import Popup from 'component/modal2';
import { LoadingRound, FastGuide } from 'component/common';
import { browser } from 'js/common/utils';
import { dateFormat } from 'js/util/index';
import { compress } from 'js/common/compressImage';
import { UCENTER,WXAPI,VIPCENTER } from 'config/index';
import { getCookie,setCookie,clearCookie } from 'js/common/cookie';
import { ModalBoxComp } from 'component/modal';
import { miniProgramUrlVerifyName } from 'js/util/miniProgramLogin';
import axios from 'axios';
import './userInfo.scss';
import {connect} from 'react-redux';
import {concatPageAndType} from 'js/actions/actions';

const pageApi = {
    /*uc前缀为用户中心接口*/
    uc_getUserInfo: { url: `${UCENTER}/user` }, //获取用户信息
    uc_setUserInfo: { url: `${UCENTER}/user`, method: 'put' }, //修改用户信息
    uc_unBindWx: { url: `${UCENTER}/user/unbind`,method: 'put' }, //解绑微信
    uc_logout: { url: `${UCENTER}/user/logout`, method: 'post', },  //退出登录
    unbind: { url: `${WXAPI}/unBindUser` },  //解绑用户信息
    //compressImg: { url: '/wxapi/uploadImagesCompress.api', method:'post' }  //压缩上传图片
    compressImg: { url: `${WXAPI}/uploadImage`, method:'post' },  //压缩上传图片
    getVipInfo: { url: `${WXAPI}/vip/info`, method:'get' },    //获取会员信息
    getQRCode: { url: `${WXAPI}/vip/getQRCode`, method:'get' },      //获取小程序二维码
    vipCheck: {url: `${VIPCENTER}/inviter/check`, method: "get"},       // 是否是邀请人检查（白名单）
    updateVipUser: { url: `${WXAPI}/vip/updateVipUser`, method:'post' },    //更改会员信息
    getUserIdCardInfo: { url: `${WXAPI}/commission/getUserIdCardInfo`, method:'get' }  //获取用户提现实名信息
};

const userInfoActions = concatPageAndType("userInfo");

class  UserInfo extends Component{
    constructor(props) {
        super(props);
        this.state = {
            update : false,
            isEnterprise: false,

            data: {},
            shadySlide: false,
            avatar: "",
            showAvatar: false,
            showStart: false,

            nickName: '',

            birth: "",
            birthStart: false,
            birthSlideIn: false,

            sex: "",
            sexStart: false,
            sexSlideIn: false,

            showQrModal: false,
            is_vip: false,          // 是否是vip
            vipInviter: '',         // 会员邀请人
            qrImage: '',            // 二维码图片
            vipCheckResult: true,    // 是否是白名单用户

            has_certify_info: false  // 是否实名
        }
        this.fromVip = props.location.query.fromVip && props.location.query.fromVip == 1 ? true: false; // 是否来自vip开通页
    };

    componentWillMount() {
        document.title= "个人信息";
        this.context.isApp && (window.location.href="jsbridge://set_title?title=个人信息");
        this.token = getCookie('token');
        if(!this.props.hasShowFromVip && this.fromVip) { // 如果没有提示过确认信息同时是来自vip页面
          Popup.MsgTip({msg: "请确认您的生日是否准确"});
          this.props.changeShowFromVip(this.fromVip)
        }

        //获取用户信息
        let  self = this;
        axios.request({
            ...pageApi.uc_getUserInfo,
            headers: { 'Authorization': "Bearer " + self.token },
            params:{needPhone:true}
        }).then(({data})=>{
            const { body, code, message} = data;
            if(code==="200"){
                Promise.all([self.checkVip(body.phone),self.getUserIdCardInfo()]).then(() => {
                    self.setState ({
                        data: body,
                        avatar: body.avatar,
                        isCompanyUser: body.type === "COMPANY", //是否为企业购用户type:INDIVIDUAL  or  COMPANY
                        update: true
                    });
                })
            }else{
                Popup.MsgTip({ msg: message });
            }
        }).catch(error=>{
            Popup.MsgTip({ msg: "服务器繁忙" });
        });
        this.getVipInfo()
    }

    //离开页面时清楚弹框
    componentWillUnmount() {
        const msgTip = document.querySelector("#msgTip");
        msgTip && msgTip.parentNode && msgTip.parentNode.removeChild(msgTip);
    }

    /**
    * 用户白名单检查，只有白名单用户才有邀请码
    * @param phone 用户手机号
    */
    checkVip = (phone) => {
        return new Promise(resolve => {
            axios.request({
                ...pageApi.vipCheck,
                params:{ phone }
            }).then(({ data }) => {
                const { code, message } = data;
                this.setState({
                    vipCheckResult: code && code == 200 ? true :false
                }, () => {
                    resolve()
                })
            }).catch((err) => {
                this.setState({
                    vipCheckResult: false
                },() => {
                  resolve()
                })
            })
        })
    }

    /**
    * 获取用户vip信息
    */
    getVipInfo = () => {
      axios.request({
        ...pageApi.getVipInfo
      }).then(({data})=>{
        if(data.code === 0) {
            let res = data.data;
            this.setState({
              vipInviter: res.inviter || '',
              is_vip: res.is_vip ? true: false,
              nickName: res.member_name ? res.member_name : (res.phone ? res.phone : "未设置"),
              sex: res.member_sex,
              birth: res.birthday
            })
        } else {
          Popup.MsgTip({ msg: data.message || "服务器繁忙" })
        }
      }).catch(error=>{
        Popup.MsgTip({ msg: "服务器繁忙" });
      });
    }

    changeState = (stateName)=> {
        this.setState(stateName);
    }

    /**
    * 获取用户实名实名信息
    */
    getUserIdCardInfo = () => {
        return new Promise(resolve => {
            axios.request({
                ...pageApi.getUserIdCardInfo
            }).then(({data}) => {
                if(data && data.code === 0) {
                    this.setState({
                        has_certify_info: data.data && data.data.has_certify_info ? true: false
                    })
                    resolve()
                } else {
                    this.setState({
                        has_certify_info: false
                    })
                    resolve()
                }
            }).catch(() => {
                this.setState({
                    has_certify_info: false
                })
                resolve()
            })
        })
    }

    //显示头像大图
    showAvatar = ()=> {
        this.setState({ showStart: true,showAvatar: true});
    };

    //选择性别
    chooseSex = () => {
        this.setState({sexStart:true, shadySlide:true, sexSlideIn:true});
    };

    //选择生日
    chooseBirth = () => {
        this.setState({birthStart:true, shadySlide: true, birthSlideIn: true});
    };

    //上传头像
    upLoadImg = async (e) => {
        let file = $(".avatar-form")[0].firstChild.files["0"];
        if(!file){
            return;
        }else if (!/^image\/(jpg|png|jpeg|bmp)$/.test(file.type)) {
            Popup.MsgTip({msg: "亲，请上传jpg/png/jpeg/bmp格式的图片哦~"});
            return;
        }
        let fileStream = await compress(file);
        this.upLoadAjax(fileStream);
    };

    upLoadAjax = (basestr) => {
        //压缩图片
        axios.request({
            ...pageApi.compressImg,
            data: { img: basestr }
        }).then(({data})=>{
            this.setState({
                avatar: data.data.file.complete_url
            });
            //修改用户信息
            axios.request({
                ...pageApi.uc_setUserInfo,
                data: { avatar: data.data.file.complete_url },
                headers: { 'Authorization': "Bearer " + this.token }
            }).then(({data})=>{
                Popup.MsgTip({msg: `头像修改${data.code==="200"?'成功':'失败'}`});
            })
        }).catch(error=>{
            console.log(error);
            Popup.MsgTip({msg: error.response.data.message||"上传图片出错"});
        });
    };

    //解绑步骤一：解绑用户信息
    unBindUser = ()=> {
        axios.request({
            ...pageApi.unbind,
            params:{ openid: getCookie('openId') }
        }).then(()=>{
            Popup.MsgTip({msg: '解绑成功'});
            this.unBindWx();
        }).catch(error=>{
            console.log(error);
            Popup.MsgTip({msg: error.response.data.message||"解绑用户信息失败"});
        });
    };

    //解绑步骤二：解绑微信
    unBindWx = ()=> {
        let self = this;
        axios.request({
            ...pageApi.uc_unBindWx,
            headers: { 'Authorization': "Bearer " + self.token },
            params:{ type: 'WECHAT' }
        }).then(({data})=>{
            if(data.code==="200"){
                self.exitLogin();
            }else{
                Popup.MsgTip({msg: "解绑失败"});
            }
        }).catch(({error})=>{
            console.log(error);
            Popup.MsgTip({msg: "服务器繁忙"});
        });
    };

    //解绑步骤三：退出登录
    exitLogin = () => {
        let self = this;
        axios.request({
            ...pageApi.uc_logout,
            headers: {'Authorization': "Bearer " + self.token}
        }).then(({data}) => {
            if (data.code === "200") {
                /*setCookie('openId', '', -1);//清除openId
                setCookie('token', '', -1);//清除token*/
                clearCookie('openId');
                clearCookie('token');
                window.location.replace("/userCenter");
            }else{
                Popup.MsgTip({msg: "解绑失败"});
            }
        }).catch(({error})=>{
            console.log(error);
        });

        /*$.ajax({
            url: "/account/user/logout",
            type: "POST",
            success(data){
                window.location.replace("/userCenter");
            }
        });*/
    };

    //解绑微信
    unBindClick = ()=> {
        Popup.Modal({
            isOpen: true,
            msg: "确定要解除绑定吗？"
        },this.unBindUser);
    };

    //退出登录
    exitClick = ()=> {
        Popup.Modal({
            isOpen: true,
            msg: "确定要退出登录吗？"
        },this.exitLogin);
    };

    shadyClick = ()=>{
        this.setState({
            shadySlide: false,
            avatarSlideIn: false,
            sexSlideIn: false,
            birthSlideIn: false
        })
    };

    // 展示二维码
    showQr = () => {
      this.getQRCode()
    }
    closeQrModal = () => {
      this.setState({
        showQrModal: false
      })
    }

    // 跳转到邀请人
    turnInviter = () => {
        if(this.state.vipInviter) { // 已有邀请人就不需要修改
           return;
        }
        browserHistory.push(`/userInviter`);
    }

    // 获取小程序二维码
    getQRCode = () => {
      axios.get(pageApi.getQRCode.url, {
          params: {
            page: 'pages/vipPage/vipPage',
            scene: this.state.data.phone
          }
      }).then((res) => {
          this.setState({
            qrImage: res.data
          }, () => {
            this.setState({
              showQrModal: true
            })
          })
      }).catch(() => {
        Popup.MsgTip({ msg: "服务器繁忙" })
      })
    }


    // 跳转到实名认证
    turnVerifyName = () => {
      miniProgramUrlVerifyName(this.state.has_certify_info)
    }

    render() {
        let unSet = "未设置";
        let { shadySlide,showStart,showAvatar,avatar,sex,sexStart,sexSlideIn,birth,birthStart,birthSlideIn,update,isCompanyUser,data,
          showQrModal, is_vip, vipInviter, qrImage, vipCheckResult, nickName, has_certify_info } = this.state;
        return (
            update ?
                <div data-page="user-info" style={{ minHeight: $(window).height() }}>
                    <div className={`shady ${shadySlide? '':'c-dpno'}`} style={{height: $(window).height()}} onClick={this.shadyClick}></div>

                    <ShowAvatar showStart={showStart} showAvatar={showAvatar} avatar={avatar} changeState={this.changeState}/>
                    <ChooseSex sexStart={sexStart} shadySlide={shadySlide} sexSlideIn={sexSlideIn} changeState={this.changeState}/>
                    <ChooseBirth birthStart={birthStart} shadySlide={shadySlide} birthSlideIn={birthSlideIn} changeState={this.changeState} birth={birth}/>

                    <ul className="info-list">
                        <li className="info-avatar-li">
                            <div className="avatar-div li-padding">
                                头像
                                <form className="avatar-form">
                                    <input type="file" name="file" onChange={this.upLoadImg} accept="image/*" className="upLoadFromCamera"/>
                                </form>

                                <div className="avatar-prompt prompt-msg" onClick={this.showAvatar}>{/* style={{height:'66px'}}*/}
                                    <div className="avatar-container">
                                        <img className="avatar" src={avatar ? avatar : "/src/img/icon/avatar/default-avatar.png"}/>
                                    </div>
                                    <img className="arrow-right avatar-arrow" src="/src/img/userCenter/arrow_right.png"/>
                                </div>
                            </div>
                            <div className="split-line"></div>
                        </li>

                        <li>
                            <div className="li-padding">
                                手机号
                                <span className="prompt-msg">{data.phone.replace(/(\d{3})\d{4}(\d{4})/,"$1****$2")}</span>
                            </div>
                            <div className="split-line"></div>
                        </li>

                        <li>
                            <Link to={`/userNickname?nickname=${nickName}`}>
                                <div className="li-padding">
                                    昵称
                                    <div className="prompt-msg">
                                        <span>{nickName}</span>
                                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                                    </div>
                                </div>
                                <div className="split-line"></div>
                            </Link>
                        </li>

                        <li onClick={this.chooseSex}>
                            <div className="li-padding">
                                性别
                                <div className="prompt-msg">
                                    <span>{sex ? (sex=="1"?"男":"女") : unSet}</span>
                                    <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                                </div>
                            </div>
                            <div className="split-line"></div>
                        </li>

                        <li className="li-padding"onClick={this.chooseBirth}>
                            生日
                            <div className="prompt-msg">
                                <span>{birth ? birth : unSet}</span>
                                <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                            </div>
                        </li>

                      {
                        vipCheckResult &&(
                        <li className="info-area">
                          <div>
                            <div className="li-padding">
                              泰享会员邀请
                              <div className="prompt-msg" onClick={this.showQr}>
                                <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                              </div>
                              <div className="prompt-msg" onClick={this.showQr}>
                                <img className="qr-img" src="/src/img/vip/qrVip.png"/>
                              </div>
                            </div>
                            <div className="split-line"></div>
                          </div>
                          <ModalBoxComp active={ showQrModal }>
                            <div className="userinfo-qr-modal-box">
                              <div className="qr-modal-content">
                                <div className="qr-modal-text">
                                  <div className="qr-modal-text-title">泰享会员邀请码</div>
                                  <div className="qr-modal-text-phone">{data.phone.replace(/(\d{3})\d{4}(\d{4})/,"$1****$2")}</div>
                                  <img src={require('src/img/vip/iconVip.png')} className='qr-modal-icon'/>
                                </div>
                                <div className="qr-modal-image-box">
                                  <img src={qrImage}></img>
                                </div>
                              </div>
                              <div className="qr-modal-other">
                                <img src={require('src/img/icon/close/close-l-x-icon.png')} className='qr-modal-close' onClick={ this.closeQrModal }/>
                              </div>
                            </div>
                          </ModalBoxComp>
                        </li>)
                      }
                      {
                        is_vip && (
                          <li>
                            <div onClick={this.turnInviter}>
                              <div className="li-padding">
                                泰享会员邀请人
                                {
                                  !!vipInviter &&
                                  <div className="prompt-msg">
                                    <span>{vipInviter.replace(/(\d{3})\d{4}(\d{4})/,"$1****$2")}</span>
                                  </div>
                                }
                                {
                                  !vipInviter &&
                                  <div className="prompt-msg">
                                    <span>请填写</span>
                                    <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                                  </div>
                                }
                              </div>
                            </div>
                          </li>
                        )
                      }
                        <li className="info-area" onClick={this.turnVerifyName}>
                            <div>
                                <div className="li-padding">
                                    实名认证
                                    <div className="prompt-msg">
                                        <span>{has_certify_info ? '已实名' : '未实名'}</span>
                                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                                    </div>
                                </div>
                                <div className="split-line"></div>
                            </div>
                        </li>
                        <li className="info-area">
                            <Link to="/goodsReceiveInfo/identityManage">
                                <div className="li-padding">
                                    身份证管理
                                    <div className="prompt-msg">
                                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                                    </div>
                                </div>
                                <div className="split-line"></div>
                            </Link>
                        </li>

                        <li>
                            <Link to="/goodsReceiveInfo/addressManage">
                                <div className="li-padding">
                                    收货地址
                                    <div className="prompt-msg">
                                        <img className="arrow-right" src="/src/img/userCenter/arrow_right.png"/>
                                    </div>
                                </div>
                            </Link>
                        </li>

                        {/*<li className={`li-padding info-area ${browser.versions.weixin?'':'c-dpno'}`} onClick={this.unBindClick}>
                            绑定微信
                            <span className="prompt-msg">解除绑定</span>
                        </li>*/}
                    </ul>
                    {
                      shadySlide || showAvatar ? '': <FastGuide shouldPayRedirect={false} hideShopCart={true} orderPage={true} showUseInfo={true}/>
                    }
                </div>
                :
                <LoadingRound />
            );
    }
}

//显示头像大图
class ShowAvatar extends Component {
    componentDidMount() {
        $(".show-avatar").css({minHeight: $(window).height()});
    }

    cancelShowAvatar = ()=> {
        this.props.changeState({ showAvatar: false});
    }

    render(){
        let { showStart,showAvatar,avatar } = this.props;
        return(
            <div className={`show-avatar ${showStart?(showAvatar ? "animationBg1" : "animationBg2"):"c-dpno"}`} onClick={this.cancelShowAvatar}>
                <img className={`${showStart?(showAvatar ? "animationAvatar1" : "animationAvatar2"):"c-dpno"}`}
                     src={avatar ? avatar : "/src/img/icon/avatar/default-avatar.png"}/>
            </div>
        );
    }
}

//选择性别
class ChooseSex extends Component {
    componentDidMount() {
        let mySwiper = new Swiper(".sex-container", {
            preventClicks: true,
            direction : 'vertical',
            slideToClickedSlide: true,
            slidesPerView : 2
        });
    }

    cancelSex = ()=> {
        this.props.changeState({shadySlide: false, sexSlideIn: false});
    }

    confirmSex = ()=> {
        let sexVal = $(".sex-container .swiper-slide-active").text();
        if(sexVal==="女"){
            sexVal="2";
        }else if(sexVal==="男"){
            sexVal="1";
        }else{
            sexVal="0";
        }
        let token = getCookie('token');
        let self = this;
        //修改性别
        axios.request({
            ...pageApi.updateVipUser,
            data:{ member_sex: sexVal }
        }).then(({data})=>{
            if(data.code === 0){
                self.props.changeState({ sex: sexVal });
                Popup.MsgTip({msg: "性别修改成功"});
            }else{
                Popup.MsgTip({msg: "性别修改失败"});
            }
        });

        //关闭弹窗
        this.props.changeState({shadySlide: false, sexSlideIn: false});
    }

    render(){
        let { sexStart,sexSlideIn } = this.props;
        return(
            <div className="animation-sex">
                <div className={`choose-sex ${sexStart?(sexSlideIn ? "animation1" : "animation2"):""}`}>
                    <div className="fixed-line c-pa" style={{top:"122px"}}></div>
                    <div className="fixed-line c-pa" style={{top:"165px"}}></div>
                    <ul className="nav">
                        <li className="cancel" onClick={this.cancelSex}>取消</li>
                        <li className="confirm" onClick={this.confirmSex}>完成</li>
                    </ul>
                    <div className="sex-content" data-plugin="swiper">
                        <div className="swiper-container sex-container">
                            <div className="swiper-wrapper">
                                <div className="swiper-slide">女</div>
                                <div className="swiper-slide">男</div>
                                <div className="swiper-slide"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

//选择生日
class ChooseBirth extends Component {
    constructor(props){
        super(props);
        let date = new Date();
        let { birth } = this.props,
            birthArr = birth?birth.split("-").map((val)=>{return parseInt(val);}):[],
            len = birthArr.length;

        this.state={
            nowYear: date.getFullYear(),
            nowMonth: date.getMonth(),
            nowDay: date.getDate(),

            yearInit: len?70-(date.getFullYear()-birthArr[0]):70,
            monthInit: len?birthArr[1]-1:date.getMonth(),
            dayInit: len?birthArr[2]:date.getDate(),

            yearCnt: 0,
            monthCnt: 0,
            dayCnt: 0,

            dayArr: this.dayGenerator(len?date.getFullYear():birthArr[0],(len?birthArr[1]-1:date.getMonth())+1)
        }
    }

    componentDidMount() {
        let { nowYear,nowMonth,nowDay,yearInit,monthInit,dayInit,yearCnt,monthCnt,dayCnt } = this.state;

        let self = this;
        let daySwiper = new Swiper(".day-container", {
            preventClicks: true,
            direction : 'vertical',
            slideToClickedSlide: true,
            slidesPerView : 5,
            centeredSlides: true,
            initialSlide: dayInit-1,
            onSlideChangeEnd: function (swiper) {
                if(dayCnt>0){
                    let { year,month,day } = self.getSelTime(); //获取当前swiper选择的年月日

                    if( year===nowYear && month-1===nowMonth && day > nowDay){
                        swiper.slideTo(nowDay-1, 200, true); //选择大于当前日期的日子，自动回滚到当前日
                    }
                }
                dayCnt++;
            }
        });

        let monthSwiper = new Swiper(".month-container", {
            preventClicks: true,
            direction: 'vertical',
            slideToClickedSlide: true,
            slidesPerView: 5,
            centeredSlides: true,
            initialSlide: monthInit,
            onInit: function(){
                monthCnt++
            },
            onSlideChangeEnd: function (swiper) {
                if(monthCnt>0){
                    let { year,month,day } = self.getSelTime(); //获取当前swiper选择的年月日

                    if( year===nowYear && month>nowMonth ){
                        swiper.slideTo(nowMonth, 200, true); //选择大于当前月份的月，回滚到当前月
                    }
                    if( year===nowYear && month-1===nowMonth && day > nowDay){
                        daySwiper.slideTo(nowDay-1, 200, true); //选择大于当前日期的日子，回滚到当前日
                    }

                    let dayArr = self.dayGenerator(year,month),
                        dayNum = self.getDayNum(year,month);
                    self.setState({ dayArr: dayArr });
                    daySwiper.updateSlidesSize();

                    if(!day || day>dayNum){
                        daySwiper.slideTo(dayNum-1, 200, true); //不存在的日期，回滚到当前月最后一天
                    }
                    monthCnt++;
                }

            }
        });

        let yearSwiper = new Swiper(".year-container", {
            preventClicks: true,
            direction : 'vertical',
            slideToClickedSlide: true,
            slidesPerView: 5,
            centeredSlides: true,
            initialSlide: yearInit,
            onSlideChangeEnd: function (swiper) {
                if(yearCnt>0){
                    let { year,month,day } = self.getSelTime(); //获取当前swiper选择的年月日

                    if( year===nowYear && month>nowMonth ){
                        monthSwiper.slideTo(nowMonth, 200, true); //选择大于当前月份的月，回滚到当前月
                    }
                    if( year===nowYear && month-1===nowMonth && day > nowDay){
                        daySwiper.slideTo(nowDay-1, 200, true); //选择大于当前日期的日，回滚到当前日
                    }

                    let dayArr = self.dayGenerator(year,month),
                        dayNum = self.getDayNum(year,month);
                    self.setState({ dayArr: dayArr });
                    daySwiper.updateSlidesSize();

                    if(!day || day>dayNum){
                        daySwiper.slideTo(dayNum-1, 200, true); //不存在的日期，回滚到当前月最后一天
                    }
                }
                yearCnt++;
            }
        });
    }

    //获取当前选择swiper选择的年月日值
    getSelTime = ()=> {
        return {
            year: parseInt($(".year-container .swiper-slide-active").text().split("年")[0]),
            month: parseInt($(".month-container .swiper-slide-active").text().split("月")[0]),
            day: parseInt($(".day-container .swiper-slide-active").text().split("日")[0])
        }
    }

    //判断当前年月下的天数
    getDayNum = (year,month)=> {
        let dayNum;
        switch(month){
            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12: dayNum = 31;break;
            case 4:
            case 6:
            case 9:
            case 11: dayNum = 30;break;
            case 2: dayNum = (( year%4==0 && year%100!=0)|| year%400 == 0)?29:28;break;
        }
        return dayNum;
    }

    //生成包含当前年月下的天数数组
    dayGenerator = (year,month)=>{
        let dayArr = [],
            dayNum = this.getDayNum(year,month);
        for(let i=1;i<=dayNum;i++){
            dayArr.push(i);
        }
        return dayArr;
    }

    //取消
    cancelBirth = ()=> {
        this.props.changeState({shadySlide: false, birthSlideIn: false});
    }
    //确定
    confirmBirth = ()=> {
        let year = $(".year-container .swiper-slide-active").text().split("年")[0],
            month = $(".month-container .swiper-slide-active").text().split("月")[0],
            day = $(".day-container .swiper-slide-active").text().split("日")[0],
            birthVal = year+"-"+month+"-"+day;

        let self = this;
        let token = getCookie('token');

        //修改生日
        axios.request({
            ...pageApi.updateVipUser,
            data:{ birthday : birthVal }
        }).then(({data})=>{
            if(data.code === 0){
                self.props.changeState({ birth: birthVal });
                Popup.MsgTip({msg: "生日修改成功"});
            }else{
                Popup.MsgTip({msg: "生日修改失败"});
            }
        });


        //关闭弹窗
        this.props.changeState({shadySlide: false, birthSlideIn: false});
    }

    getYear = ()=> {
        let yearArr = [];
        let nowYear = new Date().getFullYear();
        for(let i=nowYear-70; i<= nowYear; i++){
            yearArr.push(i+"年");
        }
        return yearArr;
    }

    getMonth = ()=> {
        let monthArr = [];
        for(let i=1; i<=12; i++){
            monthArr.push((i<10 ? '0'+i : i)+"月");
        }
        return monthArr;
    }

    render(){
        let { birthSlideIn,birthStart } = this.props;
        let { dayArr } = this.state;
        let yearList = this.getYear().map(function (item, i) {
            return <div key={i} className="swiper-slide"><p className="each-year">{item}</p></div>
        });
        let monthList = this.getMonth().map(function (item, i) {
            return <div key={i}  className="swiper-slide"><p className="each-month">{item}</p></div>
        });
        let dayList = dayArr.map(function (item, i) {
            return <div key={i} className="swiper-slide"><p className="each-day">{(item<10?"0"+item:item)+"日"}</p></div>
        });

        return(
            <div className="animation-birth">
                <div className={`choose-birth ${birthStart?(birthSlideIn ? "animation1" : "animation2"):""}`}>
                    <div className="fixed-line c-pa" style={{top:"126px"}}></div>
                    <div className="fixed-line c-pa" style={{top:"169px"}}></div>
                    <ul className="nav">
                        <li className="cancel" onClick={this.cancelBirth}>取消</li>
                        <li className="confirm" onClick={this.confirmBirth}>完成</li>
                    </ul>
                    <div className="birth-content" data-plugin="swiper">
                        <div className="swiper-container year-container">
                            <div className="swiper-wrapper">
                               {yearList}
                            </div>
                        </div>

                        <div className="swiper-container month-container">
                            <div className="swiper-wrapper">
                                {monthList}
                            </div>
                        </div>

                        <div className="swiper-container day-container">
                            <div className="swiper-wrapper">
                                {dayList}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function userInfoState(state, props) {
  return {
    ...state.userInfo
  }
}

function userInfoDispatch(dispatch) {
    return {
      changeShowFromVip(status) {
        dispatch(userInfoActions('changeShowFromVip', {status}));
      }
    }
}

export default connect(userInfoState, userInfoDispatch)(UserInfo);
