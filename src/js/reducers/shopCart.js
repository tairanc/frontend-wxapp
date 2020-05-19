import createReducers from './createReducers.js';
import Immutable from 'immutable';

const initialState = {
  load: true,
  data: "",
  error: false,
  netError:false,
  cartTotal: {
    num: 0,
    strip: 0,
    price: 0,
    tax: 0,
    commonNum: 0,
    commonPrice: 0
  },
  curTime:new Date(),
  recommendList:[],
  coupon:{
    list:[],
    shopName: "",
    show: false
  },
  saleAttr: {
    data: "",
    show: false,
    img:"",
    select: "",
    sku_id: ""
  },
  editNum: 0,
  dividePrompt: false,
};


function initialData(state, result, update, exchangeItem) {
  let imState = Immutable.fromJS(state);
  let _state = JSON.parse(JSON.stringify(state))
  let _data = _state.data
  imState = imState.set("load", false);
  if (!result.status && !update) {
    return imState.toJS();
  }
  let {data} = result
  if(_data) {
    data = compareCheck(_data, data)
  }
  imState = imState.set("data", updateCheck(data));
  imState = imState.set("curTime", data.current_time);
  imState = imState.set("cartTotal", computeTotal(data.shop_cart, exchangeItem));
  return imState.toJS();
}

function compareCheck(oldData, newData) {
  let _oldData = JSON.parse(JSON.stringify(oldData))
  let _newData = JSON.parse(JSON.stringify(newData))
  let checkList = {}
  let old_shop_cart = _oldData.shop_cart
  let new_shop_cart = _newData.shop_cart
  old_shop_cart.map((oldshop) => {
    let old_promotion_list = oldshop.promotion_list
    let old_shop_info = oldshop.shop_info
    let { shop_id } = old_shop_info
    checkList[shop_id] = {}
    old_promotion_list.map((promotion) => {
      let { cart_list } = promotion
      cart_list.map((cart) => {
        let { group_promotion_id, check, cart_id } = cart
        if( check ){
          if( checkList[shop_id][group_promotion_id] ) {
            checkList[shop_id][group_promotion_id].push(cart_id)
          } else {
            checkList[shop_id][group_promotion_id] = []
            checkList[shop_id][group_promotion_id].push(cart_id)
          }
        }
      })
    })
  })
  new_shop_cart.map((newshop) => {
    let new_promotion_list = newshop.promotion_list
    let new_shop_info = newshop.shop_info
    let { shop_id } = new_shop_info
    new_promotion_list.map((promotion) => {
      let { cart_list } = promotion
      cart_list.map((cart) => {
        let { group_promotion_id, cart_id } = cart
        if(checkList[shop_id] && checkList[shop_id][group_promotion_id] && checkList[shop_id][group_promotion_id].indexOf(cart_id) > -1){
          cart.check = true
        }
      })
    })
  })
  return _newData
}


function updateCheck(data) {
  let cartCheck = true
  data.shop_cart.length > 0 && data.shop_cart.map((shop) => {
    let { promotion_list, shop_info } = shop;
    let storeCheck = true
    promotion_list.map((promotion) => {
      let { cart_list } = promotion
      cart_list.map((cart) => {
        if(typeof cart.check === 'undefined'){
          cart.check = false
        }
        if( !cart.check ) {
          storeCheck = false
        }
      })
    })
    if(typeof shop_info.check === 'undefined'){
      shop_info.storeCheck = storeCheck
    }
    if( !storeCheck ) {
      cartCheck = false
    }
  })
  data.cartCheck = cartCheck
  return data;
}

function updateNumber(data) {
  //购物车数量
  let number = 0;
  if (data.valid_items.length) {
    data.valid_items.forEach((list, i) => {
      list.activity.forEach((item, j) => {
        Array.isArray(item.items) ? number += item.items.length : "";
      })
    })
  }
  if (data.invalid_items.length) {
    number += data.invalid_items.length;
  }
  return number;
}

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

function computeTotal(data, exchangeItem) {
  let cartTotal = {
    commonNum: 0,
    commonPrice: 0,
    num: 0,
    strip: 0,
    disPrice: 0, //合计（不含税）不含换购
    price: 0,    //总额
    tax: 0,
    discount:0,  //优惠
  };
  if (!(data && data.length )) {
    return cartTotal;
  }
  //满减
  //满折
  //N元任选
  //加价换购

  let allPrice = 0
  let perPrice = 0
  let total_quantity = 0
  data.forEach((shop) => {
    let promotion_list = shop.promotion_list
    let shop_info = shop.shop_info
    promotion_list.map((promotion) => {
      let _cart_list = promotion.cart_list
      let cart_list = JSON.parse(JSON.stringify(_cart_list))
      let price = 0;
      let promotionQuantity = 0;
      cart_list.map((cart) => {
        let {promotion_single, quantity, sell_price, check, biz_rules} = cart
        let isSingle = promotion_single && ['FlashSale', 'DirectReduction', 'SecKill'].indexOf(promotion_single.type) > -1 ? true: false
        quantity = parseFloat(quantity)
        let isSecKill = false
        if( cart.promotion_single && cart.promotion_single.type === "SecKill" ){
          isSecKill = true
        }
        let _price = 0
        let bizPrice = ''
        if(biz_rules && biz_rules.length > 0){
          biz_rules.sort(compare('threshold', true))
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
          bizPrice = !isSingle && biz_rules && biz_rules.length > 0 ? (() => {
            let _p = cart_price
            biz_rules.some((rules) => {
              if( parseFloat(rules.threshold) > parseFloat(quantity)) {
                return true
              } else {
                _p = +rules.sell_price
                return false
              }
            })
            return _p
          })():""
        }
        if(check && !isSecKill){
          total_quantity += quantity;
          promotionQuantity += quantity;
          if(promotion_single && promotion_single.price && promotion_single.price >0){
            price += quantity * parseFloat(promotion_single.price)
          } else {
            if(bizPrice){
              price += parseFloat(bizPrice)* parseFloat(quantity)
            } else {
              price += parseFloat(sell_price)* parseFloat(quantity)
            }
          }
        }
      })
      switch (promotion.type){
        case 'FullMinus': //满减
          let FullMinus = promotion.rules['FullMinus']
          let perDeductTmp = 0;
          FullMinus.sort(compare('limit_money', true))
          if(promotion.rules['has_high_limit'] == 0){ //无限制
            let multiple = Math.floor((price/(FullMinus[FullMinus.length-1].limit_money)))
            if( multiple > 0 ){
              perDeductTmp = multiple * FullMinus[FullMinus.length-1].deduct_money
            } else {
              FullMinus.some((full) => {
                const { limit_money, deduct_money } = full
                if(price < parseFloat(limit_money) ){
                  return true
                } else {
                  perDeductTmp = +deduct_money
                  return false
                }
              })
            }
          } else {
            FullMinus.some((full) => {
              const { limit_money, deduct_money } = full
              if(price < parseFloat(limit_money) ){
                return true
              } else {
                perDeductTmp = +deduct_money
                return false
              }
            })
          }
          allPrice += price
          perPrice += perDeductTmp
          break;
        case 'FullDiscount': //满折
          let FullDiscount = promotion.rules['FullDiscount']
          let tmpFull = 1
          let tmpPercent = 0
          FullDiscount.map((discount) => {
            if(tmpFull <= parseFloat(discount.full)){
              tmpFull = parseFloat(discount.full)
            }
            if(promotionQuantity >= parseFloat(discount.full) && tmpFull <= parseFloat(discount.full)){
              tmpFull = parseFloat(discount.full)
              tmpPercent= parseFloat(discount.percent)
            }
          })
          allPrice += price
          if(tmpPercent){
            perPrice += price * (1 - tmpPercent/100)
          } else {
            perPrice += 0
          }
          break;
        case 'OptionBuy': //N元任选
          let OptionBuy = promotion.rules['OptionBuy']
          let tmpBuyQuantity = 0
          let perBuyPrice = 0
          if(price >= parseFloat(OptionBuy.amount)){
            let _cart_list = JSON.parse(JSON.stringify(cart_list))
            _cart_list.sort(compare('sell_price', false))
            for(let i = 0; i < _cart_list.length; i++){
              let cart = _cart_list[i]
              let {promotion_single, sell_price, quantity, check, biz_rules} = cart
              quantity = parseFloat(quantity)
              let isSecKill = false
              if( cart.promotion_single && cart.promotion_single.type === "SecKill" ){
                isSecKill = true
              }
              let bizPrice = ''
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
              bizPrice = !isSingle && biz_rules && biz_rules.length > 0 ? (() => {
                biz_rules.sort(compare('threshold', true))
                let _p = cart_price
                biz_rules.some((rules) => {
                  if( parseFloat(rules.threshold) > parseFloat(quantity)) {
                    return true
                  } else {
                    _p = +rules.sell_price
                    return false
                  }
                })
                return _p
              })():""

              if(check && !isSecKill){
                if(tmpBuyQuantity < parseFloat(OptionBuy.quantity)){
                  for(let j = 0; j < quantity; j ++){
                    if(tmpBuyQuantity < parseFloat(OptionBuy.quantity)){
                      tmpBuyQuantity++
                      if(promotion_single && promotion_single.price && promotion_single.price >0){
                        perBuyPrice += parseFloat(promotion_single.price)
                      } else {
                        if(bizPrice){
                          perBuyPrice += parseFloat(bizPrice)
                        } else {
                          perBuyPrice += parseFloat(sell_price)
                        }
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
          allPrice += price
          if(price >= parseFloat(OptionBuy.amount) && tmpBuyQuantity >= parseFloat(OptionBuy.quantity)){
            perPrice += (perBuyPrice - parseFloat(OptionBuy.amount))
          } else {
            perPrice += 0
          }
          break;
        case 'ExchangeBuy': //加价换购
          let full = parseFloat(promotion.rules['ExchangeBuy']['exchange_full'])
          let group_promotion_id = promotion['group_promotion_id']
          let exchangePrice = 0
          if( price >= full ){
            if(exchangeItem && exchangeItem.data && exchangeItem.data[group_promotion_id]){
              exchangeItem.data[group_promotion_id].map((ex) => {
                if(ex.check){
                  exchangePrice += parseFloat(ex.price)
                }
              })
            }
          }
          allPrice += price
          allPrice += exchangePrice
          break;
        default:
          allPrice += price
          break;
      }
    })
  })
  //缺少企业购优惠价格
  cartTotal = {
    num: total_quantity,
    strip: 0,
    disPrice: allPrice - (parseFloat(perPrice)), //合计（不含税）不含换购
    price: allPrice,    //总额
    tax: 0,
    discount: parseFloat(perPrice),  //优惠
    perPrice: perPrice,
    commonNum: total_quantity,
    commonPrice: allPrice
  };
  return cartTotal;
}

function updateCartCheck(state, data, exchangeItem) {
  let imState = Immutable.fromJS(state)
  data.cartCheck = !data.cartCheck
  data.shop_cart.map((cart) => {
    let { promotion_list, shop_info } = cart;
    if(data.cartCheck){
      shop_info.storeCheck = true
    } else {
      shop_info.storeCheck = false
    }
    promotion_list.map((promotion) => {
      let { cart_list } = promotion
      cart_list.map((cart) => {
        if(data.cartCheck){
          cart.check = true
        } else {
          cart.check = false
        }
      })
    })
  })
  imState = imState.set("data", data)
  imState = imState.set("cartTotal", computeTotal(data.shop_cart, exchangeItem));
  return imState.toJS()
}

function updateShopCheck(state, id, exchangeItem) {
  let imState = Immutable.fromJS(state)
  let imDate = imState.get("data").toJS()
  let { shop_cart } = imDate
  shop_cart.map((shop, i) => {
    let {promotion_list, shop_info} = shop
    if(shop_info.shop_id == id){
      shop_info.storeCheck = !shop_info.storeCheck
      promotion_list.map((promotion) => {
        let { cart_list } = promotion
        cart_list.map((cart) => {
          if(shop_info.storeCheck){
            cart.check = true
          } else {
            cart.check = false
            imDate.cartCheck = false
          }
        })
      })
    }
  })
  imState = imState.set("data", imDate)
  imState = imState.set("cartTotal", computeTotal(shop_cart, exchangeItem));
  return mapCartCheck(imState.toJS())
}

function updateSingleCheck(state, id, exchangeItem) {
  let imState = Immutable.fromJS(state)
  let imDate = imState.get("data").toJS()
  let { shop_cart } = imDate
  shop_cart.map((shop, i) => {
    let {promotion_list, shop_info} = shop
    shop_info.storeCheck = true
    promotion_list.map((promotion) => {
      let { cart_list } = promotion
      cart_list.map((cart) => {
        const {promotion_single} = cart
        let isSec = false
        if(cart.cart_id == id){
          cart.check = !cart.check
        }
        if(promotion_single && promotion_single.type === "SecKill") {
          isSec = true
        }
        if(!cart.check && !isSec){
          shop_info.storeCheck = false
        }
      })
    })
  })
  imState = imState.set("data", imDate)
  imState = imState.set("cartTotal", computeTotal(shop_cart, exchangeItem));
  return mapCartCheck(imState.toJS())
}

function handlePlus(state, id, num, exchangeItem) {
  let imState = Immutable.fromJS(state)
  let imDate = imState.get("data").toJS()
  let { shop_cart } = imDate
  shop_cart.map((shop, i) => {
    let {promotion_list, shop_info} = shop
    promotion_list.map((promotion) => {
      let { cart_list } = promotion
      cart_list.map((cart) => {
        if(cart.cart_id == id){
          cart.quantity = num
        }
      })
    })
  })
  imState = imState.set("data", imDate)
  imState = imState.set("cartTotal", computeTotal(shop_cart, exchangeItem));
  return mapCartCheck(imState.toJS())
}

function handleDelete(state, id, exchangeItem) {
  let imState = Immutable.fromJS(state)
  let imDate = imState.get("data").toJS()
  let { shop_cart } = imDate
  let promotionLevelGroupId = null
  shop_cart.map((shop, i) => {
    let {promotion_list, shop_info} = shop
    promotion_list.map((promotion) => {
      let { cart_list, promotion_level_group_id } = promotion
      cart_list.map((cart, i) => {
        if(cart.cart_id == id){
          cart_list.splice(i, 1);
          promotionLevelGroupId = promotion_level_group_id
        }
      })
    })
  })
  if(promotionLevelGroupId && exchangeItem && exchangeItem[promotionLevelGroupId]){
    delete exchangeItem[promotionLevelGroupId]
  }
  imState = imState.set("data", imDate)
  imState = imState.set("cartTotal", computeTotal(shop_cart, exchangeItem));
  return mapCartCheck(imState.toJS())
}

function mapCartCheck(state) {
  let imState = Immutable.fromJS(state)
  let imDate = imState.get("data").toJS()
  imDate.cartCheck = true
  let { shop_cart } = imDate
  shop_cart.map((shop, i) => {
    let {promotion_list, shop_info} = shop
    if(!shop_info.storeCheck){
      imDate.cartCheck = false
    }
  })
  imState = imState.set("data", imDate);
  return imState.toJS()
}

function shopCart(state = initialState, action) {
  switch (action.type) {
    case 'resetState':
      return initialState;
    case 'initialData':
      return initialData(state, action.result, action.update, action.exchangeItem);
    case 'initialError':
      return {...state, load:false, error:true};
    case 'netError':
      return {...state, load:false, netError:true};
    case 'initRecommend':
      return { ...state, recommendList: action.data};
    case 'computeEdit':
      return {...state, editNum: action.status ? state.editNum + 1 : state.editNum - 1};
    case 'updateCartCheck':
      return updateCartCheck(state, action.data, action.exchangeItem);
    case 'updateShopCheck':
      return updateShopCheck(state, action.id, action.exchangeItem);
    case 'updateSingleCheck':
      return updateSingleCheck(state, action.id, action.exchangeItem);
    case 'handleItemNum':
      return handlePlus(state, action.id, action.num, action.exchangeItem)
    case 'handleDelete':
      return handleDelete(state, action.id, action.exchangeItem)
    case 'ctrlCoupon':
      return {...state,
        coupon:{
          list: action.data,
          shopName: action.shopName,
          show: action.show
        }
      };
    case 'ctrlSaleAttr':
      return {
        ...state,
        saleAttr:{
          data: action.data,
          show: action.show,
          img: action.img,
          select: action.select ? action.select:"",
          sku_id: action.sku_id,
          cart_id: action.cart_id
        }
      };
    case 'saleAttrSelect':
      let _state = state.saleAttr.select
      _state[action['spec_id']] = action['spec_value_id']
      return {
        ...state,
        saleAttr:{
          data: state.saleAttr.data,
          show: state.saleAttr.show,
          img: state.saleAttr.img,
          select: _state,
          sku_id: state.saleAttr.sku_id,
          cart_id: state.saleAttr.cart_id
        }
      };
    case 'dividePrompt':
      return {...state, dividePrompt: action.status};
    default:
      return state;
  }
}

export default createReducers("shopCart", shopCart, initialState);