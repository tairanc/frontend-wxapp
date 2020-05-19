import axios from 'axios';
import {WXAPI} from 'config/index';




export const search = params => axios.post(`${WXAPI}/search/items`,params);
export const collection = params => axios.get(`${WXAPI}/user/getItemCollectionList`,{params:params});
export const del = params => axios.get(`${WXAPI}/user/removeItemCollection`,{params:(params)})