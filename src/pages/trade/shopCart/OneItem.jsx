import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './OneItem.scss';
import {PureComponent} from 'component/modules/HOC';
import CheckIcon from './CheckIcon';
import NumWidget from './NumWidget';
import {Link} from 'react-router';
import {timeUtils} from 'js/common/utils';
import {RedLabel,GreyLabel, RedBgLabel} from './Label';
import {addImageSuffix} from "src/js/util/index"
import {DIR} from 'config/index'

const _formatDate = function( time ){
    if( isNaN( Number(time) ) ) return "";
    if(time.toString().length == 10){
        time = new Date( time*1000 );
    } else {
        time = new Date( time );
    }
    return {
        year: time.getFullYear(),
        month: timeUtils.toTwoDigit(time.getMonth()+1 ),
        date: timeUtils.toTwoDigit(time.getDate()),
        hour: timeUtils.toTwoDigit( time.getHours()),
        minute: timeUtils.toTwoDigit(time.getMinutes()),
        second: timeUtils.toTwoDigit(time.getSeconds())
    }
}

const _cnFormat = function (time) {
    let dateObj = _formatDate(time);
    if(!dateObj){
        return "";
    }
    let {year,month,date,hour,minute} = dateObj;
    return `${month}月${date}日${hour}:${minute}`
}

const compare = function (prop) {
    return function (obj1, obj2) {
        var val1 = parseFloat(obj1[prop]);
        var val2 = parseFloat(obj2[prop]);
        if (val1 < val2) {
            return -1;
        } else if (val1 > val2) {
            return 1;
        } else {
            return 0;
        }
    }
}


@CSSModules(styles, {allowMultiple: true})
export default class OneItem extends PureComponent {
    activityTime(name){
        let { promotion_single } = this.props.data;
        if( !promotion_single ){
            return "";
        }
        let isStart =  new Date().getTime() > new Date(promotion_single.start_time.replace(/-/g,'/')).getTime();
        return _cnFormat( isStart ? new Date(promotion_single.end_time.replace(/-/g,'/')).getTime(): new Date(promotion_single.start_time.replace(/-/g,'/')).getTime()) + (name || promotion_single.name) + (isStart?"结束":"开始");
    }
    secKillActivityTime(){
        let { promotion_single } = this.props.data;
        if( !promotion_single ){
            return "";
        }
        let isEnd = (new Date().getTime() > new Date(promotion_single.end_time.replace(/-/g,'/')).getTime()) ? true : false;
        let isStart =  (new Date().getTime() > new Date(promotion_single.start_time.replace(/-/g,'/')).getTime()) ? true : false;
        if(!isEnd){
            if(isStart){
                return <div>
                    {`${_cnFormat(new Date(promotion_single.end_time.replace(/-/g,'/')))}秒杀结束`}
                    <div>
                        商品仅支持详情页购买
                        <i styleName="redArrowIcon"></i>
                    </div>
                </div>;
            } else {
                return <div>
                    {`${_cnFormat(new Date(promotion_single.start_time.replace(/-/g,'/')))}秒杀开始`}
                    <div>
                        商品仅支持详情页购买
                        <i styleName="redArrowIcon"></i>
                    </div>`

                </div>
            }
        } else {
            return "";
        }

    }
    _tagName(type) {
        switch(type){
            case 'FlashSale':
                return '特卖';
            case 'DirectReduction':
                return '直降';
            case 'GroupBuy':
                return '拼团';
            case 'SecKill':
                return '秒杀';
            case 'GiftBuy':
                return '买赠';
            case 'FullMinus':
                return '满减';
            case 'FullDiscount':
                return '满折';
            case 'OptionBuy':
                return 'N元任选';
            case 'ExchangeBuy':
                return '加价换购';
            default:
                return ''
        }

    }
    render() {
        const {edit, data, invalid, quantity, realStore} = this.props;
        let { item_id, promotion_single, store, is_deleted, sku_id, cart_id, check} = data;
        let isSingle = promotion_single && ['FlashSale', 'DirectReduction', 'SecKill'].indexOf(promotion_single.type) > -1 ? true: false
        if(promotion_single && (promotion_single.type === 'FlashSale' || promotion_single.type === 'SecKill')){
            if( ( new Date(promotion_single.start_time.replace(/-/g,'/')).getTime() <= new Date().getTime() ) && (new Date().getTime() <= new Date(promotion_single.end_time.replace(/-/g,'/')).getTime()) ){
                store = promotion_single.store
            }
        }
        let buyLimit = store
        if(promotion_single && promotion_single.user_buy_limit && promotion_single.user_buy_limit > 0){
            buyLimit = promotion_single.user_buy_limit
        }
        if(buyLimit && parseFloat(buyLimit) > parseFloat(store)){
            buyLimit = store
        }
        let price = +data.sell_price;
        if( promotion_single && promotion_single.price && promotion_single.price >0 ) {
            if(promotion_single.type === "SecKill"){
                if( new Date(promotion_single.start_time.replace(/-/g,'/')).getTime() <= new Date().getTime() < new Date(promotion_single.end_time.replace(/-/g,'/')).getTime()){
                    price = +promotion_single.price
                }
            } else {
                price = +promotion_single.price
            }
        }
        let _img = data.image ? data.image: require('../../../img/icon/loading/default-no-item.png')
        let promotionSingleQuantity = () => {
            let text1 = promotion_single && promotion_single.type != 'SecKill' && promotion_single.user_buy_limit && promotion_single.user_buy_limit > 0 ?
                <p>限购{ promotion_single.user_buy_limit}件</p>:
                ((store < 6 && promotion_single && promotion_single.type != 'SecKill') || (store < 6 && !promotion_single))? <p>仅剩{store}件</p>:""
            if(!text1){
                return ""
            }
            return text1
        }
        const standardPrice = price
        const isReduce = +data.cart_price - standardPrice > 0? true: false
        return <div styleName="oneItem">
            {/*checkbox  缺少相关字段*/}
            <div styleName={ data.promotion_single && data.promotion_single.type === "SecKill" ? 'checkbox secKillChackbox': 'checkbox'}>
                <CheckIcon handleCheck={ this.props.handleCheck }
                           invalid={is_deleted}
                           isCheck={data.check }
                           seckill={ data.promotion_single && data.promotion_single.type === "SecKill"}
                           disable={ data.promotion_single &&  (data.promotion_single.type=== "ExchangeBuy")}/>
            </div>
            {/*商品信息*/}
            <Link styleName="itemInfo"
                 data-item-info
                 to={`${DIR}item?item_id=${item_id}`}
                 onClick={(e) => {
                     if (edit) {
                         e.preventDefault()
                     }
                 } }
            >
                {/*商品图片*/}
                <div styleName="itemImg">
                    <div styleName="imgClick">
                        <img src={addImageSuffix(_img, '_t')}
                             width="70" height="70"/>
                        { data.is_deleted || store <= 0?
                            <img styleName="imgNoItem" src={require('../../../img/shopCart/no-item.png')}/> : "" }
                    </div>
                    <div styleName="numInfo">
                        {
                            promotionSingleQuantity()
                        }
                        { store <= 0 && <p>库存不足</p> }
                    </div>
                </div>
                {/*商品详细信息*/}
                <div styleName="itemDetail">
                    { edit ?
                        <div styleName="itemCtrl">
                            <NumWidget data={data}
                                       disable={data.promotion_single &&  (data.promotion_single.type=== "ExchangeBuy")}
                                       buyLimit={ buyLimit }
                                       handlePlus={this.props.handlePlus}
                                       quantity={ this.props.quantity }
                                       handleReduce={this.props.handleReduce }
                                       handleNum={this.props.handleNum }
                                       handleInputNum={this.props.handleInputNum}/>
                            { !this.props.hiddenDelete ? <div styleName="deleteBtn" onClick={this.props.handleDelete}>
                                <img src={require('../../../img/icon/delete-box-icon.png')}/>
                            </div> : ""}
                        </div> :
                        <div styleName="title">
                            { promotion_single && promotion_single.type !== 'SecKill' && promotion_single.type !== 'GiftBuy' && <RedLabel className="c-mr3">{this._tagName(promotion_single.type)}</RedLabel> }
                            <span style={{verticalAlign: "top"}}>{data.title}</span>
                        </div>
                    }
                    {data.spec_text ?<div styleName="props" className={edit?"props-click":""} onClick={() => {edit && this.props.popupSaleAttr(item_id, _img, sku_id, cart_id)}}>
                        <div styleName={edit?"propsText":""}>{data.spec_text }</div>
                        { edit && <i styleName="propsDownIcon"></i>}
                    </div>: ""}
                    { data.tax_rate > 0  && <div styleName="tax" className={edit?"c-vh":""}>
                        预计税费：¥{+(+data.tax_rate * price * quantity).toFixed(2)}
                    </div>}
                    {   isReduce ?
                        <div styleName="reduce" className={edit?"c-vh":""} >
                            已降¥{+(+data.cart_price - standardPrice).toFixed(2)}
                        </div>:""
                    }
                    {/*特卖时间*/}
                    {promotion_single && promotion_single.type === "FlashSale" &&
                    <div styleName="activity" className={edit?"c-vh":""}>
                        {this.activityTime('特卖')}
                    </div>
                    }
                    {/*秒杀时间*/}
                    {promotion_single && promotion_single.type === "SecKill" &&
                    <div styleName="activity" className={edit?"c-vh":""}  style={{'WebkitLineClamp': 2}}>
                        {this.secKillActivityTime()}

                    </div>
                    }

                    {!edit ?
                        <div styleName="numPrice" style={{marginTop:
                                (data.spec_text || (data.tax_rate > 0 && data.tax > 0) || promotion_single && promotion_single.type === "FlashSale") ? 0: "19px"}}>
							<span styleName="price">
								¥{ +price }
							</span>
                            <span styleName="num">×{quantity}</span>
                        </div>:""
                    }
                    { edit ? <div style={{height:"4px"}}> </div>:""}
                </div>
            </Link>
        </div>
    }
}

@CSSModules(styles, {allowMultiple: true})
export class SpecItem extends PureComponent{
    _tagName(type) {
        switch(type){
            case 'FlashSale':
                return '特卖';
            case 'DirectReduction':
                return '直降';
            case 'GroupBuy':
                return '拼团';
            case 'SecKill':
                return '秒杀';
            case 'GiftBuy':
                return '买赠';
            case 'FullMinus':
                return '满减';
            case 'FullDiscount':
                return '满折';
            case 'OptionBuy':
                return 'N元任选';
            case 'ExchangeBuy':
                return '加价换购';
            default:
                return ''
        }
    }
    render(){
        const {edit, data,give,type, mainQuantity} = this.props;
        let {promotion_single, item_id, sku_id, cart_id, store} = data;
        let price = promotion_single ? +promotion_single.price : (data.sell_price ? +data.sell_price: data.price);
        if(type == "ExchangeBuy"){
            price = data.price
        }
        let _img = data.image ? data.image: require('../../../img/icon/loading/default-no-item.png')
        let giftQuantity = (data.base && mainQuantity) ? ((+data.base) * +mainQuantity) : 0
        if( parseFloat(store) < parseFloat(giftQuantity) ) {
            giftQuantity = parseFloat(store)
        }
        return <div styleName="specItem" data-spec-item >
            <div styleName={`specInfo ${ store <= 0 ? "invalid": ""}`}  data-item-info >
                {/*商品图片*/}
                <div styleName="itemImg">
                    <Link styleName="imgClick"
                          to={`${DIR}/item?item_id=${item_id}`}
                          onClick={(e) => {
                              if (edit) {
                                  e.preventDefault()
                              }
                          } }>
                        <img src={addImageSuffix(_img, '_t')}
                             width="70" height="70"/>
                        { store <= 0  ?
                            <img styleName="imgNoItem" src={require('../../../img/shopCart/no-item.png')}/> : "" }
                    </Link>
                </div>
                {/*商品详细信息*/}
                <div styleName="itemDetail">
                    <Link styleName="title" to={`${DIR}item?item_id=${item_id}`}>
                        { promotion_single && ( store <= 0 ?
                                <GreyLabel className="c-mr3">{promotion_single.type}</GreyLabel>:
                                <RedLabel className="c-mr3">{promotion_single.type}</RedLabel>
                        )
                        }
                        {
                            (type === "ExchangeBuy") &&  <RedLabel className="c-mr3">换购</RedLabel>
                        }

                        <span style={{verticalAlign: "top"}}>{data.title}</span>
                    </Link>
                    {data.spec_text ? <div styleName="specProps" onClick={() => { !give  && type !== "ExchangeBuy" && edit && this.props.popupSaleAttr(item_id, _img, sku_id, cart_id)}}>
                        {data.spec_text }
                    </div>: ""}
                    { data.tax_rate > 0  && <div styleName="tax" className={edit?"c-vh":""}>
                        预计税费：¥{+(+data.tax_rate * price * quantity).toFixed(2)}
                    </div>}
                    <div styleName="numPrice" style={{marginTop: (data.spec_text || (data.tax_rate > 0 && data.tax > 0))? 0: "19px"}}>
                        { give ?
                            <RedBgLabel className={`c-fl ${store <= 0 ? "c-bg999": "c-bgdred"}`}>赠品</RedBgLabel> :
                            <span styleName="price">
								¥{ +price }
						</span>
                        }
                        <span styleName="num">×{ giftQuantity || 1}</span>
                    </div>
                </div>
            </div>
        </div>
    }
}
