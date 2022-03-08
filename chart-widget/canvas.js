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
var inHomePage=false;
var home=document.getElementById('home');
var body=document.getElementsByTagName('body');
var navbar=document.getElementsByClassName('navbar')[0];
var transactMenu=document.getElementsByClassName('transactMenu')[0];
var stockheader=document.getElementsByClassName('stockheader')[0];
var stock=document.getElementsByClassName('stock');
var inMobile=false;
var startX,startY,drag=false;
function resize(){
	end=29;
	var fontsize;
	if(screen.width<500 || window.innerWidth<500){
		end=29;
		inMobile=true;
		fontsize=15;
	}
	else{
		end=59;
		fontsize=15;
	}
	y_axis.style.width=crt_contain.clientWidth/12;
	x_axis_full.style.height=crt_contain.clientHeight/20;

	chart_wrapper.style.width=can_con.clientWidth-5;
	chart_wrapper.style.height=can_con.clientHeight;
	chart.height=chart_wrapper.clientHeight;
	chart.width=chart_wrapper.clientWidth;
	layer1.height=chart_wrapper.clientHeight;
	layer1.width=chart_wrapper.clientWidth;
	if(inHomePage){
		layer2.height=chart_wrapper.clientHeight;
		layer2.width=chart_wrapper.clientWidth;
		layer3.height=chart_wrapper.clientHeight;
		layer3.width=chart_wrapper.clientWidth;
	}

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
	if(home.classList.length==2){
		inHomePage=true;
		in_homepage();
	}
	else{
		inHomePage=false;
	}
	setting_up(myChart);
	update_chart(end);
	y_drag(0,0);
});
var layer2;var timeline;
var layer3,timeline_highlight;
window.addEventListener('load',function(){
	resize();
	setting_up(myChart);
	if(home.classList.length==2){
		inHomePage=true;
		layer2 = document.getElementById('for_timeline');
		timeline= document.getElementById('for_timeline').getContext('2d');
		layer3 = document.getElementById('for_timeline_highlight');
		timeline_highlight= document.getElementById('for_timeline_highlight').getContext('2d');
		in_homepage();
	}
	else{
		inHomePage=false;
	}
});

var each_data=[]
var data_max=[];

chartit(curr_stock);
function setting_up(Chart){
	y_ctx.clearRect(0,0,price_axis.width,price_axis.height);
	
	const {ctx,chartArea,scales:{x,y}}=Chart;
	
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
	setting_up(myChart);
	return myChart;
}

async function fetchMaxData(historic){
	data_max=[];
	if(typeof historic=="string"){
		//console.log(historic);
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
		if(!inHomePage){
			end=myChart.data.datasets[0].data.length;
			var start=data_max.indexOf(each_data[0]);
			myChart.data.datasets[0].data=await fetchData(start,end=end+10);
			
			myChart.config.options.scales.y.max=each_data_max*1.05;
			myChart.config.options.scales.y.min=each_data_min*0.95;

			myChart.update('active');
			setting_up(myChart);
		}
}

async function update_chart(limit){
	myChart.data.datasets[0].data=await fetchData(0,end=limit);
	myChart.update('active');
	setting_up(myChart);
}

y_axis_layer.addEventListener('mousedown',function(event){
	if(!inHomePage){
		startY=event.layerY;
		drag=true;
	}
});

y_axis_layer.addEventListener('mouseup',function(event){
	if(!inHomePage){
		startY=event.layerY;
		drag=false;
	}
});
y_axis_layer.addEventListener('mousemove',function(event){
	if(!inHomePage){
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
	}
});
y_axis_layer.addEventListener('mouseleave',function(event){
	drag=false;
});

function y_drag(dx,dy){
	myChart.config.options.scales.y.max+=(dx*0.0015*myChart.config.options.scales.y.max);
	myChart.config.options.scales.y.min+=(dy*0.0015*myChart.config.options.scales.y.min);
	myChart.update('active');
	setting_up(myChart);
}

x_axis_layer.addEventListener('mousedown',function(event){
	if(!inHomePage){
		startX=event.layerX;
		drag=true;
	}
});

x_axis_layer.addEventListener('mouseup',function(event){
	if(!inHomePage){	
		startX=event.layerX;
		drag=false;
	}
});
x_axis_layer.addEventListener('mousemove',function(event){
	if(!inHomePage){	
		if(drag){
			diff=event.layerX-startX;
			x_drag(diff);
			startX=event.layerX;
		}
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
		setting_up(myChart);
	}
	else if(dx<0){
		if(each_data.length>2){
			for(let i=0;i<each_data.length*0.1;i++){
				myChart.data.datasets[0].data.pop();
			}
			myChart.update();
			setting_up(myChart);
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
	if(!inHomePage){	
		startY=event.layerY;
		drag=true;
	}
});

layer1.addEventListener('mouseup',function(event){
	if(!inHomePage){	
		startY=event.layerY;
		drag=false;
	}
});
var animID,anim=false;
;

layer1.addEventListener('mousemove',function(event){
	if(!inHomePage){	
		if(drag){
			var diffY=event.layerY-startY;
			var diffX=event.layerX-startX;
			chart_drag(diffY,diffX);	
			startY=event.layerY;
			startX=event.layerX;
		}
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
	if(inHomePage==true){
		x_label=timestamp[myChart.scales.x.getValueForPixel(cross.X)];
	}
	x_axis_highlight.fillText(x_label,cross.X,15);

	crosshair.beginPath();
	crosshair.moveTo(0.5,cross.Y+0.5);
	crosshair.lineTo(chartXY.width+0.5,cross.Y+0.5);
	crosshair.lineWidth=1;
	crosshair.strokeStyle="rgb(218, 220, 227)";
	crosshair.stroke();

	if(inHomePage){
		timeline_highlight.clearRect(0,0,layer1.clientWidth,layer1.clientHeight);
		const{ctx, chartArea,scales:{x,y}}=myChart;
		var chart_h=chartArea.height;
		var level=chart_h/20;
		var date=x.getValueForPixel(cross.X);
		var price=y.getPixelForValue(percentChange[x.getValueForPixel(cross.X)]);
		var ts=performanceData.timestamp;
		if(true){
			var flag_rl=100;
			var cpx=10;
			var inflag=0;
			var h=100;
			if(chartArea.width - cross.X < 105){
				flag_rl=-100;
				cpx=-10;
				inflag=-110;
			}
			if(price<100){
				price+=100;
			}

			timeline_highlight.shadowColor='black';
			timeline_highlight.shadowBlur=2;
			timeline_highlight.shadowOffsetX=2;
			timeline_highlight.shadowOffsetY=1;

			timeline_highlight.beginPath();
			timeline_highlight.setLineDash([]);
			timeline_highlight.strokeStyle="rgb(218, 220, 227)";
			timeline_highlight.moveTo(cross.X,price-100);
			timeline_highlight.lineTo(cross.X+flag_rl,price-100);
			timeline_highlight.quadraticCurveTo(cross.X+flag_rl+cpx,price-100,cross.X+flag_rl+cpx,price-100+10);
			timeline_highlight.lineTo(cross.X+flag_rl+cpx,price-100+h);
			timeline_highlight.quadraticCurveTo(cross.X+flag_rl+cpx,price-100+h+10,cross.X+flag_rl,price-100+h+10);
			timeline_highlight.lineTo(cross.X,price-100+h+10);

			timeline_highlight.fillStyle="rgba(228, 50, 220,0.5)";

			timeline_highlight.fill();

			timeline_highlight.stroke();
			var clr="rgba(50,250,100,1)"
			if(percentChange[x.getValueForPixel(cross.X)]<100){
				clr="rgba(200, 10, 1,1)";
			}

			timeline_highlight.shadowBlur=0;
			timeline_highlight.shadowOffsetX=0;
			timeline_highlight.shadowOffsetY=0;

			timeline_highlight.font = "12px'Bitter', serif";
			timeline_highlight.fillStyle = "black";
			timeline_highlight.fillText("Investment Made.",cross.X+10+inflag,price-100+20,90);

			timeline_highlight.font = "bold 15px'Bitter', serif";
			timeline_highlight.fillStyle = clr;
			timeline_highlight.fillText("₹ "+performanceData.investment_done[date].toFixed(2),cross.X+10+inflag,price-100+35,90);

			timeline_highlight.font = "12px'Bitter', serif";
			timeline_highlight.fillStyle = "black";
			timeline_highlight.fillText("Current Value.",cross.X+10+inflag,price-100+55,90);

			timeline_highlight.font = "bold 15px'Bitter', serif";
			timeline_highlight.fillStyle = clr;
			timeline_highlight.fillText("₹ "+performanceData.LTP[date].toFixed(2),cross.X+10+inflag,price-100+70,90);

			timeline_highlight.font = "12px'Bitter', serif";
			timeline_highlight.fillStyle = "black";
			timeline_highlight.fillText("Net Chg.",cross.X+10+inflag,price-100+90,90);
			

			timeline_highlight.font = "bold 15px'Bitter', serif";
			timeline_highlight.fillStyle = clr;
			timeline_highlight.fillText((((performanceData.LTP[date]/performanceData.investment_done[date])-1)*100).toFixed(2)+" %",cross.X+10+inflag,price-100+105,90);
		}
	}
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
	setting_up(myChart);
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
var sn;

function disp(obj,stock_name,stock_desc){
	if(inMobile){
		lt.style.display="none";	
	}
	else{
		body.style.gridTemplateColumns="repeat(15,1fr)";
		body.style.gridColumnGap="1%";
		lt.style.gridColumn="10/-1";
	}
	sn=stock_name;
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
	if(inMobile){
		lt.style.display="block";
	}
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
	console.log(data);
	
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

function getPortfolioPerformace_data(percentChange){
	var output=Object.create(percentChange);
	var initial=100;
	for(let i=0;i<output.length;i++){
		output[i]=output[i]*100;
	}
	
	return output;
}

var timestamp,performanceData;
var percentChange;
async function in_homepage(){
	body.style.gridTemplateColumns="repeat(15,1fr)";
	body.style.gridColumnGap="1%";
	crt_contain.style.display="grid";
	crt_contain.style.gridColumn="1/-1";
	crt_contain.style.display="grid";
	label.style.display="grid";	
	label.style.gridColumn="1/-1";
	resize();
	var response=await fetch("/home",{
		method:"POST",
	})
	.catch(err=>console.log(err));
	

	performanceData=await response.json();
	if(performanceData.daysTraded.length==0){
		crt_contain.innerHTML="<div class='temp' style='grid-row:10/11;grid-column:1/-1;text-align:center'>No trades made.</div>";
		return;
	}
	var firstdaytraded=performanceData.daysTraded[0];

	timestamp=Object.create(performanceData.timestamp);
	timestamp.forEach((Element,Index)=>{
		if(Element!=null){
			var date = new Date(Element);
			timestamp[Index]=date.getDate()+
			"/"+(date.getMonth()+1)+
			"/"+date.getFullYear();
		}
	});
	
	for(let i=0;i<performanceData.percentChange.length;i++){
		performanceData.percentChange[i]=performanceData.percentChange[i]/performanceData.percentChange[0];
	}
	percentChange=getPortfolioPerformace_data(performanceData.percentChange);

	const niftydata=await fetch("/nse_stocks/NIFTY50.json");
	const jsondata= await niftydata.json();
	var idx=jsondata.timestamp.indexOf(firstdaytraded);
	var val=jsondata.close[idx];
	var nifty=[];
	for(let i=idx;i>=0;i--){
		nifty.push(jsondata.close[i]/val)
	}
	nifty=getPortfolioPerformace_data(nifty);
	console.log(jsondata);

	var options = {
		onResize: resize(),
		responsive: true,
		maintainAspectRatio: false,
		animation:false,
		/*onHover:function crosshair(e){
			console.log(e.x,chart.width);
			//console.log(new Date(myChart.scales.x.getValueForPixel(e.x)).toLocaleDateString());
		},*/
		scales: {
			y: {
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
					callback: function(val, index,vals) {
						if(index%10==0){
							return timestamp[index];
						}
					},
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

	var data={
		label: timestamp,
		datasets: [{
			type: 'line',
			data: percentChange,
			fill: true,
			fillColor: "green",
			borderWidth:2,
			fillColor: 'rgba(180,100,100,0.2)',
			borderColor: 'rgb(75, 192, 192)',
			pointRadius: 0,
			tension: 0.5
		},
		{
			type: 'line',
			data: nifty,
			fill: true,
			fillColor: "green",
			borderWidth:2,
			fillColor: 'rgba(180,100,100,0.2)',
			borderColor: 'rgb(125,250,100)',
			pointRadius: 0,
			tension: 0.5
		}
	]
	};

	if(myChart==null){
		myChart = new Chart(chart, {
			data: data,
			options: options
		});
	}
	else{
		myChart.destroy();
		myChart = new Chart(chart, {
			data: data,
			options: options
		});
	}
	resize();
	setting_up(myChart);
	
	const{ctx, chartArea,scales:{x,y}}=myChart;

	for(let i=0;i<performanceData.daysTraded.length;i++){
		var date = new Date(performanceData.daysTraded[i]);
		date=date.getDate()+
		"/"+(date.getMonth()+1)+
		"/"+date.getFullYear();
		
		var index_x=timestamp.indexOf(date);
		var index_y=percentChange[index_x];
		var pixelx=x.getPixelForValue(index_x);
		var pixely=y.getPixelForValue(index_y);
		
		timeline.beginPath();
		timeline.setLineDash([]);
		timeline.moveTo(pixelx,0);
		timeline.lineTo(pixelx,pixely);
		if(pixelx==0){
			timeline.lineWidth=2.5
		}
		else{
			timeline.lineWidth=1.5;
		}
		timeline.strokeStyle="rgb(75, 192, 192)";
		timeline.stroke();

		timeline.beginPath();
		timeline.setLineDash([5,2]);
		timeline.moveTo(pixelx,pixely);
		timeline.lineTo(pixelx,chartXY.height);
		timeline.lineWidth=1.5;
		timeline.strokeStyle="rgb(75, 250, 177)";
		timeline.stroke();		
	}
}

var modalbox=document.getElementsByClassName('TransactModalBox')[0];
var BuySell;
function display_modalbox(obj,bs){
	modalbox.style.display='block';
	var footer=modalbox.getElementsByClassName('footer')[0];
	var submit=footer.getElementsByClassName('submit')[0];
	var header=modalbox.getElementsByClassName('header')[0];
	header.innerHTML=sn;
	BuySell=bs;
	if(bs==1){
		submit.innerHTML="Buy";
	}
	else{
		submit.innerHTML="Sell";
	}
}
function cancel(){
	modalbox.style.display='none';
}

async function transact(obj){
	var stockname=obj.parentNode.parentNode[0].value;
	var date=obj.parentNode.parentNode[3].value;
	var quantity=obj.parentNode.parentNode[1].value;
	var price=obj.parentNode.parentNode[2].value;
	var output=obj.parentNode.parentNode.parentNode.parentNode;
	console.log(price);
	output=output.getElementsByClassName('Transact_output')[0];
	if(stockname==''||date==''||quantity==''||price==''||!parseInt(quantity)>0||!parseInt(price)>0){
		displayoutput(output,"block","Not a valid input.", "rgba(50, 89, 121, 0.918)")
		return;
	}

	var data={buysell:BuySell,stockname:stockname,date:date,quantity:quantity,price:price};
	
	var response= await fetch('./portfolio', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
  		},
  		body: JSON.stringify(data),
	});
	const stat=await response.json();
	if(stat.status_code==0){
		displayoutput(output,"block",stat.status_code+": "+stat.status,"rgba(85, 172, 82, 0.705)")
		setTimeout('location.href="/portfolio"', 2000);
	}
	else{
		displayoutput(output,"block",stat.status_code+": "+stat.status,"rgba(197, 70, 87, 0.847)")
		setTimeout(function(){
			output.style.visibility="hidden";
			output.style.display='none';
		}, 5000);
	}
}

function displayoutput(output,option,msg, colour){
	output.style.display=option;
	output.style.visibility="visible";
	output.innerHTML=msg;
	output.style.backgroundColor=colour;
}


function autocomplete(inp, arr) {
	/*the autocomplete function takes two arguments,
	the text field element and an array of possible autocompleted values:*/
	var currentFocus;
	/*execute a function when someone writes in the text field:*/
	inp.addEventListener("input", function(e) {
		var a, b, i, val = this.value;
		/*close any already open lists of autocompleted values*/
		closeAllLists();
		if (!val) { return false;}
		currentFocus = -1;
		/*create a DIV element that will contain the items (values):*/
		a = document.createElement("DIV");
		a.setAttribute("id", this.id + "autocomplete-list");
		a.setAttribute("class", "autocomplete-items");
		/*append the DIV element as a child of the autocomplete container:*/
		this.parentNode.appendChild(a);
		/*for each item in the array...*/
		for (i = 0; i < arr.length; i++) {
		  /*check if the item starts with the same letters as the text field value:*/
		  if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
			/*create a DIV element for each matching element:*/
			b = document.createElement("DIV");
			/*make the matching letters bold:*/
			b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
			b.innerHTML += arr[i].substr(val.length);
			/*insert a input field that will hold the current array item's value:*/
			b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
			/*execute a function when someone clicks on the item value (DIV element):*/
				b.addEventListener("click", function(e) {
				/*insert the value for the autocomplete text field:*/
				inp.value = this.getElementsByTagName("input")[0].value;
				/*close the list of autocompleted values,
				(or any other open lists of autocompleted values:*/
				closeAllLists();
			});
			a.appendChild(b);
		  }
		}
	});
	/*execute a function presses a key on the keyboard:*/
	inp.addEventListener("keydown", function(e) {
		var x = document.getElementById(this.id + "autocomplete-list");
		if (x) x = x.getElementsByTagName("div");
		if (e.keyCode == 40) {
		  /*If the arrow DOWN key is pressed,
		  increase the currentFocus variable:*/
		  currentFocus++;
		  /*and and make the current item more visible:*/
		  addActive(x);
		} else if (e.keyCode == 38) { //up
		  /*If the arrow UP key is pressed,
		  decrease the currentFocus variable:*/
		  currentFocus--;
		  /*and and make the current item more visible:*/
		  addActive(x);
		} else if (e.keyCode == 13) {
		  /*If the ENTER key is pressed, prevent the form from being submitted,*/
		  e.preventDefault();
		  if (currentFocus > -1) {
			/*and simulate a click on the "active" item:*/
			if (x) x[currentFocus].click();
		  }
		}
	});
	function addActive(x) {
	  /*a function to classify an item as "active":*/
	  if (!x) return false;
	  /*start by removing the "active" class on all items:*/
	  removeActive(x);
	  if (currentFocus >= x.length) currentFocus = 0;
	  if (currentFocus < 0) currentFocus = (x.length - 1);
	  /*add class "autocomplete-active":*/
	  x[currentFocus].classList.add("autocomplete-active");
	}
	function removeActive(x) {
	  /*a function to remove the "active" class from all autocomplete items:*/
	  for (var i = 0; i < x.length; i++) {
		x[i].classList.remove("autocomplete-active");
	  }
	}
	function closeAllLists(elmnt) {
	  /*close all autocomplete lists in the document,
	  except the one passed as an argument:*/
	  var x = document.getElementsByClassName("autocomplete-items");
	  for (var i = 0; i < x.length; i++) {
		if (elmnt != x[i] && elmnt != inp) {
		x[i].parentNode.removeChild(x[i]);
	  }
	}
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
	  closeAllLists(e.target);
  });
}
async function initialautocomplete(){

	var stocklist=await (await fetch("/nse_stocks/stock_meta.json")).json();
	
	autocomplete(document.getElementById("myInput"),Object.keys(stocklist) );
}
