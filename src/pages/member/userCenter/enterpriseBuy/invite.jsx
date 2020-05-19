import React, { Component } from 'react';
import { LoadingRound,ShareConfig } from 'component/common';
import { tip } from 'component/modules/popup/tip/tip';
import { browserHistory } from 'react-router';
import axios from 'axios';
import './invite.scss';

const pageApi = {
    inviter: {url: "/wxapi/getInviteCode.api", method: "get"} //获取邀请人邀请码和号码
}

export default class Invitation extends Component {
    constructor(props){
        super(props);
        this.state = {
            inviteCode: "",
            tel: "",
            update: false,
            cover: false
        }
    }

    componentWillMount() {
        axios.request(pageApi.inviter).then(({data})=>{
            if(data.code===200 && data.status===true){
                this.setState({
                    inviteCode: data.data.inviteCode,
                    tel: "TRC_"+(parseInt(data.data.loginAccount)*7),
                    update: true
                },()=>{
                    //微信分享链接
                    let shareInfo = {
                        title: '我发现了一个低价采购平台', // 分享标题
                        desc: '专人跟进采购无忧，快和我一起加入吧', // 分享描述
                        link: location.protocol + "//" + location.host + `/enterprise/register?inviter=${this.state.tel}`, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                        imgUrl: 'https://image.tairanmall.com/FjUK1xqNWiNhHC_ZUpxy6fkSwnER', // 分享图标location.protocol + "//" + location.host +
                    };
                    ShareConfig(shareInfo);
                });
            }else if(data.biz_code===401){
                browserHistory.push('/login');
            }else {
                tip.show({ msg: "服务器繁忙" });
            }
        }).catch(err=>{
            console.log(err);
            tip.show({ msg: "服务器繁忙" });
        });
    }

    //分享信息
    shareMsg = ()=> {
        this.setState({ cover: true });
    };

    closeCover=()=>{
        this.setState({ cover: false })
    };

    render(){
        let { inviteCode,update,cover } = this.state;
        return(
            update?
                <div data-page="enterprise-invite" className="c-tc">
                    <header className="invite-text">
                        <img src="/src/img/enterpriseBuy/invitation/inviteFriend.png"/>
                    </header>

                    <div className="invite-code c-dpib">
                        <h3>邀请码</h3>
                        <p>{inviteCode}</p>
                        <span className="copy-code">（长按复制分享给好友）</span>
                        <div className="invite-btn" onClick={this.shareMsg}>
                            <button>邀请企业好友</button>
                        </div>
                    </div>

                    <div className="activity-rule">
                        <span className="little-circle"></span>
                        <h4>活动规则</h4>
                        <span className="little-circle"></span>
                        <ul>
                            <li>
                                <img src="/src/img/enterpriseBuy/invitation/icon-share.png"/>
                                分享邀请码或邀请链接
                            </li>
                            <li className="inviteCode-li">
                                <img src="/src/img/enterpriseBuy/invitation/icon-inviteCode.png"/>
                                <span className="inviteCode-txt">企业通过【邀请码】<br/>直接【邀请企业好友】</span>
                            </li>
                            <li>
                                <img src="/src/img/enterpriseBuy/invitation/icon-profit.png"/>
                                企业采购我拿分红
                            </li>
                        </ul>
                    </div>

                    <footer>
                        <p>奖励发放形式咨询客服<br/>400-669-6610</p>
                    </footer>
                    {cover && <Cover fn={this.closeCover} />}
                </div>
                : 
                <LoadingRound />
        );
    }
}

//微信分享
class Cover extends Component {
    render(){
        let {fn} = this.props;
        return(
            <div className="cover">
                <img className="hand" src="/src/img/logistics/img/hand.png" />
                <img onClick={fn} className="btn" src="/src/img/logistics/img/button.png" />
            </div>
        )
    }
}
