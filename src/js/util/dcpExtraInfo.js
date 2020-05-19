//埋点加入购物车
export function setExtraInfoGwc(goodsName, itemId, skuId, quantity, httpcode, serviceCode, message) {
    return {
        type: "ds-gwc",
        goodsName:goodsName,
        goodsId: itemId,
        skuId: skuId,
        goodsCounts: quantity,
        httpcode: httpcode,
        serviceCode: serviceCode,
        message: message
    }
}
//埋点收藏夹
export function setExtraInfoScj(itemId, goodsName, shopId, httpcode, serviceCode, message) {
    let extraInfo;
    if(itemId)
        extraInfo = {
            type: "ds-scj",
            goodsId: itemId,
            goodsName:goodsName,
            httpcode: httpcode,
            serviceCode: serviceCode,
            message: message
        };
    if(shopId)
        extraInfo =  {
            type: "ds-scj",
            shopId: shopId,
            httpcode: httpcode,
            serviceCode: serviceCode,
            message: message
        };
    return extraInfo
}
//埋点关键字搜索
export function setExtraInfoGjzss(keyword, httpcode, serviceCode, message) {
    return {
        type: "ds-gjzss",
        keyword:keyword,
        httpcode: httpcode,
        serviceCode: serviceCode,
        message: message
    }
}
//埋点推荐列表
export function setExtraInfoTjlb(goodsId, goodsIds, orderNumber, httpcode, serviceCode, message) {
    return{
        type:'ds-tjlb',
        goodsId: goodsId, //详情页当前页面的商品id, 首页传"";
        goodsIds:goodsIds,
        orderNumber: orderNumber,
        httpcode: httpcode,
        serviceCode: serviceCode,
        message: message
    }
}
//埋点推荐列表商品点击
export function setExtraInfoTjdj(goodsId, orderNumber, httpcode, serviceCode, message) {
    return{
        type:'ds-tjdj',
        goodsId: goodsId,
        orderNumber: orderNumber,
        httpcode: httpcode,
        serviceCode: serviceCode,
        message: message
    }
}

