//动态创建js加载
export function loadScript(url,callback,userId){
	let w = document.getElementsByClassName("collect-name")[0]; //
	if(w!=undefined){ //有collect资源
		if (w.readyState){ //IE
			w.onreadystatechange = function(){
				if (w.readyState == "loaded" || script.readyState == "complete"){
					w.onreadystatechange = null;
					callback(userId);
				}
			};
		} else { //Others
			w.onload = function(){
				callback(userId);
			};
		}

	}else{ //没有collect资源
		let script = document.createElement ("script");
		script.type = "text/javascript";
		script.className = "collect-name";
		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
		if (script.readyState){ //IE
			script.onreadystatechange = function(){
				if (script.readyState == "loaded" || script.readyState == "complete"){
					script.onreadystatechange = null;
					callback(userId);
				}
			};
		} else { //Others
			script.onload = function(){
				callback(userId);
			};
		}
	}
}

//存储userId
export function sdkUse(UserId) {
	sdk.storeUserId(UserId)
}