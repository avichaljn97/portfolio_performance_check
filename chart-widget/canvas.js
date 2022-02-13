var chartXY= document.getElementById('main_chart');
var layer1= document.getElementById('for_crossHair');
var chart= document.getElementById('main_chart').getContext('2d');
var crosshair= document.getElementById('for_crossHair').getContext('2d');
var price_axis = document.getElementById('price_bar_canvas');
var y_axis = document.getElementById('y_axis');
var x_axis_full = document.getElementById('x_axis');
var y_axis_layer=document.getElementById('price_bar_highlighted_canvas');
var x_axis = document.getElementById('time_bar_canvas');
var time_axis = document.getElementById('time_axis_id');
var x_axis_layer = document.getElementById('time_bar_highlighted_canvas');
var y_bar = document.getElementById('price_bar_id');
var x_bar = document.getElementById('time_bar_id');
var can_con = document.getElementById('can_con');
var stock_chartnprice = document.getElementById('stock_chartnprice');
var chart_wrapper = document.getElementById('chart_wrapper');
var crt_contain = document.getElementById('crt_contain');
var stk_crt = document.getElementById('stk_crt');
var y_ctx=price_axis.getContext('2d');
var x_ctx=x_axis.getContext('2d');
var dbar=document.getElementById('d_bar');
var nil=document.getElementById('nil');
var myChart;
var curr_stock;
var end;


var startX,startY,drag=false;
function resize(){
	end=29;
	var fontsize;
	if(screen.width<500 || window.innerWidth<500){
		end=29;
		crt_contain.style.gridRow="5/-1";
		crt_contain.style.gridColumn="1/-1";

		fontsize=25;
	}
	else{
		end=59;
		fontsize=15;
	}
	y_axis.style.width=crt_contain.clientWidth/12;
	x_axis_full.style.height=crt_contain.clientHeight/20;

	chart_wrapper.style.width=can_con.clientWidth;
	chart_wrapper.style.height=can_con.clientHeight;
	chart.height=chart_wrapper.clientHeight;
	chart.width=chart_wrapper.clientWidth;
	layer1.height=chart_wrapper.clientHeight;
	layer1.width=chart_wrapper.clientWidth;

	price_axis.width= y_bar.clientWidth;
	price_axis.height= y_bar.clientHeight;
	y_axis_layer.width= y_bar.clientWidth;
	y_axis_layer.height= y_bar.clientHeight;

	x_axis.width= x_axis_full.clientWidth;
	x_axis.height= x_axis_full.clientHeight;
	x_axis_layer.width= x_axis_full.clientWidth;
	x_axis_layer.height= x_axis_full.clientHeight;

	y_ctx.font = fontsize+"px 'Bitter', serif";
	y_ctx.fillStyle = "rgb(229, 222, 245)";

	x_ctx.font = fontsize+"px 'Bitter', serif";
	x_ctx.fillStyle = "rgb(229, 222, 245)";
}
window.addEventListener('resize',function(){
	resize();
	setting_up();
	update_chart(end);
	y_drag(0,0);
});

window.addEventListener('load',function(){
	resize();
	setting_up();
});

var each_data=[]
var data_max=[];

chartit(curr_stock);
function setting_up(){
	y_ctx.clearRect(0,0,price_axis.width,price_axis.height);
	
	const {ctx,chartArea,scales:{x,y}}=myChart;
	for(var i=1;i<y.ticks.length-1;i++){
		const each=y.ticks[i];
		
		y_ctx.fillText(each.value,4,y.getPixelForTick(i)+2);
	}
	x_ctx.clearRect(0,0,x_axis.width,x_axis.height);
	
	var tick=x.ticks;
	//var area_occupy=chart.width/tick.length;
	for(var i=0;i<tick.length;i=i+1){
		const each=tick[i];
		
		var temp_x=x.getPixelForTick(i);
		var dat=new Date(each.value).toLocaleDateString();
		x_ctx.fillText(each.label,temp_x,15);
	}
}

async function chartit(stock){
	await fetchMaxData(stock);
	await fetchData(0,end);
	
	var data ={
		datasets:[{
			data:each_data,
		}]
	};

	var options = {
		onResize: resize(),
		responsive: true,
		maintainAspectRatio: false,
		animation:true,
		/*onHover:function crosshair(e){
			console.log(e.x,chart.width);
			//console.log(new Date(myChart.scales.x.getValueForPixel(e.x)).toLocaleDateString());
		},*/
		scales: {
			y: {
				grace: 10,
				grid:{
					color: 'rgba( 113, 95, 117, 0.5)',
					lineWidth:0.5,
					drawBorder:false,
					display: true,
				},
				ticks: {
					display: false,
					align: 'center',
					callback: function(val, index) {
						  return val;
					  },
					},					
				position: 'right',
			},
			x:{
				display:false,
				grid:{
					display: true,
					color: 'rgba( 113, 95, 117, 0.5)',
					lineWidth:0.5,
					drawBorder:false,
					display: true,
				},
				ticks: {
					display:true,
				},
			}
		},
		plugins:{
			tooltip:{
				enabled:false,
			},
			legend:{
				display:false,
			},
		},
	};

	if(myChart==null){
		myChart = new Chart(chart, {
			type: 'candlestick',
			options: options,
			data: data,
		});
	}
	else{
		myChart.destroy();
		myChart = new Chart(chart, {
			type: 'candlestick',
			options: options,
			data: data,});
	}
	if(myChart.config.options.scales.y.max==null){
		myChart.config.options.scales.y.max=myChart.scales.y.max;
		myChart.config.options.scales.y.min=myChart.scales.y.min;
	}
	resize();
	setting_up();
	return myChart;
}

async function fetchMaxData(historic){
	data_max=[];
	if(typeof historic=="string"){
		const data=await fetch(historic);
		const jsondata= await data.json();
		for(i=0;i<jsondata.timestamp.length;i++){
			data_max.push({
				x:jsondata.timestamp[i],
				o:jsondata.open[i],
				h:jsondata.high[i],
				l:jsondata.low[i],
				c:jsondata.close[i]
			});
		}
	}
	return data_max;
}


var each_data_max,each_data_min;

async function fetchData(start,end){
	
	each_data=[],each_data_max=0,each_data_min=2**64;
	each_data=data_max.slice(start,end);
	for(let i=0;i<each_data.length;i++){
		let each=each_data[i];
		each_data_max=Math.max(each_data_max,each.o,each.h,each.l,each.c);
		each_data_min=Math.min(each_data_min,each.o,each.h,each.l,each.c);
	}
	return each_data;
}

async function increment(){
		end=myChart.data.datasets[0].data.length;
		var start=data_max.indexOf(each_data[0]);
		myChart.data.datasets[0].data=await fetchData(start,end=end+10);
		
		myChart.config.options.scales.y.max=each_data_max*1.05;
		myChart.config.options.scales.y.min=each_data_min*0.95;

		myChart.update('active');
		setting_up();
}

async function update_chart(limit){
	myChart.data.datasets[0].data=await fetchData(0,end=limit);
	myChart.update('active');
	setting_up();
}

y_axis_layer.addEventListener('mousedown',function(event){
	startY=event.layerY;
	drag=true;
});

y_axis_layer.addEventListener('mouseup',function(event){
	startY=event.layerY;
	drag=false;
});
y_axis_layer.addEventListener('mousemove',function(event){
	if(drag){
		diff=event.layerY-startY;
		if(diff>1){
			y_drag(diff,-diff);
		}
		else if(diff<-1){
			y_drag(diff,-diff)
		}
		startY=event.layerY;
	}
});
y_axis_layer.addEventListener('mouseleave',function(event){
	drag=false;
});

function y_drag(dx,dy){
	myChart.config.options.scales.y.max+=(dx*0.0015*myChart.config.options.scales.y.max);
	myChart.config.options.scales.y.min+=(dy*0.0015*myChart.config.options.scales.y.min);
	myChart.update('active');
	setting_up();
}

x_axis_layer.addEventListener('mousedown',function(event){
	startX=event.layerX;
	drag=true;
});

x_axis_layer.addEventListener('mouseup',function(event){
	startX=event.layerX;
	drag=false;
});
x_axis_layer.addEventListener('mousemove',function(event){
	if(drag){
		diff=event.layerX-startX;
		x_drag(diff);
		startX=event.layerX;
	}
});
x_axis_layer.addEventListener('mouseleave',function(event){
	drag=false;
});

async function x_drag(dx){
	var last=each_data[myChart.data.datasets[0].data.length-1]
	var limit=data_max.indexOf(last);
	var start=data_max.indexOf(myChart.data.datasets[0].data[0]);
	//console.log(limit-start,each_data.length,limit,start,dx);
	if(dx>0){
		let each=data_max[limit+1];
		each_data_max=Math.max(each_data_max,each.o,each.h,each.l,each.c);
		each_data_min=Math.min(each_data_min,each.o,each.h,each.l,each.c);
		myChart.config.options.scales.y.max=each_data_max*1.05;
		myChart.config.options.scales.y.min=each_data_min*0.95;
		myChart.data.datasets[0].data.push(data_max[limit+1]);
		myChart.update();
		setting_up();
	}
	else if(dx<0){
		if(each_data.length>2){
			for(let i=0;i<each_data.length*0.1;i++){
				myChart.data.datasets[0].data.pop();
			}
			myChart.update();
			setting_up();
		}
	}
}

async function viewALL(){
	await update_chart(data_max.length);
}

var cross={
	X:null,
	Y:null,
}

layer1.addEventListener('mousedown',function(event){
	startY=event.layerY;
	drag=true;
});

layer1.addEventListener('mouseup',function(event){
	startY=event.layerY;
	drag=false;
});
var animID,anim=false;
;

layer1.addEventListener('mousemove',function(event){
	if(drag){
		var diffY=event.layerY-startY;
		var diffX=event.layerX-startX;
		chart_drag(diffY,diffX);	
		startY=event.layerY;
		startX=event.layerX;
	}
});

layer1.addEventListener('mousemove',function(event){
	if(anim){
		//console.log(new Date(myChart.scales.x.getValueForPixel(cross.X)).toLocaleDateString(),myChart.scales.y.getValueForPixel(cross.Y));
		cross.X=event.layerX;
		cross.Y=event.layerY;
		drawCross();
	}
});

function drawCross(){
	var y_axis_highlight=y_axis_layer.getContext('2d');
	var x_axis_highlight=x_axis_layer.getContext('2d');

	crosshair.clearRect(0,0,layer1.clientWidth,layer1.clientHeight);
	y_axis_highlight.clearRect(0,0,y_axis_layer.clientWidth,y_axis_layer.clientHeight);
	x_axis_highlight.clearRect(0,0,x_axis_layer.clientWidth,x_axis_layer.clientHeight);

	crosshair.beginPath();
	crosshair.moveTo(cross.X+0.5,0.5);
	crosshair.lineTo(cross.X+0.5,chartXY.height+0.5);
	crosshair.lineWidth=1;
	crosshair.strokeStyle="rgb(218, 220, 227)";
	crosshair.stroke();

	
	y_axis_highlight.beginPath();
	y_axis_highlight.fillStyle = "rgba(218, 220, 227,1)";
	y_axis_highlight.moveTo(0,cross.Y+1);
	y_axis_highlight.lineTo(5,cross.Y-11);
	y_axis_highlight.lineTo(y_axis_layer.clientWidth,cross.Y-11);
	y_axis_highlight.lineTo(y_axis_layer.clientWidth,cross.Y-11+10+11);
	y_axis_highlight.lineTo(5,cross.Y-11+10+11);
	y_axis_highlight.lineTo(0,cross.Y+1);	
	y_axis_highlight.fill();

	y_axis_highlight.beginPath();
	y_axis_highlight.font = "bold 11px 'Bitter', serif";
	y_axis_highlight.fillStyle = "rgba(229, 22, 245, 0.9)";
	var y_label=myChart.scales.y.getValueForPixel(cross.Y).toFixed(2);
	y_axis_highlight.fillText(y_label,5,cross.Y+2);

	x_axis_highlight.beginPath();
	x_axis_highlight.fillStyle = "rgba(218, 220, 227,1)";
	x_axis_highlight.moveTo(cross.X-5,0);
	x_axis_highlight.lineTo(cross.X-5,x_axis_layer.clientHeight);
	x_axis_highlight.lineTo(cross.X-5+72,x_axis_layer.clientHeight);
	x_axis_highlight.lineTo(cross.X-5+72,0);
	x_axis_highlight.lineTo(cross.X-5,0);
	x_axis_highlight.fill();

	x_axis_highlight.font = "bold 12px'Bitter', serif";
	x_axis_highlight.fillStyle = "rgb(229, 22, 245)";
	var x_label=new Date(myChart.scales.x.getValueForPixel(cross.X)).toLocaleDateString();
	x_axis_highlight.fillText(x_label,cross.X,15);

	crosshair.beginPath();
	crosshair.moveTo(0.5,cross.Y+0.5);
	crosshair.lineTo(chartXY.width+0.5,cross.Y+0.5);
	crosshair.lineWidth=1;
	crosshair.strokeStyle="rgb(218, 220, 227)";
	crosshair.stroke();

	animID=requestAnimationFrame(drawCross);
}

layer1.addEventListener('mouseenter',function(){
	anim=true;
});

layer1.addEventListener('mouseleave',function(event){
	drag=false;
	anim=false;
	
	cancelAnimationFrame(animID);
	crosshair.clearRect(0,0,layer1.clientWidth,layer1.clientHeight);
});

function chart_drag(diffY,diffX){
	var last=each_data[myChart.data.datasets[0].data.length-1]
	var limit=data_max.indexOf(last);
	var start=data_max.indexOf(myChart.data.datasets[0].data[0]);
	if(start>-1 && limit<data_max.length-1){
		if(diffX>8){
			myChart.data.datasets[0].data.shift();
			myChart.data.datasets[0].data.push(data_max[limit=limit+1]);
			each_data=myChart.data.datasets[0].data;
		}
		if(diffX<-8 && start>0){
			myChart.data.datasets[0].data.pop();
			start=data_max.indexOf(myChart.data.datasets[0].data[0]);
			myChart.data.datasets[0].data.unshift(data_max[start=start-1]);
		}
	}
	myChart.config.options.scales.y.max+=(diffY*0.0015*myChart.config.options.scales.y.max);
	myChart.config.options.scales.y.min+=(diffY*0.0015*myChart.config.options.scales.y.min);
	myChart.update('active');
	setting_up();
}
var eachstock=document.getElementsByClassName('each_stock');
var label=document.getElementsByClassName('labelAndDetail')[0];
var body=document.getElementsByTagName('body')[0];
var lt=document.getElementsByClassName('lateruse')[0];

var col1=document.getElementsByClassName('stock_name');
var col2=document.getElementsByClassName('stock_quantity');
var col3=document.getElementsByClassName('avg_price');
var col4=document.getElementsByClassName('LTP');
var col5=document.getElementsByClassName('profitloss');
var col6=document.getElementsByClassName('change');
var col7=document.getElementsByClassName('dayChange');

function disp(obj,stock_name,stock_desc){

	var stockdesc=document.getElementsByClassName("stockdesc")[0];

	body.style.gridTemplateColumns="repeat(15,1fr)";
	body.style.gridColumnGap="1%";
	lt.style.gridColumn="10/-1";

	crt_contain.style.display="grid";
	label.style.display="grid";	

	stockdesc.innerHTML=stock_name;
	for(let i=0;i<lt.children.length;i++){
		lt.children[i].classList.remove('selected');
		if(obj==lt.children[i]){
			lt.children[i].classList.add('selected');
		}
	}
	for(let i=0;i<col1.length;i++){
		col1[i].style.gridColumn="1/5";
		col2[i].style.display="none";
		col3[i].style.display="none";
		col6[i].style.display="none";
	}
	lt.style.fontSize="14px";
}

function display_moredetail(obj){
	obj.getElementsByClassName('moredetail')[0].style.display='block';
	obj.getElementsByClassName('dispchart')[0].style.display='block';
}
function hide_moredetail(obj){
	obj.getElementsByClassName('moredetail')[0].style.display='none';
	obj.getElementsByClassName('dispchart')[0].style.display='none';
}

function revert(){
	crt_contain.style.display="none";
	label.style.display="none";
	body.style.gridTemplateColumns="repeat(1,1fr)";
	body.style.gridColumnGap="0%";
	lt.style.gridColumn="1/-1";
	
	for(let i=0;i<col1.length;i++){
		col1[i].style.gridColumn="1/3";
		col2[i].style.display="grid";
		col3[i].style.display="block";
		col6[i].style.display="block";
	}

	lt.style.fontSize="16px";

	for(let i=0;i<lt.children.length;i++){
		lt.children[i].classList.remove('selected');
	}
}
var stocks=document.getElementsByClassName("stock");
async function moreDetail(obj,stock){
	var data=await fetch("/portfolio/"+stock,{
		method:"POST",
	}).then(response => response.json())
	
	var row=obj.parentNode.parentNode.parentNode;
	var stock=row.getElementsByClassName('each_stock')[0];
	var info=row.getElementsByClassName('info')[0];
	var count=0;

	for(let i=0;i<stocks.length;i++){
		var each=stocks[i].getElementsByClassName('info')[0];
		if(info!=each){
			each.style.height="0px";
			each.style.display="none";
		}
	}

	for(each in data){
		count=count+data[each].holdings.length;
	}

	if(info.clientHeight==0){
		info.style.height=stock.clientHeight*0.90*(count+1);
		info.style.display="grid";
		info.style.gridTemplateRows="repeat("+(count+2)+",1fr)";
		info.style.gridTemplateColumns="repeat(1,1fr)";
		info.innerHTML="";

		var div = document.createElement('div');
    	div.className = 'eachDetailHeader';
		
		date=document.createElement('div');
		date.className='eachDetail_date';
		date.innerHTML="Date";
		share=document.createElement('div');
		share.className='eachDetail_share';
		share.innerHTML="Shares";
		price=document.createElement('div');
		price.className='eachDetail_price';
		price.innerHTML="Price";
		amt=document.createElement('div');
		amt.className='eachDetail_amt';
		amt.innerHTML="Amt Invested";
		div.appendChild(date);
		div.appendChild(price);
		div.appendChild(share);
		div.appendChild(amt);
		info.appendChild(div);
		
		var invested=0;
		for(each in data){
			for(let i=0;i<data[each].holdings.length;i++){

				var div = document.createElement('div');
    			div.className = 'eachDetail';
				
				
				date=document.createElement('div');
				date.className='eachDetail_date';
				var tempDate = new Date(+each);
				date.innerHTML=tempDate.getDate()+
				", "+(tempDate.toLocaleString('en-us', { month: 'short' }))+
				" "+tempDate.getFullYear();
				share=document.createElement('div');
				share.className='eachDetail_share';
				share.innerHTML=data[each].holdings[i].shares;
				price=document.createElement('div');
				price.className='eachDetail_price';
				price.innerHTML=data[each].holdings[i].price;
				amt=document.createElement('div');
				amt.className='eachDetail_amt';
				amt.innerHTML=data[each].holdings[i].price*data[each].holdings[i].shares;
				invested+=data[each].holdings[i].price*data[each].holdings[i].shares;

				div.appendChild(date);
				div.appendChild(price);
				div.appendChild(share);
				div.appendChild(amt);
				info.appendChild(div);
			}
		}

		var div = document.createElement('div');
    	div.className = 'sumTotal';
		total=document.createElement('div');
		total.className='total';
		total.innerHTML="Total Investment";
		totalamt=document.createElement('div');
		totalamt.className='eachDetail_amt';
		totalamt.innerHTML=invested;
		div.appendChild(total);
		div.appendChild(totalamt);
		info.appendChild(div);
	}
	else{
		info.style.height="0px";
		info.style.display="none";
	}
}
