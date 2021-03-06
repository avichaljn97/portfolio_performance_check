const express= require('express')
const session= require('express-session')
const bcrypt = require("bcryptjs")
const path=require('path')

const fs=require('fs')
const { response } = require('express')
const res = require('express/lib/response')
const { performance } = require('perf_hooks')

const app=express()
const port=3000
app.use(express.json());
app.use("/chart-widget", express.static('./chart-widget/'));
app.use("/my_stocks", express.static('./my_stocks/'));
app.set("view engine","hbs");
app.use("/nse_stocks", express.static('./nse_stocks/'));
app.use("/css",express.static('./css/'));
app.use(express.urlencoded({extended:false}));
app.use(session({
    secret:'$u9rc0d=',
    saveUninitialized: false,
    resave: false
}));

var users;

function createUserID(){
    users=JSON.parse(fs.readFileSync("users.json"));
    var userid=String.fromCharCode(65+Math.floor((Math.random())*25),65+Math.floor((Math.random())*25),
    65+Math.floor((Math.random())*25));
    userid=userid+Math.floor((Math.random())*999);
    if(users.hasOwnProperty(userid)){
        createUserID();
    }
    else{
        return userid;
    }
}

const isAuth = (request,response,next)=>{
    if(request.session.isAuth){
        request.session.path="./userdb/"+request.session.key+"/";
        next();
    }
    else{
        response.redirect('/');
    }
};

creatingNSEjson();
function creatingNSEjson(){
    console.log("Creating JSON of Stocks Historic Data")
    var files=fs.readdirSync("./nse_stocks");
    for(each in files){
        var X=[],O=[],H=[],L=[],C=[];
        var csv=files[each];
        if(csv.split('.')[1]=='json')continue;
        var csv_dir="./nse_stocks/"+csv;
        var rd=fs.readFileSync(csv_dir).toString().split('\n').slice(1).reverse();
        for(let i=0;i<rd.length;i++){
            if(rd[i]=='')continue;
            rd[i]=rd[i].split(',');
            if(rd[i][1]=='null'){
                continue;
            }
            X.push(Date.parse(rd[i][0]));
            O.push(Number(parseFloat(rd[i][1]).toFixed(2)));
            H.push(Number(parseFloat(rd[i][2]).toFixed(2)));
            L.push(Number(parseFloat(rd[i][3]).toFixed(2)));
            C.push(Number(parseFloat(rd[i][4]).toFixed(2)));
        }
        var data={
            timestamp:X,
            open:O,
            high:H,
            low:L,
            close:C
        };
        fs.writeFileSync('./nse_stocks/'+files[each].split('.')[0]+'.json',JSON.stringify(data,null,2));
    }
}

function check_stock_already_exists(arr,stock){
    for(each in arr){
        if(arr[each].stock_name==stock)return each;
    }
    return -1;
}


function creatingPortfolioReturnJSON(path){
    var holding=JSON.parse(fs.readFileSync(path+"holding.json"));
    var portfolioPerformance={daysTraded:[],timestamp:[],LTP:[],investment_done:[],percentChange:[]};
    if(JSON.stringify(holding) == '{}'){
        fs.writeFileSync(path+'portfolioPerformance.json',JSON.stringify(portfolioPerformance,null,2));
        return;
    }
    var daysTraded=holding.daysTraded;
    var buff={};

    portfolioPerformance.daysTraded=daysTraded;
    //creating for the first bought stock and date
    var first=holding[daysTraded[0]].buy[0];
    buff[first.stock_name]={shares:first.shares,price:first.price};
    var stockhist=JSON.parse(fs.readFileSync("./nse_stocks/"+first.stock_name+".json"));
    for(each_detail in stockhist){
        stockhist[each_detail].reverse();
    }
    var idx=stockhist.timestamp.indexOf(daysTraded[0]);
    for(let i=idx;i<stockhist.timestamp.length;i++){
        portfolioPerformance.timestamp.push(stockhist.timestamp[i]);
        portfolioPerformance.LTP.push(stockhist.close[i]*first.shares);
        portfolioPerformance.investment_done.push(first.price*first.shares);
    }
    console.log("initial",buff);
    //eval
    for(each in daysTraded){
        //BOUGHT ON daysTraded[each]
        for(stock_idx in holding[daysTraded[each]].buy){
            if(each+stock_idx == 0){continue;}
            var each_stock=holding[daysTraded[each]].buy[stock_idx];
            if(!buff[each_stock.stock_name]){
                buff[each_stock.stock_name]={shares:each_stock.shares,price:each_stock.price}
            }
            else{
                console.log(buff[each_stock.stock_name].shares*buff[each_stock.stock_name].price
                    + each_stock.shares*each_stock.price)/(buff[each_stock.stock_name].shares + each_stock.shares);
                var temp=(buff[each_stock.stock_name].shares*buff[each_stock.stock_name].price
                + each_stock.shares*each_stock.price)/(buff[each_stock.stock_name].shares + each_stock.shares);
                
                buff[each_stock.stock_name].price=temp;
                buff[each_stock.stock_name].shares+=each_stock.shares;
            }

            var stockhist=JSON.parse(fs.readFileSync("./nse_stocks/"+each_stock.stock_name+".json"));
            for(each_detail in stockhist){
                stockhist[each_detail].reverse();
            }
            var idx=stockhist.timestamp.indexOf(daysTraded[each]);
            console.log(daysTraded[each],idx-stockhist.timestamp.length);
            var ts_idx=portfolioPerformance.timestamp.indexOf(daysTraded[each]);
            for(let i=idx;i<stockhist.timestamp.length;i++){
                portfolioPerformance.LTP[ts_idx]+=stockhist.close[i]*each_stock.shares;
                portfolioPerformance.investment_done[ts_idx]+=each_stock.price*each_stock.shares;
                ts_idx++;
            }
        }

        //SOLD ON daysTraded[each]
        for(stock_idx in holding[daysTraded[each]].sell){
            var each_stock=holding[daysTraded[each]].sell[stock_idx];
            for(each_sold in each_stock.holdings){
                buff[each_stock.stock_name].shares-=each_stock.holdings[each_sold].shares
            }

            var stockhist=JSON.parse(fs.readFileSync("./nse_stocks/"+each_stock.stock_name+".json"));
            for(each_detail in stockhist){
                stockhist[each_detail].reverse();
            }
            var idx=stockhist.timestamp.indexOf(daysTraded[each]);
            var ts_idx=portfolioPerformance.timestamp.indexOf(daysTraded[each]);
            for(let i=idx;i<stockhist.timestamp.length;i++){
                for(each_sold in each_stock.holdings){
                    portfolioPerformance.LTP[ts_idx]-=stockhist.close[i]*each_stock.holdings[each_sold].shares;
                    portfolioPerformance.investment_done[ts_idx]-=buff[each_stock.stock_name].price*each_stock.holdings[each_sold].shares;
                }
                ts_idx++;
            }
        }
    }

    for(let i=0;i<portfolioPerformance.timestamp.length;i++){
        portfolioPerformance.percentChange.push(portfolioPerformance.LTP[i]/portfolioPerformance.investment_done[i]);
    }
    console.log(buff);
    fs.writeFileSync(path+'portfolioPerformance.json',JSON.stringify(portfolioPerformance,null,2));
}

/* operation(1,'2021-07-30',"INFY",5,1615.75);
operation(1,'2021-07-30',"WIPRO",10,591);
operation(1,'2021-07-30',"JSWSTEEL",10,752.90);
operation(1,'2021-07-30',"TATASTEEL",5,1463.10);
operation(1,'2021-07-30',"TATAPOWER",30,126.50);
operation(1,'2021-07-30',"ASIANPAINT",1,2981.75);
operation(1,'2021-07-30',"NFL",1,64.20);
operation(1,'2021-07-30',"NFL",19,64.19);
operation(1,'2021-09-24',"JSWSTEEL",5,654.50);
operation(1,'2021-09-24',"TATASTEEL",5,1269.35);
operation(1,'2021-09-24',"BHARTIARTL",10,739.55);
operation(1,'2021-09-24',"ASIANPAINT",1,3446.90);
operation(1,'2021-09-24',"WIPRO",5,681.60);
operation(1,'2021-09-24',"INFY",2,1768.65);
operation(1,'2021-09-27',"TATAPOWER",25,137.25); */



function operation(buy_sell,date,stock,qty,price,path){
    var date=Date.parse(date);
    var i;
    var rd=JSON.parse(fs.readFileSync(path+"/holding.json"));
    if(JSON.stringify(rd)=='{}'){
        rd.daysTraded=[];
        rd.stocksTraded={};
        rd.totalInvested=0;
    }
    if(rd.hasOwnProperty(date)){//if date exists

    }
    else{//if date does not exits
        rd.daysTraded.push(date);
        rd[date]={buy:[],sell:[]};
        rd.daysTraded.sort(function(a, b){return a - b});
    }
    if(!rd.stocksTraded.hasOwnProperty(stock)){
        rd.stocksTraded[stock]={averagePrice:price,shares:qty};
    }
    else{
        if(buy_sell==1){
            rd.stocksTraded[stock].averagePrice=(rd.stocksTraded[stock].averagePrice*
                rd.stocksTraded[stock].shares + qty*price)/(qty+rd.stocksTraded[stock].shares);
            rd.stocksTraded[stock].shares+=qty;
        }
        else{
            rd.stocksTraded[stock].shares-=qty;
        }
    }
    if(buy_sell==1){//if bought
        i=check_stock_already_exists(rd[date].buy,stock);
        if(i!=-1){//if stock already exists
            var temp=rd[date].buy[i];
            temp.holdings.push({price:price,shares:qty});
            temp.price=(temp.price*temp.shares + qty*price)/(temp.shares + qty);
            temp.shares=temp.shares+qty;
        }
        else{//if stock is new
            var store=[];
            store.push({price:price,shares:qty});
            rd[date].buy.push({stock_name:stock,shares:qty,price:price,holdings:store});
        }
        rd.totalInvested+=qty*price;
    }
    else{//if sold
        i=check_stock_already_exists(rd[date].sell,stock);
        if(i!=-1){//if stock already exists for that day
            var temp=rd[date].sell[i];
            temp.holdings.push({price:price,shares:qty});
        }
        else{//if stock is new
            var store=[];
            store.push({price:price,shares:qty});
            rd[date].sell.push({stock_name:stock,holdings:store});
        }
        rd.totalInvested-=qty*rd.stocksTraded[stock].averagePrice;
    }

    if(rd.stocksTraded[stock].shares==0){
        delete rd.stocksTraded[stock];
    }
    fs.writeFileSync(path+'holding.json',JSON.stringify(rd,null,2));
}

app.get("/register", function(request,response){
    var error=request.session.error;
    delete request.session.error;
    response.render("register",{
        err:error
    });
});

app.post("/register", async function(request,response){
    users=JSON.parse(fs.readFileSync('./users.json'))
    var userid=request.body.userid;
    var password=request.body.password;

    if(users.hasOwnProperty(userid)){
        request.session.error=`${userid} is already being used.`;
        response.redirect("/register");
    }
    else{
        var hashedPassword=await bcrypt.hash(password,10);
        users[userid]={userid:userid,password:hashedPassword};
        var dir='./userdb/'+userid+'/'
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        fs.writeFileSync('./users.json',JSON.stringify(users,null,2));
        fs.writeFileSync('./userdb/'+userid+'/holding.json',"{}");
        response.redirect("/");
    }
});

app.get('/',function(request,response){
    var error=request.session.error;
    delete request.session.error;
    response.render("login",{
        err:error
    });
});

app.post('/',async function(request,response){
    users=JSON.parse(fs.readFileSync('./users.json'));
    var userid=request.body.userid;
    var password=request.body.password;

    if(!users.hasOwnProperty(userid)){
        request.session.error="No such userid."
        response.redirect("/")
    }
    else{
        if(await bcrypt.compare(password,users[userid].password)){
            request.session.isAuth=true;
            request.session.key=userid;
            response.redirect("/home");
        }
        else{
            request.session.error="Login Credentials are Wrong.!!";
            response.redirect("/");
        }
    }
});

app.get('/favicon.ico',function(request,response){
    response.sendStatus(204);
});

app.post('/portfolio',isAuth,function(request,response){
    var req=request.body;
    var stock=JSON.parse(fs.readFileSync(request.session.path+"holding.json"));
    if(req.buysell==-1 && !stock.stocksTraded){
        request.session.status={status_code:3,status:"You dont have any stocks purchased."}
    }
    else if(req.buysell==-1 && stock.stocksTraded && !stock.stocksTraded[req.stockname]){
        request.session.status={status_code:2,status:"You dont have any shares of "+req.stockname+"."}
    }
    else if(req.buysell==-1 && stock.stocksTraded[req.stockname].shares<parseInt(req.quantity)){
        request.session.status={status_code:1,status:"You dont have "+req.quantity+" shares of "+req.stockname+"."}
    }
    else{
        request.session.status={status_code:0,status:"Transaction Successful."}
        operation(req.buysell,req.date,req.stockname,parseInt(req.quantity),Number(req.price),request.session.path)
    }
    response.json(request.session.status);
    response.end();
});

app.get('/portfolio',isAuth,function(request,response){
    var holding=[];
    if(request.session.status){
        delete request.session.status;
    }
    var totalInvested=0,currentValue=0;
    var holdingDetail=JSON.parse(fs.readFileSync(request.session.path+"holding.json")).stocksTraded;
    for(each in holdingDetail){
        var stockdetail=JSON.parse(fs.readFileSync("./nse_stocks/"+each+".json"));
        var CLASS;
        var p_n_l=(stockdetail.close[0].toFixed(2)-holdingDetail[each].averagePrice.toFixed(2))
        *holdingDetail[each].shares;
        totalInvested+=holdingDetail[each].averagePrice.toFixed(2)*holdingDetail[each].shares;
        currentValue+=stockdetail.close[0].toFixed(2)*holdingDetail[each].shares;
        if(p_n_l>0){
            CLASS="profit";
        }
        else if(p_n_l<0){
            CLASS="loss";
        }
        else{
            CLASS="nochange";
        }
        holding.push({stock_name:each,
            stock_desc:stockdetail.stock_desc,
            shares: holdingDetail[each].shares,
            averagePrice: holdingDetail[each].averagePrice.toFixed(2),
            lastTradedPrice: stockdetail.close[0].toFixed(2),
            profit_loss:p_n_l.toFixed(2),
            percentChange:(((stockdetail.close[0]/holdingDetail[each].averagePrice)-1)*100).toFixed(2),
            class:CLASS,
            dayChange:((stockdetail.close[0]/stockdetail.close[1]-1)*100).toFixed(2),
            historic:"./nse_stocks/"+each+".json"
        });
    }
    //console.log(totalInvested,currentValue,currentValue-totalInvested,currentValue/totalInvested);
    response.render("index",{
        all:holding
    });
});

app.get('/logout',function(request,response){
    request.session.destroy((err) => {
        if (err) throw err;
        response.redirect("/");
      });
});

app.post('/portfolio/:name',function(request,response){
    var file="./userdb/"+request.session.key+"/holding.json";
    var stock=request.params.name;
    var data=JSON.parse(fs.readFileSync(file));
    var result={};
    for(let i=0;i<data.daysTraded.length;i++){
        var date=data.daysTraded[i];
        var index=check_stock_already_exists(data[date].buy,stock);
        if(index!=-1){
            var temp=data[date].buy[index];
            temp.STATUS="buy";
            result[date]=temp;
        }
        index=check_stock_already_exists(data[date].sell,stock);
        if(index!=-1){
            var temp=data[date].sell[index];
            temp.STATUS="sell";
            result[date]=temp;
        }
    }
    response.json(result);
});

app.post('/home',isAuth,function(request,response){
    var performanceData=JSON.parse(fs.readFileSync(request.session.path+"portfolioPerformance.json"));
    response.json(performanceData);
});

app.get('/home',isAuth,function(request,response){
    creatingPortfolioReturnJSON(request.session.path);
    response.render("home");
});

app.get('/portfolio/:name',isAuth,function(request,response){
    response.render("index");
});

app.get('/all-order',isAuth,function(request,response){
    var holdingDetail=JSON.parse(fs.readFileSync(request.session.path+"holding.json"));
    
    var alldata=[];
    for(each in holdingDetail.daysTraded){
        let date=holdingDetail.daysTraded[each];
        let temp=Object.create(holdingDetail[date]);
        date=new Date(date);
        temp["date"]=date;
        alldata.push(temp);
    }
    response.render("all_order",{
        all:alldata
    });
});

app.listen(port,function(){
    console.log("Connected to 0.0.0.0:"+port);
});

//var axios = require("axios").default;

// var options = {
//   method: 'GET',
//   url: 'https://yfapi.net/v11/finance/quoteSummary/AAPL',
//   params: {modules: 'defaultKeyStatistics,assetProfile'},
//   headers: {
//     'x-api-key': '0ZChsyn8OBhjlI08LQMv4fH1Q5rpcPA7ErwTsHYd'
//   }
// };

// axios.request(options).then(function (response) {
// 	console.log(response.data);
// }).catch(function (error) {
// 	console.error(error);
// });
