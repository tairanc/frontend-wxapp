import createReducers from './createReducers.js';
import Immutable from 'immutable';

const invoiceType = [
	{text: "电子发票", type: "electron", able: true,},
	{text: "普通发票", type: "common", able: true,},
	{text: "增值税发票", type: "tax", able: true,}
];
const mapTypeInvoice = ['', 'commonInvoice', 'taxInvoice', 'electronInvoice']
const mapInvoiceType = {
	"common": 1,
	"tax": 2,
	"electron": 3
};
const invoiceTypeMap = {
    "NORMAL": "common",
    "VAT": "tax",
    "ELEC": "electron"
};

const initialState = {
	load: true,
	update: true,
	data: "",
	origin: "",
	invoiceType: "electron",
	invoiceSelData: invoiceType,
	invoiceContent: [],
	invoiceId: "",
	showModal: false,
	invoiceNote: false,
    userForm: null,
	commonInvoice: {
		postData: {
			action: 1, //发票公司
			invoice_name1: "个人", //发票抬头个人
			invoice_name2: "", //发票抬头公司
			invoice_content: 1, //发票内容
			contentText: "明细",
		},
		status: {
			infoMore: false
		},
	},
    commonInvoice_1: {
        postData: {
            action: 1, //发票公司
            invoice_name1: "个人", //发票抬头个人
            invoice_name2: "", //发票抬头公司
            invoice_content: 1, //发票内容
            contentText: "明细",
        },
        status: {
            infoMore: false
        },
    },
    commonInvoice_2: {
        postData: {
            action: 2, //发票公司
            invoice_name1: "个人", //发票抬头个人
            invoice_name2: "", //发票抬头公司
            invoice_content: 1, //发票内容
            contentText: "明细",
        },
        status: {
            infoMore: false
        },
    },
	electronInvoice: {
		postData: {
			action: 1, //发票抬头
			invoice_name1: "个人", //发票抬头个人
			invoice_name2: "", //发票抬头公司
			invoice_content: 1, //发票内容
			contentText: "明细",
		},
		status: {
			infoMore: false
		},
	},
    electronInvoice_1: {
        postData: {
            action: 1, //发票抬头
            invoice_name1: "个人", //发票抬头个人
            invoice_name2: "", //发票抬头公司
            invoice_content: 1, //发票内容
            contentText: "明细",
        },
        status: {
            infoMore: false
        },
    },
    electronInvoice_2: {
        postData: {
            action: 2, //发票抬头
            invoice_name1: "个人", //发票抬头个人
            invoice_name2: "", //发票抬头公司
            invoice_content: 1, //发票内容
            contentText: "明细",
        },
        status: {
            infoMore: false
        },
    },
	taxInvoice: {
		postData: {
			action: 2, //发票公司
			invoice_content: 1, //发票内容
			contentText: "明细",
		},
	},
    taxInvoice_1: {
        postData: {
            action: 2, //发票公司
            invoice_content: 1, //发票内容
            contentText: "明细",
        },
    },
    taxInvoice_2: {
        postData: {
            action: 2, //发票公司
            invoice_content: 1, //发票内容
            contentText: "明细",
        },
    },
	//提示框
	prompt: {
		show: false,
		msg: ""
	},
};

function initialPage(state, result, invoice, action) {
	let imData = Immutable.fromJS(state);
	if (result.code !== 0) {
		imData = imData.set("prompt", {
			show: true,
			msg: result.msg
		});
		return imData.toJS();
	}

	imData = imData.set("load", false);
	imData = imData.set("update", false);

	let {data} = result;
	let newInvoiceSelData = imData.get("invoiceSelData").toJS().map((list, i) => {
		if (data.invoice.shop_invoice.invoice_type.indexOf(mapInvoiceType[list.type]) > -1) {
			list.able = true;
		} else {
			list.able = false;
		}
		return list;
	});
	imData = imData.set("invoiceSelData", newInvoiceSelData);
	imData = imData.set("invoiceContent", data.invoice.shop_invoice.invoice_content);

	let userForm = data.invoice.user_invoice;
	let userAddress = data.invoice.user_address
    if (userAddress && Object.keys(userAddress).length > 0) {
        imData = imData.setIn(["taxInvoice", "postData", "receiver_address"], userAddress.address);
        imData = imData.setIn(["taxInvoice", "postData", "receiver_name"], userAddress.name);
        imData = imData.setIn(["taxInvoice", "postData", "receiver_region"], userAddress.area ? JSON.stringify(userAddress.area):'');
        imData = imData.setIn(["taxInvoice", "postData", "receiver_tel"], userAddress.mobile);
    }
	if (userForm && userForm.length > 0) {
		// imData = imData.set("invoiceId", userForm[0].invoice_id);
        imData = imData.set("userForm", userForm);
        userForm.map((user) => {
            imData = imData.updateIn([`${mapTypeInvoice[user.type]}_${user.action}`, "postData"], (obj) => {
				if(obj && obj.toJS) {
            	return Object.assign(obj.toJS(), user);
				} else {
                    return Object.assign(obj, user);
				}
			});
		})
	}
	imData = imData.set("invoiceType", invoiceTypeMap[invoice]);
	imData = Immutable.fromJS(imData.toJS());
	imData = imData.setIn([invoiceTypeMap[invoice] + "Invoice", "postData", "action"], action);
	return imData.toJS()
}

function flatObject(old) {
	if (typeof old !== "object") {
		return old;
	}
	let n = {};
	let keys = Object.keys(old);
	keys.forEach((key, i) => {
		if (typeof old[key] === "object" && old[key] !== null) {
			Object.assign(n, flatObject(old[key]));
		} else {
			n[key] = old[key];
		}
	});
	return n;
}

function changeStatus(state, action) {
	if (state[action.invoiceType].status[action.key] === action.value) {
		return state;
	}
	let imState = Immutable.fromJS(state);
	imState = imState.setIn([action.invoiceType, "status", [action.key]], action.value);
	return imState.toJS();
}

function changeForm(state, action) {
	if (state[action.mode].postData[action.name] === action.value) {
		return state;
	}
	let imData = Immutable.fromJS(state);
	imData = imData.setIn([action.mode, "postData", action.name], action.value);

	return imData.toJS();
}


function modalSelect(state, action) {
	if (state[action.selectType].content === action.obj.id) {
		return state;
	}
	let imState = Immutable.fromJS(state);
	imState = imState.setIn([action.selectType, "content"], action.obj.id);
	imState = imState.setIn([action.selectType, "contentText"], action.obj.text);
	return imState.toJS();
}

function selectAddress(state, data) {
	let address = {};
	address.receiver_region = data.area_string;
	address.receiver_addr = data.addr;
	address.receiver_tel = data.mobile;
	address.receiver_name = data.name;
	let imData = Immutable.fromJS(state);
	imData = imData.updateIn(["taxInvoice", "postData"], (data) => {
		return Object.assign(data.toJS(), address);
	});
	return imData.toJS();
}

function invoiceSelect(state = initialState, action) {
	switch (action.type) {
		case 'resetState':
			return initialState;
		case 'updateState':
			return {...state, update: true};
		case 'initialPage':
			return initialPage(state, action.data, action.invoice, action.action);
		case 'setOrigin':
			return {...state, origin: action.origin};
		case "changeType":
			return {...state, invoiceType: action.invoiceType};
		case 'ctrlPrompt':
			return {...state, prompt: {...action.prompt}};
		case 'popupNote':
			return {...state, invoiceNote: action.status};
		case "changeStatus":
			return changeStatus(state, action);
		case 'modalCtrl':
			return {...state, showModal: action.status};
		case 'selectAddress':
			return selectAddress(state, action.data);
		case "modalSelect":
			return modalSelect(state, action);
		case "changeForm":
			return changeForm(state, action);
		default:
			return state;
	}
}
export default createReducers("invoiceSelect", invoiceSelect, initialState);