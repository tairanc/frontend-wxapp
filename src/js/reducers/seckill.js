import createReducers from './createReducers.js';
let initData = {
	state: "",
	now_time: "",
	toend: "",
};

function obserState(store) {
	let {now_time, toend, end_time, start_time,state} = store;
	now_time++;
	if (now_time < start_time) {
		state = 0;  //秒杀未开始
	} else if (now_time > end_time) {
		state = 1  //秒杀已结束
	} else {
		state = 2  //秒杀中
	}
	toend = end_time - now_time;
	return {...store, state, now_time, toend}
}

function initilize(state, result) {
	return obserState({...state, ...result});
}

function seckill(state = initData, action) {
	switch (action.type) {
		case "clearData":
			return initData;
		case "initData":
			return initilize(state, action);
		case "observeState":
			return obserState(state);
		default:
			return {...state}
	}
}

export default createReducers("seckill", seckill, initData);
