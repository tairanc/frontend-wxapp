import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import {LoadingRound} from 'component/common';
import axios from 'js/util/axios';
import {WXAPI,DIR} from 'config/index'
import './payResult.scss';
import {tip} from 'component/modules/popup/tip/tip';
import {miniProgramMall} from 'js/util/miniProgramLogin';

const pageApi = {
    payQuery: {url: `${WXAPI}/payment/status`, method: "get"},
    //typeQuery: {url: `${WXAPI}/order/groupBuyInfo`, method: "get"}
};

export default class PayResult extends Component {
    constructor(props) {
        super(props);
        this.state = {load: true, status: ""};
        this.tid = props.location.query.tid;
        this.paymentNo = props.location.query.paymentId;
    }

    componentWillMount() {
        axios.request({...pageApi.payQuery, params: {payment_no: this.props.location.query.paymentId}})
            .then(result => {
                result = result.data.data;
                if (result.status !== 3) { //支付不成功
                    this.setState({load: false, status: result.status});
                    return;
                }
                this.setState({load: false, status: result.status});

            })
            .catch(error => {
                tip.show({msg: error.response.data.message || "服务器繁忙"});
                setTimeout(() => {
                    browserHistory.push('/tradeList/0');
                }, 2000);
            })
    }

    toList = () => {
        browserHistory.replace('/tradeList/0');
    };

    render() {
        let {status, load} = this.state;
        if (load) return <LoadingRound/>;
        return (
            <div data-page="pay-result">
                <div className="pay-result">
                    <p>
                        <img src="/src/img/icon/agree/current-round-icon.png" width="40" height="40"/>
                    </p>
                    <p className="c-fs18"
                       style={{lineHeight: "32px"}}>{status === 3 ? "订单支付成功" : "订单处理中"}</p>
                    <p className="c-cc9 c-fs10">我们将尽快为您安排, 祝您购物愉快</p>
                    <p>
                        <a className="colour-btn" href="javascript：void(0)" onClick={()=>{
                            miniProgramMall();
                        }}>继续购买</a>
                    </p>
                    <div>
                        <div className="look-order" onClick={this.toList}>查看订单</div>
                    </div>
                    {/*<div>
                        {objShow&&status === 3&&<div className="look-order" onClick={()=>{this.checkObj('click')}}>查看团详情</div>}
                    </div>*/}
                </div>
            </div>
        )
    }
}