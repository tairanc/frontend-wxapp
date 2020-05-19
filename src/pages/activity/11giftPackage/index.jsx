import React, { Component } from 'react';
import { LoadingRound,ShareConfig } from 'component/common';
import { Link,browserHistory } from 'react-router';
import Popup from 'component/modal2';
import './index.scss';

export default class GiftPackage extends Component{
    constructor(props){
        super(props);
        let {activityId} = props.location.query
        this.state = {
            getPackage: false,
            activityId: activityId,
            data: {},
            update: false,
            promoteTxt: ""
        }
    }

    componentWillMount() {
        let {activityId} = this.state;
        let self = this;
        $.ajax({
            url: `/wxapi/activityInfo.api?activityId=${activityId}`,
            type: "get",
            success(data){
                if(data.code===200 && data.status===true){
                    self.setState({
                        data: data.data,
                        update: true
                    });

                    document.title = (data.data.couponType==="1"?"优惠券":"礼包")+"领取";
                    self.context.isApp && (window.location.href="jsbridge://set_title?"+(data.data.couponType==="1"?"优惠券":"礼包")+"领取");

                    $("[data-page='gift-package']").css({minHeight: $(window).height()});
                    self.showTxt();
                }else if(data.code===400 && data.status===false){
                    Popup.MsgTip({msg:"活动太过火爆，请稍后再来"}); 
                }else {
                    Popup.MsgTip({msg:data.msg}); 
                }
            },
            error(err){
                Popup.MsgTip({msg:"活动太过火爆，请稍后再来"});
            }
        });
    }

    //微信分享链接
    componentDidMount() {
        let {activityId} = this.state;
        let shareInfo = {
            title: "嗨，客官，泰然城喊你来领优惠券啦！", // 分享标题
            desc: "听说购物有券时，会有种莫名的自豪感！", // 分享描述
            link: location.protocol + "//" + location.host + `/giftPackage?activityId=${activityId}`, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
            imgUrl: location.protocol + "//" + location.host + "/src/img/activity/11giftPackage/gift-package.png", // 分享图标
        }
        ShareConfig(shareInfo);
    }

    collect = ()=>{
        //领取优惠券
        let {activityId} = this.state;
        let self = this;
        $.ajax({
            url: `/wxapi/getActCoupon.api?activityId=${activityId}`,
            type: "get",
            success(data){
                if(data.biz_code===401){ //未登录
                    let redirect = encodeURIComponent(`/giftPackage?activityId=${activityId}`);
                    browserHistory.push(`/login?redirect_uri=${redirect}`);
                    return;
                }
                if(data.msg === "该礼包已被领完"){  
                    self.setState({
                        promoteTxt: "对不起，礼包已经被抢空，下次再来吧~",
                        getPackage: false
                    }); 
                }else if(data.msg === "该优惠券已被领完"){
                    self.setState({
                        promoteTxt: "对不起，优惠券已经被抢空，下次再来吧~",
                        getPackage: false
                    });
                }else if(data.code===200 && data.status===true){
                    self.setState({
                        promoteTxt: "恭喜您领取成功！快去泰然城看看吧",
                        getPackage: false
                    });
                }else {
                    self.setState({
                        promoteTxt: data.msg,
                        getPackage: false
                    });
                }
            },
            error(err){
                Popup.MsgTip({msg:"活动太过火爆，请稍后再来"}); 
                self.setState({
                    getPackage: false
                });
            }
        });
    }
   
    //文案
    showTxt = ()=> {
        let {data} = this.state;
        if(data.nowTime < data.startTime){
            this.setState({promoteTxt: "亲，活动还没开始哦~"});
        }else if(data.nowTime <= data.endTime){
            if(data.caseStatus.dailyReceived===true){
                this.setState({promoteTxt: "当日礼包已领取，别着急，明天再来！"});
            }else if(data.caseStatus.received===true){
                this.setState({promoteTxt: "您已经领取，贪心会长胖哦~"});
            }else if(data.caseStatus.outReceived===true && data.couponType==="1"){
                this.setState({promoteTxt: "对不起，优惠券已经被抢空，下次再来吧~"});
            }else if(data.caseStatus.outReceived===true && data.couponType==="2"){
                this.setState({promoteTxt: "对不起，礼包已经被抢空，下次再来吧~"});
            }else {
                this.setState({
                    promoteTxt: "点击领取，收获意外惊喜！",
                    getPackage: true
                });
            }
        }else if(data.nowTime > data.endTime){
            this.setState({promoteTxt: "很抱歉，您来晚了哦~"});
        }
    }

    //处理颜色数组
    getColor = (colorArr)=>{
        let arr = [];
        colorArr.split(",").map((item,i)=>{
            item = parseInt(item);
            if(item<0 || item>255){ //不在范围内的颜色值直接返回白色
                return [255,255,255];
            }
            arr.push(item);
        });
        return arr;
    }

    render(){
        let {getPackage,data,update} = this.state;
        let bgColor = update?this.getColor(data.backgroundColor):"";

        return(
            update?
            <div data-page="gift-package" style={{backgroundColor: `rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]})`}}>
                <div className="banner" style={{backgroundImage: `url(${data.activityImage})` }}></div>
                
                <div className="collect-gift c-tc">
                    <p style={{ color: (getPackage?"#f01e20":"#666")}}>{this.state.promoteTxt}</p>
                    {getPackage?
                        <button onClick={this.collect}>立即领取</button>
                        :
                        <Link to="/">
                            <button>随便逛逛</button>
                        </Link>
                    }
                </div>

                <div className="activity-rule c-pr">
                    <div className="split-line c-pa"></div>
                    <h3>活动细则</h3>
                    <ul>
                    { data.activityRules.split("\n").map((item,index)=>{return(<li key={index}>{item}</li>)}) }
                    </ul>  
                </div>
            </div>
            :
            <LoadingRound />
        )
    }
}
