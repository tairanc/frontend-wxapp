import React, {Component} from 'react';
import CSSModules from 'react-css-modules'
import styles from './MarketHeader.scss';
import {RedLabel} from './Label';
import {miniProgramShopCart} from 'js/util/miniProgramLogin';
import {Link, browserHistory} from 'react-router';

import {DIR} from 'config/index'


const compare = function (prop, sort) {
    return function (obj1, obj2) {
        const val1 = parseFloat(obj1[prop]);
        const val2 = parseFloat(obj2[prop]);
        if (val1 < val2) {
            if(sort){
                return -1;
            } else {
                return 1
            }
        } else if (val1 > val2) {
            if(sort){
                return 1;
            } else {
                return -1
            }

        } else {
            return 0;
        }
    }
}


//购物车store 营销 头部信息
@CSSModules(styles)
export default class MarketHeader extends Component {
    render() {
        let {name, rules, type, shop_id, group_promotion_id, edit, exchangeDataLength, Price, Num} = this.props;
        let _cart_list = this.props.cart_list
        let cart_list = JSON.parse(JSON.stringify(_cart_list))
        let activity = "";
        let is_satisfied = false;
        let perPrice = 0
        switch (type) {
            //满减
            case "FullMinus":
                let FullMinus = rules['FullMinus']
                let perDeductTmp = 0;
                let fullMinusMoney = 0;
                FullMinus.sort(compare('limit_money', true))
                if(rules['has_high_limit'] == 0) {
                    let multiple = Math.floor((Price/(FullMinus[FullMinus.length-1].limit_money)))
                    if( multiple > 0 ) {
                        perDeductTmp =  multiple * (parseFloat(FullMinus[FullMinus.length-1].deduct_money))
                        fullMinusMoney = multiple * (parseFloat(FullMinus[FullMinus.length-1].limit_money))
                        is_satisfied = perDeductTmp > 0 ? true: false
                        Price = Math.floor((Price/(FullMinus[FullMinus.length-1].limit_money))) * (parseFloat(FullMinus[FullMinus.length-1].limit_money))
                    } else {
                        FullMinus.some((full) => {
                            const { limit_money, deduct_money } = full
                            if(Price < parseFloat(limit_money) ){
                                return true
                            } else {
                                perDeductTmp = +deduct_money
                                fullMinusMoney = +limit_money
                                is_satisfied = true
                                return false
                            }
                        })
                    }
                } else {
                    FullMinus.some((full) => {
                        const { limit_money, deduct_money } = full
                        if(Price < parseFloat(limit_money) ){
                            return true
                        } else {
                            perDeductTmp = deduct_money
                            fullMinusMoney = +limit_money
                            is_satisfied = true
                            return false
                        }
                    })
                }
                activity = <EditLink link={`/searchResult?promotion_id=${ group_promotion_id }`}
                                     edit={edit}>
                    <RedLabel styleName="tag" >{"满减"}</RedLabel>
                    {is_satisfied ?
                        <span styleName="activityText">{
                            `已购满${fullMinusMoney}元, 已减${perDeductTmp}元`
                        }</span> :
                        <span styleName="activityText">
							{
                                (() => {
                                    let fullMinusText = ''
                                    rules['FullMinus'].some((rule, i) => {
                                        if(i === (rules['FullMinus'].length - 1)){
                                            fullMinusText += `满${rule.limit_money}减${rule.deduct_money}`
                                            return true
                                        } else {
                                            fullMinusText += `满${rule.limit_money}减${rule.deduct_money}，`
                                            return false
                                        }
                                    })
                                    return fullMinusText
                                })()
                            } { rules.has_high_limit == 0 ? "，上不封顶" : "" }
						</span>
                    }
                    <span styleName="linkRight">{is_satisfied? "再逛逛":"去凑单"} <i styleName="redArrowIcon"> </i></span>
                </EditLink>;
                break;
            //满折
            case "FullDiscount":
                let fullDiscount = 0;
                let FullDiscount = rules['FullDiscount']
                FullDiscount.sort(compare('full', true))
                if( Num >= FullDiscount[0].full){
                    is_satisfied = true
                    let tmpFull = 1
                    let tmpPercent = 0
                    rules['FullDiscount'].map((discount) => {
                        if(tmpFull <= discount.full){
                            tmpFull = parseFloat(discount.full)
                        }
                        if(Num >= discount.full && tmpFull <= discount.full){
                            tmpFull = parseFloat(discount.full)
                            tmpPercent= discount.percent
                            fullDiscount = tmpFull
                        }
                    })
                    perPrice = Price * (1 - tmpPercent/100)
                }
                activity = <EditLink link={`/searchResult?promotion_id=${ group_promotion_id }`}
                                     edit={edit}>
                    <RedLabel styleName="tag">{"满折"}</RedLabel>
                    <span className="g-col-1">{
                        is_satisfied ?
							`已购满${fullDiscount}件，已减${perPrice.toFixed(2)}元`
							:
                            (() => {
                                let fullDiscountText = ''
                                rules['FullDiscount'].some((rule, i) => {
                                    if(i === (rules['FullDiscount'].length - 1)){
                                        fullDiscountText += `${rule.full}件${rule.percent/10}折`
                                        return true
                                    } else {
                                        fullDiscountText += `${rule.full}件${rule.percent/10}折，`
                                        return false
                                    }
                                })
                                return fullDiscountText
                            })()
                    }</span>
                    <span styleName="linkRight">{is_satisfied? "再逛逛":"去凑单"} <i styleName="redArrowIcon"> </i></span>
                </EditLink>;
                break;
            //N元任选
            case "OptionBuy":
                if(Num >= rules['OptionBuy']['quantity']){
                    is_satisfied = true
                    let OptionBuy = rules['OptionBuy']
                    let tmpBuyQuantity = 0
                    let perBuyPrice = 0
                    if(Price >= OptionBuy.amount){
                        let _cart_list = JSON.parse(JSON.stringify(cart_list))
                        _cart_list.sort(compare('sell_price', false))
                        for(let i = 0; i < _cart_list.length; i++){
                            let cart = _cart_list[i]
                            let {promotion_single, sell_price, quantity, check} = cart
                            let cart_price = +sell_price;
                            if( promotion_single && promotion_single.price && promotion_single.price >0 ) {
                                if(promotion_single.type === "SecKill"){
                                    if( new Date(promotion_single.start_time).getTime() <= new Date().getTime() < new Date(promotion_single.end_time).getTime()){
                                        cart_price = +promotion_single.price
                                    }
                                } else {
                                    cart_price = +promotion_single.price
                                }
                            }
                            let isSingle = promotion_single && ['FlashSale', 'DirectReduction', 'SecKill'].indexOf(promotion_single.type) > -1 ? true: false
                            if(check){
                                if(tmpBuyQuantity < parseFloat(OptionBuy.quantity)){
                                    for(let j = 0; j < quantity; j ++){
                                        if(tmpBuyQuantity < parseFloat(OptionBuy.quantity)){
                                            tmpBuyQuantity++
                                            if(promotion_single && promotion_single.price && promotion_single.price >0){
                                                perBuyPrice += parseFloat(promotion_single.price)
                                            } else {
                                              perBuyPrice += parseFloat(sell_price)
                                            }
                                        } else {
                                            break
                                        }
                                    }
                                } else {
                                    break
                                }
                            }
                        }
                    }
                    if(Price >= parseFloat(OptionBuy.amount)){
                        perPrice = (perBuyPrice - parseFloat(OptionBuy.amount))
                    } else {
                        perPrice = 0
                    }
                }
                activity = <EditLink link={`/searchResult?promotion_id=${ group_promotion_id }`}
                                     edit={edit}>
                    <RedLabel styleName="tag">{"N元任选"}</RedLabel>
                    {is_satisfied ?
                        <span styleName="activityText">{`已购满${rules['OptionBuy']['quantity']}件，已减${perPrice.toFixed(2)}元`}</span> :
                        <span styleName="activityText">
							{`${rules['OptionBuy']['amount']}元任选${rules['OptionBuy']['quantity']}件`}
                        </span>
                    }
                    <span styleName="linkRight">{is_satisfied? "再逛逛":"去凑单"} <i styleName="redArrowIcon"> </i></span>
                </EditLink>;
                break;
            //换购
            case "ExchangeBuy":
                if( Price >= parseFloat(rules['ExchangeBuy']['exchange_full']) ){
                    is_satisfied = true
                }
                activity = <EditLink link={`/searchResult?promotion_id=${ group_promotion_id }`}
                                 edit={edit}>
                    <RedLabel styleName="tag">{'换购'}</RedLabel>
                    {is_satisfied ? exchangeDataLength ?
                        <span styleName="activityText">{`已购满${rules['ExchangeBuy']['exchange_full']}元，已换购${exchangeDataLength}件热销商品`}</span>:
                        <span styleName="activityText">{`已购满${rules['ExchangeBuy']['exchange_full']}元，可换购${rules['ExchangeBuy']['exchange_count']}件热销商品`}</span> :
                        <span styleName="activityText">
								{`满${rules['ExchangeBuy']['exchange_full']}加价可换购${rules['ExchangeBuy']['exchange_count']}件热销商品`}
							</span>
                    }
                    <span styleName="linkRight">{is_satisfied? "再逛逛":"去凑单"} <i styleName="redArrowIcon"> </i></span>
                </EditLink>;
            default:
                break;
        }
        return (
            <div styleName="marketHeader">
                { activity }
            </div>
        )
    }
}

@CSSModules(styles)
class EditLink extends Component {
    render() {
        let {edit, link} = this.props
        return(
            edit ?
                <span styleName="activityLink">
                    { this.props.children }
                </span>
                :
                <Link to={DIR+link} styleName="activityLink">
                    { this.props.children }
                </Link>
        )
    }
}

@CSSModules(styles)
export class ExchangeRow extends Component {
    render() {
        const {rules, Price, group_promotion_id, hasExchange} = this.props;
        let is_satisfied = false;
        if( Price >= parseFloat(rules['ExchangeBuy']['exchange_full']) ){
            is_satisfied = true
        }
        let able = true
        let ExchangeBuy = rules['ExchangeBuy']
        return (
            <div styleName="activeRow" data-active-row className="c-tr">
                {is_satisfied ?
                    <a onClick={(e)=>{
                        e.preventDefault();
						able ? browserHistory.push(`${DIR}/exchangeItem?promotion_id=${ group_promotion_id }&fullPrice=${ExchangeBuy['exchange_full']}&limit=${ExchangeBuy['exchange_count']}`) : miniProgramShopCart();
                    }}
                          styleName="redBtn"
                          className="c-dpib c-tc">
                        { hasExchange ? "重新换购" : "立即换购"}
                    </a> :
                    <Link onClick={(e)=>{
						e.preventDefault();
						able ? browserHistory.push(`${DIR}/exchangeItem?look=1&promotion_id=${ group_promotion_id }&fullPrice=${ExchangeBuy['exchange_full']}&limit=${ExchangeBuy['exchange_count']}`) : miniProgramShopCart();
					}}
                          styleName="redBtn"
                          className="c-dpib c-tc">查看换购</Link>
                }
            </div>
        )
    }
}