import React, {Component} from 'react';
import {connect} from 'react-redux';
import {browserHistory, Link} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {popupData} from 'js/filters/orderStatus';
import {LoadingRound, Shady} from 'component/common';
import {compress} from 'js/common/compressImage';
import {PopupTip} from 'component/modal.jsx';
import axios from 'js/util/axios';
import {addImageSuffix} from "js/util/index";
import {WXAPI} from 'config/index'

const pageApi = {
    submit: {url: `${WXAPI}/user/sold/apply`, method: "post"},
    soldorder: {url: `${WXAPI}/user/sold/goods-order`, method: "get"},
    compressPhoto: {url: `${WXAPI}/uploadImage`, method: "post"}
};
const createActions = concatPageAndType("afterSaleApply");
const popupActions = concatPageAndType("popup");
const axiosCreator = actionAxios("afterSaleApply");


const typeText = {
    "SELECT": "请选择",
    "restore": "退货退款",
    "refund": "仅退款"
};

const reasonText = {
    "restore": {
        "0": "请选择",
        "1": "商品与描述不符",
        "2": "商品错发漏发",
        "3": "收到商品破损",
        "4": "商品质量问题",
        "5": "个人原因退货",
        "6": "其他"
    },
    "refund": {
        "0": "请选择",
        "1": "商品与描述不符",
        "2": "商品错发漏发",
        "3": "收到商品破损",
        "4": "商品质量问题",
        "5": "个人原因退货",
        "6": "未收到货",
        "7": "商品问题已拒签",
        "8": "退运费",
        "9": "其他"
    }
};

class AfterSaleApply extends Component {
    componentWillMount() {
        let {tid} = this.props.location.query;
        this.props.resetData();
        this.props.dispatch(axiosCreator('getData', {...pageApi.soldorder, params: {order_good_no: tid}}));
    }

    render() {
        const {
            refund, popup, ctrlPopup, listType, reason, typeChange, hidePopup, popupShow,
            reasonChange, moneyChange, describeChange, dispatch, applySubmit, prompt, promptClose, load, data
        } = this.props;
        let {payment, is_gift} = data;
        return (
            <div data-page="after-sale-apply">
                {load ? <LoadingRound/>
                    : <div>
                        <ApplyType refund={refund} typeChange={typeChange}
                                   listType={listType}
                                   reason={reason} reasonChange={reasonChange}/>
                        <ApplyReason payment={payment} refund={refund} ctrlPopup={ctrlPopup}
                                     listType={listType} reason={reason} data={data} dispatch={dispatch}
                                     is_gift={is_gift}/>

                        <ApplyDetail changeHandle={describeChange}/>
                        <ApplyVoucher dispatch={dispatch} submitHandle={applySubmit}/>
                        {/*<SubmitBtn submitHandle={applySubmit}/>*/}

                        <ApplyPopups popup={popup} listData={popupData[popup]}
                                     listType={listType}
                                     reason={reason}
                                     hidePopup={hidePopup}
                                     show={popupShow}
                                     reasonChange={reasonChange}
                                     typeChange={typeChange}/>

                        <PopupTip active={prompt.show}
                                  msg={prompt.msg}
                                  onClose={promptClose}/>
                    </div>}
            </div>
        )
    }
}

class ApplyType extends Component {
    //选择售后类型
    checkAftertype = (e) => {
        //待发货时为仅退款可选
        let {typeChange, reasonChange, refund} = this.props;
        if ($(e.target).text() == "退货退款" && refund == 1) {
            return;
        }
        //处理再次点击都变为请选择
        $(e.target).hasClass('current-yesround') ? null : reasonChange(0);
        $(e.target).addClass('current-yesround').siblings().removeClass('current-yesround');
        let type = $(e.target).attr('data-type');
        typeChange(type);
    };

    componentDidMount() {
        let {refund, typeChange} = this.props;
        if (refund == 1) {
            typeChange('refund');
            $(".current-noround").addClass('current-yesround');
        }
    }

    render() {
        let {refund} = this.props;
        let afterType;
        afterType = refund == 0 ? popupData.type.list : popupData.type.onlylist;
        return (
            <section className="apply-section">
                <div className="type-container">
                    <div>售后类型</div>
                    <div className="after-type">
                        {afterType.map((item, i) => {
                            return (
                                <i key={item.select} data-type={item.select} className="current-noround"
                                   onClick={(e) => {
                                       this.checkAftertype(e)
                                   }}>
                                    {item.method}
                                </i>
                            )
                        })}
                    </div>
                </div>
            </section>
        )
    }
}

class ApplyReason extends Component {
    constructor(props) {
        super(props)
        this.state = {
            num: this.props.payment
        }

    }

    changeAmout = (event) => {
        let str = event.target.value;
        let {dispatch} = this.props;
        this.setState({
            num: (str.match(/^(\d)*\.?\d*$/) || [''])[0]
        }, () => {
            dispatch(createActions("changeMoney", {money: $("#logiCode").val()}))
        });
    };

    render() {
        //退货退款可编辑退款金额
        let {refund, ctrlPopup, reason, listType, data} = this.props;
        let {num, primary_image, spec_nature_info, title, payment, freight, is_gift} = data;
        return (
            <section className="apply-section">
                <div className="list-body">
                    <div className="list-img">
                        <Link>
                            <img
                                src={primary_image ? addImageSuffix(primary_image, '_s') : require('../../../img/icon/loading/default-no-item.png')}/>
                        </Link>
                    </div>
                    <div className="list-body-ctt">
                        <div className="order-info-detail">
                            <div className="order-info-top">
                                <Link
                                    className="order-info-title">{title}
                                </Link>
                                <div className="info-price">
                                    <div className="order-info-type">{spec_nature_info}</div>
                                    <div className="right">×{num}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="logic logic-company">
                        <span>退款原因：</span>
                        <input type="text" placeholder="请选择" maxLength="20"
                               value={listType === "SELECT" ? "请选择" : reasonText[listType][reason]} disabled={true}/>
                        <span onClick={ctrlPopup.bind(null, "reason", true)}>
                            <img src="/src/img/icon/arrow/arrow-right-m-icon.png"
                                 width="10"/></span>
                    </div>
                    <div className="logic logic-order">
                        <span>退款金额：￥</span>
                        <input type="text" id="logiCode" readOnly={(refund == 1) || is_gift}
                               value={this.state.num}
                               onChange={(event) => {
                                   this.changeAmout(event)
                               }}
                               placeholder={`最多可退￥${payment}元`} maxLength="9"
                               name="amount"/>
                    </div>
                    <div className="limit-money">{`最多可退￥${payment}元`}{`含运费￥${freight}`}</div>
                </div>
            </section>
        )
    }
}


class ApplyDetail extends Component {
    render() {
        return (
            <div className="apply-section">
                <section className="apply-detail">
                    <h3>详细说明</h3>
                    <div className="area">
                        <textarea name="description" placeholder="最多200字" maxLength="200"
                                  onBlur={this.props.changeHandle}/>
                    </div>
                </section>
            </div>
        )
    }
}

class ApplyVoucher extends Component {
    render() {
        return (
            <section className="apply-section">
                <div className="apply-detail">
                    <h3>申请凭证</h3>
                    <MultiImgChoose maxLength={3} dispatch={this.props.dispatch} submitHandle={this.props.submitHandle}/>
                </div>
            </section>
        )
    }
}

//凭证选择
class MultiImgChoose extends Component {
    constructor(props) {
        //subArr为提交的url数组（服务端要求格式）;imgArr为完整的展示url数组
        super(props);
        this.state = {
            imgArr: [],
            subArr: [],
            mask: false
        };
        this.maxLength = props.maxLength || 3;
        this.selectIndex = 0;
    }

    choosePhoto = async (index, dom) => {
        let {dispatch} = this.props;
        let file = dom.files[0];
        if (!/^image\/(jpg|png|jpeg|bmp)$/.test(file.type)) {
            dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "亲，请上传jpg/png/jpeg/bmp格式的图片哦~"}}));
            return;
        }
        if (file.size >= 1024 * 1024 * 5) {
            dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "亲，请上传小于5M的图片哦~"}}));
            return;
        }
        this.selectIndex = index;
        let fileStream = await compress(file);
        this.changeMask(true);
        axios.request({
            ...pageApi.compressPhoto,
            data: {
                img: fileStream
            },
        }).then(result => {
            this.changeMask(false);
            this.changePhoto(result.data.data.file.complete_url, result.data.data.file.url);
            $("#imgfile").val('');
        }).catch(error => {
            dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "图片上传失败"}}));
            this.changeMask(false);
        })
    };
    changePhoto = (url, suburl) => {
        let {imgArr, subArr} = this.state;
        if (this.selectIndex >= imgArr.length) {
            imgArr.push(url);
            subArr.push(suburl);
            this.setState({
                imgArr: imgArr,
                subArr: subArr
            });
            this.props.dispatch(createActions('setImgArr', {imgArr: imgArr}));
            this.props.dispatch(createActions('setsubImgArr', {subArr: subArr}))
        } else {
            imgArr[this.selectIndex] = url;
            subArr[this.selectIndex] = suburl;
            this.setState({
                imgArr: imgArr,
                subArr: subArr
            });
            this.props.dispatch(createActions('setImgArr', {imgArr: imgArr}));
            this.props.dispatch(createActions('setsubImgArr', {subArr: subArr}))

        }
    };
    changeMask = (status) => {
        this.setState({
            mask: status
        })
    }
    deletePhoto = (index) => {
        const {imgArr, subArr} = this.state;
        imgArr.splice(index, 1);
        subArr.splice(index, 1);
        this.setState({
            imgArr: imgArr,
            subArr, subArr
        });
        this.props.dispatch(createActions('setImgArr', {imgArr: imgArr}));
        this.props.dispatch(createActions('setsubImgArr', {subArr: subArr}))

    };

    render() {
        let {submitHandle} = this.props;
        return (
            <div className="multi-img-choose c-clrfix">
                {this.state.imgArr.map((item, i) => {
                    return <form className="photo" key={i}>
                        <img src={item}/>
                        <input type="file" name="file" onChange={(e) => this.choosePhoto(i, e.target)}/>
                        <i className="red-delete-icon" onClick={e => this.deletePhoto(i)}> </i>
                    </form>
                })
                }
                {this.state.imgArr.length < this.maxLength &&
                <form className="photo">
                    <img src="/src/img/afterSale/voucher-img.png"/>
                    <input type="file" name="file" accept="image/gif,image/jpeg,image/jpg,image/png" id="imgfile"
                           onChange={(e) => this.choosePhoto(this.state.imgArr.length, e.target)}/>
                    {this.state.mask && <div className="img-mask">图片上传中</div>}
                </form>
                }
                <SubmitBtn mask={this.state.mask} submitHandle={submitHandle}/>
            </div>
        )
    }
}

class SubmitBtn extends Component {
    render() {
        let {mask,submitHandle} = this.props;
        return (
            <div className="btm-btn colour-btn" onClick={() => {submitHandle(mask)}}>提交申请</div>
        )
    }
}

//弹窗选择
class ApplyPopups extends Component {

    render() {
        const {listData, popup, listType, reason, show} = this.props;
        let listHtml = "";
        if (popup === "reason") {
            listHtml = listData.list[listType].map((item, i) => {
                return (
                    <div className="list" key={`reason-${i}`} onClick={(e) => this.props.reasonChange(item.select)}>
                        <div className="one">{item.content}</div>
                        {item.select == reason && <i className="current-yesround-icon"> </i>}
                    </div>
                )
            });
        }
        return (
            <div>
                {show && <Shady clickHandle={this.props.hidePopup}/>}
                <div className={`total-popup ${show ? "active" : ""}`}>
                    <div className="popup-top">{show && listData.title}<i className="black-close-icon"
                                                                          onClick={this.props.hidePopup}> </i></div>
                    <div className="popup-body">
                        {listHtml}
                    </div>
                </div>
            </div>
        )
    }
}


function afterSaleApplyState(state, props) {
    return {
        ...state.popup,
        ...state.afterSaleApply
    }
}

function afterSaleApplyDispatch(dispatch, props) {
    let {tid, refund} = props.location.query;
    return {
        dispatch: dispatch,
        resetData: () => {
            dispatch(createActions('resetData', {
                query: {
                    tid: tid,
                    listType: Number(refund) ? "SELECT" : "SELECT",
                    refund: refund !== undefined ? Number(refund) : ""
                }
            }));
            //dispatch(createActions('changeMoney', {money: Number(payment.trim())}));
        },
        moneyChange: (e) => {
            dispatch(createActions("changeMoney", {money: e.target.value.trim()}));
        },
        describeChange: (e) => {
            dispatch(createActions("changeDescribe", {description: e.target.value.trim()}))
        },
        ctrlPopup: (type, show) => {
            if (type === "reason") {
                dispatch((dispatch, getState) => {
                    let state = getState().afterSaleApply;
                    if (state.listType === "SELECT") {
                        dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "请选择售后类型"}}));
                    } else {
                        dispatch(createActions("ctrlPopup", {popup: type, show: show}));
                    }
                })
            } else {
                dispatch(createActions("ctrlPopup", {popup: type, show: show}));
            }
        },
        reasonChange: function (reason) {
            dispatch(createActions("reasonChange", {reason: reason}));
        },
        typeChange: function (type, reason) {
            dispatch(createActions("typeChange", {listType: type, reasonList: reason}))
        },
        hidePopup: () => {
            dispatch(createActions('hidePopup', {show: false}));
        },
        promptClose() {
            dispatch(popupActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
        },
    }
}

function afterSaleApplyProps(stateProps, dispatchProps, props) {
    let request = false;
    let {dispatch} = dispatchProps;
    return {
        ...stateProps,
        ...dispatchProps,
        ...props,
        applySubmit: (mask) => {
            if (request) return;
            if (stateProps.listType === "SELECT") {
                dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "请选择售后类型"}}));
                return;
            }
            if (stateProps.reason == 0) {
                dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "请选择退款原因"}}));
                return;
            }
            if (!(/^(\d)*\.?\d*$/).test(stateProps.money) || !stateProps.money) {
                dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "请输入正确的退款金额"}}));
                return;
            }
            if (!stateProps.data.is_gift) {
                if (parseFloat(stateProps.money) < 0.01) {
                    dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "退款金额不能小于0.01"}}));
                    return;
                }
            } else {
                if (parseFloat(stateProps.money) < 0) {
                    dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "退款金额不能小于0.00"}}));
                    return;
                }
            }

            if (parseFloat(stateProps.money) > parseFloat(stateProps.paymentLarg)) {
                dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "超出最多可退金额"}}));
                return;
            }
            if(mask){
                dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "正在上传图片，请稍候提交"}}));
                return;
            }
            request = true;
            axios.request({
                ...pageApi.submit,
                data: {
                    order_good_no: stateProps.tid,
                    type: stateProps.listType,
                    reason: reasonText[stateProps.listType][stateProps.reason],
                    amount: stateProps.money,
                    remark: stateProps.description,
                    images: stateProps.subArr
                }
            }).then(result => {
                dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: result.data.message || "申请成功"}}));
                setTimeout(() => {
                    browserHistory.replace('/afterSale/list');
                }, 1000)
            }).catch(error => {
                dispatch(popupActions('ctrlPrompt', {
                    prompt: {
                        show: true,
                        msg: error.response.data.message || "网络繁忙！"
                    }
                }));
                request = false;
                throw new Error(error);
            })
        }
    }
}

export default connect(afterSaleApplyState, afterSaleApplyDispatch, afterSaleApplyProps)(AfterSaleApply);